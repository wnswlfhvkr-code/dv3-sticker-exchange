import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY;

// Supabase 클라이언트 초기화 시도
let supabase = null;
let isMock = true;

if (supabaseUrl && supabaseAnonKey && supabaseUrl !== "YOUR_SUPABASE_URL" && supabaseUrl !== "undefined" && supabaseAnonKey !== "undefined") {
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
  },
  bumpPost: async (id) => {
    const data = localStorage.getItem('dv3_exchange_posts');
    let posts = data ? JSON.parse(data) : [];
    const idx = posts.findIndex(post => post.id === id);
    if (idx !== -1) {
      posts[idx].created_at = new Date().toISOString();
      localStorage.setItem('dv3_exchange_posts', JSON.stringify(posts));
    }
    return { error: null };
  },
  updatePost: async (id, contact, haves, wants) => {
    const data = localStorage.getItem('dv3_exchange_posts');
    let posts = data ? JSON.parse(data) : [];
    const idx = posts.findIndex(post => post.id === id);
    if (idx !== -1) {
      posts[idx].contact = contact;
      posts[idx].haves = haves;
      posts[idx].wants = wants;
      localStorage.setItem('dv3_exchange_posts', JSON.stringify(posts));
      return { data: [posts[idx]], error: null };
    }
    return { data: null, error: new Error('Post not found') };
  },
  getComments: async (postId) => {
    const data = localStorage.getItem('dv3_post_comments');
    const comments = data ? JSON.parse(data) : [];
    const filtered = comments.filter(c => c.post_id === postId);
    return { data: filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)), error: null };
  },
  insertComment: async (postId, nickname, text) => {
    const data = localStorage.getItem('dv3_post_comments');
    const comments = data ? JSON.parse(data) : [];
    const newComment = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      post_id: postId,
      nickname,
      text,
      created_at: new Date().toISOString()
    };
    comments.push(newComment);
    localStorage.setItem('dv3_post_comments', JSON.stringify(comments));
    return { data: [newComment], error: null };
  },
  deleteComment: async (commentId) => {
    const data = localStorage.getItem('dv3_post_comments');
    let comments = data ? JSON.parse(data) : [];
    comments = comments.filter(c => c.id !== commentId);
    localStorage.setItem('dv3_post_comments', JSON.stringify(comments));
    return { error: null };
  },
  insertReport: async (targetType, targetId, reporter, reason, targetDetails) => {
    const data = localStorage.getItem('dv3_reports');
    const reports = data ? JSON.parse(data) : [];
    const newReport = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      target_type: targetType,
      target_id: String(targetId),
      reporter,
      reason,
      target_details: targetDetails,
      created_at: new Date().toISOString()
    };
    reports.push(newReport);
    localStorage.setItem('dv3_reports', JSON.stringify(reports));
    return { data: [newReport], error: null };
  },
  getReports: async () => {
    const data = localStorage.getItem('dv3_reports');
    const reports = data ? JSON.parse(data) : [];
    return { data: reports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)), error: null };
  },
  deleteReport: async (reportId) => {
    const data = localStorage.getItem('dv3_reports');
    let reports = data ? JSON.parse(data) : [];
    reports = reports.filter(r => r.id !== reportId);
    localStorage.setItem('dv3_reports', JSON.stringify(reports));
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
  },
  bumpPost: async (id) => {
    if (!isMock) {
      const { error } = await supabase
        .from('posts')
        .update({ created_at: new Date().toISOString() })
        .eq('id', id);
      return { error };
    } else {
      return mockDB.bumpPost(id);
    }
  },
  updatePost: async (id, contact, haves, wants) => {
    if (!isMock) {
      const { data, error } = await supabase
        .from('posts')
        .update({ contact, haves, wants })
        .eq('id', id)
        .select();
      return { data, error };
    } else {
      return mockDB.updatePost(id, contact, haves, wants);
    }
  },
  fetchComments: async (postId) => {
    if (!isMock) {
      const { data, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      return { data, error };
    } else {
      return mockDB.getComments(postId);
    }
  },
  addComment: async (postId, nickname, text) => {
    if (!isMock) {
      const { data, error } = await supabase
        .from('post_comments')
        .insert([{ post_id: postId, nickname, text }])
        .select();
      return { data, error };
    } else {
      return mockDB.insertComment(postId, nickname, text);
    }
  },
  removeComment: async (commentId) => {
    if (!isMock) {
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId);
      return { error };
    } else {
      return mockDB.deleteComment(commentId);
    }
  },
  addReport: async (targetType, targetId, reporter, reason, targetDetails) => {
    if (!isMock) {
      const { data, error } = await supabase
        .from('reports')
        .insert([{
          target_type: targetType,
          target_id: String(targetId),
          reporter,
          reason,
          target_details: targetDetails
        }])
        .select();
      return { data, error };
    } else {
      return mockDB.insertReport(targetType, targetId, reporter, reason, targetDetails);
    }
  },
  fetchReports: async () => {
    if (!isMock) {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });
      return { data, error };
    } else {
      return mockDB.getReports();
    }
  },
  resolveReport: async (reportId) => {
    if (!isMock) {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId);
      return { error };
    } else {
      return mockDB.deleteReport(reportId);
    }
  },
  verifyUser: async (nickname, password) => {
    if (!isMock) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('nickname', nickname)
          .maybeSingle(); // single() 대신 maybeSingle()로 데이터 부재 시 오류 방지
        if (error) return { user: null, exists: false, error };
        if (!data) return { user: null, exists: false, error: null };
        return { user: data, exists: true, isMatch: data.password === password, error: null };
      } catch (err) {
        return { user: null, exists: false, error: err };
      }
    } else {
      const users = JSON.parse(localStorage.getItem('dv3_users')) || [];
      const user = users.find(u => u.nickname === nickname);
      if (!user) {
        return { user: null, exists: false, error: null };
      }
      return { user, exists: true, isMatch: user.password === password, error: null };
    }
  },
  registerUser: async (nickname, password) => {
    if (!isMock) {
      try {
        const { data, error } = await supabase
          .from('users')
          .insert([{ nickname, password }])
          .select()
          .maybeSingle();
        return { data, error };
      } catch (err) {
        return { data: null, error: err };
      }
    } else {
      const users = JSON.parse(localStorage.getItem('dv3_users')) || [];
      const newUser = { nickname, password };
      users.push(newUser);
      localStorage.setItem('dv3_users', JSON.stringify(users));
      return { data: newUser, error: null };
    }
  }
};

export { supabase, isMock };
