// client/src/pages/admin/education/AdminExamReviewPage.jsx
//
// Админка → Тесты → Ревью вопросов. Маршрут: /admin/education-review
//
// Единственное место, где вопрос становится published. Экран сознательно
// устроен как «прочитай и дополни», а не «нажми ОК»: бэкенд не опубликует
// вопрос без общего объяснения и объяснения к КАЖДОМУ варианту, поэтому
// поля для них здесь редактируемые прямо в карточке.
//
// Машинно-извлечённые вопросы (ai_generated или пришедшие из импорта)
// помечаются баннером — у них выше риск потерянного варианта или
// перепутанного ключа ответа.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ItemTranslationsPanel from "./ItemTranslationsPanel";
import {
  fetchItems,
  fetchItem,
  fetchPrograms,
  updateItem,
  submitItemForReview,
  reviewItem,
  reviewAllProgramItems,
  readApiError,
  isAuthError,
} from "../../../api/education";
import LanguageSwitcher from "../../../components/LanguageSwitcher";
import "../../education/education.css";

export default function ExamReviewQueuePage() {
  const navigate = useNavigate();
  const { t } = useTranslation("education");

  const [queue, setQueue] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [item, setItem] = useState(null);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  // Черновик правок рецензента до сохранения.
  const [draft, setDraft] = useState({ explanation: "", options: [] });
  const [rejectReason, setRejectReason] = useState("");

  const handleApiError = useCallback(
    (err, fallback) => {
      if (isAuthError(err)) {
        navigate("/login");
        return;
      }
      setError(readApiError(err, fallback));
    },
    [navigate],
  );

  const loadQueue = useCallback(async () => {
    try {
      // Тянем и in_review, и draft. Импорт отправляет вопросы на ревью
      // сам, но черновик может появиться и другим путём (создание через
      // API, отложенная правка) — а вопрос, не видимый ни в очереди, ни
      // учащимся, не виден нигде. Ровно так и потерялись первые пять
      // импортированных вопросов.
      const [inReview, drafts, programList] = await Promise.all([
        fetchItems({ status: "in_review", limit: 200 }),
        fetchItems({ status: "draft", limit: 200 }),
        fetchPrograms({ scope: "all" }),
      ]);
      const items = [...inReview, ...drafts];
      setQueue(items);
      setPrograms(programList);
      return items;
    } catch (err) {
      handleApiError(err, t("adminReview.errors.loadQueue"));
      return [];
    } finally {
      setLoading(false);
    }
  }, [handleApiError, t]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  // Подгружаем выбранный вопрос целиком: в списке приходит усечённая форма.
  useEffect(() => {
    let cancelled = false;
    if (!selectedId) {
      setItem(null);
      return undefined;
    }

    (async () => {
      try {
        const full = await fetchItem(selectedId);
        if (cancelled) return;
        setItem(full);
        setDraft({
          explanation: full.explanation ?? "",
          options: (full.options ?? []).map((o) => ({
            key: o.key,
            text: o.text,
            explanation: o.explanation ?? "",
          })),
        });
        setRejectReason("");
      } catch (err) {
        if (!cancelled) handleApiError(err, t("adminReview.errors.loadItem"));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedId, handleApiError, t]);

  const programTitle = useCallback(
    (programId) =>
      programs.find((p) => p._id === programId)?.title ??
      t("adminReview.programFallback"),
    [programs, t],
  );

  // Очередь по тестам — для пакетного одобрения. Считаем только in_review:
  // черновики бэкенд в пакет не берёт, и обещать их одобрение нельзя.
  const bulkGroups = useMemo(() => {
    const byProgram = new Map();
    for (const q of queue) {
      if (q.status !== "in_review") continue;
      const key = String(q.programId);
      byProgram.set(key, (byProgram.get(key) ?? 0) + 1);
    }
    return [...byProgram.entries()].map(([programId, count]) => ({
      programId,
      count,
    }));
  }, [queue]);

  async function handleApproveAll(group) {
    const question = t("adminReview.confirms.approveAll", {
      name: programTitle(group.programId),
      count: group.count,
    });
    if (!window.confirm(question)) return;

    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await reviewAllProgramItems(group.programId);
      setNotice(
        result.skippedCount
          ? t("adminReview.notices.bulkApprovedWithSkipped", {
              count: result.approvedCount,
              skipped: result.skippedCount,
            })
          : t("adminReview.notices.bulkApproved", {
              count: result.approvedCount,
            }),
      );
      const items = await loadQueue();
      // Открытый вопрос мог быть только что опубликован — тогда карточка
      // показывала бы то, чего в очереди уже нет.
      if (selectedId && !items.some((q) => q._id === selectedId)) {
        setSelectedId(null);
      }
    } catch (err) {
      handleApiError(err, t("adminReview.errors.approveAll"));
    } finally {
      setBusy(false);
    }
  }

  // ЗАПРЕТЫ — то, без чего публиковать нельзя. Считаем теми же правилами,
  // что и бэкенд, чтобы рецензент видел препятствие до нажатия кнопки.
  // Здесь только корректность вопроса и права на материал.
  const blockers = useMemo(() => {
    if (!item) return [];
    const list = [];
    if (!item.correctKeys?.length)
      list.push(t("adminReview.blockers.noCorrectAnswer"));
    const kind = item.source?.kind;
    if (["public_government", "licensed"].includes(kind) && !item.source?.authority) {
      list.push(t("adminReview.blockers.noAuthority"));
    }
    if (kind === "licensed" && !item.source?.licenseNote) {
      list.push(t("adminReview.blockers.noLicenseNote"));
    }
    return list;
  }, [item, t]);

  // ЗАМЕЧАНИЯ — то, что стоит дописать, но решает редактор. Публиковать
  // не мешают: в государственных сборниках разборов не бывает вовсе.
  const warnings = useMemo(() => {
    if (!item) return [];
    const list = [];
    if (!draft.explanation.trim()) {
      list.push(t("adminReview.warnings.noExplanation"));
    }
    const missing = draft.options
      .filter((o) => !o.explanation.trim())
      .map((o) => o.key);
    if (missing.length === draft.options.length && missing.length > 0) {
      list.push(t("adminReview.warnings.noOptionExplanations"));
    } else if (missing.length) {
      list.push(
        t("adminReview.warnings.someOptionExplanations", {
          keys: missing.join(", "),
        }),
      );
    }
    return list;
  }, [item, draft, t]);

  const isMachineDerived = Boolean(
    item && (item.source?.kind === "ai_generated" || item.importJobId),
  );

  async function persistDraft() {
    return updateItem(item._id, {
      explanation: draft.explanation,
      options: draft.options,
    });
  }

  // Решение принимается только по вопросу в статусе in_review. Черновик,
  // попавший в очередь, сначала переводим туда — для рецензента это одно
  // действие, а не два, и разбираться в статусах ему незачем.
  async function ensureInReview() {
    if (item.status === "draft" || item.status === "rejected") {
      await submitItemForReview(item._id);
    }
  }

  async function handleSave() {
    setBusy(true);
    setError(null);
    try {
      const updated = await persistDraft();
      setItem(updated);
      setNotice(t("adminReview.notices.saved"));
    } catch (err) {
      handleApiError(err, t("adminReview.errors.save"));
    } finally {
      setBusy(false);
    }
  }

  async function handleApprove() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      // Сначала сохраняем правки, потом публикуем: иначе гейт отвергнет
      // публикацию из-за объяснений, которые есть только на экране.
      await persistDraft();
      await ensureInReview();
      await reviewItem(item._id, { decision: "approve" });

      const rest = await loadQueue();
      // Напоминание не лишнее: опубликованный вопрос ещё не значит
      // опубликованный тест — учащиеся увидят его только после того,
      // как будет опубликована сама программа.
      setNotice(t("adminReview.notices.published"));
      // Сразу переходим к следующему — очередь ревью про поток, не про клики.
      const next = rest.find((q) => q._id !== item._id);
      setSelectedId(next?._id ?? null);
    } catch (err) {
      handleApiError(err, t("adminReview.errors.approve"));
    } finally {
      setBusy(false);
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) {
      setError(t("adminReview.errors.rejectReasonRequired"));
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await ensureInReview();
      await reviewItem(item._id, {
        decision: "reject",
        reason: rejectReason.trim(),
      });
      const rest = await loadQueue();
      setNotice(t("adminReview.notices.rejected"));
      const next = rest.find((q) => q._id !== item._id);
      setSelectedId(next?._id ?? null);
    } catch (err) {
      handleApiError(err, t("adminReview.errors.reject"));
    } finally {
      setBusy(false);
    }
  }

  function updateOptionExplanation(key, value) {
    setDraft((prev) => ({
      ...prev,
      options: prev.options.map((o) =>
        o.key === key ? { ...o, explanation: value } : o,
      ),
    }));
  }

  if (loading) {
    return (
      <div className="edu-page">
        <div className="edu-state">{t("adminReview.loadingQueue")}</div>
      </div>
    );
  }

  return (
    <div className="edu-page edu-page--wide">
      {/* Переключатель языка: сама админка не переведена вовсе, и без
          него оператор не мог вернуть модуль на русский — значение
          языка общее для всего сайта и меняется только на витрине. */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div>
          <h1 className="edu-title">{t("adminReview.title")}</h1>
          <p className="edu-subtitle">{t("adminReview.subtitle")}</p>
        </div>
        <LanguageSwitcher />
      </div>

      {error && <div className="edu-error">{error}</div>}
      {notice && <div className="edu-notice">{notice}</div>}

      {queue.length === 0 && (
        <div className="edu-state">
          {t("adminReview.emptyQueue")}
          <br />
          <Link to="/admin/education-import">
            {t("adminReview.emptyQueueLink")}
          </Link>
        </div>
      )}

      {/* ─── Пакетное одобрение ─── */}
      {/* Сборник даёт сотню вопросов разом, и по одному это работа на
          вечер. Группируем по тестам: одобрять «всё вообще» нельзя —
          рецензент отвечает за конкретный тест. */}
      {bulkGroups.length > 0 && (
        <div className="edu-card" style={{ marginBottom: 16 }}>
          <h2 className="edu-card-title">{t("adminReview.bulk.title")}</h2>
          <div className="edu-hint" style={{ marginBottom: 10 }}>
            {t("adminReview.bulk.hint")}
          </div>
          {bulkGroups.map((group) => (
            <div
              key={group.programId}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "8px 0",
                borderTop: "1px solid #eef2f7",
                flexWrap: "wrap",
              }}
            >
              <span>
                <strong>{programTitle(group.programId)}</strong>{" "}
                <span style={{ color: "#8b9aab" }}>
                  · {t("adminReview.bulk.pending", { count: group.count })}
                </span>
              </span>
              <button
                type="button"
                className="edu-btn"
                style={{ padding: "6px 14px", fontSize: 13 }}
                disabled={busy}
                onClick={() => handleApproveAll(group)}
              >
                {t("adminReview.bulk.approve", { count: group.count })}
              </button>
            </div>
          ))}
        </div>
      )}

      {queue.length > 0 && (
        <div className="edu-split">
          {/* ─── Список ─── */}
          <div className="edu-split-list">
            <div className="edu-list-head">
              {t("adminReview.queueCount", { count: queue.length })}
            </div>
            {queue.map((q) => {
              const machine =
                q.source?.kind === "ai_generated" || q.importJobId;
              return (
                <button
                  key={q._id}
                  type="button"
                  className={`edu-list-item ${
                    selectedId === q._id ? "edu-list-item--active" : ""
                  }`}
                  onClick={() => setSelectedId(q._id)}
                >
                  <div className="edu-list-item-title">
                    {q.stem.slice(0, 90)}
                    {q.stem.length > 90 ? "…" : ""}
                  </div>
                  <div className="edu-list-item-meta">
                    {programTitle(q.programId)}
                    {q.topicCode ? ` · ${q.topicCode}` : ""}
                    {machine ? ` · ${t("adminReview.aiTag")}` : ""}
                  </div>
                </button>
              );
            })}
          </div>

          {/* ─── Карточка ─── */}
          <div className="edu-split-detail">
            {!item && (
              <div className="edu-state">{t("adminReview.selectPrompt")}</div>
            )}

            {item && (
              <div className="edu-card">
                {isMachineDerived && (
                  <div className="edu-warn">
                    {item.aiConfidence != null
                      ? t("adminReview.machineBannerWithConfidence", {
                          percent: Math.round(item.aiConfidence * 100),
                        })
                      : t("adminReview.machineBanner")}
                  </div>
                )}

                <div className="edu-card-meta" style={{ marginTop: 0 }}>
                  <span className="edu-tag">{programTitle(item.programId)}</span>
                  {item.topicCode && (
                    <span className="edu-tag">{item.topicCode}</span>
                  )}
                  <span className="edu-tag">
                    {t(`shared.difficulty.${item.difficulty}`, {
                      defaultValue: item.difficulty,
                    })}
                  </span>
                  <span className="edu-tag">
                    {t(`shared.sourceKinds.${item.source?.kind}`, {
                      defaultValue: item.source?.kind,
                    })}
                  </span>
                  <span className="edu-tag">
                    {t("adminReview.version", { version: item.version })}
                  </span>
                </div>

                <p className="edu-stem" style={{ marginTop: 18 }}>
                  {item.stem}
                </p>

                <div className="edu-field-label">
                  {t("adminReview.optionsLabel")}
                </div>
                {draft.options.map((option) => {
                  const isCorrect = item.correctKeys?.includes(option.key);
                  return (
                    <div
                      key={option.key}
                      className={`edu-review-option ${
                        isCorrect ? "edu-review-option--correct" : ""
                      }`}
                    >
                      <div className="edu-review-option-head">
                        <span className="edu-option-key">{option.key}</span>
                        <span>{option.text}</span>
                        {isCorrect && (
                          <span className="edu-tag edu-tag--free">
                            {t("adminReview.correctTag")}
                          </span>
                        )}
                      </div>
                      <textarea
                        className="edu-textarea"
                        rows={2}
                        placeholder={
                          isCorrect
                            ? t("adminReview.optionExplanationCorrectPlaceholder")
                            : t("adminReview.optionExplanationWrongPlaceholder")
                        }
                        value={option.explanation}
                        onChange={(e) =>
                          updateOptionExplanation(option.key, e.target.value)
                        }
                      />
                    </div>
                  );
                })}

                <div className="edu-field-label">
                  {t("adminReview.explanationLabel")}{" "}
                  <span style={{ fontWeight: 400, color: "#8b9aab" }}>
                    {t("adminReview.explanationOptional")}
                  </span>
                </div>
                <textarea
                  className="edu-textarea"
                  rows={4}
                  placeholder={t("adminReview.explanationPlaceholder")}
                  value={draft.explanation}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, explanation: e.target.value }))
                  }
                />

                {blockers.length > 0 && (
                  <div className="edu-error" style={{ marginTop: 16 }}>
                    {t("adminReview.blockersTitle", {
                      list: blockers.join("; "),
                    })}
                  </div>
                )}

                {blockers.length === 0 && warnings.length > 0 && (
                  <div className="edu-warn" style={{ marginTop: 16 }}>
                    {t("adminReview.warningsNote", {
                      list: warnings.join("; "),
                    })}
                  </div>
                )}

                <div className="edu-btn-row">
                  <button
                    type="button"
                    className="edu-btn"
                    disabled={busy || blockers.length > 0}
                    onClick={handleApprove}
                  >
                    {busy ? "…" : t("adminReview.approve")}
                  </button>
                  <button
                    type="button"
                    className="edu-btn edu-btn--ghost"
                    disabled={busy}
                    onClick={handleSave}
                  >
                    {t("adminReview.saveEdits")}
                  </button>
                </div>

                <div className="edu-field-label" style={{ marginTop: 24 }}>
                  {t("adminReview.rejectLabel")}
                </div>
                <textarea
                  className="edu-textarea"
                  rows={2}
                  placeholder={t("adminReview.rejectPlaceholder")}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
                <div className="edu-btn-row">
                  <button
                    type="button"
                    className="edu-btn edu-btn--danger"
                    disabled={busy}
                    onClick={handleReject}
                  >
                    {t("adminReview.reject")}
                  </button>
                </div>
              </div>
            )}

            {/* Переводы. Показываем только у оригиналов: у вопроса-перевода
                translationOf заполнен, и переводить его не с чего — правится
                он здесь же, в панели своего оригинала.

                Проверка item обязательна и стоит ПЕРВОЙ: этот блок лежит вне
                соседнего {item && …}, а до выбора вопроса из очереди item ещё
                null — без неё страница падала на первом же рендере целиком,
                до отрисовки шапки. */}
            {item && !item.translationOf && (
              <ItemTranslationsPanel itemId={item._id} itemStatus={item.status} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
