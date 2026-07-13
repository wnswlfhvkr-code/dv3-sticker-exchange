import { ShieldCheck, Scale, Mail, Info, BookOpen, HelpCircle, Book } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export function Footer({ onNavigate }) {
  const { t } = useLanguage();

  return (
    <footer className="content-width" style={{
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
          width: '100%',
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
              {t('privacyPolicy')}
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
              {t('communityRules')}
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
              {t('siteAbout')}
            </a>

            <a 
              href="/tips-gem-reinforcement.html"
              onClick={(e) => {
                e.preventDefault();
                if (onNavigate) onNavigate('gemTable');
              }}
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
              {t('gemTableBtn')}
            </a>

            <a 
              href="/tips-sticker-collection.html"
              onClick={(e) => {
                e.preventDefault();
                if (onNavigate) onNavigate('colGuide');
              }}
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
              {t('userGuide')}
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
              {t('faq')}
            </a>

            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'rgba(255, 255, 255, 0.4)',
            }}>
              <Mail size={15} />
              {t('contactMail')}: helper.dv3sticker@gmail.com
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
            <p>{t('disclaimer1')}</p>
            <p>{t('disclaimer2')}</p>
            <p>{t('copyright')}</p>
          </div>
        </div>
      </footer>
  );
}
