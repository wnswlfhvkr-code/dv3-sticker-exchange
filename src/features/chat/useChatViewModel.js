/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef } from 'react';
import { chatService } from '../../chatService';
import { supabase, isMock } from '../../supabaseClient';
import { sanitizeInput } from '../../utils/security';
import { installChatSoundUnlock, playChatNotificationSound } from './chatSound';

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

  // 실시간 메시지 수신 시 소켓 재구독 프리징을 방지하기 위한 최신 상태 ref 매핑
  const chatWindowOpenRef = useRef(chatWindowOpen);
  const chatActiveRoomIdRef = useRef(chatActiveRoomId);

  useEffect(() => {
    chatWindowOpenRef.current = chatWindowOpen;
  }, [chatWindowOpen]);

  useEffect(() => {
    installChatSoundUnlock();
  }, []);

  useEffect(() => {
    chatActiveRoomIdRef.current = chatActiveRoomId;
  }, [chatActiveRoomId]);

  const chatActiveRoomNicknameRef = useRef(chatActiveRoomNickname);
  useEffect(() => {
    chatActiveRoomNicknameRef.current = chatActiveRoomNickname;
  }, [chatActiveRoomNickname]);

  // 대화방 목록 조회 (otherUser 닉네임 매핑 및 실제 마지막 메시지 강제 보정 처리 추가)
  const loadChatRooms = async (forceRoom = null) => {
    if (!userNickname) return;
    try {
      const rooms = await chatService.getMyChatRooms(userNickname);
      
      // 각 방의 최신 메시지를 직접 쿼리하여 보정 (Supabase RLS/동기화 딜레이 해결)
      let mappedRooms = await Promise.all((rooms || []).map(async (r) => {
        const otherUser = r.buyerNickname === userNickname ? r.sellerNickname : r.buyerNickname;
        
        let lastMsgText = r.lastMessage;
        let lastMsgTime = r.updatedAt;
        
        try {
          const msgs = await chatService.getMessages(r.id);
          if (msgs && msgs.length > 0) {
            const lastMsg = msgs[msgs.length - 1];
            lastMsgText = lastMsg.text;
            lastMsgTime = lastMsg.timestamp;
          }
        } catch (e) {
          console.warn(`방 ${r.id}의 마지막 메시지 조회 실패:`, e);
        }

        return { 
          ...r, 
          otherUser,
          lastMessage: lastMsgText,
          updatedAt: lastMsgTime
        };
      }));

      // [보완] 만약 현재 활성화된 대화방(chatActiveRoomIdRef.current)이 있고 목록에 없다면, 수동 추가로 즉각 반영 보장
      const activeId = forceRoom ? forceRoom.id : chatActiveRoomIdRef.current;
      const activeNickname = forceRoom ? forceRoom.nickname : chatActiveRoomNicknameRef.current;
      if (activeId && activeNickname && !mappedRooms.some(r => r.id === activeId)) {
        let lastMsgText = '';
        let lastMsgTime = new Date().toISOString();
        try {
          const msgs = await chatService.getMessages(activeId);
          if (msgs && msgs.length > 0) {
            const lastMsg = msgs[msgs.length - 1];
            lastMsgText = lastMsg.text;
            lastMsgTime = lastMsg.timestamp;
          }
        } catch (e) {
          console.warn("활성 방 메시지 조회 실패:", e);
        }

        mappedRooms.push({
          id: activeId,
          postId: null,
          buyerNickname: userNickname,
          sellerNickname: activeNickname,
          otherUser: activeNickname,
          lastMessage: lastMsgText,
          updatedAt: lastMsgTime
        });
      }

      // 업데이트 시간 순으로 정렬 (최신 대화방이 위로 오도록)
      mappedRooms.sort((a, b) => {
        const timeA = new Date(a.updatedAt || 0);
        const timeB = new Date(b.updatedAt || 0);
        return timeB - timeA;
      });

      setChatRooms(mappedRooms);
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
        } catch {
          allRooms = [];
        }
      } else {
        const [{ data: asBuyer, error: e1 }, { data: asSeller, error: e2 }] = await Promise.all([
          supabase.from('chat_rooms').select('*').eq('buyer_nickname', myNickname),
          supabase.from('chat_rooms').select('*').eq('seller_nickname', myNickname)
        ]);
        if (!e1 && !e2) {
          const allMap = {};
          [...(asBuyer || []), ...(asSeller || [])].forEach(r => { allMap[r.id] = r; });
          allRooms = Object.values(allMap).map(r => ({
            id: r.id,
            postId: r.post_id,
            buyerNickname: r.buyer_nickname,
            sellerNickname: r.seller_nickname,
            lastMessage: r.last_message,
            updatedAt: r.updated_at
          }));
        }
      }

      const oldRooms = allRooms.filter(r => !(r.id || '').startsWith('room-'));

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
      await loadChatRooms({ id: room.id, nickname: post.nickname });
    } catch (err) {
      alert("1:1 대화방 개설에 실패했습니다: " + err.message);
    }
  };

  // 메시지 보내기
  const handleSendMessage = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!chatInput.trim() || !chatActiveRoomId) return;
    try {
      const sanitizedText = sanitizeInput(chatInput.trim());
      const sentMsg = await chatService.sendMessage(chatActiveRoomId, userNickname, sanitizedText);
      setChatInput('');
      
      // 발송 메시지 메모리 목록 선갱신
      if (sentMsg) {
        setChatRooms(prevRooms => {
          const index = prevRooms.findIndex(r => r.id === chatActiveRoomId);
          if (index === -1) {
            loadChatRooms();
            return prevRooms;
          }
          const updatedRooms = [...prevRooms];
          updatedRooms[index] = {
            ...updatedRooms[index],
            lastMessage: sentMsg.text,
            updatedAt: sentMsg.timestamp
          };
          return updatedRooms.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
        });
      }
      
      // 0.5초 뒤 최종 DB 데이터 쿼리 반영
      setTimeout(() => {
        loadChatRooms();
      }, 500);
    } catch (err) {
      alert("메시지 전송에 실패했습니다: " + err.message);
    }
  };

  const handleLeaveChatRoom = async (roomId) => {
    if (!roomId || !userNickname) return;
    const targetRoom = chatRooms.find(room => room.id === roomId);
    const otherUser = targetRoom?.otherUser || '상대방';
    if (!window.confirm(`${otherUser} 님과의 채팅방을 목록에서 나가시겠습니까?\n상대가 새 메시지를 보내면 방이 다시 표시됩니다.`)) {
      return;
    }

    chatService.leaveChatRoom(userNickname, roomId);
    setUnreadCounts(prev => {
      const next = { ...prev, [roomId]: 0 };
      localStorage.setItem(`dv3_unread_${roomId}`, '0');
      return next;
    });

    if (chatActiveRoomIdRef.current === roomId) {
      setChatActiveRoomId(null);
      setChatActiveRoomNickname('');
      setChatMessages([]);
    }

    await loadChatRooms();
  };

  // 활성 대화방 실시간 메시지 구독 및 최초 히스토리 로드
  useEffect(() => {
    if (!chatActiveRoomId) {
      setChatMessages([]);
      return;
    }

    const loadInitialMessages = async () => {
      try {
        const msgs = await chatService.getMessages(chatActiveRoomId);
        setChatMessages(msgs || []);
      } catch (e) {
        console.warn("이전 대화 로드 실패:", e);
      }
    };
    loadInitialMessages();

    const unsubscribe = chatService.subscribeMessages(chatActiveRoomId, (msgs) => {
      setChatMessages(msgs || []);
      
      if (msgs && msgs.length > 0) {
        const lastMsg = msgs[msgs.length - 1];
        setChatRooms(prevRooms => {
          const index = prevRooms.findIndex(r => r.id === chatActiveRoomId);
          if (index === -1) {
            loadChatRooms();
            return prevRooms;
          }
          const updatedRooms = [...prevRooms];
          updatedRooms[index] = {
            ...updatedRooms[index],
            lastMessage: lastMsg.text,
            updatedAt: lastMsg.timestamp
          };
          return updatedRooms.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
        });
      }
      
      setTimeout(() => {
        loadChatRooms();
      }, 500);
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

  // 채팅방 활성화 및 창 열림, 혹은 메시지 갱신 시 안 읽은 메시지 수 리셋
  useEffect(() => {
    if (chatActiveRoomId && chatWindowOpen) {
      setUnreadCounts(prev => {
        if (prev[chatActiveRoomId] === 0) return prev;
        const next = { ...prev, [chatActiveRoomId]: 0 };
        localStorage.setItem(`dv3_unread_${chatActiveRoomId}`, '0');
        // 로컬 업데이트 이벤트를 발생시켜 다른 탭에도 알림
        window.dispatchEvent(new Event('dv3_chat_update'));
        return next;
      });
    }
  }, [chatActiveRoomId, chatWindowOpen, chatMessages]);

  // 탭 간/스토리지 변경 간 안 읽은 카운트 실시간 동기화
  useEffect(() => {
    const syncUnreadCounts = () => {
      const counts = {};
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('dv3_unread_')) {
            const roomId = key.replace('dv3_unread_', '');
            counts[roomId] = parseInt(localStorage.getItem(key)) || 0;
          }
        }
        setUnreadCounts(counts);
      } catch (e) {
        console.error("안 읽은 메시지 동기화 실패:", e);
      }
    };

    window.addEventListener('storage', syncUnreadCounts);
    window.addEventListener('dv3_chat_update', syncUnreadCounts);

    return () => {
      window.removeEventListener('storage', syncUnreadCounts);
      window.removeEventListener('dv3_chat_update', syncUnreadCounts);
    };
  }, []);

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
      // 실시간 메시지 수신 시 목록 최신 상태 즉각 메모리 선반영
      setChatRooms(prevRooms => {
        const index = prevRooms.findIndex(r => r.id === msg.roomId);
        if (index === -1) {
          loadChatRooms();
          return prevRooms;
        }
        const updatedRooms = [...prevRooms];
        updatedRooms[index] = {
          ...updatedRooms[index],
          lastMessage: msg.text,
          updatedAt: msg.timestamp
        };
        return updatedRooms.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
      });

      setTimeout(() => {
        loadChatRooms();
      }, 500);
      
      // 1. 상대방이 보낸 메시지인 경우, 활성화된 대화방 여부와 상관없이 무조건 알림음 재생
      if (msg.sender !== userNickname) {
        playChatNotificationSound();

        // 2. 현재 열려 있는 방이 아니거나 채팅방 창이 아예 닫혀있을 때만 안 읽은 카운트 및 토스트 팝업 알림 적용
        if (!chatWindowOpenRef.current || chatActiveRoomIdRef.current !== msg.roomId) {
          // 안 읽은 개수 증가
          setUnreadCounts(prev => {
            const newCount = (prev[msg.roomId] || 0) + 1;
            localStorage.setItem(`dv3_unread_${msg.roomId}`, String(newCount));
            return { ...prev, [msg.roomId]: newCount };
          });

          // 토스트 팝업 알림 설정
          setChatNotification({
            sender: msg.sender,
            text: msg.text,
            roomId: msg.roomId
          });
        }
      }
    });

    return () => unsubscribe();
  }, [userNickname]);

  // 글로벌 새 대화방 감지 훅 (누군가 나에게 처음 1:1 대화를 시도했을 때 대화방 실시간 추가 연동)
  useEffect(() => {
    if (!userNickname) return;

    const unsubscribe = chatService.subscribeMyRooms(userNickname, () => {
      loadChatRooms();
    });

    return () => unsubscribe();
  }, [userNickname]);

  // 대화방 목록 화면으로 복귀할 때(또는 로그인 시) 최신 방 목록을 강제 로딩
  useEffect(() => {
    if (chatActiveRoomId === null && userNickname) {
      loadChatRooms();
    }
  }, [chatActiveRoomId, userNickname]);

  // 안 읽은 메시지 수에 따라 브라우저 탭 타이틀에 숫자 표시
  useEffect(() => {
    const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
    if (totalUnread > 0) {
      document.title = `(${totalUnread}) 드래곤빌리지3 카드교환소`;
    } else {
      document.title = `드래곤빌리지3 카드교환소`;
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
    handleSendMessage,
    handleLeaveChatRoom
  };
}
