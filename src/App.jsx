import React, { useState, useEffect } from 'react';
import { dbService } from './supabaseClient';
import { stickersData, categories, getCategoryImage } from './stickersData';
import { 
  Sparkles, 
  ArrowLeft, 
  MessageCircle, 
  User, 
  RefreshCw, 
  Trash2, 
  Info, 
  Check, 
  Plus, 
  Search,
  ShoppingCart,
  Tag,
  BookOpen,
  X,
  HelpCircle
} from 'lucide-react';

function App() {
  // --- 상태 관리 ---
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbMode, setDbMode] = useState(dbService.isMock ? '로컬' : 'Supabase 실시간');

  // 사용자 모드: null (진입 대기), 'buyer' (구해요), 'seller' (팝니다)
  const [role, setRole] = useState(() => localStorage.getItem('dv3_role') || null);
  
  // 선택된 카테고리 ID (null 또는 1 ~ 20)
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  // 내 프로필 정보 (LocalStorage 연동)
  const [myNickname, setMyNickname] = useState(() => localStorage.getItem('dv3_my_nickname') || '');
  const [myContact, setMyContact] = useState(() => localStorage.getItem('dv3_my_contact') || '');
  
  // 내가 선택한 스티커 목록 (ID 배열 형태, 예: ['1-3', '2-5'])
  const [mySelectedStickers, setMySelectedStickers] = useState(() => {
    return JSON.parse(localStorage.getItem('dv3_selected_stickers')) || [];
  });

  // 검색 및 필터 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMatchedOnly, setFilterMatchedOnly] = useState(false);

  // 내가 작성한 글 ID 목록 (삭제 권한용)
  const [myPostIds, setMyPostIds] = useState(() => JSON.parse(localStorage.getItem('dv3_my_post_ids')) || []);

  // --- 최초 로드 및 동기화 ---
  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (role) {
      localStorage.setItem('dv3_role', role);
    } else {
      localStorage.removeItem('dv3_role');
    }
    localStorage.setItem('dv3_my_nickname', myNickname);
    localStorage.setItem('dv3_my_contact', myContact);
    localStorage.setItem('dv3_selected_stickers', JSON.stringify(mySelectedStickers));
  }, [role, myNickname, myContact, mySelectedStickers]);

  // --- 데이터 불러오기 ---
  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await dbService.fetchPosts();
    if (!error) {
      setPosts(data || []);
    }
    setLoading(false);
  };

  // --- 스티커 선택 핸들러 (토글 방식) ---
  const toggleStickerSelection = (stickerId) => {
    if (mySelectedStickers.includes(stickerId)) {
      setMySelectedStickers(mySelectedStickers.filter(id => id !== stickerId));
    } else {
      setMySelectedStickers([...mySelectedStickers, stickerId]);
    }
  };

  // --- 해당 카테고리에서 몇 개의 스티커가 선택되었는지 집계 ---
  const getSelectedCountInPage = (categoryId) => {
    return mySelectedStickers.filter(id => id.startsWith(`${categoryId}-`)).length;
  };

  // --- 교환 게시글 등록하기 ---
  const handleSubmitPost = async (e) => {
    e.preventDefault();
    if (!myNickname.trim() || !myContact.trim()) {
      alert("닉네임과 연락처(카톡 오픈챗 등)를 입력해주세요!");
      return;
    }
    if (mySelectedStickers.length === 0) {
      alert("최소 한 개 이상의 스티커를 스티커북에서 선택해 주세요!");
      return;
    }

    const haves = role === 'seller' ? mySelectedStickers : [];
    const wants = role === 'buyer' ? mySelectedStickers : [];
    const displayNickname = `${myNickname} [${role === 'seller' ? '판매자' : '구매자'}]`;

    const { data, error } = await dbService.addPost(
      displayNickname,
      myContact,
      haves,
      wants
    );

    if (error) {
      alert("등록에 실패했습니다. 다시 시도해 주세요.");
    } else {
      if (data && data[0]) {
        const newPostIds = [...myPostIds, data[0].id];
        setMyPostIds(newPostIds);
        localStorage.setItem('dv3_my_post_ids', JSON.stringify(newPostIds));
      }
      alert("성공적으로 교환 게시판에 등록되었습니다!");
      fetchData();
    }
  };

  // --- 게시글 삭제 ---
  const handleDeletePost = async (id) => {
    if (!window.confirm("정말 이 교환 요청글을 삭제하시겠습니까?")) return;
    const { error } = await dbService.removePost(id);
    if (!error) {
      const updatedPostIds = myPostIds.filter(postId => postId !== id);
      setMyPostIds(updatedPostIds);
      localStorage.setItem('dv3_my_post_ids', JSON.stringify(updatedPostIds));
      fetchData();
    } else {
      alert("삭제 실패: " + error.message);
    }
  };

  // --- 100% 매칭 엔진 연산 ---
  const checkMatching = (post) => {
    const postHaves = post.haves || [];
    const postWants = post.wants || [];

    let matchedItems = [];
    let isMatched = false;

    if (role === 'buyer') {
      matchedItems = postHaves.filter(id => mySelectedStickers.includes(id));
      isMatched = matchedItems.length > 0;
    } else if (role === 'seller') {
      matchedItems = postWants.filter(id => mySelectedStickers.includes(id));
      isMatched = matchedItems.length > 0;
    }

    return {
      isMatched,
      matchedItems,
      matchCount: matchedItems.length
    };
  };

  // 게시글 정보 정제
  const parsedPosts = posts.map(post => {
    const analysis = checkMatching(post);
    return { ...post, analysis };
  });

  // 필터링 적용
  const filteredPosts = parsedPosts.filter(post => {
    if (filterMatchedOnly && !post.analysis.isMatched) {
      return false;
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const nicknameMatch = post.nickname.toLowerCase().includes(query);
      
      // 검색 시 "야생몬스터 3번" 등으로 검색하거나 "1-3"으로 검색할 때 모두 대응
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

  // 선택된 카테고리 정보 찾기
  const currentCategory = categories.find(c => c.id === selectedCategoryId);

  return (
    <div className="app-container">
      {/* 헤더 */}
      <header>
        <div className="logo-container">
          <h1 className="logo-text">DRAGON VILLAGE 3</h1>
          <div className="sub-logo-text">STICKER BOOK MATCHING CENTER</div>
        </div>
        <div style={{ marginTop: '0.5rem' }}>
          <span className="badge badge-have" style={{ textTransform: 'none' }}>
            서버 연결: {dbMode}
          </span>
        </div>
      </header>

      {/* 역할이 지정되지 않은 첫 홈화면 (Landing Gateway) */}
      {role === null && (
        <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', margin: '3rem 0' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>원하시는 거래 역할을 선택해 주세요</h2>
          <p style={{ color: 'var(--text-secondary)' }}>스티커북 카테고리 매칭 시스템에 오신 것을 환영합니다.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', width: '100%', maxWidth: '700px' }} className="gateway-grid">
            <div 
              className="glass-card" 
              style={{ cursor: 'pointer', padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', borderColor: 'rgba(239, 68, 68, 0.3)' }}
              onClick={() => setRole('buyer')}
            >
              <ShoppingCart size={48} color="#ef4444" />
              <h3 style={{ fontSize: '1.5rem', margin: 0, color: '#f87171' }}>구해요 (구매자)</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                부족한 스티커를 카테고리별로 선택하여 구하는 글을 올립니다.
              </p>
            </div>

            <div 
              className="glass-card" 
              style={{ cursor: 'pointer', padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', borderColor: 'rgba(16, 185, 129, 0.3)' }}
              onClick={() => setRole('seller')}
            >
              <Tag size={48} color="#10b981" />
              <h3 style={{ fontSize: '1.5rem', margin: 0, color: '#34d399' }}>팝니다 (판매자)</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                남는 중복 스티커를 카테고리별로 선택하여 파는 글을 올립니다.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 역할이 정해졌을 때 노출되는 영역 */}
      {role !== null && (
        <>
          {/* 뒤로가기 및 역할 변경 단추 */}
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '1.5rem' }}>
            <button 
              className="btn btn-outline"
              onClick={() => {
                setRole(null);
                setSelectedCategoryId(null);
                setMySelectedStickers([]);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}
            >
              <ArrowLeft size={16} /> 역할 선택 홈으로 돌아가기 (선택 초기화)
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', textAlign: 'left', marginBottom: '2.5rem' }} className="main-work-grid">
            
            {/* 왼쪽 영역: 카테고리 리스트 또는 3x3 9 그리드 선택기 */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {selectedCategoryId === null ? (
                // 카테고리 목록 뷰
                <>
                  <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BookOpen size={20} color="var(--primary-color)" />
                    스티커북 카테고리 선택 ({role === 'buyer' ? '구하는' : '파는'} 스티커 추가)
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    정리된 20개 카테고리 목록입니다. 클릭하여 9칸 스티커 그리드를 열어보세요.
                  </p>

                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', 
                    gap: '1rem',
                    maxHeight: '450px',
                    overflowY: 'auto',
                    padding: '0.5rem'
                  }}>
                    {categories.map((cat) => {
                      const selectedCount = getSelectedCountInPage(cat.id);
                      const imgUrl = getCategoryImage(cat.image);
                      return (
                        <div 
                          key={cat.id}
                          className="glass-card"
                          style={{ 
                            padding: '0.5rem', 
                            cursor: 'pointer', 
                            position: 'relative', 
                            aspectRatio: '3/4',
                            overflow: 'hidden',
                            border: selectedCount > 0 ? '2px solid var(--primary-color)' : '1px solid var(--border-color)'
                          }}
                          onClick={() => setSelectedCategoryId(cat.id)}
                        >
                          {imgUrl ? (
                            <img 
                              src={imgUrl} 
                              alt={cat.name} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4, position: 'absolute', top: 0, left: 0 }}
                            />
                          ) : (
                            <div style={{ 
                              position: 'absolute', 
                              top: 0, 
                              left: 0, 
                              width: '100%', 
                              height: '100%', 
                              background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.4), rgba(15, 23, 42, 0.6))',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <HelpCircle size={28} color="rgba(255,255,255,0.2)" />
                            </div>
                          )}
                          <div style={{ 
                            position: 'absolute', 
                            inset: 0, 
                            display: 'flex', 
                            flexDirection: 'column', 
                            justifyContent: 'space-between',
                            padding: '0.5rem',
                            background: 'rgba(10, 8, 20, 0.45)'
                          }}>
                            <span style={{ fontWeight: '700', fontSize: '0.85rem', wordBreak: 'keep-all' }}>{cat.name}</span>
                            {selectedCount > 0 && (
                              <span className="badge badge-match" style={{ alignSelf: 'flex-start', animation: 'none', fontSize: '0.7rem' }}>
                                선택: {selectedCount}개
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                // 3x3 9 그리드 스티커 선택창
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <BookOpen size={20} color="var(--primary-color)" />
                      {currentCategory.name} (9 그리드)
                    </h2>
                    <button 
                      className="btn btn-outline" 
                      onClick={() => setSelectedCategoryId(null)}
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    >
                      <ArrowLeft size={12} /> 카테고리 목록
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }} className="grid-details-layout">
                    {/* 실물 도감 썸네일 미리보기 */}
                    <div style={{ width: '140px', flexShrink: 0, border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                      {getCategoryImage(currentCategory.image) ? (
                        <>
                          <img src={getCategoryImage(currentCategory.image)} alt="도감 실물" style={{ width: '100%', display: 'block' }} />
                          <div style={{ background: 'rgba(0,0,0,0.6)', padding: '0.25rem', fontSize: '0.75rem', textAlign: 'center' }}>실물 도감 대조</div>
                        </>
                      ) : (
                        <div style={{ 
                          height: '180px', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          padding: '1rem', 
                          background: 'rgba(255,255,255,0.05)',
                          textAlign: 'center',
                          gap: '0.5rem'
                        }}>
                          <HelpCircle size={32} color="var(--text-muted)" />
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            실물 캡쳐본<br />준비 중
                          </span>
                        </div>
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                        {getCategoryImage(currentCategory.image) 
                          ? "왼쪽 사진의 1번(좌상단)부터 9번(우하단) 슬롯 번호에 맞춰 원하는 자리를 선택해 주세요."
                          : "상세 이미지가 누락된 카테고리입니다. 인게임 3x3 구조(1~9번)에 맞춰 슬롯 번호를 선택해 주세요."
                        }
                      </p>
                      
                      {/* 3x3 바둑판 그리드 */}
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(3, 1fr)', 
                        gap: '0.75rem',
                        aspectRatio: '1'
                      }}>
                        {Array.from({ length: 9 }).map((_, slotIdx) => {
                          const slotNum = slotIdx + 1;
                          const stickerId = `${currentCategory.id}-${slotNum}`;
                          const isSelected = mySelectedStickers.includes(stickerId);

                          return (
                            <div 
                              key={stickerId}
                              onClick={() => toggleStickerSelection(stickerId)}
                              style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                border: isSelected ? '2px solid #a855f7' : '1px solid var(--border-color)',
                                borderRadius: '8px', 
                                cursor: 'pointer',
                                background: isSelected ? 'rgba(168, 85, 247, 0.15)' : 'rgba(0,0,0,0.2)',
                                fontWeight: isSelected ? '700' : '400'
                              }}
                              className="slot-item"
                            >
                              <span style={{ fontSize: '1.2rem', color: isSelected ? '#c084fc' : 'var(--text-secondary)' }}>
                                {slotNum}번
                              </span>
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                slot {slotNum}
                              </span>
                              {isSelected && (
                                <Check size={14} color="#c084fc" style={{ marginTop: '0.2rem' }} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 오른쪽 영역: 닉네임 입력 및 현재 내 선택 바구니 / 글 올리기 폼 */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <form onSubmit={handleSubmitPost} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', height: '100%' }}>
                <div>
                  <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <Sparkles color="#fbbf24" fill="#fbbf24" size={20} />
                    내 교환 글 올리기 폼
                  </h2>

                  <div className="form-group">
                    <label><User size={14} style={{ marginRight: '4px' }} /> 내 닉네임</label>
                    <input 
                      type="text" 
                      placeholder="예: 드래곤러버" 
                      value={myNickname}
                      onChange={(e) => setMyNickname(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label><MessageCircle size={14} style={{ marginRight: '4px' }} /> 내 연락처 (오픈카톡 링크 등)</label>
                    <input 
                      type="text" 
                      placeholder="예: open.kakao.com/o/xxxxxx" 
                      value={myContact}
                      onChange={(e) => setMyContact(e.target.value)}
                      required
                    />
                  </div>

                  {/* 선택한 바구니 요약 */}
                  <div style={{ marginTop: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                      내가 선택한 스티커 ({mySelectedStickers.length}개 선택됨)
                    </label>
                    <div className="tag-container" style={{ minHeight: '120px', maxHeight: '180px', overflowY: 'auto' }}>
                      {mySelectedStickers.map(id => {
                        const [catId, s] = id.split('-');
                        const cat = categories.find(c => String(c.id) === catId);
                        return (
                          <span key={id} className="sticker-tag" style={{ background: role === 'buyer' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)', borderColor: role === 'buyer' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)' }}>
                            {cat ? cat.name : `${catId}페이지`} {s}번
                            <button type="button" onClick={() => toggleStickerSelection(id)}><X size={10} /></button>
                          </span>
                        );
                      })}
                      {mySelectedStickers.length === 0 && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          왼쪽 목록에서 카테고리를 눌러 카드를 선택해 주세요.
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>
                    {role === 'buyer' ? '🔴 구해요 등록글 올리기' : '🟢 팝니다 등록글 올리기'}
                  </button>
                </div>
              </form>
            </div>

          </div>

          {/* 게시판 리스트 섹션 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
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
                <Sparkles size={16} /> 실시간 매칭글만 보기 ({role === 'buyer' ? '파는 사람' : '구하는 사람'})
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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 0', gap: '1rem' }}>
              <RefreshCw size={32} className="spin-anim" />
              <p>교환 피드 데이터 로딩 중...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="glass-card" style={{ padding: '4rem 2rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
              조건에 맞는 교환 글이 존재하지 않습니다.<br />
              상단의 버튼을 눌러 스티커 정보를 올리고 기다려보세요!
            </div>
          ) : (
            <div className="grid-container">
              {filteredPosts.map(post => {
                const isMyPost = myPostIds.includes(post.id);
                const { isMatched, matchedItems } = post.analysis;
                
                const hasHaves = post.haves && post.haves.length > 0;
                const hasWants = post.wants && post.wants.length > 0;

                return (
                  <div 
                    key={post.id} 
                    className={`glass-card ${isMatched ? 'matching-card' : ''}`}
                    style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                  >
                    <div>
                      {/* 닉네임 및 매칭 뱃지 */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>{post.nickname}</span>
                            {isMyPost && <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}>내 글</span>}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {new Date(post.created_at).toLocaleString('ko-KR', { hour12: false }).slice(0, -3)}
                          </span>
                        </div>

                        {isMatched && (
                          <span className="badge badge-match">
                            ⚡ {role === 'buyer' ? '교환 가능 판매자!' : '교환 가능 구매자!'}
                          </span>
                        )}
                      </div>

                      {/* 교환 상품 리스트 */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.2rem' }}>
                        {hasHaves && (
                          <div>
                            <div style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: '700', marginBottom: '0.25rem' }}>보유 카드 (팝니다)</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                              {post.haves.map(id => {
                                const [catId, s] = id.split('-');
                                const cat = categories.find(c => String(c.id) === catId);
                                return (
                                  <span key={id} className="sticker-tag" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#a7f3d0' }}>
                                    {cat ? cat.name : `${catId}페이지`} {s}번
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {hasWants && (
                          <div>
                            <div style={{ fontSize: '0.8rem', color: '#f87171', fontWeight: '700', marginBottom: '0.25rem' }}>구함 카드 (구해요)</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                              {post.wants.map(id => {
                                const [catId, s] = id.split('-');
                                const cat = categories.find(c => String(c.id) === catId);
                                return (
                                  <span key={id} className="sticker-tag" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5' }}>
                                    {cat ? cat.name : `${catId}페이지`} {s}번
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 매칭 상세 내역 */}
                      {isMatched && (
                        <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '8px', padding: '0.6rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
                          <span style={{ fontWeight: '700', color: '#fbbf24', display: 'block', marginBottom: '0.25rem' }}>
                            💡 나와 겹치는 카드 ({matchedItems.length}개):
                          </span>
                          <span style={{ color: '#fff' }}>
                            {matchedItems.map(id => {
                              const [catId, s] = id.split('-');
                              const cat = categories.find(c => String(c.id) === catId);
                              return cat ? `${cat.name} ${s}번` : `${catId}페이지 ${s}번`;
                            }).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 액션 버튼 */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                      <a 
                        href={post.contact.startsWith('http') ? post.contact : `https://${post.contact}`}
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn btn-secondary"
                        style={{ flex: 1, padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                      >
                        <MessageCircle size={14} /> 연락하기
                      </a>
                      {isMyPost && (
                        <button 
                          className="btn btn-outline" 
                          onClick={() => handleDeletePost(post.id)}
                          style={{ padding: '0.5rem', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                          title="내 글 삭제"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* 푸터 */}
      <footer style={{ marginTop: 'auto', paddingTop: '3rem', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
        <p>드래곤 빌리지 3 스티커 매칭 교환소 © 2026. All Rights Reserved.</p>
        <p style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
          <Info size={14} /> 본 사이트는 드빌 3 유저 간의 교환 편의 제공을 위해 개인 제작되었습니다.
        </p>
      </footer>
    </div>
  );
}

export default App;
