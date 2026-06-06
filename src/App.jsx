import React, { useState, useEffect, useRef } from 'react';
import { dbService } from './supabaseClient';
import { chatService } from './chatService';
import { stickersData, categories, getCategoryImage } from './stickersData';
import { 
  Sparkles, 
  ArrowLeft, 
  MessageCircle, 
  MessageSquare,
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
  HelpCircle,
  LogOut,
  Send,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const formatChatTime = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  const now = new Date();
  
  const isToday = d.getDate() === now.getDate() && 
                  d.getMonth() === now.getMonth() && 
                  d.getFullYear() === now.getFullYear();
                  
  if (isToday) {
    return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  }
  
  // 어제인지 체크
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.getDate() === yesterday.getDate() && 
                      d.getMonth() === yesterday.getMonth() && 
                      d.getFullYear() === yesterday.getFullYear();
                      
  if (isYesterday) {
    return '어제';
  }
  
  // 7일 이내인지 체크
  const diffTime = Math.abs(now - d);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    const week = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    return week[d.getDay()];
  }
  
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
};

function App() {
  // --- 상태 관리 ---
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbMode, setDbMode] = useState(dbService.isMock ? '로컬스토리지' : 'Supabase 실시간');

  // 로그인 관련 상태
  const [userNickname, setUserNickname] = useState(() => {
    return sessionStorage.getItem('dv3_nickname') || localStorage.getItem('dv3_nickname') || '';
  });
  const [onlineUsers, setOnlineUsers] = useState([]);

  // 안 읽은 메시지 개수 관리 (로컬스토리지 복구 지원)
  const [unreadCounts, setUnreadCounts] = useState(() => {
    const counts = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('dv3_unread_')) {
          const roomId = key.replace('dv3_unread_', '');
          counts[roomId] = parseInt(localStorage.getItem(key)) || 0;
        }
      }
    } catch (e) {
      console.error("안 읽은 메시지 수 로딩 에러:", e);
    }
    return counts;
  });

  // 실시간 메시지 미리보기 팝업(Toast) 알림 상태
  const [chatNotification, setChatNotification] = useState(null);
  const [isGuest, setIsGuest] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('dv3_is_guest')) || false;
    } catch {
      return false;
    }
  });
  const [showLoginModal, setShowLoginModal] = useState(!userNickname);
  const [loginInput, setLoginInput] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // 연락처 정보
  const [myContact, setMyContact] = useState(() => localStorage.getItem('dv3_my_contact') || '');

  // 선택된 카테고리 ID (null 또는 1 ~ 20)
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  // 바구니 모드: 'haves' (줄 수 있는 카드) 또는 'wants' (필요한 카드)
  const [basketMode, setBasketMode] = useState('haves');
  
  // 내가 선택한 줄 수 있는 카드(Haves) 및 필요한 카드(Wants) 배열
  const [myHaves, setMyHaves] = useState(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem('dv3_my_haves'));
      if (Array.isArray(parsed)) {
        return parsed.filter(item => typeof item === 'string');
      }
      return [];
    } catch {
      return [];
    }
  });
  const [myWants, setMyWants] = useState(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem('dv3_my_wants'));
      if (Array.isArray(parsed)) {
        return parsed.filter(item => typeof item === 'string');
      }
      return [];
    } catch {
      return [];
    }
  });

  // 검색 및 필터 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMatchedOnly, setFilterMatchedOnly] = useState(false); // 매칭만 보기 토글

  // 내가 작성한 글 ID 목록 (삭제 권한용)
  const [myPostIds, setMyPostIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('dv3_my_post_ids')) || [];
    } catch {
      return [];
    }
  });

  // 글 올리기 폼 모달 열림 여부
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMyInfoOpen, setIsMyInfoOpen] = useState(false);

  // --- 1:1 채팅 관련 상태 ---
  const [chatRooms, setChatRooms] = useState([]);
  const [chatActiveRoomId, setChatActiveRoomId] = useState(null);
  const [chatActiveRoomNickname, setChatActiveRoomNickname] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatWindowOpen, setChatWindowOpen] = useState(false);
  const chatScrollRef = useRef(null);

  // --- 글 수정 관련 상태 ---
  const [editingPost, setEditingPost] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editContact, setEditContact] = useState('');
  const [editHaves, setEditHaves] = useState([]);
  const [editWants, setEditWants] = useState([]);
  const [editBasketMode, setEditBasketMode] = useState('haves');

  // --- 댓글 관련 상태 ---
  const [comments, setComments] = useState({}); // { [postId]: [comments...] }
  const [commentInputs, setCommentInputs] = useState({}); // { [postId]: '댓글텍스트' }
  const [expandedComments, setExpandedComments] = useState({}); // { [postId]: true/false }

  // --- 신고 관련 상태 ---
  const [reportingTarget, setReportingTarget] = useState(null); // { type, id, details }
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('허위 정보 / 거짓 매칭');
  const [reportCustomReason, setReportCustomReason] = useState('');

  // --- 관리자 관련 상태 ---
  const [isAdminTabOpen, setIsAdminTabOpen] = useState(false);
  const [reportsList, setReportsList] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminLogs, setAdminLogs] = useState([]);
  const [adminActiveTab, setAdminActiveTab] = useState("reports");

  // --- 최초 로드 및 동기화 ---
  useEffect(() => {
    // 구버전 채팅 데이터 정화 (수신/발신 통합 1:1 대화방 전환에 따른 충돌 방지)
    try {
      const localRoomsRaw = localStorage.getItem('dv3_chat_rooms');
      if (localRoomsRaw) {
        const rooms = JSON.parse(localRoomsRaw) || [];
        const migratedRooms = rooms.filter(r => {
          const parts = r.id.split('-');
          // room-A-B 형태로 parts.length === 3 인 최신 규격만 보존
          return parts.length === 3;
        });
        if (migratedRooms.length !== rooms.length) {
          localStorage.setItem('dv3_chat_rooms', JSON.stringify(migratedRooms));
          console.log(`[Migration] 구버전 대화방 ${rooms.length - migratedRooms.length}개 정화 완료.`);
        }
      }
    } catch (e) {
      console.error("로컬 대화방 데이터 마이그레이션 실패:", e);
    }
    fetchData();
  }, []);

  // 바구니 로컬스토리지 자동 연동
  useEffect(() => {
    localStorage.setItem('dv3_my_haves', JSON.stringify(myHaves));
    localStorage.setItem('dv3_my_wants', JSON.stringify(myWants));
  }, [myHaves, myWants]);

  // 연락처 로컬스토리지 자동 연동
  useEffect(() => {
    localStorage.setItem('dv3_my_contact', myContact);
  }, [myContact]);

  // 1초마다 실시간 데이터 폴링 (Supabase Realtime 미연동 시의 강력한 동기화)
  useEffect(() => {
    const timer = setInterval(() => {
      fetchDataSilent();
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  // 로그인 상태일 때 3초마다 대화방 목록 리프레시 및 로컬 이벤트 동기화
  useEffect(() => {
    if (userNickname) {
      runDatabaseMigration(userNickname);
      loadChatRooms();
      const timer = setInterval(() => {
        loadChatRooms();
      }, 3000);

      const handleChatUpdate = () => {
        loadChatRooms();
      };
      window.addEventListener('dv3_chat_update', handleChatUpdate);

      return () => {
        clearInterval(timer);
        window.removeEventListener('dv3_chat_update', handleChatUpdate);
      };
    }
  }, [userNickname]);

  // 실시간 접속자 목록(Presence) 구독 설정
  useEffect(() => {
    if (userNickname) {
      const unsubscribe = chatService.subscribeOnlineUsers(userNickname, (users) => {
        setOnlineUsers(users);
      });
      return () => unsubscribe();
    } else {
      setOnlineUsers([]);
    }
  }, [userNickname]);

  // 채팅방 활성화 시 안 읽은 메시지 수 리셋
  useEffect(() => {
    if (chatActiveRoomId) {
      setUnreadCounts(prev => {
        const next = { ...prev, [chatActiveRoomId]: 0 };
        localStorage.setItem(`dv3_unread_${chatActiveRoomId}`, '0');
        return next;
      });
    }
  }, [chatActiveRoomId]);

  // 실시간 알림 팝업(Toast) 자동 소멸 타이머 (4초 후 소멸)
  useEffect(() => {
    if (chatNotification) {
      const timer = setTimeout(() => {
        setChatNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [chatNotification]);

  // 글로벌 새 메시지 감지 훅 (알림음, 토스트 팝업, 안 읽은 카운트 제어)
  useEffect(() => {
    if (!userNickname) return;

    const unsubscribe = chatService.subscribeAllMyMessages(userNickname, (msg) => {
      loadChatRooms();
      // 현재 열려 있는 방이 아니거나 채팅방 창이 아예 닫혀있을 때만 알림 발생
      if (!chatWindowOpen || chatActiveRoomId !== msg.roomId) {
        // 1. 안 읽은 개수 증가
        setUnreadCounts(prev => {
          const newCount = (prev[msg.roomId] || 0) + 1;
          localStorage.setItem(`dv3_unread_${msg.roomId}`, String(newCount));
          return { ...prev, [msg.roomId]: newCount };
        });

        // 2. 청아한 띵동 알림음 재생
        try {
          const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav");
          audio.volume = 0.55;
          audio.play().catch(e => console.log("알림음 재생 대기 (브라우저 상호작용 제약):", e));
        } catch (e) {
          console.error("오디오 로드 에러:", e);
        }

        // 3. 토스트 팝업 알림 설정
        setChatNotification({
          sender: msg.sender,
          text: msg.text,
          roomId: msg.roomId
        });
      }
    });

    return () => unsubscribe();
  }, [userNickname, chatWindowOpen, chatActiveRoomId]);

  // 안 읽은 메시지 수에 따라 브라우저 탭 타이틀에 숫자 표시
  useEffect(() => {
    const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
    if (totalUnread > 0) {
      document.title = `(${totalUnread}) 드래곤 빌리지 3 카드교환소`;
    } else {
      document.title = `드래곤 빌리지 3 카드교환소`;
    }
  }, [unreadCounts]);

  // 채팅방 활성화 시 메시지 히스토리 로드 및 실시간 구독
  useEffect(() => {
    if (!chatActiveRoomId) {
      setChatMessages([]);
      return;
    }

    const loadMsgs = async () => {
      const msgs = await chatService.getMessages(chatActiveRoomId);
      setChatMessages(msgs || []);
    };
    loadMsgs();

    const unsubscribe = chatService.subscribeMessages(chatActiveRoomId, (msgs) => {
      setChatMessages(msgs || []);
      loadChatRooms();
    });

    return () => unsubscribe();
  }, [chatActiveRoomId]);

  // 새 대화 전송/수신 시 스크롤 자동 하단 이동
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // --- 핵심 데이터 핸들러 ---
  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await dbService.fetchPosts();
    if (!error) {
      setPosts(data || []);
    }
    setLoading(false);
  };

  const fetchDataSilent = async () => {
    const { data, error } = await dbService.fetchPosts();
    if (!error) {
      setPosts(data || []);
    }
  };

  // 구버전 파편화 대화방 데이터를 최신 1:1 통합 방 체계로 마이그레이션하고 통합하는 함수
  const runDatabaseMigration = async (myNickname) => {
    if (!myNickname) return;
    try {
      let allRooms = [];
      if (isMock) {
        try {
          allRooms = JSON.parse(localStorage.getItem('dv3_chat_rooms')) || [];
        } catch (e) {
          allRooms = [];
        }
      } else {
        const { data, error } = await supabase
          .from('chat_rooms')
          .select('*')
          .or(`buyer_nickname.eq.${myNickname},seller_nickname.eq.${myNickname}`);
        if (!error && data) {
          allRooms = data.map(r => ({
            id: r.id,
            postId: r.post_id,
            buyerNickname: r.buyer_nickname,
            sellerNickname: r.seller_nickname,
            lastMessage: r.last_message,
            updatedAt: r.updated_at
          }));
        }
      }

      const oldRooms = allRooms.filter(r => {
        const parts = (r.id || '').split('-');
        return parts.length !== 3;
      });

      if (oldRooms.length === 0) return;

      console.log(`[Migration] 구버전 대화방 ${oldRooms.length}개 탐지됨. 통합 마이그레이션 진행...`);

      for (const oldRoom of oldRooms) {
        const buyer = oldRoom.buyerNickname;
        const seller = oldRoom.sellerNickname;
        if (!buyer || !seller) continue;

        const sorted = [buyer, seller].sort();
        const targetNewRoomId = `room-${sorted[0]}-${sorted[1]}`;

        // 최신 통합 방 생성/조회 보장
        await chatService.getOrCreateChatRoom(oldRoom.postId, buyer, seller);

        if (isMock) {
          const messagesRaw = localStorage.getItem('dv3_chat_messages');
          if (messagesRaw) {
            const msgs = JSON.parse(messagesRaw) || [];
            let updated = false;
            const migratedMsgs = msgs.map(m => {
              if (m.roomId === oldRoom.id) {
                updated = true;
                return { ...m, roomId: targetNewRoomId };
              }
              return m;
            });
            if (updated) {
              localStorage.setItem('dv3_chat_messages', JSON.stringify(migratedMsgs));
            }
          }

          const roomsRaw = localStorage.getItem('dv3_chat_rooms');
          if (roomsRaw) {
            const localRooms = JSON.parse(roomsRaw) || [];
            const filteredRooms = localRooms.filter(r => r.id !== oldRoom.id);
            localStorage.setItem('dv3_chat_rooms', JSON.stringify(filteredRooms));
          }
        } else {
          // Supabase 메시지 이관
          const { error: msgUpdateError } = await supabase
            .from('chat_messages')
            .update({ room_id: targetNewRoomId })
            .eq('room_id', oldRoom.id);

          if (msgUpdateError) {
            console.warn(`메시지 마이그레이션 실패 (방: ${oldRoom.id}):`, msgUpdateError);
          }

          // Supabase 구버전 방 레코드 삭제
          const { error: roomDeleteError } = await supabase
            .from('chat_rooms')
            .delete()
            .eq('id', oldRoom.id);

          if (roomDeleteError) {
            console.warn(`구버전 방 삭제 실패 (방: ${oldRoom.id}):`, roomDeleteError);
          }
        }
      }

      console.log(`[Migration] 구버전 대화방 및 메시지 통합 완료.`);
      await loadChatRooms();
    } catch (err) {
      console.error("데이터 마이그레이션 실패:", err);
    }
  };

  const loadChatRooms = async () => {
    try {
      const rooms = await chatService.getMyChatRooms(userNickname);
      // 상대방 닉네임 정제
      const formattedRooms = (rooms || []).map(r => {
        const otherUser = r.buyerNickname === userNickname ? r.sellerNickname : r.buyerNickname;
        return { ...r, otherUser };
      });
      // 최신 업데이트된 채팅방을 맨 위로 정렬 (updatedAt 기준 내림차순)
      formattedRooms.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
      setChatRooms(formattedRooms);
    } catch (err) {
      console.error("채팅방 로드 실패:", err);
    }
  };

  // 로그인 처리
  const handleLogin = async (isGuestMode) => {
    if (!loginInput.trim()) {
      alert("사용할 닉네임을 입력해 주세요!");
      return;
    }
    const nickname = loginInput.trim();

    // 게스트 모드가 아닐 때 (비밀번호 필수 및 자동 저장 회원가입/로그인 흐름)
    if (!isGuestMode) {
      if (!loginPassword.trim()) {
        alert("비밀번호를 입력해 주세요!");
        return;
      }
      const password = loginPassword.trim();
      
      try {
        const { exists, isMatch, error } = await dbService.verifyUser(nickname, password);
        if (error) {
          console.error("회원 검증 오류:", error);
          alert("회원 정보를 조회하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
          return;
        }
        
        if (exists) {
          if (!isMatch) {
            alert("입력하신 비밀번호가 등록된 정보와 일치하지 않습니다!");
            return;
          }
        } else {
          const confirmSignUp = window.confirm(`"${nickname}"님은 등록되지 않은 회원입니다.\n이 비밀번호로 새로운 계정을 등록(회원가입)하시겠습니까?`);
          if (!confirmSignUp) return;
          
          const { error: registerError } = await dbService.registerUser(nickname, password);
          if (registerError) {
            console.error("회원 등록 오류:", registerError);
            alert("회원 등록에 실패했습니다. (중복 닉네임 또는 특수문자 제한일 수 있습니다)");
            return;
          }
          alert("성공적으로 회원 등록이 완료되었습니다!");
        }
      } catch (err) {
        console.error("로그인 프로세스 오류:", err);
        alert("로그인 처리 중 오류가 발생했습니다.");
        return;
      }
      
      localStorage.setItem('dv3_nickname', nickname);
      localStorage.setItem('dv3_password', password);
      sessionStorage.setItem('dv3_nickname', nickname);
      sessionStorage.setItem('dv3_is_guest', 'false');
      setIsGuest(false);
    } else {
      // 게스트 로그인 (보안 및 중복 방지 강화 + 게스트 표시 추가)
      const guestDisplayName = `${nickname} (게스트)`;
      try {
        // 1. 기존 가입 유저 확인
        const { exists, error } = await dbService.verifyUser(nickname, "");
        if (error) {
          console.error("게스트 로그인 검증 오류:", error);
        }
        if (exists) {
          alert(`"${nickname}"은(는) 이미 등록된 정식 회원 닉네임입니다.\n비밀번호를 입력하여 정식으로 로그인하거나, 다른 닉네임을 입력해 주세요.`);
          return;
        }

        // 2. 현재 온라인 중복 유저 확인
        if (onlineUsers.includes(guestDisplayName) || onlineUsers.includes(nickname)) {
          alert(`현재 "${nickname}" 닉네임으로 접속 중인 사용자가 있습니다.\n겹치지 않는 다른 닉네임으로 접속해 주세요.`);
          return;
        }
      } catch (err) {
        console.error("게스트 로그인 검증 중 예외:", err);
      }

      setIsGuest(true);
      sessionStorage.setItem('dv3_nickname', guestDisplayName);
      sessionStorage.setItem('dv3_is_guest', 'true');
      localStorage.removeItem('dv3_nickname');
      localStorage.removeItem('dv3_password');
    }

    const finalNickname = isGuestMode ? `${nickname} (게스트)` : nickname;
    setUserNickname(finalNickname);
    setShowLoginModal(false);
    setLoginPassword('');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('dv3_nickname');
    sessionStorage.removeItem('dv3_is_guest');
    localStorage.removeItem('dv3_nickname');
    localStorage.removeItem('dv3_password');
    setUserNickname('');
    setIsGuest(false);
    setShowLoginModal(true);
    setChatWindowOpen(false);
    setChatActiveRoomId(null);
  };

  const toggleStickerSelection = (stickerId) => {
    if (basketMode === 'haves') {
      if (myHaves.includes(stickerId)) {
        setMyHaves(myHaves.filter(id => id !== stickerId));
      } else {
        setMyHaves([...myHaves, stickerId]);
        setMyWants(myWants.filter(id => id !== stickerId));
      }
    } else {
      if (myWants.includes(stickerId)) {
        setMyWants(myWants.filter(id => id !== stickerId));
      } else {
        setMyWants([...myWants, stickerId]);
        setMyHaves(myHaves.filter(id => id !== stickerId));
      }
    }
  };

  const getHavesCountInPage = (categoryId) => {
    return myHaves.filter(id => id && typeof id === 'string' && id.startsWith(`${categoryId}-`)).length;
  };

  const getWantsCountInPage = (categoryId) => {
    return myWants.filter(id => id && typeof id === 'string' && id.startsWith(`${categoryId}-`)).length;
  };

  const handleSubmitPost = async (e) => {
    e.preventDefault();
    if (!userNickname) {
      alert("로그인이 필요합니다!");
      return;
    }
    if (myHaves.length === 0 && myWants.length === 0) {
      alert("보유 중인 카드나 필요한 카드를 최소 한 개 이상 지정해 주세요!");
      return;
    }

    const { data, error } = await dbService.addPost(
      userNickname,
      myContact,
      myHaves,
      myWants
    );

    if (error) {
      alert("게시글 등록에 실패했습니다: " + error.message);
    } else {
      if (data && data[0]) {
        const newPostIds = [...myPostIds, data[0].id];
        setMyPostIds(newPostIds);
        localStorage.setItem('dv3_my_post_ids', JSON.stringify(newPostIds));
      }
      alert("교환 등록이 완료되었습니다!");
      fetchData();
      setIsFormOpen(false);
    }
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm("정말 이 교환 등록글을 삭제하시겠습니까?")) return;
    const { error } = await dbService.removePost(id);
    if (!error) {
      const updated = myPostIds.filter(postId => postId !== id);
      setMyPostIds(updated);
      localStorage.setItem('dv3_my_post_ids', JSON.stringify(updated));
      fetchData();
    } else {
      alert("삭제 실패: " + error.message);
    }
  };

  const handleBumpPost = async (id) => {
    const { error } = await dbService.bumpPost(id);
    if (!error) {
      alert("글을 맨 위로 끌어올렸습니다!");
      fetchData();
    } else {
      alert("끌어올리기 실패: " + error.message);
    }
  };

  // --- 글 수정 핸들러 ---
  const handleOpenEditModal = (post) => {
    setEditingPost(post);
    setEditContact(post.contact || '');
    setEditHaves(post.haves || []);
    setEditWants(post.wants || []);
    setEditBasketMode('haves');
    setIsEditModalOpen(true);
  };

  const handleUpdatePost = async (e) => {
    e.preventDefault();
    if (!editingPost) return;
    const { error } = await dbService.updatePost(editingPost.id, editContact, editHaves, editWants);
    if (!error) {
      alert("성공적으로 글이 수정되었습니다!");
      setIsEditModalOpen(false);
      setEditingPost(null);
      fetchData();
    } else {
      alert("글 수정 실패: " + error.message);
    }
  };

  const toggleEditStickerSelection = (stickerId) => {
    if (editBasketMode === 'haves') {
      if (editHaves.includes(stickerId)) {
        setEditHaves(editHaves.filter(id => id !== stickerId));
      } else {
        setEditHaves([...editHaves, stickerId]);
        setEditWants(editWants.filter(id => id !== stickerId));
      }
    } else {
      if (editWants.includes(stickerId)) {
        setEditWants(editWants.filter(id => id !== stickerId));
      } else {
        setEditWants([...editWants, stickerId]);
        setEditHaves(editHaves.filter(id => id !== stickerId));
      }
    }
  };

  // --- 댓글 핸들러 ---
  const loadComments = async (postId) => {
    const { data, error } = await dbService.fetchComments(postId);
    if (!error) {
      setComments(prev => ({ ...prev, [postId]: data || [] }));
    }
  };

  const toggleComments = async (postId) => {
    const isExpanded = !expandedComments[postId];
    setExpandedComments(prev => ({ ...prev, [postId]: isExpanded }));
    if (isExpanded) {
      await loadComments(postId);
    }
  };

  const handleAddComment = async (e, postId) => {
    e.preventDefault();
    const commentText = commentInputs[postId] || '';
    if (!commentText.trim()) return;
    if (!userNickname) {
      alert("로그인 후 댓글을 작성할 수 있습니다.");
      return;
    }
    const { error } = await dbService.addComment(postId, userNickname, commentText.trim());
    if (!error) {
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      await loadComments(postId);
    } else {
      alert("댓글 등록 실패: " + error.message);
    }
  };

  const handleDeleteComment = async (commentId, postId) => {
    if (!window.confirm("정말 이 댓글을 삭제하시겠습니까?")) return;
    const { error } = await dbService.removeComment(commentId);
    if (!error) {
      await loadComments(postId);
    } else {
      alert("댓글 삭제 실패: " + error.message);
    }
  };

  // --- 신고 핸들러 ---
  const handleOpenReportModal = (targetType, targetId, targetDetails) => {
    if (!userNickname) {
      alert("로그인 후 신고 기능을 이용할 수 있습니다.");
      return;
    }
    setReportingTarget({ type: targetType, id: targetId, details: targetDetails });
    setReportReason('허위 정보 / 거짓 매칭');
    setReportCustomReason('');
    setIsReportModalOpen(true);
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!reportingTarget) return;
    const finalReason = reportReason === '기타' ? reportCustomReason : reportReason;
    if (reportReason === '기타' && !reportCustomReason.trim()) {
      alert("신고 사유를 작성해주세요.");
      return;
    }
    const { error } = await dbService.addReport(
      reportingTarget.type,
      reportingTarget.id,
      userNickname,
      finalReason,
      reportingTarget.details
    );
    if (!error) {
      alert("신고가 정상적으로 접수되었습니다. 관리자 확인 후 조치됩니다.");
      setIsReportModalOpen(false);
      setReportingTarget(null);
    } else {
      alert("신고 접수 실패: " + error.message);
    }
  };

  // --- 관리자 핸들러 ---
  const loadAdminLogs = () => {
    try {
      const logsRaw = localStorage.getItem('dv3_admin_resolved_logs');
      setAdminLogs(logsRaw ? JSON.parse(logsRaw) : []);
    } catch (e) {
      console.error("관리자 로그 로드 실패:", e);
    }
  };

  const addAdminLog = (reportId, actionName) => {
    try {
      const logsRaw = localStorage.getItem('dv3_admin_resolved_logs');
      const logs = logsRaw ? JSON.parse(logsRaw) : [];
      const targetReport = reportsList.find(r => r.id === reportId);
      if (targetReport) {
        const logEntry = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          targetType: targetReport.target_type || targetReport.targetType,
          targetId: targetReport.target_id || targetReport.targetId,
          reporter: targetReport.reporter,
          reason: targetReport.reason,
          targetDetails: targetReport.target_details || targetReport.targetDetails,
          action: actionName,
          resolvedAt: new Date().toISOString()
        };
        logs.unshift(logEntry);
        localStorage.setItem('dv3_admin_resolved_logs', JSON.stringify(logs));
        loadAdminLogs();
      }
    } catch (e) {
      console.error("관리자 로그 추가 실패:", e);
    }
  };

  const loadReports = async () => {
    setAdminLoading(true);
    const { data, error } = await dbService.fetchReports();
    if (!error) {
      setReportsList(data || []);
    }
    loadAdminLogs();
    setAdminLoading(false);
  };

  const handleOpenAdminTab = async () => {
    setIsAdminTabOpen(true);
    setAdminActiveTab("reports");
    await loadReports();
  };

  const handleResolveReport = async (reportId) => {
    addAdminLog(reportId, "신고 반려 (무시)");
    const { error } = await dbService.resolveReport(reportId);
    if (!error) {
      alert("신고 내역이 반려(무시) 처리되었습니다.");
      await loadReports();
    } else {
      alert("처리 실패: " + error.message);
    }
  };

  const handleAdminDeletePost = async (postId, reportId) => {
    if (!window.confirm("관리자 권한으로 이 게시글을 강제 삭제하시겠습니까?")) return;
    if (reportId) {
      addAdminLog(reportId, "게시글 강제 삭제");
    }
    const { error } = await dbService.removePost(postId);
    if (!error) {
      alert("게시글이 삭제되었습니다.");
      if (reportId) {
        await dbService.resolveReport(reportId);
      }
      await loadReports();
      fetchData();
    } else {
      alert("게시글 삭제 실패: " + error.message);
    }
  };

  const handleAdminDeleteComment = async (commentId, postId, reportId) => {
    if (!window.confirm("관리자 권한으로 이 댓글을 강제 삭제하시겠습니까?")) return;
    if (reportId) {
      addAdminLog(reportId, "댓글 강제 삭제");
    }
    const { error } = await dbService.removeComment(commentId);
    if (!error) {
      alert("댓글이 삭제되었습니다.");
      if (reportId) {
        await dbService.resolveReport(reportId);
      }
      await loadReports();
      if (postId) {
        await loadComments(postId);
      }
    } else {
      alert("댓글 삭제 실패: " + error.message);
    }
  };

  // 1:1 채팅 시작하기
  const handleStartChat = async (post) => {
    if (post.nickname === userNickname) {
      alert("본인이 올린 거래글에는 대화를 시작할 수 없습니다!");
      return;
    }
    try {
      const room = await chatService.getOrCreateChatRoom(post.id, userNickname, post.nickname);
      setChatActiveRoomId(room.id);
      setChatActiveRoomNickname(post.nickname);
      setChatWindowOpen(true);
      loadChatRooms();
    } catch (err) {
      alert("1:1 대화방 개설에 실패했습니다: " + err.message);
    }
  };

  // 메시지 보내기
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !chatActiveRoomId) return;
    try {
      await chatService.sendMessage(chatActiveRoomId, userNickname, chatInput.trim());
      setChatInput('');
      loadChatRooms();
    } catch (err) {
      alert("메시지 전송에 실패했습니다: " + err.message);
    }
  };

  // --- 양방향 매칭 계산 엔진 ---
  const checkMatching = (post) => {
    const postHaves = post.haves || [];
    const postWants = post.wants || [];

    // 내가 원하는 카드와 상대방이 줄 수 있는 카드 대조
    const myWantsMatch = myWants.filter(id => postHaves.includes(id));
    // 내가 줄 수 있는 카드와 상대방이 원하는 카드 대조
    const myHavesMatch = myHaves.filter(id => postWants.includes(id));

    // 완벽 매칭: 양방향 모두 하나 이상씩 교환 카드가 존재하는 경우
    const isPerfectMatch = myWantsMatch.length > 0 && myHavesMatch.length > 0;
    // 부분 매칭: 한쪽 방향으로만 겹치는 카드가 존재하는 경우
    const isPartialMatch = !isPerfectMatch && (myWantsMatch.length > 0 || myHavesMatch.length > 0);

    return {
      isPerfectMatch,
      isPartialMatch,
      myWantsMatch,
      myHavesMatch
    };
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

  const currentCategory = categories.find(c => c.id === selectedCategoryId);

  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 헤더 */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '800px', margin: '0 auto 1.5rem auto', flexWrap: 'wrap', gap: '1rem' }}>
        <div 
          className="logo-container" 
          onClick={() => setSelectedCategoryId(null)}
          style={{ cursor: 'pointer', userSelect: 'none' }}
          title="카테고리 홈으로 이동"
        >
          <h1 className="logo-text">DRAGON VILLAGE 3</h1>
          <div className="sub-logo-text">STICKER BOOK MATCHING CENTER</div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {userNickname && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 0.85rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <User size={14} color="var(--primary-color)" />
              <span 
                style={{ fontSize: '0.85rem', fontWeight: '600', color: '#fff', cursor: 'pointer' }}
                onClick={() => setIsMyInfoOpen(true)}
                title="내 정보 열기"
              >
                {userNickname} {isGuest ? <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(게스트)</span> : null}
              </span>
              <button
                onClick={() => setIsMyInfoOpen(true)}
                style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', padding: '0 2px', display: 'flex', alignItems: 'center' }}
                title="내 정보 및 등록글 보기"
              >
                <Info size={14} />
              </button>
              {userNickname === '간장' && (
                <button 
                  onClick={handleOpenAdminTab} 
                  style={{ background: 'none', border: 'none', color: '#fbbf24', cursor: 'pointer', padding: '0 4px', display: 'flex', alignItems: 'center', gap: '2px' }}
                  title="관리자 메뉴 열기"
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>👑 관리자</span>
                </button>
              )}
              <button 
                onClick={handleLogout} 
                style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0 0 0 4px', display: 'flex', alignItems: 'center' }}
                title="로그아웃"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
          <div className="badge badge-have" style={{ textTransform: 'none', margin: 0 }}>
            {dbMode}
          </div>
        </div>
      </header>

      {/* 메인 화면 뷰 */}
      <>
        {selectedCategoryId === null ? (
          // [1. 카테고리 목록 화면]
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', textAlign: 'left', marginBottom: '2.5rem', width: '100%' }} className="main-work-layout">
            
            {/* 메인: 카테고리 리스트 */}
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
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', 
                gap: '1.2rem',
                maxHeight: '480px',
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
                        height: '180px',
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
                        height: '135px', 
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
                          <HelpCircle size={32} color="rgba(255,255,255,0.15)" />
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
            
            {/* 하단 영역: 현재 내 선택 바구니 및 교환 등록 액션 */}
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
                            <button type="button" onClick={() => toggleStickerSelection(id)} style={{ background: 'none', border: 'none', color: '#a7f3d0', cursor: 'pointer', padding: '1px', display: 'flex', alignItems: 'center' }}><X size={10} /></button>
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
                            <button type="button" onClick={() => toggleStickerSelection(id)} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', padding: '1px', display: 'flex', alignItems: 'center' }}><X size={10} /></button>
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

          </div>
        ) : (
          // [2. 상세 3x3 스티커 도감일 때는 단독 거대 레이아웃 (가로폭 최대 800px 중앙 집중)]
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', textAlign: 'left', marginBottom: '2.5rem', width: '100%' }} className="detail-work-layout">
            
            {/* 3x3 대형 그리드 영역 */}
            <div className="glass-card" style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', width: '100%', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem', flexWrap: 'nowrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {/* 카테고리 목록 뒤로가기 버튼이 헤더 타이틀 왼쪽에 단단하게 위치 */}
                  <button 
                    className="btn btn-outline" 
                    onClick={() => setSelectedCategoryId(null)}
                    style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
                  >
                    <ArrowLeft size={14} /> 카테고리 목록
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <BookOpen size={18} color="var(--primary-color)" style={{ marginRight: '0.2rem' }} />
                    
                    {/* 이전 카테고리 이동 버튼 */}
                    <button
                      type="button"
                      onClick={() => {
                        const currentIndex = categories.findIndex(c => c.id === currentCategory.id);
                        const prevIndex = currentIndex === 0 ? categories.length - 1 : currentIndex - 1;
                        setSelectedCategoryId(categories[prevIndex].id);
                      }}
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        padding: '0.3rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--primary-color)';
                        e.currentTarget.style.color = '#000';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                        e.currentTarget.style.color = '#fff';
                      }}
                      title="이전 카테고리"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    <h2 style={{ fontSize: '1.15rem', margin: 0, fontWeight: '700', color: '#fff', minWidth: '100px', textAlign: 'center' }}>
                      {currentCategory.name}
                    </h2>

                    {/* 다음 카테고리 이동 버튼 */}
                    <button
                      type="button"
                      onClick={() => {
                        const currentIndex = categories.findIndex(c => c.id === currentCategory.id);
                        const nextIndex = currentIndex === categories.length - 1 ? 0 : currentIndex + 1;
                        setSelectedCategoryId(categories[nextIndex].id);
                      }}
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        padding: '0.3rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--primary-color)';
                        e.currentTarget.style.color = '#000';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                        e.currentTarget.style.color = '#fff';
                      }}
                      title="다음 카테고리"
                    >
                      <ChevronRight size={16} />
                    </button>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '4px', whiteSpace: 'nowrap' }}>
                      ({currentCategory.id}/20)
                    </span>
                  </div>
                </div>
                {getCategoryImage(currentCategory.id) && (
                  <div style={{ 
                    width: '45px', 
                    height: '45px', 
                    borderRadius: '50%', 
                    overflow: 'hidden', 
                    border: '2px solid var(--primary-color)', 
                    background: 'rgba(0,0,0,0.3)',
                    boxShadow: '0 0 10px rgba(133, 195, 0, 0.4)',
                    position: 'relative',
                    flexShrink: 0
                  }}>
                    <img 
                      src={getCategoryImage(currentCategory.id)} 
                      alt="도감 대표" 
                      title={currentCategory.name}
                      style={{ 
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                        borderRadius: '50%'
                      }} 
                    />
                  </div>
                )}
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                인게임 실물 도감 배치와 동일한 3x3 구조입니다. 슬롯을 클릭하여 줄 수 있는 카드 또는 받고 싶은 카드로 바구니에 담아보세요.
              </p>

              {/* 바구니 모드 전환 탭 */}
              <div style={{ display: 'flex', background: 'rgba(0,0,0,0.25)', padding: '4px', borderRadius: '10px', width: 'fit-content', gap: '4px', marginBottom: '0.5rem' }}>
                <button
                  type="button"
                  className={`btn ${basketMode === 'haves' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setBasketMode('haves')}
                  style={{ padding: '0.45rem 1rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '3px' }}
                >
                  🟢 줄 수 있는 카드 담기
                </button>
                <button
                  type="button"
                  className={`btn ${basketMode === 'wants' ? 'btn-secondary' : 'btn-outline'}`}
                  onClick={() => setBasketMode('wants')}
                  style={{ padding: '0.45rem 1rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '3px' }}
                >
                  🔴 받고 싶은 카드 담기
                </button>
              </div>
              
              {/* 3x3 바둑판 그리드 - 가로폭 100% 꽉 채워서 크게 렌더링 (세로 직사각형 카드형식) */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: '1.2rem',
                width: '100%',
                marginBottom: '0.5rem'
              }}>
                {Array.from({ length: 9 }).map((_, slotIdx) => {
                  const slotNum = slotIdx + 1;
                  const stickerId = `${currentCategory.id}-${slotNum}`;
                  const isHave = myHaves.includes(stickerId);
                  const isWant = myWants.includes(stickerId);
                  const isSelected = isHave || isWant;
                  
                  const sticker = stickersData.find(s => s.id === stickerId);
                  const imageUrl = sticker ? sticker.image : null;

                  // 테두리 강조선 분기
                  let borderStyle = '2px solid var(--border-color)';
                  let backgroundStyle = '#1d2025';
                  let shadowStyle = 'none';

                  if (isHave) {
                    borderStyle = '3px solid #10b981';
                    backgroundStyle = 'rgba(16, 185, 129, 0.08)';
                    shadowStyle = '0 0 15px rgba(16, 185, 129, 0.3)';
                  } else if (isWant) {
                    borderStyle = '3px solid #ef4444';
                    backgroundStyle = 'rgba(239, 68, 68, 0.08)';
                    shadowStyle = '0 0 15px rgba(239, 68, 68, 0.3)';
                  }

                  return (
                    <div 
                      key={stickerId}
                      onClick={() => toggleStickerSelection(stickerId)}
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'flex-start', 
                        border: borderStyle,
                        borderRadius: '16px', 
                        cursor: 'pointer',
                        background: backgroundStyle,
                        fontWeight: isSelected ? '700' : '500',
                        position: 'relative',
                        overflow: 'hidden',
                        aspectRatio: '0.78', // 인게임 비디오처럼 세로가 긴 직사각형 비율 사용
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: shadowStyle,
                        opacity: isSelected ? 1 : 0.65,
                        filter: isSelected ? 'none' : 'grayscale(60%) brightness(70%)',
                        paddingTop: '0.5rem'
                      }}
                      className="slot-item"
                    >
                      {imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt={sticker.name} 
                          title={sticker.name}
                          style={{ 
                            width: '88%', 
                            height: '64%', 
                            objectFit: 'contain', 
                            transition: 'all 0.2s ease',
                            transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                            display: 'block'
                          }} 
                        />
                      ) : (
                        <span style={{ fontSize: '1.2rem', color: isSelected ? '#a3e635' : 'var(--text-secondary)', marginTop: '2rem' }}>
                          {slotNum}번
                        </span>
                      )}

                      {/* 인게임 감성의 노란 별 등급 노출 */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        gap: '2px', 
                        margin: '0.2rem 0 0 0'
                      }}>
                        {Array.from({ length: sticker ? sticker.stars : 1 }).map((_, i) => (
                          <span 
                            key={i} 
                            style={{ 
                              color: isSelected ? '#fbbf24' : '#4b5563', 
                              fontSize: '1rem',
                              textShadow: isSelected ? '0 0 4px rgba(251, 191, 36, 0.9)' : 'none'
                            }}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      
                      {/* 스티커 이름 표시 */}
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'rgba(10, 8, 20, 0.88)',
                        fontSize: '1rem',
                        padding: '0.35rem 0.2rem',
                        textAlign: 'center',
                        color: isSelected ? '#fff' : '#a1a8b5',
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        fontWeight: '700',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }} title={sticker ? sticker.name : `${slotNum}번 카드`}>
                        {sticker ? sticker.name : `${slotNum}번 카드`}
                      </div>

                      {/* 선택 여부 체크 배지 */}
                      {isSelected && (
                        <div style={{ 
                          position: 'absolute', 
                          top: '8px', 
                          right: '8px', 
                          background: isHave ? '#10b981' : '#ef4444', 
                          borderRadius: '50%', 
                          padding: '3px',
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

            {/* 하단 바구니 영역 (그리드 바로 밑에 배치) */}
            <div className="glass-card" style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <ShoppingCart color="var(--primary-color)" size={18} />
                  내가 선택한 스티커 목록
                </h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="basket-split-grid">
                  {/* Haves */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontWeight: '700', fontSize: '0.85rem', color: '#10b981' }}>🟢 줄 수 있는 카드 ({myHaves.length}개)</label>
                    <div style={{ minHeight: '80px', maxHeight: '180px', overflowY: 'auto', padding: '0.5rem', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.03)' }}>
                      {myHaves.map(id => {
                        const [catId, s] = id.split('-');
                        const cat = categories.find(c => String(c.id) === catId);
                        return (
                          <span key={id} className="sticker-tag" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#a7f3d0', padding: '0.35rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '3px', margin: '2px' }}>
                            {cat ? cat.name : `${catId}페이지`} {s}번
                            <button type="button" onClick={() => toggleStickerSelection(id)} style={{ background: 'none', border: 'none', color: '#a7f3d0', cursor: 'pointer', padding: '1px', display: 'flex', alignItems: 'center' }}><X size={10} /></button>
                          </span>
                        );
                      })}
                      {myHaves.length === 0 && <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>비어 있음</div>}
                    </div>
                  </div>

                  {/* Wants */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontWeight: '700', fontSize: '0.85rem', color: '#ef4444' }}>🔴 받고 싶은 카드 ({myWants.length}개)</label>
                    <div style={{ minHeight: '80px', maxHeight: '180px', overflowY: 'auto', padding: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.03)' }}>
                      {myWants.map(id => {
                        const [catId, s] = id.split('-');
                        const cat = categories.find(c => String(c.id) === catId);
                        return (
                          <span key={id} className="sticker-tag" style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '0.35rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '3px', margin: '2px' }}>
                            {cat ? cat.name : `${catId}페이지`} {s}번
                            <button type="button" onClick={() => toggleStickerSelection(id)} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', padding: '1px', display: 'flex', alignItems: 'center' }}><X size={10} /></button>
                          </span>
                        );
                      })}
                      {myWants.length === 0 && <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>비어 있음</div>}
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
                  style={{ width: '100%', padding: '0.85rem', fontWeight: 'bold', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <Sparkles size={16} /> ⚡ 이 정보로 교환 등록하기
                </button>
              </div>
            </div>

          </div>
        )}

        {/* 게시판 리스트 섹션 */}
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
              
              // 내 Haves/Wants 리스트와 교차 대조
              const { isPerfectMatch, isPartialMatch, myWantsMatch, myHavesMatch } = checkMatching(post);
              
              const hasHaves = post.haves && post.haves.length > 0;
              const hasWants = post.wants && post.wants.length > 0;

              // 테두리 강조 스타일링
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
                    {/* 닉네임 및 매칭 뱃지 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: '800', fontSize: '1.05rem', color: '#fff' }}>{post.nickname}</span>
                          
                          {/* 실시간 접속 상태 배지 */}
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
                          ⚡ 100% 매칭 완료!
                        </span>
                      ) : isPartialMatch ? (
                        <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', fontWeight: 'bold', fontSize: '0.75rem' }}>
                          💡 부분 매칭
                        </span>
                      ) : null}
                    </div>

                    {/* 교환 상품 리스트 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1rem' }}>
                      {hasHaves && (
                        <div>
                          <div style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: '700', marginBottom: '0.2rem' }}>🟢 줄 수 있는 카드</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                            {post.haves.map(id => {
                              const [catId, s] = id.split('-');
                              const cat = categories.find(c => String(c.id) === catId);
                              return (
                                <span key={id} className="sticker-tag" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.25)', color: '#a7f3d0', fontSize: '0.72rem', padding: '0.25rem 0.45rem' }}>
                                  {cat ? cat.name : `${catId}페이지`} {s}번
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
                              return (
                                <span key={id} className="sticker-tag" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.25)', color: '#fca5a5', fontSize: '0.72rem', padding: '0.25rem 0.45rem' }}>
                                  {cat ? cat.name : `${catId}페이지`} {s}번
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 매칭 상세 카드 매칭 요약 */}
                    {(isPerfectMatch || isPartialMatch) && (
                      <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '0.5rem 0.65rem', marginBottom: '0.85rem', fontSize: '0.76rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {myWantsMatch.length > 0 && (
                          <div>
                            <span style={{ fontWeight: '700', color: '#34d399' }}>🎁 내가 받을 수 있는 카드: </span>
                            <span style={{ color: '#fff' }}>
                              {myWantsMatch.map(id => {
                                const [catId, s] = id.split('-');
                                const cat = categories.find(c => String(c.id) === catId);
                                return cat ? `${cat.name} ${s}번` : `${catId}페이지 ${s}번`;
                              }).join(', ')}
                            </span>
                          </div>
                        )}
                        {myHavesMatch.length > 0 && (
                          <div>
                            <span style={{ fontWeight: '700', color: '#f87171' }}>✅ 내가 줄 수 있는 카드: </span>
                            <span style={{ color: '#fff' }}>
                              {myHavesMatch.map(id => {
                                const [catId, s] = id.split('-');
                                const cat = categories.find(c => String(c.id) === catId);
                                return cat ? `${cat.name} ${s}번` : `${catId}페이지 ${s}번`;
                              }).join(', ')}
                            </span>
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
                        {/* 댓글 리스트 */}
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

                        {/* 댓글 작성 폼 */}
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

      {/* 푸터 */}
      <footer style={{ marginTop: 'auto', paddingTop: '3rem', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
        <p>드래곤 빌리지 3 스티커 매칭 교환소 © 2026. All Rights Reserved.</p>
        <p style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
          <Info size={14} /> 본 사이트는 드빌 3 유저 간의 교환 편의 제공을 위해 개인 제작되었습니다.
        </p>
      </footer>

      {/* 2. 내 정보 사이드 드로어 */}
      <div 
        className={`my-info-drawer-overlay ${isMyInfoOpen ? 'open' : ''}`} 
        onClick={() => setIsMyInfoOpen(false)}
      />
      <div className={`my-info-drawer ${isMyInfoOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1.2rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
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
            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                  style={{ flex: 1, padding: '0.45rem 0.6rem', fontSize: '0.8rem', borderRadius: '6px', background: '#1d2025', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
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
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
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
                      background: 'rgba(255,255,255,0.02)', 
                      border: '1px solid rgba(255,255,255,0.05)', 
                      borderRadius: '10px', 
                      padding: '0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button 
                          onClick={() => {
                            setIsMyInfoOpen(false);
                            handleOpenEditModal(post);
                          }}
                          style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}
                          title="수정하기"
                        >
                          수정
                        </button>
                        <button 
                          onClick={() => handleBumpPost(post.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}
                          title="글 맨 위로 끌어올리기"
                        >
                          끌올
                        </button>
                        <button 
                          onClick={() => handleDeletePost(post.id)}
                          style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                          title="삭제하기"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {hasHaves && (
                        <div style={{ fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <span style={{ color: '#10b981', fontWeight: '700' }}>줄 수 있음:</span>{' '}
                          <span style={{ color: 'var(--text-secondary)' }}>
                            {post.haves.map(id => {
                              const [catId, s] = id.split('-');
                              const cat = categories.find(c => String(c.id) === catId);
                              return (cat ? cat.name : `${catId}페이지`) + ` ${s}번`;
                            }).join(', ')}
                          </span>
                        </div>
                      )}
                      {hasWants && (
                        <div style={{ fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <span style={{ color: '#ef4444', fontWeight: '700' }}>받고 싶음:</span>{' '}
                          <span style={{ color: 'var(--text-secondary)' }}>
                            {post.wants.map(id => {
                              const [catId, s] = id.split('-');
                              const cat = categories.find(c => String(c.id) === catId);
                              return (cat ? cat.name : `${catId}페이지`) + ` ${s}번`;
                            }).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {posts.filter(p => p.nickname === userNickname).length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem', border: '1px dashed rgba(255,255,255,0.06)', borderRadius: '10px' }}>
                  등록된 교환 글이 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 1. 로그인 전용 강제 모달창 */}
      {showLoginModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 3, 10, 0.9)',
          backdropFilter: 'blur(15px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1.5rem'
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '420px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            padding: '2.5rem 2rem',
            borderRadius: '24px',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.65)',
            textAlign: 'center',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(133, 195, 0, 0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', border: '1px solid var(--primary-color)' }}>
                <Sparkles color="var(--primary-color)" size={30} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fff', marginBottom: '0.5rem' }}>
                드빌 3 스티커 교환소
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.4' }}>
                교환소 등록 및 1:1 실시간 채팅 매칭을 위해<br />닉네임을 입력하고 로그인해 주세요.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                  사용할 닉네임
                </label>
                <input 
                  type="text" 
                  placeholder="예: 드래곤러버" 
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                  비밀번호
                </label>
                <input 
                  type="password" 
                  placeholder="비밀번호 입력 (최소 1자 이상)" 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  ※ 자동 저장 로그인 시에만 비밀번호 저장 및 검증이 수행됩니다.
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => handleLogin(true)}
                  style={{ padding: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Sparkles size={16} /> ⚡ 일회용 게스트로 시작하기
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={() => handleLogin(false)}
                  style={{ padding: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <User size={16} /> 💾 로그인 & 회원가입 (자동 저장)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. 글 등록 모달창 */}
      {isFormOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 3, 10, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '440px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '2rem',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            position: 'relative',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <button 
              onClick={() => setIsFormOpen(false)}
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

            <form onSubmit={handleSubmitPost} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Sparkles color="#fbbf24" fill="#fbbf24" size={22} />
                  교환 등록 신청
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  교환소에 내 글을 등록하기 위해 연락처 정보를 작성해 주세요.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ flex: 1, color: '#10b981' }}>🟢 줄 수 있음: <strong>{myHaves.length}개</strong></span>
                <span style={{ flex: 1, color: '#ef4444' }}>🔴 받고 싶음: <strong>{myWants.length}개</strong></span>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <User size={14} color="var(--primary-color)" /> 내 닉네임 (로그인 계정 고정)
                </label>
                <input 
                  type="text" 
                  value={userNickname || ''} 
                  readOnly 
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)', width: '100%' }}>
                  <MessageCircle size={14} color="var(--primary-color)" /> 연락처 (카카오톡 오픈채팅 주소 등)
                  <span style={{ fontSize: '0.72rem', color: '#10b981', marginLeft: 'auto', fontWeight: 'bold' }}>(선택 사항)</span>
                </label>
                <input 
                  type="text" 
                  placeholder="예: open.kakao.com/o/xxxxxx" 
                  value={myContact}
                  onChange={(e) => setMyContact(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setIsFormOpen(false)}
                  style={{ flex: 1, padding: '0.75rem' }}
                >
                  취소
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 2, padding: '0.75rem', fontWeight: 'bold' }}
                >
                  등록 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2-2. 글 수정 모달창 */}
      {isEditModalOpen && editingPost && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 3, 10, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '520px',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '1.8rem',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            position: 'relative',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <button 
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingPost(null);
              }}
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
                  줄 수 있는 카드와 받고 싶은 카드를 자유롭게 수정하고 완료 버튼을 눌러주세요.
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
                  🟢 줄 수 있는 카드 수정 ({editHaves.length}개)
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
                  🔴 받고 싶은 카드 수정 ({editWants.length}개)
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
                        <button type="button" onClick={() => toggleEditStickerSelection(id)} style={{ background: 'none', border: 'none', color: '#a7f3d0', cursor: 'pointer', padding: '1px', display: 'flex', alignItems: 'center' }}><X size={10} /></button>
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
                        <button type="button" onClick={() => toggleEditStickerSelection(id)} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', padding: '1px', display: 'flex', alignItems: 'center' }}><X size={10} /></button>
                      </span>
                    );
                  })
                )}
                {((editBasketMode === 'haves' ? editHaves.length : editWants.length) === 0) && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '1rem 0' }}>비어 있음 (아래에서 카테고리를 골라 추가하세요)</div>
                )}
              </div>

              {/* 추가할 카드 선택 셀렉터 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>👇 스티커 터치하여 추가하기</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', maxHeight: '180px', overflowY: 'auto', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {stickersData.map(s => {
                    const isSelected = editHaves.includes(s.id) || editWants.includes(s.id);
                    let borderCol = 'rgba(255,255,255,0.08)';
                    let bgCol = 'transparent';
                    if (editHaves.includes(s.id)) {
                      borderCol = '#10b981';
                      bgCol = 'rgba(16, 185, 129, 0.15)';
                    } else if (editWants.includes(s.id)) {
                      borderCol = '#ef4444';
                      bgCol = 'rgba(239, 68, 68, 0.15)';
                    }
                    return (
                      <div 
                        key={s.id} 
                        onClick={() => toggleEditStickerSelection(s.id)}
                        style={{ 
                          border: `1px solid ${borderCol}`, 
                          background: bgCol,
                          borderRadius: '6px', 
                          padding: '4px', 
                          cursor: 'pointer', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center', 
                          textAlign: 'center',
                          opacity: isSelected ? 1 : 0.6
                        }}
                      >
                        <img src={s.image} alt={s.name} style={{ width: '28px', height: '35px', objectFit: 'contain' }} />
                        <span style={{ fontSize: '0.55rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{s.name.split(' ')[0]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingPost(null);
                  }}
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
      )}

      {/* 2-3. 신고 모달창 */}
      {isReportModalOpen && reportingTarget && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 3, 10, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '380px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '1.8rem',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            position: 'relative',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <button 
              onClick={() => {
                setIsReportModalOpen(false);
                setReportingTarget(null);
              }}
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

            <form onSubmit={handleSubmitReport} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                  🚨 신고 접수
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                  대상: <strong>{reportingTarget.details}</strong>
                </p>
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>신고 사유 선택</label>
                <select 
                  value={reportReason} 
                  onChange={(e) => setReportReason(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', background: '#181524', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff' }}
                >
                  <option value="허위 정보 / 거짓 매칭">허위 정보 / 거짓 매칭</option>
                  <option value="부적절한 연락처 / 사기 의심">부적절한 연락처 / 사기 의심</option>
                  <option value="욕설 / 비방 / 불쾌한 언행">욕설 / 비방 / 불쾌한 언행</option>
                  <option value="도배 / 중복 게시물">도배 / 중복 게시물</option>
                  <option value="기타">기타 (직접 작성)</option>
                </select>
              </div>

              {reportReason === '기타' && (
                <div className="form-group">
                  <textarea 
                    placeholder="신고 사유를 구체적으로 적어주세요 (최대 100자)" 
                    maxLength={100}
                    value={reportCustomReason}
                    onChange={(e) => setReportCustomReason(e.target.value)}
                    style={{ width: '100%', height: '80px', padding: '0.5rem', background: '#181524', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.8rem', resize: 'none' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => {
                    setIsReportModalOpen(false);
                    setReportingTarget(null);
                  }}
                  style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem' }}
                >
                  취소
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1.5, padding: '0.6rem', background: '#ef4444', borderColor: '#ef4444', color: '#fff', fontWeight: 'bold', fontSize: '0.85rem' }}
                >
                  신고 제출
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2-4. 관리자 전용 대시보드 모달 */}
      {isAdminTabOpen && userNickname === '간장' && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 3, 10, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflowY: 'auto',
            border: '2px solid #fbbf24',
            padding: '2rem',
            borderRadius: '20px',
            boxShadow: '0 0 25px rgba(251, 191, 36, 0.25)',
            position: 'relative',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <button 
              onClick={() => setIsAdminTabOpen(false)}
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  👑 관리자 전용 대시보드
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  신고된 교환글 및 댓글 내역을 통합 모니터링하고 원클릭 제재 처리를 집행합니다.
                </p>
              </div>

              {adminLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
                  <RefreshCw size={24} className="spin-anim" />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {/* 탭 버튼들 */}
                  <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem' }}>
                    <button 
                      onClick={() => setAdminActiveTab("reports")}
                      style={{
                        background: adminActiveTab === "reports" ? 'rgba(251, 191, 36, 0.12)' : 'none',
                        border: adminActiveTab === "reports" ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.08)',
                        color: adminActiveTab === "reports" ? '#fbbf24' : 'var(--text-secondary)',
                        padding: '0.45rem 0.9rem',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      🚨 신고 접수 ({reportsList.length}건)
                    </button>
                    <button 
                      onClick={() => setAdminActiveTab("logs")}
                      style={{
                        background: adminActiveTab === "logs" ? 'rgba(251, 191, 36, 0.12)' : 'none',
                        border: adminActiveTab === "logs" ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.08)',
                        color: adminActiveTab === "logs" ? '#fbbf24' : 'var(--text-secondary)',
                        padding: '0.45rem 0.9rem',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      📋 조치 완료 로그 ({adminLogs.length}건)
                    </button>
                  </div>

                  {adminActiveTab === "reports" ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>* 신고 내역을 확인하고 처리해 주세요.</span>
                        <button onClick={loadReports} className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <RefreshCw size={12} /> 새로고침
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '320px', overflowY: 'auto' }}>
                        {reportsList.map(report => (
                          <div key={report.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '0.85rem', borderRadius: '10px', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{
                                background: report.target_type === 'post' ? 'rgba(96, 165, 250, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                color: report.target_type === 'post' ? '#60a5fa' : '#f59e0b',
                                fontSize: '0.68rem',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: 'bold'
                              }}>
                                {report.target_type === 'post' ? '교환글 신고' : '댓글 신고'}
                              </span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                신고일: {new Date(report.created_at || report.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <div><span style={{ color: 'var(--text-muted)' }}>대상정보:</span> <strong>{report.target_details}</strong> (ID: {report.target_id})</div>
                              <div><span style={{ color: 'var(--text-muted)' }}>신고자:</span> {report.reporter}</div>
                              <div><span style={{ color: '#f87171', fontWeight: '700' }}>사유:</span> {report.reason}</div>
                            </div>

                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '6px' }}>
                              <button 
                                onClick={() => handleResolveReport(report.id)}
                                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', cursor: 'pointer' }}
                              >
                                신고 반려 (무시)
                              </button>
                              <button 
                                onClick={() => {
                                  if (report.target_type === 'post') {
                                    handleAdminDeletePost(report.target_id, report.id);
                                  } else {
                                    handleAdminDeleteComment(report.target_id, null, report.id);
                                  }
                                }}
                                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                              >
                                대상 강제 삭제 & 종결
                              </button>
                            </div>
                          </div>
                        ))}

                        {reportsList.length === 0 && (
                          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '2rem 0' }}>깨끗합니다! 접수된 신고가 없습니다.</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>* 처리 완료된 신고 로그 기록입니다.</span>
                        <button 
                          onClick={() => {
                            if (window.confirm("모든 처리 로그를 지우시겠습니까?")) {
                              localStorage.removeItem('dv3_admin_resolved_logs');
                              loadAdminLogs();
                            }
                          }}
                          className="btn btn-outline" 
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderColor: '#f87171', color: '#f87171' }}
                        >
                          로그 전체 비우기
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '320px', overflowY: 'auto' }}>
                        {adminLogs.map(log => (
                          <div key={log.id} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', padding: '0.85rem', borderRadius: '10px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{
                                background: log.action.includes('삭제') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                color: log.action.includes('삭제') ? '#f87171' : '#10b981',
                                fontSize: '0.68rem',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: 'bold'
                              }}>
                                {log.action}
                              </span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                {new Date(log.resolvedAt).toLocaleString('ko-KR')}
                              </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', color: 'var(--text-secondary)' }}>
                              <div><span style={{ color: 'var(--text-muted)' }}>구분:</span> {log.targetType === 'post' ? '교환글' : '댓글'} (ID: {log.targetId})</div>
                              <div><span style={{ color: 'var(--text-muted)' }}>신고자:</span> {log.reporter}</div>
                              <div><span style={{ color: 'var(--text-muted)' }}>사유:</span> {log.reason}</div>
                              <div><span style={{ color: 'var(--text-muted)' }}>상세내용:</span> {log.targetDetails}</div>
                            </div>
                          </div>
                        ))}

                        {adminLogs.length === 0 && (
                          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '2rem 0' }}>처리 완료된 로그가 없습니다.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button 
                  onClick={() => setIsAdminTabOpen(false)}
                  className="btn btn-outline" 
                  style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. 1:1 실시간 채팅 플로팅 위젯 및 윈도우 */}
      {userNickname && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
          {/* 채팅방 창이 열려있을 때 */}
          {chatWindowOpen && (
            <div className="glass-card" style={{
              width: '380px',
              height: '500px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)',
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              background: 'rgba(15, 12, 25, 0.95)',
              backdropFilter: 'blur(20px)',
              animation: 'fadeIn 0.2s ease-out'
            }}>
              {/* 채팅창 헤더 */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageSquare size={18} color="var(--primary-color)" />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#fff' }}>
                      {chatActiveRoomId ? `${chatActiveRoomNickname} 님과의 대화` : '💬 실시간 1:1 채팅방 목록'}
                    </span>
                    {chatActiveRoomId && (
                      <span style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px', color: onlineUsers.includes(chatActiveRoomNickname) ? '#34d399' : 'var(--text-muted)' }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: onlineUsers.includes(chatActiveRoomNickname) ? '#10b981' : '#6b7280', display: 'inline-block' }}></span>
                        {onlineUsers.includes(chatActiveRoomNickname) ? '실시간 접속 중' : '오프라인'}
                      </span>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => setChatWindowOpen(false)} 
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* 채팅창 메인 콘텐츠 */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {!chatActiveRoomId ? (
                  /* 3-A. 방 목록 */
                  <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {chatRooms.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '4rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        개설된 1:1 대화방이 없습니다.<br />
                        교환 피드에서 상대방 글의 <strong>[1:1 채팅]</strong> 버튼을 클릭하여 첫 대화를 시작해보세요!
                      </div>
                    ) : (
                      chatRooms.map(room => (
                        <div 
                          key={room.id}
                          onClick={() => {
                            setChatActiveRoomId(room.id);
                            setChatActiveRoomNickname(room.otherUser);
                          }}
                          style={{
                            background: room.id === chatActiveRoomId ? 'rgba(133, 195, 0, 0.12)' : 'rgba(255,255,255,0.03)',
                            border: room.id === chatActiveRoomId ? '1px solid var(--primary-color)' : '1px solid rgba(255,255,255,0.06)',
                            boxShadow: room.id === chatActiveRoomId ? '0 0 8px rgba(133, 195, 0, 0.2)' : 'none',
                            borderRadius: '12px',
                            padding: '0.85rem 1rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                          className={`chat-room-item ${room.id === chatActiveRoomId ? 'active' : ''}`}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#fff' }}>{room.otherUser}</span>
                              <span style={{ 
                                width: '6px', 
                                height: '6px', 
                                borderRadius: '50%', 
                                background: onlineUsers.includes(room.otherUser) ? '#10b981' : '#6b7280',
                                boxShadow: onlineUsers.includes(room.otherUser) ? '0 0 4px #10b981' : 'none',
                                display: 'inline-block'
                              }} title={onlineUsers.includes(room.otherUser) ? '온라인' : '오프라인'}></span>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '220px' }}>
                              {room.lastMessage || '대화를 시작해 보세요.'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {room.updatedAt ? formatChatTime(room.updatedAt) : ''}
                            </span>
                            {unreadCounts[room.id] > 0 && (
                              <span style={{
                                background: '#ef4444',
                                color: '#fff',
                                fontSize: '0.7rem',
                                fontWeight: '800',
                                padding: '2px 6px',
                                borderRadius: '10px',
                                boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)',
                                display: 'inline-block',
                                minWidth: '16px',
                                textAlign: 'center'
                              }}>
                                {unreadCounts[room.id]}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  /* 3-B. 특정 방 대화 화면 */
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}>
                    {/* 상단 액션바 */}
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.5rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center' }}>
                      <button 
                        onClick={() => {
                          setChatActiveRoomId(null);
                          setChatActiveRoomNickname('');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary-color)',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          fontWeight: '600'
                        }}
                      >
                        <ArrowLeft size={12} /> 대화방 목록
                      </button>
                    </div>

                    {/* 메시지 피드 */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '1.2rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {chatMessages.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          첫 메시지를 보내 교환 이야기를 나누어 보세요.
                        </div>
                      ) : (
                        chatMessages.map((msg, index) => {
                          const isMe = msg.sender === userNickname;
                          return (
                            <div 
                              key={index} 
                              style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: isMe ? 'flex-end' : 'flex-start',
                                width: '100%'
                              }}
                            >
                              <div style={{
                                background: isMe ? 'rgba(133, 195, 0, 0.25)' : 'rgba(255,255,255,0.08)',
                                border: isMe ? '1px solid rgba(133, 195, 0, 0.4)' : '1px solid rgba(255,255,255,0.1)',
                                color: '#fff',
                                padding: '0.55rem 0.85rem',
                                borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                                fontSize: '0.85rem',
                                maxWidth: '78%',
                                wordBreak: 'break-all',
                                lineHeight: '1.4'
                              }}>
                                {msg.text}
                              </div>
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                {new Date(msg.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          );
                        })
                      )}
                      <div ref={chatScrollRef} />
                    </div>

                    {/* 입력창 */}
                    <form 
                      onSubmit={handleSendMessage}
                      style={{
                        padding: '0.75rem',
                        background: 'rgba(0,0,0,0.3)',
                        borderTop: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex',
                        gap: '6px'
                      }}
                    >
                      <input 
                        type="text" 
                        placeholder="메시지를 입력하세요..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        style={{ flex: 1, padding: '0.55rem', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid var(--border-color)' }}
                        required
                      />
                      <button 
                        type="submit" 
                        className="btn btn-primary"
                        style={{ padding: '0.55rem 1rem', fontSize: '0.85rem', fontWeight: 'bold' }}
                      >
                        전송
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 실시간 새 메시지 토스트 미리보기 알림 팝업 */}
          {chatNotification && (
            <div 
              onClick={() => {
                setChatActiveRoomId(chatNotification.roomId);
                const parts = chatNotification.roomId.replace('room-', '').split('-');
                const other = parts[0] === userNickname ? parts[1] : parts[0];
                setChatActiveRoomNickname(other || '상대방');
                setChatWindowOpen(true);
                setChatNotification(null);
              }}
              style={{
                background: 'rgba(20, 16, 35, 0.95)',
                border: '1.5px solid var(--primary-color)',
                boxShadow: '0 8px 32px rgba(133, 195, 0, 0.25), 0 0 15px rgba(133, 195, 0, 0.15)',
                borderRadius: '16px',
                padding: '0.85rem 1.1rem',
                width: '280px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                backdropFilter: 'blur(15px)',
                position: 'absolute',
                bottom: '72px',
                right: '0',
                zIndex: 10001
              }}
              className="toast-slide-up"
            >
              <div style={{ background: 'rgba(133, 195, 0, 0.15)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MessageSquare size={18} color="var(--primary-color)" />
              </div>
              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--primary-color)', fontWeight: '700', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>💬 새 메시지</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>방금 전</span>
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                  {chatNotification.sender}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '1px' }}>
                  {chatNotification.text}
                </div>
              </div>
            </div>
          )}

          {/* 동그란 플로팅 말풍선 토글 버튼 */}
          <button
            onClick={() => setChatWindowOpen(prev => !prev)}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--primary-color)',
              border: 'none',
              boxShadow: '0 4px 16px rgba(133, 195, 0, 0.5)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              transition: 'transform 0.2s',
              position: 'relative'
            }}
            className="chat-toggle-btn"
            title="실시간 1:1 채팅방 열기"
          >
            <MessageSquare size={24} />
            {/* 안 읽은 새 알림 표시 배지 */}
            {Object.values(unreadCounts).reduce((a, b) => a + b, 0) > 0 && (
              <span style={{ 
                position: 'absolute', 
                top: '-5px', 
                right: '-5px', 
                background: '#ef4444', 
                color: '#fff', 
                fontSize: '0.75rem', 
                fontWeight: '800', 
                borderRadius: '12px', 
                minWidth: '20px', 
                height: '20px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '0 5px', 
                border: '2px solid rgba(15, 12, 25, 0.95)',
                boxShadow: '0 0 10px rgba(239, 68, 68, 0.7)'
              }}>
                {Object.values(unreadCounts).reduce((a, b) => a + b, 0)}
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
