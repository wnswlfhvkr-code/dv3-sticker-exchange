import React, { useEffect, useState } from 'react';

export function AdBanner({ type = 'horizontal' }) {
  // 실제 애드센스가 승인되어 활성화되었을 때 true로 변경하면 됩니다.
  const isAdsenseActive = false; 
  const publisherId = 'ca-pub-3489777827665018'; // 실제 퍼블리셔 ID
  const slotId = type === 'horizontal' ? '1234567890' : '0987654321';

  const [isMobile, setIsMobile] = useState(false);

  // 화면 크기에 따른 모바일/데스크톱 판단 (가로형 배너 분기용)
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 728);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 1. 구글 애드센스 활성화 모드일 때 반환할 HTML
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

  // 2. 카카오 애드핏 활성화 모드 (기본 상태)
  // React 가상 DOM 우회 및 브라우저 파서 직접 구동을 위해 dangerouslySetInnerHTML 사용
  
  // 2-1. 세로형 (vertical) - 데스크톱 사이드바용 (160x600)
  if (type === 'vertical') {
    const adHtml = `
      <ins class="kakao_ad_area" style="display:none;"
        data-ad-unit="DAN-lpnU5qQK1FatjgnF"
        data-ad-width="160"
        data-ad-height="600"></ins>
      <script type="text/javascript" src="https://t1.kakaocdn.net/kas/static/ba.min.js" async></script>
    `;
    return (
      <div 
        className="adfit-container vertical"
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
        dangerouslySetInnerHTML={{ __html: adHtml }}
      />
    );
  }

  // 2-2. 가로형 (horizontal)
  // 모바일(<=728px)에서는 모바일 띠(320x50), 데스크톱에서는 긴 가로 배너(728x90)
  const adUnit = isMobile ? 'DAN-PRyjLRSIiNfRtLAi' : 'DAN-rxrtRFNaR78fqsA2';
  const adWidth = isMobile ? '320' : '728';
  const adHeight = isMobile ? '50' : '90';

  const adHtml = `
    <ins class="kakao_ad_area" style="display:none;"
      data-ad-unit="${adUnit}"
      data-ad-width="${adWidth}"
      data-ad-height="${adHeight}"></ins>
    <script type="text/javascript" src="https://t1.kakaocdn.net/kas/static/ba.min.js" async></script>
  `;

  return (
    <div 
      key={`${adUnit}-${adWidth}-${adHeight}`} // 뷰포트 상태 전환 시 강제 렌더링 유도
      className={`adfit-container horizontal ${isMobile ? 'mobile' : 'desktop'}`}
      style={{
        width: '100%',
        maxWidth: isMobile ? '320px' : '728px',
        height: isMobile ? '50px' : '90px',
        margin: '20px auto',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.01)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        overflow: 'hidden'
      }}
      dangerouslySetInnerHTML={{ __html: adHtml }}
    />
  );
}


