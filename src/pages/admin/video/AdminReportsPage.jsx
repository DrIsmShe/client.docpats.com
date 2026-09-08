// client/src/pages/admin/video/AdminReportsPage.jsx
//
// Очередь жалоб на ролики и комментарии.
//
// ЭТО РАБОЧИЙ СПИСОК, А НЕ ОТЧЁТ. Открывший страницу пришёл разбирать, а не
// изучать статистику, поэтому по умолчанию видны только новые жалобы, а
// закрытые надо запросить отдельно.
//
// РЕШЕНИЕ ОБЯЗАТЕЛЬНО — И ЭТО ПРОВЕРЯЕТ СЕРВЕР. Поле здесь тоже требуется,
// но не ради валидации: через полгода вопрос «почему это оставили» задаст
// не тот, кто закрывал, и ответить сможет только запись.
//
// СНЯТИЕ МАТЕРИАЛА — ОТДЕЛЬНОЕ ДЕЙСТВИЕ. Отсюда ролик не архивируется: для
// этого есть /admin/videos со своим журналом. Одна кнопка, делающая два
// разных дела, рано или поздно сделает не то.

import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { adminFetchReports, adminResolveReport } from "../../../api/video";

const ПРИЧИНЫ = {
  medical: "Медицинская недостоверность",
  privacy: "Данные пациента",
  copyright: "Чужой материал",
  abuse: "Оскорбления",
  spam: "Реклама",
  sexual: "Недопустимый характер",
  other: "Другое",
};

const СОСТОЯНИЯ = {
  new: "Новая",
  reviewing: "В работе",
  resolved: "Подтверждена",
  rejected: "Отклонена",
};

export default function AdminReportsPage() {
  const { t } = useTranslation();
  const [жалобы, setЖалобы] = useState(null);
  const [фильтр, setФильтр] = useState("new");
  const [беда, setБеда] = useState("");
  const [решения, setРешения] = useState({});
  const [идёт, setИдёт] = useState("");

  const загрузить = useCallback(async () => {
    setБеда("");
    try {
      setЖалобы(await adminFetchReports(фильтр ? { status: фильтр } : {}));
    } catch {
      setБеда(
        t("videra.admin.reports.failed", { defaultValue: "Не удалось загрузить жалобы" }),
      );
      setЖалобы([]);
    }
  }, [фильтр, t]);

  useEffect(() => {
    загрузить();
  }, [загрузить]);

  const решить = async (id, status) => {
    const текст = (решения[id] || "").trim();
    if (status !== "reviewing" && !текст) {
      setБеда(
        t("videra.admin.reports.needResolution", {
          defaultValue: "Опишите решение — без него жалобу закрыть нельзя",
        }),
      );
      return;
    }

    setИдёт(id);
    setБеда("");
    try {
      await adminResolveReport(id, { status, resolution: текст });
      setРешения((п) => ({ ...п, [id]: "" }));
      await загрузить();
    } catch (e) {
      setБеда(
        e?.response?.data?.message ||
          t("videra.admin.reports.resolveFailed", { defaultValue: "Не удалось сохранить" }),
      );
    } finally {
      setИдёт("");
    }
  };

  return (
    <div style={стиль.страница}>
      <h2 style={стиль.заголовок}>
        {t("videra.admin.reports.title", { defaultValue: "Жалобы на материалы" })}
      </h2>
      <p style={стиль.подпись}>
        {t("videra.admin.reports.hint", {
          defaultValue:
            "Жалоба не снимает материал сама — она ставит его в очередь. Снять ролик можно на странице каталога.",
        })}
      </p>

      <div style={стиль.фильтры}>
        {["new", "reviewing", "resolved", "rejected", ""].map((с) => (
          <button
            key={с || "all"}
            type="button"
            onClick={() => setФильтр(с)}
            style={{
              ...стиль.чип,
              ...(фильтр === с ? стиль.чипАктивный : null),
            }}
          >
            {с
              ? t(`videra.admin.reports.status.${с}`, { defaultValue: СОСТОЯНИЯ[с] })
              : t("videra.admin.reports.status.all", { defaultValue: "Все" })}
          </button>
        ))}
      </div>

      {беда && (
        <div role="alert" style={стиль.ошибка}>
          {беда}
        </div>
      )}

      {жалобы === null && (
        <div style={стиль.пусто}>
          {t("videra.admin.reports.loading", { defaultValue: "Загружаем…" })}
        </div>
      )}
      {жалобы !== null && жалобы.length === 0 && (
        <div style={стиль.пусто}>
          {t("videra.admin.reports.empty", { defaultValue: "Разбирать нечего." })}
        </div>
      )}

      {(жалобы || []).map((ж) => (
        <div key={ж._id} style={стиль.карточка}>
          <div style={стиль.шапка}>
            <span style={стиль.метка}>
              {t(`videra.report.reason.${ж.reason}`, {
                defaultValue: ПРИЧИНЫ[ж.reason] || ж.reason,
              })}
            </span>
            <span style={стиль.состояние}>
              {t(`videra.admin.reports.status.${ж.status}`, {
                defaultValue: СОСТОЯНИЯ[ж.status],
              })}
            </span>
            <span style={стиль.дата}>
              {new Date(ж.createdAt).toLocaleString()}
            </span>
          </div>

          <div style={стиль.цель}>
            {ж.targetType === "comment"
              ? t("videra.admin.reports.onComment", { defaultValue: "Комментарий" })
              : t("videra.admin.reports.onVideo", { defaultValue: "Ролик" })}
            {ж.video?.title ? ` · ${ж.video.title}` : ""}
            {ж.videoId && (
              <Link to={`/videos/${ж.videoId}`} target="_blank" style={стиль.ссылка}>
                {t("videra.admin.reports.open", { defaultValue: "открыть" })}
              </Link>
            )}
          </div>

          {/* Текст комментария показываем целиком: разбирать жалобу, не
              видя, на что жалуются, невозможно. */}
          {ж.commentText && <div style={стиль.цитата}>{ж.commentText}</div>}
          {ж.note && (
            <div style={стиль.пояснение}>
              {t("videra.admin.reports.note", { defaultValue: "Пояснение" })}: {ж.note}
            </div>
          )}

          {ж.resolution ? (
            <div style={стиль.решение}>
              {t("videra.admin.reports.resolution", { defaultValue: "Решение" })}: {ж.resolution}
            </div>
          ) : (
            <>
              <textarea
                value={решения[ж._id] || ""}
                onChange={(e) =>
                  setРешения((п) => ({ ...п, [ж._id]: e.target.value }))
                }
                rows={2}
                maxLength={2000}
                placeholder={t("videra.admin.reports.resolutionPlaceholder", {
                  defaultValue: "Что решили и почему",
                })}
                style={стиль.поле}
              />
              <div style={стиль.кнопки}>
                {ж.status === "new" && (
                  <button
                    type="button"
                    onClick={() => решить(ж._id, "reviewing")}
                    disabled={идёт === ж._id}
                    style={стиль.обычная}
                  >
                    {t("videra.admin.reports.take", { defaultValue: "Взять в работу" })}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => решить(ж._id, "resolved")}
                  disabled={идёт === ж._id}
                  style={стиль.главная}
                >
                  {t("videra.admin.reports.confirm", { defaultValue: "Нарушение есть" })}
                </button>
                <button
                  type="button"
                  onClick={() => решить(ж._id, "rejected")}
                  disabled={идёт === ж._id}
                  style={стиль.обычная}
                >
                  {t("videra.admin.reports.reject", { defaultValue: "Нарушения нет" })}
                </button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

const стиль = {
  страница: { maxWidth: 900, margin: "0 auto", padding: "24px 20px 64px" },
  заголовок: { fontSize: 22, fontWeight: 700, marginBottom: 6 },
  подпись: { fontSize: 13, color: "#6b7b78", marginBottom: 16, lineHeight: 1.5 },
  фильтры: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 },
  чип: {
    border: "1px solid #e0e0e0",
    background: "#fff",
    borderRadius: 16,
    padding: "6px 14px",
    font: "inherit",
    fontSize: 13,
    cursor: "pointer",
  },
  чипАктивный: { background: "#0f0f0f", color: "#fff", borderColor: "#0f0f0f" },
  карточка: {
    border: "1px solid #e6e6e6",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  шапка: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
  метка: { fontWeight: 700, fontSize: 14 },
  состояние: {
    fontSize: 12,
    background: "#f2f2f2",
    borderRadius: 10,
    padding: "2px 8px",
  },
  дата: { fontSize: 12, color: "#888", marginLeft: "auto" },
  цель: { fontSize: 13, color: "#3f3f3f" },
  ссылка: { marginLeft: 8, fontSize: 12 },
  цитата: {
    background: "#f7f7f7",
    borderLeft: "3px solid #d0d0d0",
    padding: "8px 10px",
    fontSize: 13,
    whiteSpace: "pre-line",
  },
  пояснение: { fontSize: 13, color: "#3f3f3f" },
  решение: { fontSize: 13, color: "#0e8478" },
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
  кнопки: { display: "flex", gap: 8, flexWrap: "wrap" },
  главная: {
    border: "none",
    background: "#0f0f0f",
    color: "#fff",
    borderRadius: 18,
    padding: "8px 16px",
    font: "inherit",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  обычная: {
    border: "none",
    background: "#f2f2f2",
    color: "#0f0f0f",
    borderRadius: 18,
    padding: "8px 16px",
    font: "inherit",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  ошибка: {
    padding: 10,
    borderRadius: 8,
    background: "rgba(163,44,34,.08)",
    color: "#a32c22",
    fontSize: 13,
    marginBottom: 12,
  },
  пусто: { padding: "40px 0", textAlign: "center", color: "#888" },
};
