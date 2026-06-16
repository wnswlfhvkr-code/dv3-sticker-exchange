import { useState } from 'react';
import { dbService } from '../../supabaseClient';

export function useAdminViewModel({ userNickname, fetchPosts }) {
  const [isAdminTabOpen, setIsAdminTabOpen] = useState(false);
  const [reportsList, setReportsList] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminLogs, setAdminLogs] = useState([]);
  const [adminActiveTab, setAdminActiveTab] = useState("reports");

  // --- 대시보드 통계 관련 상태 ---
  const [statsData, setStatsData] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

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

  // --- 버그 제보 제어 상태 및 핸들러 ---
  const [bugReportsList, setBugReportsList] = useState([]);
  const [isBugModalOpen, setIsBugModalOpen] = useState(false);
  const [bugTitle, setBugTitle] = useState('');
  const [bugDescription, setBugDescription] = useState('');

  const loadBugReports = async () => {
    setAdminLoading(true);
    const { data, error } = await dbService.fetchBugReports();
    if (!error) {
      setBugReportsList(data || []);
    }
    setAdminLoading(false);
  };

  const loadDashboardStats = async () => {
    setStatsLoading(true);
    const { data, error } = await dbService.fetchDashboardStats();
    if (!error) {
      setStatsData(data);
    }
    setStatsLoading(false);
  };

  const handleOpenAdminTab = async () => {
    setIsAdminTabOpen(true);
    setAdminActiveTab("reports");
    await loadReports();
    await loadBugReports();
    await loadDashboardStats();
  };

  const handleSubmitBug = async (reporterNickname) => {
    if (!bugTitle.trim()) {
      alert("버그 제목을 입력해주세요!");
      return false;
    }
    if (!bugDescription.trim()) {
      alert("버그 상세 내용을 입력해주세요!");
      return false;
    }

    const { error } = await dbService.addBugReport(
      reporterNickname || '익명',
      bugTitle,
      bugDescription
    );

    if (!error) {
      alert("버그 제보가 성공적으로 접수되었습니다. 감사합니다!");
      setBugTitle('');
      setBugDescription('');
      setIsBugModalOpen(false);
      await loadBugReports();
      return true;
    } else {
      alert("버그 제보 등록 실패: " + error.message);
      return false;
    }
  };

  const handleResolveBugReport = async (bugId) => {
    if (!window.confirm("이 버그 제보를 해결 완료 처리하시겠습니까?")) return;
    const { error } = await dbService.resolveBugReport(bugId);
    if (!error) {
      alert("버그 제보가 해결 완료 처리되었습니다.");
      await loadBugReports();
    } else {
      alert("처리 실패: " + error.message);
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
    handleAdminDeleteComment,

    // 버그 제보 관련
    bugReportsList,
    isBugModalOpen,
    setIsBugModalOpen,
    bugTitle,
    setBugTitle,
    bugDescription,
    setBugDescription,
    loadBugReports,
    handleSubmitBug,
    handleResolveBugReport,

    // 통계 관련
    statsData,
    statsLoading,
    loadDashboardStats
  };
}
