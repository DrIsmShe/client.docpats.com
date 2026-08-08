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

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchReadingConfig,
  fetchAllCases,
  fetchCase,
  createCase,
  updateCase,
  submitCaseForReview,
  reviewCase,
  archiveCase,
  deleteCasePermanently,
  runRadiologyAutogen,
  stopRadiologyAutogen,
  setRadiologyNightlyAutogen,
  fetchRadiologyAutogenState,
  uploadCaseImage,
  aiDraftCase,
  aiGenerateCase,
  aiFindCaseImages,
  aiVerifyCase,
  dismissCaseAiIssues,
  generateCaseAiBaseline,
} from "../../../api/radiology";
import { readApiError, isAuthError } from "../../../api/education";
import RadiologyCanvas from "../../radiology/components/RadiologyCanvas";
import AiReviewPanel, {
  issuesForRow,
  AiRowIssues,
  unresolvedIssues,
} from "./AiReviewPanel";
import CaseTranslationsPanel from "./CaseTranslationsPanel";
import { MODALITY_LABELS } from "../../radiology/arenaLabels";
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
// Разделы автогенерации. Ключи те же, что на сервере (AUTOGEN_SCOPES в
// jobs/radiologyDailyCases.job.js).
//
// Раздельные кнопки нужны из-за разной судьбы кейсов: анализы и виртуальный
// пациент доходят до публикации сами, а лучевой кейс всегда остаётся
// черновиком и ждёт человека со снимком. Одна кнопка на всё означала, что за
// двумя лабораторными кейсами тянутся пять непроверенных лучевых.
const AUTOGEN_SCOPES = {
  all: {
    title: "все разделы",
    button: "🤖 Сгенерировать всё",
    confirm: "Сгенерировать кейсы по всем разделам — снимки, анализы, виртуальный пациент?",
  },
  radiology: {
    title: "снимки",
    button: "🩻 Только снимки",
    confirm: "Сгенерировать по кейсу-черновику на каждую лучевую модальность?",
  },
  labs: {
    title: "анализы",
    button: "🧪 Только анализы",
    confirm: "Сгенерировать кейс станции «Анализы»?",
  },
  vp: {
    title: "виртуальный пациент",
    button: "🧑‍⚕️ Только виртуальный пациент",
    confirm: "Сгенерировать кейс станции «Виртуальный пациент»?",
  },
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
  // Ночная автогенерация: метка у открытого кейса и ручной запуск.
  const [autoGen, setAutoGen] = useState(null);
  // Идёт ли прогон, решает сервер (autoRunning ниже): генерация переживает
  // перезагрузку страницы, а локальный флаг — нет.
  // Какой раздел генерируется сейчас: подсвечиваем кнопку именно его, а не
  // все четыре сразу.
  const [autoScope, setAutoScope] = useState(null);
  // Идёт ли прогон ПО ДАННЫМ СЕРВЕРА — не важно, кто его запустил: эта
  // вкладка, соседняя или ночной cron.
  const [autoRunning, setAutoRunning] = useState(false);
  const [autoStopping, setAutoStopping] = useState(false);
  // Включена ли НОЧНАЯ генерация. Отдельно от прогона: остановка прерывает
  // один прогон, а это выключатель расписания, живущий до отмены.
  const [nightly, setNightly] = useState(true);
  const [nightlyEnvOff, setNightlyEnvOff] = useState(false);
  const [nightlyBusy, setNightlyBusy] = useState(false);
  // Найденные в сети учебные снимки под тему кейса.
  const [imgBusy, setImgBusy] = useState(false);
  const [imgSources, setImgSources] = useState(null);
  // Сборка кейса одной кнопкой и её итог — сводка «что спросят и что зачтётся».
  const [oneClickBusy, setOneClickBusy] = useState(false);
  const [ready, setReady] = useState(null);
  const oneClickRef = useRef(null);
  const editorRef = useRef(null);
  // Подсказка автора для сборки в один клик: диагноз, находка, локализация,
  // анамнез. Необязательна и живёт отдельно от подсказки в «Помощи ИИ».
  const [oneClickHint, setOneClickHint] = useState("");

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
          fetchAllCases("radiology", { scope: "all" }).then((r) => r.items),
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

  // СОСТОЯНИЕ ПРОГОНА СПРАШИВАЕМ У СЕРВЕРА, А НЕ ПОМНИМ У СЕБЯ.
  //
  // Генерация идёт в процессе сервера и переживает и перезагрузку страницы, и
  // закрытие вкладки. Пока «Остановить» показывалась по локальному флагу, её
  // не было ровно тогда, когда она нужнее всего: прогон запустил ночной cron,
  // или страницу обновили посреди работы — кнопка исчезала, а генерация шла.
  //
  // Опрос раз в 8 секунд: прогон живёт минуты, чаще спрашивать не о чем.
  useEffect(() => {
    let alive = true;

    async function poll() {
      try {
        const state = await fetchRadiologyAutogenState();
        if (!alive) return;
        setAutoRunning(Boolean(state.running));
        setAutoStopping(Boolean(state.stopping));
        setAutoScope(state.scope ?? null);
        // nightlyEnabled приходит из базы, envEnabled — из .env сервера.
        // Второе жёстче: при выключенном .env кнопка в админке ничего не
        // решает, и владелец должен это видеть, а не гадать.
        setNightly(state.nightlyEnabled !== false);
        setNightlyEnvOff(state.envEnabled === false);
      } catch {
        // Молча: это фоновый опрос, и ошибка сети здесь не повод пугать
        // владельца красной плашкой поверх работающей страницы.
      }
    }

    poll();
    const id = setInterval(poll, 8000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  function resetReview() {
    setReview(null);
    setDismissed(new Set());
  }

  // Рецензия, сохранённая у кейса, восстанавливается вместе с ним: гейт
  // публикации живёт в кейсе, и перезагрузка страницы не должна его открывать.
  // Если рецензии нет — состояние чистим, иначе на новый кейс перенеслись бы
  // замечания предыдущего.
  function restoreReview(doc) {
    if (!doc?.aiReview?.generatedAt) return resetReview();
    setReview({
      verdict: doc.aiReview.verdict,
      issues: doc.aiReview.issues ?? [],
      errorCount: doc.aiReview.errorCount ?? 0,
      summary: doc.aiReview.summary ?? "",
    });
    setDismissed(new Set(doc.aiReview.dismissed ?? []));
  }

  async function refreshList() {
    setCases(await fetchAllCases("radiology", { scope: "all" }).then((r) => r.items));
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
    setAutoGen(null);
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
      // План находок теперь хранится в кейсе: у ночного автокейса он и есть
      // главное содержимое — чек-лист того, что предстоит разметить.
      setPlanned(
        (doc.plannedFindings ?? []).map((p) => ({
          label: p.label,
          significance: p.significance ?? "major",
          location: p.location ?? "",
          explanation: p.explanation ?? "",
        })),
      );
      setArmed(null);
      setAutoGen(doc.autoGen?.isAuto ? doc.autoGen : null);
      // Ссылки на снимки-кандидаты хранятся в самом кейсе: их положила ночная
      // генерация или прошлый ручной поиск. Показываем сразу при открытии —
      // иначе автор ищет заново то, что уже найдено и оплачено.
      setImgSources(
        doc.imageSources?.length
          ? { sources: doc.imageSources, advice: doc.imageSearchAdvice ?? "" }
          : null,
      );
      restoreReview(doc);
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
      // Неразмеченный остаток плана сохраняем вместе с кейсом: работу над
      // автокейсом почти всегда доделывают не за один заход.
      plannedFindings: planned.map((p) => ({
        label: p.label,
        significance: p.significance || undefined,
        location: p.location?.trim() || undefined,
        explanation: p.explanation?.trim() || undefined,
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

  // Отметка «разобрано» пишется на сервер: гейт публикации живёт в кейсе, и
  // локальная отметка без записи снова сделала бы его мягким.
  async function handleDismiss(index) {
    const next = new Set(dismissed);
    next.add(index);
    setDismissed(next);
    if (selected === "new") return;
    try {
      await dismissCaseAiIssues(selected, [...next]);
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, "Не удалось сохранить отметку «разобрано»"));
    }
  }

  // Снимок для сохранения ЧЕРНОВИКА не требуется: у кейса, придуманного ИИ по
  // теме (и у ночного автокейса), его ещё нет, а терять текстовую часть из-за
  // этого нельзя. Отсутствие кадра остаётся в liveBlockers — оно не пускает
  // кейс на ревью и в публикацию, но не мешает сохранить работу.
  async function handleSave() {
    if (!form.title.trim()) return setError("Введите название кейса");
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

  // Удаление НАСОВСЕМ. Отдельно от архива и с явным подтверждением: архив
  // прячет кейс, а это стирает его вместе с переводами. Сервер не даст
  // удалить опубликованный кейс и кейс с попытками врачей — его отказ
  // показываем как есть, там объяснено, что делать вместо удаления.
  async function handleDeleteForever() {
    const name = form.title.trim() || "кейс без названия";
    if (!window.confirm(`Удалить «${name}» навсегда? Отменить это будет нельзя.`)) return;
    setBusy(true);
    setError(null);
    try {
      await deleteCasePermanently(selected);
      setSelected(null);
      setStatus(null);
      setNotice(`Кейс «${name}» удалён.`);
      await refreshList();
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, "Не удалось удалить кейс"));
    } finally {
      setBusy(false);
    }
  }

  // Итог прогона человеческим языком.
  function describeRun(run) {
    if (!run) return "Прогон завершён.";
    const parts = [`создано черновиков: ${run.created?.length ?? 0}`];
    if (run.skipped?.length) {
      parts.push(
        `пропущено: ${run.skipped.map((s) => `${MODALITY_LABELS[s.modality] ?? s.modality} (${s.reason})`).join(", ")}`,
      );
    }
    if (run.failed?.length) {
      parts.push(
        `не получилось: ${run.failed.map((f) => `${MODALITY_LABELS[f.modality] ?? f.modality} — ${f.message}`).join("; ")}`,
      );
    }
    if (run.error) parts.push(`прогон прерван: ${run.error}`);
    return parts.join(". ") + ".";
  }

  // Ручной запуск ночной автогенерации. Сервер отвечает сразу и работает в
  // фоне (пять запросов к модели — это минуты, соединение столько не живёт),
  // поэтому итог забираем опросом состояния.
  async function handleRunAutogen(scope = "all") {
    const what = AUTOGEN_SCOPES[scope] ?? AUTOGEN_SCOPES.all;
    if (!window.confirm(`${what.confirm} Это займёт несколько минут.`)) return;

    // Не ждём ближайшего опроса: кнопки должны переключиться сразу, иначе
    // владелец успевает нажать второй раздел до первого ответа сервера.
    setAutoRunning(true);
    setAutoScope(scope);
    setError(null);
    setNotice(
      `🤖 Прогон запущен (${what.title}), ИИ работает. Можно не ждать на этой странице — черновики появятся в списке.`,
    );
    try {
      await runRadiologyAutogen(scope);
      // Опрос до окончания. Ограничение по числу попыток — страховка от
      // бесконечного цикла, если процесс на сервере перезапустится.
      for (let i = 0; i < 120; i += 1) {
        await new Promise((r) => setTimeout(r, 5000));
        const state = await fetchRadiologyAutogenState();
        if (!state.running) {
          await refreshList();
          setNotice(describeRun(state.lastRun));
          return;
        }
        setNotice(
          (state.stopping
            ? "🛑 Останавливаем: доделываем начатый кейс…"
            : `🤖 ИИ работает (${what.title})…`) +
            ` готово: ${state.lastRun?.created?.length ?? 0}.`,
        );
      }
      setNotice("🤖 Прогон идёт дольше обычного — обновите страницу позже, чтобы увидеть итог.");
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, "Не удалось выполнить автогенерацию"));
    } finally {
      setAutoScope(null);
    }
  }

  // Ночная генерация: выключатель расписания, а не остановка прогона.
  // Переживает перезапуск сервера — хранится в базе.
  async function handleToggleNightly() {
    const next = !nightly;
    if (
      !next &&
      !window.confirm(
        "Выключить ночную генерацию? Новые кейсы перестанут появляться сами, " +
          "пока вы не включите её обратно этой же кнопкой.",
      )
    ) {
      return;
    }
    setNightlyBusy(true);
    setError(null);
    try {
      const state = await setRadiologyNightlyAutogen(next);
      setNightly(state.nightlyEnabled !== false);
      setNotice(
        next
          ? "🌙 Ночная генерация включена: новые кейсы будут появляться по расписанию."
          : "🌙 Ночная генерация выключена. Ручные кнопки выше продолжают работать.",
      );
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, "Не удалось переключить ночную генерацию"));
    } finally {
      setNightlyBusy(false);
    }
  }

  // Остановка прогона. Начатый кейс доделается — прервать запрос к модели на
  // середине значит заплатить за ответ и выбросить его.
  async function handleStopAutogen() {
    try {
      const state = await stopRadiologyAutogen();
      setAutoStopping(Boolean(state.stopping));
      setNotice("🛑 Остановка запрошена: доделываем начатый кейс, остальные не начнём.");
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, "Не удалось остановить прогон"));
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
  // ОДНА КНОПКА: снимок → готовый кейс.
  //
  // Раньше то же самое собиралось из пяти отдельных действий: загрузить файл,
  // нажать «составить черновик», перенести находки, выбрать сложность,
  // запустить рецензента. Каждый шаг понятен по отдельности, но вместе они
  // требуют помнить порядок — и автор бросал кейс на середине.
  //
  // Отличие от «Составить черновик по снимку»: тот бережно заполняет только
  // ПУСТЫЕ поля, потому что дополняет работу автора. Здесь кейс собирается с
  // нуля, поэтому заполняется всё — и сложность, и разметка, и эталон.
  async function handleOneClickCase(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setOneClickBusy(true);
    setError(null);
    setReady(null);
    try {
      // 1. Снимок на сервер. Там же он переэнкодится и чистится от метаданных.
      setNotice("1/3 · Загружаю снимок…");
      const { url, width, height } = await uploadCaseImage(file);
      const previewUrl = URL.createObjectURL(file);
      const image = { url, previewUrl, label: "", width, height };
      setImages([image]);
      setActiveImg(0);

      // 2. ИИ смотрит на кадр и собирает кейс целиком: название, контекст,
      //    находки С КООРДИНАТАМИ, эталонное заключение и принимаемые
      //    варианты ответа.
      setNotice("2/3 · ИИ читает снимок и собирает кейс…");
      const draft = await aiDraftCase({
        imageUrl: url,
        modality: form.modality,
        // Подсказка из этой же панели, а не из «Помощи ИИ» ниже: та относится
        // к уже открытому кейсу и в сборке с нуля пуста.
        hint: oneClickHint.trim() || undefined,
        imageIndex: 0,
      });

      const nextForm = {
        ...BLANK,
        modality: form.modality,
        difficulty: draft.difficulty || "medium",
        title: draft.title,
        clinicalContext: draft.clinicalContext,
        correctText: draft.impression.correctText,
        diagnosisKeys: (draft.impression.diagnosisKeys || []).join(", "),
        diagnosisSynonyms: (draft.impression.diagnosisSynonyms || []).join(", "),
      };
      const nextFindings = draft.findings.map((f) => ({ ...f, key: newKey() }));

      setSelected("new");
      setForm(nextForm);
      setFindings(nextFindings);
      setPlanned([]);
      setAutoGen(null);
      setImgSources(null);

      // 3. Второй проход: тот же рецензент, что проверяет ночные автокейсы.
      //    Запускается сразу — иначе автор увидит «готово» и не узнает, что
      //    рецензент нашёл три замечания.
      setNotice("3/3 · Рецензент проверяет кейс…");
      // Кейс собран в форме и ещё не сохранён — id передавать нечего.
      await runVerify([], nextFindings, nextForm, null);

      setReady({
        findings: nextFindings.length,
        keys: (draft.impression.diagnosisKeys || []).length,
        synonyms: (draft.impression.diagnosisSynonyms || []).length,
      });
      setNotice(null);
      // Готовый кейс лежит ниже автогенерации и списка кейсов — сами к нему
      // не прокрутившись, автор видит только сводку и не понимает, где итог.
      scrollToEditor();
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, "Не удалось собрать кейс по снимку"));
      setNotice(null);
    } finally {
      setOneClickBusy(false);
    }
  }

  // Прокрутка к форме кейса. requestAnimationFrame — чтобы форма успела
  // отрисоваться после setForm/setFindings: до этого ref ещё пуст.
  function scrollToEditor() {
    requestAnimationFrame(() => {
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

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

  // Поиск снимков под тему.
  //
  // Закрывает разрыв, на котором работа и вставала: кейс ИИ придумывает
  // целиком, а снимка к нему нет и взяться ему неоткуда. Ищем по теме из поля
  // выше, а если оно пусто — по названию уже открытого кейса: чаще всего
  // снимок нужен именно к нему.
  async function handleFindImages() {
    const topic = aiTopic.trim() || form.title.trim();
    if (topic.length < 3) {
      setError("Опишите тему кейса или откройте кейс — по ней и будем искать снимок");
      return;
    }
    setImgBusy(true);
    setError(null);
    setNotice(null);
    setImgSources(null);
    try {
      const found = await aiFindCaseImages({
        topic,
        modality: form.modality,
        hint: aiGenHint.trim() || undefined,
        // Кейс уже сохранён — пусть сервер положит находки в него: поиск
        // стоит денег, и повторять его после каждой перезагрузки незачем.
        caseId: selected && selected !== "new" ? selected : undefined,
      });
      setImgSources(found);
      if (!found.sources.length) {
        setNotice("Готовых учебных случаев по этой теме не нашлось — смотрите совет ниже.");
      }
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, "Не удалось найти снимки"));
    } finally {
      setImgBusy(false);
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
  // caseIdArg: id сохранённого кейса. Передавайте его явно, если вызываете
  // runVerify из цепочки, которая только что сменила выбранный кейс —
  // состояние `selected` там ещё старое. null/"" означают «кейс не сохранён».
  async function runVerify(plannedArg, findingsArg, formArg, caseIdArg) {
    const usePlanned = plannedArg ?? planned;
    const useFindings = findingsArg ?? findings;
    const useForm = formArg ?? form;
    const verifyTargetId = selected && selected !== "new" ? selected : undefined;
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
        // Явно переданный id важнее подсмотренного в состоянии: вызов сразу
        // после setSelected видит ЕЩЁ СТАРОЕ значение (React применяет
        // состояние после обработчика). Отсюда прилетал caseId от прошлого
        // открытого кейса — или null, если не открывали ни одного.
        //
        // null здесь недопустим: сервер принимает строку или отсутствие поля,
        // а на null отвечает «Expected string, received null».
        caseId: caseIdArg !== undefined ? caseIdArg || undefined : verifyTargetId,
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

      {/* ГЛАВНЫЙ ВХОД: снимок → готовый кейс.
          Стоит первым и до всех остальных панелей намеренно — это тот путь,
          которым кейс заводится в девяти случаях из десяти. Всё, что ниже
          (генерация по теме, поиск снимка, ручная правка), остаётся для
          случаев, когда снимка ещё нет или кейс нужно доработать. */}
      <div className="rad-panel rad-oneclick" style={{ marginTop: 16 }}>
        <div className="rad-oneclick__head">
          <b>Загрузите снимок — соберу кейс целиком</b>
          <select
            className="edu-select"
            value={form.modality}
            onChange={(e) => setForm((f) => ({ ...f, modality: e.target.value }))}
            disabled={oneClickBusy}
            aria-label="Вид исследования"
          >
            {systems.map((s) => (
              <option key={s.modality} value={s.modality}>
                {s.title}
              </option>
            ))}
          </select>
        </div>

        <div className="edu-hint" style={{ marginTop: 6 }}>
          ИИ посмотрит на кадр и заполнит всё: название, клинический контекст,
          сложность, разметку находок прямо на снимке, эталонное заключение и
          список ответов, которые засчитываются учащемуся. Затем кейс проверит
          рецензент. Вам останется прочитать и решить — публиковать или нет.
        </div>

        {/* Необязательная подсказка. Сервер передаёт её модели с оговоркой
            «учти, но проверь по снимку»: подсказка направляет взгляд, но не
            обязывает подтвердить диагноз, которого на кадре нет. */}
        <div style={{ marginTop: 10 }}>
          <label className="edu-field-label" htmlFor="rad-oneclick-hint">
            Подсказка ИИ — по желанию
          </label>
          <input
            id="rad-oneclick-hint"
            className="edu-input"
            type="text"
            maxLength={500}
            value={oneClickHint}
            onChange={(e) => setOneClickHint(e.target.value)}
            disabled={oneClickBusy || busy}
            placeholder="Например: киста левой верхнечелюстной пазухи; смотреть на уровень жидкости"
          />
          <div className="edu-hint" style={{ marginTop: 4 }}>
            Можно оставить пустым. Если знаете диагноз, название находки, её
            локализацию или анамнез — напишите: ИИ учтёт это, но всё равно
            сверится со снимком и не подтвердит того, чего на кадре не видит.
          </div>
        </div>

        <input
          ref={oneClickRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: "none" }}
          onChange={handleOneClickCase}
          disabled={oneClickBusy || busy}
        />
        <div className="edu-btn-row" style={{ marginTop: 10 }}>
          <button
            type="button"
            className="edu-btn"
            onClick={() => oneClickRef.current?.click()}
            disabled={oneClickBusy || busy}
          >
            {oneClickBusy ? "Собираю кейс…" : "📷 Загрузить снимок и собрать кейс"}
          </button>
          {aiEnabled === false && (
            <span className="edu-hint">ИИ выключен: нет ANTHROPIC_API_KEY на сервере.</span>
          )}
        </div>

        {/* Сводка эталона: что именно спросят у учащегося и какой ответ
            система засчитает. Без неё автор видит только поля формы и не
            может проверить главное — совпадают ли принимаемые ответы с тем,
            что на снимке действительно есть. */}
        {ready && (
          <div className="rad-ready">
            <b>Кейс собран. Что увидит и сделает учащийся:</b>
            <ol className="rad-ready__list">
              <li>
                Прочитает клинический контекст и посмотрит на снимок — заключение и
                находки ему до ответа не показываются.
              </li>
              <li>
                Отметит находки на снимке: их размечено <b>{ready.findings}</b>.
                Засчитывается попадание в область каждой.
              </li>
              <li>
                Напишет заключение своими словами. Засчитываются{" "}
                <b>{ready.keys + ready.synonyms}</b> вариантов формулировки
                (ключи диагноза и синонимы — оба списка ниже в форме, правьте их
                как обычный текст).
              </li>
            </ol>
            <div className="edu-hint">
              Сам кейс — ниже на этой странице, в форме «Новый кейс»: снимок с
              разметкой, тексты, ответы и замечания рецензента. Проверьте их и
              нажмите «Сохранить» — до этого кейс живёт только в форме.
            </div>
            <button
              type="button"
              className="edu-btn"
              style={{ marginTop: 10 }}
              onClick={scrollToEditor}
            >
              ↓ Перейти к собранному кейсу
            </button>
          </div>
        )}
      </div>

      {/* Ночная автогенерация: что делает робот и как вмешаться руками. */}
      {aiEnabled && (
        <div className="rad-panel" style={{ marginTop: 16 }}>
          <div className="edu-card-title" style={{ fontSize: 15 }}>🤖 Автокейсы арены: каждую ночь по очередной теме</div>
          <div className="edu-hint">
            Ночью ИИ заводит по кейсу <b>на каждую модальность</b> (рентген, КТ, МРТ, УЗИ, ЭКГ)
            и по кейсу на станции <b>«Анализы»</b> и <b>«Виртуальный пациент»</b>, каждый раз беря
            следующую тему из программы. Всё проходит вторым проходом — ИИ-рецензентом.
            <br />
            <b>Станции без снимков</b> публикуются сами, если рецензент не нашёл замечаний;
            публикация тут же запускает перевод на все языки. Есть хоть одно замечание — кейс
            ждёт вас черновиком.
            <br />
            <b>Лучевые кейсы</b> всегда остаются черновиками: снимок ИИ не рисует. В черновике уже
            есть контекст, заключение, ключи диагноза и <b>план находок</b> — загрузите анонимный
            кадр и перенесите находки на холст. Галочку «снимки деидентифицированы» машина не
            ставит никогда: подтвердить это может только человек, который снимок видел.
            <br />
            Автокейсы помечены <span className="rad-tag">🤖 авто</span> в списках; любой можно
            править или удалить навсегда. Выключатели — в <code>.env</code> сервера
            (<code>RADIOLOGY_AUTOGEN</code>, <code>RADIOLOGY_AUTOGEN_PUBLISH</code>).
          </div>
          {/* Каждый раздел запускается отдельно: судьба кейсов у них разная,
              и тянуть пять лучевых черновиков ради одного лабораторного
              незачем. Пока идёт прогон, работает только «Остановить». */}
          <div className="edu-btn-row" style={{ marginTop: 10, flexWrap: "wrap", gap: 8 }}>
            {Object.entries(AUTOGEN_SCOPES).map(([key, s]) => (
              <button
                key={key}
                type="button"
                className="edu-btn edu-btn--ghost"
                onClick={() => handleRunAutogen(key)}
                disabled={autoRunning || busy || aiGenBusy}
                title={s.confirm}
              >
                {autoRunning && autoScope === key ? `${s.title}: ИИ работает…` : s.button}
              </button>
            ))}

            {/* Кнопка стоит здесь ВСЕГДА, а не только во время прогона.
                Пока она появлялась лишь на время работы, о самой возможности
                остановить генерацию нельзя было узнать, не запустив её.
                Состояние берётся с СЕРВЕРА: прогон мог начать ночной cron или
                соседняя вкладка — остановить нужно и такой. */}
            <button
              type="button"
              className="edu-btn edu-btn--danger"
              onClick={handleStopAutogen}
              disabled={!autoRunning || autoStopping}
              title={
                autoRunning
                  ? "Начатый кейс доделается, остальные не начнутся"
                  : "Сейчас генерация не идёт — останавливать нечего"
              }
            >
              {autoStopping ? "🛑 Останавливаем…" : "🛑 Остановить генерацию"}
            </button>
          </div>

          {/* ВЫКЛЮЧАТЕЛЬ РАСПИСАНИЯ — отдельно от остановки прогона.
              «Остановить» прерывает то, что идёт сейчас, и действует один
              раз; этот переключатель решает, будет ли генерация ночью, и
              держится до отмены. Раньше для этого приходилось править .env
              по SSH и перезапускать сервер. */}
          <div
            className="edu-btn-row"
            style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #e6eaf0" }}
          >
            <button
              type="button"
              className={`edu-btn ${nightly ? "edu-btn--danger" : ""}`}
              onClick={handleToggleNightly}
              disabled={nightlyBusy || nightlyEnvOff}
              title={
                nightlyEnvOff
                  ? "Выключено на сервере через RADIOLOGY_AUTOGEN=off — кнопка ничего не изменит"
                  : "Действует до тех пор, пока не включите обратно"
              }
            >
              {nightlyBusy
                ? "переключаем…"
                : nightly
                  ? "🌙 Выключить ночную генерацию"
                  : "🌙 Включить ночную генерацию"}
            </button>

            <span className="edu-hint">
              {nightlyEnvOff ? (
                <>
                  Ночная генерация выключена <b>на сервере</b> (RADIOLOGY_AUTOGEN=off).
                  Кнопка здесь ничего не изменит, пока это не снимут в .env.
                </>
              ) : nightly ? (
                <>
                  Сейчас: <b>кейсы заводятся каждую ночь</b> (06:20 по Баку). Ручные кнопки
                  выше работают независимо от этого.
                </>
              ) : (
                <>
                  Сейчас: <b>ночью ничего не генерируется</b>. Выключение переживает
                  перезапуск сервера — само не включится.
                </>
              )}
            </span>
          </div>

          <div className="edu-hint" style={{ marginTop: 6 }}>
            {autoStopping ? (
              "Остановка запрошена: доделываем начатый кейс, остальные не начнём."
            ) : autoRunning ? (
              <>
                <b>
                  Идёт генерация
                  {autoScope ? ` (${AUTOGEN_SCOPES[autoScope]?.title ?? autoScope})` : ""}.
                </b>{" "}
                Остановка срабатывает между кейсами: начатый доделается. Прервать запрос к
                модели на середине нельзя — ответ уже оплачен, и бросать его значит
                заплатить и не получить ничего.
              </>
            ) : (
              "Генерация сейчас не идёт. Кнопка остановки станет активной, когда запустится прогон — ваш или ночной."
            )}
          </div>
        </div>
      )}

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
              <button
                type="button"
                className="edu-btn edu-btn--ghost"
                onClick={handleFindImages}
                disabled={imgBusy || aiGenBusy || busy || verifyBusy}
                title="Найти в интернете учебные случаи со снимком по этой теме"
              >
                {imgBusy ? "ищем снимки…" : "🔎 Найти снимок в интернете"}
              </button>
              {selected && selected !== "new" && (
                <span className="edu-hint">Результат откроется как новый черновик — текущий кейс не изменится.</span>
              )}
            </div>

            {/* Найденные учебные случаи. Отдаём ССЫЛКИ, а не картинки:
                скачать, проверить лицензию, убедиться, что находка на кадре
                действительно та, и деидентифицировать — работа человека. */}
            {imgSources && (
              <div className="rad-panel" style={{ marginTop: 12, background: "#f8fafc" }}>
                <div className="edu-hint" style={{ marginBottom: 8 }}>
                  <b>Найдено случаев: {imgSources.sources.length}.</b> Проверьте лицензию перед
                  использованием: DocPats — коммерческий продукт, и материалы под CC BY-NC
                  в него помещать нельзя. Модель называет лицензию так, как её видит,
                  но последнее слово за вами.
                </div>

                {imgSources.sources.map((s, i) => (
                  <div key={i} className="rad-img-src">
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.title || s.url}
                    </a>
                    <div className="edu-hint">
                      {s.site}
                      {" · "}
                      <b
                        style={{
                          color:
                            s.match === "exact"
                              ? "#15803d"
                              : s.match === "close"
                                ? "#a16207"
                                : "#64748b",
                        }}
                      >
                        {s.match === "exact"
                          ? "точно по теме"
                          : s.match === "close"
                            ? "близко"
                            : "частично"}
                      </b>
                      {" · коммерчески: "}
                      <b
                        style={{
                          color:
                            s.commercialUse === "yes"
                              ? "#15803d"
                              : s.commercialUse === "no"
                                ? "#b91c1c"
                                : "#a16207",
                        }}
                      >
                        {s.commercialUse === "yes"
                          ? "можно"
                          : s.commercialUse === "no"
                            ? "НЕЛЬЗЯ"
                            : "неясно — проверьте"}
                      </b>
                    </div>
                    {s.whatIsShown && <div className="edu-hint">На снимке: {s.whatIsShown}</div>}
                    {s.matchNote && <div className="edu-hint">Отличия: {s.matchNote}</div>}
                    <div className="edu-hint">Лицензия: {s.license}</div>
                  </div>
                ))}

                {imgSources.advice && (
                  <div className="edu-hint" style={{ marginTop: 10 }}>
                    <b>Совет:</b> {imgSources.advice}
                  </div>
                )}
              </div>
            )}
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
                  {c.autoGen?.isAuto && <span className="rad-tag" title="Создан ночной автогенерацией">🤖 авто</span>}
                  {STATUS_LABELS[c.status] ?? c.status}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ─── Редактор ─── */}
        {/* Якорь: после сборки в один клик страница сама прокручивается сюда —
            иначе готовый кейс остаётся ниже экрана и его не видно. */}
        <div ref={editorRef}>
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
                {autoGen && (
                  <div className="edu-hint" style={{ marginTop: 8 }}>
                    🤖 Создан автоматически{autoGen.generatedAt ? ` ${new Date(autoGen.generatedAt).toLocaleDateString("ru-RU")}` : ""}
                    {autoGen.model ? ` (${autoGen.model})` : ""}. Это черновик от машины: проверьте
                    тексты и диагноз, загрузите снимок и разметьте план находок. Не подошёл — правьте
                    как обычный кейс или удалите навсегда.
                  </div>
                )}
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
                onDismiss={handleDismiss}
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

              {/* Переводы: у нового кейса панель не рисуется */}
              <CaseTranslationsPanel caseType="radiology" caseId={selected} />

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
                  {/* Удаление насовсем. Для опубликованного кейса не
                      показываем вовсе: сервер его всё равно не удалит, а
                      кнопка, которая всегда отвечает отказом, только мешает. */}
                  {selected !== "new" && status !== "published" && (
                    <button
                      type="button"
                      className="edu-btn edu-btn--danger"
                      onClick={handleDeleteForever}
                      disabled={busy}
                      title="Стереть кейс без следа. Если по нему уже есть попытки врачей — сервер откажет, используйте архив."
                    >
                      Удалить навсегда
                    </button>
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
