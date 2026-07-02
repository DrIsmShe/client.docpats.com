// client/src/vitrina/blocks/blockRegistry.js
//
// ВИТРИНА 2.0 (V1) — реестр блоков.
//
// Сопоставляет type (из layout.blocks DTO) → React-компонент.
// КОНТРАКТ компонента-блока: ({ clinic, config }) => JSX.
//   - clinic  — весь публичный DTO клиники (имя, врачи, отзывы, тема, …)
//   - config  — per-block конфиг из layout.blocks[i].config (заголовки/флаги/ссылки)
//
// Пока реальных блоков нет — все типы указывают на плейсхолдер, который рисует
// карточку с именем блока, используя токены темы (--v-*). Это даёт рендеримый
// end-to-end скелет: видно порядок блоков и что тема применилась.
//
// По мере готовности заменяем построчно:
//   import HeroBlock from "./HeroBlock.jsx";
//   ...
//   hero: HeroBlock,

import React from "react";
import TopbarBlock from "./TopbarBlock.jsx";
import NavBlock from "./NavBlock.jsx";
import HeroBlock from "./HeroBlock.jsx";
import DoctorsBlock from "./DoctorsBlock.jsx";
import ReviewsBlock from "./ReviewsBlock.jsx";
import PublicationsBlock from "./PublicationsBlock.jsx";
import GalleryBlock from "./GalleryBlock.jsx";
import FooterBlock from "./FooterBlock.jsx";
import CtaBlock from "./CtaBlock.jsx";
import StatsBlock from "./StatsBlock.jsx";
import WhyUsBlock from "./WhyUsBlock.jsx";
import BentoBlock from "./BentoBlock.jsx";
import FaqBlock from "./FaqBlock.jsx";
import ContactsBlock from "./ContactsBlock.jsx";
import PriceListBlock from "./PriceListBlock.jsx";
import CategoryArticlesBlock from "./CategoryArticlesBlock.jsx";
import CategoryGalleryBlock from "./CategoryGalleryBlock.jsx";
import ParentCategoryArticlesBlock from "./ParentCategoryArticlesBlock.jsx";

/**
 * Фабрика плейсхолдера: замыкает type, чтобы сохранить контракт ({clinic, config}).
 * Реальные компоненты type знать не обязаны — он зашит в реестре.
 */
export function makePlaceholderBlock(type) {
  function PlaceholderBlock({ config }) {
    const hasConfig = config && Object.keys(config).length > 0;
    return (
      <section
        data-block={type}
        style={{
          padding: "20px 24px",
          margin: "10px 0",
          background: "var(--v-card-bg, var(--v-surface))",
          border: "var(--v-card-border, 1px solid var(--v-border))",
          borderRadius: "var(--v-radius, 12px)",
          boxShadow: "var(--v-card-shadow, none)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "var(--v-primary)",
              flexShrink: 0,
            }}
          />
          <strong
            style={{
              fontFamily: "var(--v-font-heading)",
              color: "var(--v-text)",
              fontSize: 15,
            }}
          >
            {type}
          </strong>
          <span style={{ color: "var(--v-text-muted)", fontSize: 12 }}>
            (placeholder)
          </span>
        </div>
        {hasConfig && (
          <pre
            style={{
              margin: "10px 0 0",
              fontSize: 11,
              color: "var(--v-text-muted)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {JSON.stringify(config, null, 2)}
          </pre>
        )}
      </section>
    );
  }
  PlaceholderBlock.displayName = `Placeholder(${type})`;
  return PlaceholderBlock;
}

// type → компонент. Все типы из defaultLayoutBlocks() покрыты.
export const BLOCK_REGISTRY = {
  topbar: TopbarBlock, // ← реальный (V1)
  nav: NavBlock, // ← реальный (V1)
  hero: HeroBlock, // ← реальный (V1)
  stats: StatsBlock, // ← реальный (V1)
  whyUs: WhyUsBlock, // ← реальный (V1)
  doctors: DoctorsBlock, // ← реальный (V1)
  bento: BentoBlock, // ← реальный (V1)
  reviews: ReviewsBlock, // ← реальный (V1)
  publications: PublicationsBlock, // ← реальный (V1)
  gallery: GalleryBlock, // ← реальный (V1)
  faq: FaqBlock, // ← реальный (V1)
  contacts: ContactsBlock, // ← реальный (V1)
  priceList: PriceListBlock, // ← V4.2 (полный прайс)
  cta: CtaBlock, // ← реальный (V1)
  footer: FooterBlock, // ← реальный (V1)
  categoryArticles: CategoryArticlesBlock, // ← Часть 3 (статьи категории)
  categoryGallery: CategoryGalleryBlock, // ← Часть 4 (галерея категории)
  parentCategoryArticles: ParentCategoryArticlesBlock, // ← Часть 6 (агрегат родителя)
};

/**
 * Вернуть компонент по типу блока, либо null (неизвестный тип — рендерер пропустит).
 * @param {string} type
 * @returns {React.ComponentType|null}
 */
export function getBlockComponent(type) {
  return BLOCK_REGISTRY[type] || null;
}
