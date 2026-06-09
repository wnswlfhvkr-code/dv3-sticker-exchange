import { supabase, isMock } from '../../supabaseClient';

const BOARD_POSTS_KEY = 'dv3_board_posts';

export const BOARD_TYPES = [
  { id: 'notice', label: '공지 게시판' },
  { id: 'free', label: '자유게시판' },
  { id: 'egg_code', label: '드래곤 알 코드 거래' }
];

const getLocalBoardPosts = () => {
  try {
    return JSON.parse(localStorage.getItem(BOARD_POSTS_KEY)) || [];
  } catch {
    return [];
  }
};

const saveLocalBoardPosts = (posts) => {
  localStorage.setItem(BOARD_POSTS_KEY, JSON.stringify(posts));
  window.dispatchEvent(new Event('dv3_board_update'));
};

const sortBoardPosts = (posts) => {
  return [...posts].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
};

const formatBoardPost = (post) => ({
  id: post.id,
  type: post.type,
  title: post.title,
  content: post.content,
  nickname: post.nickname,
  created_at: post.created_at
});

export const boardService = {
  async fetchPosts(type) {
    if (isMock) {
      return {
        data: sortBoardPosts(getLocalBoardPosts().filter(post => post.type === type)),
        error: null
      };
    }

    try {
      const { data, error } = await supabase
        .from('board_posts')
        .select('*')
        .eq('type', type)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: (data || []).map(formatBoardPost), error: null };
    } catch (error) {
      console.warn('board_posts 조회 실패, 로컬 게시판으로 폴백:', error);
      return {
        data: sortBoardPosts(getLocalBoardPosts().filter(post => post.type === type)),
        error: null
      };
    }
  },

  async createPost({ type, title, content, nickname }) {
    const postData = { type, title, content, nickname };

    if (isMock) {
      const posts = getLocalBoardPosts();
      const newPost = {
        id: `board-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        created_at: new Date().toISOString(),
        ...postData
      };
      posts.push(newPost);
      saveLocalBoardPosts(posts);
      return { data: [newPost], error: null };
    }

    try {
      const { data, error } = await supabase
        .from('board_posts')
        .insert([postData])
        .select();

      if (error) throw error;
      return { data: (data || []).map(formatBoardPost), error: null };
    } catch (error) {
      console.warn('board_posts 등록 실패, 로컬 게시판으로 폴백:', error);
      const posts = getLocalBoardPosts();
      const newPost = {
        id: `board-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        created_at: new Date().toISOString(),
        ...postData
      };
      posts.push(newPost);
      saveLocalBoardPosts(posts);
      return { data: [newPost], error: null };
    }
  },

  async deletePost(id) {
    if (isMock) {
      const posts = getLocalBoardPosts().filter(post => String(post.id) !== String(id));
      saveLocalBoardPosts(posts);
      return { error: null };
    }

    try {
      const { error } = await supabase
        .from('board_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.warn('board_posts 삭제 실패, 로컬 게시판만 정리:', error);
      const posts = getLocalBoardPosts().filter(post => String(post.id) !== String(id));
      saveLocalBoardPosts(posts);
      return { error: null };
    }
  },

  subscribe(type, onUpdate) {
    if (!isMock) {
      const channel = supabase
        .channel(`board-posts-${type}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'board_posts',
            filter: `type=eq.${type}`
          },
          onUpdate
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }

    const handleStorageChange = (e) => {
      if (e.key === BOARD_POSTS_KEY) onUpdate();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('dv3_board_update', onUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('dv3_board_update', onUpdate);
    };
  }
};
