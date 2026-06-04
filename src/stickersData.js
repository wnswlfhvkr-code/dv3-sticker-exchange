// 드래곤 빌리지 3 스티커북 데이터 구조 개편
// 총 23페이지 * 9슬롯 = 207개 스티커 슬롯 자동 생성

export const totalPages = 23;

export const stickersData = [];

for (let p = 1; p <= totalPages; p++) {
  for (let s = 1; s <= 9; s++) {
    stickersData.push({
      id: `${p}-${s}`,
      page: p,
      slot: s,
      name: `${p}페이지 ${s}번 스티커`
    });
  }
}

// 각 스티커 이미지 경로 맵핑 (0 ~ 22번 캡쳐 이미지 활용)
export const getPageImage = (pageNumber) => {
  const index = String(pageNumber - 1).padStart(2, '0');
  return `/sticker_images/KakaoTalk_20260604_202516419_${index}.png`;
};
