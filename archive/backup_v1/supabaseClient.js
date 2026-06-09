import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Supabase 클라이언트 초기화 시도
let supabase = null;
let isMock = true;

if (supabaseUrl && supabaseAnonKey && supabaseUrl !== "YOUR_SUPABASE_URL") {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    isMock = false;
    console.log("Supabase 연동 완료! 실시간 데이터베이스 모드로 동작합니다.");
  } catch (error) {
    console.error("Supabase 연결 실패, 로컬 모드로 전환합니다:", error);
  }
} else {
  console.log("Supabase 설정이 없습니다. 로컬 브라우저 저장소(LocalStorage) 모드로 동작합니다. 배포 시 .env 설정을 해주세요.");
}

// 로컬 스토리지 기반의 가짜 DB 엔진 (Supabase API와 동일한 인터페이스 모사)
const mockDB = {
  getPosts: async () => {
    const data = localStorage.getItem('dv3_exchange_posts');
    const posts = data ? JSON.parse(data) : [];
    // 생성일 역순 정렬
    return { data: posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)), error: null };
  },
  insertPost: async (newPost) => {
    const data = localStorage.getItem('dv3_exchange_posts');
    const posts = data ? JSON.parse(data) : [];
    const postWithId = {
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      ...newPost
    };
    posts.push(postWithId);
    localStorage.setItem('dv3_exchange_posts', JSON.stringify(posts));
    return { data: [postWithId], error: null };
  },
  deletePost: async (id) => {
    const data = localStorage.getItem('dv3_exchange_posts');
    let posts = data ? JSON.parse(data) : [];
    posts = posts.filter(post => post.id !== id);
    localStorage.setItem('dv3_exchange_posts', JSON.stringify(posts));
    return { error: null };
  }
};

// 서비스 래퍼
export const dbService = {
  isMock,
  fetchPosts: async () => {
    if (!isMock) {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
      return { data, error };
    } else {
      return mockDB.getPosts();
    }
  },
  addPost: async (nickname, contact, haves, wants) => {
    const postData = { nickname, contact, haves, wants };
    if (!isMock) {
      const { data, error } = await supabase
        .from('posts')
        .insert([postData])
        .select();
      return { data, error };
    } else {
      return mockDB.insertPost(postData);
    }
  },
  removePost: async (id) => {
    if (!isMock) {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);
      return { error };
    } else {
      return mockDB.deletePost(id);
    }
  }
};
