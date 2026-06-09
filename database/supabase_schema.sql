-- ==========================================================
-- Supabase 데이터베이스 테이블 스키마 DDL & 타입 마이그레이션 가이드
-- ==========================================================

-- [!] 기존 테이블 데이터 보존하며 id 컬럼 타입을 TEXT로 변경하는 마이그레이션 SQL
-- 만약 chat_rooms.id가 bigint 타입으로 설정되어 있어 'room-닉네임A-닉네임B' 문자열 삽입 시 
-- "invalid input syntax for type bigint" 오류가 발생하는 경우, 아래 주석을 풀고 Supabase SQL Editor에서 실행해 주세요:
/*
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_room_id_fkey;
ALTER TABLE public.chat_rooms ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.chat_messages ALTER COLUMN room_id TYPE TEXT;
ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.chat_rooms(id) ON DELETE CASCADE;
*/


-- 1. 대화방(chat_rooms) 테이블 생성 DDL
-- id 컬럼을 TEXT 타입으로 생성하여 'room-닉네임A-닉네임B' 형태의 문자열 방 ID를 수용할 수 있도록 보장합니다.
CREATE TABLE IF NOT EXISTS public.chat_rooms (
    id TEXT PRIMARY KEY,
    post_id UUID,
    buyer_nickname TEXT NOT NULL,
    seller_nickname TEXT NOT NULL,
    last_message TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Row Level Security) 비활성화
ALTER TABLE IF EXISTS public.chat_rooms DISABLE ROW LEVEL SECURITY;


-- 2. 메시지(chat_messages) 테이블 생성 DDL
-- room_id 컬럼을 TEXT 타입으로 구성하여 chat_rooms.id와의 FK 참조 정합성을 보장합니다.
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id TEXT REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    sender TEXT NOT NULL,
    text TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Row Level Security) 비활성화
ALTER TABLE IF EXISTS public.chat_messages DISABLE ROW LEVEL SECURITY;


-- 3. 댓글(post_comments) 테이블 생성 DDL
CREATE TABLE IF NOT EXISTS public.post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    nickname TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Row Level Security) 비활성화
ALTER TABLE public.post_comments DISABLE ROW LEVEL SECURITY;

-- 3.5 독립 게시판(board_posts) 테이블 생성 DDL
-- 메인 스티커 교환글(posts)과 분리된 공지/자유/드래곤 알 코드 거래 게시판입니다.
CREATE TABLE IF NOT EXISTS public.board_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('notice', 'free', 'egg_code')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    nickname TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS board_posts_type_created_at_idx
    ON public.board_posts(type, created_at DESC);

-- 현재 앱은 Supabase Auth가 아닌 닉네임+비밀번호 커스텀 로그인 구조라
-- 사용자별 DB RLS를 엄격히 적용하기 어렵습니다. 실제 운영 보안 강화를 위해서는
-- Supabase Auth 또는 Edge Function 기반 쓰기 검증으로 전환하는 것을 권장합니다.
ALTER TABLE IF EXISTS public.board_posts DISABLE ROW LEVEL SECURITY;


-- 4. 신고(reports) 테이블 생성 DDL
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_type TEXT NOT NULL, -- 'post' 또는 'comment'
    target_id TEXT NOT NULL,
    reporter TEXT NOT NULL,
    reason TEXT NOT NULL,
    target_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Row Level Security) 비활성화
ALTER TABLE public.reports DISABLE ROW LEVEL SECURITY;


-- 5. Realtime 복제 대상 테이블 활성화
-- Supabase 대시보드에서 실시간 변경사항을 감지할 수 있도록 허용합니다.
-- (만약 이미 등록되어 있으면 무시하거나 에러가 날 수 있으니 대시보드 설정 권장)
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.board_posts;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_rooms;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
