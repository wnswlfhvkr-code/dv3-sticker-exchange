# DV3 Sticker Exchange

드래곤빌리지3 스티커 교환 플랫폼

## Features

- **게시글 등록 및 관리**: 내가 가진 카드(Haves)와 필요한 카드(Wants)를 지정하여 실시간으로 교환글을 게시합니다.
- **실시간 교환 매칭 (Matching Engine)**: 나와 상대방의 보유/필요 카드를 교차 비교하여 자동으로 100% 매칭 및 부분 매칭(Partial Match) 상태를 피드에 컬러풀하게 표시해 줍니다.
- **실시간 1:1 채팅방**: 매칭 피드에서 직접 상대방과 1:1 실시간 소켓 채팅을 열어 대화할 수 있으며, 안 읽은 메시지 수 알림 및 실시간 알림음 기능이 내장되어 있습니다.
- **실시간 소켓 데이터 동기화**: Supabase Realtime 채널을 활성화하여 1.5초 타이머 주기 폴링 없이 서버 변경사항이 화면에 즉각 실시간 갱신됩니다.
- **온라인 접속 유저 필터**: 현재 사이트에 로그인하여 활동 중인 온라인 상태의 유저들이 작성한 글만 필터링하여 확인하는 🟢 실시간 필터를 지원합니다.
- **교환 가능 글 필터**: 내가 상대방에게 줄 수 있거나, 상대방이 나에게 줄 수 있는 스티커 매칭 거래가 1개 이상 존재하는 유효 교환글만 별도로 모아보는 필터가 내장되어 있습니다.
- **피드 페이지네이션 (Pagination)**: 피드가 무한정 길어지는 현상을 방지하기 위해 5개 단위로 잘라 보는 페이지네이션 컨트롤러를 탑재하고 있습니다.
- **🐛 버그 제보 시스템**: 방문자 누구나 오류를 리포트할 수 있으며, 관리자(`간장` 계정)로 로그인 시 대시보드 탭에 `🐛 버그 제보` 전용 채널이 나타나 접수된 내역 확인 및 삭제 관리가 가능합니다.
- **하이브리드 백엔드**: 온라인 Supabase 데이터베이스 외에도 환경 변수 미설정 시 로컬 브라우저 저장소(LocalStorage) 모드로 100% 동등하게 자동 폴백(Fallback) 동작합니다.

## Tech Stack

- **Frontend**: React, JavaScript (ES6+), Vanilla CSS
- **Build Tool**: Vite, Rolldown
- **Database & Realtime**: Supabase (PostgreSQL, Realtime Subscriptions)
- **Deployment**: Vercel

## Project Structure

```text
project-root/
│
├─ src/
│  ├─ assets/         # 앱 내부 정적 자원 (CSS, 아이콘 등)
│  ├─ components/     # 글로벌 공통 컴포넌트 (Header 등)
│  ├─ features/       # 도메인 기능별 MVVM 모듈 분리
│  │  ├─ admin/       # 관리자 제어 센터 및 신고/버그 제보 모달
│  │  ├─ auth/        # 로그인 및 내 정보 서랍(Drawer) 제어
│  │  ├─ basket/      # 교환 장바구니 카드 선택 세션
│  │  ├─ chat/        # 1:1 실시간 채팅 컴포넌트 및 뷰모델
│  │  ├─ post/        # 피드 렌더링, 페이징, 필터, 게시글 폼
│  │  └─ sticker/     # 등급별/카테고리별 도감 선택 그리드
│  ├─ utils/          # 보안 및 유틸리티 함수
│  ├─ App.jsx         # 메인 메쉬 앱 구성 요소
│  ├─ chatService.js  # 채팅 비즈니스 통신 서비스
│  ├─ main.jsx        # 엔트리 포인트
│  ├─ stickersData.js # 드빌3 전체 카드 메타데이터
│  └─ supabaseClient.js # Supabase 클라이언트 및 로컬폴백 DB
│
├─ public/            # 정적 파일들 (파비콘 등)
├─ docs/              # 프로젝트 기술 설계 문서
│  ├─ architecture/   # 아키텍처 및 모듈 맵 구조도
│  ├─ requirements/   # 요구사항 히스토리 로그
│  └─ dev-log/        # 릴리즈 날짜별 개발 일지 (summary)
│
├─ scripts/           # 스크래핑 및 OCR 파싱용 Python/PS 스크립트
├─ assets/            # 캡처 스크린샷 및 도감 가이드 이미지 자원
├─ database/          # Supabase SQL 스키마 스크립트
├─ archive/           # 예전 빌드 및 백업 소스 아카이빙 폴더
├─ data/              # 데이터 파싱 원본 JSON 및 텍스트 데이터
├─ misc/              # 기타 레퍼런스 참고 데이터
│
├─ README.md          # 소개 가이드 문서
├─ package.json       # 패키지 명세서
├─ vite.config.js     # Vite 빌드 설정
├─ eslint.config.js   # ESLint 린트 규칙 설정
├─ index.html         # HTML 엔트리 템플릿
├─ .gitignore         # Git 추적 예외 규칙
├─ .env               # 로컬 개발 환경 변수 (비공개)
└─ .env.example       # 개발 환경 변수 공유 템플릿
```

## Getting Started

```bash
# 의존성 설치
npm install

# 로컬 개발 서버 구동
npm run dev
```

## Build

```bash
# 정적 컴파일 및 프로덕션 번들링 빌드
npm run build
```

## Deployment

Vercel + Supabase 연동 배포 가이드를 참조하세요.

## Environment Variables

이 프로젝트는 Supabase 연동 정보인 `.env` 파일 설정이 필요합니다. 상세 구조는 `.env.example` 파일을 참고하세요.
