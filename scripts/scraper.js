import Hero from '@ulixee/hero';
import HeroCore from '@ulixee/hero-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  console.log('🚀 [Ulixee Hero] 클라이언트 인스턴스 생성 중 (localhost:1818)...');
  const hero = new Hero({ host: 'localhost:1818' });

  const targetUrl = 'https://community.withhive.com/dvc/ko/board/all/312801';
  console.log(`🌐 대상 페이지 접속: ${targetUrl}`);
  
  await hero.goto(targetUrl);
  console.log('⏳ 페이지 리소스 로딩 대기 중 (PaintingStable)...');
  await hero.activeTab.waitForLoad('PaintingStable');
  
  // 봇 차단 우회 및 동적 데이터 렌더링 대기 (게시글 본문 로딩 확인을 위해 3초 대기)
  console.log('⏳ 동적 엘리먼트 렌더링 대기 (3초)...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('🔍 div.post_cont 내부의 본문 이미지 요소 수집 중...');
  // div.post_cont 하위의 img들만 정밀 수집
  const images = await hero.document.querySelectorAll('div.post_cont img');
  const imageUrls = [];

  for (const img of images) {
    const src = await img.src;
    const alt = await img.alt;
    
    if (src) {
      imageUrls.push({ src, alt });
    }
  }

  console.log(`✅ 수집 완료: 총 ${imageUrls.length}개의 이미지 발견`);
  console.log('----------------------------------------------------');
  imageUrls.forEach((img, idx) => {
    console.log(`[${idx + 1}] ALT: ${img.alt || '없음'} | SRC: ${img.src}`);
  });
  console.log('----------------------------------------------------');

  // 결과를 JSON 파일로 임시 저장
  const resultsPath = path.join(__dirname, 'scraped_images.json');
  fs.writeFileSync(resultsPath, JSON.stringify(imageUrls, null, 2), 'utf-8');
  console.log(`💾 결과가 저장되었습니다: ${resultsPath}`);

  await hero.close();
}

run().catch(async (err) => {
  console.error('❌ 크롤러 작동 실패:', err);
});
