import React, { useState } from 'react';
import { Search, RefreshCw, Sparkles, Trash2, MessageSquare, MessageCircle } from 'lucide-react';
import { stickersData, categories } from '../stickersData';

export function PostFeed({
  posts,
  loading,
  userNickname,
  myPostIds,
  myHaves,
  myWants,
  onlineUsers,
  fetchData,
  handleBumpPost,
  handleDeletePost,
  handleOpenEditModal,
  handleStartChat,
  handleOpenReportModal,
  handleAdminDeletePost,
  
  // 댓글 관련
  comments,
  commentInputs,
  setCommentInputs,
  expandedComments,
  toggleComments,
  handleAddComment,
  handleDeleteComment,

  // 매칭 엔진 및 아코디언
  checkMatching,
  expandedPostIds,
  togglePostExpand
}) {
  const [filterMatchedOnly, setFilterMatchedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 별 개수별 카드 매칭 묶어 보여주기 헬퍼 함수
  const renderMatchCardsByStars = (matchArray) => {
    if (!matchArray || matchArray.length === 0) return null;
    
    // 별 등급별 그룹화
    const groups = {};
    matchArray.forEach(id => {
      const sticker = stickersData.find(s => s.id === id);
      const stars = sticker ? sticker.stars : 1;
      if (!groups[stars]) {
        groups[stars] = [];
      }
      groups[stars].push(id);
    });

    const sortedStars = Object.keys(groups).map(Number).sort((a, b) => b - a);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '3px', paddingLeft: '0.5rem', borderLeft: '1.5px dashed rgba(255,255,255,0.1)' }}>
        {sortedStars.map(stars => {
          const cardNames = groups[stars].map(id => {
            const [catId, s] = id.split('-');
            const cat = categories.find(c => String(c.id) === catId);
            const sticker = stickersData.find(st => st.id === id);
            const isGolden = sticker ? sticker.isGolden : false;
            return `${cat ? cat.name : `${catId}페이지`} ${s}번${isGolden ? '👑' : ''}`;
          }).join(', ');
          
          return (
            <div key={stars} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.74rem' }}>
              <span style={{ color: '#fbbf24', fontWeight: 'bold', flexShrink: 0 }}>★{stars}성:</span>
              <span style={{ color: '#d1d5db' }}>{cardNames}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // 검색 및 필터링 계산
  const filteredPosts = posts.filter(post => {
    const { isPerfectMatch, isPartialMatch } = checkMatching(post);

    if (filterMatchedOnly && !isPerfectMatch && !isPartialMatch) {
      return false;
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const nicknameMatch = post.nickname.toLowerCase().includes(query);

      const itemsMatch = [...(post.haves || []), ...(post.wants || [])].some(id => {
        const [catId, slot] = id.split('-');
        const cat = categories.find(c => String(c.id) === catId);
        const nameMatch = cat ? cat.name.toLowerCase().includes(query) : false;
        return id.includes(query) || nameMatch || `${cat?.name} ${slot}번`.toLowerCase().includes(query);
      });

      return nicknameMatch || itemsMatch;
    }
    return true;
  });

  return (
    <>
      {/* 검색 및 필터 바 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', width: '100%', maxWidth: '800px', margin: '0 auto 1.5rem auto' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className={`btn ${!filterMatchedOnly ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilterMatchedOnly(false)}
          >
            전체 등록글 보기
          </button>
          <button 
            className={`btn ${filterMatchedOnly ? 'btn-secondary' : 'btn-outline'}`}
            onClick={() => setFilterMatchedOnly(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <Sparkles size={16} /> 실시간 매칭글만 보기
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: 1, justifySelf: 'flex-end', maxWidth: '400px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <input 
              type="text" 
              placeholder="닉네임 또는 카테고리 검색..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingRight: '2.5rem' }}
            />
            <Search size={18} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
          <button 
            className="btn btn-outline" 
            onClick={fetchData} 
            title="새로고침"
            style={{ padding: '0.75rem' }}
          >
            <RefreshCw size={18} className={loading ? 'spin-anim' : ''} />
          </button>
        </div>
      </div>

      {/* 등록된 글 피드 그리드 */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 0', gap: '1rem', width: '100%' }}>
          <RefreshCw size={32} className="spin-anim" />
          <p>교환 피드 데이터 로딩 중...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="glass-card" style={{ padding: '4rem 2rem', color: 'var(--text-secondary)', textAlign: 'center', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
          조건에 맞는 교환 글이 존재하지 않습니다.<br />
          상단의 버튼을 눌러 스티커 정보를 올리고 기다려보세요!
        </div>
      ) : (
        <div className="grid-container" style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
          {filteredPosts.map(post => {
            const isMyPost = userNickname && post.nickname === userNickname;
            const { isPerfectMatch, isPartialMatch, myWantsMatch, myHavesMatch } = checkMatching(post);
            const hasHaves = post.haves && post.haves.length > 0;
            const hasWants = post.wants && post.wants.length > 0;

            let cardBorder = '1px solid rgba(255, 255, 255, 0.08)';
            let cardShadow = 'none';
            let cardBackground = 'var(--card-bg)';
            
            if (isPerfectMatch) {
              cardBorder = '2px solid #a855f7';
              cardShadow = '0 0 20px rgba(168, 85, 247, 0.3)';
              cardBackground = 'rgba(168, 85, 247, 0.05)';
            } else if (isPartialMatch) {
              cardBorder = '1.5px solid rgba(245, 158, 11, 0.6)';
              cardShadow = '0 0 12px rgba(245, 158, 11, 0.15)';
              cardBackground = 'rgba(245, 158, 11, 0.03)';
            }

            return (
              <div 
                key={post.id} 
                className="glass-card"
                style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: cardBorder, boxShadow: cardShadow, background: cardBackground, minHeight: '260px' }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: '800', fontSize: '1.05rem', color: '#fff' }}>{post.nickname}</span>
                        
                        {/* 접속 정보 */}
                        {onlineUsers.includes(post.nickname) ? (
                          <span style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '3px', 
                            fontSize: '0.68rem', 
                            color: '#34d399', 
                            background: 'rgba(52, 211, 153, 0.08)',
                            border: '1px solid rgba(52, 211, 153, 0.25)', 
                            padding: '1px 6px', 
                            borderRadius: '4px',
                            fontWeight: '600'
                          }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 5px #10b981', display: 'inline-block' }}></span>
                            온라인
                          </span>
                        ) : (
                          <span style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '3px', 
                            fontSize: '0.68rem', 
                            color: 'var(--text-muted)', 
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.08)', 
                            padding: '1px 6px', 
                            borderRadius: '4px'
                          }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6b7280', display: 'inline-block' }}></span>
                            오프라인
                          </span>
                        )}

                        {isMyPost && <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}>내 글</span>}
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {new Date(post.created_at).toLocaleString('ko-KR', { hour12: false }).slice(0, -3)}
                      </span>
                    </div>

                    {isPerfectMatch ? (
                      <span className="badge" style={{ background: '#a855f7', color: '#fff', fontWeight: 'bold', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        ⚡ 교환 가능
                      </span>
                    ) : isPartialMatch ? (
                      <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', fontWeight: 'bold', fontSize: '0.75rem' }}>
                        💡 부분 매칭
                      </span>
                    ) : null}
                  </div>

                  {/* 아코디언 토글 헤더 */}
                  {(() => {
                    const isExpanded = expandedPostIds.includes(post.id);
                    return (
                      <>
                        <div 
                          onClick={() => togglePostExpand(post.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            borderRadius: '8px',
                            padding: '0.45rem 0.75rem',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            color: 'var(--text-muted)',
                            userSelect: 'none',
                            transition: 'all 0.2s ease',
                            marginBottom: '0.85rem'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fff', fontWeight: '600' }}>
                            📦 교환 카드 목록 ({post.haves.length + post.wants.length}개)
                          </span>
                          <span style={{ fontSize: '0.7rem', color: isExpanded ? '#fca5a5' : '#86efac' }}>
                            {isExpanded ? '접기 ▲' : '자세히 보기 ▼'}
                          </span>
                        </div>

                        {isExpanded && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1rem', borderLeft: '2px solid rgba(255, 255, 255, 0.05)', paddingLeft: '0.75rem', marginLeft: '0.2rem' }}>
                            {hasHaves && (
                              <div>
                                <div style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: '700', marginBottom: '0.2rem' }}>🟢 줄 수 있는 카드</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                                  {post.haves.map(id => {
                                    const [catId, s] = id.split('-');
                                    const cat = categories.find(c => String(c.id) === catId);
                                    const isStickerGolden = stickersData.find(st => st.id === id)?.isGolden;
                                    const tagStyle = isStickerGolden 
                                      ? { background: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.45)', color: '#fbbf24', fontSize: '0.72rem', padding: '0.25rem 0.45rem', fontWeight: '700', boxShadow: '0 0 6px rgba(245, 158, 11, 0.25)' }
                                      : { background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.25)', color: '#a7f3d0', fontSize: '0.72rem', padding: '0.25rem 0.45rem' };
                                    return (
                                      <span key={id} className="sticker-tag" style={tagStyle}>
                                        {isStickerGolden && '👑 '}{cat ? cat.name : `${catId}페이지`} {s}번
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {hasWants && (
                              <div>
                                <div style={{ fontSize: '0.78rem', color: '#f87171', fontWeight: '700', marginBottom: '0.2rem' }}>🔴 받고 싶은 카드</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                                  {post.wants.map(id => {
                                    const [catId, s] = id.split('-');
                                    const cat = categories.find(c => String(c.id) === catId);
                                    const isStickerGolden = stickersData.find(st => st.id === id)?.isGolden;
                                    const tagStyle = isStickerGolden 
                                      ? { background: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.45)', color: '#fbbf24', fontSize: '0.72rem', padding: '0.25rem 0.45rem', fontWeight: '700', boxShadow: '0 0 6px rgba(245, 158, 11, 0.25)' }
                                      : { background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.25)', color: '#fca5a5', fontSize: '0.72rem', padding: '0.25rem 0.45rem' };
                                    return (
                                      <span key={id} className="sticker-tag" style={tagStyle}>
                                        {isStickerGolden && '👑 '}{cat ? cat.name : `${catId}페이지`} {s}번
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {/* 매칭 요약 */}
                  {(isPerfectMatch || isPartialMatch) && (
                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '0.5rem 0.65rem', marginBottom: '0.85rem', fontSize: '0.76rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {myWantsMatch.length > 0 && (
                        <div>
                          <div style={{ fontWeight: '700', color: '#34d399', marginBottom: '2px' }}>🎁 내가 받을 수 있는 카드: </div>
                          {renderMatchCardsByStars(myWantsMatch)}
                        </div>
                      )}
                      {myHavesMatch.length > 0 && (
                        <div style={{ marginTop: myWantsMatch.length > 0 ? '4px' : '0' }}>
                          <div style={{ fontWeight: '700', color: '#f87171', marginBottom: '2px' }}>✅ 내가 줄 수 있는 카드: </div>
                          {renderMatchCardsByStars(myHavesMatch)}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 액션 버튼 */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', flexWrap: 'wrap' }}>
                  {!isMyPost && (
                    <button 
                      onClick={() => handleStartChat(post)}
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                      <MessageSquare size={14} /> 1:1 채팅
                    </button>
                  )}
                  
                  {post.contact && post.contact.trim() && (
                    <a 
                      href={post.contact.startsWith('http') ? post.contact : `https://${post.contact}`}
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                      <MessageCircle size={14} /> 연락하기
                    </a>
                  )}
                  
                  {!isMyPost && (
                    <button
                      className="btn btn-outline"
                      onClick={() => handleOpenReportModal('post', post.id, `${post.nickname}의 교환글`)}
                      style={{ padding: '0.5rem 0.6rem', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="게시글 신고하기"
                    >
                      🚨
                    </button>
                  )}

                  {!isMyPost && userNickname === '간장' && (
                    <button 
                      className="btn btn-outline" 
                      onClick={() => handleAdminDeletePost(post.id)}
                      style={{ padding: '0.5rem', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)', flexShrink: 0 }}
                      title="관리자 강제 삭제"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  
                  {isMyPost && (
                    <div style={{ display: 'flex', gap: '4px', width: '100%', justifyContent: 'flex-end' }}>
                      <button 
                        className="btn btn-outline" 
                        onClick={() => handleOpenEditModal(post)}
                        style={{ padding: '0.5rem 0.85rem', fontSize: '0.82rem', color: '#60a5fa', borderColor: 'rgba(96, 165, 250, 0.3)', fontWeight: 'bold' }}
                        title="글 수정하기"
                      >
                        수정
                      </button>
                      <button 
                        className="btn btn-outline" 
                        onClick={() => handleBumpPost(post.id)}
                        style={{ padding: '0.5rem 0.85rem', fontSize: '0.82rem', color: 'var(--primary-color)', borderColor: 'rgba(133, 195, 0, 0.3)', fontWeight: 'bold' }}
                        title="글 맨 위로 끌어올리기"
                      >
                        끌올
                      </button>
                      <button 
                        className="btn btn-outline" 
                        onClick={() => handleDeletePost(post.id)}
                        style={{ padding: '0.5rem', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                        title="내 글 삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* 댓글 영역 */}
                <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <button 
                    onClick={() => toggleComments(post.id)}
                    style={{ background: 'none', border: 'none', color: expandedComments[post.id] ? 'var(--primary-color)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', padding: '0 2px' }}
                  >
                    💬 댓글 {comments[post.id] ? `(${comments[post.id].length})` : '(보기)'}
                  </button>

                  {expandedComments[post.id] && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '150px', overflowY: 'auto', paddingRight: '2px' }}>
                        {comments[post.id]?.map(comment => {
                          const isCommentOwner = userNickname && comment.nickname === userNickname;
                          return (
                            <div key={comment.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'rgba(255,255,255,0.02)', padding: '0.4rem 0.5rem', borderRadius: '6px', fontSize: '0.78rem' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <span style={{ fontWeight: '700', color: comment.nickname === post.nickname ? 'var(--primary-color)' : '#fff' }}>{comment.nickname}</span>
                                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                    {new Date(comment.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <span style={{ color: 'rgba(255,255,255,0.85)', wordBreak: 'break-all' }}>{comment.text}</span>
                              </div>
                              <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                {!isCommentOwner && (
                                  <button 
                                    onClick={() => handleOpenReportModal('comment', comment.id, `${comment.nickname}의 댓글: ${comment.text.slice(0, 10)}...`)}
                                    style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '0.68rem', cursor: 'pointer', opacity: 0.6 }}
                                    title="댓글 신고"
                                  >
                                    신고
                                  </button>
                                )}
                                {(isCommentOwner || userNickname === '간장') && (
                                  <button 
                                    onClick={() => handleDeleteComment(comment.id, post.id)}
                                    style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '0.68rem', cursor: 'pointer' }}
                                    title="댓글 삭제"
                                  >
                                    삭제
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {(!comments[post.id] || comments[post.id].length === 0) && (
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', padding: '0.3rem 0.2rem' }}>아직 등록된 댓글이 없습니다.</div>
                        )}
                      </div>

                      <form onSubmit={(e) => handleAddComment(e, post.id)} style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                        <input 
                          type="text" 
                          placeholder={userNickname ? "댓글을 작성하세요..." : "로그인 후 댓글을 작성할 수 있습니다."}
                          disabled={!userNickname}
                          value={commentInputs[post.id] || ''}
                          onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                          style={{ flex: 1, padding: '0.35rem 0.65rem', fontSize: '0.78rem', height: '32px' }}
                        />
                        <button 
                          type="submit" 
                          disabled={!userNickname}
                          className="btn btn-primary" 
                          style={{ padding: '0 0.75rem', fontSize: '0.78rem', height: '32px', display: 'flex', alignItems: 'center' }}
                        >
                          등록
                        </button>
                      </form>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
