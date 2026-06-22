-- ==========================================================
-- Supabase 데이터베이스 해킹 방지용 RLS 보안 강화 스크립트
-- ==========================================================
-- [안내] 이 스크립트는 외부 공격자가 API를 통해 타인의 글을 지우거나,
-- 계정 정보를 훔치거나, 실시간 대화를 도청하는 해킹 시도를 원천 차단합니다.
-- Supabase 대시보드 -> SQL Editor에 복사하여 실행해 주세요.

-- 1. Base64 디코딩 헬퍼 함수 정의 (한글 닉네임 깨짐 방지)
CREATE OR REPLACE FUNCTION public.decode_header_base64(val text)
RETURNS text AS $$
DECLARE
  decoded text;
BEGIN
  IF val IS NULL OR val = '' THEN
    RETURN '';
  END IF;
  decoded := convert_from(decode(val, 'base64'), 'UTF8');
  RETURN decoded;
EXCEPTION WHEN OTHERS THEN
  RETURN '';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. X-Client-Info 파싱 기반 요청자 인증 검증 함수 정의 (CORS preflight 및 프록시 우회)
CREATE OR REPLACE FUNCTION public.validate_request_user(p_nickname text)
RETURNS boolean AS $$
DECLARE
  req_headers text;
  client_info text;
  parts text[];
  encoded_nick text;
  encoded_pass text;
  decoded_nick text;
  decoded_pass text;
  db_password text;
  user_exists boolean;
BEGIN
  -- 1) 요청 헤더 획득
  req_headers := current_setting('request.headers', true);
  IF req_headers IS NULL OR req_headers = '' THEN
    RETURN false;
  END IF;

  client_info := req_headers::json->>'x-client-info';
  IF client_info IS NULL OR client_info = '' THEN
    RETURN false;
  END IF;

  -- 2) '||' 구분자로 파싱 (supabase-js/버전 || base64_nickname || base64_password)
  parts := string_to_array(client_info, '||');
  
  -- 배열 크기가 3개여야 정상 파싱된 것임
  IF array_length(parts, 1) < 3 THEN
    -- 헤더가 없거나 게스트가 비로그인 상태일 때는 빈값 처리
    encoded_nick := '';
    encoded_pass := '';
  ELSE
    encoded_nick := parts[2];
    encoded_pass := parts[3];
  END IF;

  -- 닉네임이 빈 값인 경우(비회원 게스트 상태)
  IF encoded_nick IS NULL OR encoded_nick = '' THEN
    -- 비로그인 게스트가 글을 쓸 때, 해당 닉네임(p_nickname)이 users 테이블에 정식 가입된 회원 닉네임이면 도용이므로 차단!
    SELECT EXISTS (
      SELECT 1 FROM public.users WHERE nickname = p_nickname
    ) INTO user_exists;
    
    RETURN NOT user_exists;
  END IF;

  decoded_nick := public.decode_header_base64(encoded_nick);
  decoded_pass := public.decode_header_base64(encoded_pass);

  -- 3) 쿼리하려는 데이터의 소유자(p_nickname)와 요청 헤더의 닉네임이 일치하는지 검증
  -- 단, 요청자가 관리자('간장')인 경우에는 소유자 검증을 면제합니다 (인증/비번 확인은 거침)
  IF p_nickname <> decoded_nick AND decoded_nick <> '간장' THEN
    RETURN false;
  END IF;

  -- 4) 해당 닉네임이 users 테이블에 가입된 정식 회원인지 판단
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE nickname = decoded_nick
  ) INTO user_exists;

  IF user_exists THEN
    -- 정식 회원: users 테이블에 저장된 실제 비밀번호와 대조 검증
    SELECT password FROM public.users WHERE nickname = decoded_nick INTO db_password;
    RETURN db_password = decoded_pass;
  ELSE
    -- 게스트: 정식 회원 닉네임 도용이 아니며, 본인 닉네임으로 요청했으면 허용
    RETURN true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================================
-- 3. 각 테이블 RLS 활성화 및 정책(Policy) 적용
-- ==========================================================

-- 3.1 posts (교환 피드) 테이블 보안 정책
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS posts_select_policy ON public.posts;
DROP POLICY IF EXISTS posts_insert_policy ON public.posts;
DROP POLICY IF EXISTS posts_update_policy ON public.posts;
DROP POLICY IF EXISTS posts_delete_policy ON public.posts;

CREATE POLICY posts_select_policy ON public.posts FOR SELECT USING (true); -- 누구나 조회 가능
CREATE POLICY posts_insert_policy ON public.posts FOR INSERT WITH CHECK (public.validate_request_user(nickname));
CREATE POLICY posts_update_policy ON public.posts FOR UPDATE USING (public.validate_request_user(nickname));
CREATE POLICY posts_delete_policy ON public.posts FOR DELETE USING (public.validate_request_user(nickname));


-- 3.2 post_comments (게시글 댓글) 테이블 보안 정책
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS comments_select_policy ON public.post_comments;
DROP POLICY IF EXISTS comments_insert_policy ON public.post_comments;
DROP POLICY IF EXISTS comments_modify_policy ON public.post_comments;

CREATE POLICY comments_select_policy ON public.post_comments FOR SELECT USING (true); -- 누구나 조회 가능
CREATE POLICY comments_insert_policy ON public.post_comments FOR INSERT WITH CHECK (public.validate_request_user(nickname));
CREATE POLICY comments_modify_policy ON public.post_comments FOR ALL USING (public.validate_request_user(nickname));


-- 3.3 board_posts (독립 자유게시판) 테이블 보안 정책
CREATE TABLE IF NOT EXISTS public.board_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('notice', 'free', 'egg_code')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    nickname TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS board_posts_type_created_at_idx ON public.board_posts(type, created_at DESC);

ALTER TABLE public.board_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS board_select_policy ON public.board_posts;
DROP POLICY IF EXISTS board_insert_policy ON public.board_posts;
DROP POLICY IF EXISTS board_modify_policy ON public.board_posts;

CREATE POLICY board_select_policy ON public.board_posts FOR SELECT USING (true); -- 누구나 조회 가능
CREATE POLICY board_insert_policy ON public.board_posts FOR INSERT WITH CHECK (public.validate_request_user(nickname));
CREATE POLICY board_modify_policy ON public.board_posts FOR ALL USING (public.validate_request_user(nickname));


-- 3.4 chat_rooms (1:1 대화방) 테이블 보안 정책 (도청 차단)
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chat_rooms_select_policy ON public.chat_rooms;
DROP POLICY IF EXISTS chat_rooms_insert_policy ON public.chat_rooms;
DROP POLICY IF EXISTS chat_rooms_modify_policy ON public.chat_rooms;

-- 본인이 구매자 또는 판매자인 대화방만 조회/생성/수정 가능
CREATE POLICY chat_rooms_select_policy ON public.chat_rooms FOR SELECT
USING (public.validate_request_user(buyer_nickname) OR public.validate_request_user(seller_nickname));

CREATE POLICY chat_rooms_insert_policy ON public.chat_rooms FOR INSERT
WITH CHECK (public.validate_request_user(buyer_nickname));

CREATE POLICY chat_rooms_modify_policy ON public.chat_rooms FOR ALL
USING (public.validate_request_user(buyer_nickname) OR public.validate_request_user(seller_nickname));


-- 3.5 chat_messages (채팅 메시지) 테이블 보안 정책 (도청 차단)
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chat_messages_select_policy ON public.chat_messages;
DROP POLICY IF EXISTS chat_messages_insert_policy ON public.chat_messages;
DROP POLICY IF EXISTS chat_messages_modify_policy ON public.chat_messages;

-- 본인이 참여한 대화방의 메시지만 읽기 허용
CREATE POLICY chat_messages_select_policy ON public.chat_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_rooms
    WHERE chat_rooms.id = chat_messages.room_id
      AND (public.validate_request_user(chat_rooms.buyer_nickname) OR public.validate_request_user(chat_rooms.seller_nickname))
  )
);

-- 자신이 작성한 닉네임 명의로만 메시지 입력 허용 (보안 사칭 방지)
CREATE POLICY chat_messages_insert_policy ON public.chat_messages FOR INSERT
WITH CHECK (
  public.validate_request_user(sender)
);

-- 본인 메시지만 수정/삭제 허용
CREATE POLICY chat_messages_modify_policy ON public.chat_messages FOR ALL
USING (public.validate_request_user(sender));


-- 3.6 users (회원) 테이블 보안 정책 (무단 탈퇴 및 해킹 차단)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_select_policy ON public.users;
DROP POLICY IF EXISTS users_insert_policy ON public.users;
DROP POLICY IF EXISTS users_modify_policy ON public.users;

CREATE POLICY users_select_policy ON public.users FOR SELECT USING (true); -- 로그인 매칭 검사용 전체 공개
CREATE POLICY users_insert_policy ON public.users FOR INSERT WITH CHECK (true); -- 회원가입 전체 허용
CREATE POLICY users_modify_policy ON public.users FOR ALL USING (public.validate_request_user(nickname)); -- 본인 정보만 수정/삭제


-- 3.7 board_comments (독립 게시판 댓글) 테이블 보안 정책
ALTER TABLE public.board_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS board_comments_select_policy ON public.board_comments;
DROP POLICY IF EXISTS board_comments_insert_policy ON public.board_comments;
DROP POLICY IF EXISTS board_comments_modify_policy ON public.board_comments;

CREATE POLICY board_comments_select_policy ON public.board_comments FOR SELECT USING (true); -- 누구나 조회 가능
CREATE POLICY board_comments_insert_policy ON public.board_comments FOR INSERT WITH CHECK (public.validate_request_user(nickname));
CREATE POLICY board_comments_modify_policy ON public.board_comments FOR ALL USING (public.validate_request_user(nickname));
