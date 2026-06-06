import { useState, useEffect } from 'react';
import { dbService } from '../supabaseClient';
import { chatService } from '../chatService';

export function useAuthViewModel() {
  const [userNickname, setUserNickname] = useState(() => {
    return sessionStorage.getItem('dv3_nickname') || localStorage.getItem('dv3_nickname') || '';
  });
  
  const [isGuest, setIsGuest] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('dv3_is_guest')) || false;
    } catch {
      return false;
    }
  });

  const [showLoginModal, setShowLoginModal] = useState(!userNickname);
  const [loginInput, setLoginInput] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);

  // 실시간 접속자 목록(Presence) 구독
  useEffect(() => {
    if (userNickname) {
      const unsubscribe = chatService.subscribeOnlineUsers(userNickname, (users) => {
        setOnlineUsers(users);
      });
      return () => unsubscribe();
    } else {
      setOnlineUsers([]);
    }
  }, [userNickname]);

  const handleLogin = async (nickname, password, isGuestMode) => {
    if (!nickname.trim()) {
      alert("닉네임을 입력해주세요!");
      return;
    }

    if (!isGuestMode) {
      // 회원 로그인 검증
      const { exists, isMatch, error } = await dbService.verifyUser(nickname, password);
      if (error) {
        alert("로그인 처리 중 오류 발생: " + error.message);
        return;
      }

      if (exists) {
        if (!isMatch) {
          alert("비밀번호가 일치하지 않습니다.");
          return;
        }
      } else {
        // 회원 가입 자동 등록 진행
        const confirmReg = window.confirm(`"${nickname}"은(는) 존재하지 않는 회원 닉네임입니다.\n이 닉네임으로 새로 가입하시겠습니까?`);
        if (!confirmReg) return;
        const { error: regError } = await dbService.registerUser(nickname, password);
        if (regError) {
          alert("가입 실패: " + regError.message);
          return;
        }
        alert("회원 등록 완료 및 로그인 되었습니다!");
      }

      setIsGuest(false);
      localStorage.setItem('dv3_nickname', nickname);
      localStorage.setItem('dv3_password', password);
      sessionStorage.setItem('dv3_nickname', nickname);
      sessionStorage.setItem('dv3_is_guest', 'false');
    } else {
      // 게스트 로그인
      const guestDisplayName = `${nickname} (게스트)`;
      try {
        const { exists, error } = await dbService.verifyUser(nickname, "");
        if (error) {
          console.error("게스트 로그인 검증 오류:", error);
        }
        if (exists) {
          alert(`"${nickname}"은(는) 이미 등록된 정식 회원 닉네임입니다.\n비밀번호를 입력하여 정식으로 로그인하거나, 다른 닉네임을 입력해 주세요.`);
          return;
        }

        // 현재 온라인 중복 유저 확인
        if (onlineUsers.includes(guestDisplayName) || onlineUsers.includes(nickname)) {
          alert(`현재 "${nickname}" 닉네임으로 접속 중인 사용자가 있습니다.\n겹치지 않는 다른 닉네임으로 접속해 주세요.`);
          return;
        }
      } catch (err) {
        console.error("게스트 로그인 검증 중 예외:", err);
      }

      setIsGuest(true);
      sessionStorage.setItem('dv3_nickname', guestDisplayName);
      sessionStorage.setItem('dv3_is_guest', 'true');
      localStorage.removeItem('dv3_nickname');
      localStorage.removeItem('dv3_password');
    }

    const finalNickname = isGuestMode ? `${nickname} (게스트)` : nickname;
    setUserNickname(finalNickname);
    setShowLoginModal(false);
    setLoginPassword('');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('dv3_nickname');
    sessionStorage.removeItem('dv3_is_guest');
    localStorage.removeItem('dv3_nickname');
    localStorage.removeItem('dv3_password');
    localStorage.removeItem('dv3_my_haves');
    localStorage.removeItem('dv3_my_wants');
    setUserNickname('');
    setIsGuest(false);
    setShowLoginModal(true);
  };

  return {
    userNickname,
    isGuest,
    showLoginModal,
    loginInput,
    loginPassword,
    onlineUsers,
    setLoginInput,
    setLoginPassword,
    setShowLoginModal,
    handleLogin,
    handleLogout,
    setUserNickname,
    setIsGuest
  };
}
