import React from 'react';
import { X, Bug } from 'lucide-react';

export function BugReportModal({
  isBugModalOpen,
  setIsBugModalOpen,
  bugTitle,
  setBugTitle,
  bugDescription,
  setBugDescription,
  handleSubmitBug,
  userNickname
}) {
  if (!isBugModalOpen) return null;

  const onSubmit = async (e) => {
    e.preventDefault();
    await handleSubmitBug(userNickname);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(5, 3, 10, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10005,
      animation: 'fadeIn 0.25s ease-out'
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '480px',
        background: 'rgba(18, 15, 28, 0.95)',
        border: '1px solid rgba(133, 195, 0, 0.2)',
        borderRadius: '24px',
        padding: '1.75rem',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(133, 195, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        position: 'relative'
      }}>
        {/* 닫기 버튼 */}
        <button
          onClick={() => setIsBugModalOpen(false)}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '4px',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <X size={20} />
        </button>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'rgba(133, 195, 0, 0.15)',
            borderRadius: '12px',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(133, 195, 0, 0.3)'
          }}>
            <Bug size={24} color="var(--primary-color)" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: '#fff' }}>🐛 스티커교환소 버그 제보하기</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>발견하신 오류나 개선 요청사항을 상세히 남겨주세요.</p>
          </div>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* 제보자 표시 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#94a3b8' }}>제보 유저</label>
            <div style={{
              padding: '0.65rem 0.85rem',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.06)',
              fontSize: '0.85rem',
              color: 'var(--primary-color)',
              fontWeight: 'bold'
            }}>
              {userNickname || '방문자(로그인 안함)'}
            </div>
          </div>

          {/* 제목 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#94a3b8' }}>버그 제목</label>
            <input
              type="text"
              required
              placeholder="예: 스티커 상세 보기에서 이미지가 안 나와요."
              value={bugTitle}
              onChange={(e) => setBugTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '0.7rem 0.9rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                border: '1px solid var(--border-color)',
                color: '#fff',
                background: '#191b20',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            />
          </div>

          {/* 상세 내용 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#94a3b8' }}>상세 내용</label>
            <textarea
              required
              rows={4}
              placeholder="어떤 상황에서 에러가 발생하는지 단계별로 작성해 주시면 해결에 큰 도움이 됩니다."
              value={bugDescription}
              onChange={(e) => setBugDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '0.7rem 0.9rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                border: '1px solid var(--border-color)',
                color: '#fff',
                background: '#191b20',
                resize: 'none',
                lineHeight: '1.4',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            />
          </div>

          {/* 제출 버튼 */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setIsBugModalOpen(false)}
              style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}
            >
              취소
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                padding: '0.65rem 1.5rem',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                boxShadow: '0 4px 12px rgba(133, 195, 0, 0.3)'
              }}
            >
              제보 제출하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
