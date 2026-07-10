import React from 'react';
import { X, Sparkles, ShoppingCart } from 'lucide-react';
import { categories } from '../../stickersData';

export function PostFormModal({
  isFormOpen,
  setIsFormOpen,
  userNickname,
  myContact,
  setMyContact,
  myHaves,
  myWants,
  handleSubmitPost
}) {
  if (!isFormOpen) return null;

  return (
    <div className="modal-overlay" style={{ display: 'flex', zIndex: 1000 }}>
      <div className="modal-content glass-card" style={{ maxWidth: '500px', width: '95%', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={16} color="var(--primary-color)" />
            새 교환글 등록
          </h2>
          <button onClick={() => setIsFormOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmitPost} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>


          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>작성자</label>
            <input type="text" className="input-field" value={userNickname} disabled style={{ opacity: 0.6 }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>연락처 정보 (선택 사항 - 오픈채팅 링크, 디스코드 ID 등)</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="예: 오픈채팅 주소 또는 디스코드 태그 (비워두기 가능)" 
              value={myContact}
              onChange={(e) => setMyContact(e.target.value)}
            />
          </div>

          {/* 등록하려는 카드 목록 요약 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ fontSize: '0.82rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', margin: 0 }}>
              <ShoppingCart size={12} color="var(--primary-color)" /> 등록할 스티커 요약 ({myHaves.length + myWants.length}개)
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 'bold' }}>🟢 줄 수 있는 스티커 ({myHaves.length}):</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '4px' }}>
                  {myHaves.map(id => {
                    const [catId, s] = id.split('-');
                    const cat = categories.find(c => String(c.id) === catId);
                    return (
                      <span key={id} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#a7f3d0', fontSize: '0.68rem', padding: '2px 5px', borderRadius: '4px' }}>
                        {cat ? cat.name : `${catId}페이지`} {s}번
                      </span>
                    );
                  })}
                  {myHaves.length === 0 && <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>없음</span>}
                </div>
              </div>
 
              <div>
                <span style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 'bold' }}>🔴 받고 싶은 스티커 ({myWants.length}):</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '4px' }}>
                  {myWants.map(id => {
                    const [catId, s] = id.split('-');
                    const cat = categories.find(c => String(c.id) === catId);
                    return (
                      <span key={id} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', fontSize: '0.68rem', padding: '2px 5px', borderRadius: '4px' }}>
                        {cat ? cat.name : `${catId}페이지`} {s}번
                      </span>
                    );
                  })}
                  {myWants.length === 0 && <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>없음</span>}
                </div>
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem', fontWeight: 'bold' }}>
            등록 완료하기
          </button>
        </form>
      </div>
    </div>
  );
}
