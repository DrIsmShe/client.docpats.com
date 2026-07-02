// client/src/pages/clinic/vitrina/components/Section.jsx
//
// ВИТРИНА 2.0 (V1) — общий шелл секции тела (карточка с заголовком).
// Переиспользуется блоками: doctors, reviews, publications, gallery, contacts,
// whyUs и т.д. — чтобы не дублировать chrome из .pcp-card.
//
// data-block ставится на корень секции (по нему работает якорный скролл nav).
// Внутренняя начинка — children. Всё на токенах темы (--v-card-*, --v-radius…).
//
// Props:
//   id       — тип блока для data-block / якоря (например "doctors")
//   title    — заголовок секции (опционально)
//   action   — узел справа от заголовка (ссылка «все», счётчик и т.п.; опц.)
//   bare     — true: без карточной обёртки (для блоков, рисующих своё нутро)
//   children — содержимое

import React from "react";

const CSS = `
.vt-section { padding: 22px 0 0; }
.vt-section-in { max-width: var(--v-content-max, 1040px); margin: 0 auto; padding: 0 32px; }
.vt-section-card { background: var(--v-card-bg, var(--v-surface)); border: var(--v-card-border, 1px solid var(--v-border)); border-radius: var(--v-radius, 16px); box-shadow: var(--v-card-shadow, none); overflow: hidden; }
.vt-section-head { padding: 18px 26px 14px; border-bottom: 1px solid var(--v-border); background: var(--v-surface-alt); display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.vt-section-title { font-family: var(--v-font-heading); font-size: 18px; font-weight: 600; color: var(--v-text); margin: 0; }
.vt-section-body { padding: 24px 26px; }
.vt-section--bare .vt-section-body { padding: 0; }
.vt-section--custombg .vt-section-head { background: transparent; border-bottom-color: rgba(0,0,0,.08); }
.vt-section--custombg .vt-section-title { color: inherit; }
/* под-карточки внутри блоков (отзывы/faq/whyUs/контакты) наследуют фон */
.vt-section--custombg .vt-review,
.vt-section--custombg .vt-faq-item,
.vt-section--custombg .vt-adv-ico,
.vt-section--custombg .vt-spec,
.vt-section--custombg .vt-contact-card,
.vt-section--custombg .vt-pub-card { background: transparent !important; border-color: rgba(255,255,255,.25); color: inherit; }
@media (max-width: 640px) {
  .vt-section-in { padding: 0 16px; }
  .vt-section-head { padding: 16px 18px 12px; }
  .vt-section-body { padding: 18px; }
}
`;

export default function Section({
  id,
  title,
  action,
  bare = false,
  bg,
  children,
}) {
  const hasBg = bg && bg.style && Object.keys(bg.style).length > 0;
  return (
    <section
      className={"vt-section" + (bare ? " vt-section--bare" : "")}
      data-block={id}
    >
      <style>{CSS}</style>
      <div className="vt-section-in">
        <div
          className={"vt-section-card" + (hasBg ? " vt-section--custombg" : "")}
          style={hasBg ? bg.style : undefined}
        >
          {title && (
            <div className="vt-section-head">
              <h2 className="vt-section-title">{title}</h2>
              {action || null}
            </div>
          )}
          <div className="vt-section-body">{children}</div>
        </div>
      </div>
    </section>
  );
}
