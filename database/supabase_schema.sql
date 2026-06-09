-- 1. 댓글(post_comments) 테이블 생성 DDL
CREATE TABLE IF NOT EXISTS public.post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    nickname TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Row Level Security) 설정 해제 또는 단순 접근 허용
ALTER TABLE public.post_comments DISABLE ROW LEVEL SECURITY;

-- 2. 신고(reports) 테이블 생성 DDL
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_type TEXT NOT NULL, -- 'post' 또는 'comment'
    target_id TEXT NOT NULL,
    reporter TEXT NOT NULL,
    reason TEXT NOT NULL,
    target_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS 설정 해제 또는 단순 접근 허용
ALTER TABLE public.reports DISABLE ROW LEVEL SECURITY;

-- 3. 실시간 변경 복제(Realtime) 게시군에 테이블 추가
-- Supabase 대시보드에서 실시간 변경사항을 감지할 수 있도록 허용합니다.
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- 4. 채팅 테이블 RLS 비활성화 (익명 게스트도 실시간 1:1 대화가 가능하도록 처리)
ALTER TABLE IF EXISTS public.chat_rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_messages DISABLE ROW LEVEL SECURITY;

