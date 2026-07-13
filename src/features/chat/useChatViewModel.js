/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef, useCallback } from 'react';
import { chatService } from '../../chatService';
import { supabase, isMock } from '../../supabaseClient';
import { sanitizeInput } from '../../utils/security';
import { installChatSoundUnlock, playChatNotificationSound } from './chatSound';
import {
  createChatReadCursor,
  getChatMessageKey,
  getChatReadStorageKey,
  getChatSyncStorageKey,
  getChatUnreadStorageKey,
  getRoomIdFromUnreadStorageKey,
  mergeChatReadCursors,
  mergeUnreadIncomingMessages,
  parseChatReadCursor,
  resolveUnreadSnapshot,
  serializeChatReadCursor
} from './unreadTracking';

const loadStoredUnreadCounts = (nickname) => {
  const counts = {};
  if (!nickname) return counts;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const roomId = getRoomIdFromUnreadStorageKey(nickname, key);
      if (roomId) counts[roomId] = parseInt(localStorage.getItem(key), 10) || 0;
    }
  } catch (error) {
    console.error('안 읽은 메시지 수 로딩 에러:', error);
  }

  return counts;
};

const getStoredUnreadCount = (storageKey) => {
  try {
    return parseInt(localStorage.getItem(storageKey), 10) || 0;
  } catch {
    return 0;
  }
};

export function useChatViewModel({ userNickname }) {
  const [chatRooms, setChatRooms] = useState([]);
  const [chatActiveRoomId, setChatActiveRoomId] = useState(null);
  const [chatActiveRoomNickname, setChatActiveRoomNickname] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatWindowOpen, setChatWindowOpen] = useState(false);

  // 안 읽은 메시지 개수 관리 (로컬스토리지 복구 지원)
  const [unreadCounts, setUnreadCounts] = useState({});

  // 실시간 메시지 미리보기 팝업(Toast) 알림 상태
  const [chatNotification, setChatNotification] = useState(null);
  const chatScrollRef = useRef(null);

  // 실시간 메시지 수신 시 소켓 재구독 프리징을 방지하기 위한 최신 상태 ref 매핑
  const chatWindowOpenRef = useRef(chatWindowOpen);
  const chatActiveRoomIdRef = useRef(chatActiveRoomId);
  const userNicknameRef = useRef(userNickname);
  const incomingMessageVersionRef = useRef(0);
  const recentIncomingMessagesRef = useRef([]);
  const processedIncomingMessageIdsRef = useRef(new Set());
  const pendingRecoveredNotificationRef = useRef(null);
  const unreadSyncInFlightRef = useRef(null);

  useEffect(() => {
    chatWindowOpenRef.current = chatWindowOpen;
  }, [chatWindowOpen]);

  useEffect(() => {
    installChatSoundUnlock();
  }, []);

  useEffect(() => {
    chatActiveRoomIdRef.current = chatActiveRoomId;
  }, [chatActiveRoomId]);

  useEffect(() => {
    userNicknameRef.current = userNickname;
    incomingMessageVersionRef.current = 0;
    recentIncomingMessagesRef.current = [];
    processedIncomingMessageIdsRef.current.clear();
    pendingRecoveredNotificationRef.current = null;
    setUnreadCounts(loadStoredUnreadCounts(userNickname));
  }, [userNickname]);

  const chatActiveRoomNicknameRef = useRef(chatActiveRoomNickname);
  useEffect(() => {
    chatActiveRoomNicknameRef.current = chatActiveRoomNickname;
  }, [chatActiveRoomNickname]);

  const persistRoomReadCursor = useCallback((roomId, nextCursor) => {
    if (!userNickname || !roomId || !nextCursor) return null;

    try {
      const storageKey = getChatReadStorageKey(userNickname, roomId);
      const mergedCursor = mergeChatReadCursors(localStorage.getItem(storageKey), nextCursor);
      const serializedCursor = serializeChatReadCursor(mergedCursor);
      if (serializedCursor) localStorage.setItem(storageKey, serializedCursor);
      return serializedCursor;
    } catch (error) {
      console.warn(`방 ${roomId}의 읽음 위치 저장 실패:`, error);
      return null;
    }
  }, [userNickname]);

  const markRoomAsRead = useCallback((roomId, messages = []) => {
    if (!userNickname || !roomId) return;

    const unreadStorageKey = getChatUnreadStorageKey(userNickname, roomId);
    persistRoomReadCursor(roomId, createChatReadCursor(messages));

    try {
      const hadUnread = (parseInt(localStorage.getItem(unreadStorageKey), 10) || 0) > 0;
      localStorage.setItem(unreadStorageKey, '0');
      localStorage.removeItem(`dv3_unread_${roomId}`);

      setUnreadCounts(prev => {
        if (!prev[roomId]) return prev;
        return { ...prev, [roomId]: 0 };
      });

      if (hadUnread) {
        window.dispatchEvent(new Event('dv3_chat_update'));
      }
    } catch (error) {
      console.warn('채팅 안읽음 수 초기화 실패:', error);
    }
  }, [userNickname, persistRoomReadCursor]);

  const syncUnreadMessages = useCallback(async () => {
    if (!userNickname) return [];

    const currentSync = unreadSyncInFlightRef.current;
    if (currentSync?.nickname === userNickname) {
      return currentSync.promise;
    }

    const syncPromise = (async () => {
      const syncStartedAt = new Date().toISOString();
      const realtimeVersionAtStart = incomingMessageVersionRef.current;
      const syncStorageKey = getChatSyncStorageKey(userNickname);
      let previousSyncAt = null;

      try {
        previousSyncAt = localStorage.getItem(syncStorageKey);
      } catch (error) {
        console.warn('이전 채팅 동기화 시각 조회 실패:', error);
      }

      const rooms = await chatService.getMyChatRooms(userNickname, { includeHidden: true });
      const roomResults = await Promise.all((rooms || []).map(async (room) => {
        try {
          const readStorageKey = getChatReadStorageKey(userNickname, room.id);
          const unreadStorageKey = getChatUnreadStorageKey(userNickname, room.id);
          const persistedUnreadCount = getStoredUnreadCount(unreadStorageKey);
          let lastReadCursor = null;

          try {
            lastReadCursor = localStorage.getItem(readStorageKey);
          } catch (error) {
            console.warn(`방 ${room.id}의 읽음 위치 조회 실패:`, error);
          }

          const parsedReadCursor = parseChatReadCursor(lastReadCursor);
          const messages = await chatService.getMessages(room.id, {
            since: parsedReadCursor?.timestamp || null
          });

          const snapshot = resolveUnreadSnapshot({
            messages,
            nickname: userNickname,
            lastReadCursor,
            previousSyncAt
          });

          if (!lastReadCursor && snapshot.isBootstrap && snapshot.lastReadCursor) {
            persistRoomReadCursor(room.id, snapshot.lastReadCursor);
          }

          return {
            ok: true,
            snapshot: {
              roomId: room.id,
              persistedUnreadCount,
              ...snapshot
            }
          };
        } catch (error) {
          console.warn(`방 ${room.id}의 안읽음 동기화 실패:`, error);
          return { ok: false, roomId: room.id };
        }
      }));
      const failedRoomIds = new Set(
        roomResults.filter((result) => !result.ok).map((result) => result.roomId)
      );
      const snapshots = roomResults
        .filter((result) => result.ok)
        .map((result) => result.snapshot);

      if (userNicknameRef.current !== userNickname) return [];

      const realtimeMessagesDuringSync = recentIncomingMessagesRef.current
        .filter(({ version }) => version > realtimeVersionAtStart)
        .map(({ message }) => message);
      const reconciledSnapshots = snapshots.map((snapshot) => {
        const isOpenRoom = chatWindowOpenRef.current
          && String(chatActiveRoomIdRef.current) === String(snapshot.roomId);
        const unreadMessages = isOpenRoom
          ? []
          : mergeUnreadIncomingMessages({
              snapshotMessages: snapshot.unreadMessages,
              realtimeMessages: realtimeMessagesDuringSync,
              nickname: userNickname,
              roomId: snapshot.roomId
            });

        return {
          ...snapshot,
          unreadMessages,
          unreadCount: unreadMessages.length
        };
      });

      const newlyRecoveredMessages = [];
      for (const snapshot of reconciledSnapshots) {
        for (const message of snapshot.unreadMessages) {
          const messageKey = getChatMessageKey(snapshot.roomId, message);
          if (!processedIncomingMessageIdsRef.current.has(messageKey)) {
            processedIncomingMessageIdsRef.current.add(messageKey);
            newlyRecoveredMessages.push(message);
          }
        }

        if (Math.max(snapshot.unreadCount, snapshot.persistedUnreadCount) > 0) {
          chatService.restoreChatRoom(userNickname, snapshot.roomId);
        }

        if (chatWindowOpenRef.current
          && String(chatActiveRoomIdRef.current) === String(snapshot.roomId)) {
          persistRoomReadCursor(snapshot.roomId, snapshot.latestCursor);
        }
      }

      if (failedRoomIds.size === 0) {
        try {
          localStorage.setItem(syncStorageKey, syncStartedAt);
        } catch (error) {
          console.warn('채팅 동기화 시각 저장 실패:', error);
        }
      }

      const hadRealtimeDuringSync = incomingMessageVersionRef.current !== realtimeVersionAtStart;
      setUnreadCounts(prev => {
        const next = hadRealtimeDuringSync || failedRoomIds.size > 0 ? { ...prev } : {};

        for (const snapshot of reconciledSnapshots) {
          const isOpenRoom = chatWindowOpenRef.current
            && String(chatActiveRoomIdRef.current) === String(snapshot.roomId);
          let unreadCount = isOpenRoom ? 0 : snapshot.unreadCount;
          const unreadStorageKey = getChatUnreadStorageKey(userNickname, snapshot.roomId);
          const legacyUnreadStorageKey = `dv3_unread_${snapshot.roomId}`;

          if (!isOpenRoom) {
            unreadCount = Math.max(unreadCount, snapshot.persistedUnreadCount);
          }

          if (!isOpenRoom && (hadRealtimeDuringSync || snapshot.isBootstrap)) {
            unreadCount = Math.max(unreadCount, prev[snapshot.roomId] || 0);
          }

          next[snapshot.roomId] = unreadCount;
          try {
            localStorage.setItem(unreadStorageKey, String(unreadCount));
            localStorage.removeItem(legacyUnreadStorageKey);
          } catch (error) {
            console.warn(`방 ${snapshot.roomId}의 안읽음 수 저장 실패:`, error);
          }
        }

        return next;
      });

      if (newlyRecoveredMessages.length > 0) {
        const latestRecovered = [...newlyRecoveredMessages].sort(
          (a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
        )[0];
        const notification = {
          sender: latestRecovered.sender,
          text: latestRecovered.text,
          roomId: latestRecovered.roomId
        };

        if (document.visibilityState === 'visible') {
          setChatNotification(notification);
        } else {
          pendingRecoveredNotificationRef.current = notification;
        }
      }

      return reconciledSnapshots;
    })();

    const syncRecord = { nickname: userNickname, promise: syncPromise };
    unreadSyncInFlightRef.current = syncRecord;

    try {
      return await syncPromise;
    } catch (error) {
      console.warn('재접속 채팅 안읽음 동기화 실패:', error);
      return [];
    } finally {
      if (unreadSyncInFlightRef.current === syncRecord) {
        unreadSyncInFlightRef.current = null;
      }
    }
  }, [userNickname, persistRoomReadCursor]);

  const syncUnreadMessagesAfterConnection = useCallback(async () => {
    if (!userNickname) return [];

    const syncRunningWhenConnected = unreadSyncInFlightRef.current;
    if (syncRunningWhenConnected?.nickname === userNickname) {
      try {
        await syncRunningWhenConnected.promise;
      } catch {
        // A fresh post-subscription query below is still required after a failed attempt.
      }
      if (unreadSyncInFlightRef.current === syncRunningWhenConnected) {
        unreadSyncInFlightRef.current = null;
      }
    }

    if (userNicknameRef.current !== userNickname) return [];
    return syncUnreadMessages();
  }, [userNickname, syncUnreadMessages]);

  // 대화방 목록 조회 (otherUser 닉네임 매핑 및 실제 마지막 메시지 강제 보정 처리 추가)
  const loadChatRooms = useCallback(async (forceRoom = null) => {
    if (!userNickname) return;
    try {
      const rooms = await chatService.getMyChatRooms(userNickname);
      
      // 각 방의 최신 메시지를 직접 쿼리하여 보정 (Supabase RLS/동기화 딜레이 해결)
      let mappedRooms = await Promise.all((rooms || []).map(async (r) => {
        const otherUser = r.buyerNickname === userNickname ? r.sellerNickname : r.buyerNickname;
        
        let lastMsgText = r.lastMessage;
        let lastMsgTime = r.updatedAt;
        
        try {
          const lastMsg = await chatService.getLatestMessage(r.id);
          if (lastMsg) {
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
          const lastMsg = await chatService.getLatestMessage(activeId);
          if (lastMsg) {
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
  }, [userNickname]);

  // 구버전 파편화 대화방 데이터를 최신 1:1 통합 방 체계로 마이그레이션하고 통합하는 함수
  const runDatabaseMigration = useCallback(async (myNickname) => {
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
  }, [loadChatRooms]);

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
      
      // 발송 메시지 메모리 목록 선갱신 및 현재 대화방 메인 스레드 즉시 주입
      if (sentMsg) {
        setChatMessages(prev => {
          if (prev.some(m => String(m.id) === String(sentMsg.id))) return prev;
          return [...prev, sentMsg];
        });

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

    const messagesToMark = chatActiveRoomIdRef.current === roomId
      ? chatMessages
      : [{ timestamp: targetRoom?.updatedAt || new Date().toISOString() }];
    markRoomAsRead(roomId, messagesToMark);
    chatService.leaveChatRoom(userNickname, roomId);

    if (chatActiveRoomIdRef.current === roomId) {
      setChatActiveRoomId(null);
      setChatActiveRoomNickname('');
      setChatMessages([]);
    }

    await loadChatRooms();
  };

  // 활성 대화방 최초 히스토리 로드 (실시간 구독은 글로벌 subscribeAllMyMessages에서 통합 처리)
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
  }, [chatActiveRoomId]);

  // 새 대화 전송/수신 시 스크롤 자동 하단 이동
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // 로그인 상태일 때 90초마다 대화방 목록 리프레시 (화면 활성화 상태에서만 동작하여 Egress 극적으로 아낌)
  useEffect(() => {
    if (userNickname) {
      const refreshAfterReconnect = async () => {
        await syncUnreadMessages();
        await loadChatRooms();
      };

      runDatabaseMigration(userNickname);
      refreshAfterReconnect();

      let timer = null;

      const startTimer = () => {
        if (timer) clearInterval(timer);
        timer = setInterval(() => {
          if (document.visibilityState === 'visible') {
            refreshAfterReconnect();
          }
        }, 90000); // 45초 -> 90초로 대폭 늘려 대역폭(Egress) 절약 극대화 (실시간 WebSocket이 보조하므로 충분)
      };

      const stopTimer = () => {
        if (timer) {
          clearInterval(timer);
          timer = null;
        }
      };

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          if (pendingRecoveredNotificationRef.current) {
            setChatNotification(pendingRecoveredNotificationRef.current);
            pendingRecoveredNotificationRef.current = null;
          }
          refreshAfterReconnect();
          startTimer();
        } else {
          stopTimer();
        }
      };

      // 초기 기동
      if (document.visibilityState === 'visible') {
        startTimer();
      }

      const handleChatUpdate = () => {
        if (document.visibilityState === 'visible') {
          loadChatRooms();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('dv3_chat_update', handleChatUpdate);
      window.addEventListener('online', refreshAfterReconnect);

      return () => {
        stopTimer();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('dv3_chat_update', handleChatUpdate);
        window.removeEventListener('online', refreshAfterReconnect);
      };
    }
  }, [userNickname, syncUnreadMessages, loadChatRooms, runDatabaseMigration]);

  // 열린 대화방의 메시지를 읽음 처리하고 재접속 기준 위치를 저장
  useEffect(() => {
    if (chatActiveRoomId && chatWindowOpen) {
      const messagesBelongToActiveRoom = chatMessages.length === 0
        || chatMessages.every(message => String(message.roomId) === String(chatActiveRoomId));

      if (messagesBelongToActiveRoom) {
        markRoomAsRead(chatActiveRoomId, chatMessages);
      }
    }
  }, [chatActiveRoomId, chatWindowOpen, chatMessages, markRoomAsRead]);

  // 탭 간/스토리지 변경 간 안 읽은 카운트 실시간 동기화
  useEffect(() => {
    const syncUnreadCounts = () => {
      setUnreadCounts(loadStoredUnreadCounts(userNickname));
    };

    window.addEventListener('storage', syncUnreadCounts);
    window.addEventListener('dv3_chat_update', syncUnreadCounts);

    return () => {
      window.removeEventListener('storage', syncUnreadCounts);
      window.removeEventListener('dv3_chat_update', syncUnreadCounts);
    };
  }, [userNickname]);

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
    recentIncomingMessagesRef.current = [];
    processedIncomingMessageIdsRef.current.clear();

    const unsubscribe = chatService.subscribeAllMyMessages(userNickname, (msg) => {
      const messageKey = getChatMessageKey(msg.roomId, msg);
      if (processedIncomingMessageIdsRef.current.has(messageKey)) return;
      processedIncomingMessageIdsRef.current.add(messageKey);
      incomingMessageVersionRef.current += 1;
      recentIncomingMessagesRef.current.push({
        version: incomingMessageVersionRef.current,
        message: msg
      });

      if (recentIncomingMessagesRef.current.length > 1000) {
        recentIncomingMessagesRef.current.splice(0, recentIncomingMessagesRef.current.length - 1000);
      }

      if (processedIncomingMessageIdsRef.current.size > 1000) {
        const oldestKey = processedIncomingMessageIdsRef.current.values().next().value;
        processedIncomingMessageIdsRef.current.delete(oldestKey);
      }

      // ★ 핵심: 현재 열려있는 활성 대화방의 메시지이면, chatMessages 상태에 즉시 주입하여 말풍선 렌더링
      if (chatActiveRoomIdRef.current && String(msg.roomId) === String(chatActiveRoomIdRef.current)) {
        setChatMessages(prev => {
          if (prev.some(m => String(m.id) === String(msg.id))) return prev;
          return [...prev, msg];
        });
      }

      // 실시간 메시지 수신 시 목록 최신 상태 즉각 메모리 선반영 (백그라운드여도 수신하여 안읽은 카운트 & 알람 재생)
      setChatRooms(prevRooms => {
        const index = prevRooms.findIndex(r => r.id === msg.roomId);
        if (index === -1) {
          if (document.visibilityState === 'visible') {
            loadChatRooms();
          }
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

      if (document.visibilityState === 'visible') {
        setTimeout(() => {
          loadChatRooms();
        }, 500);
      }
      
      // 1. 상대방이 보낸 메시지인 경우, 활성화된 대화방 여부와 상관없이 무조건 알림음 재생
      if (msg.sender !== userNickname) {
        playChatNotificationSound();

        // 2. 현재 열려 있는 방이 아니거나 채팅방 창이 아예 닫혀있을 때만 안 읽은 카운트 및 토스트 팝업 알림 적용
        if (!chatWindowOpenRef.current
          || String(chatActiveRoomIdRef.current) !== String(msg.roomId)) {
          // 안 읽은 개수 증가
          setUnreadCounts(prev => {
            const newCount = (prev[msg.roomId] || 0) + 1;
            localStorage.setItem(
              getChatUnreadStorageKey(userNickname, msg.roomId),
              String(newCount)
            );
            return { ...prev, [msg.roomId]: newCount };
          });

          // 토스트 팝업 알림 설정
          const notification = {
            sender: msg.sender,
            text: msg.text,
            roomId: msg.roomId
          };
          if (document.visibilityState === 'visible') {
            setChatNotification(notification);
          } else {
            pendingRecoveredNotificationRef.current = notification;
          }
        } else {
          markRoomAsRead(msg.roomId, [msg]);
        }
      }
    }, () => {
      syncUnreadMessagesAfterConnection().then(() => loadChatRooms());
    });

    return () => unsubscribe();
  }, [
    userNickname,
    markRoomAsRead,
    syncUnreadMessagesAfterConnection,
    loadChatRooms
  ]);

  // 글로벌 새 대화방 감지 훅 (누군가 나에게 처음 1:1 대화를 시도했을 때 대화방 실시간 추가 연동)
  useEffect(() => {
    if (!userNickname) return;

    const unsubscribe = chatService.subscribeMyRooms(userNickname, () => {
      if (document.visibilityState === 'visible') {
        loadChatRooms();
      }
    });

    return () => unsubscribe();
  }, [userNickname, loadChatRooms]);

  // 대화방 목록 화면으로 복귀할 때(또는 로그인 시) 최신 방 목록을 강제 로딩
  useEffect(() => {
    if (chatActiveRoomId === null && userNickname) {
      loadChatRooms();
    }
  }, [chatActiveRoomId, userNickname, loadChatRooms]);

  // 안 읽은 메시지 수에 따라 브라우저 탭 타이틀에 숫자 표시
  useEffect(() => {
    const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
    if (totalUnread > 0) {
      document.title = `(${totalUnread}) 드래곤빌리지3 스티커교환소`;
    } else {
      document.title = `드래곤빌리지3 스티커교환소`;
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
