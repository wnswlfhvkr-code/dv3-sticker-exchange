import { useState } from 'react';
import { X } from 'lucide-react';

export function LoginModal({ 
  theme,
  showLoginModal, 
  setShowLoginModal,
  loginInput, 
  setLoginInput, 
  loginPassword, 
  setLoginPassword, 
  handleLogin 
}) {
  const [isGuestTab, setIsGuestTab] = useState(false);
  const isLight = theme === 'light';

  if (!showLoginModal) return null;

  const onSubmit = (e) => {
    e.preventDefault();
    handleLogin(loginInput, loginPassword, isGuestTab);
  };

  return (
    <div className="modal-overlay" style={{ display: 'flex', zIndex: 1000 }}>
      <div className="modal-content glass-card" style={{ maxWidth: '400px', width: '90%', padding: '2.25rem 2rem 2rem 2rem', position: 'relative' }}>
        <button 
          type="button"
          onClick={() => setShowLoginModal(false)}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '4px',
            transition: 'color 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <X size={20} />
        </button>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '0.5rem', textAlign: 'center', color: 'var(--primary-color)' }}>
          드래곤빌리지3 스티커교환소
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', marginBottom: '1.5rem' }}>
          교환글 등록 및 1:1 채팅을 위해 로그인해주세요.
        </p>
        <p style={{ color: isLight ? '#065f46' : '#a7f3d0', fontSize: '0.74rem', textAlign: 'center', margin: '-0.85rem 0 1.2rem 0', lineHeight: 1.45 }}>
          원활한 교환 확인을 위해 가급적 실제 게임 닉네임으로 설정하는 것을 추천합니다.
        </p>

        {/* 정식로그인 vs 게스트 로그인 탭 분할 */}
        <div style={{ display: 'flex', background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '3px', marginBottom: '1.5rem' }}>
          <button 
            type="button"
            onClick={() => {
              setIsGuestTab(false);
              setLoginPassword('');
            }}
            style={{ 
              flex: 1, 
              padding: '0.6rem', 
              fontSize: '0.82rem', 
              fontWeight: '700', 
              borderRadius: '8px', 
              border: 'none', 
              background: !isGuestTab ? 'var(--primary-color)' : 'transparent', 
              color: !isGuestTab ? '#ffffff' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            정식 회원 로그인
          </button>
          <button 
            type="button"
            onClick={() => {
              setIsGuestTab(true);
              setLoginPassword('');
            }}
            style={{ 
              flex: 1, 
              padding: '0.6rem', 
              fontSize: '0.82rem', 
              fontWeight: '700', 
              borderRadius: '8px', 
              border: 'none', 
              background: isGuestTab ? 'var(--primary-color)' : 'transparent', 
              color: isGuestTab ? '#ffffff' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            임시 게스트 접속
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>닉네임</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder={isGuestTab ? "임시 닉네임 입력 (한글/영문/숫자)" : "회원 닉네임 입력"} 
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value.replace(/\s/g, ''))}
              required
              maxLength={15}
            />
          </div>

          {!isGuestTab && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>비밀번호</label>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>* 미가입 닉네임은 자동 가입됩니다.</span>
              </div>
              <input 
                type="password" 
                className="input-field" 
                placeholder="비밀번호 입력" 
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required={!isGuestTab}
              />
            </div>
          )}

          {isGuestTab && (
            <div style={{ 
              background: isLight ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.08)', 
              border: isLight ? '1px solid rgba(239, 68, 68, 0.15)' : '1px solid rgba(239, 68, 68, 0.2)', 
              borderRadius: '8px', 
              padding: '0.65rem 0.8rem', 
              fontSize: '0.72rem', 
              color: isLight ? '#991b1b' : '#fca5a5', 
              lineHeight: 1.4 
            }}>
              ⚠️ <strong>게스트(임시) 모드 주의사항:</strong><br />
              - 게스트 계정은 중복 가입을 방지하기 위해 정식 회원 닉네임이나 현재 온라인 접속 중인 다른 닉네임과 겹칠 수 없습니다.<br />
              - 브라우저 종료 시 정보가 유실되며 타인의 기존 정식 계정 정보에 임의 접근할 수 없습니다.
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
            {isGuestTab ? "게스트로 로그인" : "로그인 및 시작하기"}
          </button>
        </form>
      </div>
    </div>
  );
}
