import { useState } from 'react';
import { KeyRound, Megaphone, MessageCircle, RefreshCw, Send, Trash2 } from 'lucide-react';
import { BOARD_TYPES } from './boardService';
import { useBoardViewModel } from './useBoardViewModel';
import { decodeHTML } from '../../utils/security';

const boardIcons = {
  notice: Megaphone,
  free: MessageCircle,
  egg_code: KeyRound
};

export function BoardSection({ userNickname }) {
  const [activeType, setActiveType] = useState('notice');
  const activeBoard = BOARD_TYPES.find(board => board.id === activeType) || BOARD_TYPES[0];
  const BoardIcon = boardIcons[activeType] || MessageCircle;
  const boardVM = useBoardViewModel({ userNickname, activeType });
  const canWrite = userNickname && (activeType !== 'notice' || userNickname === '간장');

  const formatTime = (value) => {
    if (!value) return '';
    return new Date(value).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <section style={{ width: '100%', maxWidth: '800px', margin: '0 auto 2.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BoardIcon size={20} color="var(--primary-color)" />
          <h2 style={{ margin: 0, fontSize: '1.15rem' }}>{activeBoard.label}</h2>
        </div>
        <button
          type="button"
          className="btn btn-outline"
          onClick={boardVM.loadPosts}
          style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
        >
          <RefreshCw size={14} className={boardVM.loading ? 'spin-anim' : ''} />
          새로고침
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
        {BOARD_TYPES.map(board => {
          const Icon = boardIcons[board.id] || MessageCircle;
          const isActive = board.id === activeType;
          return (
            <button
              key={board.id}
              type="button"
              className={`btn ${isActive ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveType(board.id)}
              style={{ padding: '0.5rem 0.8rem', fontSize: '0.82rem' }}
            >
              <Icon size={14} />
              {board.label}
            </button>
          );
        })}
      </div>

      {!userNickname ? (
        <div className="glass-card" style={{ padding: '1.2rem', color: 'var(--text-secondary)', textAlign: 'center', borderRadius: '10px' }}>
          게시판은 로그인 후 이용할 수 있습니다.
        </div>
      ) : (
        <>
          {canWrite ? (
            <form onSubmit={boardVM.createPost} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', padding: '1rem', borderRadius: '10px', marginBottom: '0.9rem' }}>
              <input
                type="text"
                value={boardVM.title}
                onChange={(e) => boardVM.setTitle(e.target.value)}
                placeholder="제목"
                maxLength={80}
                style={{ width: '100%' }}
              />
              <textarea
                value={boardVM.content}
                onChange={(e) => boardVM.setContent(e.target.value)}
                placeholder={activeType === 'egg_code' ? '드래곤 알 코드 거래 내용을 작성하세요.' : '내용'}
                maxLength={1200}
                rows={4}
                style={{ width: '100%', resize: 'vertical' }}
              />
              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end', padding: '0.55rem 0.95rem', fontSize: '0.84rem' }}>
                <Send size={14} />
                게시글 등록
              </button>
            </form>
          ) : (
            <div className="glass-card" style={{ padding: '0.9rem 1rem', color: 'var(--text-muted)', borderRadius: '10px', marginBottom: '0.9rem', fontSize: '0.85rem' }}>
              공지 게시글은 관리자만 작성할 수 있습니다.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {boardVM.posts.length === 0 ? (
              <div className="glass-card" style={{ padding: '1.2rem', color: 'var(--text-secondary)', textAlign: 'center', borderRadius: '10px' }}>
                아직 등록된 게시글이 없습니다.
              </div>
            ) : (
              boardVM.posts.map(post => (
                <article key={post.id} className="glass-card" style={{ padding: '1rem', borderRadius: '10px', display: 'flex', flexDirection: 'column' }}>
                  
                  {boardVM.editingPostId === post.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      <input
                        type="text"
                        value={boardVM.editTitle}
                        onChange={(e) => boardVM.setEditTitle(e.target.value)}
                        placeholder="수정할 제목"
                        maxLength={80}
                        style={{ width: '100%' }}
                      />
                      <textarea
                        value={boardVM.editContent}
                        onChange={(e) => boardVM.setEditContent(e.target.value)}
                        placeholder="수정할 내용"
                        maxLength={1200}
                        rows={4}
                        style={{ width: '100%', resize: 'vertical' }}
                      />
                      <div style={{ display: 'flex', gap: '6px', alignSelf: 'flex-end' }}>
                        <button 
                          type="button" 
                          onClick={() => boardVM.handleUpdateBoardPost(post.id)} 
                          className="btn btn-primary" 
                          style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
                        >
                          저장
                        </button>
                        <button 
                          type="button" 
                          onClick={boardVM.handleCancelEditBoard} 
                          className="btn btn-outline" 
                          style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start' }}>
                        <div style={{ minWidth: 0 }}>
                          <h3 style={{ margin: '0 0 0.35rem', fontSize: '1rem', color: '#fff', wordBreak: 'break-word' }}>
                            {decodeHTML(post.title)}
                          </h3>
                          <div style={{ display: 'flex', gap: '0.55rem', color: 'var(--text-muted)', fontSize: '0.72rem', flexWrap: 'wrap' }}>
                            <span>{post.nickname}</span>
                            <span>{formatTime(post.created_at)}</span>
                          </div>
                        </div>
                        {(post.nickname === userNickname || userNickname === '간장') && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            {post.nickname === userNickname && (
                              <button
                                type="button"
                                onClick={() => boardVM.handleOpenEditBoard(post)}
                                style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 'bold' }}
                                title="게시글 수정"
                              >
                                수정
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => boardVM.deletePost(post)}
                              style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px' }}
                              title="게시글 삭제"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        )}
                      </div>
                      <p style={{ margin: '0.75rem 0 0', color: 'rgba(255,255,255,0.86)', fontSize: '0.86rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.55 }}>
                        {decodeHTML(post.content)}
                      </p>
                    </>
                  )}

                  {/* 댓글 영역 */}
                  <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <button 
                      onClick={() => boardVM.toggleBoardComments(post.id)}
                      style={{ background: 'none', border: 'none', color: boardVM.expandedComments[post.id] ? 'var(--primary-color)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', padding: '0 2px' }}
                    >
                      💬 댓글 ({post.commentCount ?? (boardVM.comments[post.id] ? boardVM.comments[post.id].length : 0)})
                    </button>

                    {boardVM.expandedComments[post.id] && (
                      <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '150px', overflowY: 'auto', paddingRight: '2px' }}>
                          {boardVM.comments[post.id]?.map(comment => {
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
                                  <span style={{ color: 'rgba(255,255,255,0.85)', wordBreak: 'break-all' }}>{decodeHTML(comment.text)}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                  {(isCommentOwner || userNickname === '간장') && (
                                    <button 
                                      onClick={() => boardVM.handleDeleteBoardComment(comment.id, post.id)}
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
                          {(!boardVM.comments[post.id] || boardVM.comments[post.id].length === 0) && (
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', padding: '0.3rem 0.2rem' }}>아직 등록된 댓글이 없습니다.</div>
                          )}
                        </div>

                        <form onSubmit={(e) => boardVM.handleAddBoardComment(e, post.id)} style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                          <input 
                            type="text" 
                            placeholder={userNickname ? "댓글을 작성하세요..." : "로그인 후 댓글을 작성할 수 있습니다."}
                            disabled={!userNickname}
                            value={boardVM.commentInputs[post.id] || ''}
                            onChange={(e) => boardVM.setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
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

                </article>
              ))
            )}
          </div>
        </>
      )}
    </section>
  );
}
