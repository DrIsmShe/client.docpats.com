// client/src/pages/admin/ops/AdminVerificationPage.jsx
//
// Очередь верификации врачей.
//
// ЧТО ЗДЕСЬ БЫЛО НЕ ТАК. Страница показывала profile.verificationDocuments —
// массив адресов на самом профиле, куда врач не пишет НИЧЕГО: его загрузки
// идут в отдельную коллекцию. У каждого врача стояло «документы не
// приложены» независимо от того, сколько он прислал, и администратор
// нажимал «одобрить», не видя ни одного документа. Теперь очередь отдаёт
// настоящие документы — с видом, сроком, органом выдачи.
//
// ТРИ ВЕЩИ, КОТОРЫХ РАНЬШЕ НЕ БЫЛО.
//
// 1. ВИДНО, ЧЕГО НЕ ХВАТАЕТ. Обязательных четыре: лицензия, диплом,
//    подтверждение специализации, удостоверение личности. Список
//    недостающего показан до нажатия, а не приходит отказом после.
//
// 2. СРОК ПОДТВЕРЖДАЕТ АДМИНИСТРАТОР. Дату врач переписывает со своей
//    бумаги; до сверки это его слово. Здесь её можно поправить и
//    подтвердить, одобряя документ, — и только тогда она уходит в срок
//    допуска.
//
// 3. ИСТЁКШИЕ И ПРИОСТАНОВЛЕННЫЕ ВИДНЫ. Раньше они не показывались
//    нигде: очередь брала только pending. А это тоже работа
//    администратора, просто другая — продлить или восстановить.

import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL;

const ВИДЫ = {
  license: "Лицензия",
  diploma: "Диплом",
  specialization: "Специализация",
  certificate: "Сертификат",
  passport: "Паспорт",
  id_card: "Удостоверение",
  other: "Прочее",
};

const СОСТОЯНИЯ = {
  pending: { текст: "На проверке", цвет: "#b45309", фон: "#fffbeb" },
  expired: { текст: "Срок истёк", цвет: "#b91c1c", фон: "#fef2f2" },
  suspended: { текст: "Приостановлен", цвет: "#7c3aed", фон: "#f5f3ff" },
};

const дата = (з) => (з ? new Date(з).toLocaleDateString("ru") : "—");

/* Сколько дней осталось. Отрицательное — срок вышел; в подписи это
   важнее самой даты: «через 4 дня» читается быстрее, чем «до 15.09». */
function осталосьДней(з) {
  if (!з) return null;
  return Math.ceil((new Date(з).getTime() - Date.now()) / 86400000);
}

export default function AdminVerificationPage() {
  const [queue, setQueue] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);
  const [comment, setComment] = useState({});
  const [нехватка, setНехватка] = useState({});
  // Правки дат по документам: { [documentId]: "2027-06-01" }
  const [даты, setДаты] = useState({});

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await axios.get(`${API_BASE}/admin/verification-queue`, {
        withCredentials: true,
      });
      setQueue(r.data.queue || []);
    } catch (e) {
      setError(
        e.response?.status === 403
          ? "Доступ только для администратора."
          : "Не удалось загрузить очередь.",
      );
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function decide(profileId, status, force = false) {
    setBusy(profileId);
    setError(null);
    try {
      await axios.put(
        `${API_BASE}/admin/verification/doctor/${profileId}`,
        { status, comment: comment[profileId] || "", force },
        { withCredentials: true },
      );
      setНехватка((p) => ({ ...p, [profileId]: null }));
      await load();
    } catch (e) {
      const d = e.response?.data;
      /* Отказ из-за неполного набора — не ошибка, а ответ по существу:
         показываем, чего не хватает, и предлагаем осознанный обход. */
      if (d?.code === "REQUIRED_DOCUMENTS_MISSING") {
        setНехватка((p) => ({ ...p, [profileId]: d.missing || [] }));
      } else {
        setError(d?.message || "Не удалось изменить статус.");
      }
    } finally {
      setBusy(null);
    }
  }

  /** Решение по одному документу — вместе со сверкой даты. */
  async function решитьДокумент(документ, status, profileId) {
    setBusy(profileId);
    setError(null);
    try {
      const срок = даты[документ.id] ?? документ.expiresAt;
      await axios.patch(
        `${API_BASE}/admin/verification/document/${документ.id}`,
        {
          status,
          expiresAt: срок || null,
          reviewComment: comment[profileId] || "",
        },
        { withCredentials: true },
      );
      await load();
    } catch (e) {
      setError(
        e.response?.data?.message || "Не удалось изменить статус документа.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function продлить(profileId) {
    const until = window.prompt(
      "До какой даты продлить допуск? Формат ГГГГ-ММ-ДД (не более года вперёд).",
    );
    if (!until) return;
    const reason = window.prompt(
      "Основание продления. Обязательно — через полгода продление без объяснения неотличимо от ошибки.",
    );
    if (!reason) return;

    setBusy(profileId);
    setError(null);
    try {
      await axios.put(
        `${API_BASE}/admin/verification/doctor/${profileId}/extend`,
        { until, reason },
        { withCredentials: true },
      );
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Не удалось продлить.");
    } finally {
      setBusy(null);
    }
  }

  async function восстановить(profileId) {
    setBusy(profileId);
    setError(null);
    try {
      await axios.put(
        `${API_BASE}/admin/verification/doctor/${profileId}/restore`,
        { comment: comment[profileId] || "" },
        { withCredentials: true },
      );
      await load();
    } catch (e) {
      const d = e.response?.data;
      setError(
        d?.code === "DOCUMENTS_EXPIRED"
          ? "Документы просрочены. Нужен новый документ или продление с основанием."
          : d?.message || "Не удалось восстановить.",
      );
    } finally {
      setBusy(null);
    }
  }

  const ждут = queue.filter((d) => d.status === "pending").length;

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Верификация врачей</h1>
      <p style={{ color: "#64748b", marginBottom: 20 }}>
        Ожидают проверки: <b>{ждут}</b>
        {queue.length > ждут && (
          <>
            {" · "}истёкших и приостановленных: <b>{queue.length - ждут}</b>
          </>
        )}
      </p>

      {error && (
        <div style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</div>
      )}

      {queue.length === 0 ? (
        <div style={{ color: "#64748b" }}>
          Очередь пуста — все заявки обработаны.
        </div>
      ) : (
        queue.map((d) => {
          const сост = СОСТОЯНИЯ[d.status] || СОСТОЯНИЯ.pending;
          const дней = осталосьДней(d.accessExpiresAt);
          const нет = нехватка[d.profileId];

          return (
            <div key={d.profileId} style={cardBox}>
              <div style={шапка}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>
                    {[d.firstName, d.lastName].filter(Boolean).join(" ") ||
                      d.username}
                  </div>
                  <div style={{ color: "#64748b", fontSize: 13 }}>{d.email}</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>
                    {d.specialization || "—"} · {d.education || "—"} ·{" "}
                    {d.country || "—"}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span
                    style={{
                      ...плашка,
                      color: сост.цвет,
                      background: сост.фон,
                    }}
                  >
                    {сост.текст}
                  </span>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
                    подано: {дата(d.submittedAt)}
                  </div>
                  {d.accessExpiresAt && (
                    <div
                      style={{
                        fontSize: 12,
                        marginTop: 4,
                        color: дней !== null && дней <= 7 ? "#b91c1c" : "#64748b",
                      }}
                    >
                      допуск до {дата(d.accessExpiresAt)}
                      {дней !== null &&
                        (дней >= 0 ? ` (${дней} дн.)` : ` (просрочен)`)}
                    </div>
                  )}
                  {d.extendedUntil && (
                    <div style={{ fontSize: 12, color: "#7c3aed", marginTop: 2 }}>
                      продлён до {дата(d.extendedUntil)}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Чего не хватает ── */}
              {d.missing?.length > 0 && (
                <div style={{ ...предупреждение, marginTop: 10 }}>
                  Нет обязательных документов:{" "}
                  <b>
                    {d.missing
                      .map((м) =>
                        м
                          .split("|")
                          .map((в) => ВИДЫ[в] || в)
                          .join(" или "),
                      )
                      .join(", ")}
                  </b>
                </div>
              )}

              {/* ── Документы ── */}
              <div style={{ margin: "12px 0" }}>
                <b style={{ fontSize: 13 }}>
                  Документы ({d.documentsCount}):
                </b>
                {d.documents.length === 0 ? (
                  <span style={{ color: "#b45309", marginInlineStart: 6 }}>
                    не приложены
                  </span>
                ) : (
                  <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                    {d.documents.map((док) => (
                      <div key={док.id} style={строкаДокумента}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <a
                            href={
                              док.url?.startsWith("http")
                                ? док.url
                                : `${API_BASE}${док.url}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: "#3d7fff", fontWeight: 600 }}
                          >
                            {ВИДЫ[док.type] || док.type}
                          </a>
                          <div style={{ fontSize: 12, color: "#64748b" }}>
                            {[
                              док.number && `№ ${док.number}`,
                              док.authority,
                              док.jurisdiction,
                            ]
                              .filter(Boolean)
                              .join(" · ") || "реквизиты не указаны"}
                          </div>
                        </div>

                        {/* Дата: вписана врачом, правится и подтверждается
                            здесь. Пустая — у документа без срока (диплом). */}
                        <input
                          type="date"
                          value={
                            даты[док.id] ??
                            (док.expiresAt
                              ? String(док.expiresAt).slice(0, 10)
                              : "")
                          }
                          onChange={(e) =>
                            setДаты((p) => ({ ...p, [док.id]: e.target.value }))
                          }
                          title="Действителен до"
                          style={{ ...input, width: 150 }}
                        />

                        {док.status === "pending" ? (
                          <>
                            <button
                              onClick={() =>
                                решитьДокумент(док, "approved", d.profileId)
                              }
                              disabled={busy === d.profileId}
                              style={{ ...btn, background: "#067647", padding: "6px 12px" }}
                            >
                              Принять
                            </button>
                            <button
                              onClick={() =>
                                решитьДокумент(док, "rejected", d.profileId)
                              }
                              disabled={busy === d.profileId}
                              style={{ ...btn, background: "#b91c1c", padding: "6px 12px" }}
                            >
                              Отклонить
                            </button>
                          </>
                        ) : (
                          <span
                            style={{
                              ...плашка,
                              color:
                                док.status === "approved" ? "#067647" : "#b91c1c",
                              background:
                                док.status === "approved" ? "#ecfdf3" : "#fef2f2",
                            }}
                          >
                            {док.status === "approved"
                              ? док.expiryConfirmed
                                ? "принят, срок сверен"
                                : "принят"
                              : "отклонён"}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <input
                value={comment[d.profileId] || ""}
                onChange={(e) =>
                  setComment((p) => ({ ...p, [d.profileId]: e.target.value }))
                }
                placeholder="Комментарий (для отклонения)"
                style={{ ...input, width: "100%", marginBottom: 8 }}
              />

              {/* ── Отказ из-за неполного набора ── */}
              {нет && (
                <div style={{ ...предупреждение, marginBottom: 8 }}>
                  Одобрить нельзя: нет{" "}
                  <b>
                    {нет
                      .map((м) =>
                        м
                          .split("|")
                          .map((в) => ВИДЫ[в] || в)
                          .join(" или "),
                      )
                      .join(", ")}
                  </b>
                  .{" "}
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          "Одобрить без полного набора? Обход уйдёт в журнал отдельной отметкой — исключение должно быть видно проверяющему.",
                        )
                      ) {
                        decide(d.profileId, "approved", true);
                      }
                    }}
                    style={{ ...btn, background: "#b45309", padding: "4px 10px" }}
                  >
                    Одобрить всё равно
                  </button>
                </div>
              )}

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {d.status !== "suspended" && (
                  <button
                    onClick={() => decide(d.profileId, "approved")}
                    disabled={busy === d.profileId}
                    style={{ ...btn, background: "#067647" }}
                  >
                    Одобрить
                  </button>
                )}
                {d.status === "pending" && (
                  <button
                    onClick={() => decide(d.profileId, "rejected")}
                    disabled={busy === d.profileId}
                    style={{ ...btn, background: "#b91c1c" }}
                  >
                    Отклонить
                  </button>
                )}
                {["expired", "suspended"].includes(d.status) && (
                  <button
                    onClick={() => восстановить(d.profileId)}
                    disabled={busy === d.profileId}
                    style={{ ...btn, background: "#0d9488" }}
                  >
                    Восстановить
                  </button>
                )}
                <button
                  onClick={() => продлить(d.profileId)}
                  disabled={busy === d.profileId}
                  style={{ ...btn, background: "#7c3aed" }}
                >
                  Продлить срок
                </button>
                {d.status === "approved" && (
                  <button
                    onClick={() => decide(d.profileId, "suspended")}
                    disabled={busy === d.profileId}
                    style={{ ...btn, background: "#475569" }}
                  >
                    Приостановить
                  </button>
                )}
              </div>

              {d.extensionReason && (
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>
                  Основание продления: {d.extensionReason}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

const cardBox = {
  background: "#fff",
  border: "1px solid #e6eaf0",
  borderRadius: 10,
  padding: 16,
  marginBottom: 14,
};
const шапка = {
  display: "flex",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: 8,
};
const строкаДокумента = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
  padding: "8px 10px",
  border: "1px solid #eef1f6",
  borderRadius: 8,
  background: "#fafbfc",
};
const плашка = {
  display: "inline-block",
  fontSize: 11,
  fontWeight: 700,
  padding: "3px 9px",
  borderRadius: 999,
};
const предупреждение = {
  fontSize: 13,
  color: "#92400e",
  background: "#fffbeb",
  border: "1px solid #fde68a",
  borderRadius: 8,
  padding: "8px 10px",
};
const input = {
  padding: "8px 10px",
  border: "1px solid #d9dfe8",
  borderRadius: 8,
  fontSize: 14,
};
const btn = {
  padding: "8px 18px",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 14,
};
