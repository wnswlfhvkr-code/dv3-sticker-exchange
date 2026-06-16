import { useEffect } from 'react';
import './App.css';

// 정적 데이터
import { categories } from './stickersData';

// ViewModels & Components (Features)
import { useAuthViewModel } from './features/auth/useAuthViewModel';
import { LoginModal } from './features/auth/LoginModal';
import { MyInfoDrawer } from './features/auth/MyInfoDrawer';

import { useBasketViewModel } from './features/basket/useBasketViewModel';

import { usePostViewModel } from './features/post/usePostViewModel';
import { PostFeed } from './features/post/PostFeed';
import { PostFormModal } from './features/post/PostFormModal';
import { EditPostModal } from './features/post/EditPostModal';

import { BoardSection } from './features/board/BoardSection';

import { useChatViewModel } from './features/chat/useChatViewModel';
import { ChatWidget } from './features/chat/ChatWidget';

import { useAdminViewModel } from './features/admin/useAdminViewModel';
import { AdminDashboard } from './features/admin/AdminDashboard';
import { ReportModal } from './features/admin/ReportModal';
import { BugReportModal } from './features/admin/BugReportModal';

import { CategoryList } from './features/sticker/CategoryList';
import { StickerDetailGrid } from './features/sticker/StickerDetailGrid';

// 공통 Components
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AdBanner } from './components/AdBanner';
import { dbService } from './supabaseClient';

function App() {
  // 1. 사용자 인증 및 세션 정보
  const authVM = useAuthViewModel();

  // 2. 스티커 바구니 상태 관리 (onBasketChange 콜백을 통해 포스트 실시간 동기화)
  const basketVM = useBasketViewModel({
    userNickname: authVM.userNickname,
    onBasketChange: (nextHaves, nextWants) => {
      const myPost = postVM.posts.find(p => p.nickname === authVM.userNickname);
      if (myPost && postVM.updatePostStickersDirectly) {
        postVM.updatePostStickersDirectly(myPost.id, nextHaves, nextWants);
      }
    }
  });

  // 3. 교환글 피드 및 댓글/신고 상태 관리
  const postVM = usePostViewModel({
    userNickname: authVM.userNickname,
    myHaves: basketVM.myHaves,
    myWants: basketVM.myWants,
    setMyHaves: basketVM.setMyHaves,
    setMyWants: basketVM.setMyWants
  });

  // 4. 1:1 실시간 채팅 관리
  const chatVM = useChatViewModel({
    userNickname: authVM.userNickname
  });

  // 5. 관리자 제어 및 모니터링 관리
  const adminVM = useAdminViewModel({
    userNickname: authVM.userNickname,
    fetchPosts: postVM.fetchData
  });

  // 앱 최초 마운트 시 접속 로그 기록 (고유 visitorKey 기반)
  useEffect(() => {
    let visitorKey = localStorage.getItem('dv3_visitor_key');
    if (!visitorKey) {
      visitorKey = 'visitor-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
      localStorage.setItem('dv3_visitor_key', visitorKey);
    }
    dbService.logVisit(visitorKey, authVM.userNickname || null);
  }, [authVM.userNickname]);

  // 실시간 포스트 갱신 시 바구니 자동 동기화 보정
  useEffect(() => {
    if (postVM.posts && authVM.userNickname) {
      basketVM.syncMyBasketFromPost(authVM.userNickname, postVM.posts);
    }
  }, [postVM.posts, authVM.userNickname]);

  // 키보드 단축키 '4', '6' 글로벌 리스너 바인딩
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
        return;
      }

      if (e.key === '4') {
        e.preventDefault();
        if (postVM.isEditModalOpen) {
          postVM.setEditCurrentCategoryId(prev => prev > 1 ? prev - 1 : categories.length);
        } else {
          basketVM.setSelectedCategoryId(prev => {
            const currentId = prev || 1;
            return currentId > 1 ? currentId - 1 : categories.length;
          });
        }
      } else if (e.key === '6') {
        e.preventDefault();
        if (postVM.isEditModalOpen) {
          postVM.setEditCurrentCategoryId(prev => prev < categories.length ? prev + 1 : 1);
        } else {
          basketVM.setSelectedCategoryId(prev => {
            const currentId = prev || 1;
            return currentId < categories.length ? currentId + 1 : 1;
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [postVM.isEditModalOpen, basketVM.setSelectedCategoryId, postVM.setEditCurrentCategoryId]);

  return (
    <div className="app-container">
      {/* 화면 제일 끝쪽 데스크톱 전용 사이드 광고 배너 */}
      <div className="sidebar-ad sidebar-ad-left">
        <AdBanner type="vertical" />
      </div>
      <div className="sidebar-ad sidebar-ad-right">
        <AdBanner type="vertical" />
      </div>

      {/* 1. 상단 글로벌 헤더 */}
      <Header 
        userNickname={authVM.userNickname}
        dbMode={authVM.dbMode}
        handleLogout={authVM.handleLogout}
        setShowLoginModal={authVM.setShowLoginModal}
        handleOpenAdminTab={adminVM.handleOpenAdminTab}
        setIsMyInfoOpen={postVM.setIsMyInfoOpen}
        setIsBugModalOpen={adminVM.setIsBugModalOpen}
        unreadCounts={chatVM.unreadCounts}
      />

      {/* 2. 로그인 모달 */}
      <LoginModal 
        showLoginModal={authVM.showLoginModal}
        setShowLoginModal={authVM.setShowLoginModal}
        loginInput={authVM.loginInput}
        setLoginInput={authVM.setLoginInput}
        loginPassword={authVM.loginPassword}
        setLoginPassword={authVM.setLoginPassword}
        handleLogin={authVM.handleLogin}
      />

      {/* 3. 스티커 카테고리 탭 목록 및 4. 스티커북 상세 그리드 (메인 도감) 교환 렌더링 */}
      {basketVM.selectedCategoryId === null ? (
        <CategoryList 
          selectedCategoryId={basketVM.selectedCategoryId}
          setSelectedCategoryId={basketVM.setSelectedCategoryId}
          getHavesCountInPage={basketVM.getHavesCountInPage}
          getWantsCountInPage={basketVM.getWantsCountInPage}
        />
      ) : (
        <StickerDetailGrid 
          selectedCategoryId={basketVM.selectedCategoryId}
          setSelectedCategoryId={basketVM.setSelectedCategoryId}
          myHaves={basketVM.myHaves}
          myWants={basketVM.myWants}
          toggleStickerSelection={basketVM.toggleStickerSelection}
          basketMode={basketVM.basketMode}
          setBasketMode={basketVM.setBasketMode}
        />
      )}

      {/* 바구니 요약 및 등록 버튼 섹션 제거 */}

      {/* 6. 교환글 피드 목록 */}
      <PostFeed 
        posts={postVM.posts}
        loading={postVM.loading}
        userNickname={authVM.userNickname}
        myPostIds={postVM.myPostIds}
        myHaves={basketVM.myHaves}
        myWants={basketVM.myWants}
        onlineUsers={authVM.onlineUsers}
        fetchData={postVM.fetchData}
        handleBumpPost={postVM.handleBumpPost}
        handleDeletePost={postVM.handleDeletePost}
        handleOpenEditModal={postVM.handleOpenEditModal}
        handleStartChat={chatVM.handleStartChat}
        handleOpenReportModal={postVM.handleOpenReportModal}
        handleAdminDeletePost={adminVM.handleAdminDeletePost}
        setIsFormOpen={postVM.setIsFormOpen}
        
        comments={postVM.comments}
        commentInputs={postVM.commentInputs}
        setCommentInputs={postVM.setCommentInputs}
        expandedComments={postVM.expandedComments}
        toggleComments={postVM.toggleComments}
        handleAddComment={postVM.handleAddComment}
        handleDeleteComment={postVM.handleDeleteComment}

        checkMatching={postVM.checkMatching}
        expandedPostIds={postVM.expandedPostIds}
        togglePostExpand={postVM.togglePostExpand}
      />

      <div className="divider" style={{ margin: '2.5rem 0' }} />

      {/* 6.5 로그인 전용 독립 게시판 */}
      <BoardSection userNickname={authVM.userNickname} />

      {/* 7. 신규 게시글 등록 모달 */}
      <PostFormModal 
        isFormOpen={postVM.isFormOpen}
        setIsFormOpen={postVM.setIsFormOpen}
        myContact={postVM.myContact}
        setMyContact={postVM.setMyContact}
        myHaves={basketVM.myHaves}
        myWants={basketVM.myWants}
        handleSubmitPost={postVM.handleSubmitPost}
      />

      {/* 8. 기존 게시글 수정 모달 */}
      <EditPostModal 
        isEditModalOpen={postVM.isEditModalOpen}
        editingPost={postVM.editingPost}
        onClose={postVM.handleCloseEditModal}
        editContact={postVM.editContact}
        setEditContact={postVM.setEditContact}
        editHaves={postVM.editHaves}
        editWants={postVM.editWants}
        editBasketMode={postVM.editBasketMode}
        setEditBasketMode={postVM.setEditBasketMode}
        editCurrentCategoryId={postVM.editCurrentCategoryId}
        setEditCurrentCategoryId={postVM.setEditCurrentCategoryId}
        toggleEditStickerSelection={postVM.toggleEditStickerSelection}
        handleUpdatePost={postVM.handleUpdatePost}
      />

      {/* 9. 내 정보 드로어 */}
      <MyInfoDrawer 
        isMyInfoOpen={postVM.isMyInfoOpen}
        setIsMyInfoOpen={postVM.setIsMyInfoOpen}
        userNickname={authVM.userNickname}
        isGuest={authVM.isGuest}
        myContact={postVM.myContact}
        setMyContact={postVM.setMyContact}
        posts={postVM.posts}
        handleDeletePost={postVM.handleDeletePost}
        handleOpenEditModal={postVM.handleOpenEditModal}
        handleTogglePostComplete={postVM.handleTogglePostComplete}
      />

      {/* 10. 신고 작성 모달 */}
      <ReportModal 
        isReportModalOpen={postVM.isReportModalOpen}
        setIsReportModalOpen={postVM.setIsReportModalOpen}
        reportingTarget={postVM.reportingTarget}
        setReportingTarget={postVM.setReportingTarget}
        reportReason={postVM.reportReason}
        setReportReason={postVM.setReportReason}
        reportCustomReason={postVM.reportCustomReason}
        setReportCustomReason={postVM.setReportCustomReason}
        handleSubmitReport={postVM.handleSubmitReport}
      />

      {/* 11. 관리자 대시보드 모달 */}
      <AdminDashboard 
        isAdminTabOpen={adminVM.isAdminTabOpen}
        setIsAdminTabOpen={adminVM.setIsAdminTabOpen}
        reportsList={adminVM.reportsList}
        adminLoading={adminVM.adminLoading}
        adminLogs={adminVM.adminLogs}
        adminActiveTab={adminVM.adminActiveTab}
        setAdminActiveTab={adminVM.setAdminActiveTab}
        loadReports={adminVM.loadReports}
        loadAdminLogs={adminVM.loadAdminLogs}
        handleResolveReport={adminVM.handleResolveReport}
        handleAdminDeletePost={adminVM.handleAdminDeletePost}
        handleAdminDeleteComment={(commentId, postId, reportId) => 
          adminVM.handleAdminDeleteComment(commentId, postId, reportId, postVM.loadComments)
        }
        bugReportsList={adminVM.bugReportsList}
        handleResolveBugReport={adminVM.handleResolveBugReport}
        loadBugReports={adminVM.loadBugReports}
        statsData={adminVM.statsData}
        statsLoading={adminVM.statsLoading}
        loadDashboardStats={adminVM.loadDashboardStats}
      />

      {/* 11.5 버그 제보 모달 */}
      <BugReportModal 
        isBugModalOpen={adminVM.isBugModalOpen}
        setIsBugModalOpen={adminVM.setIsBugModalOpen}
        bugTitle={adminVM.bugTitle}
        setBugTitle={adminVM.setBugTitle}
        bugDescription={adminVM.bugDescription}
        setBugDescription={adminVM.setBugDescription}
        handleSubmitBug={adminVM.handleSubmitBug}
        userNickname={authVM.userNickname}
      />

      {/* 12. 1:1 실시간 채팅 위젯 */}
      <ChatWidget 
        chatRooms={chatVM.chatRooms}
        chatActiveRoomId={chatVM.chatActiveRoomId}
        setChatActiveRoomId={chatVM.setChatActiveRoomId}
        chatActiveRoomNickname={chatVM.chatActiveRoomNickname}
        setChatActiveRoomNickname={chatVM.setChatActiveRoomNickname}
        chatMessages={chatVM.chatMessages}
        chatInput={chatVM.chatInput}
        setChatInput={chatVM.setChatInput}
        chatWindowOpen={chatVM.chatWindowOpen}
        setChatWindowOpen={chatVM.setChatWindowOpen}
        handleSendMessage={chatVM.handleSendMessage}
        userNickname={authVM.userNickname}
        unreadCounts={chatVM.unreadCounts}
        chatScrollRef={chatVM.chatScrollRef}
        onlineUsers={authVM.onlineUsers}
        chatNotification={chatVM.chatNotification}
        setChatNotification={chatVM.setChatNotification}
        handleLeaveChatRoom={chatVM.handleLeaveChatRoom}
      />

      {/* 하단 푸터 및 이용약관 모달 */}
      <Footer />
    </div>
  );
}

export default App;
