// 드래곤 빌리지 3 실제 스티커북 카테고리 목록 (총 20개)
// 중복 캡쳐(09-12, 10-13, 11-14)를 걸러내고 누락된 카테고리를 표시한 완벽한 맵핑 테이블입니다.

export const categories = [
  { id: 1, name: "야생몬스터", image: "03" },
  { id: 2, name: "물속 몬스터", image: "04" },
  { id: 3, name: "던전 몬스터", image: "05" },
  { id: 4, name: "메인 스토리", image: "06" },
  { id: 5, name: "숲속 생활", image: "07" },
  { id: 6, name: "화산지대", image: "08" },
  { id: 7, name: "어둠속 존재", image: "09" },
  { id: 8, name: "특별한 장소", image: "10" },
  { id: 9, name: "놀이시간", image: "11" },
  { id: 10, name: "강철 쇼크", image: "15" },
  { id: 11, name: "요정의 숲", image: "16" },
  { id: 12, name: "바다 아래", image: "17" },
  { id: 13, name: "유령 마을", image: null }, // 누락됨 (12번 중복 파일로 대체 유실)
  { id: 14, name: "빛 아래", image: null },   // 누락됨 (13번 중복 파일로 대체 유실)
  { id: 15, name: "하늘나라", image: null },   // 누락됨 (14번 중복 파일로 대체 유실)
  { id: 16, name: "따스한 여름", image: "18" },
  { id: 17, name: "차가운 겨울", image: "19" },
  { id: 18, name: "나른한 오전", image: "20" },
  { id: 19, name: "활발한 오후", image: "21" },
  { id: 20, name: "조용한 밤", image: "22" }
];

export const stickersData = [];

categories.forEach(cat => {
  for (let s = 1; s <= 9; s++) {
    stickersData.push({
      id: `${cat.id}-${s}`,
      categoryId: cat.id,
      categoryName: cat.name,
      slot: s,
      name: `${cat.name} ${s}번`
    });
  }
});

// 카테고리 이미지 파일명 맵핑 유틸
export const getCategoryImage = (imageName) => {
  if (!imageName) return null;
  return `/sticker_images/KakaoTalk_20260604_202516419_${imageName}.png`;
};
