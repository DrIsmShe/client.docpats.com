// client/src/pages/clinic/vitrina/blocks/VideosBlock.jsx
//
// Блок витрины: ролики клиники.
//
// ПУСТОЙ БЛОК НЕ РИСУЕТСЯ. Клиника, которая ещё ничего не сняла, не должна
// показывать посетителю пустую полку — так же ведут себя publications и
// gallery. Поэтому данные грузятся здесь, а не приходят в DTO витрины:
// добавлять в него список, который у большинства клиник пуст, значит
// утяжелять каждый ответ ради меньшинства.
//
// Контракт блока: ({ clinic, config }) — как у соседей по реестру.

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Section from "../components/Section.jsx";
import { blockBgStyle } from "../lib/utils.js";
import { fetchClinicVideos } from "../../../../api/video";

const R2 = process.env.REACT_APP_R2_PUBLIC_URL || "";

const CSS = `
.vt-vids { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
.vt-vid { display: block; text-decoration: none; color: inherit; border: 1px solid var(--v-border); border-radius: 12px; overflow: hidden; background: var(--v-surface); transition: box-shadow .2s, transform .2s, border-color .2s; }
.vt-vid:hover { box-shadow: 0 8px 24px rgba(0,0,0,.1); border-color: var(--v-primary); transform: translateY(-3px); }
.vt-vid-thumb { position: relative; aspect-ratio: 16 / 9; background: var(--v-surface-alt); }
.vt-vid-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.vt-vid-dur { position: absolute; right: 8px; bottom: 8px; background: rgba(0,0,0,.75); color: #fff; font-size: 12px; padding: 2px 6px; border-radius: 4px; }
.vt-vid-body { padding: 12px 14px; }
.vt-vid-title { font-family: var(--v-font-heading); font-size: 15px; font-weight: 600; line-height: 1.35; color: var(--v-text); }
.vt-vid-desc { font-size: 13px; color: var(--v-text-muted); margin-top: 4px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
`;

function длительностью(сек) {
  const s = Math.max(0, Math.round(сек || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function VideosBlock({ clinic, config = {} }) {
  const { t } = useTranslation("clinicReviews");
  const [ролики, setРолики] = useState([]);

  const clinicId = clinic?.id || clinic?._id || null;

  useEffect(() => {
    let живо = true;
    if (!clinicId) return undefined;
    fetchClinicVideos(clinicId)
      .then((р) => живо && setРолики(р))
      // Молча: блок витрины не должен рушить страницу клиники.
      .catch(() => живо && setРолики([]));
    return () => {
      живо = false;
    };
  }, [clinicId]);

  if (!ролики.length) return null;

  return (
    <Section style={blockBgStyle(config)}>
      <style>{CSS}</style>
      <h2 className="vt-section-title">
        {t("videosTitle", { defaultValue: "Видео клиники" })}
      </h2>
      <div className="vt-vids">
        {ролики.map((р) => (
          <Link key={р._id} to={`/videos/${р._id}`} className="vt-vid">
            <div className="vt-vid-thumb">
              {р.media?.posterKey && R2 && (
                <img src={`${R2}/${р.media.posterKey}`} alt="" loading="lazy" />
              )}
              {р.media?.durationSec > 0 && (
                <span className="vt-vid-dur">{длительностью(р.media.durationSec)}</span>
              )}
            </div>
            <div className="vt-vid-body">
              <div className="vt-vid-title">{р.title}</div>
              {р.description && <div className="vt-vid-desc">{р.description}</div>}
            </div>
          </Link>
        ))}
      </div>
    </Section>
  );
}
