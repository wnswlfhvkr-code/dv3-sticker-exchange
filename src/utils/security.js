/**
 * 드래곤 빌리지 3 카드교환소 프론트엔드 보안 지킴이 유틸리티
 */

/**
 * 사용자가 입력한 텍스트에서 악성 HTML 태그 및 스크립트를 안전하게 무력화(Escape) 처리합니다.
 * XSS (Cross-Site Scripting) 공격 방지에 탁월합니다.
 * 
 * @param {string} text 사용자가 입력한 순수 문자열
 * @returns {string} 안전하게 변환된 문자열
 */
export function sanitizeInput(text) {
  if (typeof text !== 'string') return '';
  
  // HTML 특수기호들을 브라우저가 일반 글자로 렌더링하도록 텍스트 치환
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * 이스케이프된 HTML 엔티티 문자열을 원래의 기호 문자로 다시 안전하게 복원(디코딩)합니다.
 * 화면에 슬래시(/)나 따옴표 등이 깨져서 &#x2F; 등으로 나오는 현상을 해결합니다.
 * 
 * @param {string} html 이스케이프된 문자열
 * @returns {string} 원래의 깨끗한 문자열
 */
export function decodeHTML(html) {
  if (typeof html !== 'string') return '';
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}


/**
 * 회원 가입 및 로그인 시 입력받은 닉네임이 정상적인 문자열(한글, 영문, 숫자, 일부 공백)로만 
 * 구성되어 있는지 검사합니다. SQL Injection 및 해킹용 불량 닉네임을 사전 차단합니다.
 * 
 * @param {string} nickname 사용자가 제출한 닉네임
 * @returns {boolean} 유효한 닉네임이면 true, 비정상이면 false
 */
export function validateNickname(nickname) {
  if (typeof nickname !== 'string' || !nickname.trim()) return false;
  
  // 한글(가-힣), 영문(a-zA-Z), 숫자(0-9), 괄호, 공백, 게스트 표기용 텍스트만 허용하는 화이트리스트 정규식
  const nicknameRegex = /^[a-zA-Z0-9가-힣\s()\-가-힣]+$/;
  
  // 닉네임 길이가 너무 길거나 정규식에 어긋나면 유효하지 않음
  if (nickname.length > 25) return false;
  
  return nicknameRegex.test(nickname);
}



