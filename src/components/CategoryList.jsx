import React from 'react';
import { BookOpen, HelpCircle } from 'lucide-react';
import { getCategoryImage, categories } from '../stickersData';

export function CategoryList({ 
  getHavesCountInPage, 
  getWantsCountInPage, 
  setSelectedCategoryId 
}) {
  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '800px' }}>
      <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <BookOpen size={20} color="var(--primary-color)" />
        스티커북 카테고리 선택
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
        원하는 카테고리를 선택한 뒤, 보유 중인 카드와 필요한 카드를 바구니에 담아 매칭해 보세요.
      </p>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '1.2rem',
        maxHeight: '620px',
        overflowY: 'auto',
        padding: '0.5rem'
      }}>
        {categories.map((cat) => {
          const havesCount = getHavesCountInPage(cat.id);
          const wantsCount = getWantsCountInPage(cat.id);
          const hasAny = havesCount > 0 || wantsCount > 0;
          const imgUrl = getCategoryImage(cat.id);
          
          // 테두리 강조 색상 분기
          let borderStyle = '2px solid var(--border-color)';
          let shadowStyle = 'none';
          if (havesCount > 0 && wantsCount > 0) {
            borderStyle = '2.5px solid #a855f7'; // 복합 선택
            shadowStyle = '0 0 15px rgba(168, 85, 247, 0.35)';
          } else if (havesCount > 0) {
            borderStyle = '2.5px solid #10b981'; // 보유 선택
            shadowStyle = '0 0 15px rgba(16, 185, 129, 0.35)';
          } else if (wantsCount > 0) {
            borderStyle = '2.5px solid #ef4444'; // 구함 선택
            shadowStyle = '0 0 15px rgba(239, 68, 68, 0.35)';
          }

          return (
            <div 
              key={cat.id}
              className="glass-card slot-item"
              style={{ 
                padding: 0, 
                cursor: 'pointer', 
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                borderRadius: '20px',
                border: borderStyle,
                boxShadow: shadowStyle,
                transition: 'all 0.2s ease',
                height: '230px',
                background: '#1d2025',
                position: 'relative'
              }}
              onClick={() => setSelectedCategoryId(cat.id)}
            >
              {/* 카드 내부의 개별 Haves / Wants 개수 플로팅 표시 */}
              {hasAny && (
                <div style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 5, display: 'flex', gap: '3px' }}>
                  {havesCount > 0 && (
                    <span style={{ background: '#10b981', color: '#fff', fontSize: '0.7rem', padding: '2px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
                      🟢 {havesCount}
                    </span>
                  )}
                  {wantsCount > 0 && (
                    <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.7rem', padding: '2px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
                      🔴 {wantsCount}
                    </span>
                  )}
                </div>
              )}

              {/* 상단: 대표 이미지 영역 */}
              <div style={{ 
                height: '185px', 
                width: '100%', 
                overflow: 'hidden',
                position: 'relative',
                background: '#15181c'
              }}>
                {imgUrl ? (
                  <img 
                    src={imgUrl} 
                    alt={cat.name} 
                    title={cat.name}
                    style={{ 
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
                    <HelpCircle size={32} color="rgba(255,255,255,0.15)" />
                  </div>
                )}
              </div>

              {/* 하단: 카테고리 이름 영역 */}
              <div style={{ 
                height: '45px',
                background: '#25282e',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: '0.25rem 0.5rem',
                borderTop: '1.5px solid rgba(255,255,255,0.05)',
                textAlign: 'center',
                width: '100%'
              }}>
                <span style={{ 
                  fontWeight: '700', 
                  fontSize: '0.88rem', 
                  color: '#fff',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  width: '100%'
                }}>
                  {cat.name}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
