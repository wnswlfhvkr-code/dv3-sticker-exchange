import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.join(__dirname, 'scraped_images.json');
const destPath = path.join(__dirname, '../src/stickersData.js');

function run() {
  console.log('🔄 stickersData.js 데이터 빌드 시작...');
  
  if (!fs.existsSync(jsonPath)) {
    console.error('❌ scraped_images.json 파일이 존재하지 않습니다.');
    return;
  }

  const raw = fs.readFileSync(jsonPath, 'utf8');
  const items = JSON.parse(raw);
  
  // 본문 이미지 주소 필터링 및 리스트업 (순서가 정확히 매칭됨)
  const urls = items.map(item => item.src);

  console.log(`📦 수집된 총 이미지 개수: ${urls.length}개`);

  if (urls.length !== 180) {
    console.warn(`⚠️ 경고: 수집된 이미지 개수가 180개가 아닙니다 (현재 ${urls.length}개). 스크래핑된 순서대로 매핑을 시도합니다.`);
  }

  const fileContent = `// 드래곤 빌리지 3 실제 스티커북 카테고리 목록 (총 20개)
export const categories = [
  { id: 1, name: "야생몬스터" },
  { id: 2, name: "물속 몬스터" },
  { id: 3, name: "던전 몬스터" },
  { id: 4, name: "메인 스토리" },
  { id: 5, name: "숲속 생활" },
  { id: 6, name: "화산지대" },
  { id: 7, name: "어둠속 존재" },
  { id: 8, name: "특별한 장소" },
  { id: 9, name: "놀이시간" },
  { id: 10, name: "강철 쇼크" },
  { id: 11, name: "요정의 숲" },
  { id: 12, name: "바다 아래" },
  { id: 13, name: "유령 마을" },
  { id: 14, name: "빛 아래" },
  { id: 15, name: "하늘나라" },
  { id: 16, name: "따스한 여름" },
  { id: 17, name: "차가운 겨울" },
  { id: 18, name: "나른한 오전" },
  { id: 19, name: "활발한 오후" },
  { id: 20, name: "조용한 밤" }
];

// 위하이브 커뮤니티에서 실시간 크롤링하여 맵핑된 180장의 정규 스티커 초고화질 CDN 주소 목록
export const stickerImageUrls = ${JSON.stringify(urls, null, 2)};

export const stickersData = [];
let imgIdx = 0;

categories.forEach(cat => {
  for (let s = 1; s <= 9; s++) {
    stickersData.push({
      id: \`\${cat.id}-\${s}\`,
      categoryId: cat.id,
      categoryName: cat.name,
      slot: s,
      name: \`\${cat.name} \${s}번\`,
      image: stickerImageUrls[imgIdx++] || null
    });
  }
});

// 카테고리 대표 썸네일은 해당 카테고리의 1번 카드 이미지를 가져와 사용
export const getCategoryImage = (catId) => {
  const firstCard = stickersData.find(s => s.categoryId === catId && s.slot === 1);
  return firstCard ? firstCard.image : null;
};
`;

  fs.writeFileSync(destPath, fileContent, 'utf8');
  console.log('✅ src/stickersData.js 파일이 최신 180장 CDN 주소로 성공적으로 갱신되었습니다!');
}

run();
