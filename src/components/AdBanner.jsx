import React, { useEffect, useRef } from 'react';

export function AdBanner({ type = 'horizontal' }) {
  const publisherId = 'ca-pub-3489777827665018'; // 실제 퍼블리셔 ID
  
  // 애드센스 디렉티브 슬롯 ID (수동 단위 광고 시 사용)
  const slotId = type === 'horizontal' ? '1234567890' : '0987654321'; 

  const adPushedRef = useRef(false);

  // 컴포넌트 마운트 시 구글 애드센스 인스턴스 초기화 push 실행
  useEffect(() => {
    if (adPushedRef.current) return;
    adPushedRef.current = true;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error('Google AdSense initialization error:', e);
    }
  }, [type]);

  if (type === 'vertical') {
    return (
      <div 
        className="adsense-container vertical"
        style={{
          width: '160px',
          height: '600px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.01)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          overflow: 'hidden'
        }}
      >
        <ins 
          className="adsbygoogle"
          style={{ display: 'block', width: '160px', height: '600px' }}
          data-ad-client={publisherId}
          data-ad-slot={slotId}
          data-ad-format="vertical"
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  // 기본 가로형 (horizontal)
  return (
    <div 
      className="adsense-container horizontal"
      style={{
        width: '100%',
        maxWidth: '728px',
        margin: '20px auto',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.01)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        overflow: 'hidden',
        minHeight: '90px'
      }}
    >
      <ins 
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', minWidth: '320px' }}
        data-ad-client={publisherId}
        data-ad-slot={slotId}
        data-ad-format="horizontal"
        data-full-width-responsive="true"
      />
    </div>
  );
}
