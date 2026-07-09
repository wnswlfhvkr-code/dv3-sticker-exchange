import React from 'react';
import { X } from 'lucide-react';

export function ReportModal({
  isReportModalOpen,
  setIsReportModalOpen,
  reportingTarget,
  setReportingTarget,
  reportReason,
  setReportReason,
  reportCustomReason,
  setReportCustomReason,
  handleSubmitReport
}) {
  if (!isReportModalOpen || !reportingTarget) return null;

  const reasons = [
    "부적절한 내용 (욕설, 음란물 등)",
    "도배 및 무분별한 광고성 도배",
    "허위 매칭 유도 및 사기 행위",
    "기타 (직접 입력)"
  ];

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
        maxWidth: '380px',
        border: '1px solid var(--border-color)',
        padding: '1.8rem',
        borderRadius: '16px',
        boxShadow: 'var(--shadow-main)',
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
            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#f87171', marginBottom: '0.3rem' }}>
              🚨 게시글/댓글 신고하기
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              신고 대상: <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{reportingTarget.details}</span>
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>신고 사유 선택</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {reasons.map((r) => (
                <label 
                   key={r} 
                   style={{ 
                     display: 'flex', 
                     alignItems: 'center', 
                     gap: '8px', 
                     fontSize: '0.82rem', 
                     color: 'var(--text-primary)', 
                     cursor: 'pointer',
                     background: 'var(--card-bg)',
                     padding: '0.5rem 0.75rem',
                     borderRadius: '8px',
                     border: '1px solid var(--border-color)'
                   }}
                >
                  <input 
                    type="radio" 
                    name="reportReason" 
                    value={r} 
                    checked={reportReason === r} 
                    onChange={(e) => setReportReason(e.target.value)}
                    required
                  />
                  {r}
                </label>
              ))}
            </div>
          </div>

          {reportReason === "기타 (직접 입력)" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>상세 사유 입력</label>
              <textarea 
                className="input-field" 
                placeholder="상세 신고 사유를 적어주세요. (최소 5자)" 
                value={reportCustomReason}
                onChange={(e) => setReportCustomReason(e.target.value)}
                required={reportReason === "기타 (직접 입력)"}
                minLength={5}
                maxLength={100}
                style={{ minHeight: '80px', resize: 'vertical', width: '100%' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={() => {
                setIsReportModalOpen(false);
                setReportingTarget(null);
              }}
              style={{ flex: 1 }}
            >
              취소
            </button>
            <button 
              type="submit" 
              className="btn" 
              style={{ flex: 1.5, background: '#ef4444', color: '#fff', fontWeight: 'bold' }}
            >
              신고 제출
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
