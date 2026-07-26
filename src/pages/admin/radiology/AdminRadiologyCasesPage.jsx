// client/src/pages/admin/radiology/AdminRadiologyCasesPage.jsx
//
// Админка → Лучевая диагностика. Маршрут: /admin/radiology
//
// Инструмент авторинга кейсов: слева список, справа редактор. Эксперт
// размечает ЭТАЛОН прямо на снимке (тот же холст, что у учащегося, в режиме
// draw), задаёт значимость и пояснение находки, пишет эталонное заключение
// и принятые ключи диагноза, затем отправляет на ревью и публикует.
//
// Снимки на этом этапе — по URL уже анонимных PNG/JPEG (настоящая загрузка
// в R2 и DICOM-анонимизация — следующий шаг). Модель данных под загрузку
// готова: images[] хранит url + подпись + размеры.

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchReadingConfig,
  fetchCases,
  fetchCase,
  createCase,
  updateCase,
  submitCaseForReview,
  reviewCase,
  archiveCase,
  uploadCaseImage,
  aiDraftCase,
  aiGenerateCase,
  aiVerifyCase,
  generateCaseAiBaseline,
} from "../../../api/radiology";
import { readApiError, isAuthError } from "../../../api/education";
import RadiologyCanvas from "../../radiology/components/RadiologyCanvas";
import AiReviewPanel, {
  issuesForRow,
  AiRowIssues,
  unresolvedIssues,
} from "./AiReviewPanel";
import { MODALITY_LABELS } from "../../radiology/RadiologyCatalogPage";
import "../../education/education.css";
import "../../radiology/radiology.css";

const SOURCE_KINDS = [
  { key: "original", label: "Авторский материал" },
  { key: "public_government", label: "Официальный открытый" },
  { key: "licensed", label: "По лицензии" },
  { key: "ai_generated", label: "Сгенерирован ИИ" },
];
const DIFFICULTIES = [
  { key: "easy", label: "Лёгкий" },
  { key: "medium", label: "Средний" },
  { key: "hard", label: "Сложный" },
];
const SIGNIFICANCES = [
  { key: "critical", label: "Критическая", color: "#dc2626" },
  { key: "major", label: "Значимая", color: "#2563eb" },
  { key: "incidental", label: "Случайная", color: "#64748b" },
];
const STATUS_LABELS = {
  draft: "Черновик",
  in_review: "На ревью",
  published: "Опубликован",
  rejected: "Отклонён",
  archived: "В архиве",
};
const sigColor = (s) => SIGNIFICANCES.find((x) => x.key === s)?.color ?? "#2563eb";
const parseList = (s) => String(s ?? "").split(/[\n,;]+/).map((x) => x.trim()).filter(Boolean);
const newKey = () => `f_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e4)}`;

const BLANK = {
  modality: "cxr",
  title: "",
  clinicalContext: "",
  difficulty: "medium",
  // Лимит зачётной попытки в минутах; пусто — значение по станции.
  timeLimitMin: "",
  sourceKind: "original",
  authority: "",
  sourceUrl: "",
  licenseNote: "",
  deidentified: false,
  correctText: "",
  diagnosisKeys: "",
  diagnosisSynonyms: "",
};

export default function AdminRadiologyCasesPage() {
  const navigate = useNavigate();

  const [systems, setSystems] = useState([]);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiHint, setAiHint] = useState("");
  // Генерация кейса ЦЕЛИКОМ по теме (снимка ещё нет).
  const [aiGenBusy, setAiGenBusy] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiGenHint, setAiGenHint] = useState("");
  // План разметки от ИИ: какие находки должны быть на снимке. Координаты ИИ не
  // выдумывает — автор «заряжает» находку и кликает по кадру.
  const [planned, setPlanned] = useState([]);
  const [armed, setArmed] = useState(null); // индекс находки из плана

  // Второй проход: замечания рецензента и отметки «разобрано».
  const [review, setReview] = useState(null);
  const [dismissed, setDismissed] = useState(() => new Set());
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  const [selected, setSelected] = useState(null); // null | "new" | caseId
  const [status, setStatus] = useState(null);
  const [form, setForm] = useState(BLANK);
  // Сохранённый у кейса «типовой ответ чат-бота» (сигналы добросовестности).
  const [baseline, setBaseline] = useState(null);
  const [images, setImages] = useState([{ url: "", label: "" }]);
  const [findings, setFindings] = useState([]);

  const [activeImg, setActiveImg] = useState(0);
  const [tool, setTool] = useState("point");
  const [activeLabel, setActiveLabel] = useState(null);
  const [activeSig, setActiveSig] = useState("major");
  const [uploading, setUploading] = useState(false);

  const systemsByModality = useMemo(
    () => Object.fromEntries(systems.map((s) => [s.modality, s])),
    [systems],
  );
  const rs = systemsByModality[form.modality];
  const palette = rs?.findingPalette ?? [];
  const labelOf = useMemo(() => {
    const map = new Map(palette.map((t) => [t.key, t.label]));
    return (k) => map.get(k) ?? k;
  }, [palette]);

  useEffect(() => {
    (async () => {
      try {
        const [cfg, list] = await Promise.all([
          fetchReadingConfig(),
          fetchCases({ scope: "all" }),
        ]);
        setSystems(cfg.systems);
        setAiEnabled(cfg.aiEnabled);
        setCases(list);
      } catch (err) {
        if (isAuthError(err)) return navigate("/login");
        setError(readApiError(err, "Не удалось загрузить страницу"));
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  async function refreshList() {
    setCases(await fetchCases({ scope: "all" }));
  }

  function startNew() {
    setSelected("new");
    setStatus("draft");
    setForm(BLANK);
    setBaseline(null);
    setImages([{ url: "", label: "" }]);
    setFindings([]);
    setPlanned([]);
    setArmed(null);
    setReview(null);
    setDismissed(new Set());
    setActiveImg(0);
    setActiveLabel(null);
    setNotice(null);
    setError(null);
  }

  async function openCase(id) {
    setBusy(true);
    setError(null);
    try {
      const { case: doc } = await fetchCase(id);
      setSelected(id);
      setStatus(doc.status);
      setForm({
        modality: doc.modality,
        title: doc.title ?? "",
        clinicalContext: doc.clinicalContext ?? "",
        difficulty: doc.difficulty ?? "medium",
        timeLimitMin: doc.timeLimitSec ? String(Math.round(doc.timeLimitSec / 60)) : "",
        sourceKind: doc.source?.kind ?? "original",
        authority: doc.source?.authority ?? "",
        sourceUrl: doc.source?.url ?? "",
        licenseNote: doc.source?.licenseNote ?? "",
        deidentified: Boolean(doc.deidentified),
        correctText: doc.impression?.correctText ?? "",
        diagnosisKeys: (doc.impression?.diagnosisKeys ?? []).join(", "),
        diagnosisSynonyms: (doc.impression?.diagnosisSynonyms ?? []).join(", "),
      });
      setBaseline(doc.aiBaseline?.generatedAt ? doc.aiBaseline : null);
      setImages(doc.images?.length ? doc.images.map((i) => ({ url: i.url, label: i.label ?? "" })) : [{ url: "", label: "" }]);
      setFindings(
        (doc.findings ?? []).map((f) => ({
          key: f.key || newKey(),
          imageIndex: f.imageIndex,
          label: f.label,
          significance: f.significance ?? "major",
          geometry: f.geometry,
          explanation: f.explanation ?? "",
        })),
      );
      setPlanned([]);
      setArmed(null);
      setReview(null);
      setDismissed(new Set());
      setActiveImg(0);
      setActiveLabel(null);
      setNotice(null);
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, "Не удалось открыть кейс"));
    } finally {
      setBusy(false);
    }
  }

  function buildPayload() {
    return {
      modality: form.modality,
      title: form.title.trim(),
      clinicalContext: form.clinicalContext.trim(),
      difficulty: form.difficulty,
      // Лимит зачётной попытки: минуты в форме, секунды в API. Пусто — null,
      // тогда действует значение по станции из attemptPolicy.
      timeLimitSec:
        Number(form.timeLimitMin) > 0 ? Math.round(Number(form.timeLimitMin) * 60) : null,
      images: images
        .filter((i) => i.url.trim())
        .map((i) => ({
          url: i.url.trim(),
          label: i.label.trim() || undefined,
          width: i.width ?? undefined,
          height: i.height ?? undefined,
        })),
      findings: findings.map((f) => ({
        key: f.key,
        imageIndex: f.imageIndex,
        label: f.label,
        significance: f.significance,
        geometry: f.geometry,
        required: true,
        explanation: f.explanation?.trim() || undefined,
      })),
      impression: {
        correctText: form.correctText.trim(),
        diagnosisKeys: parseList(form.diagnosisKeys),
        diagnosisSynonyms: parseList(form.diagnosisSynonyms),
      },
      source: {
        kind: form.sourceKind,
        authority: form.authority.trim() || null,
        url: form.sourceUrl.trim() || null,
        licenseNote: form.licenseNote.trim() || null,
      },
      deidentified: form.deidentified,
    };
  }

  // Образец «типового ответа чат-бота» на этот кейс: нужен, чтобы замечать
  // дословно перенесённые заключения. На оценку не влияет.
  async function handleAiBaseline() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const saved = await generateCaseAiBaseline(selected);
      setBaseline(saved);
      setNotice("Типовой ответ ИИ сохранён у кейса.");
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, "Не удалось получить типовой ответ ИИ"));
    } finally {
      setBusy(false);
    }
  }

  async function handleSave() {
    if (!form.title.trim()) return setError("Введите название кейса");
    if (!images.some((i) => i.url.trim())) return setError("Добавьте хотя бы один снимок (URL)");
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const payload = buildPayload();
      if (selected === "new") {
        const doc = await createCase(payload);
        setNotice("Кейс создан как черновик.");
        await refreshList();
        await openCase(doc._id);
      } else {
        await updateCase(selected, payload);
        setNotice("Изменения сохранены.");
        await refreshList();
        await openCase(selected);
      }
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, "Не удалось сохранить кейс"));
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmitReview() {
    setBusy(true);
    setError(null);
    try {
      await submitCaseForReview(selected);
      setNotice("Кейс отправлен на ревью.");
      await refreshList();
      await openCase(selected);
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, "Не удалось отправить на ревью"));
    } finally {
      setBusy(false);
    }
  }

  async function handleReview(decision) {
    let reason;
    if (decision === "reject") {
      reason = window.prompt("Причина отклонения (вернётся автору):");
      if (!reason) return;
    }
    setBusy(true);
    setError(null);
    try {
      await reviewCase(selected, { decision, reason });
      setNotice(decision === "approve" ? "Кейс опубликован." : "Кейс отклонён.");
      await refreshList();
      await openCase(selected);
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, "Не удалось выполнить ревью"));
    } finally {
      setBusy(false);
    }
  }

  async function handleArchive() {
    if (!window.confirm("Убрать кейс в архив?")) return;
    setBusy(true);
    try {
      await archiveCase(selected);
      setNotice("Кейс в архиве.");
      await refreshList();
      await openCase(selected);
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, "Не удалось архивировать"));
    } finally {
      setBusy(false);
    }
  }

  // Загрузка снимка файлом: заполняем первую пустую строку URL-ом с сервера
  // или добавляем новую. Файл переэнкодится и деидентифицируется на сервере.
  async function handleUploadFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // позволить повторно выбрать тот же файл
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const { url, width, height } = await uploadCaseImage(file);
      // previewUrl — локальный object URL: холст показывает снимок сразу и не
      // зависит от того, публично ли читается объект в R2. В кейс сохраняется
      // именно серверный url; preview живёт только в этой сессии редактора.
      const previewUrl = URL.createObjectURL(file);
      setImages((prev) => {
        const img = { url, previewUrl, label: "", width, height };
        const firstEmpty = prev.findIndex((i) => !i.url.trim());
        if (firstEmpty >= 0) return prev.map((x, i) => (i === firstEmpty ? img : x));
        return [...prev, img];
      });
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, "Не удалось загрузить снимок"));
    } finally {
      setUploading(false);
    }
  }

  // ИИ-черновик по активному снимку. Заполняет ПУСТЫЕ поля (не затирая
  // введённое автором) и добавляет предложенные находки — всё как заготовку
  // для проверки экспертом.
  async function handleAiDraft() {
    const img = images[activeImg];
    if (!img?.url?.trim()) {
      setError("Сначала загрузите снимок — ИИ анализирует именно его");
      return;
    }
    setAiBusy(true);
    setError(null);
    setNotice(null);
    try {
      const draft = await aiDraftCase({
        imageUrl: img.url,
        modality: form.modality,
        hint: aiHint,
        imageIndex: activeImg,
      });
      setForm((f) => ({
        ...f,
        title: f.title.trim() ? f.title : draft.title,
        clinicalContext: f.clinicalContext.trim() ? f.clinicalContext : draft.clinicalContext,
        correctText: f.correctText.trim() ? f.correctText : draft.impression.correctText,
        diagnosisKeys: f.diagnosisKeys.trim()
          ? f.diagnosisKeys
          : (draft.impression.diagnosisKeys || []).join(", "),
        diagnosisSynonyms: f.diagnosisSynonyms.trim()
          ? f.diagnosisSynonyms
          : (draft.impression.diagnosisSynonyms || []).join(", "),
      }));
      setFindings((prev) => [
        ...prev,
        ...draft.findings.map((f) => ({ ...f, key: newKey() })),
      ]);
      setNotice(
        `ИИ предложил находок: ${draft.findings.length}. Это ЧЕРНОВИК — проверьте разметку, значимость и тексты, поправьте и только потом публикуйте.`,
      );
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, "ИИ не смог составить черновик"));
    } finally {
      setAiBusy(false);
    }
  }

  // ИИ-кейс ЦЕЛИКОМ по теме: снимка ещё нет, поэтому ИИ отдаёт текстовую часть
  // кейса и ПЛАН находок («что должно быть на снимке и где искать»). Форма
  // заполняется как новый черновик; уже загруженные снимки и разметка нового
  // черновика сохраняются, чтобы не потерять работу автора.
  async function handleAiGenerateCase() {
    if (aiTopic.trim().length < 3) {
      setError("Опишите тему кейса для ИИ (хотя бы несколько слов)");
      return;
    }
    setAiGenBusy(true);
    setError(null);
    setNotice(null);
    try {
      const draft = await aiGenerateCase({
        modality: form.modality,
        topic: aiTopic.trim(),
        difficulty: form.difficulty,
        hint: aiGenHint.trim() || undefined,
      });
      const wasNew = selected === "new";
      setSelected("new");
      setStatus("draft");
      setForm((f) => ({
        ...BLANK,
        modality: f.modality,
        title: draft.title ?? "",
        clinicalContext: draft.clinicalContext ?? "",
        difficulty: draft.difficulty ?? f.difficulty,
        // Происхождение помечаем честно: текстовая часть сгенерирована ИИ.
        sourceKind: "ai_generated",
        // Деидентификацию подтверждает только человек — и только по снимку.
        deidentified: wasNew ? f.deidentified : false,
        correctText: draft.impression?.correctText ?? "",
        diagnosisKeys: (draft.impression?.diagnosisKeys ?? []).join(", "),
        diagnosisSynonyms: (draft.impression?.diagnosisSynonyms ?? []).join(", "),
      }));
      if (!wasNew) {
        setImages([{ url: "", label: "" }]);
        setFindings([]);
        setActiveImg(0);
      }
      setPlanned(draft.plannedFindings ?? []);
      setArmed(null);
      setReview(null);
      setDismissed(new Set());
      // Второй проход сразу — к моменту чтения замечания уже будут.
      runVerify(draft.plannedFindings ?? [], wasNew ? findings : [], {
        ...form,
        title: draft.title ?? "",
        clinicalContext: draft.clinicalContext ?? "",
        correctText: draft.impression?.correctText ?? "",
        diagnosisKeys: (draft.impression?.diagnosisKeys ?? []).join(", "),
        diagnosisSynonyms: (draft.impression?.diagnosisSynonyms ?? []).join(", "),
      });
      setNotice(
        `ИИ составил кейс. Находок в плане: ${draft.plannedFindings?.length ?? 0}. Осталось загрузить анонимный снимок и разметить эти находки на нём (кнопка «разметить» в плане). Проверьте тексты и диагноз перед отправкой на ревью.`,
      );
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, "ИИ не смог сгенерировать кейс"));
    } finally {
      setAiGenBusy(false);
    }
  }

  // Второй проход. Проверяется медицинская суть: и ещё не размеченные
  // находки из плана ИИ, и уже поставленные на снимок — координаты
  // рецензенту не нужны, ему важны состав находок, их значимость и
  // согласованность с заключением.
  async function runVerify(plannedArg, findingsArg, formArg) {
    const usePlanned = plannedArg ?? planned;
    const useFindings = findingsArg ?? findings;
    const useForm = formArg ?? form;
    const all = [
      ...usePlanned.map((p) => ({
        label: p.label,
        significance: p.significance ?? "major",
        location: p.location || undefined,
        explanation: p.explanation || undefined,
      })),
      ...useFindings.map((f) => ({
        label: f.label,
        significance: f.significance ?? "major",
        explanation: f.explanation?.trim() || undefined,
      })),
    ];
    if (all.length === 0) {
      setError("Нечего проверять: нет ни находок в плане, ни размеченных");
      return;
    }
    setVerifyBusy(true);
    try {
      const res = await aiVerifyCase({
        modality: useForm.modality,
        draft: {
          title: useForm.title.trim() || undefined,
          clinicalContext: useForm.clinicalContext.trim() || undefined,
          plannedFindings: all,
          impression: {
            correctText: useForm.correctText.trim() || undefined,
            diagnosisKeys: parseList(useForm.diagnosisKeys),
            diagnosisSynonyms: parseList(useForm.diagnosisSynonyms),
          },
        },
      });
      setReview(res);
      setDismissed(new Set());
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, "Не удалось выполнить проверку ИИ"));
    } finally {
      setVerifyBusy(false);
    }
  }

  // Замечания к находке: модель может указать target кодом (pneumothorax)
  // или человеческим ярлыком («Пневмоторакс») — принимаем оба.
  function issuesForFinding(labelKey) {
    const byKey = issuesForRow(review, dismissed, labelKey);
    const byLabel = issuesForRow(review, dismissed, labelOf(labelKey));
    const seen = new Set(byKey.map((i) => i.index));
    return [...byKey, ...byLabel.filter((i) => !seen.has(i.index))];
  }

  // ─── Разметка эталона на холсте ───
  function handleCreate(ann) {
    // Если «заряжена» находка из плана ИИ — ставим именно её (с её значимостью
    // и пояснением) и убираем из плана: план — это чек-лист, а не эталон.
    if (armed !== null && planned[armed]) {
      const p = planned[armed];
      setError(null);
      setFindings((prev) => [
        ...prev,
        {
          key: newKey(),
          imageIndex: activeImg,
          label: p.label,
          significance: p.significance ?? "major",
          geometry: ann,
          explanation: p.explanation ?? "",
        },
      ]);
      setPlanned((prev) => prev.filter((_, i) => i !== armed));
      setArmed(null);
      return;
    }
    if (!activeLabel) {
      setError("Сначала выберите находку в палитре, затем отметьте её на снимке");
      return;
    }
    setError(null);
    setFindings((prev) => [
      ...prev,
      { key: newKey(), imageIndex: activeImg, label: activeLabel, significance: activeSig, geometry: ann, explanation: "" },
    ]);
  }
  function patchFinding(key, patch) {
    setFindings((prev) => prev.map((f) => (f.key === key ? { ...f, ...patch } : f)));
  }
  function removeFinding(key) {
    setFindings((prev) => prev.filter((f) => f.key !== key));
  }

  const editable = status === "draft" || status === "rejected";

  // Живой список препятствий к публикации — зеркалит collectPublishBlockers
  // на бэкенде. Считается на каждый рендер из текущей формы, поэтому баннер и
  // кнопка «Отправить на ревью» реагируют на правки сразу, а не показывают
  // состояние с момента загрузки кейса.
  const liveBlockers = [];
  if (!form.deidentified)
    liveBlockers.push("снимок не подтверждён как деидентифицированный");
  if (!images.some((i) => i.url.trim())) liveBlockers.push("нет ни одного кадра");
  if (
    ["public_government", "licensed"].includes(form.sourceKind) &&
    !form.authority.trim()
  )
    liveBlockers.push("для заимствованного материала не указан орган/издание");
  if (form.sourceKind === "licensed" && !form.licenseNote.trim())
    liveBlockers.push("для лицензионного материала не указаны условия");
  // Любое неразобранное замечание блокирует отправку на ревью: severity от
  // модели ненадёжна как предохранитель (см. комментарий в AiReviewPanel).
  const openIssues = unresolvedIssues(review, dismissed).length;
  if (openIssues > 0)
    liveBlockers.push(`разберите замечания рецензента (${openIssues})`);

  const editorAnn = findings
    .filter((f) => f.imageIndex === activeImg)
    .map((f) => ({ shape: f.geometry.shape, coords: f.geometry.coords, label: labelOf(f.label), color: sigColor(f.significance) }));

  if (loading) return <div className="rad-page"><div className="edu-state">Загрузка…</div></div>;

  return (
    <div className="rad-page" style={{ maxWidth: 1360 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
        <div>
          <h1 className="edu-title" style={{ marginBottom: 4 }}>Лучевая диагностика — кейсы</h1>
          <p className="edu-subtitle">Размечайте эталон прямо на снимке. Учащийся увидит кейс только после ревью и публикации.</p>
        </div>
        <button className="edu-btn" onClick={startNew}>➕ Новый кейс</button>
      </div>

      {error && <div className="edu-error" style={{ marginTop: 12 }}>{error}</div>}
      {notice && <div className="edu-notice" style={{ marginTop: 12 }}>{notice}</div>}

      {/* ИИ-кейс целиком по теме — доступно до выбора кейса, снимок не нужен */}
      <div className="rad-panel" style={{ marginTop: 16 }}>
        <div className="edu-card-title" style={{ fontSize: 15 }}>✨ Создать кейс с помощью ИИ (по теме)</div>
        {aiEnabled ? (
          <>
            <div className="edu-hint" style={{ marginBottom: 8 }}>
              Опишите тему — ИИ придумает весь кейс: клинический контекст, эталонное заключение,
              ключи диагноза и <b>план находок</b> (что должно быть на снимке и где искать).
              Точки на кадре ИИ не выдумывает: загрузите анонимный снимок и разметьте находки
              из плана одним кликом. Если снимок уже есть — используйте «Составить черновик по
              снимку» ниже: там ИИ смотрит именно на ваше изображение.
            </div>
            <div className="edu-form-row" style={{ alignItems: "flex-end" }}>
              <div style={{ flex: 2 }}>
                <div className="edu-field-label" style={{ marginTop: 0 }}>Тема кейса</div>
                <input
                  className="edu-input"
                  style={{ margin: 0 }}
                  placeholder="Напр.: правосторонний спонтанный пневмоторакс у молодого мужчины"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                />
              </div>
              <div>
                <div className="edu-field-label" style={{ marginTop: 0 }}>Модальность</div>
                <select
                  className="edu-select"
                  value={form.modality}
                  onChange={(e) => setForm((f) => ({ ...f, modality: e.target.value }))}
                  disabled={selected !== null && selected !== "new"}
                >
                  {systems.map((s) => (<option key={s.modality} value={s.modality}>{s.title}</option>))}
                </select>
              </div>
              <div>
                <div className="edu-field-label" style={{ marginTop: 0 }}>Сложность</div>
                <select className="edu-select" value={form.difficulty} onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}>
                  {DIFFICULTIES.map((d) => (<option key={d.key} value={d.key}>{d.label}</option>))}
                </select>
              </div>
            </div>
            <input
              className="edu-input"
              placeholder="Пожелания (необязательно): напр. «добавь случайную находку incidental»"
              value={aiGenHint}
              onChange={(e) => setAiGenHint(e.target.value)}
            />
            <div className="edu-btn-row" style={{ marginTop: 10 }}>
              <button type="button" className="edu-btn" onClick={handleAiGenerateCase} disabled={aiGenBusy || busy || verifyBusy}>
                {aiGenBusy ? "ИИ составляет кейс…" : "✨ Сгенерировать кейс целиком"}
              </button>
              {selected && (
                <button type="button" className="edu-btn edu-btn--ghost" onClick={() => runVerify()} disabled={aiGenBusy || busy || verifyBusy}>
                  {verifyBusy ? "рецензент проверяет…" : "🔍 Проверить текущий кейс"}
                </button>
              )}
              {selected && selected !== "new" && (
                <span className="edu-hint">Результат откроется как новый черновик — текущий кейс не изменится.</span>
              )}
            </div>
          </>
        ) : (
          <div className="edu-warn">
            ИИ выключен: на сервере не задан ANTHROPIC_API_KEY. Кейсы можно создавать вручную.
            Чтобы включить ИИ — добавьте ключ в .env и перезапустите сервер.
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px minmax(0,1fr)", gap: 20, marginTop: 16, alignItems: "start" }}>
        {/* ─── Список кейсов ─── */}
        <div className="rad-panel">
          <div className="edu-card-title" style={{ fontSize: 15 }}>Кейсы ({cases.length})</div>
          {cases.length === 0 && <div className="edu-hint">Пока нет ни одного кейса.</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
            {cases.map((c) => (
              <button
                key={c._id}
                type="button"
                className="edu-list-item"
                style={{ border: "1px solid #eef2f7", borderRadius: 8, textAlign: "left", background: selected === c._id ? "#eef4ff" : "#fff" }}
                onClick={() => openCase(c._id)}
              >
                <div className="edu-list-item-title">{c.title || "Без названия"}</div>
                <div className="edu-list-item-meta">
                  <span className="rad-tag">{MODALITY_LABELS[c.modality] ?? c.modality}</span>
                  {STATUS_LABELS[c.status] ?? c.status}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ─── Редактор ─── */}
        <div>
          {!selected ? (
            <div className="rad-panel"><div className="edu-hint">Выберите кейс слева или создайте новый.</div></div>
          ) : (
            <>
              <div className="rad-panel">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div className="edu-card-title" style={{ fontSize: 15, margin: 0 }}>
                    {selected === "new" ? "Новый кейс" : "Редактирование"} · {STATUS_LABELS[status] ?? status}
                  </div>
                  {liveBlockers.length > 0 && <span className="rad-fail" style={{ fontSize: 12 }}>к публикации: {liveBlockers.length} замечаний</span>}
                </div>
                {liveBlockers.length > 0 && (
                  <div className="edu-warn" style={{ marginTop: 8 }}>Опубликовать нельзя: {liveBlockers.join("; ")}.</div>
                )}

                <div className="edu-form-row" style={{ marginTop: 12 }}>
                  <div>
                    <div className="edu-field-label" style={{ marginTop: 0 }}>Модальность</div>
                    <select className="edu-select" value={form.modality} disabled={selected !== "new"} onChange={(e) => setForm((f) => ({ ...f, modality: e.target.value }))}>
                      {systems.map((s) => (<option key={s.modality} value={s.modality}>{s.title}</option>))}
                    </select>
                  </div>
                  <div>
                    <div className="edu-field-label" style={{ marginTop: 0 }}>Сложность</div>
                    <select className="edu-select" value={form.difficulty} onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}>
                      {DIFFICULTIES.map((d) => (<option key={d.key} value={d.key}>{d.label}</option>))}
                    </select>
                  </div>
                </div>

                <div className="edu-field-label">Название</div>
                <input className="edu-input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Напр.: Правосторонний пневмоторакс" />

                <div className="edu-field-label">Клинический контекст (виден учащемуся)</div>
                <textarea className="edu-textarea" rows={2} value={form.clinicalContext} onChange={(e) => setForm((f) => ({ ...f, clinicalContext: e.target.value }))} placeholder="Жалобы, анамнез…" />

                {/* Настройки зачётного режима: лимит времени и образец
                    «типового ответа чат-бота» для сигналов добросовестности. */}
                <div className="edu-form-row" style={{ marginTop: 12, alignItems: "flex-end" }}>
                  <div style={{ maxWidth: 220 }}>
                    <div className="edu-field-label" style={{ marginTop: 0 }}>
                      Лимит зачётной попытки, мин
                    </div>
                    <input
                      className="edu-input"
                      type="number"
                      min={1}
                      max={120}
                      value={form.timeLimitMin}
                      onChange={(e) => setForm((f) => ({ ...f, timeLimitMin: e.target.value }))}
                      placeholder="по умолчанию 7"
                    />
                  </div>
                  {selected !== "new" && (
                    <div style={{ flex: 1 }}>
                      <button
                        type="button"
                        className="edu-btn edu-btn--ghost"
                        onClick={handleAiBaseline}
                        disabled={busy}
                      >
                        {baseline?.generatedAt ? "Обновить типовой ответ ИИ" : "Сохранить типовой ответ ИИ"}
                      </button>
                      <div className="edu-hint" style={{ marginTop: 4 }}>
                        Один раз спрашиваем у модели, как она ответила бы на этот случай по
                        текстовому описанию, и храним ответ как образец. Дословное совпадение
                        заключения врача с ним будет видно в сигналах попытки. На оценку не
                        влияет.
                        {baseline?.generatedAt && (
                          <> Сохранён: {new Date(baseline.generatedAt).toLocaleString("ru-RU")}.</>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Снимки */}
              <div className="rad-panel">
                <div className="edu-card-title" style={{ fontSize: 15 }}>Снимки (URL анонимных изображений)</div>
                {images.map((img, i) => (
                  <div key={i} className="edu-form-row" style={{ marginTop: 8, alignItems: "center" }}>
                    <input className="edu-input" style={{ margin: 0 }} placeholder="https://… (PNG/JPEG)" value={img.url} onChange={(e) => setImages((prev) => prev.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
                    <input className="edu-input" style={{ margin: 0, maxWidth: 160 }} placeholder="Подпись (PA…)" value={img.label} onChange={(e) => setImages((prev) => prev.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                    {images.length > 1 && <button type="button" className="edu-btn edu-btn--danger" style={{ padding: "6px 10px" }} onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}>×</button>}
                  </div>
                ))}
                <div className="edu-btn-row" style={{ marginTop: 8, alignItems: "center" }}>
                  <label className="edu-btn" style={{ display: "inline-block", cursor: uploading ? "default" : "pointer" }}>
                    {uploading ? "Загрузка…" : "⬆ Загрузить снимок с компьютера"}
                    <input type="file" accept="image/png,image/jpeg,image/webp" style={{ display: "none" }} disabled={uploading} onChange={handleUploadFile} />
                  </label>
                  <button type="button" className="edu-btn edu-btn--ghost" onClick={() => setImages((prev) => [...prev, { url: "", label: "" }])}>Добавить строку URL</button>
                </div>
                <div className="edu-hint" style={{ marginTop: 6 }}>Файл переэнкодится и очищается от EXIF на сервере. Можно и вставить готовый URL уже деидентифицированного изображения.</div>
                {error && <div className="edu-error" style={{ marginTop: 8 }}>{error}</div>}
              </div>

              {/* ИИ-помощник: черновик кейса по снимку */}
              <div className="rad-panel">
                <div className="edu-card-title" style={{ fontSize: 15 }}>✨ Помощь ИИ</div>
                {aiEnabled ? (
                  <>
                    <div className="edu-hint" style={{ marginBottom: 8 }}>
                      ИИ разберёт загруженный снимок и предложит черновик: клинический контекст, находки с точками, эталонное заключение и диагноз. Пустые поля заполнятся, находки добавятся — вы проверяете и правите. Публикация всё равно через ревью.
                    </div>
                    <input
                      className="edu-input"
                      placeholder="Подсказка ИИ (необязательно): напр. «обратите внимание на правый верхний отдел»"
                      value={aiHint}
                      onChange={(e) => setAiHint(e.target.value)}
                    />
                    <div className="edu-btn-row" style={{ marginTop: 10 }}>
                      <button
                        type="button"
                        className="edu-btn"
                        onClick={handleAiDraft}
                        disabled={aiBusy || !images[activeImg]?.url?.trim()}
                      >
                        {aiBusy ? "ИИ анализирует снимок…" : "✨ Составить черновик по снимку"}
                      </button>
                    </div>
                    {!images[activeImg]?.url?.trim() && (
                      <div className="edu-hint" style={{ marginTop: 6 }}>Сначала загрузите снимок выше.</div>
                    )}
                  </>
                ) : (
                  <div className="edu-warn">
                    ИИ-помощник выключен: на сервере не задан ANTHROPIC_API_KEY. Кейсы можно создавать вручную. Чтобы включить ИИ — добавьте ключ в .env и перезапустите сервер.
                  </div>
                )}
              </div>

              {/* Разметка эталона */}
              <div className="rad-layout">
                <div className="rad-panel">
                  <div className="rad-tools">
                    <button type="button" className={`rad-chip ${tool === "pan" ? "rad-chip--on" : ""}`} onClick={() => setTool("pan")}>✋ Перемещать</button>
                    <button type="button" className={`rad-chip ${tool === "point" ? "rad-chip--on" : ""}`} onClick={() => setTool("point")}>• Точка</button>
                    <button type="button" className={`rad-chip ${tool === "rect" ? "rad-chip--on" : ""}`} onClick={() => setTool("rect")}>▭ Область</button>
                  </div>
                  <RadiologyCanvas imageUrl={images[activeImg]?.previewUrl || images[activeImg]?.url} annotations={editorAnn} mode="draw" tool={tool} onCreate={handleCreate} height={460} />
                  {images.filter((i) => i.url).length > 1 && (
                    <div className="rad-slices">
                      {images.map((img, i) => img.url ? (
                        <button key={i} type="button" className={`rad-slice ${i === activeImg ? "rad-slice--active" : ""}`} onClick={() => setActiveImg(i)}>{img.label || `Снимок ${i + 1}`}</button>
                      ) : null)}
                    </div>
                  )}
                </div>

                <div>
                  {/* План находок от ИИ: чек-лист, который автор переносит на снимок */}
                  {planned.length > 0 && (
                    <div className="rad-panel">
                      <div className="edu-card-title" style={{ fontSize: 15 }}>
                        ✨ План находок от ИИ ({planned.length})
                      </div>
                      <div className="edu-hint" style={{ marginBottom: 8 }}>
                        Нажмите «разметить» и кликните по нужному месту на снимке — находка
                        встанет в эталон вместе со значимостью и пояснением и уйдёт из плана.
                        Лишнее удаляйте: ИИ мог предложить то, чего на вашем снимке нет.
                      </div>
                      <div className="rad-marks">
                        {planned.map((p, i) => (
                          <div
                            key={`${p.label}_${i}`}
                            style={{
                              border: armed === i ? "1px solid #2563eb" : "1px solid #e6ecf3",
                              background: armed === i ? "#eef4ff" : "#fff",
                              borderRadius: 8,
                              padding: 8,
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                              <span>
                                <span style={{ color: sigColor(p.significance) }}>●</span> {labelOf(p.label)}
                              </span>
                              <span style={{ display: "flex", gap: 6 }}>
                                <button
                                  type="button"
                                  className="edu-btn edu-btn--ghost"
                                  style={{ padding: "2px 8px", fontSize: 12 }}
                                  onClick={() => setArmed(armed === i ? null : i)}
                                >
                                  {armed === i ? "отмена" : "разметить"}
                                </button>
                                <button
                                  type="button"
                                  className="edu-btn edu-btn--danger"
                                  style={{ padding: "2px 8px", fontSize: 12 }}
                                  onClick={() => {
                                    setPlanned((prev) => prev.filter((_, j) => j !== i));
                                    if (armed === i) setArmed(null);
                                  }}
                                >
                                  ×
                                </button>
                              </span>
                            </div>
                            {p.location && (
                              <div className="edu-hint" style={{ marginTop: 4 }}>Где искать: {p.location}</div>
                            )}
                            {p.explanation && (
                              <div className="edu-hint" style={{ marginTop: 2 }}>{p.explanation}</div>
                            )}
                            <AiRowIssues issues={issuesForFinding(p.label)} />
                          </div>
                        ))}
                      </div>
                      {armed !== null && (
                        <div className="edu-notice" style={{ marginTop: 8 }}>
                          Отметьте «{labelOf(planned[armed]?.label)}» на снимке выбранным инструментом.
                        </div>
                      )}
                    </div>
                  )}

                  <div className="rad-panel">
                    <div className="edu-card-title" style={{ fontSize: 15 }}>Находка для разметки</div>
                    <div className="edu-field-label" style={{ marginTop: 0 }}>Значимость</div>
                    <div className="rad-tools">
                      {SIGNIFICANCES.map((s) => (
                        <button key={s.key} type="button" className={`rad-chip ${activeSig === s.key ? "rad-chip--on" : ""}`} style={activeSig === s.key ? { background: s.color, borderColor: s.color } : { color: s.color, borderColor: s.color }} onClick={() => setActiveSig(s.key)}>{s.label}</button>
                      ))}
                    </div>
                    <div className="edu-field-label">Ярлык (выберите, затем отметьте на снимке)</div>
                    <div className="rad-palette">
                      {palette.map((t) => (
                        <button key={t.key} type="button" className={activeLabel === t.key ? "rad-palette--on" : ""} onClick={() => setActiveLabel(t.key)}>{t.label}</button>
                      ))}
                    </div>
                  </div>

                  {findings.length > 0 && (
                    <div className="rad-panel">
                      <div className="edu-card-title" style={{ fontSize: 15 }}>Размеченные находки ({findings.length})</div>
                      <div className="rad-marks">
                        {findings.map((f) => (
                          <div key={f.key} style={{ border: "1px solid #e6ecf3", borderRadius: 8, padding: 8 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span><span style={{ color: sigColor(f.significance) }}>●</span> {labelOf(f.label)} <small>· снимок {f.imageIndex + 1}</small></span>
                              <button type="button" className="edu-btn edu-btn--danger" style={{ padding: "2px 8px", fontSize: 12 }} onClick={() => removeFinding(f.key)}>×</button>
                            </div>
                            <input className="edu-input" style={{ marginTop: 6, fontSize: 13 }} placeholder="Пояснение (почему это патология) — покажется в разборе" value={f.explanation} onChange={(e) => patchFinding(f.key, { explanation: e.target.value })} />
                            <AiRowIssues issues={issuesForFinding(f.label)} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Замечания второго прохода */}
              <AiReviewPanel
                review={review}
                dismissed={dismissed}
                onDismiss={(i) => setDismissed((prev) => new Set(prev).add(i))}
                onRecheck={() => runVerify()}
                busy={verifyBusy}
              />

              {/* Заключение-эталон */}
              <div className="rad-panel">
                <div className="edu-card-title" style={{ fontSize: 15 }}>Эталонное заключение и диагноз</div>
                <div className="edu-field-label" style={{ marginTop: 0 }}>Заключение-образец</div>
                <textarea className="edu-textarea" rows={3} value={form.correctText} onChange={(e) => setForm((f) => ({ ...f, correctText: e.target.value }))} placeholder="Правильное описание картины — эталон для разбора и ИИ-оценки текста" />
                <div className="edu-form-row">
                  <div>
                    <div className="edu-field-label">Принятые ключи диагноза</div>
                    <input className="edu-input" value={form.diagnosisKeys} onChange={(e) => setForm((f) => ({ ...f, diagnosisKeys: e.target.value }))} placeholder="пневмоторакс, pneumothorax" />
                    <div className="edu-hint">Через запятую. Любой из них засчитывается как верный диагноз. Пишите простыми словами — учащийся вводит диагноз текстом.</div>
                  </div>
                  <div>
                    <div className="edu-field-label">Синонимы (для ИИ-оценки текста)</div>
                    <input className="edu-input" value={form.diagnosisSynonyms} onChange={(e) => setForm((f) => ({ ...f, diagnosisSynonyms: e.target.value }))} placeholder="коллапс лёгкого, спавшееся лёгкое" />
                  </div>
                </div>
              </div>

              {/* Происхождение и приватность */}
              <div className="rad-panel">
                <div className="edu-card-title" style={{ fontSize: 15 }}>Происхождение</div>
                <div className="edu-form-row">
                  <div>
                    <div className="edu-field-label" style={{ marginTop: 0 }}>Тип источника</div>
                    <select className="edu-select" value={form.sourceKind} onChange={(e) => setForm((f) => ({ ...f, sourceKind: e.target.value }))}>
                      {SOURCE_KINDS.map((s) => (<option key={s.key} value={s.key}>{s.label}</option>))}
                    </select>
                  </div>
                  <div>
                    <div className="edu-field-label" style={{ marginTop: 0 }}>Орган / издание</div>
                    <input className="edu-input" value={form.authority} onChange={(e) => setForm((f) => ({ ...f, authority: e.target.value }))} placeholder="Обязательно для заимствованного" />
                  </div>
                </div>
                <div className="edu-form-row">
                  <div>
                    <div className="edu-field-label">Ссылка на оригинал</div>
                    <input className="edu-input" value={form.sourceUrl} onChange={(e) => setForm((f) => ({ ...f, sourceUrl: e.target.value }))} placeholder="https://…" />
                  </div>
                  <div>
                    <div className="edu-field-label">Условия лицензии</div>
                    <input className="edu-input" value={form.licenseNote} onChange={(e) => setForm((f) => ({ ...f, licenseNote: e.target.value }))} placeholder="Для материала по лицензии" />
                  </div>
                </div>
                <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12, cursor: "pointer" }}>
                  <input type="checkbox" checked={form.deidentified} onChange={(e) => setForm((f) => ({ ...f, deidentified: e.target.checked }))} />
                  <span>Подтверждаю: снимки деидентифицированы (без ПД пациента). Без этого публикация запрещена.</span>
                </label>
              </div>

              {/* Действия */}
              <div className="rad-panel">
                <div className="edu-btn-row" style={{ flexWrap: "wrap" }}>
                  <button type="button" className="edu-btn" onClick={handleSave} disabled={busy}>{busy ? "Сохраняем…" : "Сохранить"}</button>
                  {selected !== "new" && editable && (
                    <button
                      type="button"
                      className="edu-btn edu-btn--ghost"
                      onClick={handleSubmitReview}
                      disabled={busy || liveBlockers.length > 0}
                      title={liveBlockers.length ? `Сначала устраните: ${liveBlockers.join("; ")}` : ""}
                    >
                      Отправить на ревью
                    </button>
                  )}
                  {status === "in_review" && (
                    <>
                      <button type="button" className="edu-btn" onClick={() => handleReview("approve")} disabled={busy}>Опубликовать</button>
                      <button type="button" className="edu-btn edu-btn--danger" onClick={() => handleReview("reject")} disabled={busy}>Отклонить</button>
                    </>
                  )}
                  {selected !== "new" && status !== "archived" && (
                    <button type="button" className="edu-btn edu-btn--ghost" onClick={handleArchive} disabled={busy}>В архив</button>
                  )}
                </div>
                {editable && liveBlockers.length > 0 && (
                  <div className="edu-hint" style={{ marginTop: 8 }}>
                    Чтобы отправить на ревью и опубликовать, устраните: {liveBlockers.join("; ")}.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
