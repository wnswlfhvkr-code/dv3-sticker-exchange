import React, { useState } from 'react';
import { ShieldCheck, Scale, Mail, X } from 'lucide-react';

export function Footer() {
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  return (
    <>
      <footer style={{
        marginTop: '60px',
        padding: '30px 20px',
        background: 'rgba(5, 3, 10, 0.65)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: '13px',
        lineHeight: '1.6',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          {/* 하단 링크 버튼들 */}
          <div style={{
            display: 'flex',
            gap: '24px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}>
            <button 
              onClick={() => setIsPrivacyOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.55)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#a78bfa'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.55)'}
            >
              <ShieldCheck size={15} />
              개인정보처리방침
            </button>

            <button 
              onClick={() => setIsRulesOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.55)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#a78bfa'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.55)'}
            >
              <Scale size={15} />
              커뮤니티 이용규칙
            </button>

            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'rgba(255, 255, 255, 0.4)',
            }}>
              <Mail size={15} />
              문의: helper.dv3sticker@gmail.com
            </span>
          </div>
 
          {/* 면책조항 및 저작권 정보 */}
          <div style={{
            maxWidth: '700px',
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.25)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <p>본 서비스는 유저 편의를 위해 자발적으로 구축된 비공식 개별 정보 교환 도구입니다.</p>
            <p>드래곤빌리지 및 관련 스티커 아트워크, 상표권은 원 저작권사(highbrow 등)에 귀속되어 있습니다.</p>
            <p>© 2026 DV3 스티커교환소. All Rights Reserved.</p>
          </div>
        </div>
      </footer>

      {/* 개인정보처리방침 모달 */}
      {isPrivacyOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(5, 3, 10, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10009,
          padding: '20px'
        }}>
          <div style={{
            background: 'rgba(25, 20, 35, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, color: '#f3f4f6', fontSize: '18px', fontWeight: '700' }}>개인정보처리방침</h3>
              <button 
                onClick={() => setIsPrivacyOpen(false)}
                style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{
              padding: '24px',
              overflowY: 'auto',
              color: 'rgba(255, 255, 255, 0.75)',
              fontSize: '14px',
              lineHeight: '1.7',
              textAlign: 'left'
            }}>
              <p><strong>1. 수집하는 개인정보 항목</strong><br />본 사이트는 별도의 민감한 개인정보를 요구하거나 강제로 저장하지 않습니다. 1:1 실시간 매칭 조율을 위해 이용자가 설정하는 게임 내 '닉네임' 및 임시 프로필 정보만 식별값으로 사용합니다.</p>
              <p><strong>2. 개인정보 수집 및 이용 목적</strong><br />수집된 정보는 교환 등록글 작성자 식별 및 유저 간의 1:1 채팅 메시지 전송 기능 제공을 위해서만 임시 활용됩니다. 목적 달성 또는 유저가 탈퇴/데이터를 삭제할 시 즉시 파기됩니다.</p>
              <p><strong>3. 쿠키 및 외부 서비스 이용</strong><br />본 사이트는 구글 애드센스(Google AdSense) 광고 분석 및 게재를 위해 익명의 맞춤 쿠키 정보를 사용할 수 있습니다. 이용자는 웹 브라우저 설정을 통해 쿠키 수집을 거부할 수 있습니다.</p>
              <p><strong>4. 개인정보의 보유 및 파기</strong><br />원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. Supabase 내 정보는 회원 탈퇴 혹은 로그아웃 시 관련 정보가 정리됩니다.</p>
            </div>
          </div>
        </div>
      )}

      {/* 이용 규칙 모달 */}
      {isRulesOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(5, 3, 10, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10009,
          padding: '20px'
        }}>
          <div style={{
            background: 'rgba(25, 20, 35, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, color: '#f3f4f6', fontSize: '18px', fontWeight: '700' }}>커뮤니티 이용규칙</h3>
              <button 
                onClick={() => setIsRulesOpen(false)}
                style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{
              padding: '24px',
              overflowY: 'auto',
              color: 'rgba(255, 255, 255, 0.75)',
              fontSize: '14px',
              lineHeight: '1.7',
              textAlign: 'left'
            }}>
              <p><strong>1. 건전한 교환 환경 조성</strong><br />타인의 게임 닉네임을 유포하거나 사기를 목적으로 한 기망 행위는 엄격히 금지됩니다. 적발 시 플랫폼 이용이 영구 제한될 수 있습니다.</p>
              <p><strong>2. 상업적 유료 거래 금지</strong><br />본 사이트는 드래곤빌리지 3 '인게임 교환 시스템' 매칭을 목적으로 합니다. 현금 거래 유도나 게임 외 상업성 거래 링크를 등록하는 경우 제재 대상이 됩니다.</p>
              <p><strong>3. 욕설 및 모욕적 언사 금지</strong><br />자유게시판이나 1:1 대화 내에서 상대를 비방, 모욕하거나 불쾌감을 주는 비속어 사용 시 대화 채널 및 게시물 작성 차단 조치가 이루어집니다.</p>
              <p><strong>4. 깨끗한 서비스 관리</strong><br />광고 수익화를 원활히 하기 위해 유해 콘텐츠, 도배성 게시물 등은 관리자에 의해 예고 없이 삭제 또는 제재될 수 있으니 서로 양보하고 존중하는 커뮤니티 문화를 만들어주세요.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
