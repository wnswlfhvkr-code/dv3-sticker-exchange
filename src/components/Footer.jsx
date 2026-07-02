import React from 'react';
import { ShieldCheck, Scale, Mail, Info, BookOpen, HelpCircle, Book } from 'lucide-react';

export function Footer() {
  return (
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
            <a 
              href="/privacy.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textDecoration: 'none',
                color: 'rgba(255, 255, 255, 0.55)',
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
            </a>

            <a 
              href="/terms.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textDecoration: 'none',
                color: 'rgba(255, 255, 255, 0.55)',
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
            </a>

            <a 
              href="/about.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textDecoration: 'none',
                color: 'rgba(255, 255, 255, 0.55)',
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
              <Info size={15} />
              사이트 소개
            </a>

            <a 
              href="/tips-gem-reinforcement.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textDecoration: 'none',
                color: 'rgba(255, 255, 255, 0.55)',
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
              <Book size={15} />
              젬 강화 효율표
            </a>

            <a 
              href="/guide.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textDecoration: 'none',
                color: 'rgba(255, 255, 255, 0.55)',
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
              <BookOpen size={15} />
              이용 가이드
            </a>

            <a 
              href="/faq.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textDecoration: 'none',
                color: 'rgba(255, 255, 255, 0.55)',
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
              <HelpCircle size={15} />
              자주 묻는 질문
            </a>

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
  );
}
