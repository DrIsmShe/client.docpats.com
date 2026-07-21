// client/src/pages/admin/education/AdminExamImportPage.jsx
//
// Админка → Тесты → Загрузка теста из файла.
// Маршрут: /admin/education-import
//
// Сценарий, ради которого экран существует: админ кладёт PDF или скан,
// нажимает одну кнопку — и получает готовую структуру теста. Никакой
// JSON-разметки, никакой предварительной настройки тем: разделы модель
// выводит из самого файла (см. suggestedProgram в extraction.schema.js).
//
// Что остаётся за человеком: вычистить распознанный мусор и проставить
// ответы там, где в файле их не было. Это не бюрократия — распознавание
// ошибается, а неверный ключ ответа в медицинском тесте стоит дорого.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import {
  fetchPrograms,
  fetchExtractors,
  fetchImportJobs,
  fetchImportJob,
  createProgram,
  archiveProgram,
  createImportJob,
  runImportJob,
  updateImportDraft,
  importJobDrafts,
  readApiError,
  isAuthError,
  normalizeUrl,
} from "../../../api/education";
import "../../education/education.css";

// Экстрактор, читающий файлы. Ручной режим в админке не предлагается
// намеренно: там пришлось бы вставлять JSON руками, а задача — обратная.
const FILE_EXTRACTOR = "claude";

// Выбора языка в форме нет намеренно: язык — свойство самого файла, и
// экстрактор определяет его по тексту вопросов (suggestedProgram.lang).
// Здесь ярлыки нужны только чтобы показать оператору результат.

const SOURCE_KINDS = [
  "public_government",
  "original",
  "licensed",
  "ai_generated",
];

const REGIONS = [
  "international",
  "cis",
  "europe",
  "mena",
  "asia",
  "africa",
  "americas",
  "oceania",
];

const EXAM_TYPES = [
  "cme",
  "licensing",
  "residency_entrance",
  "board_certification",
  "international_certificate",
  "university",
  "internal_training",
];

const NEW_PROGRAM = "__new__";

// Держим в синхроне с server/modules/education/education-ingest/extractors/
// fileTypes.js. Расхождение здесь не критично — сервер всё равно проверит
// файл сам, — но приводит к неприятному «выбрал файл, получил отказ».
const ACCEPTED_EXTENSIONS = [
  ".pdf",
  ".docx",
  ".txt",
  ".md",
  ".csv",
  ".tsv",
  ".html",
  ".htm",
  ".rtf",
  ".json",
  ".xml",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
].join(",");

export default function AdminExamImportPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("education");

  const [programs, setPrograms] = useState([]);
  const [extractors, setExtractors] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [job, setJob] = useState(null);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(null); // текст текущего шага
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const [form, setForm] = useState({
    programId: NEW_PROGRAM,
    country: "INT",
    region: "international",
    examType: "cme",
    lang: "ru",
    sourceKind: "public_government",
    authority: "",
    sourceUrl: "",
    licenseNote: "",
  });
  const [file, setFile] = useState(null);
  const [selectedDrafts, setSelectedDrafts] = useState([]);

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

  useEffect(() => {
    (async () => {
      try {
        const [programList, extractorList, jobList] = await Promise.all([
          fetchPrograms({ scope: "all" }),
          fetchExtractors(),
          fetchImportJobs({ limit: 30 }),
        ]);
        setPrograms(programList);
        setExtractors(extractorList);
        setJobs(jobList);
      } catch (err) {
        handleApiError(err, t("adminImport.errors.loadPage"));
      } finally {
        setLoading(false);
      }
    })();
  }, [handleApiError, t]);

  const fileExtractor = useMemo(
    () => extractors.find((e) => e.name === FILE_EXTRACTOR),
    [extractors],
  );
  const aiReady = Boolean(fileExtractor?.configured);
  const isNewProgram = form.programId === NEW_PROGRAM;

  async function openJob(jobId) {
    setError(null);
    try {
      const full = await fetchImportJob(jobId);
      setJob(full);
      setSelectedDrafts(
        (full.draftItems ?? [])
          .filter((d) => !d.discarded && !d.imported && d.correctKeys?.length)
          .map((d) => d.index),
      );
    } catch (err) {
      handleApiError(err, t("adminImport.errors.openJob"));
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) {
      setError(t("adminImport.errors.noFile"));
      return;
    }

    // Всё, что можно проверить на клиенте, проверяем ДО создания программы:
    // иначе падение на следующем шаге оставит в базе программу-сироту.
    const url = normalizeUrl(form.sourceUrl);
    if (!url.ok) {
      setError(t("adminImport.errors.sourceUrl"));
      return;
    }
    if (
      ["public_government", "licensed"].includes(form.sourceKind) &&
      !form.authority.trim()
    ) {
      setError(t("adminImport.errors.authorityRequired"));
      return;
    }
    if (form.sourceKind === "licensed" && !form.licenseNote.trim()) {
      setError(t("adminImport.errors.licenseRequired"));
      return;
    }
    if (isNewProgram && !/^([A-Z]{2}|INT)$/.test(form.country)) {
      setError(t("adminImport.errors.country"));
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);

    // Запоминаем, что программу создали именно мы: при срыве её нужно
    // убрать, а чужую — не трогать.
    let createdProgramId = null;

    try {
      // 1. Программа-контейнер. Для нового теста создаём пустую: карту тем
      //    построит модель из содержимого файла.
      let programId = form.programId;
      if (isNewProgram) {
        setStage(t("adminImport.stages.creatingProgram"));
        const baseName = file.name.replace(/\.[^.]+$/, "").slice(0, 200);
        const created = await createProgram({
          // Код попадает в URL и должен быть уникальным — собираем из времени.
          code: `imported-${Date.now().toString(36)}`,
          // Техническое название: модель заменит его на осмысленное,
          // выведенное из файла (см. runExtraction в ingest.service).
          title: t("adminImport.draftProgramTitle", { name: baseName }),
          country: form.country,
          region: form.region,
          examType: form.examType,
          languages: [form.lang],
          sourcePolicy: form.sourceKind,
          status: "draft",
        });
        programId = created._id;
        createdProgramId = created._id;
      }

      // 2. Задание импорта.
      setStage(t("adminImport.stages.preparingJob"));
      const created = await createImportJob({
        programId,
        extractor: FILE_EXTRACTOR,
        file: {
          mimeType: file.type,
          originalName: file.name,
          sizeBytes: file.size,
        },
        defaults: {
          lang: form.lang,
          source: {
            kind: form.sourceKind,
            authority: form.authority.trim() || null,
            url: url.value,
            licenseNote: form.licenseNote.trim() || null,
          },
        },
      });

      // 3. Извлечение. Может занять минуты на многостраничном PDF.
      setStage(t("adminImport.stages.extracting"));
      const ran = await runImportJob(created._id, { file });

      setNotice(
        t("adminImport.notices.detected", { count: ran.stats?.detected ?? 0 }),
      );
      setFile(null);
      setPrograms(await fetchPrograms({ scope: "all" }));
      setJobs(await fetchImportJobs({ limit: 30 }));
      await openJob(created._id);
    } catch (err) {
      handleApiError(err, t("adminImport.errors.processFile"));

      // Откат: пустая программа, созданная под этот файл, больше не нужна.
      // Оставлять её значит копить мусор в списке тестов после каждой
      // неудачной попытки. Ошибку отката не показываем — она перекрыла бы
      // настоящую причину сбоя.
      if (createdProgramId) {
        await archiveProgram(createdProgramId).catch(() => {});
      }

      setJobs(await fetchImportJobs({ limit: 30 }).catch(() => jobs));
    } finally {
      setBusy(false);
      setStage(null);
    }
  }

  async function toggleDiscard(draft) {
    setBusy(true);
    try {
      await updateImportDraft(job._id, draft.index, {
        discarded: !draft.discarded,
      });
      await openJob(job._id);
      setSelectedDrafts((prev) => prev.filter((i) => i !== draft.index));
    } catch (err) {
      handleApiError(err, t("adminImport.errors.updateDraft"));
    } finally {
      setBusy(false);
    }
  }

  async function setCorrectKey(draft, key) {
    setBusy(true);
    try {
      await updateImportDraft(job._id, draft.index, { correctKeys: [key] });
      await openJob(job._id);
      setSelectedDrafts((prev) =>
        prev.includes(draft.index) ? prev : [...prev, draft.index],
      );
    } catch (err) {
      handleApiError(err, t("adminImport.errors.setCorrectKey"));
    } finally {
      setBusy(false);
    }
  }

  async function handleImport() {
    if (selectedDrafts.length === 0) {
      setError(t("adminImport.errors.selectAtLeastOne"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await importJobDrafts(job._id, selectedDrafts);
      const skippedList = (result.skipped ?? [])
        .map((s) => `#${s.index + 1} — ${s.reason}`)
        .join("; ");
      setNotice(
        result.skipped?.length
          ? t("adminImport.notices.importedWithSkipped", {
              count: result.createdCount,
              skipped: result.skipped.length,
              list: skippedList,
            })
          : t("adminImport.notices.imported", { count: result.createdCount }),
      );
      await openJob(job._id);
      setJobs(await fetchImportJobs({ limit: 30 }));
    } catch (err) {
      handleApiError(err, t("adminImport.errors.importDrafts"));
    } finally {
      setBusy(false);
    }
  }

  function toggleSelected(index) {
    setSelectedDrafts((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  }

  if (loading) {
    return (
      <div className="edu-page edu-page--wide">
        <div className="edu-state">{t("shared.actions.loading")}</div>
      </div>
    );
  }

  const drafts = job?.draftItems ?? [];
  const pending = drafts.filter((d) => !d.imported && !d.discarded);

  return (
    <div className="edu-page edu-page--wide">
      <h1 className="edu-title">{t("adminImport.title")}</h1>
      <p className="edu-subtitle">{t("adminImport.subtitle")}</p>

      {error && <div className="edu-error">{error}</div>}
      {notice && <div className="edu-notice">{notice}</div>}

      {!aiReady && (
        <div className="edu-warn">
          <Trans
            t={t}
            i18nKey="adminImport.aiOff"
            components={{ 1: <code />, 2: <code />, 3: <code />, 4: <code /> }}
          />
        </div>
      )}

      {/* ─── Загрузка ─── */}
      <form className="edu-card" onSubmit={handleUpload}>
        <div className="edu-field-label" style={{ marginTop: 0 }}>
          {t("adminImport.form.targetLabel")}
        </div>
        <select
          className="edu-select"
          value={form.programId}
          onChange={(e) =>
            setForm((f) => ({ ...f, programId: e.target.value }))
          }
        >
          <option value={NEW_PROGRAM}>
            {t("adminImport.form.newProgramOption")}
          </option>
          {programs
            .filter((p) => p.status !== "archived")
            .map((p) => (
              <option key={p._id} value={p._id}>
                {p.title}
                {p.status !== "published"
                  ? t("adminImport.form.draftSuffix")
                  : ""}
              </option>
            ))}
        </select>
        <div className="edu-hint">
          {isNewProgram
            ? t("adminImport.form.targetHintNew")
            : t("adminImport.form.targetHintExisting")}
        </div>

        {isNewProgram && (
          <div className="edu-form-row" style={{ marginTop: 14 }}>
            <div>
              <div className="edu-field-label" style={{ marginTop: 0 }}>
                {t("adminImport.form.country")}
              </div>
              <input
                className="edu-input"
                maxLength={3}
                placeholder="INT, TR, SA, AZ…"
                value={form.country}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    country: e.target.value.toUpperCase(),
                  }))
                }
              />
              <div className="edu-hint">
                {t("adminImport.form.countryHint")}
              </div>
            </div>
            <div>
              <div className="edu-field-label" style={{ marginTop: 0 }}>
                {t("adminImport.form.region")}
              </div>
              <select
                className="edu-select"
                value={form.region}
                onChange={(e) =>
                  setForm((f) => ({ ...f, region: e.target.value }))
                }
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {t(`adminImport.regions.${r}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="edu-field-label" style={{ marginTop: 0 }}>
                {t("adminImport.form.examType")}
              </div>
              <select
                className="edu-select"
                value={form.examType}
                onChange={(e) =>
                  setForm((f) => ({ ...f, examType: e.target.value }))
                }
              >
                {EXAM_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`shared.examTypes.${type}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="edu-field-label">
          {t("adminImport.form.sourceKind")}
        </div>
        <select
          className="edu-select"
          value={form.sourceKind}
          onChange={(e) =>
            setForm((f) => ({ ...f, sourceKind: e.target.value }))
          }
        >
          {SOURCE_KINDS.map((s) => (
            <option key={s} value={s}>
              {t(`shared.sourceKinds.${s}`)}
            </option>
          ))}
        </select>
        <div className="edu-hint">
          {t(`adminImport.sourceKindHints.${form.sourceKind}`)}
        </div>

        <div className="edu-form-row" style={{ marginTop: 14 }}>
          <div>
            <div className="edu-field-label" style={{ marginTop: 0 }}>
              {t("adminImport.form.authority")}
            </div>
            <input
              className="edu-input"
              placeholder={t("adminImport.form.authorityPlaceholder")}
              value={form.authority}
              onChange={(e) =>
                setForm((f) => ({ ...f, authority: e.target.value }))
              }
            />
          </div>
          <div>
            <div className="edu-field-label" style={{ marginTop: 0 }}>
              {t("adminImport.form.sourceUrl")}
            </div>
            <input
              className="edu-input"
              placeholder="https://…"
              value={form.sourceUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, sourceUrl: e.target.value }))
              }
            />
            <div className="edu-hint">
              {t("adminImport.form.sourceUrlHint")}
            </div>
          </div>
        </div>

        {form.sourceKind === "licensed" && (
          <>
            <div className="edu-field-label">
              {t("adminImport.form.licenseNote")}
            </div>
            <textarea
              className="edu-textarea"
              rows={2}
              placeholder={t("adminImport.form.licenseNotePlaceholder")}
              value={form.licenseNote}
              onChange={(e) =>
                setForm((f) => ({ ...f, licenseNote: e.target.value }))
              }
            />
          </>
        )}

        <div className="edu-field-label">{t("adminImport.form.file")}</div>
        <div className="edu-dropzone">
          {file ? (
            <>
              <div>
                <strong>{file.name}</strong>{" "}
                <span style={{ color: "#8b9aab" }}>
                  {t("adminImport.form.fileSize", {
                    size: (file.size / 1024 / 1024).toFixed(1),
                  })}
                </span>
              </div>
              <button
                type="button"
                className="edu-btn edu-btn--ghost"
                style={{ marginTop: 10 }}
                onClick={() => setFile(null)}
                disabled={busy}
              >
                {t("adminImport.form.chooseAnother")}
              </button>
            </>
          ) : (
            <>
              {t("adminImport.form.dropzoneHint")}
              <input
                type="file"
                // Список расширений, а не MIME-типов: Windows отдаёт .csv
                // как Excel, а .md — с пустым типом, и фильтр по MIME
                // прятал бы нормальные файлы из диалога выбора.
                accept={ACCEPTED_EXTENSIONS}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </>
          )}
        </div>

        <div className="edu-btn-row">
          <button
            type="submit"
            className="edu-btn"
            disabled={busy || !aiReady || !file}
          >
            {busy
              ? (stage ?? t("adminImport.form.processing"))
              : t("adminImport.form.submit")}
          </button>
        </div>
        {busy && stage && <div className="edu-hint">{stage}</div>}
      </form>

      {/* ─── Прошлые загрузки ─── */}
      {jobs.length > 0 && (
        <div className="edu-card">
          <h2 className="edu-card-title">{t("adminImport.jobs.title")}</h2>
          {jobs.map((j) => (
            <button
              key={j._id}
              type="button"
              className="edu-list-item"
              style={{ border: "none", borderTop: "1px solid #eef2f7" }}
              onClick={() => openJob(j._id)}
            >
              <div className="edu-list-item-title">
                {j.file?.originalName ?? t("adminImport.jobs.noFile")}{" "}
                <span style={{ color: "#8b9aab" }}>
                  ·{" "}
                  {t(`shared.importStatuses.${j.status}`, {
                    defaultValue: j.status,
                  })}
                </span>
              </div>
              <div className="edu-list-item-meta">
                {t("adminImport.jobs.meta", {
                  detected: j.stats?.detected ?? 0,
                  imported: j.stats?.imported ?? 0,
                  date: new Date(j.createdAt).toLocaleString(i18n.language),
                })}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ─── Распознанное ─── */}
      {job && (
        <div className="edu-card">
          <h2 className="edu-card-title">
            {t("adminImport.drafts.title", { count: drafts.length })}
            {job.needsAttention > 0 &&
              ` · ${t("adminImport.drafts.attention", {
                count: job.needsAttention,
              })}`}
          </h2>

          {job.status === "failed" && (
            <div className="edu-error">
              {t("adminImport.drafts.failedLabel")} {job.error}
            </div>
          )}

          {/* Язык определяется по тексту файла и проставляется вопросам,
              а из них собирается languages самого теста — то, по чему
              учащийся фильтрует каталог. Показываем, чтобы ошибка
              распознавания языка не уехала в каталог молча. */}
          {job.defaults?.lang && drafts.length > 0 && (
            <div className="edu-hint" style={{ marginBottom: 12 }}>
              <Trans
                t={t}
                i18nKey="adminImport.drafts.langNote"
                components={{ 1: <strong /> }}
                values={{
                  lang: t(`shared.langs.${job.defaults.lang}`, {
                    defaultValue: job.defaults.lang,
                  }),
                }}
              />
            </div>
          )}

          {job.needsAttention > 0 && (
            <div className="edu-warn">
              {t("adminImport.drafts.attentionHint")}
            </div>
          )}

          {drafts.map((draft) => {
            const problem =
              !draft.correctKeys?.length || (draft.options?.length ?? 0) < 2;
            const classes = [
              "edu-draft",
              draft.imported ? "edu-draft--imported" : "",
              draft.discarded ? "edu-draft--discarded" : "",
              !draft.imported && !draft.discarded && problem
                ? "edu-draft--problem"
                : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <div key={draft.index} className={classes}>
                <div className="edu-draft-head">
                  {!draft.imported && !draft.discarded && (
                    <input
                      type="checkbox"
                      checked={selectedDrafts.includes(draft.index)}
                      disabled={problem}
                      onChange={() => toggleSelected(draft.index)}
                    />
                  )}
                  <strong>#{draft.index + 1}</strong>
                  {draft.sourcePage != null && (
                    <span>
                      {t("adminImport.drafts.page", { page: draft.sourcePage })}
                    </span>
                  )}
                  {draft.confidence != null && (
                    <span>
                      {t("adminImport.drafts.confidence", {
                        percent: Math.round(draft.confidence * 100),
                      })}
                    </span>
                  )}
                  {draft.topicCode && (
                    <span className="edu-tag">{draft.topicCode}</span>
                  )}
                  {draft.imported && (
                    <span className="edu-tag edu-tag--free">
                      {t("adminImport.drafts.tagImported")}
                    </span>
                  )}
                  {draft.discarded && (
                    <span className="edu-tag">
                      {t("adminImport.drafts.tagDiscarded")}
                    </span>
                  )}
                </div>

                <div className="edu-draft-stem">{draft.stem}</div>

                {(draft.options ?? []).map((option) => {
                  const isCorrect = draft.correctKeys?.includes(option.key);
                  return (
                    <div
                      key={option.key}
                      className={`edu-draft-option ${
                        isCorrect ? "edu-draft-option--correct" : ""
                      }`}
                    >
                      <strong>{option.key}.</strong> {option.text}
                      {!draft.imported &&
                        !draft.discarded &&
                        !draft.correctKeys?.length && (
                          <button
                            type="button"
                            className="edu-btn edu-btn--ghost"
                            style={{
                              padding: "2px 8px",
                              fontSize: 12,
                              marginLeft: 10,
                            }}
                            disabled={busy}
                            onClick={() => setCorrectKey(draft, option.key)}
                          >
                            {t("adminImport.drafts.markCorrect")}
                          </button>
                        )}
                    </div>
                  );
                })}

                {draft.notes && (
                  <div className="edu-hint" style={{ marginTop: 8 }}>
                    {t("adminImport.drafts.notesLabel")} {draft.notes}
                  </div>
                )}

                {!draft.imported && (
                  <div className="edu-btn-row" style={{ marginTop: 10 }}>
                    <button
                      type="button"
                      className="edu-btn edu-btn--ghost"
                      style={{ padding: "6px 12px", fontSize: 13 }}
                      disabled={busy}
                      onClick={() => toggleDiscard(draft)}
                    >
                      {draft.discarded
                        ? t("adminImport.drafts.restore")
                        : t("adminImport.drafts.discard")}
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {pending.length > 0 && (
            <div className="edu-btn-row">
              <button
                type="button"
                className="edu-btn"
                disabled={busy || selectedDrafts.length === 0}
                onClick={handleImport}
              >
                {t("adminImport.drafts.importSelected", {
                  count: selectedDrafts.length,
                })}
              </button>
            </div>
          )}

          {(job.stats?.imported ?? 0) > 0 && (
            <div className="edu-notice" style={{ marginTop: 16 }}>
              <Trans
                t={t}
                i18nKey="adminImport.drafts.doneNotice"
                values={{ count: job.stats.imported }}
                components={{
                  1: <Link to="/admin/education-review" />,
                  2: <Link to="/admin/education-programs" />,
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
