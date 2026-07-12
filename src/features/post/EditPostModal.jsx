import { useEffect, useRef } from 'react';
import { X, Sparkles, MessageCircle } from 'lucide-react';
import { stickersData, categories } from '../../stickersData';

export function EditPostModal({
  isEditModalOpen,
  editingPost,
  onClose,
  editContact,
  setEditContact,
  editHaves,
  editWants,
  editBasketMode,
  setEditBasketMode,
  editCurrentCategoryId,
  setEditCurrentCategoryId,
  handleUpdatePost,
  toggleEditStickerSelection
}) {
  const lastTapRef = useRef({});
  const touchTimersRef = useRef({});
  const skipNextClickRef = useRef({});
  
  // 수정 모달 내에서의 '4', '6' 단축키 바인딩
  useEffect(() => {
    if (!isEditModalOpen) return;
    
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
        return;
      }
      if (e.key === '4') {
        setEditCurrentCategoryId(prev => (prev > 1 ? prev - 1 : categories.length));
      } else if (e.key === '6') {
        setEditCurrentCategoryId(prev => (prev < categories.length ? prev + 1 : 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditModalOpen, setEditCurrentCategoryId]);

  useEffect(() => {
    const timers = touchTimersRef.current;
    return () => {
      Object.values(timers).forEach(timer => clearTimeout(timer));
    };
  }, []);

  if (!isEditModalOpen || !editingPost) return null;

  const currentEditCategory = categories.find(c => c.id === editCurrentCategoryId) || categories[0];
  const handleEditPrevCategory = () => {
    setEditCurrentCategoryId(prev => (prev > 1 ? prev - 1 : categories.length));
  };
  const handleEditNextCategory = () => {
    setEditCurrentCategoryId(prev => (prev < categories.length ? prev + 1 : 1));
  };
  const clearTouchTimer = (stickerId) => {
    if (touchTimersRef.current[stickerId]) {
      clearTimeout(touchTimersRef.current[stickerId]);
      delete touchTimersRef.current[stickerId];
    }
  };
  const selectEditHaveImmediately = (stickerId, isGolden) => {
    if (isGolden) return;
    toggleEditStickerSelection(stickerId, 'haves');
  };
  const selectEditWantImmediately = (stickerId, isGolden) => {
    clearTouchTimer(stickerId);
    if (isGolden) return;
    toggleEditStickerSelection(stickerId, 'wants');
  };
  const handleEditTouchEnd = (e, stickerId, isGolden) => {
    e.preventDefault();
    skipNextClickRef.current[stickerId] = true;
    const now = e.timeStamp;
    const lastTap = lastTapRef.current[stickerId] || 0;
    if (now - lastTap < 320) {
      lastTapRef.current[stickerId] = 0;
      clearTouchTimer(stickerId);
      selectEditWantImmediately(stickerId, isGolden);
      return;
    }
    lastTapRef.current[stickerId] = now;
    clearTouchTimer(stickerId);
    touchTimersRef.current[stickerId] = setTimeout(() => {
      selectEditHaveImmediately(stickerId, isGolden);
      delete touchTimersRef.current[stickerId];
    }, 280);
  };

  return (
    <div className="modal-overlay edit-post-modal-overlay">
      <div className="modal-content glass-card edit-post-modal">
        <button 
          onClick={onClose}
          aria-label="수정 창 닫기"
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <form onSubmit={handleUpdatePost} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
              <Sparkles color="var(--primary-color)" size={20} />
              내 교환글 수정하기
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              줄 수 있는 스티커와 받고 싶은 스티커를 자유롭게 수정하고 완료 버튼을 눌러주세요.
            </p>
          </div>

          {/* 연락처 수정 */}
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)', width: '100%' }}>
              <MessageCircle size={14} color="var(--primary-color)" /> 연락처 (선택 사항)
            </label>
            <input 
              type="text" 
              placeholder="예: open.kakao.com/o/xxxxxx" 
              value={editContact}
              onChange={(e) => setEditContact(e.target.value)}
              className="input-field"
              style={{ width: '100%' }}
            />
          </div>

          {/* 탭 제어 */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setEditBasketMode('haves')}
              style={{
                flex: 1,
                padding: '0.6rem',
                background: 'none',
                border: 'none',
                borderBottom: editBasketMode === 'haves' ? '2px solid #10b981' : 'none',
                color: editBasketMode === 'haves' ? '#10b981' : 'var(--text-muted)',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              🟢 줄 수 있는 스티커 수정 ({editHaves.length}개)
            </button>
            <button
              type="button"
              onClick={() => setEditBasketMode('wants')}
              style={{
                flex: 1,
                padding: '0.6rem',
                background: 'none',
                border: 'none',
                borderBottom: editBasketMode === 'wants' ? '2px solid #ef4444' : 'none',
                color: editBasketMode === 'wants' ? '#ef4444' : 'var(--text-muted)',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              🔴 받고 싶은 스티커 수정 ({editWants.length}개)
            </button>
          </div>

          {/* 현재 선택된 리스트 & 간이 제거 기능 */}
          <div style={{ maxHeight: '120px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            {editBasketMode === 'haves' ? (
              editHaves.map(id => {
                const [catId, s] = id.split('-');
                const cat = categories.find(c => String(c.id) === catId);
                return (
                  <span key={id} className="sticker-tag" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#a7f3d0', padding: '0.25rem 0.45rem', borderRadius: '6px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '3px', margin: '2px' }}>
                    {cat ? cat.name : `${catId}페이지`} {s}번
                    <button type="button" onClick={() => toggleEditStickerSelection(id, 'haves')} style={{ background: 'none', border: 'none', color: '#a7f3d0', cursor: 'pointer', padding: '1px', display: 'flex', alignItems: 'center' }}><X size={10} /></button>
                  </span>
                );
              })
            ) : (
              editWants.map(id => {
                const [catId, s] = id.split('-');
                const cat = categories.find(c => String(c.id) === catId);
                return (
                  <span key={id} className="sticker-tag" style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '0.25rem 0.45rem', borderRadius: '6px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '3px', margin: '2px' }}>
                    {cat ? cat.name : `${catId}페이지`} {s}번
                    <button type="button" onClick={() => toggleEditStickerSelection(id, 'wants')} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', padding: '1px', display: 'flex', alignItems: 'center' }}><X size={10} /></button>
                  </span>
                );
              })
            )}
            {((editBasketMode === 'haves' ? editHaves.length : editWants.length) === 0) && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '1rem 0' }}>비어 있음 (아래에서 카테고리를 골라 추가하세요)</div>
            )}
          </div>

          {/* 추가할 카드 선택 셀렉터 (3x3 격자도감화) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', background: 'rgba(255,255,255,0.02)', padding: '0.8rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <button 
                type="button" 
                onClick={handleEditPrevCategory}
                className="btn btn-outline" 
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '2px' }}
              >
                ◀ <span style={{ fontSize: '0.62rem', opacity: 0.6 }}>(4)</span>
              </button>
              <select
                value={editCurrentCategoryId}
                onChange={(e) => setEditCurrentCategoryId(Number(e.target.value))}
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 'bold',
                  color: 'var(--primary-color)',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '6px',
                  padding: '0.25rem 0.4rem',
                  cursor: 'pointer',
                  outline: 'none',
                  textAlign: 'center',
                  maxWidth: '140px'
                }}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id} style={{ background: '#1a1a2e', color: '#fff' }}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <button 
                type="button" 
                onClick={handleEditNextCategory}
                className="btn btn-outline" 
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '2px' }}
              >
                <span style={{ fontSize: '0.62rem', opacity: 0.6 }}>(6)</span> ▶
              </button>
            </div>

            <div className="edit-sticker-grid" style={{
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: '0.4rem', 
              marginBottom: '0.3rem' 
            }}>
              {Array.from({ length: 9 }).map((_, slotIdx) => {
                const slotNum = slotIdx + 1;
                const stickerId = `${currentEditCategory.id}-${slotNum}`;
                const isHave = editHaves.includes(stickerId);
                const isWant = editWants.includes(stickerId);
                const isSelected = isHave || isWant;

                const sticker = stickersData.find(s => s.id === stickerId);
                const imageUrl = sticker ? sticker.image : null;
                const isGolden = sticker && sticker.isGolden;

                let borderStyle = isGolden ? '2px solid rgba(156, 163, 175, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)';
                let backgroundStyle = isGolden ? 'rgba(0, 0, 0, 0.4)' : 'transparent';
                let shadowStyle = 'none';

                if (isHave) {
                  borderStyle = '2px solid #10b981';
                  backgroundStyle = 'rgba(16, 185, 129, 0.08)';
                  shadowStyle = '0 0 10px rgba(16, 185, 129, 0.2)';
                } else if (isWant) {
                  borderStyle = '2px solid #ef4444';
                  backgroundStyle = 'rgba(239, 68, 68, 0.08)';
                  shadowStyle = '0 0 10px rgba(239, 68, 68, 0.2)';
                }

                return (
                  <div 
                    key={stickerId}
                    onClick={(e) => {
                      e.preventDefault();
                      if (skipNextClickRef.current[stickerId]) {
                        skipNextClickRef.current[stickerId] = false;
                        return;
                      }
                      selectEditHaveImmediately(stickerId, isGolden);
                    }}
                    onTouchEnd={(e) => {
                      handleEditTouchEnd(e, stickerId, isGolden);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      selectEditWantImmediately(stickerId, isGolden);
                    }}
                    style={{ 
                      border: borderStyle, 
                      background: backgroundStyle,
                      borderRadius: '10px', 
                      padding: '0.4rem 0.2rem', 
                      cursor: isGolden ? 'not-allowed' : 'pointer', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      position: 'relative',
                      overflow: 'hidden',
                      aspectRatio: '0.8',
                      transition: 'all 0.2s ease',
                      boxShadow: shadowStyle,
                      opacity: isGolden ? 0.3 : (isSelected ? 1 : 0.6),
                      filter: isGolden ? 'grayscale(100%) contrast(70%)' : 'none'
                    }}
                  >
                    {isGolden && (
                      <>
                        <div style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          fontSize: '0.55rem',
                          background: 'rgba(107, 114, 128, 0.35)',
                          border: '1px solid rgba(107, 114, 128, 0.5)',
                          color: '#9ca3af',
                          padding: '1px 2px',
                          borderRadius: '3px',
                          zIndex: 2,
                          lineHeight: 1
                        }}>
                          🔒
                        </div>
                        <div style={{
                          position: 'absolute',
                          bottom: '0',
                          left: '0',
                          right: '0',
                          background: 'rgba(239, 68, 68, 0.85)',
                          color: '#fff',
                          fontSize: '0.55rem',
                          textAlign: 'center',
                          padding: '1px 0',
                          fontWeight: '800',
                          zIndex: 2
                        }}>
                          교환 불가
                        </div>
                      </>
                    )}
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={sticker.name} 
                        style={{ 
                          width: '100%', 
                          height: '74%', 
                          objectFit: 'contain',
                          transform: isSelected ? 'scale(1.05)' : 'scale(1)'
                        }} 
                      />
                    ) : (
                      <div style={{ height: '74%' }} />
                    )}
                    <span style={{ fontSize: '0.58rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '90%', textAlign: 'center', marginTop: '2px' }}>
                      {sticker ? sticker.name : `${slotNum}번`}
                    </span>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '2px' }}>
              💡 PC: 좌클릭은 줄 수 있는 스티커, 우클릭은 받고 싶은 스티커 / 모바일: 탭, 더블탭
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={onClose}
              style={{ flex: 1, padding: '0.75rem' }}
            >
              취소
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ flex: 2, padding: '0.75rem', fontWeight: 'bold' }}
            >
              수정 완료
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
