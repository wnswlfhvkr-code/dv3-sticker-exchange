import {
  ArrowLeftRight,
  ArrowUpRight,
  BookOpen,
  Calculator,
  Database,
  ShieldCheck
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const CONTENT = {
  ko: {
    eyebrow: '사이트 데이터 · 사용 방법',
    title: '스티커 교환을 위한 검증 가능한 자료',
    description: '현재 서비스의 스티커 목록과 실제 매칭 판정 코드를 기준으로 정리했습니다. 교환 결과를 보장하는 공략이 아니라, 목록을 정확히 기록하고 후보를 판단하는 데 필요한 기준입니다.',
    metrics: [
      ['20', '스티커북 묶음'],
      ['180', '전체 도감 칸'],
      ['156', '교환 목록 선택 가능'],
      ['24', '교환 불가 표시']
    ],
    resources: [
      {
        href: '/about-stickers.html',
        title: '스티커북 데이터 기준표',
        description: '20개 묶음의 이름, 슬롯 구조, 교환 불가 항목 집계 기준을 확인합니다.',
        icon: Database
      },
      {
        href: '/tips-matching-guide.html',
        title: '완전·부분 매칭 판정 원리',
        description: 'Haves와 Wants의 교집합을 비교하는 실제 조건과 예외를 설명합니다.',
        icon: ArrowLeftRight
      },
      {
        href: '/tips-sticker-collection.html',
        title: '교환 목록 관리 절차',
        description: '오래된 매칭을 줄이기 위한 등록, 검토, 교환 후 정리 순서를 안내합니다.',
        icon: BookOpen
      },
      {
        href: '/tips-safe-trading.html',
        title: '안전한 연락과 신고 기준',
        description: '이 사이트가 제공하는 범위와 실제 교환 전 확인할 항목을 구분합니다.',
        icon: ShieldCheck
      },
      {
        href: '/tips-gem-reinforcement.html',
        title: '젬 강화 비용 계산기',
        description: '입력한 등급과 단계에 따라 비용, 판매 차액, 1P당 비용을 계산합니다.',
        icon: Calculator
      }
    ],
    reviewed: '데이터 기준일 2026-07-13',
    openGuide: '앱 가이드 열기'
  },
  en: {
    eyebrow: 'Site data · How it works',
    title: 'Verifiable references for sticker exchange',
    description: 'These references are based on the current sticker catalog and the matching conditions implemented in this service. They explain how to maintain lists and evaluate candidates; they do not guarantee a completed trade.',
    metrics: [
      ['20', 'sticker collections'],
      ['180', 'catalog slots'],
      ['156', 'selectable for exchange'],
      ['24', 'marked non-exchangeable']
    ],
    resources: [
      {
        href: '/about-stickers.html',
        title: 'Sticker catalog data',
        description: 'Review the 20 collection names, slot structure, and non-exchangeable count.',
        icon: Database
      },
      {
        href: '/tips-matching-guide.html',
        title: 'Perfect and partial match logic',
        description: 'See the exact Haves/Wants intersections used by the matching signal.',
        icon: ArrowLeftRight
      },
      {
        href: '/tips-sticker-collection.html',
        title: 'Exchange list workflow',
        description: 'Keep match signals current by reviewing, publishing, and cleaning up lists.',
        icon: BookOpen
      },
      {
        href: '/tips-safe-trading.html',
        title: 'Contact and reporting checklist',
        description: 'Separate what this site can verify from what must be checked in the game.',
        icon: ShieldCheck
      },
      {
        href: '/tips-gem-reinforcement.html',
        title: 'Gem cost calculator',
        description: 'Calculate cost, resale difference, and cost per point by grade and level.',
        icon: Calculator
      }
    ],
    reviewed: 'Data reviewed 2026-07-13',
    openGuide: 'Open in-app guide'
  }
};

export function ContentHub({ onOpenGuide }) {
  const { language } = useLanguage();
  const content = language === 'en' ? CONTENT.en : CONTENT.ko;

  return (
    <section className="content-hub" aria-labelledby="content-hub-title">
      <div className="content-hub-heading">
        <span className="content-hub-eyebrow">{content.eyebrow}</span>
        <h2 id="content-hub-title">{content.title}</h2>
        <p>{content.description}</p>
      </div>

      <dl className="content-metrics" aria-label={content.title}>
        {content.metrics.map(([value, label]) => (
          <div className="content-metric" key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <div className="content-resource-grid">
        {content.resources.map(({ href, title, description, icon: Icon }) => (
          <a className="content-resource-link" href={href} key={href}>
            <span className="content-resource-icon" aria-hidden="true"><Icon size={18} /></span>
            <span className="content-resource-copy">
              <strong>{title}</strong>
              <span>{description}</span>
            </span>
            <ArrowUpRight className="content-resource-arrow" size={17} aria-hidden="true" />
          </a>
        ))}
      </div>

      <div className="content-hub-meta">
        <span>{content.reviewed}</span>
        <button type="button" onClick={onOpenGuide}>{content.openGuide}</button>
      </div>
    </section>
  );
}
