// client/src/pages/clinic/vitrina/blocks/GalleryBlock.jsx
//
// ВИТРИНА 2.0 (V1) — блок gallery (этап B).
// Сетка фото клиники с подписью-оверлеем. Порт .pcp-gallery на токены.
//
// Данные из DTO: clinic.gallery [{id, url, caption}]. url резолвится в CDN.
// Элементы без валидного url отфильтровываются; пустой список → блок не рендерится.
//
// Контракт: ({ clinic, config }).

import React from "react";
import { useTranslation } from "react-i18next";
import Section from "../components/Section.jsx";
import { blockBgStyle } from "../lib/utils.js";
import { resolveUrl } from "../lib/utils.js";

const CSS = `
.vt-gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
.vt-gal-item { position: relative; border-radius: 12px; overflow: hidden; aspect-ratio: 4 / 3; background: var(--v-surface-alt); border: 1px solid var(--v-border); }
.vt-gal-item img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .3s ease; }
.vt-gal-item:hover img { transform: scale(1.06); }
.vt-gal-cap { position: absolute; left: 0; right: 0; bottom: 0; padding: 8px 10px; font-size: 11px; color: #fff; background: linear-gradient(0deg, rgba(0,0,0,.6), transparent); }
`;

export default function GalleryBlock({ clinic, config = {} }) {
  const { t } = useTranslation();

  const gallery = Array.isArray(clinic?.gallery) ? clinic.gallery : [];
  const items = gallery
    .map((g) => ({ ...g, src: resolveUrl(g?.url) }))
    .filter((g) => g.src);
  if (items.length === 0) return null;

  const name = clinic?.name || "";

  return (
    <Section
      bg={blockBgStyle(config)}
      id="gallery"
      title={t("publicClinic.galleryTitle", { defaultValue: "Галерея" })}
    >
      <style>{CSS}</style>
      <div className="vt-gallery">
        {items.map((g) => (
          <div className="vt-gal-item" key={g.id || g.src}>
            <img src={g.src} alt={g.caption || name} />
            {g.caption && <div className="vt-gal-cap">{g.caption}</div>}
          </div>
        ))}
      </div>
    </Section>
  );
}
