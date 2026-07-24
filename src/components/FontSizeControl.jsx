// client/src/components/FontSizeControl.jsx
//
// Регулятор размера текста для читателя: A− / A+ и сброс по клику на
// проценты. Живёт на всех страницах, выбор запоминается между визитами.
//
// Почему zoom, а не font-size на :root.
// Классический приём «html { font-size: 100% } + вёрстка в rem» здесь не
// работает: проект свёрстан в px от корки до корки, и увеличение корневого
// кегля не изменит ни одного размера. Переводить ~560 страниц на rem ради
// одной кнопки — не вариант. zoom на documentElement масштабирует всё, что
// уже свёрстано, включая px, и ведёт себя как браузерное увеличение:
// раскладка перетекает, фиксированные элементы по-прежнему считаются от
// вьюпорта (проверено на витрине /education с фиксированным фоном),
// горизонтальная прокрутка не появляется. Поддерживают все актуальные
// браузеры (Firefox — с 126-й).
//
// Значение восстанавливается ДО первой отрисовки — инлайновым скриптом в
// public/index.html. Без него страница успевала мигнуть обычным кеглем.
// Ключ хранилища и границы диапазона обязаны совпадать с тем скриптом.
//
// Пилюлю можно перетаскивать за «ручку» слева куда угодно — положение
// запоминается между визитами (POS_KEY). Двойной клик по ручке возвращает
// её в угол по умолчанию. Кнопки A−/A+ тянут только через ручку, поэтому
// нажатия не превращаются в случайное перетаскивание.

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const STORAGE_KEY = "dp-font-scale";
const POS_KEY = "dp-font-pos";

// Отступ от краёв окна при перетаскивании — чтобы пилюлю нельзя было
// загнать вплотную к кромке или за неё.
const EDGE = 8;

// Шаги подобраны так, чтобы каждый следующий был заметен, но раскладка не
// ломалась: 150% — предел, после которого таблицы и шапки начинают
// переносить содержимое некрасиво.
const STEPS = [0.9, 1, 1.15, 1.3, 1.5];
const DEFAULT_INDEX = 1;

function readSavedIndex() {
  try {
    const saved = parseFloat(localStorage.getItem(STORAGE_KEY));
    const found = STEPS.indexOf(saved);
    return found === -1 ? DEFAULT_INDEX : found;
  } catch {
    // Приватный режим или заблокированное хранилище — не повод падать.
    return DEFAULT_INDEX;
  }
}

// Сохранённая позиция пилюли ({x, y} в CSS-пикселях) или null — тогда
// работает угол по умолчанию из CSS (правый нижний).
function readSavedPos() {
  try {
    const raw = localStorage.getItem(POS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (typeof p?.x === "number" && typeof p?.y === "number") return p;
    return null;
  } catch {
    return null;
  }
}

// Держим пилюлю в пределах окна. Ширину/высоту передаём уже в CSS-пикселях
// (getBoundingClientRect делится на текущий zoom вызывающей стороной).
function clampPos(x, y, wCss, hCss) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return {
    x: Math.max(EDGE, Math.min(x, vw - wCss - EDGE)),
    y: Math.max(EDGE, Math.min(y, vh - hCss - EDGE)),
  };
}

// Текущий масштаб страницы (zoom на documentElement). Геометрия под zoom
// приходит домноженной на него, а left/top в px, наоборот, домножаются
// браузером — поэтому клиентские координаты делим на scale, получая CSS.
function currentScale() {
  return parseFloat(document.documentElement.dataset.dpFontScale) || 1;
}

// Единственное место, где меняется масштаб страницы.
function applyScale(scale) {
  const root = document.documentElement;
  // Пустая строка, а не "1": снимаем свойство совсем, чтобы не создавать
  // лишний контекст масштабирования при обычном размере.
  root.style.zoom = scale === 1 ? "" : String(scale);
  root.dataset.dpFontScale = String(scale);
}

const STYLES = `
  .dp-fs {
    position: fixed;
    /* Правый нижний угол: левый низ на всех layout-ах с боковым меню
       занят сайдбаром (пункт «Выход» оказывался под пилюлей). Справа
       постоянных фиксированных элементов нет — чат и звонок временные. */
    right: 16px;
    bottom: 16px;
    z-index: 99998;
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 4px;
    border: 1px solid #c8d6ee;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.94);
    box-shadow: 0 2px 6px rgba(10, 22, 40, 0.1),
      0 8px 24px rgba(10, 22, 40, 0.08);
    backdrop-filter: blur(6px);
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    /* Плавно возвращается в угол по двойному клику, но НЕ во время
       перетаскивания — там позиция должна следовать за пальцем без задержки. */
    transition: left 0.18s ease, top 0.18s ease;
  }
  .dp-fs--dragging {
    transition: none;
    user-select: none;
  }

  /* «Ручка» для перетаскивания. Тянуть можно только за неё — кнопки
     остаются обычными кликабельными кнопками. */
  .dp-fs-grip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 30px;
    border: none;
    border-radius: 7px;
    background: transparent;
    color: #9aa8bf;
    cursor: grab;
    padding: 0;
    /* Чтобы касание тянуло пилюлю, а не прокручивало страницу. */
    touch-action: none;
  }
  .dp-fs-grip:hover { background: #eef2ff; color: #5a6f8f; }
  .dp-fs-grip:active,
  .dp-fs--dragging .dp-fs-grip { cursor: grabbing; }
  .dp-fs-grip:focus-visible {
    outline: 2px solid #1447e6;
    outline-offset: 1px;
  }

  .dp-fs-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border: none;
    border-radius: 7px;
    background: transparent;
    color: #2d3f5c;
    cursor: pointer;
    line-height: 1;
    padding: 0;
    transition: background 0.15s, color 0.15s;
  }
  .dp-fs-btn:hover:not(:disabled) {
    background: #eef2ff;
    color: #1447e6;
  }
  .dp-fs-btn:focus-visible {
    outline: 2px solid #1447e6;
    outline-offset: 1px;
  }
  .dp-fs-btn:disabled {
    opacity: 0.35;
    cursor: default;
  }
  /* Буква A разного кегля — понятно без слов и без перевода. */
  .dp-fs-btn--dec { font-size: 13px; font-weight: 600; }
  .dp-fs-btn--inc { font-size: 18px; font-weight: 700; }

  .dp-fs-value {
    min-width: 44px;
    padding: 0 4px;
    border: none;
    background: transparent;
    color: #5a6f8f;
    font-family: "Geist Mono", "DM Mono", ui-monospace, monospace;
    font-size: 11.5px;
    letter-spacing: 0.02em;
    cursor: pointer;
    text-align: center;
  }
  .dp-fs-value:hover { color: #1447e6; }
  .dp-fs-value:disabled { cursor: default; }
  .dp-fs-value:focus-visible {
    outline: 2px solid #1447e6;
    outline-offset: 1px;
    border-radius: 6px;
  }

  /* На узких экранах проценты убираем — остаются две кнопки. */
  @media (max-width: 520px) {
    .dp-fs { right: 10px; bottom: 10px; }
    .dp-fs-value { display: none; }
  }

  /* В печать регулятор не нужен. */
  @media print {
    .dp-fs { display: none; }
  }
`;

export default function FontSizeControl() {
  const { t } = useTranslation();
  const [index, setIndex] = useState(readSavedIndex);

  // Позиция пилюли и состояние «сейчас тянут». drag хранит захват в ref,
  // чтобы обработчики move/up не пересоздавались на каждый кадр.
  const wrapRef = useRef(null);
  const dragRef = useRef(null);
  const [pos, setPos] = useState(readSavedPos);
  const [dragging, setDragging] = useState(false);

  // Инлайновый скрипт в index.html уже выставил масштаб до отрисовки; здесь
  // синхронизируем состояние React с DOM и сохраняем каждый новый выбор.
  useEffect(() => {
    const scale = STEPS[index];
    applyScale(scale);
    try {
      if (scale === STEPS[DEFAULT_INDEX]) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, String(scale));
    } catch {
      // Не сохранилось — на этой сессии всё равно работает.
    }
  }, [index]);

  // Сохраняем положение (или убираем ключ при возврате в угол).
  useEffect(() => {
    try {
      if (pos) localStorage.setItem(POS_KEY, JSON.stringify(pos));
      else localStorage.removeItem(POS_KEY);
    } catch {
      // Приватный режим — позиция проживёт до конца сессии.
    }
  }, [pos]);

  // При загрузке и при изменении размера окна возвращаем пилюлю в видимую
  // область: сохранённая точка могла оказаться за кромкой меньшего экрана.
  useEffect(() => {
    function clampIntoView() {
      const el = wrapRef.current;
      if (!el) return;
      setPos((p) => {
        if (!p) return p;
        const scale = currentScale();
        const r = el.getBoundingClientRect();
        return clampPos(p.x, p.y, r.width / scale, r.height / scale);
      });
    }
    clampIntoView();
    window.addEventListener("resize", clampIntoView);
    return () => window.removeEventListener("resize", clampIntoView);
  }, []);

  const onGripDown = useCallback((e) => {
    const el = wrapRef.current;
    if (!el) return;
    e.preventDefault();
    const scale = currentScale();
    const rect = el.getBoundingClientRect();
    dragRef.current = {
      // Смещение точки захвата от угла пилюли — в клиентских координатах.
      grabX: e.clientX - rect.left,
      grabY: e.clientY - rect.top,
      w: rect.width,
      h: rect.height,
      scale,
      moved: false,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Старый браузер без pointer capture — перетаскивание всё равно
      // сработает, просто без гарантии не потерять указатель.
    }
    setDragging(true);
  }, []);

  const onGripMove = useCallback((e) => {
    const d = dragRef.current;
    if (!d) return;
    d.moved = true;
    const wCss = d.w / d.scale;
    const hCss = d.h / d.scale;
    // Клиентские координаты → CSS (делим на zoom), затем прижимаем к окну.
    const next = clampPos(
      (e.clientX - d.grabX) / d.scale,
      (e.clientY - d.grabY) / d.scale,
      wCss,
      hCss,
    );
    setPos(next);
  }, []);

  const onGripUp = useCallback((e) => {
    dragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // releasePointerCapture может бросить, если capture не был взят.
    }
    setDragging(false);
  }, []);

  // Двойной клик по ручке — вернуть пилюлю в угол по умолчанию.
  const onGripReset = useCallback(() => setPos(null), []);

  const scale = STEPS[index];
  const percent = Math.round(scale * 100);
  const atMin = index === 0;
  const atMax = index === STEPS.length - 1;
  const isDefault = index === DEFAULT_INDEX;

  return (
    <>
      <style>{STYLES}</style>
      <div
        ref={wrapRef}
        className={`dp-fs${dragging ? " dp-fs--dragging" : ""}`}
        role="group"
        aria-label={t("fontSize.label", { defaultValue: "Размер текста" })}
        style={
          pos
            ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto" }
            : undefined
        }
      >
        {/* Ручка перетаскивания. Тянуть — за неё; двойной клик вернёт в угол. */}
        <button
          type="button"
          className="dp-fs-grip"
          onPointerDown={onGripDown}
          onPointerMove={onGripMove}
          onPointerUp={onGripUp}
          onPointerCancel={onGripUp}
          onDoubleClick={onGripReset}
          title={t("fontSize.drag", {
            defaultValue: "Перетащите за эту точку. Двойной клик — вернуть в угол",
          })}
          aria-label={t("fontSize.drag", {
            defaultValue: "Перетащите за эту точку. Двойной клик — вернуть в угол",
          })}
        >
          <svg width="10" height="16" viewBox="0 0 10 16" aria-hidden="true">
            <g fill="currentColor">
              <circle cx="2.5" cy="3" r="1.3" />
              <circle cx="7.5" cy="3" r="1.3" />
              <circle cx="2.5" cy="8" r="1.3" />
              <circle cx="7.5" cy="8" r="1.3" />
              <circle cx="2.5" cy="13" r="1.3" />
              <circle cx="7.5" cy="13" r="1.3" />
            </g>
          </svg>
        </button>

        <button
          type="button"
          className="dp-fs-btn dp-fs-btn--dec"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={atMin}
          title={t("fontSize.decrease", { defaultValue: "Мельче текст" })}
          aria-label={t("fontSize.decrease", { defaultValue: "Мельче текст" })}
        >
          A
        </button>

        {/* Клик по проценту возвращает обычный размер — короче, чем
            жать A− несколько раз. */}
        <button
          type="button"
          className="dp-fs-value"
          onClick={() => setIndex(DEFAULT_INDEX)}
          disabled={isDefault}
          title={t("fontSize.reset", { defaultValue: "Обычный размер" })}
          aria-label={`${t("fontSize.reset", {
            defaultValue: "Обычный размер",
          })} (${percent}%)`}
        >
          {percent}%
        </button>

        <button
          type="button"
          className="dp-fs-btn dp-fs-btn--inc"
          onClick={() => setIndex((i) => Math.min(STEPS.length - 1, i + 1))}
          disabled={atMax}
          title={t("fontSize.increase", { defaultValue: "Крупнее текст" })}
          aria-label={t("fontSize.increase", { defaultValue: "Крупнее текст" })}
        >
          A
        </button>
      </div>
    </>
  );
}
