import React from 'react';
import { X, RefreshCw } from 'lucide-react';

export function AdminDashboard({
  isAdminTabOpen,
  setIsAdminTabOpen,
  reportsList,
  adminLoading,
  adminLogs,
  adminActiveTab,
  setAdminActiveTab,
  loadReports,
  loadAdminLogs,
  handleResolveReport,
  handleAdminDeletePost,
  handleAdminDeleteComment,

  // 버그 제보 관련
  bugReportsList = [],
  handleResolveBugReport,
  loadBugReports,

  // 통계 관련
  statsData = null,
  statsLoading = false,
  loadDashboardStats
}) {
  if (!isAdminTabOpen) return null;

  return (
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
        maxWidth: '680px', // 통계 화면을 위해 넉넉하게 확장
        border: '1px solid rgba(251, 191, 36, 0.25)',
        padding: '1.8rem',
        borderRadius: '18px',
        boxShadow: '0 8px 32px rgba(251, 191, 36, 0.15)',
        position: 'relative',
        animation: 'fadeIn 0.2s ease-out',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column'
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

        <div style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            👑 관리자 제어 센터 (간장 전용)
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
            접수된 신고 내역, 오류 제보 확인 및 실시간 사이트 운영 통계를 모니터링합니다.
          </p>
        </div>

        {/* 탭 제어 */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '3px', marginBottom: '1rem', gap: '3px' }}>
          <button 
            onClick={() => setAdminActiveTab("reports")}
            style={{ 
              flex: 1, 
              padding: '0.6rem 0.3rem', 
              fontSize: '0.78rem', 
              fontWeight: '700', 
              borderRadius: '8px', 
              border: 'none', 
              background: adminActiveTab === "reports" ? 'rgba(251, 191, 36, 0.15)' : 'transparent', 
              color: adminActiveTab === "reports" ? '#fbbf24' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            🚨 신고 목록 ({reportsList.length})
          </button>
          <button 
            onClick={() => setAdminActiveTab("bugs")}
            style={{ 
              flex: 1, 
              padding: '0.6rem 0.3rem', 
              fontSize: '0.78rem', 
              fontWeight: '700', 
              borderRadius: '8px', 
              border: 'none', 
              background: adminActiveTab === "bugs" ? 'rgba(251, 191, 36, 0.15)' : 'transparent', 
              color: adminActiveTab === "bugs" ? '#fbbf24' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            🐛 버그 제보 ({bugReportsList.length})
          </button>
          <button 
            onClick={() => setAdminActiveTab("logs")}
            style={{ 
              flex: 1, 
              padding: '0.6rem 0.3rem', 
              fontSize: '0.78rem', 
              fontWeight: '700', 
              borderRadius: '8px', 
              border: 'none', 
              background: adminActiveTab === "logs" ? 'rgba(251, 191, 36, 0.15)' : 'transparent', 
              color: adminActiveTab === "logs" ? '#fbbf24' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            📋 조치 로그 ({adminLogs.length})
          </button>
          <button 
            onClick={() => setAdminActiveTab("stats")}
            style={{ 
              flex: 1, 
              padding: '0.6rem 0.3rem', 
              fontSize: '0.78rem', 
              fontWeight: '700', 
              borderRadius: '8px', 
              border: 'none', 
              background: adminActiveTab === "stats" ? 'rgba(251, 191, 36, 0.15)' : 'transparent', 
              color: adminActiveTab === "stats" ? '#fbbf24' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            📊 사이트 통계
          </button>
        </div>

        {/* 탭 내용 영역 */}
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem' }}>
          
          {/* 1. 신고 목록 탭 */}
          {adminActiveTab === "reports" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>* 신고 내역을 확인하고 처리해 주세요.</span>
                <button onClick={loadReports} className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <RefreshCw size={12} className={adminLoading ? 'spin-anim' : ''} /> 새로고침
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '350px', overflowY: 'auto' }}>
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
          )}

          {/* 2. 버그 제보 탭 */}
          {adminActiveTab === "bugs" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>* 유저들이 접수한 오류 및 버그 제보 목록입니다.</span>
                <button onClick={loadBugReports} className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <RefreshCw size={12} className={adminLoading ? 'spin-anim' : ''} /> 새로고침
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '350px', overflowY: 'auto' }}>
                {bugReportsList.map(bug => (
                  <div key={bug.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '0.85rem', borderRadius: '10px', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                        {bug.title}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        제보일: {new Date(bug.created_at || bug.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.6rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', color: '#e2e8f0', whiteSpace: 'pre-wrap', lineHeight: '1.4', border: '1px solid rgba(255,255,255,0.03)' }}>
                      {bug.description}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '6px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>제보자: <strong style={{ color: '#fff' }}>{bug.reporter}</strong></span>
                      <button 
                        onClick={() => handleResolveBugReport(bug.id)}
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.72rem', background: 'var(--primary-color)', color: '#1e293b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        해결 완료 (삭제)
                      </button>
                    </div>
                  </div>
                ))}

                {bugReportsList.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '2rem 0' }}>접수된 버그 제보가 없습니다! 아주 평화롭습니다.</div>
                )}
              </div>
            </div>
          )}

          {/* 3. 조치 로그 탭 */}
          {adminActiveTab === "logs" && (
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '350px', overflowY: 'auto' }}>
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

          {/* 4. 사이트 통계 탭 */}
          {adminActiveTab === "stats" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>* 실시간 및 일별 누적 사이트 활동량 지표입니다.</span>
                <button onClick={loadDashboardStats} className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <RefreshCw size={12} className={statsLoading ? 'spin-anim' : ''} /> 새로고침
                </button>
              </div>

              {statsLoading ? (
                <div style={{ textAlign: 'center', padding: '3.5rem 0', color: 'var(--text-muted)' }}>
                  <div className="spin-anim" style={{ display: 'inline-block', marginBottom: '0.6rem' }}><RefreshCw size={24} /></div>
                  <p style={{ fontSize: '0.82rem' }}>통계 데이터를 불러오는 중...</p>
                </div>
              ) : statsData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
                  {/* 요약 카드 */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '4px' }}>총 접속자 수</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 'bold', color: '#60a5fa' }}>{statsData.totalVisits}명</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '4px' }}>오늘 접속자 (UV)</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 'bold', color: '#10b981' }}>
                        {statsData.dailyStats && statsData.dailyStats[0] ? statsData.dailyStats[0].visitors : 0}명
                      </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '4px' }}>전체 게시글</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 'bold', color: '#fbbf24' }}>{statsData.totalPosts}개</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '4px' }}>전체 메시지</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 'bold', color: '#ec4899' }}>{statsData.totalMessages}개</div>
                    </div>
                  </div>

                  {/* 7일간의 추이 표 */}
                  <div>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '0.6rem', borderLeft: '3px solid #fbbf24', paddingLeft: '6px' }}>
                      최근 7일간 일별 활동 트렌드
                    </h3>
                    <div style={{ overflowX: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'center' }}>
                        <thead>
                          <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <th style={{ padding: '0.65rem 0.4rem' }}>날짜</th>
                            <th style={{ padding: '0.65rem 0.4rem', color: '#10b981' }}>접속자 수 (UV)</th>
                            <th style={{ padding: '0.65rem 0.4rem', color: '#fbbf24' }}>새로운 글</th>
                            <th style={{ padding: '0.65rem 0.4rem', color: '#ec4899' }}>채팅 메시지</th>
                          </tr>
                        </thead>
                        <tbody>
                          {statsData.dailyStats && statsData.dailyStats.map((day, idx) => (
                            <tr 
                              key={idx} 
                              style={{ 
                                borderBottom: idx === statsData.dailyStats.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)',
                                background: idx === 0 ? 'rgba(255, 255, 255, 0.01)' : 'transparent'
                              }}
                            >
                              <td style={{ padding: '0.65rem 0.4rem', fontWeight: idx === 0 ? 'bold' : 'normal', color: idx === 0 ? '#fff' : 'var(--text-secondary)' }}>
                                {day.date} {idx === 0 && <span style={{ fontSize: '0.65rem', color: '#10b981', marginLeft: '3px', verticalAlign: 'middle' }}>(오늘)</span>}
                              </td>
                              <td style={{ padding: '0.65rem 0.4rem', fontWeight: idx === 0 ? 'bold' : 'normal', color: '#10b981' }}>{day.visitors}명</td>
                              <td style={{ padding: '0.65rem 0.4rem', color: 'var(--text-secondary)' }}>{day.posts}개</td>
                              <td style={{ padding: '0.65rem 0.4rem', color: 'var(--text-secondary)' }}>{day.messages}개</td>
                            </tr>
                          ))}
                          {(!statsData.dailyStats || statsData.dailyStats.length === 0) && (
                            <tr>
                              <td colSpan="4" style={{ padding: '1.5rem', color: 'var(--text-muted)' }}>통계 집계 데이터가 존재하지 않습니다.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>통계를 불러올 수 없습니다.</div>
              )}
            </div>
          )}

        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
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
  );
}
