import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { stickersData, getCategoryImage, categories } from '../../stickersData';

export function StickerDetailGrid({
  selectedCategoryId,
  setSelectedCategoryId,
  myHaves,
  myWants,
  toggleStickerSelection
}) {
  const [warningMessage, setWarningMessage] = useState(null);
  const lastTapRef = useRef({});
  const touchTimersRef = useRef({});
  const skipNextClickRef = useRef({});

  // 이전 / 다음 카테고리 명칭 계산
  const foundCategoryIndex = categories.findIndex(c => c.id === selectedCategoryId);
  const currentIndex = foundCategoryIndex >= 0 ? foundCategoryIndex : 0;
  const currentCategory = categories[currentIndex];
  const prevCategory = categories[currentIndex === 0 ? categories.length - 1 : currentIndex - 1];
  const nextCategory = categories[currentIndex === categories.length - 1 ? 0 : currentIndex + 1];

  // 경고 메시지 타이머
  useEffect(() => {
    if (warningMessage) {
      const timer = setTimeout(() => {
        setWarningMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [warningMessage]);

  useEffect(() => {
    const timers = touchTimersRef.current;
    return () => {
      Object.values(timers).forEach(timer => clearTimeout(timer));
    };
  }, []);

  // 대표 이미지 (각 카테고리의 1번 스티커 이미지 사용)
  const repSticker = stickersData.find(s => s.id === `${selectedCategoryId}-1`);
  const repImageUrl = repSticker ? repSticker.image : null;

  // 키보드 단축키 '4', '6' 바인딩
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
        return;
      }
      if (e.key === '4') {
        // 이전 카테고리
        setSelectedCategoryId(prev => (prev > 1 ? prev - 1 : categories.length));
      } else if (e.key === '6') {
        // 다음 카테고리
        setSelectedCategoryId(prev => (prev < categories.length ? prev + 1 : 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [categories.length, setSelectedCategoryId]);

  const handlePrevCategory = () => {
    setSelectedCategoryId(prev => (prev > 1 ? prev - 1 : categories.length));
  };

  const handleNextCategory = () => {
    setSelectedCategoryId(prev => (prev < categories.length ? prev + 1 : 1));
  };

  const showGoldenWarning = () => {
    setWarningMessage("🔒 골든 등급 카드는 교환할 수 없습니다!");
  };

  const clearTouchTimer = (stickerId) => {
    if (touchTimersRef.current[stickerId]) {
      clearTimeout(touchTimersRef.current[stickerId]);
      delete touchTimersRef.current[stickerId];
    }
  };

  const selectHaveImmediately = (stickerId, isGolden) => {
    if (isGolden) {
      showGoldenWarning();
      return;
    }
    toggleStickerSelection(stickerId, 'haves');
  };

  const selectWantImmediately = (stickerId, isGolden) => {
    clearTouchTimer(stickerId);
    if (isGolden) {
      showGoldenWarning();
      return;
    }
    toggleStickerSelection(stickerId, 'wants');
  };

  const handleTouchEnd = (e, stickerId, isGolden) => {
    e.preventDefault();
    skipNextClickRef.current[stickerId] = true;
    const now = e.timeStamp;
    const lastTap = lastTapRef.current[stickerId] || 0;
    if (now - lastTap < 320) {
      lastTapRef.current[stickerId] = 0;
      clearTouchTimer(stickerId);
      selectWantImmediately(stickerId, isGolden);
      return;
    }
    lastTapRef.current[stickerId] = now;
    clearTouchTimer(stickerId);
    touchTimersRef.current[stickerId] = setTimeout(() => {
      selectHaveImmediately(stickerId, isGolden);
      delete touchTimersRef.current[stickerId];
    }, 280);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', textAlign: 'left', marginBottom: '2.5rem', width: '100%', maxWidth: '800px', position: 'relative' }} className="detail-work-layout">
      
      {/* 이전 카테고리 플로팅 화살표 (4번 카드 왼쪽 바깥) */}
      <button 
        onClick={handlePrevCategory}
        style={{
          position: 'absolute',
          left: '-68px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '46px',
          height: '46px',
          borderRadius: '50%',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(21, 24, 28, 0.95)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
          zIndex: 10,
          transition: 'all 0.2s'
        }}
        className="btn-floating-nav"
        title="이전 카테고리 (단축키: 4)"
      >
        <ChevronLeft size={24} />
      </button>

      {/* 다음 카테고리 플로팅 화살표 (6번 카드 오른쪽 바깥) */}
      <button 
        onClick={handleNextCategory}
        style={{
          position: 'absolute',
          right: '-68px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '46px',
          height: '46px',
          borderRadius: '50%',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(21, 24, 28, 0.95)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
          zIndex: 10,
          transition: 'all 0.2s'
        }}
        className="btn-floating-nav"
        title="다음 카테고리 (단축키: 6)"
      >
        <ChevronRight size={24} />
      </button>

      {/* 3x3 대형 그리드 영역 */}
      <div className="glass-card" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '1.5rem' }}>

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.8rem', width: '100%', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem', flexWrap: 'nowrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button 
              className="btn btn-outline" 
              onClick={() => setSelectedCategoryId(null)}
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
            >
              <ArrowLeft size={14} /> 카테고리 목록
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {repImageUrl && (
                <img 
                  src={repImageUrl} 
                  alt="대표 드래곤" 
                  style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'contain', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              )}
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary-color)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentCategory.name}
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            <button 
              onClick={handlePrevCategory}
              className="btn btn-outline" 
              style={{ padding: '0.45rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              title={`이전 카테고리: ${prevCategory.name} (단축키: 4)`}
            >
              <ChevronLeft size={14} /> <span style={{ fontSize: '0.78rem', fontWeight: 'bold' }}>{prevCategory.name}</span>
            </button>
            <button 
              onClick={handleNextCategory}
              className="btn btn-outline" 
              style={{ padding: '0.45rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              title={`다음 카테고리: ${nextCategory.name} (단축키: 6)`}
            >
              <span style={{ fontSize: '0.78rem', fontWeight: 'bold' }}>{nextCategory.name}</span> <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* 상단으로 올려 배치한 좌클릭 / 우클릭 / 모바일 안내 가이드 및 경고 팝업 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginBottom: '0.5rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1.2rem',
            padding: '0.5rem 0.8rem',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '8px',
            width: '100%'
          }}>
            <span style={{ fontSize: '0.76rem', color: '#86efac', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
              🖱️ 마우스 좌클릭 → <span style={{ color: '#10b981' }}>줄 수 있는 카드</span>
            </span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
            <span style={{ fontSize: '0.76rem', color: '#fca5a5', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
              🖱️ 우클릭·모바일 더블탭 → <span style={{ color: '#ef4444' }}>받고 싶은 카드</span>
            </span>
          </div>

          {warningMessage && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: '700',
              textAlign: 'center',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 2px 10px rgba(239,68,68,0.2)'
            }}>
              ⚠️ {warningMessage}
            </div>
          )}
        </div>

        {/* 3x3 격자 렌더링 */}
        <div className="sticker-detail-grid" style={{
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: '1.2rem',
          width: '100%'
        }}>
          {Array.from({ length: 9 }).map((_, index) => {
            const slotNum = index + 1;
            const stickerId = `${selectedCategoryId}-${slotNum}`;
            const sticker = stickersData.find(s => s.id === stickerId);
            const isHave = myHaves.includes(stickerId);
            const isWant = myWants.includes(stickerId);
            const isSelected = isHave || isWant;
            const isGolden = sticker ? sticker.isGolden : false;

            const imageUrl = sticker ? sticker.image : getCategoryImage(selectedCategoryId);

            // 보더 및 그림자 이중 강조 스타일
            let cellBorder = '2px solid rgba(255, 255, 255, 0.08)';
            let cellShadow = 'none';

            if (isGolden) {
              cellBorder = '3px solid #fbbf24';
              cellShadow = '0 0 18px rgba(251, 191, 36, 0.45)';
            } else if (isHave) {
              cellBorder = '3px solid #10b981';
              cellShadow = '0 0 15px rgba(16, 185, 129, 0.3)';
            } else if (isWant) {
              cellBorder = '3px solid #ef4444';
              cellShadow = '0 0 15px rgba(239, 68, 68, 0.3)';
            }

            return (
              <div 
                key={stickerId}
                className={`glass-card slot-item ${isSelected ? 'active' : ''}`}
                style={{ 
                  padding: '0', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '16px',
                  border: cellBorder,
                  boxShadow: cellShadow,
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: isGolden ? 'rgba(251, 191, 36, 0.06)' : '#191b20',
                  aspectRatio: '3 / 4',
                  position: 'relative',
                  cursor: 'pointer',
                  userSelect: 'none',
                  opacity: isSelected ? 1 : 0.65,
                  filter: 'none',
                  overflow: 'hidden'
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  selectWantImmediately(stickerId, isGolden);
                }}
                onClick={(e) => {
                  e.preventDefault();
                  if (skipNextClickRef.current[stickerId]) {
                    skipNextClickRef.current[stickerId] = false;
                    return;
                  }
                  selectHaveImmediately(stickerId, isGolden);
                }}
                onTouchEnd={(e) => {
                  handleTouchEnd(e, stickerId, isGolden);
                }}
                onTouchStart={() => {
                  if (isGolden) {
                    showGoldenWarning();
                  }
                }}
              >
                {/* 우측 상단 골든 등급 엠블럼 or 잠금 장치 */}
                {isGolden ? (
                  <>
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      fontSize: '0.62rem',
                      background: 'rgba(239, 68, 68, 0.85)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#fff',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                      zIndex: 10,
                      lineHeight: 1
                    }}>
                      🔒 교환 불가
                    </div>
                  </>
                ) : (
                  sticker && sticker.isGolden && (
                    <span style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '1.2rem', filter: 'drop-shadow(0 0 3px #fbbf24)', zIndex: 10 }}>
                      👑
                    </span>
                  )
                )}

                {imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt={sticker ? sticker.name : `${slotNum}번`} 
                    title={sticker ? sticker.name : `${slotNum}번`}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'contain', 
                      transition: 'all 0.2s ease',
                      transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                      display: 'block'
                    }} 
                  />
                ) : (
                  <span style={{ fontSize: '1.2rem', color: isSelected ? '#a3e635' : 'var(--text-secondary)' }}>
                    {slotNum}번
                  </span>
                )}

                {/* 인게임 감성의 노란 별 등급 노출 - 좌측 상단 플로팅 배지 스타일 */}
                <div style={{ 
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  background: 'rgba(0, 0, 0, 0.6)',
                  backdropFilter: 'blur(3px)',
                  padding: '2px 6px',
                  borderRadius: '12px',
                  display: 'flex', 
                  justifyContent: 'center', 
                  gap: '1px', 
                  zIndex: 8,
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  {Array.from({ length: sticker ? sticker.stars : 1 }).map((_, i) => (
                    <span 
                      key={i} 
                      style={{ 
                        color: isSelected ? '#fbbf24' : '#9ca3af', 
                        fontSize: '0.75rem',
                        textShadow: isSelected ? '0 0 3px rgba(251, 191, 36, 0.9)' : 'none'
                      }}
                    >
                      ★
                    </span>
                  ))}
                </div>
                
                {/* 스티커 이름 표시 - 하단 그라데이션 오버레이 스타일 */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(to top, rgba(10, 8, 20, 0.95) 80%, rgba(10, 8, 20, 0))',
                  fontSize: '0.85rem',
                  padding: '0.6rem 0.2rem 0.35rem 0.2rem',
                  textAlign: 'center',
                  color: isSelected ? '#fff' : '#a1a8b5',
                  fontWeight: '700',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  zIndex: 8
                }} title={sticker ? sticker.name : `${slotNum}번 카드`}>
                  {sticker ? sticker.name : `${slotNum}번 카드`}
                </div>

                {/* 선택 여부 체크 배지 */}
                {isSelected && (
                  <div style={{ 
                    position: 'absolute', 
                    top: '8px', 
                    right: isGolden || (sticker && sticker.isGolden) ? '38px' : '8px', 
                    background: isHave ? '#10b981' : '#ef4444', 
                    borderRadius: '50%', 
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isHave ? '0 0 8px #10b981' : '0 0 8px #ef4444',
                    zIndex: 10
                  }}>
                    <Check size={10} color="#fff" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
