# 🗺️ Dragon Village 3 카드교환소 아키텍처 도면도 (Architecture Map)

이 문서는 프로젝트 내 각 폴더와 파일의 위치, 역할 및 컴포넌트 간의 연결 관계를 요약 정리하여, 특정 기능이나 화면을 수정하고 싶을 때 신속하게 해당 위치를 파악할 수 있도록 돕습니다.

---

## 📁 1. 디렉토리 구조 (Directory Structure)

```bash
카드교환소/
├── src/
│   ├── components/       # UI 화면을 구성하는 View 컴포넌트들 (단순 마크업 + 스타일 + ViewModel 바인딩)
│   ├── viewmodels/       # 비즈니스 로직과 상태 제어 로직을 격리한 ViewModel 커스텀 훅들
│   ├── stickersData.js   # 180장의 스티커 메타데이터 (별 개수, 카테고리 정보, 골든 여부, CDN 이미지 등)
│   ├── chatService.js    # 1:1 채팅 관련 Supabase 실시간 통신 및 LocalStorage 폴백 로직
│   ├── supabaseClient.js # Supabase 클라이언트 초기화 및 가상 테스트용 Mock 분기 제어
│   ├── index.css         # 글로벌 공용 스타일, 레이아웃 및 다크모드/글래스모피즘 테마 스타일시트
│   └── App.jsx           # 뷰모델들을 취합하여 화면 컴포넌트들과 바인딩하는 최상위 엔트리 포인트
├── MASTER_BLUEPRINT.md   # 패치 버전 관리 및 종합 기획/동작 마스터 청사진
└── README.md             # 초보자용 실행법 및 Supabase DB 테이블 세팅 방법 가이드
```

---

## 🔗 2. 핵심 ViewModel & View 매핑 및 역할 정보

특정 화면이나 기능을 수정할 때 어떤 파일들을 편집해야 하는지 알려주는 매핑 지도입니다.

### 🔐 A. 사용자 인증 및 로그인 (Auth Flow)
*   **상태 및 로직 제어**: `src/viewmodels/useAuthViewModel.js`
    *   임시 닉네임 생성, 게스트 자동 로그인 세션 발급, 관리자 계정 판정(`is_admin`) 로직 담당.
*   **연관 화면**:
    *   `src/components/Header.jsx`: 로그인 상태(닉네임) 및 관리자 딱지 표시, 로그아웃 버튼 배치.
    *   `src/components/LoginModal.jsx`: 최초 접속 시 게스트 닉네임을 입력받고 로그인 처리하는 팝업 모달.

### 📚 B. 메인 도감 3x3 선택 & 선택 바구니 (Basket & Grid Flow)
*   **상태 및 로직 제어**: `src/viewmodels/useBasketViewModel.js`
    *   보유 카드(`Haves`) 및 필요 카드(`Wants`)의 우클릭/좌클릭 토글 상태 관리.
    *   특정 카테고리 팩 선택 상태(`selectedCategoryId`) 및 바구니 임시보관 상태 관리.
*   **연관 화면**:
    *   `src/components/CategoryList.jsx`: 20개 카테고리 팩 목록 및 각 팩 안의 선택된 하브/원트 개수 배지 표시.
    *   `src/components/StickerDetailGrid.jsx` [LATEST]: 3x3 격자 형태의 세부 도감, 마우스 좌/우클릭 바인딩, 키보드 `4` / `6` 단축키 전환, 황금 카드 차단 필터 제어.
    *   `src/components/BasketSection.jsx`: 화면 최하단의 "내가 선택한 스티커 목록" 요약 바구니 및 "거래글 등록하기" 트리거 버튼.

### ✍️ C. 거래 게시판 및 댓글/매칭 (Post & Feed Flow)
*   **상태 및 로직 제어**: `src/viewmodels/usePostViewModel.js`
    *   게시글 CRUD (작성, 수정, 삭제, 리프레시 끌올), 댓글 달기/삭제 로직.
    *   게시글 목록 필터링(검색어, 내 글만 보기, 매칭된 글만 보기) 관리.
    *   상대방 글과 내 바구니를 대조하여 배지를 주는 매칭 엔진 연산 (`checkMatching`) 탑재.
*   **연관 화면**:
    *   `src/components/PostFeed.jsx`: 게시판 리스트, 아코디언 접이식 레이아웃, 줄/받을 카드 대조 및 1:1 대화 시작 버튼.
    *   `src/components/PostFormModal.jsx`: 신규 거래글 작성 창 (Haves/Wants 목록 자동 요약 바인딩).
    *   `src/components/EditPostModal.jsx`: 거래글 수정 모달 (메인 도감과 동일한 3x3 미니 도감 선택기 내장).

### 💬 D. 1:1 실시간 채팅 (Chat Flow)
*   **상태 및 로직 제어**: `src/viewmodels/useChatViewModel.js` & `src/chatService.js`
    *   1:1 채팅방 개설/수신, 메시지 데이터 실시간 구독(Realtime Subscription), 안 읽은 메시지 수 카운팅 및 로컬 띵동 알림음 발생 제어.
*   **연관 화면**:
    *   `src/components/ChatWidget.jsx`: 화면 우측 하단의 1:1 채팅방 대화 목록 목록창 및 상세 메시지 채팅 위젯.

### 🚨 E. 신고 및 관리자 (Admin Flow)
*   **상태 및 로직 제어**: `src/viewmodels/useAdminViewModel.js`
    *   불량 게시글/유저 신고 처리, 관리자 대시보드 조회 및 게시글 강제 블라인드/제재 관리.
*   **연관 화면**:
    *   `src/components/ReportModal.jsx`: 불량 글을 신고하는 사유 입력 팝업창.
    *   `src/components/AdminDashboard.jsx`: 관리자 권한 로그인 시 상단에 표시되는 신고 목록 및 제재용 관리자 전용 대시보드.
    *   `src/components/MyInfoDrawer.jsx`: 우측 슬라이드 방식의 "내 정보" 서랍장 (내가 작성한 글 목록 확인 및 내 정보 수정).
