import { useState, useEffect, useRef } from 'react';
import { chatService } from '../chatService';
import { supabase, isMock } from '../supabaseClient';

export function useChatViewModel({ userNickname }) {
  const [chatRooms, setChatRooms] = useState([]);
  const [chatActiveRoomId, setChatActiveRoomId] = useState(null);
  const [chatActiveRoomNickname, setChatActiveRoomNickname] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatWindowOpen, setChatWindowOpen] = useState(false);

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
  const chatScrollRef = useRef(null);

  // 대화방 목록 조회
  const loadChatRooms = async () => {
    if (!userNickname) return;
    try {
      const rooms = await chatService.getMyChatRooms(userNickname);
      setChatRooms(rooms || []);
    } catch (err) {
      console.error("대화방 목록 로드 실패:", err);
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
      console.error("구버전 대화방 마이그레이션 중 예외:", err);
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
      await loadChatRooms();
    } catch (err) {
      alert("1:1 대화방 개설에 실패했습니다: " + err.message);
    }
  };

  // 메시지 보내기
  const handleSendMessage = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!chatInput.trim() || !chatActiveRoomId) return;
    try {
      await chatService.sendMessage(chatActiveRoomId, userNickname, chatInput.trim());
      setChatInput('');
      await loadChatRooms();
    } catch (err) {
      alert("메시지 전송에 실패했습니다: " + err.message);
    }
  };

  // 활성 대화방 실시간 메시지 구독
  useEffect(() => {
    if (!chatActiveRoomId) {
      setChatMessages([]);
      return;
    }

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

  // 글로벌 새 대화방 감지 훅 (누군가 나에게 처음 1:1 대화를 시도했을 때 대화방 실시간 추가 연동)
  useEffect(() => {
    if (!userNickname) return;

    const unsubscribe = chatService.subscribeMyRooms(userNickname, () => {
      loadChatRooms();
    });

    return () => unsubscribe();
  }, [userNickname]);

  // 안 읽은 메시지 수에 따라 브라우저 탭 타이틀에 숫자 표시
  useEffect(() => {
    const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
    if (totalUnread > 0) {
      document.title = `(${totalUnread}) 드래곤 빌리지 3 카드교환소`;
    } else {
      document.title = `드래곤 빌리지 3 카드교환소`;
    }
  }, [unreadCounts]);

  return {
    chatRooms,
    chatActiveRoomId,
    setChatActiveRoomId,
    chatActiveRoomNickname,
    setChatActiveRoomNickname,
    chatMessages,
    chatInput,
    setChatInput,
    chatWindowOpen,
    setChatWindowOpen,
    unreadCounts,
    setUnreadCounts,
    chatNotification,
    setChatNotification,
    chatScrollRef,
    loadChatRooms,
    handleStartChat,
    handleSendMessage
  };
}
