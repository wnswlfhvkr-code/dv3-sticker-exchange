import { useEffect, useState } from 'react';
import { sanitizeInput, decodeHTML } from '../../utils/security';
import { boardService } from './boardService';

export function useBoardViewModel({ userNickname, activeType }) {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  // --- 게시판 수정 관련 상태 ---
  const [editingPostId, setEditingPostId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // --- 게시판 댓글 관련 상태 ---
  const [comments, setComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [expandedComments, setExpandedComments] = useState({});

  const loadPosts = async () => {
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

    const unsubscribe = boardService.subscribe(activeType, loadPosts);
    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, [activeType]);

  // --- 글 쓰기 임시 저장 (Draft Auto-save) 로직 ---
  useEffect(() => {
    const savedTitle = localStorage.getItem(`dv3_draft_title_${activeType}`) || '';
    const savedContent = localStorage.getItem(`dv3_draft_content_${activeType}`) || '';
    setTitle(savedTitle);
    setContent(savedContent);
  }, [activeType]);

  useEffect(() => {
    if (title) {
      localStorage.setItem(`dv3_draft_title_${activeType}`, title);
    } else {
      localStorage.removeItem(`dv3_draft_title_${activeType}`);
    }
  }, [title, activeType]);

  useEffect(() => {
    if (content) {
      localStorage.setItem(`dv3_draft_content_${activeType}`, content);
    } else {
      localStorage.removeItem(`dv3_draft_content_${activeType}`);
    }
  }, [content, activeType]);

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

  // --- 글 수정 핸들러 ---
  const handleOpenEditBoard = (post) => {
    setEditingPostId(post.id);
    setEditTitle(decodeHTML(post.title || ''));
    setEditContent(decodeHTML(post.content || ''));
  };

  const handleCancelEditBoard = () => {
    setEditingPostId(null);
    setEditTitle('');
    setEditContent('');
  };

  const handleUpdateBoardPost = async (postId) => {
    if (!editTitle.trim() || !editContent.trim()) {
      alert('제목과 내용을 입력해 주세요.');
      return;
    }

    const { error } = await boardService.updatePost(
      postId,
      sanitizeInput(editTitle.trim()),
      sanitizeInput(editContent.trim())
    );

    if (error) {
      alert('게시글 수정 실패: ' + error.message);
      return;
    }

    setEditingPostId(null);
    setEditTitle('');
    setEditContent('');
    await loadPosts();
  };

  // --- 댓글 핸들러 ---
  const loadBoardComments = async (postId) => {
    const { data, error } = await boardService.fetchComments(postId);
    if (!error) {
      setComments(prev => ({ ...prev, [postId]: data || [] }));
    }
  };

  const toggleBoardComments = async (postId) => {
    const isExpanded = !expandedComments[postId];
    setExpandedComments(prev => ({ ...prev, [postId]: isExpanded }));
    if (isExpanded) {
      await loadBoardComments(postId);
    }
  };

  const handleAddBoardComment = async (e, postId) => {
    if (e && e.preventDefault) e.preventDefault();
    const commentText = commentInputs[postId] || '';
    if (!commentText.trim()) return;

    if (!userNickname) {
      alert('로그인 후 댓글을 작성할 수 있습니다.');
      return;
    }

    const { error } = await boardService.addComment(
      postId,
      userNickname,
      sanitizeInput(commentText.trim())
    );

    if (!error) {
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      await loadBoardComments(postId);
      // 댓글 카운트 갱신을 위해 포스트 리로드
      await loadPosts();
    } else {
      alert('댓글 등록 실패: ' + error.message);
    }
  };

  const handleDeleteBoardComment = async (commentId, postId) => {
    if (!window.confirm('정말 이 댓글을 삭제하시겠습니까?')) return;

    const { error } = await boardService.deleteComment(commentId);
    if (!error) {
      await loadBoardComments(postId);
      await loadPosts();
    } else {
      alert('댓글 삭제 실패: ' + error.message);
    }
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
    deletePost,

    // 수정 관련
    editingPostId,
    editTitle,
    setEditTitle,
    editContent,
    setEditContent,
    handleOpenEditBoard,
    handleCancelEditBoard,
    handleUpdateBoardPost,

    // 댓글 관련
    comments,
    commentInputs,
    setCommentInputs,
    expandedComments,
    toggleBoardComments,
    handleAddBoardComment,
    handleDeleteBoardComment
  };
}
