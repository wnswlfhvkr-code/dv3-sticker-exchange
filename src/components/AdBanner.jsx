import React, { useEffect, useState, useRef } from 'react';

export function AdBanner({ type = 'horizontal' }) {
  // 실제 애드센스가 승인되어 활성화되었을 때 true로 변경하면 수동으로 강제 애드센스 고정이 가능합니다.
  const isAdsenseActive = false; 
  const publisherId = 'ca-pub-3489777827665018'; // 실제 퍼블리셔 ID
  // 애드센스 단독 게재용 슬롯 ID
  const slotId = type === 'horizontal' ? '1234567890' : '0987654321'; 

  const [isMobile, setIsMobile] = useState(false);
  const insRef = useRef(null);

  // 화면 크기에 따른 모바일/데스크톱 판단 (가로형 배너 분기용)
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 728);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 카카오 애드핏 실패(NO-AD) 시 구글 애드센스 대체 송출용 전역 콜백 등록
  useEffect(() => {
    if (isAdsenseActive) return;

    // 1. 가로형 배너 실패 콜백 등록
    window.onAdfitFailHorizontal = (elm) => {
      console.warn('Adfit Horizontal Ad load failed (No Ad). Injecting Google AdSense fallback...');
      if (!elm) return;

      const fallbackWidth = window.innerWidth <= 728 ? '320' : '728';
      const fallbackHeight = window.innerWidth <= 728 ? '50' : '90';

      elm.innerHTML = `
        <ins class="adsbygoogle"
          style="display:inline-block;width:${fallbackWidth}px;height:${fallbackHeight}px"
          data-ad-client="${publisherId}"
          data-ad-slot="1234567890"></ins>
      `;

      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error('AdSense Fallback push error (Horizontal):', e);
      }
    };

    // 2. 세로형 배너 실패 콜백 등록
    window.onAdfitFailVertical = (elm) => {
      console.warn('Adfit Vertical Ad load failed (No Ad). Injecting Google AdSense fallback...');
      if (!elm) return;

      elm.innerHTML = `
        <ins class="adsbygoogle"
          style="display:inline-block;width:160px;height:600px"
          data-ad-client="${publisherId}"
          data-ad-slot="0987654321"></ins>
      `;

      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error('AdSense Fallback push error (Vertical):', e);
      }
    };

    return () => {
      delete window.onAdfitFailHorizontal;
      delete window.onAdfitFailVertical;
    };
  }, [isAdsenseActive]);

  // 카카오 애드핏 ba.min.js 스크립트 동적 삽입 및 청소
  useEffect(() => {
    if (isAdsenseActive || !insRef.current) return;

    const insElement = insRef.current;
    const parent = insElement.parentElement;
    if (!parent) return;

    // 기존에 해당 배너 부모 아래 등록된 스크립트가 있다면 먼저 제거 (중복 실행 방지)
    const oldScript = parent.querySelector('.adfit-script');
    if (oldScript) {
      parent.removeChild(oldScript);
    }

    // 새로운 script 엘리먼트 생성 및 삽입 (dangerouslySetInnerHTML의 스크립트 차단 우회)
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.charset = 'utf-8';
    script.async = true;
    script.className = 'adfit-script';
    // 캐시 방지 쿼리 파라미터를 달아 매번 카카오 라이브러리가 즉시 실행 코드를 실행하도록 강제
    script.src = `https://t1.kakaocdn.net/kas/static/ba.min.js?v=${Date.now()}-${Math.random()}`;

    // ins 태그 바로 다음에 삽입하여 카카오 SDK가 로드 후 즉시 바로 위에 있는 ins를 찾을 수 있도록 유도
    insElement.after(script);

    return () => {
      const scr = parent.querySelector('.adfit-script');
      if (scr) {
        parent.removeChild(scr);
      }
    };
  }, [type, isMobile, isAdsenseActive]);

  // 1. 구글 애드센스 강제 고정 모드일 때 반환할 HTML
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

  // 2. 카카오 애드핏 활성화 모드 (기본 상태) + 실패 시 애드센스 자동 대체
  
  // 2-1. 세로형 (vertical) - 데스크톱 사이드바용 (160x600)
  if (type === 'vertical') {
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
      >
        <ins 
          ref={insRef}
          className="kakao_ad_area" 
          style={{ display: 'none' }}
          data-ad-unit="DAN-lpnU5qQK1FatjgnF"
          data-ad-width="160"
          data-ad-height="600"
          data-ad-onfail="onAdfitFailVertical"
        />
      </div>
    );
  }

  // 2-2. 가로형 (horizontal)
  // 모바일(<=728px)에서는 모바일 띠(320x50), 데스크톱에서는 긴 가로 배너(728x90, 대체광고 연동 단위)
  const adUnit = isMobile ? 'DAN-PRyjLRSIiNfRtLAi' : 'DAN-A07OtvumyDqAYcM9';
  const adWidth = isMobile ? '320' : '728';
  const adHeight = isMobile ? '50' : '90';

  return (
    <div 
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
    >
      <ins 
        ref={insRef}
        key={`${adUnit}-${adWidth}-${adHeight}`} // 뷰포트 상태 전환 시 강제 DOM 재구축 유도
        className="kakao_ad_area" 
        style={{ display: 'none' }}
        data-ad-unit={adUnit}
        data-ad-width={adWidth}
        data-ad-height={adHeight}
        data-ad-onfail="onAdfitFailHorizontal"
      />
    </div>
  );
}




