import { useEffect, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import './App.css';
import { useLanguage } from './contexts/LanguageContext';

// 정적 데이터
import { categories, stickersData } from './stickersData';


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
import { GuideSection } from './components/GuideSection';

function App() {
  const { language, t } = useLanguage();
  // 1. 사용자 인증 및 세션 정보
  const authVM = useAuthViewModel();

  // 테마 상태 관리 (다크 / 라이트)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('dv3_theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('dv3_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // SPA 네비게이션 상태 관리
  const [currentView, setCurrentView] = useState('main'); // 'main' | 'guide'
  const [guideActiveTab, setGuideActiveTab] = useState('gemTable'); // 'gemTable' | 'colGuide' | 'safetyRules' | 'matchEngine'

  // 퀵 서치(빠른 검색) 상태 관리
  const [quickSearchQuery, setQuickSearchQuery] = useState('');

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

  // 퀵 서치 필터링 로직
  const getFilteredPosts = () => {
    if (!quickSearchQuery.trim()) return postVM.posts;
    const query = quickSearchQuery.trim().toLowerCase();
    
    // 1. 검색어가 포함된 모든 스티커의 ID 목록 찾기
    const matchingStickerIds = stickersData
      .filter(s => s.name.toLowerCase().includes(query))
      .map(s => s.id);
      
    // 2. 해당 스티커 중 하나라도 haves에 들어있는 게시글 필터링
    return postVM.posts.filter(post => {
      const postHaves = post.haves || [];
      return postHaves.some(haveId => matchingStickerIds.includes(haveId));
    });
  };

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

  const isLight = theme === 'light';

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
        theme={theme}
        toggleTheme={toggleTheme}
        setSelectedCategoryId={basketVM.setSelectedCategoryId}
        setCurrentView={setCurrentView}
      />

      {currentView === 'main' ? (
        <>
          {/* 1.2. 비공식 안내 및 안전 거래 수칙 정보성 콘텐츠 (AdSense 콘텐츠 가치 보강) */}
          <div style={{
            maxWidth: '1200px',
            margin: '20px auto 10px auto',
            padding: '24px',
            background: 'var(--card-bg)',
            backdropFilter: 'blur(12px)',
            borderRadius: '24px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-main)',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <span style={{ fontSize: '22px' }}>🛡️</span>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--primary-color)' }}>
                {t('safetyTitle')}
              </h2>
            </div>
            <p style={{ margin: '0 0 16px 0', fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              {t('safetyDesc')}
            </p>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
              gap: '16px', 
              borderTop: '1px solid var(--border-color)', 
              paddingTop: '16px' 
            }}>
              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: 'var(--text-primary)', fontWeight: '700' }}>{t('rule1Title')}</h4>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  <li>{t('rule1Desc1')}</li>
                  <li>{t('rule1Desc2')}</li>
                </ul>
              </div>
              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: 'var(--text-primary)', fontWeight: '700' }}>{t('rule2Title')}</h4>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  <li>{t('rule2Desc1')}</li>
                  <li>{t('rule2Desc2')}</li>
                </ul>
              </div>
              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: 'var(--text-primary)', fontWeight: '700' }}>{t('rule3Title')}</h4>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  <li>{t('rule3Desc1')}</li>
                  <li>{t('rule3Desc2')}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 1.5. 공략 가이드북 및 백과사전 퀵 배너 */}
          <div style={{
            maxWidth: '1200px',
            margin: '20px auto 10px auto',
            padding: '24px',
            background: 'var(--card-bg)',
            backdropFilter: 'blur(12px)',
            borderRadius: '24px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-main)',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '24px' }}>🐉</span>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>
                  {t('guideTitle')}
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {t('guideDesc')}
                </p>
              </div>
            </div>
            <div style={{
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap',
              marginTop: '4px'
            }}>
              <button 
                onClick={() => {
                  setCurrentView('guide');
                  setGuideActiveTab('gemTable');
                }}
                style={{
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  background: isLight ? '#f3e8ff' : 'rgba(167, 139, 250, 0.15)',
                  border: isLight ? '1px solid #d8b4fe' : '1px solid rgba(167, 139, 250, 0.3)',
                  color: isLight ? '#6b21a8' : '#c4b5fd',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = isLight ? '#6b21a8' : '#a78bfa'; e.currentTarget.style.color = isLight ? '#fff' : '#1e1b4b'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = isLight ? '#f3e8ff' : 'rgba(167, 139, 250, 0.15)'; e.currentTarget.style.color = isLight ? '#6b21a8' : '#c4b5fd'; }}
              >
                {t('gemTable')}
              </button>
              <button 
                onClick={() => {
                  setCurrentView('guide');
                  setGuideActiveTab('colGuide');
                }}
                style={{
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  background: isLight ? '#eff6ff' : 'rgba(96, 165, 250, 0.15)',
                  border: isLight ? '1px solid #bfdbfe' : '1px solid rgba(96, 165, 250, 0.3)',
                  color: isLight ? '#1e40af' : '#93c5fd',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = isLight ? '#1e40af' : '#60a5fa'; e.currentTarget.style.color = isLight ? '#fff' : '#1e1b4b'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = isLight ? '#eff6ff' : 'rgba(96, 165, 250, 0.15)'; e.currentTarget.style.color = isLight ? '#1e40af' : '#93c5fd'; }}
              >
                {t('colGuide')}
              </button>
              <button 
                onClick={() => {
                  setCurrentView('guide');
                  setGuideActiveTab('safetyRules');
                }}
                style={{
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  background: isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.15)',
                  border: isLight ? '1px solid #fde68a' : '1px solid rgba(245, 158, 11, 0.3)',
                  color: isLight ? '#b45309' : '#fde047',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = isLight ? '#b45309' : '#f59e0b'; e.currentTarget.style.color = isLight ? '#fff' : '#1e1b4b'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.15)'; e.currentTarget.style.color = isLight ? '#b45309' : '#fde047'; }}
              >
                {t('safetyRules')}
              </button>
              <button 
                onClick={() => {
                  setCurrentView('guide');
                  setGuideActiveTab('matchEngine');
                }}
                style={{
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  background: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.15)',
                  border: isLight ? '1px solid #a7f3d0' : '1px solid rgba(16, 185, 129, 0.3)',
                  color: isLight ? '#065f46' : '#6ee7b7',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = isLight ? '#065f46' : '#10b981'; e.currentTarget.style.color = isLight ? '#fff' : '#1e1b4b'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.15)'; e.currentTarget.style.color = isLight ? '#065f46' : '#6ee7b7'; }}
              >
                {t('matchEngine')}
              </button>
            </div>
          </div>

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

          {/* 5.5 퀵 서치 (스티커 빠른 검색) */}
          <div style={{
            maxWidth: '800px',
            width: '100%',
            margin: '1.5rem auto 1.5rem auto',
            padding: '1.5rem',
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            boxShadow: 'var(--shadow-main)',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '18px' }}>🔍</span>
              <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)', fontWeight: '700' }}>
                {t('quickSearchTitle')}
              </h3>
            </div>
            <p style={{ margin: '0 0 12px 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
              {t('quickSearchDesc')}
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text"
                placeholder={t('quickSearchPlaceholder')}
                value={quickSearchQuery}
                onChange={(e) => setQuickSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  fontSize: '13.5px',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
              />
              {quickSearchQuery && (
                <button
                  onClick={() => setQuickSearchQuery('')}
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    color: '#f87171',
                    borderRadius: '12px',
                    padding: '0 16px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                >
                  {t('resetBtn')}
                </button>
              )}
            </div>
          </div>

          {/* 6. 교환글 피드 목록 */}
          <PostFeed 
            posts={getFilteredPosts()}
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
            setShowLoginModal={authVM.setShowLoginModal}
            theme={theme}
            
            
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
          <BoardSection userNickname={authVM.userNickname} setShowLoginModal={authVM.setShowLoginModal} />
        </>
      ) : (
        <GuideSection 
          activeTab={guideActiveTab} 
          setActiveTab={setGuideActiveTab} 
          onBack={() => setCurrentView('main')} 
        />
      )}

      {/* 2. 로그인 모달 */}
      <LoginModal 
        theme={theme}
        showLoginModal={authVM.showLoginModal}
        setShowLoginModal={authVM.setShowLoginModal}
        loginInput={authVM.loginInput}
        setLoginInput={authVM.setLoginInput}
        loginPassword={authVM.loginPassword}
        setLoginPassword={authVM.setLoginPassword}
        handleLogin={authVM.handleLogin}
      />

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
      <Footer onNavigate={(tab) => {
        setCurrentView('guide');
        setGuideActiveTab(tab);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }} />

      {/* Vercel Web Analytics */}
      <Analytics />
    </div>
  );
}

export default App;
