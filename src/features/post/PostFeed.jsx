import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Sparkles, Trash2, MessageSquare, MessageCircle, Globe } from 'lucide-react';
import { stickersData, categories } from '../../stickersData';
import { decodeHTML } from '../../utils/security';
import { AdBanner } from '../../components/AdBanner';
import { useLanguage } from '../../contexts/LanguageContext';
import { dbService } from '../../supabaseClient';

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
  setShowLoginModal,
  theme,
  
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
  togglePostExpand,
  handleTogglePostComplete,
  setIsFormOpen
}) {
  const { language, t } = useLanguage();
  const [translatedPosts, setTranslatedPosts] = useState({}); // { [postId]: { text: string, isTranslating: boolean, showTranslated: boolean } }
  
  const handleTranslatePost = async (postId, textToTranslate) => {
    if (translatedPosts[postId]?.text) {
      setTranslatedPosts(prev => ({
        ...prev,
        [postId]: { ...prev[postId], showTranslated: !prev[postId].showTranslated }
      }));
      return;
    }

    setTranslatedPosts(prev => ({
      ...prev,
      [postId]: { text: '', isTranslating: true, showTranslated: true }
    }));

    try {
      const targetLang = language === 'ko' ? 'English' : 'Korean';
      const prompt = `Translate the following text into ${targetLang}. Keep the style natural and friendly. Only return the translated text without any explanations.\n\nText: "${textToTranslate}"`;
      
      const result = await dbService.callOpenAI(prompt);
      
      setTranslatedPosts(prev => ({
        ...prev,
        [postId]: { text: result || 'Translation failed.', isTranslating: false, showTranslated: true }
      }));
    } catch (err) {
      console.error(err);
      setTranslatedPosts(prev => ({
        ...prev,
        [postId]: { text: 'Error occurred during translation.', isTranslating: false, showTranslated: true }
      }));
    }
  };

  const isLight = theme === 'light';
  const [filterMatchedOnly, setFilterMatchedOnly] = useState(false);
  const [filterExchangeableOnly, setFilterExchangeableOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 8;

  // 필터 및 검색어 변경 시 페이지 1로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [filterMatchedOnly, filterExchangeableOnly, searchQuery]);

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
              <span style={{ color: 'var(--text-secondary)' }}>{cardNames}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // 검색 및 필터링 계산
  const filteredPosts = posts.filter(post => {
    // 현 접속중(onlineUsers에 닉네임이 포함된) 사람들의 글만 필터링
    if (filterMatchedOnly && !onlineUsers.includes(post.nickname)) {
      return false;
    }

    // 교환 가능(완전 매칭) 글만 필터링
    if (filterExchangeableOnly) {
      const { isPerfectMatch } = checkMatching(post);
      if (!isPerfectMatch) {
        return false;
      }
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

  // 페이지네이션 슬라이싱 계산
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  return (
    <>
      {/* 교환소 피드 상단 후원 광고 배너 */}
      <AdBanner type="horizontal" />

      {/* 검색 및 필터 바 */}
      <div className="content-width" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', margin: '0 auto 1.5rem auto' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            className={`btn ${(!filterMatchedOnly && !filterExchangeableOnly) ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => {
              setFilterMatchedOnly(false);
              setFilterExchangeableOnly(false);
            }}
          >
            {t('viewAllPosts')}
          </button>
          <button 
            className={`btn ${filterMatchedOnly ? 'btn-secondary' : 'btn-outline'}`}
            onClick={() => {
              setFilterMatchedOnly(prev => !prev);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399', display: 'inline-block' }}></span> 
            {t('onlineUsersOnly')}
          </button>
          <button 
            className={`btn ${filterExchangeableOnly ? 'btn-secondary' : 'btn-outline'}`}
            onClick={() => {
              setFilterExchangeableOnly(prev => !prev);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Sparkles size={14} color={filterExchangeableOnly ? 'var(--primary-color)' : 'var(--text-primary)'} />
            {t('exchangeableOnly')}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: 1, justifySelf: 'flex-end', maxWidth: '500px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <input 
              type="text" 
              placeholder={t('searchByNicknameOrCategory')} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingRight: '2.5rem' }}
            />
            <Search size={18} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          {/* 교환글 등록 버튼 */}
          <button 
            className="btn btn-primary"
            onClick={() => {
              if (!userNickname) {
                setShowLoginModal(true);
              } else {
                setIsFormOpen(true);
              }
            }}
            style={{ padding: '0.72rem 1.1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
          >
            {t('writePost')}
          </button>

          <button 
            className="btn btn-outline" 
            onClick={fetchData} 
            title={t('refresh')}
            style={{ padding: '0.75rem' }}
          >
            <RefreshCw size={18} className={loading ? 'spin-anim' : ''} />
          </button>
        </div>
      </div>

      {/* 등록된 글 피드 그리드 */}
      {loading ? (
        <div className="content-width" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 0', gap: '1rem' }}>
          <RefreshCw size={32} className="spin-anim" />
          <p>{t('loadingExchangeFeeds')}</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="glass-card content-width" style={{ padding: '4rem 2rem', color: 'var(--text-secondary)', textAlign: 'center', margin: '0 auto' }}>
          {t('noExchangePosts')}
        </div>
      ) : (
        <div className="grid-container content-width" style={{ margin: '0 auto' }}>
          {currentPosts.map(post => {
            const isMyPost = userNickname && post.nickname === userNickname;
            const { isPerfectMatch, isPartialMatch, myWantsMatch, myHavesMatch } = checkMatching(post);
            const hasHaves = post.haves && post.haves.length > 0;
            const hasWants = post.wants && post.wants.length > 0;

            let cardBorder = '1px solid var(--border-color)';
            let cardShadow = 'var(--shadow-main)';
            let cardBackground = 'var(--card-bg)';
            
            if (isPerfectMatch) {
              cardBorder = '2px solid var(--perfect-match-border)';
              cardShadow = 'var(--perfect-match-shadow)';
              cardBackground = 'var(--perfect-match-bg)';
            } else if (isPartialMatch) {
              cardBorder = '1.5px solid var(--partial-match-border)';
              cardShadow = 'var(--partial-match-shadow)';
              cardBackground = 'var(--partial-match-bg)';
            }

            return (
              <div 
                key={post.id} 
                className="glass-card"
                style={{ 
                  textAlign: 'left', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between', 
                  border: cardBorder, 
                  boxShadow: cardShadow, 
                  background: cardBackground, 
                  minHeight: '260px',
                  opacity: post.is_completed ? 0.6 : 1,
                  transition: 'opacity 0.2s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: '800', fontSize: '1.05rem', color: 'var(--text-primary)' }}>{post.nickname}</span>
                        
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
                        {post.is_completed && <span className="badge" style={{ background: '#6b7280', color: '#fff', fontWeight: 'bold' }}>✓ 거래 완료</span>}
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

                  {/* 연락처 정보 텍스트 직접 노출 & AI 번역 */}
                  {post.contact && post.contact.trim() && (
                    <div style={{ 
                      margin: '0 0 0.85rem 0', 
                      fontSize: '0.82rem', 
                      color: 'var(--text-secondary)',
                      lineHeight: '1.4',
                      padding: '0.65rem 0.85rem',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.04)',
                      borderRadius: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '700', color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                          💬 {t('contact')}
                        </span>
                        
                        {/* AI 번역 토글 버튼 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTranslatePost(post.id, post.contact);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary-color)',
                            cursor: 'pointer',
                            fontSize: '0.72rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            padding: '2px 4px',
                            borderRadius: '4px',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                        >
                          <Globe size={11} /> 
                          {translatedPosts[post.id]?.showTranslated ? t('showOriginal') : t('translate')}
                        </button>
                      </div>
                      
                      <div style={{ wordBreak: 'break-all', fontWeight: '500' }}>
                        {decodeHTML(post.contact)}
                      </div>

                      {/* AI 번역 결과 패널 */}
                      {translatedPosts[post.id]?.showTranslated && (
                        <div style={{ 
                          marginTop: '4px', 
                          paddingTop: '6px', 
                          borderTop: '1.5px dashed rgba(255, 255, 255, 0.06)',
                          fontSize: '0.8rem',
                          color: 'var(--text-primary)',
                          background: 'rgba(133, 195, 0, 0.03)',
                          padding: '6px 8px',
                          borderRadius: '8px',
                          border: '1px dashed rgba(133, 195, 0, 0.15)',
                          transition: 'all 0.3s ease'
                        }}>
                          <div style={{ fontSize: '0.68rem', color: 'var(--primary-color)', fontWeight: 'bold', marginBottom: '2px' }}>
                            {t('translationResult')}
                          </div>
                          {translatedPosts[post.id]?.isTranslating ? (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>{t('translating')}</span>
                          ) : (
                            <span style={{ fontWeight: '500' }}>{translatedPosts[post.id]?.text}</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

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
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-primary)', fontWeight: '600' }}>
                            {t('exchangeStickersList')} ({post.haves.length + post.wants.length}{language === 'ko' ? '개' : ''})
                          </span>
                          <span style={{ fontSize: '0.7rem', color: isExpanded ? '#fca5a5' : '#86efac' }}>
                            {isExpanded ? t('collapse') : t('viewDetails')}
                          </span>
                        </div>

                        {isExpanded && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1rem', borderLeft: '2px solid rgba(255, 255, 255, 0.05)', paddingLeft: '0.75rem', marginLeft: '0.2rem' }}>
                            {hasHaves && (
                              <div>
                                <div style={{ fontSize: '0.78rem', color: isLight ? '#047857' : '#34d399', fontWeight: '700', marginBottom: '0.2rem' }}>{t('stickersToGive')}</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                                  {post.haves.map(id => {
                                    const [catId, s] = id.split('-');
                                    const cat = categories.find(c => String(c.id) === catId);
                                    const isStickerGolden = stickersData.find(st => st.id === id)?.isGolden;
                                    const tagStyle = isStickerGolden 
                                      ? { background: isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.15)', borderColor: isLight ? '#fde68a' : 'rgba(245, 158, 11, 0.45)', color: isLight ? '#b45309' : '#fbbf24', fontSize: '0.72rem', padding: '0.25rem 0.45rem', fontWeight: '700', boxShadow: isLight ? '0 1px 3px rgba(180, 83, 9, 0.1)' : '0 0 6px rgba(245, 158, 11, 0.25)' }
                                      : { background: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.1)', borderColor: isLight ? '#a7f3d0' : 'rgba(16, 185, 129, 0.25)', color: isLight ? '#047857' : '#a7f3d0', fontSize: '0.72rem', padding: '0.25rem 0.45rem', fontWeight: isLight ? '600' : 'normal' };
                                    return (
                                      <span key={id} className="sticker-tag" style={tagStyle}>
                                        {isStickerGolden && '👑 '}
                                        {cat 
                                          ? (language === 'ko' ? `${cat.name} ${s}번` : `${cat.name} #${s}`)
                                          : (language === 'ko' ? `${catId}페이지 ${s}번` : `${t('pageWord')} ${catId} #${s}`)}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {hasWants && (
                              <div>
                                <div style={{ fontSize: '0.78rem', color: isLight ? '#b91c1c' : '#f87171', fontWeight: '700', marginBottom: '0.2rem' }}>{t('stickersToGet')}</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                                  {post.wants.map(id => {
                                    const [catId, s] = id.split('-');
                                    const cat = categories.find(c => String(c.id) === catId);
                                    const isStickerGolden = stickersData.find(st => st.id === id)?.isGolden;
                                    const tagStyle = isStickerGolden 
                                      ? { background: isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.15)', borderColor: isLight ? '#fde68a' : 'rgba(245, 158, 11, 0.45)', color: isLight ? '#b45309' : '#fbbf24', fontSize: '0.72rem', padding: '0.25rem 0.45rem', fontWeight: '700', boxShadow: isLight ? '0 1px 3px rgba(180, 83, 9, 0.1)' : '0 0 6px rgba(245, 158, 11, 0.25)' }
                                      : { background: isLight ? '#fff5f5' : 'rgba(239, 68, 68, 0.1)', borderColor: isLight ? '#fecaca' : 'rgba(239, 68, 68, 0.25)', color: isLight ? '#b91c1c' : '#fca5a5', fontSize: '0.72rem', padding: '0.25rem 0.45rem', fontWeight: isLight ? '600' : 'normal' };
                                    return (
                                      <span key={id} className="sticker-tag" style={tagStyle}>
                                        {isStickerGolden && '👑 '}
                                        {cat 
                                          ? (language === 'ko' ? `${cat.name} ${s}번` : `${cat.name} #${s}`)
                                          : (language === 'ko' ? `${catId}페이지 ${s}번` : `${t('pageWord')} ${catId} #${s}`)}
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
                    <div style={{ background: isLight ? '#f9fafb' : 'rgba(255, 255, 255, 0.03)', border: isLight ? '1px solid #e5e7eb' : '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '0.5rem 0.65rem', marginBottom: '0.85rem', fontSize: '0.76rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {myWantsMatch.length > 0 && (
                        <div>
                          <div style={{ fontWeight: '700', color: isLight ? '#047857' : '#34d399', marginBottom: '2px' }}>{t('myWantsMatchText')}</div>
                          {renderMatchCardsByStars(myWantsMatch)}
                        </div>
                      )}
                      {myHavesMatch.length > 0 && (
                        <div style={{ marginTop: myWantsMatch.length > 0 ? '4px' : '0' }}>
                          <div style={{ fontWeight: '700', color: isLight ? '#b91c1c' : '#f87171', marginBottom: '2px' }}>{t('myHavesMatchText')}</div>
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
                      onClick={() => {
                        if (!userNickname) {
                          setShowLoginModal(true);
                        } else {
                          handleStartChat(post);
                        }
                      }}
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                      <MessageSquare size={14} /> {t('oneOnOneChat')}
                    </button>
                  )}
                  
                  {post.contact && post.contact.trim() && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const decodedContact = decodeHTML(post.contact.trim());
                        const url = decodedContact.startsWith('http') ? decodedContact : `https://${decodedContact}`;
                        window.open(url, '_blank', 'noopener,noreferrer');
                      }}
                      className="btn"
                      style={{ 
                        flex: 1, 
                        padding: '0.5rem 1rem', 
                        fontSize: '0.85rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '4px', 
                        background: isLight ? '#eff6ff' : 'rgba(59, 130, 246, 0.1)',
                        border: isLight ? '1px solid #bfdbfe' : '1px solid rgba(59, 130, 246, 0.25)',
                        color: isLight ? '#1e40af' : '#60a5fa',
                        fontWeight: 'bold',
                        transition: 'all 0.2s',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = isLight ? '#1e40af' : '#3b82f6';
                        e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = isLight ? '#eff6ff' : 'rgba(59, 130, 246, 0.1)';
                        e.currentTarget.style.color = isLight ? '#1e40af' : '#60a5fa';
                      }}
                    >
                      <MessageCircle size={14} /> {t('contactText')}
                    </button>
                  )}
                  
                  {!isMyPost && (
                    <button
                      className="btn btn-outline"
                      onClick={() => handleOpenReportModal('post', post.id, `${post.nickname}의 교환글`)}
                      style={{ padding: '0.5rem 0.6rem', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title={language === 'ko' ? "게시글 신고하기" : "Report Post"}
                    >
                      🚨
                    </button>
                  )}

                  {!isMyPost && userNickname === '간장' && (
                    <button 
                      className="btn btn-outline" 
                      onClick={() => handleAdminDeletePost(post.id)}
                      style={{ padding: '0.5rem', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)', flexShrink: 0 }}
                      title={language === 'ko' ? "관리자 강제 삭제" : "Admin Delete"}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  
                  {isMyPost && (
                    <div style={{ display: 'flex', gap: '4px', width: '100%', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <button 
                        className="btn btn-outline" 
                        onClick={() => handleTogglePostComplete(post.id, post.is_completed)}
                        style={{ padding: '0.5rem 0.85rem', fontSize: '0.82rem', color: post.is_completed ? '#fca5a5' : '#86efac', borderColor: post.is_completed ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)', fontWeight: 'bold' }}
                        title={post.is_completed ? (language === 'ko' ? "거래중 상태로 돌리기" : "Set Active") : (language === 'ko' ? "거래 완료 상태로 변경" : "Set Completed")}
                      >
                        {post.is_completed ? t('restore') : t('complete')}
                      </button>
                      <button 
                        className="btn btn-outline" 
                        onClick={() => handleOpenEditModal(post)}
                        style={{ padding: '0.5rem 0.85rem', fontSize: '0.82rem', color: '#60a5fa', borderColor: 'rgba(96, 165, 250, 0.3)', fontWeight: 'bold' }}
                        title={language === 'ko' ? "글 수정하기" : "Edit Post"}
                      >
                        {language === 'ko' ? "수정" : "Edit"}
                      </button>
                      <button 
                        className="btn btn-outline" 
                        onClick={() => handleBumpPost(post.id)}
                        style={{ padding: '0.5rem 0.85rem', fontSize: '0.82rem', color: 'var(--primary-color)', borderColor: 'rgba(133, 195, 0, 0.3)', fontWeight: 'bold' }}
                        title={language === 'ko' ? "글 맨 위로 끌어올리기" : "Bump post to top"}
                      >
                        {language === 'ko' ? "끌올" : "Bump"}
                      </button>
                      <button 
                        className="btn btn-outline" 
                        onClick={() => handleDeletePost(post.id)}
                        style={{ padding: '0.5rem', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                        title={language === 'ko' ? "내 글 삭제" : "Delete My Post"}
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
                    💬 {language === 'ko' ? "댓글" : "Comments"} ({post.commentCount ?? (comments[post.id] ? comments[post.id].length : 0)})
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
                                  <span style={{ fontWeight: '700', color: comment.nickname === post.nickname ? 'var(--primary-color)' : 'var(--text-primary)' }}>{comment.nickname}</span>
                                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                    {new Date(comment.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <span style={{ color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{decodeHTML(comment.text)}</span>
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
                          placeholder="댓글을 작성하세요... (로그인 필요)"
                          readOnly={!userNickname}
                          onClick={() => {
                            if (!userNickname) {
                              setShowLoginModal(true);
                            }
                          }}
                          value={commentInputs[post.id] || ''}
                          onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                          style={{ flex: 1, padding: '0.35rem 0.65rem', fontSize: '0.78rem', height: '32px', cursor: !userNickname ? 'pointer' : 'text' }}
                        />
                        <button 
                          type="submit" 
                          onClick={(e) => {
                            if (!userNickname) {
                              e.preventDefault();
                              setShowLoginModal(true);
                            }
                          }}
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

      {/* 페이지네이션 제어 UI */}
      {!loading && totalPages > 1 && (
        (() => {
          const getPageNumbers = () => {
            const pageLimit = 5;
            let startPage = Math.max(1, currentPage - Math.floor(pageLimit / 2));
            let endPage = Math.min(totalPages, startPage + pageLimit - 1);

            if (endPage - startPage + 1 < pageLimit) {
              startPage = Math.max(1, endPage - pageLimit + 1);
            }

            const pages = [];
            for (let i = startPage; i <= endPage; i++) {
              pages.push(i);
            }
            return pages;
          };

          return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '2rem', marginBottom: '3rem', width: '100%', flexWrap: 'wrap' }}>
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="btn btn-outline"
                style={{ padding: '0.45rem 0.65rem', fontSize: '0.75rem', opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                title="맨 처음 페이지로"
              >
                «
              </button>

              <button
                onClick={() => {
                  setCurrentPage(prev => Math.max(prev - 1, 1));
                }}
                disabled={currentPage === 1}
                className="btn btn-outline"
                style={{ padding: '0.45rem 0.8rem', fontSize: '0.8rem', opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
              >
                이전
              </button>
              
              {getPageNumbers().map(pageNumber => (
                <button
                  key={pageNumber}
                  onClick={() => {
                    setCurrentPage(pageNumber);
                  }}
                  className={`btn ${currentPage === pageNumber ? 'btn-primary' : 'btn-outline'}`}
                  style={{
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.8rem',
                    minWidth: '32px',
                    border: currentPage === pageNumber ? '1px solid var(--primary-color)' : '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                  {pageNumber}
                </button>
              ))}
     
              <button
                onClick={() => {
                  setCurrentPage(prev => Math.min(prev + 1, totalPages));
                }}
                disabled={currentPage === totalPages}
                className="btn btn-outline"
                style={{ padding: '0.45rem 0.8rem', fontSize: '0.8rem', opacity: currentPage === totalPages ? 0.4 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
              >
                다음
              </button>

              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="btn btn-outline"
                style={{ padding: '0.45rem 0.65rem', fontSize: '0.75rem', opacity: currentPage === totalPages ? 0.4 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                title="맨 끝 페이지로"
              >
                »
              </button>
            </div>
          );
        })()
      )}
    </>
  );
}
