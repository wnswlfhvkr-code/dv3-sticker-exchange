import React, { useState, useEffect } from 'react';
import { dbService } from './supabaseClient';
import { stickersData, gradeColors } from './stickersData';
import { 
  Sparkles, 
  Plus, 
  Search, 
  MessageCircle, 
  User, 
  RefreshCw, 
  Trash2, 
  Info, 
  Check, 
  X, 
  ArrowRightLeft,
  BookOpen,
  Maximize2
} from 'lucide-react';

function App() {
  // --- 상태 관리 ---
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbMode, setDbMode] = useState(dbService.isMock ? '로컬' : 'Supabase 실시간');
  
  // 내 상태 (LocalStorage 연동)
  const [myNickname, setMyNickname] = useState(() => localStorage.getItem('dv3_my_nickname') || '');
  const [myContact, setMyContact] = useState(() => localStorage.getItem('dv3_my_contact') || '');
  const [myHaves, setMyHaves] = useState(() => JSON.parse(localStorage.getItem('dv3_my_haves')) || []);
  const [myWants, setMyWants] = useState(() => JSON.parse(localStorage.getItem('dv3_my_wants')) || []);

  // 카드 검색/선택 관련 임시 상태
  const [searchHaveQuery, setSearchHaveQuery] = useState('');
  const [searchWantQuery, setSearchWantQuery] = useState('');
  const [haveResults, setHaveResults] = useState([]);
  const [wantResults, setWantResults] = useState([]);

  // 글 등록 모달 관련 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formNickname, setFormNickname] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formHaves, setFormHaves] = useState([]);
  const [formWants, setFormWants] = useState([]);
  const [formHaveSearch, setFormHaveSearch] = useState('');
  const [formWantSearch, setFormWantSearch] = useState('');
  const [formHaveResults, setFormHaveResults] = useState([]);
  const [formWantResults, setFormWantResults] = useState([]);

  // 실물 도감 기능 상태
  const [showGallery, setShowGallery] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // 필터 및 검색
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'matched'
  const [searchFilterQuery, setSearchFilterQuery] = useState('');

  // 내 글 목록 추적용 (삭제 권한 보장용)
  const [myPostIds, setMyPostIds] = useState(() => JSON.parse(localStorage.getItem('dv3_my_post_ids')) || []);

  // --- 이미지 파일명 리스트 구성 (00 ~ 22) ---
  const stickerImages = Array.from({ length: 23 }, (_, i) => {
    const num = String(i).padStart(2, '0');
    return `/sticker_images/KakaoTalk_20260604_202516419_${num.toString()}.png`;
  });

  // --- 최초 및 변경 효과 ---
  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    localStorage.setItem('dv3_my_nickname', myNickname);
    localStorage.setItem('dv3_my_contact', myContact);
    localStorage.setItem('dv3_my_haves', JSON.stringify(myHaves));
    localStorage.setItem('dv3_my_wants', JSON.stringify(myWants));
  }, [myNickname, myContact, myHaves, myWants]);

  // --- 스티커 검색 검색창 로직 ---
  const handleStickerSearch = (query, setResults) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const filtered = stickersData.filter(sticker => 
      sticker.name.toLowerCase().includes(query.toLowerCase())
    );
    setResults(filtered.slice(0, 5)); // 최대 5개 노출
  };

  const addStickerToMyList = (sticker, type) => {
    if (type === 'have') {
      if (!myHaves.some(item => item.id === sticker.id)) {
        setMyHaves([...myHaves, sticker]);
      }
      setSearchHaveQuery('');
      setHaveResults([]);
    } else {
      if (!myWants.some(item => item.id === sticker.id)) {
        setMyWants([...myWants, sticker]);
      }
      setSearchWantQuery('');
      setWantResults([]);
    }
  };

  const removeStickerFromMyList = (id, type) => {
    if (type === 'have') {
      setMyHaves(myHaves.filter(item => item.id !== id));
    } else {
      setMyWants(myWants.filter(item => item.id !== id));
    }
  };

  // 모달용 카드 추가/삭제
  const addStickerToFormList = (sticker, type) => {
    if (type === 'have') {
      if (!formHaves.some(item => item.id === sticker.id)) {
        setFormHaves([...formHaves, sticker]);
      }
      setFormHaveSearch('');
      setFormHaveResults([]);
    } else {
      if (!formWants.some(item => item.id === sticker.id)) {
        setFormWants([...formWants, sticker]);
      }
      setFormWantSearch('');
      setFormWantResults([]);
    }
  };

  const removeStickerFromFormList = (id, type) => {
    if (type === 'have') {
      setFormHaves(formHaves.filter(item => item.id !== id));
    } else {
      setFormWants(formWants.filter(item => item.id !== id));
    }
  };

  // --- 데이터 패칭 ---
  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await dbService.fetchPosts();
    if (error) {
      alert("데이터를 가져오는 도중 오류가 발생했습니다.");
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  };

  // --- 게시글 등록 ---
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formNickname.trim() || !formContact.trim()) {
      alert("닉네임과 연락처(오픈프로필 등)를 입력해주세요!");
      return;
    }
    if (formHaves.length === 0 && formWants.length === 0) {
      alert("가진 카드나 필요한 카드 중 최소 하나는 입력해야 합니다.");
      return;
    }

    // 이름 목록으로 변환하여 저장
    const havesNames = formHaves.map(s => s.name);
    const wantsNames = formWants.map(s => s.name);

    const { data, error } = await dbService.addPost(
      formNickname,
      formContact,
      havesNames,
      wantsNames
    );

    if (error) {
      alert("등록에 실패했습니다. 다시 시도해 주세요.");
    } else {
      if (data && data[0]) {
        const newPostIds = [...myPostIds, data[0].id];
        setMyPostIds(newPostIds);
        localStorage.setItem('dv3_my_post_ids', JSON.stringify(newPostIds));
      }
      setIsModalOpen(false);
      // 폼 초기화
      setFormNickname('');
      setFormContact('');
      setFormHaves([]);
      setFormWants([]);
      fetchData();
    }
  };

  // --- 게시글 삭제 ---
  const handleDeletePost = async (id) => {
    if (!window.confirm("정말 이 교환글을 삭제하시겠습니까?")) return;
    
    const { error } = await dbService.removePost(id);
    if (error) {
      alert("삭제 실패: " + error.message);
    } else {
      const updatedPostIds = myPostIds.filter(postId => postId !== id);
      setMyPostIds(updatedPostIds);
      localStorage.setItem('dv3_my_post_ids', JSON.stringify(updatedPostIds));
      fetchData();
    }
  };

  // --- 내 조건 복사하기 ---
  const copyMySetupToForm = () => {
    setFormNickname(myNickname);
    setFormContact(myContact);
    setFormHaves([...myHaves]);
    setFormWants([...myWants]);
  };

  // --- 매칭 알고리즘 연산 함수 ---
  const checkMatching = (post) => {
    const postHaves = post.haves || [];
    const postWants = post.wants || [];

    const myHavesNames = myHaves.map(s => s.name);
    const myWantsNames = myWants.map(s => s.name);

    // 1. 내가 줄 수 있는 것 중 상대가 원하는 것 교집합
    const giveToThem = myHavesNames.filter(name => postWants.includes(name));
    
    // 2. 상대가 줄 수 있는 것 중 내가 원하는 것 교집합
    const takeFromThem = postHaves.filter(name => myWantsNames.includes(name));

    // 완전 일치 매칭 (둘 다 최소 1개 이상 겹침)
    const isPerfectMatch = giveToThem.length > 0 && takeFromThem.length > 0;
    
    return {
      isPerfectMatch,
      giveToThem,
      takeFromThem,
      matchScore: giveToThem.length + takeFromThem.length
    };
  };

  // 필터링 및 매칭 분석된 포스트 목록
  const analyzedPosts = posts.map(post => {
    const matchAnalysis = checkMatching(post);
    return { ...post, matchAnalysis };
  });

  // 최종 필터 적용
  const filteredPosts = analyzedPosts.filter(post => {
    if (filterMode === 'matched' && !post.matchAnalysis.isPerfectMatch) {
      return false;
    }
    if (searchFilterQuery.trim()) {
      const query = searchFilterQuery.toLowerCase();
      const nameMatch = post.nickname.toLowerCase().includes(query);
      const haveMatch = post.haves.some(h => h.toLowerCase().includes(query));
      const wantMatch = post.wants.some(w => w.toLowerCase().includes(query));
      return nameMatch || haveMatch || wantMatch;
    }
    return true;
  });

  return (
    <div className="app-container">
      {/* 헤더 */}
      <header>
        <div className="logo-container">
          <h1 className="logo-text">DRAGON VILLAGE 3</h1>
          <div className="sub-logo-text">STICKER EXCHANGE CENTER</div>
        </div>
        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
          <span className="badge badge-have" style={{ textTransform: 'none' }}>
            서버 상태: {dbMode} 모드
          </span>
          <button 
            className="btn btn-outline" 
            style={{ padding: '0.2rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            onClick={() => setShowGallery(!showGallery)}
          >
            <BookOpen size={14} /> {showGallery ? "실물 도감 닫기" : "📖 실물 도감 앨범 보기"}
          </button>
        </div>
      </header>

      {/* 실물 도감 갤러리 섹션 */}
      {showGallery && (
        <section className="glass-card" style={{ marginBottom: '2rem', border: '1px solid rgba(139, 92, 246, 0.4)' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', color: '#a78bfa' }}>
            <BookOpen />
            드빌 3 실물 스티커 캡쳐 앨범
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            아래 이미지를 클릭하여 실물 카드 번호 및 명칭을 선명하게 확인해 보세요.
          </p>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
            gap: '1rem',
            maxHeight: '400px',
            overflowY: 'auto',
            padding: '0.5rem'
          }}>
            {stickerImages.map((src, index) => (
              <div 
                key={index} 
                style={{ 
                  position: 'relative', 
                  borderRadius: '10px', 
                  overflow: 'hidden', 
                  cursor: 'pointer',
                  border: '1px solid var(--border-color)',
                  aspectRatio: '3/4'
                }}
                className="gallery-item"
                onClick={() => setSelectedImage(src)}
              >
                <img 
                  src={src} 
                  alt={`드빌3 스티커 도감 ${index + 1}`} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  left: 0, 
                  right: 0, 
                  background: 'rgba(0,0,0,0.7)', 
                  padding: '0.2rem', 
                  fontSize: '0.75rem', 
                  textAlign: 'center' 
                }}>
                  페이지 {index + 1}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 내 매칭 설정 카드 */}
      <section className="glass-card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
          <Sparkles color="#fbbf24" fill="#fbbf24" />
          내 교환 프로필 설정
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
          내 닉네임과 보유/필요 스티커를 설정하면 아래 게시판에서 실시간 매칭률이 계산됩니다.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', textAlign: 'left' }} className="profile-grid">
          <div className="form-group">
            <label><User size={14} style={{ marginRight: '4px' }} /> 내 닉네임</label>
            <input 
              type="text" 
              placeholder="예: 드래곤마스터" 
              value={myNickname}
              onChange={(e) => setMyNickname(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label><MessageCircle size={14} style={{ marginRight: '4px' }} /> 내 연락처 (카톡 오픈채팅 주소 등)</label>
            <input 
              type="text" 
              placeholder="예: open.kakao.com/o/..." 
              value={myContact}
              onChange={(e) => setMyContact(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem' }} className="sticker-selection-grid">
          {/* 가진 카드 설정 */}
          <div style={{ textAlign: 'left' }}>
            <label>내가 가진 스티커 (중복)</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="스티커 이름 검색..." 
                value={searchHaveQuery}
                onChange={(e) => {
                  setSearchHaveQuery(e.target.value);
                  handleStickerSearch(e.target.value, setHaveResults);
                }}
              />
              {haveResults.length > 0 && (
                <div className="sticker-search-result">
                  {haveResults.map(sticker => (
                    <div 
                      key={sticker.id} 
                      className="sticker-item"
                      onClick={() => addStickerToMyList(sticker, 'have')}
                    >
                      {sticker.name} <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>({sticker.grade} / {sticker.type})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="tag-container">
              {myHaves.map(sticker => (
                <span key={sticker.id} className="sticker-tag">
                  {sticker.name}
                  <button onClick={() => removeStickerFromMyList(sticker.id, 'have')}><X size={12} /></button>
                </span>
              ))}
              {myHaves.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>가진 스티커를 검색해 추가하세요.</span>}
            </div>
          </div>

          {/* 필요한 카드 설정 */}
          <div style={{ textAlign: 'left' }}>
            <label>내가 구하는 스티커</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="스티커 이름 검색..." 
                value={searchWantQuery}
                onChange={(e) => {
                  setSearchWantQuery(e.target.value);
                  handleStickerSearch(e.target.value, setWantResults);
                }}
              />
              {wantResults.length > 0 && (
                <div className="sticker-search-result">
                  {wantResults.map(sticker => (
                    <div 
                      key={sticker.id} 
                      className="sticker-item"
                      onClick={() => addStickerToMyList(sticker, 'want')}
                    >
                      {sticker.name} <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>({sticker.grade} / {sticker.type})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="tag-container">
              {myWants.map(sticker => (
                <span key={sticker.id} className="sticker-tag" style={{ background: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
                  {sticker.name}
                  <button onClick={() => removeStickerFromMyList(sticker.id, 'want')}><X size={12} /></button>
                </span>
              ))}
              {myWants.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>구하는 스티커를 검색해 추가하세요.</span>}
            </div>
          </div>
        </div>
      </section>

      {/* 리스트 헤더 및 액션바 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className={`btn ${filterMode === 'all' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilterMode('all')}
          >
            전체 글 보기
          </button>
          <button 
            className={`btn ${filterMode === 'matched' ? 'btn-secondary' : 'btn-outline'}`}
            onClick={() => setFilterMode('matched')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <Sparkles size={16} /> 100% 매칭 교환만 보기
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: 1, justifySelf: 'flex-end', maxWidth: '400px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <input 
              type="text" 
              placeholder="닉네임 또는 스티커 이름 검색..." 
              value={searchFilterQuery}
              onChange={(e) => setSearchFilterQuery(e.target.value)}
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
          <button 
            className="btn btn-primary"
            onClick={() => {
              setIsModalOpen(true);
              copyMySetupToForm();
            }}
            style={{ whiteSpace: 'nowrap' }}
          >
            <Plus size={18} /> 글 올리기
          </button>
        </div>
      </div>

      {/* 게시글 목록 */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 0', gap: '1rem' }}>
          <RefreshCw size={32} className="spin-anim" />
          <p>스티커 목록 로딩 중...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="glass-card" style={{ padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
          등록된 교환 글이 없거나 필터와 매칭되는 조건이 없습니다.<br />
          첫 교환 글을 올려 교환을 시작해보세요!
        </div>
      ) : (
        <div className="grid-container">
          {filteredPosts.map(post => {
            const isMyPost = myPostIds.includes(post.id);
            const { isPerfectMatch, giveToThem, takeFromThem } = post.matchAnalysis;

            return (
              <div 
                key={post.id} 
                className={`glass-card ${isPerfectMatch ? 'matching-card' : ''}`}
                style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <div>
                  {/* 상단 닉네임 및 매칭 뱃지 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: '700', fontSize: '1.15rem' }}>{post.nickname}</span>
                        {isMyPost && <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}>내 글</span>}
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(post.created_at).toLocaleString('ko-KR', { hour12: false }).slice(0, -3)}
                      </span>
                    </div>

                    {isPerfectMatch && (
                      <span className="badge badge-match">
                        ⚡ 교환 매칭 성사!
                      </span>
                    )}
                  </div>

                  {/* 가진/원하는 스티커 리스트 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: '700', marginBottom: '0.25rem' }}>가진 스티커</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {post.haves && post.haves.map((haveName, idx) => (
                          <span 
                            key={idx} 
                            className="sticker-tag" 
                            style={{ 
                              background: 'rgba(16, 185, 129, 0.1)', 
                              borderColor: 'rgba(16, 185, 129, 0.3)',
                              color: '#a7f3d0'
                            }}
                          >
                            {haveName}
                          </span>
                        ))}
                        {(!post.haves || post.haves.length === 0) && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>없음</span>}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#f87171', fontWeight: '700', marginBottom: '0.25rem' }}>필요한 스티커</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {post.wants && post.wants.map((wantName, idx) => (
                          <span 
                            key={idx} 
                            className="sticker-tag" 
                            style={{ 
                              background: 'rgba(239, 68, 68, 0.1)', 
                              borderColor: 'rgba(239, 68, 68, 0.3)',
                              color: '#fca5a5'
                            }}
                          >
                            {wantName}
                          </span>
                        ))}
                        {(!post.wants || post.wants.length === 0) && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>없음</span>}
                      </div>
                    </div>
                  </div>

                  {/* 100% 매칭 세부 정보 */}
                  {isPerfectMatch && (
                    <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '8px', padding: '0.75rem', marginBottom: '1.2rem', fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: '700', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.4rem' }}>
                        <ArrowRightLeft size={14} /> 교환 상세 시나리오
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div>🟢 상대방에게 제공: <strong style={{ color: '#fff' }}>{giveToThem.join(', ')}</strong></div>
                        <div>🔴 상대방으로부터 받음: <strong style={{ color: '#fff' }}>{takeFromThem.join(', ')}</strong></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 하단 액션 버튼 */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                  <a 
                    href={post.contact.startsWith('http') ? post.contact : `https://${post.contact}`}
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                  >
                    <MessageCircle size={16} /> 연락 및 교환하기
                  </a>
                  {isMyPost && (
                    <button 
                      className="btn btn-outline" 
                      onClick={() => handleDeletePost(post.id)}
                      style={{ padding: '0.5rem', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                      title="내 글 삭제"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 글 올리기 모달 */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus color="var(--primary-color)" /> 교환 요청 등록
            </h2>

            <form onSubmit={handleFormSubmit} style={{ textAlign: 'left' }}>
              <div className="form-group">
                <label>닉네임</label>
                <input 
                  type="text" 
                  placeholder="예: 카드콜렉터" 
                  value={formNickname}
                  onChange={(e) => setFormNickname(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>연락수단 (카카오톡 오픈챗 주소 등)</label>
                <input 
                  type="text" 
                  placeholder="예: open.kakao.com/o/xxxxxx" 
                  value={formContact}
                  onChange={(e) => setFormContact(e.target.value)}
                  required
                />
              </div>

              {/* 스티커 등록 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label>가진 스티커</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      placeholder="검색 후 클릭..." 
                      value={formHaveSearch}
                      onChange={(e) => {
                        setFormHaveSearch(e.target.value);
                        handleStickerSearch(e.target.value, setFormHaveResults);
                      }}
                    />
                    {formHaveResults.length > 0 && (
                      <div className="sticker-search-result">
                        {formHaveResults.map(sticker => (
                          <div 
                            key={sticker.id} 
                            className="sticker-item"
                            onClick={() => addStickerToFormList(sticker, 'have')}
                          >
                            {sticker.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="tag-container" style={{ minHeight: '80px' }}>
                    {formHaves.map(sticker => (
                      <span key={sticker.id} className="sticker-tag">
                        {sticker.name}
                        <button type="button" onClick={() => removeStickerFromFormList(sticker.id, 'have')}><X size={10} /></button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label>필요한 스티커</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      placeholder="검색 후 클릭..." 
                      value={formWantSearch}
                      onChange={(e) => {
                        setFormWantSearch(e.target.value);
                        handleStickerSearch(e.target.value, setFormWantResults);
                      }}
                    />
                    {formWantResults.length > 0 && (
                      <div className="sticker-search-result">
                        {formWantResults.map(sticker => (
                          <div 
                            key={sticker.id} 
                            className="sticker-item"
                            onClick={() => addStickerToFormList(sticker, 'want')}
                          >
                            {sticker.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="tag-container" style={{ minHeight: '80px' }}>
                    {formWants.map(sticker => (
                      <span key={sticker.id} className="sticker-tag" style={{ background: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
                        {sticker.name}
                        <button type="button" onClick={() => removeStickerFromFormList(sticker.id, 'want')}><X size={10} /></button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                  취소
                </button>
                <button type="submit" className="btn btn-primary">
                  게시물 등록하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 이미지 라이트박스(확대) 모달 */}
      {selectedImage && (
        <div className="modal-overlay" onClick={() => setSelectedImage(null)} style={{ zIndex: 1100 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ 
            maxWidth: '90%', 
            width: 'auto', 
            background: 'transparent',
            border: 'none',
            boxShadow: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <button className="modal-close" onClick={() => setSelectedImage(null)} style={{ fontSize: '2.5rem', top: '10px', right: '10px' }}>×</button>
            <img 
              src={selectedImage} 
              alt="스티커 도감 원본" 
              style={{ 
                maxHeight: '80vh', 
                maxWidth: '100%', 
                borderRadius: '12px',
                boxShadow: '0 0 40px rgba(0,0,0,0.8)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            />
            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
              화면 바깥이나 X 단추를 누르면 닫힙니다.
            </p>
          </div>
        </div>
      )}
      
      {/* 푸터 */}
      <footer style={{ marginTop: 'auto', paddingTop: '3rem', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
        <p>드래곤 빌리지 3 스티커 교환소 © 2026. All Rights Reserved.</p>
        <p style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
          <Info size={14} /> 본 사이트는 개인 교환용이며, 어떠한 상업적 이용 및 공식 연계를 포함하지 않습니다.
        </p>
      </footer>
    </div>
  );
}

export default App;
