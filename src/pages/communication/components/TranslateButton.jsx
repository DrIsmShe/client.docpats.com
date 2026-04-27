// client/src/communication/components/TranslateButton.jsx
//
// Кнопка перевода сообщения.
// Вставляется в MessageBubble рядом с кнопками действий.
//
// Использование:
//   const { toggleTranslation, isTranslated, loadingIds, errorIds } = useMessageTranslation(targetLang);
//
//   <TranslateButton
//     messageId={msg.id}
//     originalText={msg.text}
//     isTranslated={isTranslated(msg.id)}
//     isLoading={loadingIds.has(msg.id)}
//     error={errorIds.get(msg.id)}
//     onToggle={() => toggleTranslation(msg.id, msg.text)}
//   />

import React from "react";

// Иконка глобуса (inline SVG, без зависимостей)
function GlobeIcon({ size = 13, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="7" cy="7" r="6" stroke={color} strokeWidth="1.3" />
      <ellipse cx="7" cy="7" rx="2.6" ry="6" stroke={color} strokeWidth="1.3" />
      <line x1="1" y1="7" x2="13" y2="7" stroke={color} strokeWidth="1.2" />
      <line
        x1="1.8"
        y1="4.2"
        x2="12.2"
        y2="4.2"
        stroke={color}
        strokeWidth="1"
      />
      <line
        x1="1.8"
        y1="9.8"
        x2="12.2"
        y2="9.8"
        stroke={color}
        strokeWidth="1"
      />
    </svg>
  );
}

// Спиннер
function SpinnerIcon({ size = 13 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      style={{ animation: "chatTranslateSpin 0.8s linear infinite" }}
    >
      <style>{`
        @keyframes chatTranslateSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
      <circle
        cx="7"
        cy="7"
        r="5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="18 10"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function TranslateButton({
  messageId,
  originalText,
  isTranslated = false,
  isLoading = false,
  error = null,
  onToggle,
  style = {},
}) {
  if (!originalText) return null;

  const label = isLoading ? "..." : isTranslated ? "Оригинал" : "Перевод";
  const hasError = Boolean(error);

  const color = hasError ? "#ef4444" : isTranslated ? "#3d7fff" : "#64748b";

  return (
    <button
      onClick={onToggle}
      disabled={isLoading}
      title={
        isLoading
          ? "Переводим..."
          : hasError
            ? `Ошибка: ${error}`
            : isTranslated
              ? "Показать оригинал"
              : "Перевести сообщение"
      }
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        background: "none",
        border: "none",
        cursor: isLoading ? "wait" : "pointer",
        padding: "2px 5px",
        borderRadius: "4px",
        fontSize: "11px",
        fontFamily: "inherit",
        color,
        opacity: isLoading ? 0.7 : 1,
        transition: "color 0.15s, opacity 0.15s",
        userSelect: "none",
        ...style,
      }}
    >
      {isLoading ? <SpinnerIcon /> : <GlobeIcon color={color} />}
      {label}
    </button>
  );
}
