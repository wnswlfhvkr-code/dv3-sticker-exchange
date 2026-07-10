import React, { useState, useEffect } from 'react';
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
      tableNote: '※ 판매가는 대부분 누적 강화 비용의 약 50%를 보전하여 환급해 주는 규칙을 따릅니다.',
      rankTitle: '3. 1P당 가성비 기준 누적 효율 순위',
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
      analysisSDesc: '영웅 +1 / 일반 +2\n극소량의 골드만으로 엄청난 포인트를 고속 회수하는 절대적 가성비 구간입니다.',
      analysisA: '🔵 A등급 (효율 좋음 - 1P당 500~1,000골드)',
      analysisADesc: '전설 +1 / 일반 +3 / 영웅 +2\n가성비가 매우 뛰어나며 골드 소모 대비 확실한 효율을 보장합니다.',
      analysisB: '🟡 B등급 (보통 - 1P당 1,000~2,500골드)',
      analysisBDesc: '영웅 +3 / 일반 +4 / 전설 +2\n보통의 효율을 보이며, 도감 및 덱 성장을 위한 가장 안정적인 실질적 강화 마지노선입니다.',
      analysisC: '🟣 C등급 (낮음/특정 목적 - 1P당 2,500~5,500골드)',
      analysisCDesc: '전설 +3 / 영웅 +4 / 전설 +5 (60점 보너스 목적)\n기본 가성비는 떨어지지만, 전설 젬의 60점 추가 보너스(+100P)가 100% 확정일 때는 포인트 환산 효율이 5,395골드로 복구되므로 고려할 만합니다.',
      analysisD: '🔴 D등급 (비추천/효율 최악 - 1P당 5,500골드 초과)',
      analysisDDesc: '일반 +5 / 전설 +5 (55점 달성) / 영웅 +5 / 전설 +5 (보너스 없음)\n전설 +5 (55점 달성)은 보너스 포인트(+50P)를 받더라도 1P당 8,992골드라는 극악의 비효율을 보여주므로 비추천합니다. 투자 골드 대비 포인트 리턴이 극단적으로 낮으므로 절대 피하시는 것이 좋습니다.',
      summaryTitle: '5. 최종 요약 및 추천 강화 한계선',
      summaryDesc1: '순수 효율 기준 추천 한계선: 일반 젬은 +4까지, 영웅 젬은 +3까지, 전설 젬은 +3까지 투자하는 것이 비용 대 효율 측면에서 가장 유리합니다.',
      summaryDesc2: '전설 +5의 예외성: 오직 전설 젬의 60점 보너스를 확실하게 띄울 수 있는 조건일 때만 투자 가치가 성립됩니다. 55점 보너스는 투입 재화 대비 효율이 너무 낮아 손해입니다.',
      summaryDesc3: '추천 강화 우선순위 테크: 영웅 +1 ➔ 일반 +2 ➔ 전설 +1 ➔ 일반 +3 ➔ 영웅 +2 ➔ 영웅 +3 ➔ 일반 +4'
    },
    colGuide: {
      title: '스티커북 수집 효율 극대화 공략',
      subtitle: '드빌3 스티커 수집 과정의 비효율을 줄이고 가장 단기간에 도감을 완성하는 실전 수집 전술서입니다.',
      sec1Title: '1. 무과금 유저를 위한 스티커 획득 데일리 루틴',
      sec1Desc: '과금 없이 스티커북을 채우기 위해서는 인게임에서 무상으로 지급되는 스티커 수집 루트를 매일 빠짐없이 수행하는 것이 필수적입니다. 첫째, 일일 퀘스트 및 주간 퀘스트를 클리어하세요. 퀘스트 최종 보상 상자에는 높은 확률로 일반~희귀 등급의 스티커 팩이 포함되어 있습니다. 둘째, 모험 하트(행동력)를 낭비 없이 소모해야 합니다. 특정 모험 지역은 클리어 시 확률적으로 해당 테마의 모험 스티커가 필드 드롭됩니다. 셋째, 이벤트 상점 및 한정 던전 공략입니다. 매 시즌 진행되는 특별 이벤트 주화를 모아 상점에서 한정판 스티커 팩으로 우선 교환하는 것이 현명합니다. 이 일일 루틴을 꾸준히 돌려 모아둔 중복 카드들이 추후 교환소에서 고가치 등급 카드를 데려오는 소중한 밑천이 됩니다.',
      sec2Title: '2. 수집 효율을 비약적으로 높이는 5가지 실전 전략',
      strat1Title: '중복 스티커 발생 시 실시간 교환 등록',
      strat1Desc: '인벤토리에 중복 스티커가 쌓여있는 것은 기회비용의 낭비입니다. 새로운 중복을 얻는 즉시 본 스티커교환소의 내 바구니에 추가하고 교환 피드를 작성하세요. 서버 내에 동일한 카드의 매물이 쌓일수록 내 카드의 교환 경쟁력은 하락합니다. 신속한 교환이 도감 완성 기간을 절반 이하로 단축시킵니다.',
      strat2Title: '희귀/영웅 스티커의 교환 가치 최적화 (1:N 거래)',
      strat2Desc: '전설 및 영웅 등급의 최고급 스티커는 단순히 1:1로만 거래할 필요가 없습니다. 만약 내가 인기 드래곤의 영웅 카드를 한 장 중복으로 가지고 있다면, 내가 아직 채우지 못한 일반~희귀 등급 스티커 3~4장을 묶어서 요구해 보세요. 도감 완성 막바지에 이른 유저들은 영웅 카드 한 장을 얻기 위해 하위 카드 여러 장을 선뜻 넘겨주는 경우가 많습니다.',
      strat3Title: '단일 카테고리 집중 타겟팅 돌파법',
      strat3Desc: '모든 스티커북을 동시에 채우려 하면 죽도 밥도 안 됩니다. 초반에는 수집 난이도가 가장 낮은 \'드래곤 알\' 카테고리나 완성 스크롤이 짧은 특정 속성 컬렉션부터 타겟으로 지정하세요. 하나의 도감을 끝까지 완성해 능력치 보너스를 획득하고, 그 보너스로 모험 속도를 높여 더 상위의 스티커 팩을 파밍하는 스노우볼을 굴려야 합니다.',
      strat4Title: '바구니 Haves와 Wants의 세밀한 필터 설정',
      strat4Desc: '교환소 매칭 엔진을 극대화하려면 Wants(희망 목록)를 넓게 잡는 것이 좋습니다. 꼭 오늘 완성해야 하는 타겟 카드 외에도, 언젠가 모아야 할 위시리스트 카드까지 바구니에 등록해 두면 시스템에 \'부분 매칭\' 또는 \'양방향 매칭\' 알림이 더 빈번하게 잡혀 교환 대화의 물꼬를 트기 쉬워집니다.',
      strat5Title: '활동 시간대를 겨냥한 글 갱신 (리프레시)',
      strat5Desc: '많은 유저들이 저녁 시간대(오후 7시 ~ 11시)와 주말에 접속합니다. 이 골든타임에 교환글을 새로고침하여 목록 최상단에 노출시키면 채팅 문의가 들어올 확률이 비약적으로 증가합니다. 낮 시간에 방치해 두는 것보다 트래픽이 높은 시간에 노출시키는 것이 효율적입니다.',
      sec3Title: '3. 스티커 합성 시스템의 함정과 올바른 활용법',
      sec3Desc: '인게임에는 필요 없는 스티커 여러 장을 소모해 상위 등급의 무작위 스티커를 뽑는 \'합성 시스템\'이 존재합니다. 하지만 이는 무과금 유저에게 매우 치명적인 함정이 될 수 있습니다. 합성 결과물은 여전히 무작위이기 때문에, 또다시 원치 않는 중복 영웅이나 희귀 카드가 나올 위험이 큽니다. 따라서 "합성하기 전에 반드시 교환소에서 1:1 매칭 거래를 먼저 시도"하는 습관을 들이세요. 교환소에서 도무지 찾아가지 않는 비인기 일반 카드들만 최종적으로 모아 합성의 제물로 바치는 것이 자원 효율을 극대화하는 길입니다.',
      sec4Title: '4. 알 코드 공유 게시판과의 연계 전략',
      sec4Desc: '게임 내에서 알 코드를 타인과 공유하고 등록하면 다량의 한정판 스티커 팩을 우편으로 수령할 수 있습니다. 본 사이트의 \'자유게시판\' 영역에 상시 개설되어 있는 알 코드 공유 릴레이 스레드를 방문하세요. 서로의 코드를 품앗이하듯 등록해 주면 인게임 상점에서 다량의 스티커 팩을 공짜로 수급할 수 있으며, 여기서 나온 미확인 카드들을 다시 교환소 도감 바구니에 업데이트하는 선순환 구조를 만들 수 있습니다.',
      keyTitle: '💡 핵심 요약',
      key1: '1. 중복 카드는 무조건 교환소 바구니에 즉시 등록한다.',
      key2: '2. 가치가 높은 카드 1장으로 가치가 낮은 필요한 카드 여러 장을 얻는 1:N 거래를 설계한다.',
      key3: '3. 무조건 합성을 돌리기 전에 교환 거래를 먼저 알아본다.'
    },
    safetyRules: {
      title: '안전 거래 및 사기 방지 가이드',
      subtitle: '유저 간 1:1 스티커 교환 진행 시 안전을 확보하고 사기 피해를 예방하기 위한 상세 매뉴얼입니다.',
      sec1Title: '1. 드빌3 인게임 교환 시스템의 안전망 활용',
      sec1Desc: '드래곤빌리지 3 개발진은 유저들의 안전한 스티커 이동을 위해 공식적으로 \'교환 시스템\'을 게임 내에 구현해 두었습니다. 이 시스템은 양쪽 유저가 교환 창을 열어 거래할 스티커를 서로 올린 뒤, 확인 버튼을 눌러 조건이 일치할 때만 동시에 거래가 성사되는 \'동시 확정 거래\' 방식입니다. 따라서 공식적인 루트만 활용한다면 원칙적으로 물리적인 배달 사고나 사기가 발생할 수 없습니다. 사기 피해는 대부분 이 공식적인 시스템을 우회하여 편법 거래를 유도할 때 발생합니다.',
      sec2Title: '2. 반드시 주의해야 할 3대 교환 사기 수법',
      warning1Title: '⚠️ 수법 1: "선(先) 전송 요구" 수법',
      warning1Desc: '사기꾼들이 가장 흔하게 사용하는 수법으로, 본인의 신용도가 높다거나 "교환 슬롯에 오류가 있어서 선물하기 기능을 이용해 먼저 스티커를 우편으로 보내주면 나도 즉시 우편으로 답례하겠다"고 속집니다. 이에 응하여 먼저 카드를 보내는 순간 사기꾼은 즉각 잠적하거나 메신저 차단을 실행합니다. 어떠한 핑계가 있더라도 먼저 우편으로 카드를 전송하는 거래는 절대 응하지 마세요.',
      warning2Title: '⚠️ 수법 2: 유사 닉네임을 이용한 신분 사칭',
      warning2Desc: '인기 유저나 신용 등급이 높은 유저의 닉네임과 매우 유사한 닉네임(예: 알파벳 \'l\'과 숫자 \'1\', 한글 \'ㅇ\'과 \'o\' 조합 등)으로 부캐릭터를 생성한 뒤, 원래의 거래자인 것처럼 행세하며 카드를 받아 가려 합니다. 게임 내 교환 확정 창에서 거래 상대방의 정확한 프로필 레벨, 대표 드래곤, 길드 마크가 일치하는지 마지막의 마지막까지 대조 검증하셔야 합니다.',
      warning3Title: '⚠️ 수법 3: 거래 품목 바꿔치기',
      warning3Desc: '교환 로비에서 대화 도중, 갑자기 거래 조건을 재협상하자며 상대방이 창을 닫았다가 다시 열어 신속한 수락을 재촉합니다. 이때 자세히 보지 않으면 처음 약속했던 영웅 등급 카드가 아닌 외형이 유사한 일반 등급 카드로 교체되어 올라온 것을 인지하지 못하고 \'확정\' 버튼을 누르게 될 수 있습니다. 매 거래 확정 직전에는 카드 위에 커서를 올려 정확한 스티커 등급과 명칭을 재차 마우스오버해 보시기 바랍니다.',
      sec3Title: '3. 사기 피해를 원천 차단하는 행동 지침',
      sec3Desc: '안전하고 쾌적한 교환 문화를 만들기 위해 다음 지침을 생활화해 주세요.',
      sec3List1: '채팅 스크린샷 아카이빙: 교환 조율 과정에서 나눈 모든 대화(닉네임, 약속한 스티커 종류, 시간 등)의 캡처본을 남겨두세요. 분쟁 발생 시 결정적인 증거 자료가 됩니다.',
      sec3List2: '외부 링크 이동 금지: 카카오톡 오픈프로필이나 외부 메신저로의 이동 요청은 가급적 거절하고, 본 교환소의 RLS 보안이 적용된 내장 채팅 메신저 내에서 대화를 지속하는 것이 안전합니다.',
      sec3List3: '이상 제안 차단: 지나치게 파격적인 조건(예: 일반 카드 1장으로 전설 카드 제공 등)으로 먼저 다가오는 유저는 사칭 및 해킹 유저일 가능성이 매우 높으니 반드시 경계하십시오.',
      sec4Title: '4. 불성실 교환 유저 및 사기 피해 발생 시 대처법',
      sec4List1: '해당 거래 유저의 교환글 카드 우측의 \'신고\' 단추를 눌러 상세 정황을 기재해 접수합니다.',
      sec4List2: '스크린샷과 게임 내 닉네임을 첨부하여 공식 관리자 이메일(helper.dv3sticker@gmail.com)로 제보해 주시면, RLS 관리자 권한을 통해 해당 유저의 닉네임과 IP 대역을 영구 이용 정지 처리합니다.',
      sec4List3: '다만, 본 플랫폼은 자발적으로 개설된 정보 매칭 도구이므로 실제 거래 중 발생한 인게임 자산 손실에 대해서는 복구 의무 및 법적 손해 배상의 대행 책임을 지지 않음을 알려드립니다.'
    },
    matchEngine: {
      title: '자동 매칭 알고리즘의 원리와 100% 활용법',
      subtitle: '본 교환소가 자랑하는 실시간 매칭 엔진이 최적의 거래 상대를 찾아내는 논리적 원리를 설명합니다.',
      sec1Title: '1. 자동 매칭 엔진(Matching Engine) 설계 배경',
      sec1Desc: '기존의 일반적인 게임 커뮤니티나 카페 게시판에서 스티커 교환 글을 올리면, 매번 수많은 글들 속에서 나와 이해관계가 맞는 사람을 일일이 수작업으로 대조해야 했습니다. 이는 엄청난 시간 낭비이자 스트레스였습니다. 본 교환소는 이러한 문제를 해결하기 위해 유저들이 등록한 Haves(줄 수 있는 카드) 목록과 Wants(받고 싶은 카드) 데이터셋을 실시간으로 비교하여 맞춤 파트너를 자동으로 짝지어 주는 \'매칭 알고리즘\'을 자체 개발하여 이식하였습니다.',
      sec2Title: '2. 두 가지 핵심 매칭 모드의 논리적 원리',
      sec2Desc: '매칭 엔진은 매칭의 조건 강도에 따라 \'양방향 매칭\'과 \'부분 매칭\' 두 가지 신호로 분류하여 제공합니다.',
      perfectTitle: '🟢 100% 양방향 매칭 (Perfect Matching)',
      perfectDesc1: '양방향 매칭은 나와 상대방의 이해관계가 완벽하게 일치하는 최상의 매칭 상태입니다. 수학적 합집합과 교집합 개념을 활용하여 다음과 같이 작동합니다.',
      perfectFormula: '나의 Haves ∩ 상대방의 Wants ≠ ∅ (공집합이 아님)\nAND\n나의 Wants ∩ 상대방의 Haves ≠ ∅ (공집합이 아님)',
      perfectDesc2: '즉, 내가 남아서 줄 수 있는 카드 중 하나를 상대가 간절히 원하고, 동시에 상대가 남아서 줄 수 있는 카드 중 하나를 내가 간절히 원할 때 이 녹색 배지가 활성화됩니다. 이 상태는 대화를 시도하면 거래 성공률이 99%에 수렴하므로, 발견하는 즉시 채팅을 시도하시는 것이 유리합니다.',
      partialTitle: '🟡 부분 매칭 (Partial Matching)',
      partialDesc1: '부분 매칭은 절반의 일치 상태를 뜻하며, 다음과 같이 단방향적 요구 충족 상황에서 노란색 배지로 표시됩니다.',
      partialFormula: '나의 Haves ∩ 상대방의 Wants ≠ ∅ (상대가 내 카드를 원함)\nOR\n나의 Wants ∩ 상대방의 Haves ≠ ∅ (내가 상대 카드를 원함)',
      partialDesc2: '예를 들어, 나는 상대가 보유한 카드를 원하지만 상대는 내가 가진 카드를 원하지 않을 때, 또는 반대로 상대가 내 카드를 원하지만 상대의 보유 리스트에 내가 필요한 카드가 없을 때 활성화됩니다. 비록 완전한 일치는 아니지만, 유저 간 추가적인 스티커 조율이나 \'알 코드\', 또는 다른 카드를 제안하여 협상할 수 있는 훌륭한 교두보가 됩니다.',
      sec3Title: '3. 매칭 매니저를 통한 성사율 200% 올리기',
      sec3List1: '바구니 데이터의 적극적 최신화: 교환이 완료되어 소모된 카드는 즉시 바구니에서 제외해 주세요. 잘못된 정보가 바구니에 방치되면 다른 유저와의 헛된 매칭 신호가 잡혀 매칭 엔진의 신뢰도를 저하시킵니다.',
      sec3List2: 'Wants 리스트의 점진적 다각화: 내가 당장 갖고 싶은 전설 등급 카드만 Wants에 채워넣지 말고, 틈틈이 도감을 채워야 하는 희귀/영웅 등급 카드도 여러 장 추가해 두세요. 리스트가 다양할수록 더 많은 유저들과 매칭 교차점이 형성되어 거래 문의 횟수가 획기적으로 상승합니다.',
      sec4Title: '4. 결론: 똑똑한 데이터 교환 플랫폼',
      sec4Desc: '드빌3 스티커교환소는 단순한 텍스트 나열형 게시판을 넘어, 데이터 알고리즘을 통해 유저의 시간과 노력을 획기적으로 절약해 주는 스마트 플랫폼입니다. 본 매칭 엔진의 작동 원리를 명확히 이해하고 자신의 스티커 컬렉션 데이터셋을 영리하게 관리한다면, 서버 내 어떤 수집가들보다도 빠르고 합리적으로 드빌3 스티커 도감을 완성해 나갈 수 있을 것입니다.'
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
      tableNote: '※ Resale price generally recovers around 50% of the accumulated reinforcement gold cost.',
      rankTitle: '3. Accumulated Efficiency Rankings (Cost per 1P)',
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
      analysisSDesc: 'Hero +1 / Normal +2\nAbsolute best value range, pulling back large amounts of points with minimal gold investment.',
      analysisA: '🔵 A Grade (Good - 500 ~ 1,000 Gold per 1P)',
      analysisADesc: 'Legend +1 / Normal +3 / Hero +2\nHigh cost-effectiveness, providing solid return relative to gold spent.',
      analysisB: '🟡 B Grade (Average - 1,000 ~ 2,500 Gold per 1P)',
      analysisBDesc: 'Hero +3 / Normal +4 / Legend +2\nModerate value. This is the most stable and realistic baseline limit for deck growth.',
      analysisC: '🟣 C Grade (Low/Specific Use - 2,500 ~ 5,500 Gold per 1P)',
      analysisCDesc: 'Legend +3 / Hero +4 / Legend +5 (With 60pt Bonus)\nLow base efficiency, but if the 60pt Legend bonus (+100P) is guaranteed, efficiency recovers to 5,395 Gold, making it viable.',
      analysisD: '🔴 D Grade (Not Recommended - Exceeds 5,500 Gold per 1P)',
      analysisDDesc: 'Normal +5 / Legend +5 (55pt) / Hero +5 / Legend +5 (No Bonus)\nLegend +5 with only 55pt bonus returns a terrible 8,992 Gold per 1P efficiency. Highly recommended to avoid these tiers.',
      summaryTitle: '5. Summary & Recommended Limits',
      summaryDesc1: 'Efficiency-Based Recommended Limits: For Normal Gems up to +4, Hero Gems up to +3, and Legend Gems up to +3 to optimize cost performance.',
      summaryDesc2: 'Legend +5 Exception: Only worth the cost if you can guarantee the 60pt (+100P) bonus. The 55pt bonus efficiency is too low.',
      summaryDesc3: 'Optimal Upgrade Route: Hero +1 ➔ Normal +2 ➔ Legend +1 ➔ Normal +3 ➔ Hero +2 ➔ Hero +3 ➔ Normal +4'
    },
    colGuide: {
      title: 'Maximizing Sticker Collection Efficiency Guide',
      subtitle: 'Practical guide to cutting down inefficiencies and completing your DV3 sticker book in the shortest time possible.',
      sec1Title: '1. Daily Routine for Free-to-Play Users',
      sec1Desc: 'To fill up your sticker book without paying, executing daily in-game free sticker routes is crucial. First, clear all Daily & Weekly quests. The final reward chests have a high chance of containing Normal-Rare sticker packs. Second, spend all adventure hearts (stamina) without wasting them. Specific adventure zones drop thematic stickers on clear. Third, utilize event shops and limited dungeons. Exchanging event currency for limited sticker packs first is the smartest choice. Duplicates accumulated this way become your capital for high-tier stickers at the exchange.',
      sec2Title: '2. 5 Strategies to Accelerate Collection',
      strat1Title: 'Register Duplicates Immediately',
      strat1Desc: 'Leaving duplicate stickers in your inventory wastes opportunity. Add duplicates to your exchange basket immediately and write posts. As supply increases, the competitive value of your duplicates drops. Quick trading halves completion time.',
      strat2Title: 'Optimize Exchange Value (1:N Trades)',
      strat2Desc: 'Legend and Hero grade duplicates do not need to be traded 1:1. If you have a duplicate hero card of a popular dragon, demand 3-4 Normal-Rare cards that you lack. Collectors close to completing their books often trade multiple lower cards for one Hero card.',
      strat3Title: 'Target One Category at a Time',
      strat3Desc: 'Trying to collect everything at once slows down progress. Focus on easy categories like \'Dragon Egg\' or specific attribute collections with short completion scrolls first. Complete them to get stat bonuses, which speed up farming for higher packs.',
      strat4Title: 'Set Detailed Haves and Wants Filters',
      strat4Desc: 'Broaden your Wants list to maximize matching engine exposure. Adding long-term wishlist cards in addition to immediate targets generates more partial and dual match alerts, starting chat conversations easily.',
      strat5Title: 'Bump Posts During Active Hours',
      strat5Desc: 'Most users connect in the evening (7 PM - 11 PM) and on weekends. Refreshing/bumping your posts during these golden hours drastically increases your chances of getting chat inquiries compared to daytime hours.',
      sec3Title: '3. Sticker Synthesis Trap and Correct Usage',
      sec3Desc: 'In-game synthesis consumes multiple stickers to draft a random higher-tier card. This can be a trap for F2P players, as the outcome is still random and might yield unwanted duplicate heroes or rares. Always try 1:1 exchange trading first. Synthesize only unpopular normal cards that nobody wants.',
      sec4Title: '4. Synergy with Egg Code Sharing Boards',
      sec4Desc: 'Sharing egg codes yields free limited sticker packs via mail. Visit the \'Trade Board\' or relay threads in our Free Board. Mutually registering codes generates massive free sticker packs, creating a loop where you update your basket with newly drafted cards.',
      keyTitle: '💡 Core Summary',
      key1: '1. Register duplicate cards in your exchange basket immediately.',
      key2: '2. Design 1:N trades to get multiple lower-tier cards with 1 high-tier card.',
      key3: '3. Exhaust exchange opportunities before resorting to synthesis.'
    },
    safetyRules: {
      title: 'Safe Trading & Scam Prevention Guide',
      subtitle: 'Detailed manual for maintaining safety and preventing scam damage during 1:1 sticker trades.',
      sec1Title: '1. Utilizing the In-Game Safe Exchange System',
      sec1Desc: 'The developers of Dragon Village 3 officially implemented an in-game exchange system. This system is a \'simultaneous confirmation trade\' where both users place stickers in the lobby and must both click confirm for the trade to execute. Physically, scams cannot happen if you use this official route. Scams occur when users bypass this system.',
      sec2Title: '2. Three Major Scams to Watch Out For',
      warning1Title: '⚠️ Scam 1: "Send First" Requests',
      warning1Desc: 'The most common scam where scammers claim high credibility or slot bugs, requesting you to mail the sticker first with a promise to return mail immediately. Sending cards first leads to instant blocking. Never agree to trades that require mailing cards first.',
      warning2Title: '⚠️ Scam 2: Impersonation via Similar Nicknames',
      warning2Desc: 'Creating sub-characters with nicknames highly similar to popular or trusted users (e.g. swapping \'l\' and \'1\', or \'o\' and \'0\') to steal cards. Always double check profile levels, representative dragons, and guild marks in the trade window before hitting confirm.',
      warning3Title: '⚠️ Scam 3: Sticker Swapping',
      warning3Desc: 'Re-negotiating conditions mid-trade, closing the window, and opening it again quickly to rush confirmation. Scammers swap the agreed Hero card with a similar-looking Normal card. Always mouseover and check the grade and name before confirming.',
      sec3Title: '3. Operational Guidelines to Block Scams',
      sec3Desc: 'Incorporate these habits for a safe trading culture:',
      sec3List1: 'Archive Chat Screenshots: Capture all conversations detailing nicknames, cards, and times. Essential evidence if disputes arise.',
      sec3List2: 'Avoid External Links: Reject moves to external messengers. Sticking to our RLS-secured built-in chat is safer.',
      sec3List3: 'Beware of Too-Good-To-Be-True Deals: Users offering Legend cards for 1 Normal card are likely compromised or malicious. Be cautious.',
      sec4Title: '4. Action Checklist for Unfair Traders & Scams',
      sec4List1: 'Click \'Report\' on the user\'s exchange card and describe the details.',
      sec4List2: 'Email screenshots and nicknames to helper.dv3sticker@gmail.com. Admins will permanently ban the user\'s nickname and IP range.',
      sec4List3: 'Note: As a voluntary match tool, this platform does not assume recovery obligations or legal liabilities for in-game asset losses.'
    },
    matchEngine: {
      title: 'Matching Algorithm Principles & Best Use',
      subtitle: 'Explains the logical principles of our real-time matching engine in finding your optimal trading partners.',
      sec1Title: '1. Background of the Matching Engine',
      sec1Desc: 'In traditional game communities, posting trades required manually searching hundreds of listings to find compatible traders. To solve this, we developed a real-time matching algorithm that correlates Haves and Wants datasets of all users, automatically pairing complementary matches.',
      sec2Title: '2. Logic of the Two Core Match Signals',
      sec2Desc: 'The engine categorizes matches into \'Perfect Matching\' and \'Partial Matching\':',
      perfectTitle: '🟢 100% Perfect Matching',
      perfectDesc1: 'Perfect matching is a complete mutual fit where both parties\' needs align perfectly. It uses mathematical intersection logic:',
      perfectFormula: 'My Haves ∩ Other\'s Wants ≠ ∅\nAND\nMy Wants ∩ Other\'s Haves ≠ ∅',
      perfectDesc2: 'When you have a card they want, and they have a card you want, this green badge lights up. These trades have a 99% success rate; initiate chat immediately.',
      partialTitle: '🟡 Partial Matching',
      partialDesc1: 'Partial matching represents a one-way fit, flagged with a yellow badge:',
      partialFormula: 'My Haves ∩ Other\'s Wants ≠ ∅ (They want my card)\nOR\nMy Wants ∩ Other\'s Haves ≠ ∅ (I want their card)',
      partialDesc2: 'Triggered when you want their card but they don\'t need yours, or vice versa. Still a great bridge to negotiate using egg codes or other filler cards.',
      sec3Title: '3. Bumping Success Rates by 200%',
      sec3List1: 'Keep Basket Updated: Remove traded stickers immediately. Outdated lists lead to dead matches, reducing engine utility.',
      sec3List2: 'Diversify Wants List: Don\'t just list high-end Legend cards. Adding Rare and Hero cards generates more match intersections, increasing inquiries.',
      sec4Title: '4. Conclusion: Smart Data Exchange Platform',
      sec4Desc: 'We move beyond traditional boards to offer a smart platform saving you time. Keeping your data updated ensures you finish your DV3 sticker book faster than anyone else.'
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
    prices: [1000, 13820, 31935, 69195, 215195, 694000] // +0 가격 수정 10,000 -> 1,000 혹은 10,000 (기존 10,000 유지)
  }
};
gemData.legend.prices[0] = 10000; // 기존 HTML 스펙과 동기화

const pointsData = [0, 5, 10, 15, 20, 25];

export function GuideSection({ activeTab, setActiveTab, onBack }) {
  const { language } = useLanguage();
  const c = language === 'en' ? GUIDE_CONTENT.en : GUIDE_CONTENT.ko;

  // 젬 강화 계산기 상태
  const [grade, setGrade] = useState('normal');
  const [start, setStart] = useState(0);
  const [target, setTarget] = useState(2);
  const [bonus, setBonus] = useState(0);

  // 결과 계산
  const [result, setResult] = useState({
    cost: 0,
    refund: 0,
    actual: 0,
    points: 0,
    unitCost: 0,
    rating: '',
    ratingClass: ''
  });

  useEffect(() => {
    // target 제어: target이 start보다 작거나 같을 수 없음
    if (target <= start) {
      setTarget(start + 1);
      return;
    }

    const activeData = gemData[grade];
    let totalCost = 0;
    for (let i = start + 1; i <= target; i++) {
      totalCost += activeData.costs[i];
    }

    const refundDiff = activeData.prices[target] - activeData.prices[start];
    const actualCost = totalCost - refundDiff;

    let pts = pointsData[target] - pointsData[start];
    if (grade === 'legend' && target === 5) {
      pts += bonus;
    }

    const unitCost = pts > 0 ? Math.round(actualCost / pts) : 0;

    let rating = '';
    let ratingClass = '';
    if (unitCost <= 500) {
      rating = c.gemTable.rank1;
      ratingClass = 'badge-s';
    } else if (unitCost <= 1000) {
      rating = c.gemTable.rank2;
      ratingClass = 'badge-a';
    } else if (unitCost <= 2500) {
      rating = c.gemTable.rank3;
      ratingClass = 'badge-b';
    } else if (unitCost <= 5500) {
      rating = c.gemTable.rank4;
      ratingClass = 'badge-c';
    } else {
      rating = c.gemTable.rank5;
      ratingClass = 'badge-d';
    }

    setResult({
      cost: totalCost,
      refund: refundDiff,
      actual: actualCost,
      points: pts,
      unitCost: unitCost,
      rating,
      ratingClass
    });
  }, [grade, start, target, bonus, language, c]);

  return (
    <div className="guide-container" style={{
      maxWidth: '1200px',
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
                  onChange={(e) => setStart(parseInt(e.target.value))}
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
                  <option value="1">+1강</option>
                  <option value="2">+2강</option>
                  <option value="3">+3강</option>
                  <option value="4">+4강</option>
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

            <h3 style={{ fontSize: '15px', color: 'var(--primary-color)', margin: '25px 0 8px 0' }}>{c.gemTable.tablePriceTitle}</h3>
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
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>{c.gemTable.tableNote}</p>
          </div>

          {/* 순위표 */}
          <div className="content-section" style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              {c.gemTable.rankTitle}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{c.gemTable.rankNote}</p>
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
                  <td style={{ padding: '10px', color: '#60a5fa' }}>{c.gemTable.heroGrade}</td>
                  <td style={{ padding: '10px' }}>+1</td>
                  <td style={{ padding: '10px' }}>1,530</td>
                  <td style={{ padding: '10px' }}>5</td>
                  <td style={{ padding: '10px', color: 'var(--primary-color)', fontWeight: 'bold' }}>306</td>
                  <td style={{ padding: '10px' }}><span className="badge badge-s">{c.gemTable.rank1}</span></td>
                </tr>
                <tr style={{ background: 'rgba(167, 139, 250, 0.05)' }}>
                  <td style={{ padding: '10px' }}>2</td>
                  <td style={{ padding: '10px' }}>{c.gemTable.normalGrade}</td>
                  <td style={{ padding: '10px' }}>+2</td>
                  <td style={{ padding: '10px' }}>4,365</td>
                  <td style={{ padding: '10px' }}>10</td>
                  <td style={{ padding: '10px', color: 'var(--primary-color)', fontWeight: 'bold' }}>437</td>
                  <td style={{ padding: '10px' }}><span className="badge badge-s">{c.gemTable.rank1}</span></td>
                </tr>
                <tr>
                  <td style={{ padding: '10px' }}>3</td>
                  <td style={{ padding: '10px', color: '#fbbf24' }}>{c.gemTable.legendGrade}</td>
                  <td style={{ padding: '10px' }}>+1</td>
                  <td style={{ padding: '10px' }}>3,820</td>
                  <td style={{ padding: '10px' }}>5</td>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>764</td>
                  <td style={{ padding: '10px' }}><span className="badge badge-a">{c.gemTable.rank2}</span></td>
                </tr>
                <tr style={{ background: 'rgba(167, 139, 250, 0.05)' }}>
                  <td style={{ padding: '10px' }}>4</td>
                  <td style={{ padding: '10px' }}>{c.gemTable.normalGrade}</td>
                  <td style={{ padding: '10px' }}>+3</td>
                  <td style={{ padding: '10px' }}>12,600</td>
                  <td style={{ padding: '10px' }}>15</td>
                  <td style={{ padding: '10px', color: 'var(--primary-color)', fontWeight: 'bold' }}>840</td>
                  <td style={{ padding: '10px' }}><span className="badge badge-a">{c.gemTable.rank2}</span></td>
                </tr>
                <tr>
                  <td style={{ padding: '10px' }}>5</td>
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
