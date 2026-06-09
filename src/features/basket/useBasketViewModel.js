import { useState, useEffect, useRef } from 'react';
import { stickersData } from '../../stickersData';

export function useBasketViewModel({ userNickname, onBasketChange }) {
  // 선택된 카테고리 ID (null 또는 1 ~ 20)
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  // 바구니 모드: 'haves' (줄 수 있는 카드) 또는 'wants' (필요한 카드)
  const [basketMode, setBasketMode] = useState('haves');

  // 내가 선택한 줄 수 있는 카드(Haves) 및 필요한 카드(Wants) 배열
  const [myHaves, setMyHaves] = useState(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem('dv3_my_haves'));
      if (Array.isArray(parsed)) {
        return parsed.filter(item => typeof item === 'string' && !stickersData.find(st => st.id === item)?.isGolden);
      }
      return [];
    } catch {
      return [];
    }
  });

  const [myWants, setMyWants] = useState(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem('dv3_my_wants'));
      if (Array.isArray(parsed)) {
        return parsed.filter(item => typeof item === 'string' && !stickersData.find(st => st.id === item)?.isGolden);
      }
      return [];
    } catch {
      return [];
    }
  });

  const lastBasketEditRef = useRef(0); // 바구니 수정 직후 폴링 덮어쓰기 방지용 쿨다운 타임스탬프

  // 바구니 로컬스토리지 자동 연동
  useEffect(() => {
    localStorage.setItem('dv3_my_haves', JSON.stringify(myHaves));
    localStorage.setItem('dv3_my_wants', JSON.stringify(myWants));
  }, [myHaves, myWants]);

  // 로그인한 유저의 교환글 카드를 내 상단 바구니에 자동 동기화하는 함수
  const syncMyBasketFromPost = (nickname, currentPosts) => {
    if (!nickname || !currentPosts || currentPosts.length === 0) return;

    // 사용자가 도감에서 직접 바구니를 수정한 직후(5초 이내)에는 폴링 데이터로 덮어쓰지 않음
    if (Date.now() - lastBasketEditRef.current < 5000) return;

    const myPost = [...currentPosts]
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .find(p => p.nickname === nickname);
    
    if (myPost) {
      const haves = (myPost.haves || []).filter(id => !stickersData.find(st => st.id === id)?.isGolden);
      const wants = (myPost.wants || []).filter(id => !stickersData.find(st => st.id === id)?.isGolden);
      
      const localHaves = JSON.parse(localStorage.getItem('dv3_my_haves')) || [];
      const localWants = JSON.parse(localStorage.getItem('dv3_my_wants')) || [];
      
      const isHavesEqual = haves.length === localHaves.length && haves.every(v => localHaves.includes(v));
      const isWantsEqual = wants.length === localWants.length && wants.every(v => localWants.includes(v));
      
      if (!isHavesEqual || !isWantsEqual) {
        setMyHaves(haves);
        setMyWants(wants);
      }
    }
  };

  const toggleStickerSelection = (stickerId, targetMode) => {
    const sticker = stickersData.find(s => s.id === stickerId);
    if (sticker && sticker.isGolden) return; // 황금테두리는 교환불가이므로 등록 차단

    const mode = targetMode || basketMode;
    let nextHaves = [...myHaves];
    let nextWants = [...myWants];

    if (mode === 'haves') {
      if (myHaves.includes(stickerId)) {
        nextHaves = myHaves.filter(id => id !== stickerId);
      } else {
        nextHaves = [...myHaves, stickerId];
        nextWants = myWants.filter(id => id !== stickerId);
      }
    } else {
      if (myWants.includes(stickerId)) {
        nextWants = myWants.filter(id => id !== stickerId);
      } else {
        nextWants = [...myWants, stickerId];
        nextHaves = myHaves.filter(id => id !== stickerId);
      }
    }

    setMyHaves(nextHaves);
    setMyWants(nextWants);
    lastBasketEditRef.current = Date.now(); // 폴링 덮어쓰기 방지 쿨다운 시작

    // 바구니 변경 이벤트 콜백 호출 (App.jsx 레이어에서 포스트 직접 업데이트 처리 중재)
    if (onBasketChange) {
      onBasketChange(nextHaves, nextWants);
    }
  };

  const getHavesCountInPage = (categoryId) => {
    return myHaves.filter(id => id && typeof id === 'string' && id.startsWith(`${categoryId}-`)).length;
  };

  const getWantsCountInPage = (categoryId) => {
    return myWants.filter(id => id && typeof id === 'string' && id.startsWith(`${categoryId}-`)).length;
  };

  const clearBasket = () => {
    setMyHaves([]);
    setMyWants([]);
  };

  return {
    selectedCategoryId,
    setSelectedCategoryId,
    basketMode,
    setBasketMode,
    myHaves,
    setMyHaves,
    myWants,
    setMyWants,
    toggleStickerSelection,
    getHavesCountInPage,
    getWantsCountInPage,
    syncMyBasketFromPost,
    clearBasket
  };
}
