// client/src/pages/admin/radiology/AdminLabCasesPage.jsx
//
// Админка → станция «Анализы». Маршрут: /admin/labs
// Авторинг лабораторных кейсов: клинический контекст + панель показателей
// (с отметкой значимых отклонений) + эталонное заключение и диагноз.

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchAllCases,
  fetchLabCase,
  createLabCase,
  updateLabCase,
  setLabStatus,
  deleteLabCasePermanently,
  aiGenerateLabCase,
  aiVerifyLabCase,
  aiAutofixLabCase,
  runLabCaseAgent,
  dismissLabAiIssues,
  generateLabAiBaseline,
  generateLabVariants,
  fetchReadingConfig,
} from "../../../api/radiology";
import { readApiError, isAuthError } from "../../../api/education";
import AiReviewPanel, {
  issuesForRow,
  AiRowIssues,
  AiRevisionPanel,
  unresolvedIssues,
  reviewBlocker,
  BlockerHint,
  isConnectionLost,
  AGENT_LOST_NOTICE,
} from "./AiReviewPanel";
import AdminCaseList, { STATUS_LABELS } from "./AdminCaseList";
import AgentReportPanel from "./AgentReportPanel";
import { waitForAgentRun, AGENT_TIMED_OUT_NOTICE } from "./agentRun";
import CaseTranslationsPanel from "./CaseTranslationsPanel";
import "../../education/education.css";
import "../../radiology/radiology.css";

const DIFFICULTIES = [
  { key: "easy", label: "Лёгкий" },
  { key: "medium", label: "Средний" },
  { key: "hard", label: "Сложный" },
];
const SOURCE_KINDS = [
  { key: "original", label: "Авторский материал" },
  { key: "public_government", label: "Официальный открытый" },
  { key: "licensed", label: "По лицензии" },
  { key: "ai_generated", label: "Сгенерирован ИИ" },
];
const parseList = (s) => String(s ?? "").split(/[\n,;]+/).map((x) => x.trim()).filter(Boolean);
const newKey = () => `k_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e4)}`;
const newRow = () => ({ key: newKey(), name: "", value: "", unit: "", refRange: "", significant: false });

const BLANK = {
  title: "",
  clinicalContext: "",
  difficulty: "medium",
  // Лимит времени зачётной попытки в минутах; пусто — значение по станции.
  timeLimitMin: "",
  sourceKind: "original",
  authority: "",
  sourceUrl: "",
  licenseNote: "",
  correctText: "",
  diagnosisKeys: "",
  diagnosisSynonyms: "",
};

export default function AdminLabCasesPage() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  const [selected, setSelected] = useState(null); // null | "new" | id
  const [status, setStatus] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [rows, setRows] = useState([newRow(), newRow()]);
  // Сохранённый у кейса «типовой ответ чат-бота» (для сигналов добросовестности).
  const [baseline, setBaseline] = useState(null);
  // Числовые варианты кейса (тот же диагноз, другие значения).
  const [variants, setVariants] = useState([]);
  const [variantsBusy, setVariantsBusy] = useState(false);

  // ИИ-генерация кейса целиком по теме.
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiHint, setAiHint] = useState("");
  const [aiDifficulty, setAiDifficulty] = useState("medium");

  // Второй проход: замечания рецензента и отметки «разобрано».
  const [review, setReview] = useState(null);
  const [dismissed, setDismissed] = useState(() => new Set());
  // Замечания, закрытые АГЕНТОМ, с обоснованием по каждому. Лежат рядом с
  // dismissed, а не внутри: гейт считает dismissed, а этот список отвечает
  // на другой вопрос — кто закрыл и почему.
  const [agentResolved, setAgentResolved] = useState([]);
  // Панель рецензента: якорь для прокрутки из списка блокеров и её подсветка.
  const reviewRef = useRef(null);
  const [reviewFlash, setReviewFlash] = useState(false);
  const [verifyBusy, setVerifyBusy] = useState(false);

  // Третий проход: что машина исправила сама и с чем не согласилась.
  // Хранится в кейсе (aiRevision), поэтому переживает перезагрузку страницы —
  // автор должен видеть, что цифры правил не человек, и через неделю тоже.
  const [revision, setRevision] = useState(null);
  const [fixBusy, setFixBusy] = useState(false);
  const [agentBusy, setAgentBusy] = useState(false);
  // Отчёт последнего прогона агента. Живёт отдельно от notice: тот висит
  // наверху страницы, а кнопку жмут внизу — сообщение о том, что агент
  // сделал и чего не смог, просто не попадало человеку на глаза.
  const [agentReport, setAgentReport] = useState(null);
  // Указание автора редактору: чем править и в какую сторону. Рецензент часто
  // предлагает два пути, и выбор между ними врачебный, а не редакторский.
  const [fixHint, setFixHint] = useState("");

  useEffect(() => {
    (async () => {
      try {
        // Настроен ли ИИ — тот же флаг, что у авторинга снимков.
        const [list, cfg] = await Promise.all([
          fetchAllCases("labs", { scope: "all" }).then((r) => r.items),
          fetchReadingConfig().catch(() => ({ aiEnabled: false })),
        ]);
        setCases(list);
        setAiEnabled(Boolean(cfg.aiEnabled));
      } catch (err) {
        if (isAuthError(err)) return navigate("/login");
        setError(readApiError(err, "Не удалось загрузить кейсы"));
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  async function refresh() {
    setCases(await fetchAllCases("labs", { scope: "all" }).then((r) => r.items));
  }

  function resetReview() {
    setReview(null);
    setDismissed(new Set());
    setAgentResolved([]);
    setRevision(null);
    setAgentReport(null);
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
    setAgentResolved(doc.aiReview.agentResolved ?? []);
  }

  function startNew() {
    setSelected("new");
    setStatus("draft");
    setForm(BLANK);
    setRows([newRow(), newRow()]);
    setVariants([]);
    resetReview();
    setNotice(null);
    setError(null);
  }

  async function openCase(id) {
    setBusy(true);
    setError(null);
    try {
      const { case: doc } = await fetchLabCase(id);
      setSelected(id);
      setStatus(doc.status);
      const sig = new Set(doc.significantAbnormal ?? []);
      setForm({
        title: doc.title ?? "",
        clinicalContext: doc.clinicalContext ?? "",
        difficulty: doc.difficulty ?? "medium",
        timeLimitMin: doc.timeLimitSec ? String(Math.round(doc.timeLimitSec / 60)) : "",
        sourceKind: doc.source?.kind ?? "original",
        authority: doc.source?.authority ?? "",
        sourceUrl: doc.source?.url ?? "",
        licenseNote: doc.source?.licenseNote ?? "",
        correctText: doc.impression?.correctText ?? "",
        diagnosisKeys: (doc.impression?.diagnosisKeys ?? []).join(", "),
        diagnosisSynonyms: (doc.impression?.diagnosisSynonyms ?? []).join(", "),
      });
      setBaseline(doc.aiBaseline?.generatedAt ? doc.aiBaseline : null);
      setVariants(doc.variants ?? []);
      setRows(
        (doc.panel?.length ? doc.panel : [newRow(), newRow()]).map((p) => ({
          key: p.key || newKey(),
          name: p.name ?? "",
          value: p.value ?? "",
          unit: p.unit ?? "",
          refRange: p.refRange ?? "",
          significant: sig.has(p.key),
        })),
      );
      restoreReview(doc);
      // Отчёт машинной правки живёт в кейсе рядом с рецензией: он объясняет,
      // почему цифры именно такие, и нужен ровно тогда, когда автор открыл
      // кейс заново, а не в тот момент, когда нажимал кнопку.
      setRevision(doc.aiRevision?.revisedAt ? doc.aiRevision : null);
      setNotice(null);
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, "Не удалось открыть кейс"));
    } finally {
      setBusy(false);
    }
  }

  // ИИ создаёт кейс целиком по теме и заполняет форму как НОВЫЙ черновик:
  // панель показателей, отметки значимых отклонений, заключение и диагноз.
  // Ничего не сохраняется — автор проверяет цифры и нажимает «Сохранить».
  async function handleAiGenerate() {
    if (aiTopic.trim().length < 3) {
      return setError("Опишите тему кейса для ИИ (хотя бы несколько слов)");
    }
    setAiBusy(true);
    setError(null);
    setNotice(null);
    try {
      const draft = await aiGenerateLabCase({
        topic: aiTopic.trim(),
        difficulty: aiDifficulty,
        hint: aiHint.trim() || undefined,
      });
      // Форму и запрос на проверку строим из ОДНОГО объекта: иначе легко
      // получить рецензию не на то, что видит автор.
      const nextRows = (draft.panel ?? []).map((p, i) => ({
        key: `ai_${Date.now().toString(36)}_${i}`,
        name: p.name ?? "",
        value: p.value ?? "",
        unit: p.unit ?? "",
        refRange: p.refRange ?? "",
        significant: Boolean(p.significant),
      }));
      const nextForm = {
        ...BLANK,
        title: draft.title ?? "",
        clinicalContext: draft.clinicalContext ?? "",
        difficulty: draft.difficulty ?? aiDifficulty,
        // Происхождение помечаем честно: материал сгенерирован ИИ.
        sourceKind: "ai_generated",
        correctText: draft.impression?.correctText ?? "",
        diagnosisKeys: (draft.impression?.diagnosisKeys ?? []).join(", "),
        diagnosisSynonyms: (draft.impression?.diagnosisSynonyms ?? []).join(", "),
      };
      setSelected("new");
      setStatus("draft");
      setForm(nextForm);
      setRows(nextRows);
      resetReview();
      const flagged = (draft.panel ?? []).filter((p) => p.significant).length;
      setNotice(
        `ИИ составил кейс: показателей ${draft.panel?.length ?? 0}, из них значимо отклонённых ${flagged}. Идёт проверка вторым проходом — замечания появятся ниже. Это ЧЕРНОВИК: проверьте значения, референсы и диагноз перед сохранением.`,
      );
      // Второй проход запускаем сразу: автор всё равно должен проверить кейс,
      // и лучше, чтобы к моменту его чтения замечания уже были.
      runVerify(nextRows, nextForm);
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, "ИИ не смог сгенерировать кейс"));
    } finally {
      setAiBusy(false);
    }
  }

  // Второй проход: отдельным запросом, а не внутри генерации. Так автор
  // видит заполненную форму через ~35 с, а не ждёт ~90 с пустой экран, и
  // сбой проверки не отменяет уже сгенерированный кейс.
  //
  // Проверяем ТО, ЧТО СЕЙЧАС В ФОРМЕ: после правок можно перепроверить, и
  // рецензируется версия автора, а не первоначальная выдача модели.
  async function runVerify(rowsArg, formArg) {
    const draft = draftFromForm(rowsArg, formArg);
    if (draft.panel.length < 2) {
      setError("Для проверки нужно минимум 2 заполненных показателя");
      return;
    }
    setVerifyBusy(true);
    try {
      const res = await aiVerifyLabCase({
        caseId: selected !== "new" ? selected : undefined,
        draft,
      });
      setReview(res);
      setDismissed(new Set());
      setAgentResolved([]);
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, "Не удалось выполнить проверку ИИ"));
    } finally {
      setVerifyBusy(false);
    }
  }

  // Черновик для ИИ из текущего состояния формы — общий для проверки и для
  // автоправки: рецензировать и править нужно одно и то же, иначе автор
  // получит правки к версии, которой не видел.
  function draftFromForm(rowsArg, formArg) {
    const useRows = rowsArg ?? rows;
    const useForm = formArg ?? form;
    return {
      title: useForm.title.trim() || undefined,
      clinicalContext: useForm.clinicalContext.trim() || undefined,
      panel: useRows
        .filter((r) => r.name.trim() && r.value.trim())
        .map((r) => ({
          name: r.name.trim(),
          value: r.value.trim(),
          unit: r.unit.trim() || undefined,
          refRange: r.refRange.trim() || undefined,
          significant: Boolean(r.significant),
        })),
      impression: {
        correctText: useForm.correctText.trim() || undefined,
        diagnosisKeys: parseList(useForm.diagnosisKeys),
        diagnosisSynonyms: parseList(useForm.diagnosisSynonyms),
      },
    };
  }

  // ТРЕТИЙ ПРОХОД: машина правит кейс по замечаниям и перепроверяет себя, пока
  // рецензия не станет чистой. Гейт публикации это не обходит — он считает
  // неразобранные замечания, а после чистой рецензии считать нечего.
  //
  // Сохранённый кейс сервер записывает САМ и возвращает уже сохранённую
  // версию: иначе чистая рецензия лежала бы в базе на кейсе, который автор
  // ещё не сохранил, и гейт открылся бы для неисправленных цифр.
  //
  // onlyIndex — номер одного замечания (кнопка «исправить» на его карточке).
  // Тогда правится ровно оно: там, где рецензент предлагает два пути, выбор
  // между ними врачебный, и делать его должен автор, а не редактор.
  async function handleAutofix(onlyIndex = null) {
    const draft = draftFromForm();
    if (draft.panel.length < 2) {
      return setError("Для автоправки нужно минимум 2 заполненных показателя");
    }
    const only =
      onlyIndex === null ? null : (review?.issues ?? []).filter((_, i) => i === onlyIndex);
    if (only && !only.length) return setError("Замечание не найдено — перепроверьте кейс");

    setFixBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await aiAutofixLabCase({
        caseId: selected !== "new" ? selected : undefined,
        draft,
        issues: only ?? undefined,
        hint: fixHint.trim() || undefined,
      });

      if (res.saved) {
        // Кейс уже в базе — перечитываем его оттуда. Ключи показателей
        // присвоил сервер (сопоставив имена со старой панелью), и брать их из
        // ответа значило бы держать в форме вторую версию правды.
        await refresh();
        await openCase(selected);
      } else {
        setForm((f) => ({
          ...f,
          title: res.draft.title ?? "",
          clinicalContext: res.draft.clinicalContext ?? "",
          difficulty: res.draft.difficulty ?? f.difficulty,
          correctText: res.draft.impression?.correctText ?? "",
          diagnosisKeys: (res.draft.impression?.diagnosisKeys ?? []).join(", "),
          diagnosisSynonyms: (res.draft.impression?.diagnosisSynonyms ?? []).join(", "),
        }));
        setRows(
          (res.draft.panel ?? []).map((p) => ({
            key: newKey(),
            name: p.name ?? "",
            value: p.value ?? "",
            unit: p.unit ?? "",
            refRange: p.refRange ?? "",
            significant: Boolean(p.significant),
          })),
        );
        setReview(res.review);
        setDismissed(new Set());
        setAgentResolved([]);
        setRevision({
          rounds: res.rounds?.length ?? 0,
          stoppedBy: res.stoppedBy,
          converged: res.converged,
          changes: res.changes ?? [],
          disputed: res.disputed ?? [],
        });
      }

      const left = res.review?.issues?.length ?? 0;
      setNotice(
        [
          res.converged
            ? `Готово: замечаний не осталось (кругов правки: ${res.rounds?.length ?? 0}).`
            : `Осталось замечаний: ${left} — ${
                res.stoppedBy === "no_progress"
                  ? "правка перестала их убирать, дальше нужен врач"
                  : res.stoppedBy === "error"
                    ? "цикл прервался ошибкой модели"
                    : "исчерпан лимит кругов"
              }.`,
          res.variantsStale
            ? "Числовые варианты считались по прежним цифрам — перегенерируйте их."
            : null,
          !res.saved ? "Кейс не сохранён: проверьте правки и нажмите «Сохранить»." : null,
          "Проверьте, что изменилось: ИИ правит ИИ, и «противоречий не осталось» не то же самое, что «верно».",
        ]
          .filter(Boolean)
          .join(" "),
      );
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, "Не удалось выполнить автоправку"));
    } finally {
      setFixBusy(false);
    }
  }

  function patchRow(i, patch) {
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }

  function buildPayload() {
    const panel = rows
      .filter((r) => r.name.trim() && r.value.trim())
      .map((r) => ({
        key: r.key,
        name: r.name.trim(),
        value: r.value.trim(),
        unit: r.unit.trim() || undefined,
        refRange: r.refRange.trim() || undefined,
      }));
    const significantAbnormal = rows
      .filter((r) => r.significant && r.name.trim() && r.value.trim())
      .map((r) => r.key);
    // Лимит времени: минуты в форме, секунды в API. Пусто — null, тогда
    // применяется значение по станции из attemptPolicy.
    const limitMin = Number(form.timeLimitMin);
    return {
      title: form.title.trim(),
      clinicalContext: form.clinicalContext.trim(),
      difficulty: form.difficulty,
      timeLimitSec: limitMin > 0 ? Math.round(limitMin * 60) : null,
      panel,
      significantAbnormal,
      variants,
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
    };
  }

  // Образец «типового ответа чат-бота» на этот кейс: нужен, чтобы замечать
  // дословно перенесённые заключения. На оценку не влияет.
  async function handleAiBaseline() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const saved = await generateLabAiBaseline(selected);
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
      await dismissLabAiIssues(selected, [...next]);
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, "Не удалось сохранить отметку «разобрано»"));
    }
  }

  // ВЕРНУТЬ замечание, которое закрыл агент. Без этого решение машины
  // необратимо через интерфейс: она закрыла — человек только читает. Кнопка
  // снимает отметку, и публикация снова ждёт его решения.
  async function handleReopen(index) {
    const next = new Set(dismissed);
    next.delete(index);
    setDismissed(next);
    setAgentResolved((prev) => prev.filter((r) => Number(r.index) !== index));
    if (selected === "new") return;
    try {
      await dismissLabAiIssues(selected, [...next]);
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, "Не удалось вернуть замечание в работу"));
    }
  }

  // Числовые варианты кейса от ИИ: тот же диагноз, другие значения. Нужны
  // против передачи ответов между врачами — пересказ «там значимы эти два
  // показателя» перестаёт работать, если у соседа другие цифры.
  async function handleVariants() {
    if (selected === "new") return setError("Сначала сохраните кейс");
    setVariantsBusy(true);
    setError(null);
    setNotice(null);
    try {
      const list = await generateLabVariants(selected, 2);
      setVariants(list);
      setNotice(`Сохранено вариантов: ${list.length}. Проверьте значения.`);
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, "Не удалось сгенерировать варианты"));
    } finally {
      setVariantsBusy(false);
    }
  }

  // Удаление варианта — правка кейса как обычно: сохранится по «Сохранить».
  function removeVariant(index) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  // ─── АГЕНТ-ДОВОДЧИК ───────────────────────────────────────────────────
  //
  // «Доделай и опубликуй»: агент правит текст циклом «правка → перепроверка» и
  // сам проходит гейт публикации, если после правки блокеров не осталось.
  //
  // Сохранение перед запуском обязательно, а не для удобства: агент читает
  // кейс ИЗ БАЗЫ, и правки, которые сейчас в форме, иначе не попали бы ни в
  // рецензию, ни в публикацию — опубликовалось бы одно, а на экране осталось
  // другое.
  //
  // Ставим и busy, и agentBusy: первый выключает соседние действия (публикацию
  // того, что прямо сейчас переписывается), второй нужен только для подписи на
  // самой кнопке.
  async function handleRunAgent() {
    if (selected === "new") return setError("Сначала сохраните кейс");
    setAgentBusy(true);
    setBusy(true);
    setError(null);
    setNotice(null);
    setAgentReport(null);
    try {
      await updateLabCase(selected, buildPayload());
      await runLabCaseAgent(selected, { hint: fixHint.trim() || undefined });

      // Запуск только ПОСТАВИЛ задачу — ждём её опросом кейса.
      const run = await waitForAgentRun({
        // fetch* отдаёт { case }, а опросу нужен сам кейс: без
        // разворачивания он не нашёл бы agentRun и вышел бы сразу.
        fetchCase: async () => (await fetchLabCase(selected)).case,
      });
      await refresh();
      await openCase(selected);

      if (run.timedOut) {
        setNotice(AGENT_TIMED_OUT_NOTICE);
        return;
      }
      if (run.error) {
        setError(run.error);
        return;
      }
      const r = run.report;
      if (!r) return;

      const parts = [];
      if (r.published) {
        parts.push(
          r.translation?.pending
            ? "Опубликовано — перевод на остальные языки продолжается в фоне."
            : "Опубликовано.",
        );
      } else if (r.stoppedBy === "already_published") {
        parts.push("Уже опубликовано.");
      } else if (r.blockers?.length) {
        parts.push(`Публиковать рано — осталось: ${r.blockers.join("; ")}.`);
      }
      if (r.fixed) {
        parts.push(
          r.converged
            ? `Замечаний не осталось (кругов правки: ${r.rounds?.length ?? 0}).`
            : `Осталось замечаний: ${r.review?.issues?.length ?? 0} (кругов: ${
                r.rounds?.length ?? 0
              }, остановка: ${r.stoppedBy}).`,
        );
      } else if (r.stoppedBy === "prerequisites") {
        parts.push("Модель не вызывалась — править было нечего.");
      }
      if (r.disputed?.length) {
        parts.push(
          `Редактор возразил по ${r.disputed.length} замечанию(-ям) — решение за вами.`,
        );
      }
      if (r.variantsStale) {
        parts.push("Значения менялись — числовые варианты стоит пересобрать.");
      }
      setAgentReport(r);
      setNotice(parts.join(" "));
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      // Оборванное соединение — не отказ: агент дорабатывает на сервере.
      // Показать здесь «Network Error» значило бы сказать врачу, что ничего
      // не произошло, ровно тогда, когда кейс публикуется.
      if (isConnectionLost(err)) setNotice(AGENT_LOST_NOTICE);
      else setError(readApiError(err, "Агент не смог доработать кейс"));
    } finally {
      setAgentBusy(false);
      setBusy(false);
    }
  }

  async function handleSave() {
    if (!form.title.trim()) return setError("Введите название кейса");
    if (rows.filter((r) => r.name.trim() && r.value.trim()).length < 2) {
      return setError("Заполните минимум 2 показателя");
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (selected === "new") {
        const doc = await createLabCase(buildPayload());
        setNotice("Кейс создан как черновик.");
        await refresh();
        await openCase(doc._id);
      } else {
        await updateLabCase(selected, buildPayload());
        setNotice("Изменения сохранены.");
        await refresh();
        await openCase(selected);
      }
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, "Не удалось сохранить кейс"));
    } finally {
      setBusy(false);
    }
  }

  // Удаление насовсем — в том числе для ночных автокейсов. Отказ сервера
  // (опубликован / есть попытки врачей) показываем как есть: там объяснено,
  // что делать вместо удаления.
  async function handleDeleteForever() {
    const name = form.title.trim() || "кейс без названия";
    if (!window.confirm(`Удалить «${name}» навсегда? Отменить это будет нельзя.`)) return;
    setBusy(true);
    setError(null);
    try {
      await deleteLabCasePermanently(selected);
      setSelected(null);
      setStatus(null);
      setNotice(`Кейс «${name}» удалён.`);
      await refresh();
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, "Не удалось удалить кейс"));
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(next) {
    setBusy(true);
    setError(null);
    try {
      await setLabStatus(selected, next);
      setNotice(
        next === "published" ? "Кейс опубликован." : next === "archived" ? "Кейс в архиве." : "Снят с публикации.",
      );
      await refresh();
      await openCase(selected);
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, "Не удалось изменить статус"));
    } finally {
      setBusy(false);
    }
  }

  // Панель ИИ-рецензента: по ссылке из списка блокеров сюда прокручивают и
  // на секунду подсвечивают — иначе после скролла неясно, куда смотреть.
  function focusReview() {
    reviewRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setReviewFlash(true);
    window.setTimeout(() => setReviewFlash(false), 1700);
  }

  // Живые замечания к публикации (зеркалит collectLabBlockers).
  const filledRows = rows.filter((r) => r.name.trim() && r.value.trim());
  const liveBlockers = [];
  if (filledRows.length < 2) liveBlockers.push("минимум 2 показателя");
  if (parseList(form.diagnosisKeys).length === 0) liveBlockers.push("укажите диагноз");
  if (["public_government", "licensed"].includes(form.sourceKind) && !form.authority.trim())
    liveBlockers.push("орган/издание для заимствованного");
  // Любое неразобранное замечание блокирует публикацию: severity от модели
  // ненадёжна как предохранитель (см. комментарий в AiReviewPanel).
  const openIssues = unresolvedIssues(review, dismissed).length;
  if (openIssues > 0)
    liveBlockers.push(reviewBlocker(openIssues));

  // Кнопка «Опубликовать» рисуется дважды — внизу формы и в подвале панели
  // рецензента, — поэтому собрана один раз здесь. Рядом счётчик неразобранных
  // замечаний: серая кнопка без цифры читается как сломанная.
  const publishBtn =
    selected !== "new" && status !== "published" ? (
      <>
        <button
          type="button"
          className="edu-btn"
          onClick={() => changeStatus("published")}
          disabled={busy || liveBlockers.length > 0}
          title={liveBlockers.length ? `Сначала устраните: ${liveBlockers.join("; ")}` : ""}
        >
          Опубликовать
        </button>
        {openIssues > 0 && (
          <button
            type="button"
            className="rad-gate-count"
            onClick={focusReview}
            title="Перейти к панели ИИ-рецензента"
          >
            осталось разобрать: {openIssues}
          </button>
        )}
      </>
    ) : null;

  if (loading) return <div className="rad-page"><div className="edu-state">Загрузка…</div></div>;

  return (
    <div className="rad-page" style={{ maxWidth: 1200 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
        <div>
          <h1 className="edu-title" style={{ marginBottom: 4 }}>Станция «Анализы» — кейсы</h1>
          <p className="edu-subtitle">Панель показателей + отметка значимых отклонений + эталонный диагноз.</p>
        </div>
        <button className="edu-btn" onClick={startNew}>➕ Новый кейс</button>
      </div>

      {error && <div className="edu-error" style={{ marginTop: 12 }}>{error}</div>}
      {notice && <div className="edu-notice" style={{ marginTop: 12 }}>{notice}</div>}

      {/* ИИ-генерация кейса целиком по теме */}
      <div className="rad-panel" style={{ marginTop: 16 }}>
        <div className="edu-card-title" style={{ fontSize: 15 }}>✨ Создать кейс с помощью ИИ</div>
        {aiEnabled ? (
          <>
            <div className="edu-hint" style={{ marginBottom: 8 }}>
              Опишите тему — ИИ придумает весь кейс: клинический контекст, панель анализов с
              референсами, отметки значимых отклонений, эталонное заключение и ключи диагноза.
              Форма заполнится как новый черновик; вы проверяете и сохраняете.
            </div>
            <div className="edu-form-row" style={{ alignItems: "flex-end" }}>
              <div style={{ flex: 2 }}>
                <div className="edu-field-label" style={{ marginTop: 0 }}>Тема кейса</div>
                <input
                  className="edu-input"
                  style={{ margin: 0 }}
                  placeholder="Напр.: железодефицитная анемия у молодой женщины"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                />
              </div>
              <div>
                <div className="edu-field-label" style={{ marginTop: 0 }}>Сложность</div>
                <select className="edu-select" value={aiDifficulty} onChange={(e) => setAiDifficulty(e.target.value)}>
                  {DIFFICULTIES.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
                </select>
              </div>
            </div>
            <input
              className="edu-input"
              placeholder="Пожелания (необязательно): напр. «добавь отвлекающие показатели в норме»"
              value={aiHint}
              onChange={(e) => setAiHint(e.target.value)}
            />
            <div className="edu-btn-row" style={{ marginTop: 10 }}>
              <button type="button" className="edu-btn" onClick={handleAiGenerate} disabled={aiBusy || busy || verifyBusy || fixBusy}>
                {aiBusy ? "ИИ составляет кейс…" : "✨ Сгенерировать кейс целиком"}
              </button>
              {selected && (
                <button type="button" className="edu-btn edu-btn--ghost" onClick={() => runVerify()} disabled={aiBusy || busy || verifyBusy || fixBusy}>
                  {verifyBusy ? "рецензент проверяет…" : "🔍 Проверить текущий кейс"}
                </button>
              )}
              {selected && (
                <button type="button" className="edu-btn edu-btn--ghost" onClick={() => handleAutofix()} disabled={aiBusy || busy || verifyBusy || fixBusy}>
                  {fixBusy ? "ИИ правит и перепроверяет…" : "🛠 Исправить замечания (ИИ)"}
                </button>
              )}
            </div>
            {selected && (
              <input
                className="edu-input"
                style={{ marginTop: 8 }}
                placeholder="Указание редактору (необязательно): напр. «ГГТП добавь в панель, а не убирай из разбора»"
                value={fixHint}
                onChange={(e) => setFixHint(e.target.value)}
              />
            )}
            {selected && (
              <div className="edu-hint" style={{ marginTop: 8 }}>
                «Исправить замечания» — это круг «правка → перепроверка», и он повторяется,
                пока рецензент не перестанет находить замечания (максимум два круга,
                несколько минут работы модели). Сохранённый кейс переписывается сразу:
                чистая рецензия должна относиться к тому, что лежит в базе. Публикацию это
                не проталкивает — гейт просто перестаёт что-либо считать, когда замечаний
                нет. Помните: правит и проверяет ОДНА модель, поэтому «противоречий не
                осталось» ≠ «кейс верен». Нужно исправить что-то одно — жмите «🛠 исправить»
                на самом замечании; указание выше действует и там.
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

      <div style={{ display: "grid", gridTemplateColumns: "280px minmax(0,1fr)", gap: 20, marginTop: 16, alignItems: "start" }}>
        {/* Список: опубликованные и неопубликованные врозь */}
        <AdminCaseList
          cases={cases}
          selected={selected}
          onOpen={openCase}
          emptyText="Пока нет кейсов."
          renderTags={(c) =>
            c.autoGen?.isAuto ? (
              <span className="rad-tag" title={c.autoGen.autoPublished ? "Создан и опубликован ночной автогенерацией" : "Создан ночной автогенерацией"}>🤖 авто</span>
            ) : null
          }
        />

        {/* Редактор */}
        <div>
          {!selected ? (
            <div className="rad-panel"><div className="edu-hint">Выберите кейс слева или создайте новый.</div></div>
          ) : (
            <>
              <div className="rad-panel">
                <div className="edu-card-title" style={{ fontSize: 15 }}>
                  {selected === "new" ? "Новый кейс" : "Редактирование"} · {STATUS_LABELS[status] ?? status}
                </div>
                <BlockerHint
                  className="edu-warn"
                  style={{ marginTop: 8 }}
                  prefix="Опубликовать нельзя:"
                  blockers={liveBlockers}
                  onFocusReview={focusReview}
                />
                <div className="edu-form-row" style={{ marginTop: 12 }}>
                  <div style={{ flex: 2 }}>
                    <div className="edu-field-label" style={{ marginTop: 0 }}>Название</div>
                    <input className="edu-input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Напр.: Анемия у молодой женщины" />
                  </div>
                  <div>
                    <div className="edu-field-label" style={{ marginTop: 0 }}>Сложность</div>
                    <select className="edu-select" value={form.difficulty} onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}>
                      {DIFFICULTIES.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
                    </select>
                  </div>
                </div>
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
                      placeholder="по умолчанию 5"
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
                        Один раз спрашиваем у модели, как она ответила бы на этот кейс, и
                        храним ответ как образец. Если заключение врача дословно совпадёт с
                        ним длинными цепочками, это будет видно в сигналах попытки. На
                        оценку не влияет.
                        {baseline?.generatedAt && (
                          <> Сохранён: {new Date(baseline.generatedAt).toLocaleString("ru-RU")}.</>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

{/* Числовые варианты: тот же диагноз, другие значения */}
              <div className="rad-panel">
                <div className="edu-card-title" style={{ fontSize: 15 }}>
                  Числовые варианты кейса
                </div>
                <div className="edu-hint">
                  Тот же диагноз, другие значения. Врачи получают варианты по кругу: первая
                  попытка — основной кейс, дальше варианты. Пересказ ответа коллеге
                  перестаёт работать, а повторный зачёт не повторяет тот же текст.
                  Вариант меняет только значения: набор показателей и диагноз остаются прежними.
                </div>
                <div className="edu-btn-row" style={{ marginTop: 8 }}>
                  <button
                    type="button"
                    className="edu-btn edu-btn--ghost"
                    onClick={handleVariants}
                    disabled={variantsBusy || selected === "new"}
                  >
                    {variantsBusy ? "ИИ считает…" : "Сгенерировать варианты (ИИ)"}
                  </button>
                </div>
                {variants.length === 0 ? (
                  <div className="edu-hint" style={{ marginTop: 8 }}>
                    Вариантов нет — все врачи видят одни и те же цифры.
                  </div>
                ) : (
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                    {variants.map((v, i) => (
                      <div key={`${v.label}_${i}`} className="rules-commit" style={{ marginTop: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                          <strong>{v.label || `Вариант ${i + 1}`}</strong>
                          <button
                            type="button"
                            className="edu-btn edu-btn--ghost"
                            style={{ padding: "2px 10px", fontSize: 12 }}
                            onClick={() => removeVariant(i)}
                          >
                            Удалить
                          </button>
                        </div>
                        {v.note && <div className="edu-hint">{v.note}</div>}
                        <div className="edu-hint" style={{ marginTop: 4 }}>
                          {(v.panel ?? []).map((p) => `${p.key}: ${p.value}${p.unit ? " " + p.unit : ""}`).join(" · ")}{(v.significantAbnormal ?? []).length > 0 && <> — значимо: {v.significantAbnormal.join(", ")}</>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Панель показателей */}
              <div className="rad-panel">
                <div className="edu-card-title" style={{ fontSize: 15 }}>Панель показателей</div>
                <div className="edu-hint" style={{ marginBottom: 8 }}>Отметьте «✓ значимо» у показателей, которые учащийся должен распознать как отклонение.</div>
                {rows.map((r, i) => (
                  <div key={r.key} style={{ marginTop: 8 }}>
                  <div className="edu-form-row" style={{ margin: 0, alignItems: "center" }}>
                    <input className="edu-input" style={{ margin: 0, flex: 2 }} placeholder="Показатель (Hb)" value={r.name} onChange={(e) => patchRow(i, { name: e.target.value })} />
                    <input className="edu-input" style={{ margin: 0, maxWidth: 100 }} placeholder="Значение" value={r.value} onChange={(e) => patchRow(i, { value: e.target.value })} />
                    <input className="edu-input" style={{ margin: 0, maxWidth: 80 }} placeholder="ед." value={r.unit} onChange={(e) => patchRow(i, { unit: e.target.value })} />
                    <input className="edu-input" style={{ margin: 0, maxWidth: 110 }} placeholder="Референс" value={r.refRange} onChange={(e) => patchRow(i, { refRange: e.target.value })} />
                    <label style={{ display: "flex", gap: 5, alignItems: "center", fontSize: 12, whiteSpace: "nowrap", cursor: "pointer" }}>
                      <input type="checkbox" checked={r.significant} onChange={(e) => patchRow(i, { significant: e.target.checked })} />
                      значимо
                    </label>
                    {rows.length > 1 && <button type="button" className="edu-btn edu-btn--danger" style={{ padding: "6px 10px" }} onClick={() => setRows((prev) => prev.filter((_, j) => j !== i))}>×</button>}
                  </div>
                  <AiRowIssues issues={issuesForRow(review, dismissed, r.name)} />
                  </div>
                ))}
                <button type="button" className="edu-btn edu-btn--ghost" style={{ marginTop: 8 }} onClick={() => setRows((prev) => [...prev, newRow()])}>Добавить показатель</button>
              </div>

              {/* Замечания второго прохода */}
              <AiReviewPanel
                review={review}
                dismissed={dismissed}
                onDismiss={handleDismiss}
                onRecheck={() => runVerify()}
                onFix={(index) => handleAutofix(index)}
                busy={verifyBusy}
                fixBusy={fixBusy}
                panelRef={reviewRef}
                flash={reviewFlash}
                agentResolved={agentResolved}
                onReopen={handleReopen}
                footer={publishBtn}
              />

              {/* Отчёт третьего прохода: что машина исправила сама */}
              <AiRevisionPanel revision={revision} />

              {/* Эталон */}
              <div className="rad-panel">
                <div className="edu-card-title" style={{ fontSize: 15 }}>Эталонное заключение и диагноз</div>
                <textarea className="edu-textarea" rows={3} value={form.correctText} onChange={(e) => setForm((f) => ({ ...f, correctText: e.target.value }))} placeholder="Правильная интерпретация панели" />
                <div className="edu-form-row">
                  <div>
                    <div className="edu-field-label">Принятые ключи диагноза</div>
                    <input className="edu-input" value={form.diagnosisKeys} onChange={(e) => setForm((f) => ({ ...f, diagnosisKeys: e.target.value }))} placeholder="жда, железодефицитная анемия" />
                    <div className="edu-hint">Через запятую, простыми словами.</div>
                  </div>
                  <div>
                    <div className="edu-field-label">Синонимы (для ИИ)</div>
                    <input className="edu-input" value={form.diagnosisSynonyms} onChange={(e) => setForm((f) => ({ ...f, diagnosisSynonyms: e.target.value }))} placeholder="анемия хронической болезни" />
                  </div>
                </div>
              </div>

              {/* Происхождение */}
              <div className="rad-panel">
                <div className="edu-card-title" style={{ fontSize: 15 }}>Происхождение</div>
                <div className="edu-form-row">
                  <div>
                    <div className="edu-field-label" style={{ marginTop: 0 }}>Тип источника</div>
                    <select className="edu-select" value={form.sourceKind} onChange={(e) => setForm((f) => ({ ...f, sourceKind: e.target.value }))}>
                      {SOURCE_KINDS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <div className="edu-field-label" style={{ marginTop: 0 }}>Орган / издание</div>
                    <input className="edu-input" value={form.authority} onChange={(e) => setForm((f) => ({ ...f, authority: e.target.value }))} placeholder="Обязательно для заимствованного" />
                  </div>
                </div>
              </div>

              {/* Переводы: у нового кейса панель не рисуется */}
              <CaseTranslationsPanel caseType="labs" caseId={selected} />

              {/* Действия */}
              <div className="rad-panel">
                <div className="edu-btn-row" style={{ flexWrap: "wrap" }}>
                  <button type="button" className="edu-btn" onClick={handleSave} disabled={busy}>{busy ? "Сохраняем…" : "Сохранить"}</button>
                  {selected !== "new" && status !== "published" && status !== "archived" && (
                    <button
                      type="button"
                      className="edu-btn"
                      onClick={handleRunAgent}
                      disabled={busy || verifyBusy || fixBusy}
                      title="Сохранит, вычистит замечания рецензента и опубликует, если гейт чист"
                    >
                      {agentBusy ? "Агент дорабатывает…" : "🤖 Запустить агента"}
                    </button>
                  )}
                  {publishBtn}
                  {status === "published" && (
                    <button type="button" className="edu-btn edu-btn--ghost" onClick={() => changeStatus("draft")} disabled={busy}>Снять с публикации</button>
                  )}
                  {selected !== "new" && status !== "archived" && (
                    <button type="button" className="edu-btn edu-btn--ghost" onClick={() => changeStatus("archived")} disabled={busy}>В архив</button>
                  )}
                  {/* Опубликованный кейс сервер удалить не даст — кнопку не
                      показываем, чтобы она не отвечала одним отказом. */}
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
                <AgentReportPanel report={agentReport} />
                <BlockerHint
                  style={{ marginTop: 8 }}
                  prefix="Для публикации:"
                  blockers={liveBlockers}
                  onFocusReview={focusReview}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
