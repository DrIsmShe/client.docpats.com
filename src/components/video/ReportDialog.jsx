// client/src/components/video/ReportDialog.jsx
//
// Окно жалобы на ролик или комментарий.
//
// ПОЧЕМУ ПРИЧИН РОВНО СЕМЬ. Длинный список заставляет жалующегося угадывать
// формулировку и бросать на полпути, а короткий — не даёт разбирающему
// понять, что перед ним, до чтения. Семь пунктов покрывают всё, ради чего
// на медицинской площадке жалуются, и «Другое» с текстом закрывает остаток.
//
// ЧЕСТНОСТЬ ОБЕЩАНИЙ. Окно не говорит «материал будет удалён»: жалоба
// ставит его в очередь разбора, а решение принимает человек. Обещать
// удаление значило бы обещать за него.

import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const ПРИЧИНЫ = [
  ["medical", "Недостоверные или опасные медицинские сведения"],
  ["privacy", "Раскрыты данные пациента"],
  ["copyright", "Чужой материал без разрешения"],
  ["abuse", "Оскорбления или травля"],
  ["spam", "Реклама или накрутка"],
  ["sexual", "Недопустимый характер материала"],
  ["other", "Другое"],
];

export default function ReportDialog({ target, onClose, onSend }) {
  const { t } = useTranslation();
  const [причина, setПричина] = useState("");
  const [текст, setТекст] = useState("");
  const [идёт, setИдёт] = useState(false);
  const [готово, setГотово] = useState(false);
  const [беда, setБеда] = useState("");

  const отправить = async () => {
    if (!причина || идёт) return;
    setИдёт(true);
    setБеда("");
    try {
      await onSend({ ...target, reason: причина, note: текст.trim() || undefined });
      setГотово(true);
    } catch (e) {
      setБеда(
        e?.response?.data?.message ||
          t("videra.report.failed", { defaultValue: "Не удалось отправить жалобу" }),
      );
    } finally {
      setИдёт(false);
    }
  };

  return (
    <div style={стиль.фон} onClick={onClose} role="presentation">
      <div
        style={стиль.окно}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {готово ? (
          <>
            <div style={стиль.заголовок}>
              {t("videra.report.sentHead", { defaultValue: "Жалоба отправлена" })}
            </div>
            <p style={стиль.текст}>
              {t("videra.report.sentBody", {
                defaultValue:
                  "Материал поставлен в очередь на проверку. Решение принимает человек, поэтому это занимает время.",
              })}
            </p>
            <button type="button" onClick={onClose} style={стиль.главная}>
              {t("videra.report.close", { defaultValue: "Закрыть" })}
            </button>
          </>
        ) : (
          <>
            <div style={стиль.заголовок}>
              {target.targetType === "comment"
                ? t("videra.report.headComment", {
                    defaultValue: "Пожаловаться на комментарий",
                  })
                : t("videra.report.headVideo", {
                    defaultValue: "Пожаловаться на ролик",
                  })}
            </div>

            <div style={стиль.список}>
              {ПРИЧИНЫ.map(([код, по_умолчанию]) => (
                <label key={код} style={стиль.строка}>
                  <input
                    type="radio"
                    name="dp-report-reason"
                    checked={причина === код}
                    onChange={() => setПричина(код)}
                  />
                  <span>
                    {t(`videra.report.reason.${код}`, { defaultValue: по_умолчанию })}
                  </span>
                </label>
              ))}
            </div>

            <textarea
              value={текст}
              onChange={(e) => setТекст(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder={t("videra.report.note", {
                defaultValue: "Что именно не так (необязательно)",
              })}
              style={стиль.поле}
            />

            {беда && (
              <div role="alert" style={стиль.ошибка}>
                {беда}
              </div>
            )}

            <div style={стиль.кнопки}>
              <button type="button" onClick={onClose} style={стиль.обычная}>
                {t("videra.report.cancel", { defaultValue: "Отмена" })}
              </button>
              <button
                type="button"
                onClick={отправить}
                disabled={!причина || идёт}
                style={{ ...стиль.главная, opacity: причина && !идёт ? 1 : 0.5 }}
              >
                {идёт
                  ? t("videra.report.sending", { defaultValue: "Отправляем…" })
                  : t("videra.report.send", { defaultValue: "Отправить" })}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const стиль = {
  фон: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 16,
  },
  окно: {
    background: "#fff",
    borderRadius: 14,
    padding: 20,
    width: "100%",
    maxWidth: 440,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    maxHeight: "90vh",
    overflowY: "auto",
  },
  заголовок: { fontWeight: 700, fontSize: 16 },
  текст: { fontSize: 14, lineHeight: 1.5, color: "#3f3f3f", margin: 0 },
  список: { display: "flex", flexDirection: "column", gap: 8 },
  строка: { display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14, cursor: "pointer" },
  поле: {
    border: "1px solid #d9d9d9",
    borderRadius: 8,
    padding: "8px 10px",
    font: "inherit",
    fontSize: 13,
    width: "100%",
    boxSizing: "border-box",
    resize: "vertical",
  },
  кнопки: { display: "flex", gap: 8, justifyContent: "flex-end" },
  главная: {
    border: "none",
    background: "#0f0f0f",
    color: "#fff",
    borderRadius: 18,
    padding: "9px 18px",
    font: "inherit",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  обычная: {
    border: "none",
    background: "#f2f2f2",
    color: "#0f0f0f",
    borderRadius: 18,
    padding: "9px 18px",
    font: "inherit",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  ошибка: {
    padding: 10,
    borderRadius: 8,
    background: "rgba(163,44,34,.08)",
    color: "#a32c22",
    fontSize: 13,
  },
};
