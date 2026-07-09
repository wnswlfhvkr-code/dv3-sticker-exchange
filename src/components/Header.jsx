import React from 'react';
import { User, Info, LogOut, Sun, Moon } from 'lucide-react';

export function Header({ 
  userNickname, 
  isGuest, 
  dbMode, 
  setIsMyInfoOpen, 
  handleOpenAdminTab, 
  handleLogout, 
  setSelectedCategoryId,
  setIsBugModalOpen,
  unreadCounts = {},
  theme,
  toggleTheme,
  setShowLoginModal
}) {
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '800px', margin: '0 auto 1.5rem auto', flexWrap: 'wrap', gap: '1rem' }}>
      <div 
        className="logo-container" 
        onClick={() => setSelectedCategoryId(null)}
        style={{ cursor: 'pointer', userSelect: 'none' }}
        title="카테고리 홈으로 이동"
      >
        <h1 className="logo-text">DRAGON VILLAGE 3</h1>
        <div className="sub-logo-text">STICKER BOOK MATCHING CENTER</div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* 테마 토글 버튼 */}
        <button
          onClick={toggleTheme}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            padding: '0.45rem',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            outline: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
          }}
          title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
        >
          {theme === 'dark' ? <Sun size={15} color="#fbbf24" /> : <Moon size={15} color="#60a5fa" />}
        </button>

        {/* 버그 제보 버튼 */}
        <button
          onClick={() => setIsBugModalOpen(true)}
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#f87171',
            cursor: 'pointer',
            padding: '0.45rem 0.8rem',
            paddingLeft: '0.8rem',
            paddingRight: '0.8rem',
            borderRadius: '12px',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.18)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.45)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.25)';
          }}
          title="오류/버그 제보하기"
        >
          🐛 버그 제보
        </button>

        {userNickname ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 0.85rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <User size={14} color="var(--primary-color)" />
            <span 
              style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
              onClick={() => setIsMyInfoOpen(true)}
              title="내 정보 열기"
            >
              {userNickname} {isGuest ? <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(게스트)</span> : null}
              {totalUnread > 0 && (
                <span style={{
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: '0.68rem',
                  fontWeight: '800',
                  borderRadius: '10px',
                  padding: '1px 5px',
                  lineHeight: '1',
                  boxShadow: '0 0 5px rgba(239, 68, 68, 0.8)'
                }}>
                  {totalUnread}
                </span>
              )}
            </span>
            <button
              onClick={() => setIsMyInfoOpen(true)}
              style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', padding: '0 2px', display: 'flex', alignItems: 'center' }}
              title="내 정보 및 등록글 보기"
            >
              <Info size={14} />
            </button>
            {userNickname === '간장' && (
              <button 
                onClick={handleOpenAdminTab} 
                style={{ background: 'none', border: 'none', color: '#fbbf24', cursor: 'pointer', padding: '0 4px', display: 'flex', alignItems: 'center', gap: '2px' }}
                title="관리자 메뉴 열기"
              >
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>👑 관리자</span>
              </button>
            )}
            <button 
              onClick={handleLogout} 
              style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0 0 0 4px', display: 'flex', alignItems: 'center' }}
              title="로그아웃"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowLoginModal(true)}
            style={{
              background: 'var(--primary-color)',
              border: 'none',
              color: '#1e1b4b',
              cursor: 'pointer',
              padding: '0.45rem 1rem',
              borderRadius: '12px',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s',
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = 'brightness(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'none';
            }}
            title="로그인 또는 회원가입하기"
          >
            🔐 로그인 / 가입
          </button>
        )}
        <div className="badge badge-have" style={{ textTransform: 'none', margin: 0 }}>
          {dbMode}
        </div>
      </div>
    </header>
  );
}
