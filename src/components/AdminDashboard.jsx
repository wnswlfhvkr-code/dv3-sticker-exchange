import React from 'react';
import { X, RefreshCw, Trash2 } from 'lucide-react';

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
  handleAdminDeleteComment
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
        maxWidth: '560px',
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
            접수된 유저 신고 내역을 모니터링하고 피드 콘텐츠 정화 처리를 관리합니다.
          </p>
        </div>

        {/* 탭 제어 */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '3px', marginBottom: '1rem' }}>
          <button 
            onClick={() => setAdminActiveTab("reports")}
            style={{ 
              flex: 1, 
              padding: '0.6rem', 
              fontSize: '0.82rem', 
              fontWeight: '700', 
              borderRadius: '8px', 
              border: 'none', 
              background: adminActiveTab === "reports" ? 'rgba(251, 191, 36, 0.15)' : 'transparent', 
              color: adminActiveTab === "reports" ? '#fbbf24' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            🚨 접수된 신고 목록 ({reportsList.length}건)
          </button>
          <button 
            onClick={() => setAdminActiveTab("logs")}
            style={{ 
              flex: 1, 
              padding: '0.6rem', 
              fontSize: '0.82rem', 
              fontWeight: '700', 
              borderRadius: '8px', 
              border: 'none', 
              background: adminActiveTab === "logs" ? 'rgba(251, 191, 36, 0.15)' : 'transparent', 
              color: adminActiveTab === "logs" ? '#fbbf24' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            📋 조치 완료 로그 ({adminLogs.length}건)
          </button>
        </div>

        {/* 탭 내용 영역 */}
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem' }}>
          {adminActiveTab === "reports" ? (
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
