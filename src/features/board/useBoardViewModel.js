import { useEffect, useState } from 'react';
import { sanitizeInput } from '../../utils/security';
import { boardService } from './boardService';

export function useBoardViewModel({ userNickname, activeType }) {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const loadPosts = async () => {
    if (!userNickname) {
      setPosts([]);
      return;
    }

    setLoading(true);
    const { data, error } = await boardService.fetchPosts(activeType);
    if (!error) {
      setPosts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadPosts();
    }, 0);
    if (!userNickname) {
      return () => window.clearTimeout(timer);
    }

    const unsubscribe = boardService.subscribe(activeType, loadPosts);
    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, [activeType, userNickname]);

  const createPost = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!userNickname) {
      alert('게시판은 로그인 후 이용할 수 있습니다.');
      return;
    }
    if (activeType === 'notice' && userNickname !== '간장') {
      alert('공지 게시글은 관리자만 작성할 수 있습니다.');
      return;
    }
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 입력해 주세요.');
      return;
    }

    const { error } = await boardService.createPost({
      type: activeType,
      title: sanitizeInput(title.trim()),
      content: sanitizeInput(content.trim()),
      nickname: userNickname
    });

    if (error) {
      alert('게시글 등록 실패: ' + error.message);
      return;
    }

    setTitle('');
    setContent('');
    await loadPosts();
  };

  const deletePost = async (post) => {
    if (!post) return;
    if (post.nickname !== userNickname && userNickname !== '간장') {
      alert('본인이 작성한 게시글만 삭제할 수 있습니다.');
      return;
    }
    if (!window.confirm('게시글을 삭제하시겠습니까?')) return;

    const { error } = await boardService.deletePost(post.id);
    if (error) {
      alert('게시글 삭제 실패: ' + error.message);
      return;
    }
    await loadPosts();
  };

  return {
    posts,
    title,
    setTitle,
    content,
    setContent,
    loading,
    loadPosts,
    createPost,
    deletePost
  };
}
