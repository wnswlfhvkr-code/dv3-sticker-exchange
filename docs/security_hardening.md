# 보안 강화 메모

## 적용된 장치

- `vercel.json`에 CSP, frame 차단, MIME sniffing 차단, referrer policy, 권한 정책을 추가했다.
- `public/robots.txt`로 일반 검색/복제 크롤러의 접근을 거부했다.
- 게시판 입력은 기존 `sanitizeInput`을 거쳐 저장한다.
- `.env`와 `.env.*`는 `.gitignore`에 포함되어 저장소에 커밋되지 않도록 유지한다.

## 공개 웹앱의 한계

HTML, CSS, JavaScript, 공개 이미지는 브라우저에 내려간 뒤 완전한 복제 차단이 불가능하다. 따라서 목표는 복제 자체의 완전 차단이 아니라 다음에 둔다.

- 사이트 iframe 임베딩 차단
- 일반 크롤러 색인 억제
- 민감한 서버 키/관리 키 클라이언트 노출 방지
- 사용자 입력값 XSS 방어
- Supabase 쓰기 권한 축소를 위한 후속 구조 마련

## Supabase 권장 후속 조치

현재 앱은 Supabase Auth가 아닌 닉네임+비밀번호 커스텀 로그인 구조를 사용한다. 이 상태에서는 DB가 브라우저의 익명 키 요청을 실제 로그인 사용자와 강하게 연결할 수 없다.

운영 보안을 높이려면 다음 중 하나로 전환한다.

1. Supabase Auth 기반 회원 체계로 이전하고 RLS를 사용자 ID 기준으로 켠다.
2. 글 작성/삭제/게시판 작성 API를 Edge Function으로 옮기고 서버에서 닉네임/비밀번호 검증 후 service role로 DB를 쓴다.
3. 최소한 익명 키 권한을 읽기 중심으로 제한하고 쓰기 작업은 서버 검증 레이어를 거친다.

## 점검 명령

```powershell
git ls-files .env .env.development.local
rg -n "service_role|SUPABASE_SERVICE|anon key|password|secret|ca-pub" .
```
