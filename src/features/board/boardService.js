import { supabase, isMock } from '../../supabaseClient';

const BOARD_POSTS_KEY = 'dv3_board_posts';
const BOARD_COMMENTS_KEY = 'dv3_board_comments';

export const BOARD_TYPES = [
  { id: 'notice', label: '공지 게시판' },
  { id: 'free', label: '자유게시판' },
  { id: 'egg_code', label: '거래 게시판' }
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

const getLocalBoardComments = () => {
  try {
    return JSON.parse(localStorage.getItem(BOARD_COMMENTS_KEY)) || [];
  } catch {
    return [];
  }
};

const saveLocalBoardComments = (comments) => {
  localStorage.setItem(BOARD_COMMENTS_KEY, JSON.stringify(comments));
  window.dispatchEvent(new Event('dv3_board_comments_update'));
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
  created_at: post.created_at,
  commentCount: post.commentCount || 0
});

export const boardService = {
  async fetchPosts(type) {
    if (isMock) {
      const posts = sortBoardPosts(getLocalBoardPosts().filter(post => post.type === type));
      const comments = getLocalBoardComments();
      const mapped = posts.map(post => ({
        ...post,
        commentCount: comments.filter(c => String(c.board_post_id) === String(post.id)).length
      }));
      return { data: mapped, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('board_posts')
        .select('*, board_comments(id)')
        .eq('type', type)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mapped = (data || []).map(post => ({
        ...formatBoardPost(post),
        commentCount: post.board_comments ? post.board_comments.length : 0
      }));
      
      return { data: mapped, error: null };
    } catch (error) {
      console.warn('board_posts 조회 실패, 로컬 게시판으로 폴백:', error);
      const posts = sortBoardPosts(getLocalBoardPosts().filter(post => post.type === type));
      const comments = getLocalBoardComments();
      const mapped = posts.map(post => ({
        ...post,
        commentCount: comments.filter(c => String(c.board_post_id) === String(post.id)).length
      }));
      return { data: mapped, error: null };
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

  async updatePost(id, title, content) {
    if (isMock) {
      const posts = getLocalBoardPosts();
      const idx = posts.findIndex(post => String(post.id) === String(id));
      if (idx !== -1) {
        posts[idx].title = title;
        posts[idx].content = content;
        saveLocalBoardPosts(posts);
        return { data: [posts[idx]], error: null };
      }
      return { data: null, error: new Error('Post not found') };
    }

    try {
      const { data, error } = await supabase
        .from('board_posts')
        .update({ title, content })
        .eq('id', id)
        .select();

      if (error) throw error;
      return { data: (data || []).map(formatBoardPost), error: null };
    } catch (error) {
      console.warn('board_posts 수정 실패, 로컬 게시판만 수정:', error);
      const posts = getLocalBoardPosts();
      const idx = posts.findIndex(post => String(post.id) === String(id));
      if (idx !== -1) {
        posts[idx].title = title;
        posts[idx].content = content;
        saveLocalBoardPosts(posts);
        return { data: [posts[idx]], error: null };
      }
      return { data: null, error: error };
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

  async fetchComments(boardPostId) {
    if (isMock) {
      const allComments = getLocalBoardComments();
      const filtered = allComments.filter(c => String(c.board_post_id) === String(boardPostId));
      return {
        data: filtered.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0)),
        error: null
      };
    }

    try {
      const { data, error } = await supabase
        .from('board_comments')
        .select('*')
        .eq('board_post_id', boardPostId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.warn('board_comments 조회 실패, 로컬로 폴백:', error);
      const allComments = getLocalBoardComments();
      const filtered = allComments.filter(c => String(c.board_post_id) === String(boardPostId));
      return {
        data: filtered.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0)),
        error: null
      };
    }
  },

  async addComment(boardPostId, nickname, text) {
    const commentData = { board_post_id: boardPostId, nickname, text };

    if (isMock) {
      const allComments = getLocalBoardComments();
      const newComment = {
        id: `bcomment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        created_at: new Date().toISOString(),
        ...commentData
      };
      allComments.push(newComment);
      saveLocalBoardComments(allComments);
      return { data: [newComment], error: null };
    }

    try {
      const { data, error } = await supabase
        .from('board_comments')
        .insert([commentData])
        .select();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.warn('board_comments 등록 실패, 로컬로 폴백:', error);
      const allComments = getLocalBoardComments();
      const newComment = {
        id: `bcomment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        created_at: new Date().toISOString(),
        ...commentData
      };
      allComments.push(newComment);
      saveLocalBoardComments(allComments);
      return { data: [newComment], error: null };
    }
  },

  async deleteComment(commentId) {
    if (isMock) {
      const allComments = getLocalBoardComments().filter(c => String(c.id) !== String(commentId));
      saveLocalBoardComments(allComments);
      return { error: null };
    }

    try {
      const { error } = await supabase
        .from('board_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.warn('board_comments 삭제 실패, 로컬만 삭제:', error);
      const allComments = getLocalBoardComments().filter(c => String(c.id) !== String(commentId));
      saveLocalBoardComments(allComments);
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
