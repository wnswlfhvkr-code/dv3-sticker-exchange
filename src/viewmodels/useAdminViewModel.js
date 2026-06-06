import { useState } from 'react';
import { dbService } from '../supabaseClient';

export function useAdminViewModel({ userNickname, fetchPosts }) {
  const [isAdminTabOpen, setIsAdminTabOpen] = useState(false);
  const [reportsList, setReportsList] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminLogs, setAdminLogs] = useState([]);
  const [adminActiveTab, setAdminActiveTab] = useState("reports");

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
      if (fetchPosts) {
        await fetchPosts();
      }
    } else {
      alert("게시글 삭제 실패: " + error.message);
    }
  };

  const handleAdminDeleteComment = async (commentId, postId, reportId, loadComments) => {
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
      if (loadComments) {
        await loadComments(postId);
      }
    } else {
      alert("댓글 삭제 실패: " + error.message);
    }
  };

  return {
    isAdminTabOpen,
    setIsAdminTabOpen,
    reportsList,
    adminLoading,
    adminLogs,
    adminActiveTab,
    setAdminActiveTab,
    loadAdminLogs,
    loadReports,
    handleOpenAdminTab,
    handleResolveReport,
    handleAdminDeletePost,
    handleAdminDeleteComment
  };
}
