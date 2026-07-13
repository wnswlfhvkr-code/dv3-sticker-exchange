import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const GUIDE_CONTENT = {
  ko: {
    backBtn: '← 메인 교환소로 돌아가기',
    tabs: {
      gemTable: '💎 젬 강화 효율표',
      colGuide: '⚡ 수집 효율 공략',
      safetyRules: '🛡️ 안전 거래 수칙',
      matchEngine: '⚙️ 매칭 엔진 원리'
    },
    gemTable: {
      title: '젬(Gem) 강화 효율 분석 및 가이드',
      subtitle: '투자 골드 대비 획득하는 강화 포인트(P) 효율을 판매 회수 골드 기준으로 정밀 연산한 가성비 리포트입니다.',
      calcTitle: '💎 실시간 젬 강화 가성비 계산기',
      selectGrade: '젬 등급 선택',
      normalGrade: '일반 등급',
      heroGrade: '영웅 등급',
      legendGrade: '전설 등급',
      currentReinforce: '현재 강화 수치',
      targetReinforce: '목표 강화 수치',
      bonusScore: '전설 젬 점수 보너스',
      noBonus: '보너스 없음 (54점 이하)',
      bonus55: '55점 이상 (+50P)',
      bonus60: '60점 이상 (+100P)',
      resCost: '누적 강화 비용',
      resRefund: '판매 환급 차액',
      resActual: '실질 소모 골드',
      resPoints: '획득 포인트 (P)',
      resUnitCost: '1P당 소모 비용',
      resRating: '가성비 등급 평가',
      gold: '골드',
      points: 'P',
      formulaTitle: '1. 계산 기준 및 보너스 포인트',
      formulaDesc: '강화 수치 상승에 따라 주어지는 기본 포인트와 젬 자체 점수 보너스 포인트 획득 기준입니다.',
      formulaList1: '기본 강화 포인트: +1 (5P) | +2 (10P) | +3 (15P) | +4 (20P) | +5 (25P)',
      formulaList2: '젬 점수 보너스: 55점 이상 달성 시 (+50P) | 60점 이상 달성 시 (+100P)',
      formulaFormula: '실질 소모 골드 = 누적 강화 비용 - (판매가 - 0강 판매가)',
      formulaNote: '* 판매 시 일부 골드가 환급되므로, 실제 회수되는 금액을 차감한 \'순수 기회비용 손해액\'을 기준으로 효율을 연산하였습니다.',
      dataTitle: '2. 등급 및 강화 단계별 기초 데이터',
      tableCostTitle: '① 강화 비용 (골드)',
      tablePriceTitle: '② 판매가 (골드)',
      tableColGrade: '등급',
      tableColAccum: '누적(+5)',
      tableNote: '※ 결과는 이 표에 입력된 강화 비용과 판매가를 기준으로 계산됩니다. 게임 데이터가 바뀌면 값도 달라질 수 있습니다.',
      rankTitle: '3. 1P당 비용이 낮은 상위 6개 누적 구간',
      rankNote: '1P(포인트)당 소모되는 골드가 적을수록 효율이 높습니다.',
      tableColRank: '순위',
      tableColTarget: '목표',
      tableColActual: '실질 소모 골드',
      tableColPoints: '획득P',
      tableColUnitCost: '1P당 비용',
      tableColRating: '효율 등급',
      rank1: 'S등급 (최우선)',
      rank2: 'A등급 (좋음)',
      rank3: 'B등급 (보통)',
      rank4: 'C등급 (낮음)',
      rank5: 'D등급 (비추천)',
      rankCBonus: 'C등급 (보너스)',
      analysisTitle: '4. 효율 분석 및 등급 가이드',
      analysisS: '🟢 S등급 (최우선 순위 - 1P당 500골드 이하)',
      analysisSDesc: '일반 +1 / 영웅 +1 / 일반 +2\n현재 입력값 기준으로 1P당 계산 비용이 500골드 이하인 구간입니다.',
      analysisA: '🔵 A등급 (효율 좋음 - 1P당 500~1,000골드)',
      analysisADesc: '전설 +1 / 일반 +3 / 영웅 +2\n현재 입력값 기준으로 1P당 계산 비용이 500~1,000골드인 구간입니다.',
      analysisB: '🟡 B등급 (보통 - 1P당 1,000~2,500골드)',
      analysisBDesc: '영웅 +3 / 일반 +4 / 전설 +2\n현재 입력값 기준으로 1P당 계산 비용이 1,000~2,500골드인 구간입니다.',
      analysisC: '🟣 C등급 (낮음/특정 목적 - 1P당 2,500~5,500골드)',
      analysisCDesc: '전설 +3 / 영웅 +4 / 전설 +5 (60점 보너스 선택)\n계산기에서 60점 보너스(+100P)를 선택한 경우 전설 +5의 1P당 비용은 5,475골드로 계산됩니다.',
      analysisD: '🔴 D등급 (비추천/효율 최악 - 1P당 5,500골드 초과)',
      analysisDDesc: '일반 +5 / 전설 +5 (55점 선택) / 전설 +4 / 영웅 +5 / 전설 +5 (보너스 없음)\n현재 입력값에서 1P당 비용이 5,500골드를 넘는 구간입니다. 보유 골드와 목적을 함께 고려해 판단하세요.',
      summaryTitle: '5. 최종 요약 및 추천 강화 한계선',
      summaryDesc1: '현재 표의 1P당 비용만 비교하면 일반 +4, 영웅 +3, 전설 +3 이전 구간이 상대적으로 낮게 계산됩니다.',
      summaryDesc2: '전설 +5는 선택한 55점·60점 보너스에 따라 1P당 비용이 크게 달라집니다.',
      summaryDesc3: '참고 순서: 일반 +1 ➔ 영웅 +1 ➔ 일반 +2 ➔ 전설 +1 ➔ 일반 +3 ➔ 영웅 +2 ➔ 영웅 +3 ➔ 일반 +4'
    },
    colGuide: {
      title: '교환 목록 관리 가이드',
      subtitle: '사이트의 Haves와 Wants를 실제 보유 상태와 맞춰 오래된 매칭을 줄이는 절차입니다.',
      sec1Title: '1. 입력 전 기준',
      sec1Desc: 'Haves에는 현재 보유한 교환 가능 여분만, Wants에는 아직 필요한 항목만 표시하세요. 이 사이트는 게임 인벤토리를 읽지 않으므로 사용자가 입력한 목록이 매칭의 유일한 기준입니다.',
      sec2Title: '2. 최신 목록을 유지하는 5단계',
      strat1Title: '게임에서 현재 보유 상태 확인',
      strat1Desc: '기억에 의존하지 말고 실제 여분과 미보유 항목을 확인한 뒤 입력합니다.',
      strat2Title: '묶음별로 Haves와 Wants 구분',
      strat2Desc: '20개 묶음을 순서대로 확인하고 같은 항목을 양쪽 목록에 동시에 넣지 않습니다.',
      strat3Title: '교환 불가 항목 제외',
      strat3Desc: '황금 테두리로 잠긴 24개 슬롯은 Haves와 Wants에 등록할 수 없습니다.',
      strat4Title: '연락처와 설명 검토',
      strat4Desc: '만료된 링크나 오타가 없는지 확인하고 교환에 필요하지 않은 개인정보는 게시하지 않습니다.',
      strat5Title: '교환 직후 목록 정리',
      strat5Desc: '넘긴 항목은 Haves에서, 받은 항목은 Wants에서 즉시 제거해 다른 사용자에게 오래된 매칭이 보이지 않게 합니다.',
      sec3Title: '3. 매칭 신호 해석',
      sec3Desc: '완전 매칭은 서로 주고받을 후보가 최소 한 개씩 있다는 뜻이고, 부분 매칭은 한쪽 조건만 맞는다는 뜻입니다. 어느 표시도 수량, 실제 보유, 교환 성사를 보장하지 않습니다.',
      sec4Title: '4. 주기적 점검',
      sec4Desc: '새 스티커를 얻었을 때, 교환을 마쳤을 때, 오랜만에 접속했을 때 목록을 게임 상태와 다시 대조하세요.',
      keyTitle: '핵심 요약',
      key1: '1. Haves는 실제 교환 가능한 여분만 기록합니다.',
      key2: '2. Wants는 아직 필요한 항목만 유지합니다.',
      key3: '3. 교환 후 두 목록을 바로 갱신합니다.'
    },
    safetyRules: {
      title: '안전 교환 체크리스트',
      subtitle: '사이트가 확인할 수 있는 정보와 실제 게임에서 사용자가 다시 확인해야 할 정보를 구분합니다.',
      sec1Title: '1. 사이트 기능의 범위',
      sec1Desc: '이 사이트는 사용자가 게시한 목록을 비교하고 연락과 신고 기능을 제공합니다. 실제 게임 인벤토리, 상대 신원, 최종 교환 완료 여부는 확인하거나 보증하지 않습니다.',
      sec2Title: '2. 연락 전에 확인할 세 가지',
      warning1Title: '⚠️ 오래된 목록',
      warning1Desc: '상대 글의 Haves가 현재 게임 상태와 다를 수 있습니다. 연락할 때 일치한 항목을 아직 보유하고 있는지 다시 확인하세요.',
      warning2Title: '⚠️ 닉네임·연락처 불일치',
      warning2Desc: '게시글의 닉네임, 외부 연락처의 계정, 실제 게임에서 만난 상대가 같은지 각각 확인하세요. 외부 링크는 운영자가 소유권을 인증한 주소가 아닙니다.',
      warning3Title: '⚠️ 최종 조건 변경',
      warning3Desc: '대화 중 조건이 바뀌었다면 줄 항목, 받을 항목, 수량을 다시 한 문장으로 합의하고 최종 화면과 대조하세요.',
      sec3Title: '3. 개인정보와 확인 기록',
      sec3Desc: '문제가 생겼을 때 상황을 설명할 수 있도록 필요한 범위에서 기록하세요.',
      sec3List1: '합의 기록: 닉네임, 항목 이름과 슬롯, 수량, 시간을 남깁니다.',
      sec3List2: '개인정보 보호: 비밀번호, 인증번호, 복구 코드, 결제 정보는 전달하지 않습니다.',
      sec3List3: '외부 링크 확인: 로그인이나 파일 설치를 요구하는 낯선 주소는 열지 않습니다.',
      sec4Title: '4. 신고할 때',
      sec4List1: '교환글 또는 게시글의 신고 버튼으로 구체적인 상황을 접수합니다.',
      sec4List2: '필요하면 개인정보를 가린 스크린샷과 닉네임을 helper.dv3sticker@gmail.com으로 보냅니다.',
      sec4List3: '운영자는 접수 내용을 검토하지만 처리 시간, 특정 제재, 게임 아이템 복구를 보장하지 않습니다.'
    },
    matchEngine: {
      title: '완전·부분 매칭 판정 원리',
      subtitle: '현재 서비스가 Haves와 Wants의 교집합으로 두 매칭 신호를 계산하는 조건입니다.',
      sec1Title: '1. 비교 대상',
      sec1Desc: '내 Haves와 Wants, 상대 교환글의 Haves와 Wants를 스티커 식별자로 비교합니다. 이름이나 이미지가 아니라 묶음 번호와 슬롯 번호가 결합된 ID가 기준입니다.',
      sec2Title: '2. 두 가지 매칭 신호',
      sec2Desc: '두 방향의 교집합이 비어 있는지에 따라 완전 매칭과 부분 매칭을 구분합니다.',
      perfectTitle: '완전 매칭 (Perfect Match)',
      perfectDesc1: '양쪽 방향에 최소 한 개씩 겹치는 항목이 있을 때 표시합니다.',
      perfectFormula: '나의 Haves ∩ 상대방의 Wants ≠ ∅ (공집합이 아님)\nAND\n나의 Wants ∩ 상대방의 Haves ≠ ∅ (공집합이 아님)',
      perfectDesc2: '“완전”은 목록 전체가 같다는 뜻이 아니라 서로 주고받을 후보가 최소 한 개씩 있다는 뜻입니다. 수량과 실제 보유 여부는 대화에서 확인해야 합니다.',
      partialTitle: '부분 매칭 (Partial Match)',
      partialDesc1: '완전 매칭이 아니면서 한쪽 방향에만 겹치는 항목이 있을 때 표시합니다.',
      partialFormula: '나의 Haves ∩ 상대방의 Wants ≠ ∅ (상대가 내 카드를 원함)\nOR\n나의 Wants ∩ 상대방의 Haves ≠ ∅ (내가 상대 카드를 원함)',
      partialDesc2: '내가 상대 항목을 원하지만 상대가 내 항목을 원하지 않거나, 그 반대인 경우입니다. 어느 방향이 일치했는지 확인한 뒤 대화하세요.',
      sec3Title: '3. 결과 정확도를 높이는 방법',
      sec3List1: '교환이 끝난 항목은 Haves와 Wants에서 즉시 제거해 오래된 매칭을 줄입니다.',
      sec3List2: '게시 전에 현재 게임 상태와 사이트 목록을 대조하고, 연락할 때 일치한 항목을 다시 확인합니다.',
      sec4Title: '4. 판정의 한계',
      sec4Desc: '매칭은 목록의 교집합만 확인합니다. 실제 보유, 수량, 연락 가능 여부, 교환 조건과 성공 여부는 판정하지 않으며 특정 성공률을 보장하지 않습니다.'
    }
  },
  en: {
    backBtn: '← Back to Main Exchange',
    tabs: {
      gemTable: '💎 Gem Efficiency Table',
      colGuide: '⚡ Collection Guide',
      safetyRules: '🛡️ Safety Rules',
      matchEngine: '⚙️ Matching Engine'
    },
    gemTable: {
      title: 'Gem Reinforcement Efficiency Analysis & Guide',
      subtitle: 'This efficiency report calculates cost-effectiveness per 1 Point (P) earned, using gold recovery after resale against investment costs.',
      calcTitle: '💎 Real-Time Gem Reinforcement Calculator',
      selectGrade: 'Select Gem Grade',
      normalGrade: 'Normal Grade',
      heroGrade: 'Hero Grade',
      legendGrade: 'Legend Grade',
      currentReinforce: 'Current Reinforcement',
      targetReinforce: 'Target Reinforcement',
      bonusScore: 'Legend Gem Score Bonus',
      noBonus: 'No Bonus (Score 54 or below)',
      bonus55: 'Score 55 or above (+50P)',
      bonus60: 'Score 60 or above (+100P)',
      resCost: 'Accumulated Cost',
      resRefund: 'Refund Difference',
      resActual: 'Actual Gold Spent',
      resPoints: 'Points Earned (P)',
      resUnitCost: 'Cost per 1 Point',
      resRating: 'Efficiency Rating',
      gold: 'Gold',
      points: 'P',
      formulaTitle: '1. Calculation Rules & Bonus Points',
      formulaDesc: 'Standard reinforcement points and gem score bonuses awarded as reinforcement tier rises:',
      formulaList1: 'Basic Points: +1 (5P) | +2 (10P) | +3 (15P) | +4 (20P) | +5 (25P)',
      formulaList2: 'Gem Score Bonus: +50P for Score 55+ | +100P for Score 60+ (Legend only)',
      formulaFormula: 'Actual Gold Spent = Accumulated Cost - (Resale Price - 0-reinf Resale Price)',
      formulaNote: '* Gold is partially refunded upon selling, so calculations are based on the net opportunity cost loss.',
      dataTitle: '2. Basic Data per Grade and Reinforcement Tier',
      tableCostTitle: '① Reinforcement Cost (Gold)',
      tablePriceTitle: '② Resale Price (Gold)',
      tableColGrade: 'Grade',
      tableColAccum: 'Accum.(+5)',
      tableNote: '※ Results use the cost and resale values entered in this table. They may change when game data changes.',
      rankTitle: '3. Top 6 Accumulated Ranges by Cost per 1P',
      rankNote: 'Lower cost per 1P equals higher efficiency.',
      tableColRank: 'Rank',
      tableColTarget: 'Target',
      tableColActual: 'Actual Gold Spent',
      tableColPoints: 'Points',
      tableColUnitCost: 'Cost per 1P',
      tableColRating: 'Rating',
      rank1: 'S Grade (Top Priority)',
      rank2: 'A Grade (Good)',
      rank3: 'B Grade (Average)',
      rank4: 'C Grade (Low)',
      rank5: 'D Grade (Not Recommended)',
      rankCBonus: 'C Grade (Bonus)',
      analysisTitle: '4. Efficiency Analysis & Rating Guide',
      analysisS: '🟢 S Grade (Top Priority - Under 500 Gold per 1P)',
      analysisSDesc: 'Normal +1 / Hero +1 / Normal +2\nThese entries calculate to 500 Gold or less per point with the current values.',
      analysisA: '🔵 A Grade (Good - 500 ~ 1,000 Gold per 1P)',
      analysisADesc: 'Legend +1 / Normal +3 / Hero +2\nThese entries calculate to 500–1,000 Gold per point with the current values.',
      analysisB: '🟡 B Grade (Average - 1,000 ~ 2,500 Gold per 1P)',
      analysisBDesc: 'Hero +3 / Normal +4 / Legend +2\nThese entries calculate to 1,000–2,500 Gold per point with the current values.',
      analysisC: '🟣 C Grade (Low/Specific Use - 2,500 ~ 5,500 Gold per 1P)',
      analysisCDesc: 'Legend +3 / Hero +4 / Legend +5 (60-point bonus selected)\nWhen the +100P option is selected, Legend +5 calculates to 5,475 Gold per point.',
      analysisD: '🔴 D Grade (Not Recommended - Exceeds 5,500 Gold per 1P)',
      analysisDDesc: 'Normal +5 / Legend +5 (55 points selected) / Legend +4 / Hero +5 / Legend +5 (no bonus)\nThese entries exceed 5,500 Gold per point with the current values. Consider your goal and available Gold.',
      summaryTitle: '5. Summary & Recommended Limits',
      summaryDesc1: 'By cost per point in this table, the ranges through Normal +4, Hero +3, and Legend +3 calculate relatively lower.',
      summaryDesc2: 'Legend +5 changes substantially depending on whether the 55-point or 60-point bonus option applies.',
      summaryDesc3: 'Reference order: Normal +1 ➔ Hero +1 ➔ Normal +2 ➔ Legend +1 ➔ Normal +3 ➔ Hero +2 ➔ Hero +3 ➔ Normal +4'
    },
    colGuide: {
      title: 'Exchange List Management Guide',
      subtitle: 'Keep Haves and Wants aligned with your actual inventory to reduce stale match signals.',
      sec1Title: '1. Before entering a list',
      sec1Desc: 'Use Haves only for tradable extras you currently own, and Wants only for stickers you still need. This site cannot read the game inventory, so your entries are the only matching source.',
      sec2Title: '2. Five steps for current lists',
      strat1Title: 'Check the current game inventory',
      strat1Desc: 'Verify extras and missing stickers in the game instead of relying on memory.',
      strat2Title: 'Separate Haves and Wants by collection',
      strat2Desc: 'Review all 20 collections in order and do not place the same sticker in both lists.',
      strat3Title: 'Exclude non-exchangeable slots',
      strat3Desc: 'The 24 gold-bordered locked slots cannot be added to Haves or Wants.',
      strat4Title: 'Review contact details and notes',
      strat4Desc: 'Check for expired links or typos, and do not publish personal data that is unnecessary for an exchange.',
      strat5Title: 'Clean up immediately after a trade',
      strat5Desc: 'Remove sent stickers from Haves and received stickers from Wants so other users do not see stale matches.',
      sec3Title: '3. Reading match signals',
      sec3Desc: 'A perfect match means each side has at least one candidate for the other. A partial match means only one direction overlaps. Neither signal verifies quantity, current ownership, or completion.',
      sec4Title: '4. Periodic review',
      sec4Desc: 'Compare the site list with the game after getting a new sticker, completing a trade, or returning after a break.',
      keyTitle: 'Summary',
      key1: '1. Record only real tradable extras in Haves.',
      key2: '2. Keep only stickers you still need in Wants.',
      key3: '3. Update both lists immediately after a trade.'
    },
    safetyRules: {
      title: 'Safe Exchange Checklist',
      subtitle: 'Separate information this site can display from details you must confirm in the game.',
      sec1Title: '1. Scope of this site',
      sec1Desc: 'This site compares user-posted lists and provides contact and reporting features. It does not verify game inventories, identity, or final exchange completion.',
      sec2Title: '2. Three checks before contact',
      warning1Title: '⚠️ Stale lists',
      warning1Desc: 'A posted Have may no longer be available. Ask whether the matched sticker is still owned and tradable.',
      warning2Title: '⚠️ Nickname or contact mismatch',
      warning2Desc: 'Check that the post nickname, external contact account, and in-game nickname refer to the same person. External links are not ownership-verified by the site.',
      warning3Title: '⚠️ Changed final terms',
      warning3Desc: 'If terms change, restate the stickers and quantities each side will give, then compare them with the final screen.',
      sec3Title: '3. Personal data and records',
      sec3Desc: 'Keep only the information needed to explain an issue:',
      sec3List1: 'Agreement record: Keep nicknames, sticker names and slots, quantities, and time.',
      sec3List2: 'Personal data: Never share passwords, verification codes, recovery codes, or payment details.',
      sec3List3: 'External links: Avoid unknown pages that request login, file installation, or remote access.',
      sec4Title: '4. Reporting an issue',
      sec4List1: 'Use Report on the relevant exchange or board post and describe what happened.',
      sec4List2: 'If needed, email redacted screenshots and the nickname to helper.dv3sticker@gmail.com.',
      sec4List3: 'Reports are reviewed, but the site does not guarantee a response time, a specific sanction, or restoration of game items.'
    },
    matchEngine: {
      title: 'Perfect and Partial Match Logic',
      subtitle: 'The current conditions used to compare intersections between Haves and Wants.',
      sec1Title: '1. Compared data',
      sec1Desc: 'The service compares my Haves and Wants with the other post\'s Haves and Wants by sticker ID. The ID combines the collection number and slot number.',
      sec2Title: '2. Two match signals',
      sec2Desc: 'The service checks whether each directional intersection is empty.',
      perfectTitle: 'Perfect Match',
      perfectDesc1: 'Displayed when both directions contain at least one overlapping sticker:',
      perfectFormula: 'My Haves ∩ Other\'s Wants ≠ ∅\nAND\nMy Wants ∩ Other\'s Haves ≠ ∅',
      perfectDesc2: '“Perfect” does not mean the full lists are identical. It only means each side has at least one candidate for the other. Confirm quantity and current ownership in chat.',
      partialTitle: 'Partial Match',
      partialDesc1: 'Displayed when the result is not perfect and only one direction overlaps:',
      partialFormula: 'My Haves ∩ Other\'s Wants ≠ ∅ (They want my card)\nOR\nMy Wants ∩ Other\'s Haves ≠ ∅ (I want their card)',
      partialDesc2: 'This occurs when you want one of their stickers but they do not want yours, or the reverse. Check which direction matched before contacting them.',
      sec3Title: '3. Improve result accuracy',
      sec3List1: 'Remove completed stickers from Haves and Wants immediately to reduce stale signals.',
      sec3List2: 'Compare the site list with the current game state before posting, and confirm matched items in chat.',
      sec4Title: '4. Limits of the signal',
      sec4Desc: 'Matching checks list intersections only. It does not verify ownership, quantity, contact availability, terms, or completion, and it does not guarantee a success rate.'
    }
  }
};

// 젬 강화 기초 DB
const gemData = {
  normal: {
    costs: [0, 1500, 7230, 16470, 47000, 234000],
    prices: [1000, 1750, 5365, 13600, 37100, 167000]
  },
  hero: {
    costs: [0, 3060, 14480, 29700, 131000, 383000],
    prices: [3000, 4530, 11770, 26620, 92370, 284000]
  },
  legend: {
    costs: [0, 7640, 36230, 74520, 292000, 958000],
    prices: [10000, 13820, 31935, 69195, 215195, 694000]
  }
};

const pointsData = [0, 5, 10, 15, 20, 25];

export function GuideSection({ activeTab, setActiveTab, onBack }) {
  const { language } = useLanguage();
  const c = language === 'en' ? GUIDE_CONTENT.en : GUIDE_CONTENT.ko;

  // 젬 강화 계산기 상태
  const [grade, setGrade] = useState('normal');
  const [start, setStart] = useState(0);
  const [target, setTarget] = useState(2);
  const [bonus, setBonus] = useState(0);

  const activeData = gemData[grade];
  let totalCost = 0;
  for (let i = start + 1; i <= target; i++) {
    totalCost += activeData.costs[i];
  }

  const refundDiff = activeData.prices[target] - activeData.prices[start];
  const actualCost = totalCost - refundDiff;
  const basePoints = pointsData[target] - pointsData[start];
  const points = basePoints + (grade === 'legend' && target === 5 ? bonus : 0);
  const unitCost = points > 0 ? Math.round(actualCost / points) : 0;

  const { rating, ratingClass } = unitCost <= 500
    ? { rating: c.gemTable.rank1, ratingClass: 'badge-s' }
    : unitCost <= 1000
      ? { rating: c.gemTable.rank2, ratingClass: 'badge-a' }
      : unitCost <= 2500
        ? { rating: c.gemTable.rank3, ratingClass: 'badge-b' }
        : unitCost <= 5500
          ? { rating: c.gemTable.rank4, ratingClass: 'badge-c' }
          : { rating: c.gemTable.rank5, ratingClass: 'badge-d' };

  const result = {
    cost: totalCost,
    refund: refundDiff,
    actual: actualCost,
    points,
    unitCost,
    rating,
    ratingClass
  };

  return (
    <div className="guide-container content-width" style={{
      margin: '20px auto',
      padding: '24px',
      background: 'var(--card-bg)',
      backdropFilter: 'blur(12px)',
      borderRadius: '24px',
      border: '1px solid var(--border-color)',
      boxShadow: 'var(--shadow-main)',
      textAlign: 'left'
    }}>
      {/* 뒤로가기 버튼 */}
      <button 
        onClick={onBack}
        className="btn btn-outline"
        style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        {c.backBtn}
      </button>

      {/* 가이드 내부 상단 탭 스위치 */}
      <div style={{
        display: 'flex',
        gap: '10px',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '15px',
        marginBottom: '25px',
        flexWrap: 'wrap'
      }}>
        {Object.entries(c.tabs).map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              setActiveTab(key);
              // 초기화
              setGrade('normal');
              setStart(0);
              setTarget(2);
              setBonus(0);
            }}
            className={`btn ${activeTab === key ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '10px 18px', borderRadius: '12px', fontSize: '13.5px', fontWeight: 'bold' }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 1. 젬 강화 효율표 탭 */}
      {activeTab === 'gemTable' && (
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
            {c.gemTable.title}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 25px 0', lineHeight: '1.6' }}>
            {c.gemTable.subtitle}
          </p>

          {/* 계산기 컴포넌트 */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '24px',
            marginBottom: '30px'
          }}>
            <h3 style={{ margin: '0 0 18px 0', fontSize: '17px', color: 'var(--primary-color)', fontWeight: '800' }}>
              {c.gemTable.calcTitle}
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                  {c.gemTable.selectGrade}
                </label>
                <select 
                  value={grade}
                  onChange={(e) => {
                    setGrade(e.target.value);
                    if (e.target.value !== 'legend') setBonus(0);
                  }}
                  style={{
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '10px',
                    color: '#fff',
                    outline: 'none'
                  }}
                >
                  <option value="normal">{c.gemTable.normalGrade}</option>
                  <option value="hero">{c.gemTable.heroGrade}</option>
                  <option value="legend">{c.gemTable.legendGrade}</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                  {c.gemTable.currentReinforce}
                </label>
                <select 
                  value={start}
                  onChange={(e) => {
                    const nextStart = parseInt(e.target.value);
                    setStart(nextStart);
                    if (target <= nextStart) setTarget(nextStart + 1);
                  }}
                  style={{
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '10px',
                    color: '#fff',
                    outline: 'none'
                  }}
                >
                  <option value="0">+0강</option>
                  <option value="1">+1강</option>
                  <option value="2">+2강</option>
                  <option value="3">+3강</option>
                  <option value="4">+4강</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                  {c.gemTable.targetReinforce}
                </label>
                <select 
                  value={target}
                  onChange={(e) => setTarget(parseInt(e.target.value))}
                  style={{
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '10px',
                    color: '#fff',
                    outline: 'none'
                  }}
                >
                  <option value="1" disabled={start >= 1}>+1강</option>
                  <option value="2" disabled={start >= 2}>+2강</option>
                  <option value="3" disabled={start >= 3}>+3강</option>
                  <option value="4" disabled={start >= 4}>+4강</option>
                  <option value="5">+5강</option>
                </select>
              </div>

              {grade === 'legend' && target === 5 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                    {c.gemTable.bonusScore}
                  </label>
                  <select 
                    value={bonus}
                    onChange={(e) => setBonus(parseInt(e.target.value))}
                    style={{
                      background: 'rgba(0, 0, 0, 0.25)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '10px',
                      color: '#fff',
                      outline: 'none'
                    }}
                  >
                    <option value={0}>{c.gemTable.noBonus}</option>
                    <option value={55}>{c.gemTable.bonus55}</option>
                    <option value={100}>{c.gemTable.bonus60}</option>
                  </select>
                </div>
              )}
            </div>

            {/* 계산기 결과 */}
            <div style={{
              background: 'rgba(0,0,0,0.15)',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '15px'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.gemTable.resCost}</span>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: '#fff', marginTop: '4px' }}>
                    {result.cost.toLocaleString()} {c.gemTable.gold}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.gemTable.resRefund}</span>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: '#fff', marginTop: '4px' }}>
                    {result.refund.toLocaleString()} {c.gemTable.gold}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.gemTable.resActual}</span>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--primary-color)', marginTop: '4px' }}>
                    {result.actual.toLocaleString()} {c.gemTable.gold}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.gemTable.resPoints}</span>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: '#fff', marginTop: '4px' }}>
                    {result.points} {c.gemTable.points}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.gemTable.resUnitCost}</span>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--primary-color)', marginTop: '4px' }}>
                    {result.unitCost.toLocaleString()} {c.gemTable.gold}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.gemTable.resRating}</span>
                  <span className={`badge ${result.ratingClass}`} style={{
                    alignSelf: 'flex-start',
                    marginTop: '4px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    textAlign: 'center'
                  }}>
                    {result.rating}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 정보 텍스트 섹션 */}
          <div className="content-section" style={{ marginBottom: '30px', lineHeight: '1.6' }}>
            <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              {c.gemTable.formulaTitle}
            </h2>
            <p>{c.gemTable.formulaDesc}</p>
            <ul>
              <li>{c.gemTable.formulaList1}</li>
              <li>{c.gemTable.formulaList2}</li>
            </ul>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', fontFamily: 'monospace', margin: '12px 0' }}>
              {c.gemTable.formulaFormula}
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>{c.gemTable.formulaNote}</p>
          </div>

          <div className="content-section" style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              {c.gemTable.dataTitle}
            </h2>
            <h3 style={{ fontSize: '15px', color: 'var(--primary-color)', margin: '15px 0 8px 0' }}>{c.gemTable.tableCostTitle}</h3>
            <div className="table-scroll">
              <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>{c.gemTable.tableColGrade}</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>0→1</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>1→2</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>2→3</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>3→4</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>4→5</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>{c.gemTable.tableColAccum}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>{c.gemTable.normalGrade}</td>
                  <td style={{ padding: '10px' }}>1,500</td>
                  <td style={{ padding: '10px' }}>7,230</td>
                  <td style={{ padding: '10px' }}>16,470</td>
                  <td style={{ padding: '10px' }}>47,000</td>
                  <td style={{ padding: '10px' }}>234,000</td>
                  <td style={{ padding: '10px', color: 'var(--primary-color)' }}>306,200</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px', fontWeight: 'bold', color: '#60a5fa' }}>{c.gemTable.heroGrade}</td>
                  <td style={{ padding: '10px' }}>3,060</td>
                  <td style={{ padding: '10px' }}>14,480</td>
                  <td style={{ padding: '10px' }}>29,700</td>
                  <td style={{ padding: '10px' }}>131,000</td>
                  <td style={{ padding: '10px' }}>383,000</td>
                  <td style={{ padding: '10px', color: 'var(--primary-color)' }}>561,240</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px', fontWeight: 'bold', color: '#fbbf24' }}>{c.gemTable.legendGrade}</td>
                  <td style={{ padding: '10px' }}>7,640</td>
                  <td style={{ padding: '10px' }}>36,230</td>
                  <td style={{ padding: '10px' }}>74,520</td>
                  <td style={{ padding: '10px' }}>292,000</td>
                  <td style={{ padding: '10px' }}>958,000</td>
                  <td style={{ padding: '10px', color: 'var(--primary-color)' }}>1,368,390</td>
                </tr>
              </tbody>
              </table>
            </div>

            <h3 style={{ fontSize: '15px', color: 'var(--primary-color)', margin: '25px 0 8px 0' }}>{c.gemTable.tablePriceTitle}</h3>
            <div className="table-scroll">
              <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>{c.gemTable.tableColGrade}</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>+0</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>+1</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>+2</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>+3</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>+4</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>+5</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>{c.gemTable.normalGrade}</td>
                  <td style={{ padding: '10px' }}>1,000</td>
                  <td style={{ padding: '10px' }}>1,750</td>
                  <td style={{ padding: '10px' }}>5,365</td>
                  <td style={{ padding: '10px' }}>13,600</td>
                  <td style={{ padding: '10px' }}>37,100</td>
                  <td style={{ padding: '10px' }}>167,000</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px', fontWeight: 'bold', color: '#60a5fa' }}>{c.gemTable.heroGrade}</td>
                  <td style={{ padding: '10px' }}>3,000</td>
                  <td style={{ padding: '10px' }}>4,530</td>
                  <td style={{ padding: '10px' }}>11,770</td>
                  <td style={{ padding: '10px' }}>26,620</td>
                  <td style={{ padding: '10px' }}>92,370</td>
                  <td style={{ padding: '10px' }}>284,000</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px', fontWeight: 'bold', color: '#fbbf24' }}>{c.gemTable.legendGrade}</td>
                  <td style={{ padding: '10px' }}>10,000</td>
                  <td style={{ padding: '10px' }}>13,820</td>
                  <td style={{ padding: '10px' }}>31,935</td>
                  <td style={{ padding: '10px' }}>69,195</td>
                  <td style={{ padding: '10px' }}>215,195</td>
                  <td style={{ padding: '10px' }}>694,000</td>
                </tr>
              </tbody>
              </table>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>{c.gemTable.tableNote}</p>
          </div>

          {/* 순위표 */}
          <div className="content-section" style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              {c.gemTable.rankTitle}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{c.gemTable.rankNote}</p>
            <div className="table-scroll">
              <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginTop: '10px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '10px' }}>{c.gemTable.tableColRank}</th>
                  <th style={{ padding: '10px' }}>{c.gemTable.tableColGrade}</th>
                  <th style={{ padding: '10px' }}>{c.gemTable.tableColTarget}</th>
                  <th style={{ padding: '10px' }}>{c.gemTable.tableColActual}</th>
                  <th style={{ padding: '10px' }}>{c.gemTable.tableColPoints}</th>
                  <th style={{ padding: '10px' }}>{c.gemTable.tableColUnitCost}</th>
                  <th style={{ padding: '10px' }}>{c.gemTable.tableColRating}</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: 'rgba(167, 139, 250, 0.05)' }}>
                  <td style={{ padding: '10px' }}>1</td>
                  <td style={{ padding: '10px' }}>{c.gemTable.normalGrade}</td>
                  <td style={{ padding: '10px' }}>+1</td>
                  <td style={{ padding: '10px' }}>750</td>
                  <td style={{ padding: '10px' }}>5</td>
                  <td style={{ padding: '10px', color: 'var(--primary-color)', fontWeight: 'bold' }}>150</td>
                  <td style={{ padding: '10px' }}><span className="badge badge-s">{c.gemTable.rank1}</span></td>
                </tr>
                <tr style={{ background: 'rgba(167, 139, 250, 0.05)' }}>
                  <td style={{ padding: '10px' }}>2</td>
                  <td style={{ padding: '10px', color: '#60a5fa' }}>{c.gemTable.heroGrade}</td>
                  <td style={{ padding: '10px' }}>+1</td>
                  <td style={{ padding: '10px' }}>1,530</td>
                  <td style={{ padding: '10px' }}>5</td>
                  <td style={{ padding: '10px', color: 'var(--primary-color)', fontWeight: 'bold' }}>306</td>
                  <td style={{ padding: '10px' }}><span className="badge badge-s">{c.gemTable.rank1}</span></td>
                </tr>
                <tr style={{ background: 'rgba(167, 139, 250, 0.05)' }}>
                  <td style={{ padding: '10px' }}>3</td>
                  <td style={{ padding: '10px' }}>{c.gemTable.normalGrade}</td>
                  <td style={{ padding: '10px' }}>+2</td>
                  <td style={{ padding: '10px' }}>4,365</td>
                  <td style={{ padding: '10px' }}>10</td>
                  <td style={{ padding: '10px', color: 'var(--primary-color)', fontWeight: 'bold' }}>437</td>
                  <td style={{ padding: '10px' }}><span className="badge badge-s">{c.gemTable.rank1}</span></td>
                </tr>
                <tr>
                  <td style={{ padding: '10px' }}>4</td>
                  <td style={{ padding: '10px', color: '#fbbf24' }}>{c.gemTable.legendGrade}</td>
                  <td style={{ padding: '10px' }}>+1</td>
                  <td style={{ padding: '10px' }}>3,820</td>
                  <td style={{ padding: '10px' }}>5</td>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>764</td>
                  <td style={{ padding: '10px' }}><span className="badge badge-a">{c.gemTable.rank2}</span></td>
                </tr>
                <tr style={{ background: 'rgba(167, 139, 250, 0.05)' }}>
                  <td style={{ padding: '10px' }}>5</td>
                  <td style={{ padding: '10px' }}>{c.gemTable.normalGrade}</td>
                  <td style={{ padding: '10px' }}>+3</td>
                  <td style={{ padding: '10px' }}>12,600</td>
                  <td style={{ padding: '10px' }}>15</td>
                  <td style={{ padding: '10px', color: 'var(--primary-color)', fontWeight: 'bold' }}>840</td>
                  <td style={{ padding: '10px' }}><span className="badge badge-a">{c.gemTable.rank2}</span></td>
                </tr>
                <tr>
                  <td style={{ padding: '10px' }}>6</td>
                  <td style={{ padding: '10px', color: '#60a5fa' }}>{c.gemTable.heroGrade}</td>
                  <td style={{ padding: '10px' }}>+2</td>
                  <td style={{ padding: '10px' }}>8,770</td>
                  <td style={{ padding: '10px' }}>10</td>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>877</td>
                  <td style={{ padding: '10px' }}><span className="badge badge-a">{c.gemTable.rank2}</span></td>
                </tr>
              </tbody>
              </table>
            </div>
          </div>

          {/* 효율 분석 및 등급 */}
          <div className="content-section" style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              {c.gemTable.analysisTitle}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
              <div style={{ borderLeft: '4px solid #a78bfa', paddingLeft: '12px' }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#a78bfa' }}>{c.gemTable.analysisS}</h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>{c.gemTable.analysisSDesc}</p>
              </div>
              <div style={{ borderLeft: '4px solid #60a5fa', paddingLeft: '12px' }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#60a5fa' }}>{c.gemTable.analysisA}</h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>{c.gemTable.analysisADesc}</p>
              </div>
              <div style={{ borderLeft: '4px solid #fbbf24', paddingLeft: '12px' }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#fbbf24' }}>{c.gemTable.analysisB}</h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>{c.gemTable.analysisBDesc}</p>
              </div>
              <div style={{ borderLeft: '4px solid #10b981', paddingLeft: '12px' }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#10b981' }}>{c.gemTable.analysisC}</h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>{c.gemTable.analysisCDesc}</p>
              </div>
              <div style={{ borderLeft: '4px solid #ef4444', paddingLeft: '12px' }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#fca5a5' }}>{c.gemTable.analysisD}</h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>{c.gemTable.analysisDDesc}</p>
              </div>
            </div>
          </div>

          {/* 최종 요약 */}
          <div className="content-section" style={{ marginBottom: '10px' }}>
            <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              {c.gemTable.summaryTitle}
            </h2>
            <ul style={{ lineHeight: '1.6', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
              <li>{c.gemTable.summaryDesc1}</li>
              <li>{c.gemTable.summaryDesc2}</li>
              <li style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{c.gemTable.summaryDesc3}</li>
            </ul>
          </div>
        </div>
      )}

      {/* 2. 수집 효율 공략 탭 */}
      {activeTab === 'colGuide' && (
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
            {c.colGuide.title}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 25px 0', lineHeight: '1.6' }}>
            {c.colGuide.subtitle}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h2 style={{ fontSize: '17px', color: 'var(--primary-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                {c.colGuide.sec1Title}
              </h2>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                {c.colGuide.sec1Desc}
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: '17px', color: 'var(--primary-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                {c.colGuide.sec2Title}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
                {[1, 2, 3, 4, 5].map((num) => (
                  <div key={num} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '16px' }}>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: 'var(--text-primary)' }}>
                      <span style={{ background: 'var(--primary-color)', color: '#000', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', marginRight: '8px' }}>{num}</span>
                      {c.colGuide[`strat${num}Title`]}
                    </h4>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      {c.colGuide[`strat${num}Desc`]}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 style={{ fontSize: '17px', color: 'var(--primary-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                {c.colGuide.sec3Title}
              </h2>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                {c.colGuide.sec3Desc}
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: '17px', color: 'var(--primary-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                {c.colGuide.sec4Title}
              </h2>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                {c.colGuide.sec4Desc}
              </p>
            </div>

            <div style={{ background: 'rgba(167, 139, 250, 0.1)', border: '1px solid rgba(167, 139, 250, 0.25)', borderRadius: '16px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '14.5px', color: '#c4b5fd', fontWeight: 'bold' }}>{c.colGuide.keyTitle}</h3>
              <p style={{ margin: '4px 0', fontSize: '13px', color: '#c4b5fd' }}>{c.colGuide.key1}</p>
              <p style={{ margin: '4px 0', fontSize: '13px', color: '#c4b5fd' }}>{c.colGuide.key2}</p>
              <p style={{ margin: '4px 0', fontSize: '13px', color: '#c4b5fd' }}>{c.colGuide.key3}</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. 안전 거래 수칙 탭 */}
      {activeTab === 'safetyRules' && (
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
            {c.safetyRules.title}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 25px 0', lineHeight: '1.6' }}>
            {c.safetyRules.subtitle}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h2 style={{ fontSize: '17px', color: 'var(--primary-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                {c.safetyRules.sec1Title}
              </h2>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                {c.safetyRules.sec1Desc}
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: '17px', color: 'var(--primary-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                {c.safetyRules.sec2Title}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
                {[1, 2, 3].map((num) => (
                  <div key={num} style={{ background: 'rgba(239, 68, 68, 0.04)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '14px', padding: '16px' }}>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#fca5a5', fontWeight: 'bold' }}>
                      {c.safetyRules[`warning${num}Title`]}
                    </h4>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      {c.safetyRules[`warning${num}Desc`]}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 style={{ fontSize: '17px', color: 'var(--primary-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                {c.safetyRules.sec3Title}
              </h2>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>{c.safetyRules.sec3Desc}</p>
              <ul style={{ lineHeight: '1.7', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <li>{c.safetyRules.sec3List1}</li>
                <li>{c.safetyRules.sec3List2}</li>
                <li>{c.safetyRules.sec3List3}</li>
              </ul>
            </div>

            <div>
              <h2 style={{ fontSize: '17px', color: 'var(--primary-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                {c.safetyRules.sec4Title}
              </h2>
              <ol style={{ lineHeight: '1.7', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <li>{c.safetyRules.sec4List1}</li>
                <li>{c.safetyRules.sec4List2}</li>
                <li>{c.safetyRules.sec4List3}</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* 4. 매칭 엔진 작동 원리 탭 */}
      {activeTab === 'matchEngine' && (
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
            {c.matchEngine.title}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 25px 0', lineHeight: '1.6' }}>
            {c.matchEngine.subtitle}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h2 style={{ fontSize: '17px', color: 'var(--primary-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                {c.matchEngine.sec1Title}
              </h2>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                {c.matchEngine.sec1Desc}
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: '17px', color: 'var(--primary-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                {c.matchEngine.sec2Title}
              </h2>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>{c.matchEngine.sec2Desc}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
                <div style={{ borderLeft: '4px solid #10b981', paddingLeft: '12px' }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#10b981', fontWeight: 'bold' }}>{c.matchEngine.perfectTitle}</h4>
                  <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>{c.matchEngine.perfectDesc1}</p>
                  <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', fontSize: '12px', margin: '8px 0', fontFamily: 'monospace' }}>
                    {c.matchEngine.perfectFormula}
                  </pre>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{c.matchEngine.perfectDesc2}</p>
                </div>

                <div style={{ borderLeft: '4px solid #f59e0b', paddingLeft: '12px' }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#f59e0b', fontWeight: 'bold' }}>{c.matchEngine.partialTitle}</h4>
                  <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>{c.matchEngine.partialDesc1}</p>
                  <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', fontSize: '12px', margin: '8px 0', fontFamily: 'monospace' }}>
                    {c.matchEngine.partialFormula}
                  </pre>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{c.matchEngine.partialDesc2}</p>
                </div>
              </div>
            </div>

            <div>
              <h2 style={{ fontSize: '17px', color: 'var(--primary-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                {c.matchEngine.sec3Title}
              </h2>
              <ul style={{ lineHeight: '1.7', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <li>{c.matchEngine.sec3List1}</li>
                <li>{c.matchEngine.sec3List2}</li>
              </ul>
            </div>

            <div>
              <h2 style={{ fontSize: '17px', color: 'var(--primary-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                {c.matchEngine.sec4Title}
              </h2>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                {c.matchEngine.sec4Desc}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
