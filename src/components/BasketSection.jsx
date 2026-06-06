import React from 'react';
import { ShoppingCart, X, Sparkles } from 'lucide-react';
import { categories } from '../stickersData';

export function BasketSection({ 
  myHaves, 
  myWants, 
  toggleStickerSelection, 
  setIsFormOpen 
}) {
  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '800px' }}>
      <div>
        <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <ShoppingCart color="var(--primary-color)" size={20} />
          내가 선택한 스티커 목록
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.2rem' }}>
          상단 카테고리를 눌러 들어가면 보유 중인 카드와 필요한 카드를 지정할 수 있습니다.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="basket-split-grid">
          {/* 보유 중 (Haves) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: '700', fontSize: '0.9rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              🟢 줄 수 있는 카드 ({myHaves.length}개)
            </label>
            <div style={{ minHeight: '100px', maxHeight: '180px', overflowY: 'auto', padding: '0.5rem', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.03)' }}>
              {myHaves.map(id => {
                const [catId, s] = id.split('-');
                const cat = categories.find(c => String(c.id) === catId);
                return (
                  <span key={id} className="sticker-tag" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#a7f3d0', padding: '0.35rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '3px', margin: '2px' }}>
                    {cat ? cat.name : `${catId}페이지`} {s}번
                    <button type="button" onClick={() => toggleStickerSelection(id, 'haves')} style={{ background: 'none', border: 'none', color: '#a7f3d0', cursor: 'pointer', padding: '1px', display: 'flex', alignItems: 'center' }}><X size={10} /></button>
                  </span>
                );
              })}
              {myHaves.length === 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  비어 있음
                </div>
              )}
            </div>
          </div>

          {/* 필요한 카드 (Wants) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: '700', fontSize: '0.9rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
              🔴 받고 싶은 카드 ({myWants.length}개)
            </label>
            <div style={{ minHeight: '100px', maxHeight: '180px', overflowY: 'auto', padding: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.03)' }}>
              {myWants.map(id => {
                const [catId, s] = id.split('-');
                const cat = categories.find(c => String(c.id) === catId);
                return (
                  <span key={id} className="sticker-tag" style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '0.35rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '3px', margin: '2px' }}>
                    {cat ? cat.name : `${catId}페이지`} {s}번
                    <button type="button" onClick={() => toggleStickerSelection(id, 'wants')} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', padding: '1px', display: 'flex', alignItems: 'center' }}><X size={10} /></button>
                  </span>
                );
              })}
              {myWants.length === 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  비어 있음
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ paddingTop: '0.5rem' }}>
        <button 
          type="button" 
          className="btn btn-primary" 
          onClick={() => {
            if (myHaves.length === 0 && myWants.length === 0) {
              alert("보유 카드 또는 필요한 카드를 최소 한 개 이상 선택해 주세요!");
              return;
            }
            setIsFormOpen(true);
          }}
          style={{ width: '100%', padding: '1rem', fontWeight: 'bold', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          <Sparkles size={16} /> ⚡ 이 정보로 교환 등록하기
        </button>
      </div>
    </div>
  );
}
