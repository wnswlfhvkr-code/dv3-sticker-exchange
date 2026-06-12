import React, { useEffect } from 'react';
import { Sparkles } from 'lucide-react';

export function AdBanner({ type = 'horizontal' }) {
  // 실제 애드센스가 승인되어 활성화되었을 때 true로 변경하면 됩니다.
  const isAdsenseActive = false; 
  const publisherId = 'ca-pub-3489777827665018'; // 실제 퍼블리셔 ID 세팅 완료
  const slotId = type === 'horizontal' ? '1234567890' : '0987654321'; // 본인의 슬롯 ID로 변경

  useEffect(() => {
    if (isAdsenseActive) {
      try {
        // 구글 애드센스 스크립트 실행을 유도합니다.
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error('AdSense 렌더링 오류:', e);
      }
    }
  }, [isAdsenseActive]);

  // 구글 애드센스 활성화 모드일 때 반환할 HTML
  if (isAdsenseActive) {
    return (
      <div 
        className={`ad-banner-container ${type}`}
        style={{
          margin: type === 'horizontal' ? '20px auto' : '0 auto',
          textAlign: 'center',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: type === 'horizontal' ? '90px' : '600px',
        }}
      >
        <ins 
          className="adsbygoogle"
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
          }}
          data-ad-client={publisherId}
          data-ad-slot={slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  // 세로형(Vertical) 사이드 배너 플레이스홀더 디자인
  if (type === 'vertical') {
    return (
      <div 
        className="premium-ad-placeholder vertical"
        style={{
          width: '100%',
          height: '100%',
          minHeight: '600px',
          background: 'rgba(255, 255, 255, 0.02)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease',
          padding: '24px 12px',
        }}
      >
        {/* 세로형 네온 장식 테두리 효과 (왼쪽 세로선) */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '2px',
          background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.45), rgba(59, 130, 246, 0.1))',
        }} />

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          height: '100%',
          justifyContent: 'space-between',
        }}>
          {/* 상단 뱃지 */}
          <span style={{
            fontSize: '10px',
            fontWeight: '800',
            letterSpacing: '1.5px',
            color: '#a78bfa',
            background: 'rgba(139, 92, 246, 0.12)',
            padding: '4px 10px',
            borderRadius: '20px',
            border: '1px solid rgba(139, 92, 246, 0.25)',
            textTransform: 'uppercase',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            <Sparkles size={10} />
            Sponsor
          </span>

          {/* 중앙 세로 텍스트/안내문 */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
          }}>
            <div style={{
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              fontSize: '14px',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.45)',
              letterSpacing: '6px',
              lineHeight: '1.8',
              textAlign: 'center',
              textShadow: '0 0 10px rgba(255,255,255,0.05)',
            }}>
              스티커교환소 후원 배너
            </div>

            <div style={{
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.25)',
              textAlign: 'center',
              lineHeight: '1.6',
              maxWidth: '120px',
            }}>
              데스크톱 와이드 전용 세로 광고 지면
            </div>
          </div>

          {/* 하단 서브 텍스트 */}
          <span style={{
            fontSize: '9px',
            color: 'rgba(255, 255, 255, 0.18)',
            textAlign: 'center',
            maxWidth: '120px',
          }}>
            구글 애드센스 심사 대기 중입니다.
          </span>
        </div>
      </div>
    );
  }

  // 가로형(Horizontal) 배너 플레이스홀더 디자인
  return (
    <div 
      className="premium-ad-placeholder horizontal"
      style={{
        margin: '16px auto',
        padding: '16px 20px',
        width: '100%',
        maxWidth: '1200px',
        minHeight: '80px',
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.07)',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
        transition: 'all 0.3s ease',
      }}
    >
      {/* 은은한 네온 장식 테두리 효과 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.4), rgba(59, 130, 246, 0.1))',
      }} />

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <span style={{
          fontSize: '11px',
          fontWeight: '700',
          letterSpacing: '1px',
          color: '#a78bfa',
          background: 'rgba(139, 92, 246, 0.15)',
          padding: '2px 8px',
          borderRadius: '20px',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          textTransform: 'uppercase',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          <Sparkles size={12} />
          Sponsor ad
        </span>
        <span style={{
          fontSize: '13px',
          fontWeight: '500',
          color: 'rgba(255, 255, 255, 0.6)',
          textAlign: 'center',
        }}>
          스티커교환소 후원 광고 구역입니다. (애드센스 승인 심사 대기 중)
        </span>
      </div>

      <span style={{
        fontSize: '11px',
        color: 'rgba(255, 255, 255, 0.35)',
        marginTop: '6px',
        textAlign: 'center',
      }}>
        광고 게재가 승인되면 이 영역에 유익한 배너가 표시됩니다.
      </span>
    </div>
  );
}
