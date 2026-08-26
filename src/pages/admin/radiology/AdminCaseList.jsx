// client/src/pages/admin/radiology/AdminCaseList.jsx
//
// Список кейсов в левой колонке админок «Снимки», «Анализы» и «Виртуальный
// пациент». Один компонент на три страницы: разметка там была скопирована
// слово в слово, и разъезжаться ей незачем.
//
// Кейсы разложены на ДВЕ группы — опубликованные и нет. Плоский список
// смешивал их, и главный вопрос автора («что уже видят врачи, а что ещё
// висит на мне») требовал вычитывать статус в каждой строке. Архив живёт в
// «неопубликованных»: врачам он не показан, а значит по смыслу это та же
// половина, только отработанная — поэтому он уходит в самый низ группы.

import { useMemo, useState } from "react";

export const STATUS_LABELS = {
  draft: "Черновик",
  in_review: "На ревью",
  published: "Опубликован",
  rejected: "Отклонён",
  archived: "В архиве",
};

// Порядок внутри «неопубликованных»: сверху то, что ждёт действия автора,
// архив — в конец. sort в JS стабильна, так что внутри одного статуса
// сохраняется порядок с сервера (свежие первыми).
const UNPUBLISHED_RANK = { in_review: 0, rejected: 1, draft: 2, archived: 9 };
const rank = (c) => UNPUBLISHED_RANK[c.status] ?? 5;

/**
 * @param {object[]} props.cases        список кейсов ({_id, title, status, autoGen})
 * @param {string|null} props.selected  id открытого кейса ("new" — новый)
 * @param {(id:string)=>void} props.onOpen
 * @param {(c:object)=>import("react").ReactNode} [props.renderTags]
 *        доп. плашки в строке (модальность и т. п.) — до статуса
 * @param {string} [props.emptyText]
 */
export default function AdminCaseList({
  cases,
  selected,
  onOpen,
  renderTags,
  emptyText = "Пока нет ни одного кейса.",
}) {
  const [collapsed, setCollapsed] = useState({});

  const { published, unpublished } = useMemo(() => {
    const pub = [];
    const unpub = [];
    for (const c of cases ?? []) (c.status === "published" ? pub : unpub).push(c);
    unpub.sort((a, b) => rank(a) - rank(b));
    return { published: pub, unpublished: unpub };
  }, [cases]);

  const total = (cases ?? []).length;
  const toggle = (key) => setCollapsed((s) => ({ ...s, [key]: !s[key] }));

  return (
    <div className="rad-panel">
      <div className="edu-card-title" style={{ fontSize: 15 }}>Кейсы ({total})</div>
      {total === 0 && <div className="edu-hint">{emptyText}</div>}

      <Group
        title="Неопубликованные"
        hint="Врачам не видны: черновики, отклонённые, на ревью и архив."
        items={unpublished}
        open={!collapsed.unpublished}
        onToggle={() => toggle("unpublished")}
        selected={selected}
        onOpen={onOpen}
        renderTags={renderTags}
      />
      <Group
        title="Опубликованные"
        hint="Уже доступны врачам."
        items={published}
        open={!collapsed.published}
        onToggle={() => toggle("published")}
        selected={selected}
        onOpen={onOpen}
        renderTags={renderTags}
      />
    </div>
  );
}

function Group({ title, hint, items, open, onToggle, selected, onOpen, renderTags }) {
  if (!items.length) return null;
  return (
    <div className="adm-case-group">
      <button
        type="button"
        className="adm-case-group__head"
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className="adm-case-group__chevron">{open ? "▾" : "▸"}</span>
        <span className="adm-case-group__title">{title}</span>
        <span className="adm-case-group__count">{items.length}</span>
      </button>
      {open && (
        <>
          <div className="adm-case-group__hint">{hint}</div>
          <div className="adm-case-group__items">
            {items.map((c) => (
              <button
                key={c._id}
                type="button"
                className="edu-list-item"
                style={{
                  border: "1px solid #eef2f7",
                  borderRadius: 8,
                  textAlign: "left",
                  background: selected === c._id ? "#eef4ff" : "#fff",
                }}
                onClick={() => onOpen(c._id)}
              >
                <div className="edu-list-item-title">{c.title || "Без названия"}</div>
                <div className="edu-list-item-meta">
                  {renderTags?.(c)}
                  {STATUS_LABELS[c.status] ?? c.status}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
