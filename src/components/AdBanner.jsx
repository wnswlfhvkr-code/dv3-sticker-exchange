import React, { useEffect } from 'react';

export function AdBanner({ type = 'horizontal' }) {
  // 실제 애드센스가 승인되어 활성화되었을 때 true로 변경하면 됩니다.
  const isAdsenseActive = false; 
  const publisherId = 'ca-pub-XXXXXXXXXXXXXXXX'; // 본인의 퍼블리셔 ID로 변경
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
        className="ad-banner-container"
        style={{
          margin: '20px auto',
          textAlign: 'center',
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: type === 'horizontal' ? '90px' : '250px',
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

  // 승인 대기 단계용 프리미엄 유리 질감 플레이스홀더 디자인
  return (
    <div 
      className="premium-ad-placeholder"
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
        }}>
          Sponsor ad
        </span>
        <span style={{
          fontSize: '13px',
          fontWeight: '500',
          color: 'rgba(255, 255, 255, 0.6)',
          textAlign: 'center',
        }}>
          카드교환소 후원 광고 구역입니다. (애드센스 승인 심사 대기 중)
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
