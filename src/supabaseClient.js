import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY;

const isProd = import.meta.env.PROD; // 빌드 배포 환경 여부 감지

// 12시간에 1번만 관리자에게 장애 메일을 보내는 헬퍼 함수
export const sendErrorEmail = async (errorMessage) => {
  const lastSent = localStorage.getItem('dv3_error_email_sent');
  const now = Date.now();
  if (lastSent && (now - Number(lastSent) < 12 * 60 * 60 * 1000)) {
    // 12시간 이내에 이미 보냈다면 무한 발송 방지
    return;
  }

  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        access_key: "3051c02c-1aa7-4928-94e8-437046a539c4", // 사용자가 전달한 고유 키
        subject: "[드비3 카드교환소] 서버 에러 발생 알림",
        from_name: "드비3 카드교환소 시스템",
        to_email: "wnsdudvhkr@gmail.com",
        message: `교환소 서버 상태에 이상이 발견되었습니다.\n\n[오류 세부 내용]\n${errorMessage}\n\n사용자 브라우저에서 Supabase 연결이 실패했거나 무료 한도를 초과했을 가능성이 있습니다. 확인해 주세요.`
      })
    });
    if (response.ok) {
      localStorage.setItem('dv3_error_email_sent', now.toString());
      console.log("관리자 이메일로 서버 오류 경보를 발송했습니다.");
    }
  } catch (e) {
    console.error("이메일 경보 발송 실패:", e);
  }
};

// OpenAI API 호출 래퍼 함수 (호출 실패 시 관리자 이메일 전송)
export const callOpenAI = async (messages, options = {}) => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    console.warn("OpenAI API Key가 설정되지 않았습니다.");
    return null;
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: options.model || 'gpt-4o-mini',
        messages,
        temperature: options.temperature ?? 0.7
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API HTTP Error ${response.status}: ${errData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("OpenAI API 호출 실패:", err);
    if (isProd) {
      sendErrorEmail(`OpenAI API 호출 실패: ${err.message || err}`);
    }
    throw err;
  }
};

// Supabase 클라이언트 초기화 시도
let rawSupabase = null;
let isMock = true;

if (supabaseUrl && supabaseAnonKey && supabaseUrl !== "YOUR_SUPABASE_URL" && supabaseUrl !== "undefined" && supabaseAnonKey !== "undefined") {
  try {
    rawSupabase = createClient(supabaseUrl, supabaseAnonKey);
    isMock = false;
    console.log("Supabase 연동 완료! 실시간 데이터베이스 모드로 동작합니다.");
  } catch (error) {
    console.error("Supabase 연결 실패, 로컬 모드로 전환합니다:", error);
    if (isProd) {
      // 실제 배포 서버(프로덕션) 환경인 경우 강제로 mock 모드가 되지 않도록 격리하고 에러를 메일로 통보
      isMock = false;
      sendErrorEmail(`초기 연결 실패: ${error.message || error}`);
    }
  }
} else {
  console.log("Supabase 설정이 없습니다. 로컬 브라우저 저장소(LocalStorage) 모드로 동작합니다. 배포 시 .env 설정을 해주세요.");
  if (isProd) {
    isMock = false;
    sendErrorEmail("초기 설정 오류: Supabase 환경 변수가 설정되지 않았습니다.");
  }
}

// 실제 Supabase 클라이언트 인스턴스를 닉네임/비밀번호별로 캐싱하는 맵
const clientCache = new Map();

function getActiveSupabaseClient() {
  if (isMock || !rawSupabase) return null;

  // 최신 유저 인증 정보 조회
  const nickname = sessionStorage.getItem('dv3_nickname') || localStorage.getItem('dv3_nickname') || '';
  const password = localStorage.getItem('dv3_password') || '';

  const cacheKey = `${nickname}:${password}`;
  if (clientCache.has(cacheKey)) {
    return clientCache.get(cacheKey);
  }

  // Base64 인코딩을 통해 비ASCII 한글 닉네임 깨짐 방지
  const utf8Btoa = (str) => {
    try {
      return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
      }));
    } catch {
      return '';
    }
  };

  const base64Nickname = nickname ? utf8Btoa(nickname) : '';
  const base64Password = password ? utf8Btoa(password) : '';

  const headers = {};
  if (base64Nickname) headers['x-custom-nickname'] = base64Nickname;
  if (base64Password) headers['x-custom-password'] = base64Password;

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers
    }
  });

  clientCache.set(cacheKey, client);
  return client;
}

// Promise 결과를 감시해서 error가 존재하면 이메일을 보내는 헬퍼
function wrapPromiseWithAlert(promise) {
  if (!(promise instanceof Promise)) return promise;

  return promise.then(result => {
    if (result && result.error) {
      const err = result.error;
      const isCritical = err.code || err.status || err.message;
      if (isCritical && isProd) {
        sendErrorEmail(`DB 쿼리 오류 [Code: ${err.code || 'N/A'}] (Status: ${err.status || 'N/A'}): ${err.message}`);
      }
    }
    return result;
  }).catch(err => {
    if (isProd) {
      sendErrorEmail(`DB 네트워크 예외 발생: ${err.message || err}`);
    }
    throw err;
  });
}

// 외부에서 import { supabase } from './supabaseClient' 로 사용하는 객체를 Proxy로 감싸서 동적 포워딩
const supabase = new Proxy({}, {
  get(target, prop) {
    const activeClient = getActiveSupabaseClient();
    if (!activeClient) return undefined;
    const val = activeClient[prop];
    if (typeof val === 'function') {
      return (...args) => {
        const result = val.apply(activeClient, args);
        
        // 최종 실행되는 Promise를 캐치
        if (result && typeof result.then === 'function') {
          return wrapPromiseWithAlert(result);
        }
        
        // Query Builder 체이닝 함수 추적용 프록시
        if (result && typeof result === 'object') {
          return new Proxy(result, {
            get(subTarget, subProp) {
              const subVal = subTarget[subProp];
              if (typeof subVal === 'function') {
                return (...subArgs) => {
                  const subResult = subVal.apply(subTarget, subArgs);
                  if (subResult && typeof subResult.then === 'function') {
                    return wrapPromiseWithAlert(subResult);
                  }
                  return subResult;
                };
              }
              return subVal;
            }
          });
        }
        
        return result;
      };
    }
    return val;
  }
});

// 로컬 스토리지 기반의 가짜 DB 엔진 (Supabase API와 동일한 인터페이스 모사)
const mockDB = {
  getPosts: async () => {
    const data = localStorage.getItem('dv3_exchange_posts');
    const posts = data ? JSON.parse(data) : [];
    
    // 로컬 댓글 카운트 매칭
    const commentsData = localStorage.getItem('dv3_post_comments');
    const comments = commentsData ? JSON.parse(commentsData) : [];
    
    const mapped = posts.map(post => ({
      ...post,
      commentCount: comments.filter(c => c.post_id === post.id).length
    }));
    
    // 생성일 역순 정렬
    return { data: mapped.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)), error: null };
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
  getPostsByNickname: async (nickname) => {
    const data = localStorage.getItem('dv3_exchange_posts');
    const posts = data ? JSON.parse(data) : [];
    const filtered = posts
      .filter(post => post.nickname === nickname)
      .sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    return { data: filtered, error: null };
  },
  deletePost: async (id) => {
    const data = localStorage.getItem('dv3_exchange_posts');
    let posts = data ? JSON.parse(data) : [];
    posts = posts.filter(post => post.id !== id);
    localStorage.setItem('dv3_exchange_posts', JSON.stringify(posts));
    return { error: null };
  },
  deletePosts: async (ids) => {
    const idSet = new Set((ids || []).map(id => String(id)));
    const data = localStorage.getItem('dv3_exchange_posts');
    let posts = data ? JSON.parse(data) : [];
    posts = posts.filter(post => !idSet.has(String(post.id)));
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
  },
  insertBugReport: async (reporter, title, description) => {
    const data = localStorage.getItem('dv3_bug_reports');
    const bugReports = data ? JSON.parse(data) : [];
    const newBug = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      reporter,
      title,
      description,
      created_at: new Date().toISOString()
    };
    bugReports.push(newBug);
    localStorage.setItem('dv3_bug_reports', JSON.stringify(bugReports));
    return { data: [newBug], error: null };
  },
  getBugReports: async () => {
    const data = localStorage.getItem('dv3_bug_reports');
    const bugReports = data ? JSON.parse(data) : [];
    return { data: bugReports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)), error: null };
  },
  deleteBugReport: async (bugId) => {
    const data = localStorage.getItem('dv3_bug_reports');
    let bugReports = data ? JSON.parse(data) : [];
    bugReports = bugReports.filter(b => b.id !== bugId);
    localStorage.setItem('dv3_bug_reports', JSON.stringify(bugReports));
    return { error: null };
  },
  logVisit: async (visitorKey, nickname) => {
    const data = localStorage.getItem('dv3_visit_logs');
    const logs = data ? JSON.parse(data) : [];
    const newLog = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      created_at: new Date().toISOString(),
      visitor_key: visitorKey,
      nickname
    };
    logs.push(newLog);
    localStorage.setItem('dv3_visit_logs', JSON.stringify(logs));
    return { data: newLog, error: null };
  },
  getVisitLogs: async () => {
    const data = localStorage.getItem('dv3_visit_logs');
    const logs = data ? JSON.parse(data) : [];
    return { data: logs, error: null };
  }
};

const safeParseArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    if (typeof val === 'string' && val.trim() !== '') {
      return val.split(',').map(item => {
        const num = Number(item.trim());
        return isNaN(num) ? item.trim() : num;
      });
    }
    return [];
  }
};

// 프론트엔드 Egress 트래픽 절감을 위한 30초 시간 기반 로컬 캐시 시스템
let postsCache = null;
let lastPostsFetchTime = 0;
const CACHE_TTL_MS = 30000; // 30초 캐시 유지

export const clearPostsCache = () => {
  postsCache = null;
  lastPostsFetchTime = 0;
  // console.log("Posts cache cleared due to data mutation.");
};

// 서비스 래퍼
export const dbService = {
  isMock,
  fetchPosts: async () => {
    if (!isMock) {
      const now = Date.now();
      // 캐시가 존재하고 30초 이내인 경우 네트워크 요청 없이 캐시 반환
      if (postsCache && (now - lastPostsFetchTime < CACHE_TTL_MS)) {
        return { data: postsCache, error: null };
      }

      try {
        // post_comments 테이블 조인을 통해 댓글 개수를 함께 쿼리함
        const { data, error } = await supabase
          .from('posts')
          .select('*, post_comments(id)')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const mappedData = (data || []).map(post => ({
          ...post,
          haves: safeParseArray(post.haves),
          wants: safeParseArray(post.wants),
          commentCount: post.post_comments ? post.post_comments.length : 0
        }));
        
        postsCache = mappedData;
        lastPostsFetchTime = now;
        return { data: mappedData, error: null };
      } catch (err) {
        console.warn("posts fetch 조인 실패, 기본 조회 시도:", err);
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false });
        
        const mappedData = (data || []).map(p => ({ 
          ...p, 
          haves: safeParseArray(p.haves),
          wants: safeParseArray(p.wants),
          commentCount: 0 
        }));

        if (!error) {
          postsCache = mappedData;
          lastPostsFetchTime = now;
        }
        return { data: mappedData, error };
      }
    } else {
      return mockDB.getPosts();
    }
  },
  addPost: async (nickname, contact, haves, wants) => {
    clearPostsCache();
    const postData = { 
      nickname, 
      contact, 
      haves: Array.isArray(haves) ? JSON.stringify(haves) : haves, 
      wants: Array.isArray(wants) ? JSON.stringify(wants) : wants 
    };
    if (!isMock) {
      const { data, error } = await supabase
        .from('posts')
        .insert([postData])
        .select();
      
      let parsedData = null;
      if (data && data[0]) {
        parsedData = [{
          ...data[0],
          haves: safeParseArray(data[0].haves),
          wants: safeParseArray(data[0].wants)
        }];
      }
      return { data: parsedData, error };
    } else {
      return mockDB.insertPost({ nickname, contact, haves, wants });
    }
  },
  fetchPostsByNickname: async (nickname) => {
    if (!isMock) {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('nickname', nickname)
        .order('created_at', { ascending: true });
      
      const mappedData = (data || []).map(p => ({
        ...p,
        haves: safeParseArray(p.haves),
        wants: safeParseArray(p.wants)
      }));
      return { data: mappedData, error };
    } else {
      return mockDB.getPostsByNickname(nickname);
    }
  },
  removePost: async (id) => {
    clearPostsCache();
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
  removePosts: async (ids) => {
    clearPostsCache();
    if (!ids || ids.length === 0) return { error: null };
    if (!isMock) {
      const { error } = await supabase
        .from('posts')
        .delete()
        .in('id', ids);
      return { error };
    } else {
      return mockDB.deletePosts(ids);
    }
  },
  bumpPost: async (id) => {
    clearPostsCache();
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
    clearPostsCache();
    const updateData = { 
      contact, 
      haves: Array.isArray(haves) ? JSON.stringify(haves) : haves, 
      wants: Array.isArray(wants) ? JSON.stringify(wants) : wants 
    };
    if (!isMock) {
      const { data, error } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', id)
        .select();
      
      let parsedData = null;
      if (data && data[0]) {
        parsedData = [{
          ...data[0],
          haves: safeParseArray(data[0].haves),
          wants: safeParseArray(data[0].wants)
        }];
      }
      return { data: parsedData, error };
    } else {
      return mockDB.updatePost(id, contact, haves, wants);
    }
  },
  togglePostComplete: async (id, isCompleted) => {
    clearPostsCache();
    if (!isMock) {
      const { data, error } = await supabase
        .from('posts')
        .update({ is_completed: isCompleted })
        .eq('id', id)
        .select();
      return { data, error };
    } else {
      const data = localStorage.getItem('dv3_exchange_posts');
      let posts = data ? JSON.parse(data) : [];
      const idx = posts.findIndex(post => post.id === id);
      if (idx !== -1) {
        posts[idx].is_completed = isCompleted;
        localStorage.setItem('dv3_exchange_posts', JSON.stringify(posts));
        return { data: [posts[idx]], error: null };
      }
      return { data: null, error: new Error('Post not found') };
    }
  },
  fetchComments: async (postId) => {
    if (!isMock) {
      try {
        const { data, error } = await supabase
          .from('post_comments')
          .select('*')
          .eq('post_id', postId)
          .order('created_at', { ascending: true });
        
        if (error) {
          if (error.message?.includes("relation") || error.message?.includes("table") || error.code === 'PGRST116') {
            console.warn("post_comments 테이블이 존재하지 않아 로컬스토리지를 사용합니다.");
            return mockDB.getComments(postId);
          }
          return { data, error };
        }
        return { data, error };
      } catch (err) {
        console.warn("fetchComments 실패, 로컬 폴백:", err);
        return mockDB.getComments(postId);
      }
    } else {
      return mockDB.getComments(postId);
    }
  },
  addComment: async (postId, nickname, text) => {
    if (!isMock) {
      try {
        const { data, error } = await supabase
          .from('post_comments')
          .insert([{ post_id: postId, nickname, text }])
          .select();
        
        if (error) {
          if (error.message?.includes("relation") || error.message?.includes("table") || error.code === 'PGRST116') {
            console.warn("post_comments 테이블이 존재하지 않아 로컬스토리지를 사용합니다.");
            return mockDB.insertComment(postId, nickname, text);
          }
          return { data, error };
        }
        return { data, error };
      } catch (err) {
        console.warn("addComment 실패, 로컬 폴백:", err);
        return mockDB.insertComment(postId, nickname, text);
      }
    } else {
      return mockDB.insertComment(postId, nickname, text);
    }
  },
  removeComment: async (commentId) => {
    if (!isMock) {
      try {
        const { error } = await supabase
          .from('post_comments')
          .delete()
          .eq('id', commentId);
        
        if (error) {
          if (error.message?.includes("relation") || error.message?.includes("table") || error.code === 'PGRST116') {
            console.warn("post_comments 테이블이 존재하지 않아 로컬스토리지를 사용합니다.");
            return mockDB.deleteComment(commentId);
          }
          return { error };
        }
        return { error };
      } catch (err) {
        console.warn("removeComment 실패, 로컬 폴백:", err);
        return mockDB.deleteComment(commentId);
      }
    } else {
      return mockDB.deleteComment(commentId);
    }
  },
  addReport: async (targetType, targetId, reporter, reason, targetDetails) => {
    if (!isMock) {
      try {
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
        
        if (error) {
          if (error.message?.includes("relation") || error.message?.includes("table") || error.code === 'PGRST116') {
            console.warn("reports 테이블이 존재하지 않아 로컬스토리지를 사용합니다.");
            return mockDB.insertReport(targetType, targetId, reporter, reason, targetDetails);
          }
          return { data, error };
        }
        return { data, error };
      } catch (err) {
        console.warn("addReport 실패, 로컬 폴백:", err);
        return mockDB.insertReport(targetType, targetId, reporter, reason, targetDetails);
      }
    } else {
      return mockDB.insertReport(targetType, targetId, reporter, reason, targetDetails);
    }
  },
  fetchReports: async () => {
    if (!isMock) {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          if (error.message?.includes("relation") || error.message?.includes("table") || error.code === 'PGRST116') {
            console.warn("reports 테이블이 존재하지 않아 로컬스토리지를 사용합니다.");
            return mockDB.getReports();
          }
          return { data, error };
        }
        return { data, error };
      } catch (err) {
        console.warn("fetchReports 실패, 로컬 폴백:", err);
        return mockDB.getReports();
      }
    } else {
      return mockDB.getReports();
    }
  },
  resolveReport: async (reportId) => {
    if (!isMock) {
      try {
        const { error } = await supabase
          .from('reports')
          .delete()
          .eq('id', reportId);
        
        if (error) {
          if (error.message?.includes("relation") || error.message?.includes("table") || error.code === 'PGRST116') {
            console.warn("reports 테이블이 존재하지 않아 로컬스토리지를 사용합니다.");
            return mockDB.deleteReport(reportId);
          }
          return { error };
        }
        return { error };
      } catch (err) {
        console.warn("resolveReport 실패, 로컬 폴백:", err);
        return mockDB.deleteReport(reportId);
      }
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
  },
  addBugReport: async (reporter, title, description) => {
    if (!isMock) {
      try {
        const { data, error } = await supabase
          .from('bug_reports')
          .insert([{ reporter, title, description }])
          .select();
        
        if (error) {
          if (error.message?.includes("relation") || error.message?.includes("table") || error.code === 'PGRST116') {
            return mockDB.insertBugReport(reporter, title, description);
          }
          return { data, error };
        }
        return { data, error };
      } catch {
        return mockDB.insertBugReport(reporter, title, description);
      }
    } else {
      return mockDB.insertBugReport(reporter, title, description);
    }
  },
  fetchBugReports: async () => {
    if (!isMock) {
      try {
        const { data, error } = await supabase
          .from('bug_reports')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          if (error.message?.includes("relation") || error.message?.includes("table") || error.code === 'PGRST116') {
            return mockDB.getBugReports();
          }
          return { data, error };
        }
        return { data, error };
      } catch {
        return mockDB.getBugReports();
      }
    } else {
      return mockDB.getBugReports();
    }
  },
  resolveBugReport: async (bugId) => {
    if (!isMock) {
      try {
        const { error } = await supabase
          .from('bug_reports')
          .delete()
          .eq('id', bugId);
        
        if (error) {
          if (error.message?.includes("relation") || error.message?.includes("table") || error.code === 'PGRST116') {
            return mockDB.deleteBugReport(bugId);
          }
          return { error };
        }
        return { error };
      } catch {
        return mockDB.deleteBugReport(bugId);
      }
    } else {
      return mockDB.deleteBugReport(bugId);
    }
  },
  logVisit: async (visitorKey, nickname) => {
    const localDate = new Date();
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    const localVisitedKey = `dv3_visited_today_${todayStr}`;
    
    if (localStorage.getItem(localVisitedKey)) {
      return { data: null, error: null };
    }
    
    const visitData = { visitor_key: visitorKey, nickname };
    
    if (!isMock) {
      try {
        const { data, error } = await supabase
          .from('visit_logs')
          .insert([visitData])
          .select();
        
        if (error) {
          if (error.message?.includes("relation") || error.message?.includes("table") || error.code === 'PGRST116') {
            const res = await mockDB.logVisit(visitorKey, nickname);
            if (!res.error) localStorage.setItem(localVisitedKey, 'true');
            return res;
          }
          return { data, error };
        }
        localStorage.setItem(localVisitedKey, 'true');
        return { data, error: null };
      } catch (err) {
        console.warn("visit_logs 기록 실패, 로컬 폴백:", err);
        const res = await mockDB.logVisit(visitorKey, nickname);
        if (!res.error) localStorage.setItem(localVisitedKey, 'true');
        return res;
      }
    } else {
      const res = await mockDB.logVisit(visitorKey, nickname);
      if (!res.error) localStorage.setItem(localVisitedKey, 'true');
      return res;
    }
  },
  fetchDashboardStats: async () => {
    let isDbFailed = false;
    try {
      let posts = [];
      let visitLogs = [];
      let chatMessages = [];

      if (!isMock) {
        // 실서버 데이터베이스 모드: 순수 DB 데이터로만 집계
        try {
          const { data: postsData, error: postsError } = await supabase.from('posts').select('created_at');
          if (postsError) throw postsError;
          posts = postsData || [];
        } catch (e) {
          console.warn("posts 쿼리 실패:", e);
        }

        try {
          const { data: visitsData, error: visitsError } = await supabase.from('visit_logs').select('*');
          if (visitsError) throw visitsError;
          visitLogs = visitsData || [];
        } catch (e) {
          console.warn("visit_logs 쿼리 실패 (테이블 미생성 시 로컬 폴백):", e);
          isDbFailed = true;
          const res = await mockDB.getVisitLogs();
          visitLogs = res.data || [];
        }

        try {
          const { data: chatsData, error: chatsError } = await supabase.from('chat_messages').select('timestamp');
          if (chatsError) throw chatsError;
          chatMessages = chatsData || [];
        } catch (e) {
          console.warn("chat_messages 쿼리 실패:", e);
        }
      } else {
        // 로컬 모드: 로컬스토리지만 조회
        const postsRaw = localStorage.getItem('dv3_exchange_posts');
        posts = postsRaw ? JSON.parse(postsRaw) : [];

        const logsRes = await mockDB.getVisitLogs();
        visitLogs = logsRes.data || [];

        const chatsRaw = localStorage.getItem('dv3_chat_messages');
        chatMessages = chatsRaw ? JSON.parse(chatsRaw) : [];
      }

      const allVisitorKeys = new Set();
      visitLogs.forEach(log => {
        allVisitorKeys.add(log.visitor_key || log.visitorKey);
      });

      const stats = {
        totalVisits: visitLogs.length,
        totalUniqueVisitors: allVisitorKeys.size,
        totalPosts: posts.length,
        totalMessages: chatMessages.length,
        dailyStats: {}
      };

      const getFormattedDate = (dateStr) => {
        if (!dateStr) return null;
        try {
          const d = new Date(dateStr);
          if (isNaN(d.getTime())) return null;
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        } catch {
          return null;
        }
      };

      const now = new Date();
      for (let i = 0; i < 7; i++) {
        const targetDate = new Date(now);
        targetDate.setDate(now.getDate() - i);
        const dateKey = getFormattedDate(targetDate);
        if (dateKey) {
          stats.dailyStats[dateKey] = {
            date: dateKey,
            visitors: 0,
            visitorKeys: new Set(),
            posts: 0,
            messages: 0
          };
        }
      }

      visitLogs.forEach(log => {
        const dateKey = getFormattedDate(log.created_at || log.createdAt);
        if (dateKey) {
          if (!stats.dailyStats[dateKey]) {
            stats.dailyStats[dateKey] = { date: dateKey, visitors: 0, visitorKeys: new Set(), posts: 0, messages: 0 };
          }
          stats.dailyStats[dateKey].visitorKeys.add(log.visitor_key || log.visitorKey);
        }
      });

      posts.forEach(post => {
        const dateKey = getFormattedDate(post.created_at);
        if (dateKey) {
          if (!stats.dailyStats[dateKey]) {
            stats.dailyStats[dateKey] = { date: dateKey, visitors: 0, visitorKeys: new Set(), posts: 0, messages: 0 };
          }
          stats.dailyStats[dateKey].posts += 1;
        }
      });

      chatMessages.forEach(msg => {
        const dateKey = getFormattedDate(msg.timestamp);
        if (dateKey) {
          if (!stats.dailyStats[dateKey]) {
            stats.dailyStats[dateKey] = { date: dateKey, visitors: 0, visitorKeys: new Set(), posts: 0, messages: 0 };
          }
          stats.dailyStats[dateKey].messages += 1;
        }
      });

      const dailyList = Object.values(stats.dailyStats).map(day => {
        return {
          date: day.date,
          visitors: day.visitorKeys ? day.visitorKeys.size : 0,
          posts: day.posts,
          messages: day.messages
        };
      });

      dailyList.sort((a, b) => new Date(b.date) - new Date(a.date));

      return {
        data: {
          totalVisits: stats.totalVisits,
          totalUniqueVisitors: stats.totalUniqueVisitors,
          totalPosts: stats.totalPosts,
          totalMessages: stats.totalMessages,
          dailyStats: dailyList,
          isDbFailed: isDbFailed
        },
        error: null
      };

    } catch (e) {
      console.error("Dashboard stats aggregation error:", e);
      return { data: null, error: e };
    }
  },
  migrateLocalStorageToSupabase: async () => {
    try {
      console.log("Starting LocalStorage to Supabase Migration...");
      
      // 1. 유저 데이터 이전 (중복 가입 방지 upsert)
      const localUsers = JSON.parse(localStorage.getItem('dv3_users')) || [];
      for (const u of localUsers) {
        try {
          await supabase.from('users').upsert({ nickname: u.nickname, password: u.password }, { onConflict: 'nickname' });
        } catch (e) {
          console.warn(`User ${u.nickname} migration skipped:`, e);
        }
      }
      
      // 2. 게시글 데이터 이전 (중복 방지 upsert)
      const localPosts = JSON.parse(localStorage.getItem('dv3_exchange_posts')) || [];
      for (const p of localPosts) {
        try {
          await supabase.from('posts').upsert({
            id: isNaN(Number(p.id)) ? undefined : Number(p.id),
            nickname: p.nickname,
            contact: p.contact,
            haves: Array.isArray(p.haves) ? JSON.stringify(p.haves) : p.haves,
            wants: Array.isArray(p.wants) ? JSON.stringify(p.wants) : p.wants,
            is_completed: p.is_completed || false,
            created_at: p.created_at
          }, { onConflict: 'id' });
        } catch (e) {
          console.warn(`Post ${p.id} migration skipped:`, e);
        }
      }
      
      // 3. 댓글 데이터 이전 (중복 방지 upsert)
      const localComments = JSON.parse(localStorage.getItem('dv3_post_comments')) || [];
      for (const c of localComments) {
        try {
          await supabase.from('post_comments').upsert({
            id: isNaN(Number(c.id)) ? undefined : Number(c.id),
            post_id: isNaN(Number(c.post_id)) ? undefined : Number(c.post_id),
            nickname: c.nickname,
            text: c.text,
            created_at: c.created_at
          }, { onConflict: 'id' });
        } catch (e) {
          console.warn(`Comment ${c.id} migration skipped:`, e);
        }
      }
      
      // 4. 대화방 데이터 이전 (중복 방지 upsert)
      const localRooms = JSON.parse(localStorage.getItem('dv3_chat_rooms')) || [];
      for (const r of localRooms) {
        try {
          await supabase.from('chat_rooms').upsert({
            id: r.id,
            post_id: isNaN(Number(r.postId)) ? null : Number(r.postId),
            buyer_nickname: r.buyerNickname,
            seller_nickname: r.sellerNickname,
            last_message: r.lastMessage,
            updated_at: r.updatedAt
          }, { onConflict: 'id' });
        } catch (e) {
          console.warn(`Chat room ${r.id} migration skipped:`, e);
        }
      }
      
      // 5. 채팅 메시지 데이터 이전 (중복 방지 upsert)
      const localMessages = JSON.parse(localStorage.getItem('dv3_chat_messages')) || [];
      for (const m of localMessages) {
        try {
          await supabase.from('chat_messages').upsert({
            id: isNaN(Number(m.id)) ? undefined : Number(m.id),
            room_id: m.roomId,
            sender: m.sender,
            text: m.text,
            timestamp: m.timestamp
          }, { onConflict: 'id' });
        } catch (e) {
          console.warn(`Message ${m.id} migration skipped:`, e);
        }
      }

      console.log("Migration completed successfully!");
      return { success: true };
    } catch (err) {
      console.error("Migration failed:", err);
      return { success: false, error: err };
    }
  }
};

export { supabase, isMock };
