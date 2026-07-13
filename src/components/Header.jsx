import { User, Info, LogOut, Sun, Moon } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export function Header({ 
  userNickname, 
  isGuest, 
  dbMode, 
  setIsMyInfoOpen, 
  handleOpenAdminTab, 
  handleLogout, 
  setSelectedCategoryId,
  setCurrentView,
  setIsBugModalOpen,
  unreadCounts = {},
  theme,
  toggleTheme,
  setShowLoginModal
}) {
  const { language, setLanguage, t } = useLanguage();
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  return (
    <header className="site-header">
      <div 
        className="logo-container" 
        onClick={() => {
          setSelectedCategoryId(null);
          if (setCurrentView) setCurrentView('main');
        }}
        style={{ cursor: 'pointer', userSelect: 'none' }}
        title={language === 'ko' ? '카테고리 홈으로 이동' : 'Go to Categories Home'}
      >
        <h1 className="logo-text">DRAGON VILLAGE 3</h1>
        <div className="sub-logo-text">STICKER BOOK MATCHING CENTER</div>
      </div>
      
      <div className="header-actions">
        {/* 언어 전환 버튼 */}
        <button
          onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            padding: '0.45rem 0.65rem',
            borderRadius: '12px',
            fontSize: '0.78rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            outline: 'none',
            gap: '4px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
          }}
          title={language === 'ko' ? 'Switch to English' : '한국어로 변경'}
        >
          🌐 {language === 'ko' ? 'EN' : 'KR'}
        </button>

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
          title={theme === 'dark' ? (language === 'ko' ? '라이트 모드로 전환' : 'Switch to Light Mode') : (language === 'ko' ? '다크 모드로 전환' : 'Switch to Dark Mode')}
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
          title={language === 'ko' ? '오류/버그 제보하기' : 'Report bugs or errors'}
        >
          {t('bugReport')}
        </button>

        {userNickname ? (
          <div className="header-user-menu">
            <User size={14} color="var(--primary-color)" />
            <span 
              className="header-user-name"
              onClick={() => setIsMyInfoOpen(true)}
              title={t('myInfo')}
            >
              {userNickname} {isGuest ? <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('guest')}</span> : null}
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
              title={t('myInfo')}
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
              title={t('logout')}
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowLoginModal(true)}
            className="btn btn-primary"
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '12px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s',
              outline: 'none',
              boxShadow: 'none'
            }}
            title={language === 'ko' ? '로그인 또는 회원가입하기' : 'Login or Sign Up'}
          >
            {t('login')}
          </button>
        )}
        {dbMode ? (
          <div className="badge badge-have" style={{ textTransform: 'none', margin: 0 }}>
            {dbMode}
          </div>
        ) : null}
      </div>

      <nav className="header-content-nav" aria-label={language === 'ko' ? '정보 문서' : 'Reference pages'}>
        <a href="/about-stickers.html">{language === 'ko' ? '스티커 데이터' : 'Sticker data'}</a>
        <a href="/tips-matching-guide.html">{language === 'ko' ? '매칭 원리' : 'Match logic'}</a>
        <a href="/tips-safe-trading.html">{language === 'ko' ? '안전 교환' : 'Safe exchange'}</a>
        <a href="/tips-gem-reinforcement.html">{language === 'ko' ? '젬 계산기' : 'Gem calculator'}</a>
      </nav>
    </header>
  );
}

