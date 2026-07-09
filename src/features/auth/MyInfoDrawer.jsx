import React from 'react';
import { X, User, Trash2 } from 'lucide-react';
import { categories } from '../../stickersData';

export function MyInfoDrawer({
  isMyInfoOpen,
  setIsMyInfoOpen,
  userNickname,
  isGuest,
  myContact,
  setMyContact,
  posts,
  handleDeletePost,
  handleOpenEditModal,
  handleTogglePostComplete
}) {
  if (!isMyInfoOpen) return null;

  return (
    <>
      <div 
        className={`my-info-drawer-overlay ${isMyInfoOpen ? 'open' : ''}`} 
        onClick={() => setIsMyInfoOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 9990,
          transition: 'opacity 0.3s ease'
        }}
      />
      <div 
        className={`my-info-drawer ${isMyInfoOpen ? 'open' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: '380px',
          maxWidth: '90%',
          background: 'var(--modal-bg)',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.2)',
          zIndex: 9991,
          display: 'flex',
          flexDirection: 'column',
          padding: '1.5rem',
          borderLeft: '1px solid var(--border-color)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
            <User size={18} color="var(--primary-color)" /> 내 정보 및 등록 내역
          </h3>
          <button 
            onClick={() => setIsMyInfoOpen(false)} 
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* 유저 프로필 카드 */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>로그인 계정</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {userNickname} 
              {isGuest && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '400' }}>(임시 게스트)</span>}
            </div>
            
            {/* 연락처 수정 폼 */}
            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>내 기본 연락처</label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <input 
                  type="text" 
                  value={myContact} 
                  onChange={(e) => {
                    setMyContact(e.target.value);
                    localStorage.setItem('dv3_my_contact', e.target.value);
                  }}
                  placeholder="예: 카톡 오픈채팅 주소"
                  className="input-field"
                  style={{ flex: 1, padding: '0.45rem 0.6rem', fontSize: '0.8rem', borderRadius: '6px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
                <button 
                  onClick={() => alert("내 연락처 정보가 수정되었습니다! 새로운 글 작성 시 자동으로 적용됩니다.")}
                  className="btn btn-primary"
                  style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem', borderRadius: '6px' }}
                >
                  저장
                </button>
              </div>
            </div>
          </div>

          {/* 내 등록 내역 리스트 */}
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>내 교환 등록글</span>
              <span style={{ color: 'var(--primary-color)' }}>
                {posts.filter(p => p.nickname === userNickname).length}개
              </span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {posts.filter(p => p.nickname === userNickname).map(post => {
                const hasHaves = post.haves && post.haves.length > 0;
                const hasWants = post.wants && post.wants.length > 0;
                return (
                  <div 
                    key={post.id}
                    style={{
                      background: 'var(--card-bg)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '0.85rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      opacity: post.is_completed ? 0.6 : 1,
                      transition: 'opacity 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {new Date(post.created_at).toLocaleDateString()} {post.is_completed && <strong style={{ color: '#fbbf24', marginLeft: '4px' }}>[완료]</strong>}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={() => handleTogglePostComplete(post.id, post.is_completed)}
                          style={{ background: 'none', border: 'none', color: post.is_completed ? '#86efac' : '#fca5a5', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 'bold' }}
                          title={post.is_completed ? "거래중 상태로 복구" : "거래 완료 상태로 변경"}
                        >
                          {post.is_completed ? "복원" : "완료"}
                        </button>
                        <button
                          onClick={() => {
                            setIsMyInfoOpen(false);
                            handleOpenEditModal(post);
                          }}
                          style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 'bold' }}
                          title="글 수정"
                        >
                          수정
                        </button>
                        <button 
                          onClick={() => handleDeletePost(post.id)}
                          style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          title="글 삭제"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem' }}>
                      {hasHaves && (
                        <div>
                          <span style={{ color: '#10b981', fontWeight: 'bold' }}>🟢 줄 수 있는 스티커: </span>
                          <span style={{ color: '#a7f3d0' }}>
                            {post.haves.map(id => {
                              const [catId, s] = id.split('-');
                              const cat = categories.find(c => String(c.id) === catId);
                              return cat ? `${cat.name} ${s}번` : `${catId}페이지 ${s}번`;
                            }).join(', ')}
                          </span>
                        </div>
                      )}
                      {hasWants && (
                        <div>
                          <span style={{ color: '#ef4444', fontWeight: 'bold' }}>🔴 받고 싶은 스티커: </span>
                          <span style={{ color: '#fca5a5' }}>
                            {post.wants.map(id => {
                              const [catId, s] = id.split('-');
                              const cat = categories.find(c => String(c.id) === catId);
                              return cat ? `${cat.name} ${s}번` : `${catId}페이지 ${s}번`;
                            }).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {posts.filter(p => p.nickname === userNickname).length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '2rem 0' }}>
                  등록된 교환 글이 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
