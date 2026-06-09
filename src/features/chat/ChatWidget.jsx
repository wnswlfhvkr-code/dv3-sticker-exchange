import React, { useRef } from 'react';
import { X, Send, MessageSquare, ArrowLeft } from 'lucide-react';

export function ChatWidget({
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
  handleSendMessage,
  userNickname,
  unreadCounts,
  chatScrollRef,
  onlineUsers,
  chatNotification,
  setChatNotification
}) {
  if (!userNickname) return null;

  // 전체 안 읽은 메시지 개수 합산
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  const inputRef = useRef(null);

  // 메시지 전송 후 포커스 재지정 래퍼
  const onSubmit = async (e) => {
    e.preventDefault();
    await handleSendMessage(e);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // 채팅 시간 포맷 도우미 함수
  const formatChatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return '방금 전';
      if (diffMins < 60) return `${diffMins}분 전`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}시간 전`;
      
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
      
      {/* 1. 채팅방 본 창 */}
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
          {/* 헤더 */}
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
              onClick={() => {
                setChatWindowOpen(false);
                setChatActiveRoomId(null);
                setChatActiveRoomNickname('');
              }} 
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* 본문 콘텐츠: 활성 대화방이 열려 있을 때는 이중 스크롤 방지를 위해 overflowY hidden 처리 */}
          <div style={{ flex: 1, overflowY: chatActiveRoomId ? 'hidden' : 'auto', display: 'flex', flexDirection: 'column' }}>
            {!chatActiveRoomId ? (
              /* 방 목록 화면 */
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
                      className="chat-room-item"
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
              /* 특정 방 활성 대화창 */
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

                {/* 메시지 발송 폼 */}
                <form 
                  onSubmit={onSubmit}
                  style={{
                    padding: '0.75rem',
                    background: 'rgba(0,0,0,0.3)',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    gap: '6px'
                  }}
                >
                  <input 
                    ref={inputRef}
                    type="text" 
                    placeholder="메시지를 입력하세요..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    style={{ flex: 1, padding: '0.55rem', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid var(--border-color)', color: '#fff', background: '#191b20' }}
                    required
                  />
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    style={{ padding: '0.55rem 1rem', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '3px' }}
                  >
                    <Send size={12} />
                    전송
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. 실시간 새 메시지 팝업 알림 토스트 */}
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
        >
          <div style={{ background: 'var(--primary-color)', borderRadius: '50%', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquare size={16} color="#1e293b" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, overflow: 'hidden' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>새로운 메시지</span>
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {chatNotification.text}
            </span>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setChatNotification(null);
            }} 
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 3. 플로팅 채팅 위젯 버튼 */}
      <button 
        type="button" 
        onClick={() => setChatWindowOpen(prev => !prev)}
        style={{
          background: 'var(--primary-color)',
          color: '#1e293b',
          border: 'none',
          borderRadius: '50%',
          width: '56px',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(133, 195, 0, 0.45)',
          position: 'relative',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: 'scale(1)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        title="1:1 실시간 대화 열기"
      >
        <MessageSquare size={24} />
        {totalUnread > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: '#ef4444',
            color: '#fff',
            fontSize: '0.72rem',
            fontWeight: '800',
            borderRadius: '10px',
            padding: '2px 6px',
            border: '2px solid #100c19',
            boxShadow: '0 0 8px rgba(239, 68, 68, 0.8)'
          }}>
            {totalUnread}
          </span>
        )}
      </button>

    </div>
  );
}
