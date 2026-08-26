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
// Почему пилюля больше НЕ перетаскивается.
// Раньше её можно было утащить за «ручку» куда угодно, и положение
// сохранялось. На практике это давало ровно обратный эффект: безымянная
// плашка «A 115% A» оказывалась посреди экрана, читатель не понимал, что
// это такое и откуда взялось, а на другом устройстве она оказывалась в
// третьем месте. Теперь угол один и тот же везде, а над кнопками стоит
// подпись — назначение видно без наведения и без перевода на язык жестов.
// Одна и та же разметка на десктопе и на телефоне: меняются только отступы.

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const STORAGE_KEY = "dp-font-scale";
// Ключ старого сохранённого положения пилюли. Перетаскивания больше нет —
// подчищаем за прежней версией, чтобы мусор не лежал в хранилище вечно.
const LEGACY_POS_KEY = "dp-font-pos";

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
       занят сайдбаром и кнопкой помощника «?». Справа постоянных
       фиксированных элементов нет — тосты приподняты над пилюлей
       (см. отступ у ToastContainer в App.jsx). */
    right: 16px;
    bottom: 16px;
    z-index: 99998;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 2px;
    padding: 6px 8px 5px;
    border: 1px solid #c8d6ee;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 0 2px 6px rgba(10, 22, 40, 0.1),
      0 8px 24px rgba(10, 22, 40, 0.08);
    backdrop-filter: blur(6px);
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  }

  /* Подпись — то, ради чего плашка перестала быть загадкой. Читается и
     без неё (две «A» разного кегля), но подпись снимает вопрос сразу. */
  .dp-fs-caption {
    padding: 0 2px;
    color: #7c8aa3;
    font-size: 9.5px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    text-align: center;
    white-space: nowrap;
    user-select: none;
  }

  .dp-fs-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
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

  /* Телефон: та же плашка целиком — и подпись, и проценты. Отличаются
     только отступы от кромки, иначе пилюля липнет к краю экрана. */
  @media (max-width: 520px) {
    .dp-fs { right: 10px; bottom: 10px; padding: 5px 6px 4px; }
    .dp-fs-btn { width: 34px; height: 34px; }
    .dp-fs-value { min-width: 40px; }
  }

  /* Арабский: сайдбар переезжает направо, и пилюля оказывается ровно
     под пунктом «Выход» — тем самым, ради которого её сюда и поставили
     (см. комментарий выше). Переносим на противоположную сторону, то есть
     сохраняем исходный замысел «подальше от сайдбара», а не ломаем его. */
  [dir="rtl"] .dp-fs { right: auto; left: 16px; }
  @media (max-width: 520px) {
    [dir="rtl"] .dp-fs { right: auto; left: 10px; }
  }

  /* В печать регулятор не нужен. */
  @media print {
    .dp-fs { display: none; }
  }
`;

export default function FontSizeControl() {
  const { t } = useTranslation();
  const [index, setIndex] = useState(readSavedIndex);

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

  // Разовая уборка: у тех, кто успел перетащить пилюлю в старой версии,
  // в хранилище осталась её координата. Больше она ни на что не влияет.
  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_POS_KEY);
    } catch {
      // Приватный режим — там и записывать было некуда.
    }
  }, []);

  const scale = STEPS[index];
  const percent = Math.round(scale * 100);
  const atMin = index === 0;
  const atMax = index === STEPS.length - 1;
  const isDefault = index === DEFAULT_INDEX;

  const label = t("fontSize.label", { defaultValue: "Размер текста" });

  return (
    <>
      <style>{STYLES}</style>
      <div className="dp-fs" role="group" aria-label={label}>
        <div className="dp-fs-caption" aria-hidden="true">
          {label}
        </div>

        <div className="dp-fs-row">
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
      </div>
    </>
  );
}
