/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { dbService, supabase, isMock } from '../../supabaseClient';
import { stickersData } from '../../stickersData';
import { sanitizeInput, decodeHTML, detectBannedWord } from '../../utils/security';

export function usePostViewModel({ userNickname, myHaves, myWants, setMyHaves, setMyWants }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 내가 작성한 글 ID 목록 (삭제 권한용)
  const [myPostIds, setMyPostIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('dv3_my_post_ids')) || [];
    } catch {
      return [];
    }
  });

  // 연락처 정보
  const [myContact, setMyContact] = useState(() => localStorage.getItem('dv3_my_contact') || '');

  // 모달 열림 여부
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMyInfoOpen, setIsMyInfoOpen] = useState(false);

  // 피드 목록 상세 정보 아코디언 상태
  const [expandedPostIds, setExpandedPostIds] = useState([]);

  // --- 글 수정 관련 상태 ---
  const [editingPost, setEditingPost] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editContact, setEditContact] = useState('');
  const [editHaves, setEditHaves] = useState([]);
  const [editWants, setEditWants] = useState([]);
  const [editBasketMode, setEditBasketMode] = useState('haves');
  const [editCurrentCategoryId, setEditCurrentCategoryId] = useState(1);

  // --- 댓글 관련 상태 ---
  const [comments, setComments] = useState({}); // { [postId]: [comments...] }
  const [commentInputs, setCommentInputs] = useState({}); // { [postId]: '댓글텍스트' }
  const [expandedComments, setExpandedComments] = useState({}); // { [postId]: true/false }

  // --- 신고 관련 상태 ---
  const [reportingTarget, setReportingTarget] = useState(null); // { type, id, details }
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('허위 정보 / 거짓 매칭');
  const [reportCustomReason, setReportCustomReason] = useState('');

  // 연락처 로컬스토리지 자동 연동
  useEffect(() => {
    localStorage.setItem('dv3_my_contact', myContact);
  }, [myContact]);

  const togglePostExpand = (postId) => {
    if (expandedPostIds.includes(postId)) {
      setExpandedPostIds(expandedPostIds.filter(id => id !== postId));
    } else {
      setExpandedPostIds([...expandedPostIds, postId]);
    }
  };

  // --- 핵심 데이터 핸들러 ---
  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await dbService.fetchPosts();
    if (!error) {
      setPosts(data || []);
    }
    setLoading(false);
  };

  const fetchDataSilent = async () => {
    const { data, error } = await dbService.fetchPosts();
    if (!error) {
      setPosts(data || []);
    }
  };

  // 최초 로드
  // 최초 로드 및 실시간 피드 업데이트 구독 바인딩
  useEffect(() => {
    // 초기 피드 로드
    fetchData();

    if (!isMock) {
      // Supabase Realtime 채널을 활성화하여 글 추가/삭제/수정 시 백그라운드 갱신
      const channel = supabase
        .channel('realtime-posts-feed')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'posts'
          },
          () => {
            fetchDataSilent();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      // 로컬스토리지 및 커스텀 이벤트를 감지하여 탭/컴포넌트 간 즉시 동기화
      const handleStorageChange = (e) => {
        if (e.key === 'dv3_exchange_posts') {
          fetchDataSilent();
        }
      };
      const handleExchangeUpdate = () => {
        fetchDataSilent();
      };

      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('dv3_exchange_update', handleExchangeUpdate);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('dv3_exchange_update', handleExchangeUpdate);
      };
    }
  }, []);

  // 도감에서 직접 바구니를 바꿨을 때 DB 실시간 동기화
  const updatePostStickersDirectly = async (postId, updatedHaves, updatedWants) => {
    const targetPost = posts.find(p => p.id === postId);
    const contactInfo = targetPost ? targetPost.contact : myContact;
    const { error } = await dbService.updatePost(postId, contactInfo, updatedHaves, updatedWants);
    if (!error) {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, contact: contactInfo, haves: updatedHaves, wants: updatedWants } : p));
      window.dispatchEvent(new Event('dv3_exchange_update'));
    }
  };

  const handleSubmitPost = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!userNickname) {
      alert("로그인이 필요합니다!");
      return;
    }
    if (myHaves.length === 0 && myWants.length === 0) {
      alert("보유 중인 카드나 필요한 카드를 최소 한 개 이상 지정해 주세요!");
      return;
    }

    const bannedWord = detectBannedWord(myContact);
    if (bannedWord) {
      alert(`커뮤니티 이용규칙 준수를 위해 금전 거래 유도 단어 및 금칙어(예: ${bannedWord})는 연락처 정보에 포함할 수 없습니다.`);
      return;
    }

    const sanitizedContact = sanitizeInput(myContact);
    let removedPostIds = [];

    const { data: existingPosts, error: existingError } = await dbService.fetchPostsByNickname(userNickname);
    if (existingError) {
      alert("기존 교환글 확인에 실패했습니다: " + existingError.message);
      return;
    }

    const sortedMyPosts = [...(existingPosts || [])]
      .sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));

    if (sortedMyPosts.length >= 3) {
      const deleteCount = sortedMyPosts.length - 2;
      const postsToDelete = sortedMyPosts.slice(0, deleteCount);
      const confirmed = window.confirm(
        `교환 등록글은 계정당 최대 3개까지만 유지됩니다.\n` +
        `새 글을 등록하려면 가장 오래된 글 ${deleteCount}개를 삭제해야 합니다.\n\n` +
        `삭제 후 새 글을 등록하시겠습니까?`
      );

      if (!confirmed) return;

      removedPostIds = postsToDelete.map(post => post.id);
      const { error: deleteOldError } = await dbService.removePosts(removedPostIds);
      if (deleteOldError) {
        alert("오래된 교환글 삭제에 실패해 새 글 등록을 중단했습니다: " + deleteOldError.message);
        return;
      }
    }

    const { data, error } = await dbService.addPost(
      userNickname,
      sanitizedContact,
      myHaves,
      myWants
    );

    if (error) {
      alert("게시글 등록에 실패했습니다: " + error.message);
    } else {
      if (data && data[0]) {
        const removedIdSet = new Set(removedPostIds.map(id => String(id)));
        const newPostIds = [
          ...myPostIds.filter(id => !removedIdSet.has(String(id))),
          data[0].id
        ];
        setMyPostIds(newPostIds);
        localStorage.setItem('dv3_my_post_ids', JSON.stringify(newPostIds));
      }
      alert("교환 등록이 완료되었습니다!");
      fetchData();
      setIsFormOpen(false);
      window.dispatchEvent(new Event('dv3_exchange_update'));
    }
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm("정말 이 교환 등록글을 삭제하시겠습니까?")) return;
    const { error } = await dbService.removePost(id);
    if (!error) {
      const updated = myPostIds.filter(postId => postId !== id);
      setMyPostIds(updated);
      localStorage.setItem('dv3_my_post_ids', JSON.stringify(updated));
      fetchData();
      window.dispatchEvent(new Event('dv3_exchange_update'));
    } else {
      alert("삭제 실패: " + error.message);
    }
  };

  const handleBumpPost = async (id) => {
    const { error } = await dbService.bumpPost(id);
    if (!error) {
      alert("글을 맨 위로 끌어올렸습니다!");
      fetchData();
      window.dispatchEvent(new Event('dv3_exchange_update'));
    } else {
      alert("끌어올리기 실패: " + error.message);
    }
  };

  const handleTogglePostComplete = async (postId, currentStatus) => {
    const nextStatus = !currentStatus;
    const { error } = await dbService.togglePostComplete(postId, nextStatus);
    if (!error) {
      alert(nextStatus ? "거래 완료 상태로 변경되었습니다." : "거래 가능 상태로 복구되었습니다.");
      fetchData();
      window.dispatchEvent(new Event('dv3_exchange_update'));
    } else {
      alert("상태 변경 실패: " + error.message);
    }
  };

  // --- 글 수정 핸들러 ---
  const handleOpenEditModal = (post) => {
    setEditingPost(post);
    setEditContact(decodeHTML(post.contact || ''));
    setEditHaves(post.haves || []);
    setEditWants(post.wants || []);
    setEditBasketMode('haves');
    setEditCurrentCategoryId(1);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingPost(null);
  };

  const handleUpdatePost = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!editingPost) return;

    const bannedWord = detectBannedWord(editContact);
    if (bannedWord) {
      alert(`커뮤니티 이용규칙 준수를 위해 금전 거래 유도 단어 및 금칙어(예: ${bannedWord})는 연락처 정보에 포함할 수 없습니다.`);
      return;
    }

    const sanitizedEditContact = sanitizeInput(editContact);
    const { error } = await dbService.updatePost(editingPost.id, sanitizedEditContact, editHaves, editWants);
    if (!error) {
      alert("성공적으로 글이 수정되었습니다!");
      if (setMyHaves && setMyWants) {
        setMyHaves(editHaves);
        setMyWants(editWants);
        localStorage.setItem('dv3_my_haves', JSON.stringify(editHaves));
        localStorage.setItem('dv3_my_wants', JSON.stringify(editWants));
      }
      setIsEditModalOpen(false);
      setEditingPost(null);
      fetchData();
      window.dispatchEvent(new Event('dv3_exchange_update'));
    } else {
      alert("글 수정 실패: " + error.message);
    }
  };

  // --- 양방향 매칭 계산 엔진 ---
  const checkMatching = (post) => {
    const postHaves = post.haves || [];
    const postWants = post.wants || [];

    const myWantsMatch = (myWants || []).filter(id => postHaves.includes(id));
    const myHavesMatch = (myHaves || []).filter(id => postWants.includes(id));

    const isPerfectMatch = myWantsMatch.length > 0 && myHavesMatch.length > 0;
    const isPartialMatch = !isPerfectMatch && (myWantsMatch.length > 0 || myHavesMatch.length > 0);

    return {
      isPerfectMatch,
      isPartialMatch,
      myWantsMatch,
      myHavesMatch
    };
  };

  const toggleEditStickerSelection = (stickerId, targetMode) => {
    const sticker = stickersData.find(s => s.id === stickerId);
    if (sticker && sticker.isGolden) return; // 황금테두리는 교환불가이므로 등록 차단

    const mode = targetMode || editBasketMode;
    if (mode === 'haves') {
      if (editHaves.includes(stickerId)) {
        setEditHaves(editHaves.filter(id => id !== stickerId));
      } else {
        setEditHaves([...editHaves, stickerId]);
        setEditWants(editWants.filter(id => id !== stickerId));
      }
    } else {
      if (editWants.includes(stickerId)) {
        setEditWants(editWants.filter(id => id !== stickerId));
      } else {
        setEditWants([...editWants, stickerId]);
        setEditHaves(editHaves.filter(id => id !== stickerId));
      }
    }
  };

  // --- 댓글 핸들러 ---
  const loadComments = async (postId) => {
    const { data, error } = await dbService.fetchComments(postId);
    if (!error) {
      setComments(prev => ({ ...prev, [postId]: data || [] }));
    }
  };

  const toggleComments = async (postId) => {
    const isExpanded = !expandedComments[postId];
    setExpandedComments(prev => ({ ...prev, [postId]: isExpanded }));
    if (isExpanded) {
      await loadComments(postId);
    }
  };

  const handleAddComment = async (e, postId) => {
    if (e && e.preventDefault) e.preventDefault();
    const commentText = commentInputs[postId] || '';
    if (!commentText.trim()) return;
    if (!userNickname) {
      alert("로그인 후 댓글을 작성할 수 있습니다.");
      return;
    }
    const sanitizedComment = sanitizeInput(commentText.trim());
    const { error } = await dbService.addComment(postId, userNickname, sanitizedComment);
    if (!error) {
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      await loadComments(postId);
    } else {
      alert("댓글 등록 실패: " + error.message);
    }
  };

  const handleDeleteComment = async (commentId, postId) => {
    if (!window.confirm("정말 이 댓글을 삭제하시겠습니까?")) return;
    const { error } = await dbService.removeComment(commentId);
    if (!error) {
      await loadComments(postId);
    } else {
      alert("댓글 삭제 실패: " + error.message);
    }
  };

  // --- 신고 핸들러 ---
  const handleOpenReportModal = (targetType, targetId, targetDetails) => {
    if (!userNickname) {
      alert("로그인 후 신고 기능을 이용할 수 있습니다.");
      return;
    }
    setReportingTarget({ type: targetType, id: targetId, details: targetDetails });
    setReportReason('허위 정보 / 거짓 매칭');
    setReportCustomReason('');
    setIsReportModalOpen(true);
  };

  const handleSubmitReport = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!reportingTarget) return;
    const finalReason = reportReason === '기타' ? reportCustomReason : reportReason;
    if (reportReason === '기타' && !reportCustomReason.trim()) {
      alert("신고 사유를 작성해주세요.");
      return;
    }
    const { error } = await dbService.addReport(
      reportingTarget.type,
      reportingTarget.id,
      userNickname,
      finalReason,
      reportingTarget.details
    );
    if (!error) {
      alert("신고가 정상적으로 접수되었습니다. 관리자 확인 후 조치됩니다.");
      setIsReportModalOpen(false);
      setReportingTarget(null);
    } else {
      alert("신고 접수 실패: " + error.message);
    }
  };

  return {
    posts,
    setPosts,
    loading,
    myPostIds,
    setMyPostIds,
    myContact,
    setMyContact,
    isFormOpen,
    setIsFormOpen,
    isMyInfoOpen,
    setIsMyInfoOpen,
    expandedPostIds,
    togglePostExpand,
    fetchData,
    handleSubmitPost,
    handleDeletePost,
    handleBumpPost,
    handleTogglePostComplete,
    updatePostStickersDirectly,

    // 수정 모달 관련
    editingPost,
    isEditModalOpen,
    setIsEditModalOpen,
    editContact,
    setEditContact,
    editHaves,
    setEditHaves,
    editWants,
    setEditWants,
    editBasketMode,
    setEditBasketMode,
    editCurrentCategoryId,
    setEditCurrentCategoryId,
    handleOpenEditModal,
    handleCloseEditModal,
    handleUpdatePost,
    toggleEditStickerSelection,
    checkMatching,

    // 댓글 관련
    comments,
    commentInputs,
    setCommentInputs,
    expandedComments,
    toggleComments,
    handleAddComment,
    handleDeleteComment,

    // 신고 관련
    reportingTarget,
    isReportModalOpen,
    setIsReportModalOpen,
    reportReason,
    setReportReason,
    reportCustomReason,
    setReportCustomReason,
    handleOpenReportModal,
    handleSubmitReport
  };
}
