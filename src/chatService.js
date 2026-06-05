import { supabase, isMock } from './supabaseClient';

// 로컬 스토리지 키 정의
const CHAT_ROOMS_KEY = 'dv3_chat_rooms';
const CHAT_MESSAGES_KEY = 'dv3_chat_messages';

// 로컬 스토리지 헬퍼 함수
const getLocalRooms = () => {
  try {
    return JSON.parse(localStorage.getItem(CHAT_ROOMS_KEY)) || [];
  } catch (e) {
    return [];
  }
};

const saveLocalRooms = (rooms) => {
  localStorage.setItem(CHAT_ROOMS_KEY, JSON.stringify(rooms));
  // 커스텀 이벤트를 발생시켜 동일한 창 내 다른 컴포넌트도 반응하게 함
  window.dispatchEvent(new Event('dv3_chat_update'));
};

const getLocalMessages = () => {
  try {
    return JSON.parse(localStorage.getItem(CHAT_MESSAGES_KEY)) || [];
  } catch (e) {
    return [];
  }
};

const saveLocalMessages = (messages) => {
  localStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(messages));
  // 커스텀 이벤트를 발생시킴
  window.dispatchEvent(new Event('dv3_chat_update'));
};

export const chatService = {
  // 1. 채팅방 만들기 또는 가져오기
  async getOrCreateChatRoom(postId, buyerNickname, sellerNickname) {
    const roomId = `room-${postId}-${buyerNickname}-${sellerNickname}`;
    
    if (isMock) {
      const rooms = getLocalRooms();
      let room = rooms.find(r => r.id === roomId);
      if (!room) {
        room = {
          id: roomId,
          postId,
          buyerNickname,
          sellerNickname,
          lastMessage: '',
          updatedAt: new Date().toISOString()
        };
        rooms.push(room);
        saveLocalRooms(rooms);
      }
      return room;
    } else {
      try {
        // Supabase 연동 코드 (에러 대비 트라이-캐치)
        const { data, error } = await supabase
          .from('chat_rooms')
          .select('*')
          .eq('post_id', postId)
          .eq('buyer_nickname', buyerNickname)
          .eq('seller_nickname', sellerNickname)
          .single();
        
        if (data) return data;

        const { data: newRoom, error: createError } = await supabase
          .from('chat_rooms')
          .insert([{
            post_id: postId,
            buyer_nickname: buyerNickname,
            seller_nickname: sellerNickname,
            last_message: '',
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();
        
        if (createError) throw createError;
        return newRoom;
      } catch (e) {
        console.warn('Supabase chat room error, falling back to local:', e);
        // Supabase 에러 시 로컬 저장소로 폴백 작동
        const rooms = getLocalRooms();
        let room = rooms.find(r => r.id === roomId);
        if (!room) {
          room = {
            id: roomId,
            postId,
            buyerNickname,
            sellerNickname,
            lastMessage: '',
            updatedAt: new Date().toISOString()
          };
          rooms.push(room);
          saveLocalRooms(rooms);
        }
        return room;
      }
    }
  },

  // 2. 내가 속한 채팅방 목록 가져오기
  async getMyChatRooms(nickname) {
    if (isMock) {
      const rooms = getLocalRooms();
      return rooms.filter(r => r.buyerNickname === nickname || r.sellerNickname === nickname);
    } else {
      try {
        const { data, error } = await supabase
          .from('chat_rooms')
          .select('*')
          .or(`buyer_nickname.eq.${nickname},seller_nickname.eq.${nickname}`);
        if (error) throw error;
        return data || [];
      } catch (e) {
        console.warn('Supabase chat rooms fetch failed:', e);
        const rooms = getLocalRooms();
        return rooms.filter(r => r.buyerNickname === nickname || r.sellerNickname === nickname);
      }
    }
  },

  // 3. 메시지 보내기
  async sendMessage(roomId, sender, text) {
    const newMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      roomId,
      sender,
      text,
      timestamp: new Date().toISOString()
    };

    if (isMock) {
      // 메시지 저장
      const messages = getLocalMessages();
      messages.push(newMessage);
      saveLocalMessages(messages);

      // 채팅방의 마지막 메시지 정보 업데이트
      const rooms = getLocalRooms();
      const roomIndex = rooms.findIndex(r => r.id === roomId);
      if (roomIndex !== -1) {
        rooms[roomIndex].lastMessage = text;
        rooms[roomIndex].updatedAt = newMessage.timestamp;
        saveLocalRooms(rooms);
      }
      return newMessage;
    } else {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .insert([{
            room_id: roomId,
            sender,
            text,
            timestamp: newMessage.timestamp
          }])
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } catch (e) {
        console.warn('Supabase send message failed, saving locally:', e);
        // 폴백 저장
        const messages = getLocalMessages();
        messages.push(newMessage);
        saveLocalMessages(messages);

        const rooms = getLocalRooms();
        const roomIndex = rooms.findIndex(r => r.id === roomId);
        if (roomIndex !== -1) {
          rooms[roomIndex].lastMessage = text;
          rooms[roomIndex].updatedAt = newMessage.timestamp;
          saveLocalRooms(rooms);
        }
        return newMessage;
      }
    }
  },

  // 4. 특정 채팅방 메시지 히스토리 가져오기
  async getMessages(roomId) {
    if (isMock) {
      const messages = getLocalMessages();
      return messages.filter(m => m.roomId === roomId);
    } else {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('room_id', roomId)
          .order('timestamp', { ascending: true });
        if (error) throw error;
        return data || [];
      } catch (e) {
        console.warn('Supabase fetch messages failed:', e);
        const messages = getLocalMessages();
        return messages.filter(m => m.roomId === roomId);
      }
    }
  },

  // 5. 실시간 메시지 리스너 구독 설정
  subscribeMessages(roomId, onNewMessage) {
    if (!isMock) {
      const channel = supabase
        .channel(`room-messages-${roomId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `room_id=eq.${roomId}`
          },
          async (payload) => {
            console.log('실시간 새 메시지 수신:', payload.new);
            const updatedMessages = await this.getMessages(roomId);
            onNewMessage(updatedMessages);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      // 탭 간 실시간 통신을 위한 storage 이벤트 리스너
      const handleStorageChange = (e) => {
        if (e.key === CHAT_MESSAGES_KEY) {
          try {
            const allMessages = JSON.parse(e.newValue) || [];
            const roomMsgs = allMessages.filter(m => m.roomId === roomId);
            if (roomMsgs.length > 0) {
              onNewMessage(roomMsgs);
            }
          } catch (err) {
            console.error(err);
          }
        }
      };

      const handleCustomEvent = () => {
        const messages = getLocalMessages().filter(m => m.roomId === roomId);
        onNewMessage(messages);
      };

      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('dv3_chat_update', handleCustomEvent);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('dv3_chat_update', handleCustomEvent);
      };
    }
  },

  // 6. 실시간 접속 여부 추적 (Presence)
  subscribeOnlineUsers(myNickname, onUpdate) {
    if (!isMock) {
      const channel = supabase.channel('online-users', {
        config: {
          presence: {
            key: myNickname,
          },
        },
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const onlineNicknames = Object.keys(state);
          onUpdate(onlineNicknames);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              nickname: myNickname,
              online_at: new Date().toISOString()
            });
          }
        });

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      // 로컬 스토리지 기반 온라인 유저 추적 (Heartbeat 방식)
      const updateLocalOnline = () => {
        let onlineList = [];
        try {
          onlineList = JSON.parse(localStorage.getItem('dv3_online_users')) || [];
        } catch {
          onlineList = [];
        }
        
        const now = Date.now();
        // 8초 이상 업데이트되지 않은 세션은 리스트에서 청소
        onlineList = onlineList.filter(u => u.nickname !== myNickname && (now - u.lastActive < 8000));
        onlineList.push({ nickname: myNickname, lastActive: now });
        localStorage.setItem('dv3_online_users', JSON.stringify(onlineList));
        
        const names = onlineList.map(u => u.nickname);
        onUpdate(names);
      };

      updateLocalOnline();
      const interval = setInterval(updateLocalOnline, 3000);

      const handleStorageChange = (e) => {
        if (e.key === 'dv3_online_users') {
          try {
            const list = JSON.parse(e.newValue) || [];
            const now = Date.now();
            const activeNames = list.filter(u => now - u.lastActive < 8000).map(u => u.nickname);
            onUpdate(activeNames);
          } catch (err) {
            console.error(err);
          }
        }
      };

      window.addEventListener('storage', handleStorageChange);

      return () => {
        clearInterval(interval);
        window.removeEventListener('storage', handleStorageChange);
        try {
          let list = JSON.parse(localStorage.getItem('dv3_online_users')) || [];
          list = list.filter(u => u.nickname !== myNickname);
          localStorage.setItem('dv3_online_users', JSON.stringify(list));
        } catch {}
      };
    }
  }
};
