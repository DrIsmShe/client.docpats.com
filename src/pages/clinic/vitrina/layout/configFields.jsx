// client/src/pages/clinic/vitrina/layout/configFields.jsx
//
// ВИТРИНА 2.0 (V3.3) — переиспользуемые примитивы форм конфигурации блоков.
// Контролируемые поля + generic ListEditor (add/remove/↑↓) для списочных
// конфигов (items/tiles/advantages). Стили — общий CONFIG_CSS (инжектится один
// раз там, где рендерятся формы).

import React from "react";

export const CONFIG_CSS = `
.vt-cf { display: flex; flex-direction: column; gap: 12px; padding: 12px 0 4px; }
.vt-cf-field { display: flex; flex-direction: column; gap: 4px; }
.vt-cf-label { font-size: 12px; font-weight: 600; color: #57534e; }
.vt-cf-input, .vt-cf-textarea, .vt-cf-select { border: 1px solid #d6d0c6; border-radius: 8px; padding: 8px 10px; font-size: 13px; font-family: inherit; color: #1c1917; background: #fff; width: 100%; }
.vt-cf-textarea { resize: vertical; min-height: 56px; }
.vt-cf-check { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #44403c; cursor: pointer; }
.vt-cf-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

.vt-cf-list { display: flex; flex-direction: column; gap: 10px; }
.vt-cf-item { border: 1px solid #e7e2d8; border-radius: 10px; padding: 10px; background: #faf8f4; display: flex; gap: 8px; align-items: flex-start; }
.vt-cf-item-fields { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.vt-cf-item-actions { display: flex; flex-direction: column; gap: 4px; }
.vt-cf-iconbtn { border: 1px solid #d6d0c6; background: #fff; border-radius: 6px; width: 26px; height: 24px; cursor: pointer; font-size: 12px; line-height: 1; color: #57534e; padding: 0; }
.vt-cf-iconbtn:disabled { opacity: .35; cursor: default; }
.vt-cf-add { align-self: flex-start; border: 1px dashed #b8b2a6; background: #fff; border-radius: 8px; padding: 7px 14px; font-size: 13px; font-weight: 600; color: #57534e; cursor: pointer; }
.vt-cf-add:disabled { opacity: .5; cursor: default; }

.vt-cf-iconpick { display: flex; flex-wrap: wrap; gap: 4px; }
.vt-cf-ic { width: 30px; height: 30px; border: 1px solid #e7e2d8; background: #fff; border-radius: 7px; font-size: 16px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; transition: border-color .12s, background .12s; }
.vt-cf-ic:hover { border-color: #0f766e; }
.vt-cf-ic.vt-cf-ic-on { border-color: #0f766e; background: #e7f3f1; box-shadow: 0 0 0 1px #0f766e inset; }
.vt-cf-ic-clear { font-size: 12px; color: #9b8f80; }
.vt-cf-ic-custom { width: 64px; }

.vt-cf-bgopt { border: 1px solid #e7e2d8; background: #fff; color: #3d3d38; font-family: inherit; font-size: 12px; font-weight: 500; padding: 6px 11px; border-radius: 7px; cursor: pointer; transition: all .12s; }
.vt-cf-bgopt:hover { border-color: #0f766e; }
.vt-cf-bgopt.vt-cf-bgopt-on { background: #0f766e; border-color: #0f766e; color: #fff; }
.vt-cf-bgcustom { display: flex; gap: 8px; align-items: center; margin-top: 8px; }
.vt-cf-bgswatch { display: inline-flex; border: 1px solid #e7e2d8; border-radius: 8px; padding: 2px; background: #fff; transition: border-color .12s, box-shadow .12s; }
.vt-cf-bgswatch-on { border-color: #0f766e; box-shadow: 0 0 0 1px #0f766e; }
.vt-cf-bgswatch input[type=color] { width: 34px; height: 30px; border: none; border-radius: 6px; padding: 0; cursor: pointer; background: none; }
.vt-cf-bgcustom .vt-cf-input { flex: 1; max-width: 130px; }
.vt-cf-bgreset { width: 28px; height: 28px; border: 1px solid #e7e2d8; background: #fff; border-radius: 7px; cursor: pointer; color: #9b8f80; font-size: 12px; }
.vt-cf-bgreset:hover { border-color: #c0392b; color: #c0392b; }

.vt-cf-deptcard { border: 1px solid #e7e2d8; border-radius: 10px; padding: 12px; margin-bottom: 10px; background: #fbfaf7; }
.vt-cf-deptname { font-size: 13px; font-weight: 700; color: #1a1a18; margin-bottom: 8px; }

.vt-cf-pageblock { border: 1px dashed #c9c2b4; border-radius: 10px; padding: 12px; margin-top: 12px; background: #fcfbf8; }
.vt-cf-pagehdr { font-size: 12px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: #0f766e; margin-bottom: 6px; }
.vt-cf-bannerprev { position: relative; margin-bottom: 8px; }
.vt-cf-bannerprev img { width: 100%; max-height: 120px; object-fit: cover; border-radius: 8px; border: 1px solid #e7e2d8; display: block; }
.vt-cf-bannerprev .vt-cf-bgreset { position: absolute; top: 6px; right: 6px; background: rgba(255,255,255,.92); }
.vt-cf-uploadbtn { display: inline-block; font-size: 12px; font-weight: 600; color: #0f766e; border: 1px dashed #0f766e; border-radius: 8px; padding: 8px 14px; cursor: pointer; margin-bottom: 10px; transition: background .12s; }
.vt-cf-uploadbtn:hover { background: #e7f3f1; }
`;

export function LabeledInput({ label, value, onChange, placeholder }) {
  return (
    <label className="vt-cf-field">
      {label && <span className="vt-cf-label">{label}</span>}
      <input
        className="vt-cf-input"
        type="text"
        value={value || ""}
        placeholder={placeholder || ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

// Набор иконок для пикера (медклиника + общие показатели/преимущества).
// Эмодзи — кроссплатформенно, без зависимостей. Можно ввести и свою.
export const ICON_SET = [
  "🏥",
  "🩺",
  "👨‍⚕️",
  "👩‍⚕️",
  "🦷",
  "🫀",
  "🧠",
  "🦴",
  "💊",
  "💉",
  "🩹",
  "🔬",
  "🧬",
  "🩻",
  "🌡️",
  "🚑",
  "👁️",
  "👂",
  "🫁",
  "🦻",
  "🤰",
  "👶",
  "♿",
  "🧑‍🦽",
  "📊",
  "📈",
  "⭐",
  "🏆",
  "✅",
  "❤️",
  "🛏️",
  "🏨",
  "📅",
  "🕐",
  "📞",
  "📍",
  "🌍",
  "🔧",
  "🛡️",
  "💯",
];

/**
 * IconPicker — выбор иконки из готового набора + опция «своя» (эмодзи вручную).
 * Хранит строку-эмодзи. Пусто = нет иконки.
 */
export function IconPicker({ label, value, onChange }) {
  const inSet = !value || ICON_SET.includes(value);
  return (
    <div className="vt-cf-field">
      {label && <span className="vt-cf-label">{label}</span>}
      <div className="vt-cf-iconpick">
        {ICON_SET.map((ic) => (
          <button
            type="button"
            key={ic}
            className={"vt-cf-ic" + (value === ic ? " vt-cf-ic-on" : "")}
            onClick={() => onChange(value === ic ? "" : ic)}
            aria-label={ic}
          >
            {ic}
          </button>
        ))}
        {/* «нет иконки» */}
        <button
          type="button"
          className={"vt-cf-ic vt-cf-ic-clear" + (!value ? " vt-cf-ic-on" : "")}
          onClick={() => onChange("")}
          title="Без иконки"
        >
          ✕
        </button>
        {/* своё эмодзи (если не из набора — показываем введённое) */}
        <input
          className="vt-cf-input vt-cf-ic-custom"
          type="text"
          maxLength={4}
          value={inSet ? "" : value}
          placeholder="своё"
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

// Пресеты фона блока + «свой цвет». Хранит config.bg (+ config.bgColor).
export const BG_PRESETS = [
  { key: "theme", label: "Как тема" },
  { key: "surface", label: "Светлый" },
  { key: "surfaceAlt", label: "Серый" },
  { key: "accent", label: "Акцент" },
  { key: "transparent", label: "Прозрачный" },
];

/**
 * BgPicker — фон блока: быстрые пресеты + палитра (выбор любого цвета).
 * value: { bg, bgColor }; onChange({ bg, bgColor }).
 * Выбор цвета в палитре ставит bg:"custom".
 */
export function BgPicker({ label, bg, bgColor, onChange }) {
  const cur = bg || "theme";
  const isCustom = cur === "custom";
  return (
    <div className="vt-cf-field">
      {label && <span className="vt-cf-label">{label}</span>}
      <div className="vt-cf-iconpick">
        {BG_PRESETS.map((p) => (
          <button
            type="button"
            key={p.key}
            className={"vt-cf-bgopt" + (cur === p.key ? " vt-cf-bgopt-on" : "")}
            onClick={() => onChange({ bg: p.key, bgColor })}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* палитра — выбор любого цвета (всегда доступна) */}
      <div className="vt-cf-bgcustom">
        <span
          className={"vt-cf-bgswatch" + (isCustom ? " vt-cf-bgswatch-on" : "")}
        >
          <input
            type="color"
            value={bgColor || "#ffffff"}
            onChange={(e) =>
              onChange({ bg: "custom", bgColor: e.target.value })
            }
            title="Выбрать цвет из палитры"
          />
        </span>
        <input
          className="vt-cf-input"
          type="text"
          value={isCustom ? bgColor || "" : ""}
          placeholder="#RRGGBB"
          onChange={(e) => onChange({ bg: "custom", bgColor: e.target.value })}
        />
        {isCustom && (
          <button
            type="button"
            className="vt-cf-bgreset"
            onClick={() => onChange({ bg: "theme", bgColor })}
            title="Сбросить к теме"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

export function LabeledTextarea({ label, value, onChange, placeholder, rows }) {
  return (
    <label className="vt-cf-field">
      {label && <span className="vt-cf-label">{label}</span>}
      <textarea
        className="vt-cf-textarea"
        rows={rows || 3}
        value={value || ""}
        placeholder={placeholder || ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function LabeledSelect({ label, value, onChange, options }) {
  return (
    <label className="vt-cf-field">
      {label && <span className="vt-cf-label">{label}</span>}
      <select
        className="vt-cf-select"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      >
        {(options || []).map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function LabeledCheckbox({ label, checked, onChange }) {
  return (
    <label className="vt-cf-check">
      <input
        type="checkbox"
        checked={Boolean(checked)}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

/**
 * Generic-редактор списка элементов конфига.
 * @param items      текущий массив
 * @param onChange   (nextItems) => void
 * @param emptyItem  шаблон нового элемента
 * @param addLabel   подпись кнопки добавления
 * @param renderFields (item, update) => JSX — update(nextItem) обновляет элемент
 * @param max        предел количества
 */
export function ListEditor({
  items = [],
  onChange,
  emptyItem,
  addLabel,
  renderFields,
  max = 20,
}) {
  const update = (i, next) =>
    onChange(items.map((it, idx) => (idx === i ? next : it)));
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const a = items.slice();
    [a[i], a[j]] = [a[j], a[i]];
    onChange(a);
  };
  const add = () => {
    if (items.length >= max) return;
    onChange([...items, JSON.parse(JSON.stringify(emptyItem || {}))]);
  };

  return (
    <div className="vt-cf-list">
      {items.map((it, i) => (
        <div className="vt-cf-item" key={i}>
          <div className="vt-cf-item-fields">
            {renderFields(it, (next) => update(i, next))}
          </div>
          <div className="vt-cf-item-actions">
            <button
              type="button"
              className="vt-cf-iconbtn"
              onClick={() => move(i, -1)}
              disabled={i === 0}
              title="Вверх"
            >
              ↑
            </button>
            <button
              type="button"
              className="vt-cf-iconbtn"
              onClick={() => move(i, 1)}
              disabled={i === items.length - 1}
              title="Вниз"
            >
              ↓
            </button>
            <button
              type="button"
              className="vt-cf-iconbtn"
              onClick={() => remove(i)}
              title="Удалить"
            >
              ×
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="vt-cf-add"
        onClick={add}
        disabled={items.length >= max}
      >
        {addLabel}
      </button>
    </div>
  );
}
