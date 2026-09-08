// client/src/pages/videra/PatientVideoTasksPage.jsx
//
// «Перед процедурой» — то, что клиника попросила пациента посмотреть:
// согласия, которые надо подписать, и планы подготовки по дням.
//
// ПОЧЕМУ ОДНА СТРАНИЦА НА ДВА РАЗНЫХ СПИСКА. Для пациента это одно дело:
// «что мне нужно сделать перед процедурой». Разводить согласия и подготовку
// по разным разделам значит требовать от человека знать разницу между ними —
// а она внутренняя, наша, а не его.
//
// КНОПКА ПОДПИСИ ПОЯВЛЯЕТСЯ ТОЛЬКО ПОСЛЕ ДОСМОТРА. Прятать её — не защита:
// настоящий запрет живёт на сервере и не обходится ничем. Здесь она скрыта
// затем, чтобы человек не жал на то, что всё равно откажет.

import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import VideoPlayer from "../../components/video/VideoPlayer";
import {
  fetchMyConsents,
  fetchMyAssignments,
  signConsent as signConsentApi,
} from "../../api/video";

/** Дата в виде «12 сентября». Год не показываем — сроки всегда близкие. */
function датой(d, lang) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString(lang || "ru", {
      day: "numeric",
      month: "long",
    });
  } catch {
    return "";
  }
}

/** Сколько дней осталось. Отрицательное — просрочено. */
function днейДо(d) {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

export default function PatientVideoTasksPage() {
  const { t, i18n } = useTranslation();
  const [согласия, setСогласия] = useState(null);
  const [планы, setПланы] = useState(null);
  const [беда, setБеда] = useState("");
  const [открыт, setОткрыт] = useState(null); // ключ раскрытого плеера
  const [занят, setЗанят] = useState(null);

  const загрузить = useCallback(async () => {
    setБеда("");
    try {
      const [с, п] = await Promise.all([fetchMyConsents(), fetchMyAssignments()]);
      setСогласия(с);
      setПланы(п);
    } catch {
      setБеда(
        t("videra.tasks.loadFailed", {
          defaultValue: "Не удалось загрузить задания",
        }),
      );
      setСогласия([]);
      setПланы([]);
    }
  }, [t]);

  useEffect(() => {
    загрузить();
  }, [загрузить]);

  const подписать = async (consent) => {
    setЗанят(consent._id);
    setБеда("");
    try {
      await signConsentApi(consent._id);
      await загрузить();
    } catch (e) {
      // Сервер отвечает по делу («сначала посмотрите ролик до конца»),
      // и его слова человеку понятнее любого общего текста.
      setБеда(
        e?.response?.data?.message ||
          t("videra.tasks.signFailed", { defaultValue: "Не удалось подписать" }),
      );
    } finally {
      setЗанят(null);
    }
  };

  if (согласия === null || планы === null) {
    return (
      <div style={стиль.пусто}>
        {t("videra.tasks.loading", { defaultValue: "Загружаем…" })}
      </div>
    );
  }

  const ждут = согласия.filter((с) => ["pending", "watched"].includes(с.status));
  const готовые = согласия.filter((с) => с.status === "signed");
  const активныеПланы = планы.filter((п) => !п.cancelledAt);
  const пусто = !ждут.length && !активныеПланы.length && !готовые.length;

  return (
    <div style={стиль.страница}>
      <h1 style={стиль.заголовок}>
        {t("videra.tasks.title", { defaultValue: "Перед процедурой" })}
      </h1>
      <p style={стиль.подзаголовок}>
        {t("videra.tasks.subtitle", {
          defaultValue:
            "Короткие ролики о том, что вам предстоит, и согласия, которые нужно подтвердить.",
        })}
      </p>

      {беда && (
        <div role="alert" style={стиль.ошибка}>
          {беда}
        </div>
      )}

      {пусто && (
        <div style={стиль.пусто}>
          {t("videra.tasks.empty", {
            defaultValue: "Сейчас ничего смотреть и подписывать не нужно.",
          })}
        </div>
      )}

      {/* ── Согласия ────────────────────────────────────────────── */}
      {ждут.length > 0 && (
        <section style={стиль.раздел}>
          <h2 style={стиль.разделЗаголовок}>
            {t("videra.tasks.consentsTitle", { defaultValue: "Нужно подтвердить" })}
          </h2>
          {ждут.map((с) => {
            const досмотрел = Boolean(с.watch?.completedAt);
            const ключ = `c-${с._id}`;
            const осталось = днейДо(с.expiresAt);
            return (
              <div key={с._id} style={стиль.карточка}>
                <div style={стиль.строка}>
                  <div style={стиль.описание}>
                    <div style={стиль.название}>{с.procedureName}</div>
                    <div style={стиль.мета}>
                      <span>{с.video?.title}</span>
                      {с.video?.durationSec > 0 && (
                        <>
                          <span>·</span>
                          <span>
                            {t("videra.tasks.seconds", {
                              count: Math.round(с.video.durationSec),
                              defaultValue: "{{count}} с",
                            })}
                          </span>
                        </>
                      )}
                      {осталось !== null && осталось >= 0 && (
                        <>
                          <span>·</span>
                          <span>
                            {t("videra.tasks.daysLeft", {
                              count: осталось,
                              defaultValue: "осталось {{count}} дн.",
                            })}
                          </span>
                        </>
                      )}
                    </div>
                    <div style={досмотрел ? стиль.готово : стиль.вожидании}>
                      {досмотрел
                        ? t("videra.tasks.watched", {
                            defaultValue: "Ролик просмотрен — можно подтверждать",
                          })
                        : t("videra.tasks.notWatched", {
                            defaultValue: "Посмотрите ролик до конца",
                          })}
                    </div>
                  </div>

                  <div style={стиль.кнопки}>
                    <button
                      type="button"
                      onClick={() => setОткрыт(открыт === ключ ? null : ключ)}
                      style={стиль.кнопка}
                    >
                      {открыт === ключ
                        ? t("videra.tasks.collapse", { defaultValue: "Свернуть" })
                        : t("videra.tasks.watch", { defaultValue: "Смотреть" })}
                    </button>
                    {досмотрел && (
                      <button
                        type="button"
                        disabled={занят === с._id}
                        onClick={() => подписать(с)}
                        style={{ ...стиль.кнопка, ...стиль.кнопкаГлавная }}
                      >
                        {t("videra.tasks.sign", { defaultValue: "Подтверждаю" })}
                      </button>
                    )}
                  </div>
                </div>

                {открыт === ключ && (
                  <div style={стиль.плеер}>
                    {/* Досмотр засчитывает сервер по докладу плеера; после
                        него перечитываем список, чтобы кнопка появилась
                        без перезагрузки страницы. */}
                    <VideoPlayer
                      videoId={с.video.videoId}
                      autoPlay
                      onCompleted={загрузить}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* ── Планы подготовки ────────────────────────────────────── */}
      {активныеПланы.length > 0 && (
        <section style={стиль.раздел}>
          <h2 style={стиль.разделЗаголовок}>
            {t("videra.tasks.prepTitle", { defaultValue: "Подготовка" })}
          </h2>
          {активныеПланы.map((п) => (
            <div key={п._id} style={стиль.карточка}>
              <div style={стиль.название}>{п.title}</div>
              <div style={стиль.мета}>
                <span>
                  {t("videra.tasks.procedureOn", {
                    date: датой(п.procedureAt, i18n.language),
                    defaultValue: "Процедура {{date}}",
                  })}
                </span>
                <span>·</span>
                <span>
                  {t("videra.tasks.progress", {
                    done: п.progress?.done ?? 0,
                    total: п.progress?.total ?? 0,
                    defaultValue: "просмотрено {{done}} из {{total}}",
                  })}
                </span>
              </div>

              <div style={стиль.шаги}>
                {(п.steps || []).map((ш, i) => {
                  const ключ = `p-${п._id}-${i}`;
                  const сделан = Boolean(ш.completedAt);
                  return (
                    <div key={ключ} style={стиль.шаг}>
                      <div style={стиль.шагСтрока}>
                        <span style={сделан ? стиль.галка : стиль.точка}>
                          {сделан ? "✓" : "•"}
                        </span>
                        <div style={стиль.шагТекст}>
                          <div style={сделан ? стиль.шагСделан : undefined}>
                            {ш.title}
                            {!ш.required && (
                              <span style={стиль.необязательный}>
                                {" "}
                                {t("videra.tasks.optional", {
                                  defaultValue: "(по желанию)",
                                })}
                              </span>
                            )}
                          </div>
                          <div style={стиль.шагСрок}>
                            {t("videra.tasks.dueOn", {
                              date: датой(ш.dueAt, i18n.language),
                              defaultValue: "до {{date}}",
                            })}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setОткрыт(открыт === ключ ? null : ключ)}
                          style={стиль.кнопкаМалая}
                        >
                          {открыт === ключ
                            ? t("videra.tasks.collapse", { defaultValue: "Свернуть" })
                            : t("videra.tasks.watch", { defaultValue: "Смотреть" })}
                        </button>
                      </div>
                      {открыт === ключ && (
                        <div style={стиль.плеер}>
                          <VideoPlayer
                            videoId={ш.videoId}
                            autoPlay
                            onCompleted={загрузить}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ── Уже подтверждённое ──────────────────────────────────── */}
      {готовые.length > 0 && (
        <section style={стиль.раздел}>
          <h2 style={стиль.разделЗаголовок}>
            {t("videra.tasks.signedTitle", { defaultValue: "Подтверждено" })}
          </h2>
          {готовые.map((с) => (
            <div key={с._id} style={{ ...стиль.карточка, ...стиль.карточкаТихая }}>
              <div style={стиль.название}>{с.procedureName}</div>
              <div style={стиль.мета}>
                <span>
                  {t("videra.tasks.signedOn", {
                    date: датой(с.signedAt, i18n.language),
                    defaultValue: "подтверждено {{date}}",
                  })}
                </span>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

const стиль = {
  страница: { maxWidth: 860, margin: "0 auto", padding: "24px 16px 64px" },
  заголовок: { fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: "-.02em" },
  подзаголовок: { margin: "6px 0 24px", color: "#6b7b78", fontSize: 14 },
  раздел: { marginBottom: 28 },
  разделЗаголовок: {
    fontSize: 13,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: ".1em",
    color: "#6b7b78",
    margin: "0 0 12px",
  },
  карточка: {
    border: "1px solid #d6dddb",
    borderRadius: 12,
    padding: 16,
    background: "#fff",
    marginBottom: 12,
  },
  карточкаТихая: { background: "transparent", opacity: 0.8 },
  строка: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "flex-start",
  },
  описание: { flex: 1, minWidth: 0 },
  название: { fontWeight: 700, fontSize: 16 },
  мета: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 4,
    fontSize: 13,
    color: "#6b7b78",
  },
  готово: { marginTop: 8, fontSize: 13, color: "#0e8478", fontWeight: 600 },
  вожидании: { marginTop: 8, fontSize: 13, color: "#c4570d" },
  кнопки: { display: "flex", gap: 8, flexWrap: "wrap" },
  кнопка: {
    border: "1px solid #d6dddb",
    background: "transparent",
    borderRadius: 8,
    padding: "6px 14px",
    fontSize: 13,
    cursor: "pointer",
    color: "inherit",
  },
  кнопкаГлавная: {
    background: "#0e8478",
    borderColor: "#0e8478",
    color: "#fff",
    fontWeight: 700,
  },
  кнопкаМалая: {
    border: "1px solid #d6dddb",
    background: "transparent",
    borderRadius: 8,
    padding: "4px 10px",
    fontSize: 12,
    cursor: "pointer",
    color: "inherit",
    flexShrink: 0,
  },
  шаги: { marginTop: 12, display: "flex", flexDirection: "column", gap: 10 },
  шаг: { borderTop: "1px solid #e4e9e8", paddingTop: 10 },
  шагСтрока: { display: "flex", alignItems: "flex-start", gap: 10 },
  шагТекст: { flex: 1, minWidth: 0, fontSize: 14 },
  шагСделан: { textDecoration: "line-through", color: "#6b7b78" },
  шагСрок: { fontSize: 12, color: "#6b7b78", marginTop: 2 },
  необязательный: { color: "#6b7b78", fontSize: 12 },
  галка: { color: "#0e8478", fontWeight: 700 },
  точка: { color: "#6b7b78" },
  плеер: { marginTop: 12 },
  пусто: { padding: 40, textAlign: "center", color: "#6b7b78" },
  ошибка: {
    padding: 12,
    borderRadius: 10,
    background: "rgba(163,44,34,.08)",
    color: "#a32c22",
    marginBottom: 16,
    fontSize: 14,
  },
};
