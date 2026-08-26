// client/src/pages/admin/radiology/AdminVpCasesPage.jsx
//
// Админка → «Виртуальный пациент». Маршрут: /admin/vp
// Авторинг сценариев: жалоба + список обследований (каждое с результатом и
// пометкой «нужное») + верный диагноз.

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchAllCases,
  fetchVpCase,
  createVpCase,
  updateVpCase,
  setVpStatus,
  deleteVpCasePermanently,
  aiGenerateVpCase,
  aiVerifyVpCase,
  aiAutofixVpCase,
  runVpCaseAgent,
  dismissVpAiIssues,
  generateVpAiBaseline,
  generateVpVariants,
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
const newKey = () => `i_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e4)}`;
const newInv = () => ({ key: newKey(), name: "", category: "", resultText: "", imageUrl: "", necessary: false });

const BLANK = {
  title: "",
  presentation: "",
  difficulty: "medium",
  // Лимит зачётной попытки в минутах; пусто — значение по станции.
  timeLimitMin: "",
  sourceKind: "original",
  authority: "",
  correctText: "",
  diagnosisKeys: "",
  diagnosisSynonyms: "",
};

export default function AdminVpCasesPage() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState(null);
  const [form, setForm] = useState(BLANK);
  // Сохранённый у кейса «типовой ответ чат-бота» (сигналы добросовестности).
  const [baseline, setBaseline] = useState(null);
  // Числовые варианты кейса (тот же диагноз, другие значения).
  const [variants, setVariants] = useState([]);
  const [variantsBusy, setVariantsBusy] = useState(false);
  const [invs, setInvs] = useState([newInv(), newInv()]);

  // ИИ-генерация сценария целиком по теме.
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
  // Хранится в кейсе (aiRevision) — переживает перезагрузку страницы.
  const [revision, setRevision] = useState(null);
  const [fixBusy, setFixBusy] = useState(false);
  const [agentBusy, setAgentBusy] = useState(false);
  // Отчёт последнего прогона агента. Живёт отдельно от notice: тот висит
  // наверху страницы, а кнопку жмут внизу — сообщение о том, что агент
  // сделал и чего не смог, просто не попадало человеку на глаза.
  const [agentReport, setAgentReport] = useState(null);
  // Указание автора редактору: чем править и в какую сторону.
  const [fixHint, setFixHint] = useState("");

  useEffect(() => {
    (async () => {
      try {
        // Настроен ли ИИ — тот же флаг, что у авторинга снимков.
        const [list, cfg] = await Promise.all([
          fetchAllCases("vp", { scope: "all" }).then((r) => r.items),
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
    setCases(await fetchAllCases("vp", { scope: "all" }).then((r) => r.items));
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
    setInvs([newInv(), newInv()]);
    setVariants([]);
    setBaseline(null);
    resetReview();
    setNotice(null);
    setError(null);
  }

  async function openCase(id) {
    setBusy(true);
    setError(null);
    try {
      const { case: doc } = await fetchVpCase(id);
      setSelected(id);
      setStatus(doc.status);
      setBaseline(doc.aiBaseline?.generatedAt ? doc.aiBaseline : null);
      setVariants(doc.variants ?? []);
      setForm({
        title: doc.title ?? "",
        presentation: doc.presentation ?? "",
        difficulty: doc.difficulty ?? "medium",
        timeLimitMin: doc.timeLimitSec ? String(Math.round(doc.timeLimitSec / 60)) : "",
        sourceKind: doc.source?.kind ?? "original",
        authority: doc.source?.authority ?? "",
        correctText: doc.diagnosis?.correctText ?? "",
        diagnosisKeys: (doc.diagnosis?.diagnosisKeys ?? []).join(", "),
        diagnosisSynonyms: (doc.diagnosis?.diagnosisSynonyms ?? []).join(", "),
      });
      setInvs(
        (doc.investigations?.length ? doc.investigations : [newInv(), newInv()]).map((i) => ({
          key: i.key || newKey(),
          name: i.name ?? "",
          category: i.category ?? "",
          resultText: i.resultText ?? "",
          imageUrl: i.imageUrl ?? "",
          necessary: Boolean(i.necessary),
        })),
      );
      restoreReview(doc);
      // Отчёт машинной правки живёт в кейсе рядом с рецензией: он объясняет,
      // почему данные именно такие, и нужен как раз тогда, когда автор открыл
      // сценарий заново.
      setRevision(doc.aiRevision?.revisedAt ? doc.aiRevision : null);
      setNotice(null);
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, "Не удалось открыть кейс"));
    } finally {
      setBusy(false);
    }
  }

  // ИИ создаёт сценарий целиком по теме: жалоба, список обследований с
  // результатами (нужные и лишние) и верный диагноз. Заполняет форму как новый
  // черновик — сохранение и публикация остаются за автором.
  async function handleAiGenerate() {
    if (aiTopic.trim().length < 3) {
      return setError("Опишите тему сценария для ИИ (хотя бы несколько слов)");
    }
    setAiBusy(true);
    setError(null);
    setNotice(null);
    try {
      const draft = await aiGenerateVpCase({
        topic: aiTopic.trim(),
        difficulty: aiDifficulty,
        hint: aiHint.trim() || undefined,
      });
      // Форму и запрос на проверку строим из ОДНОГО объекта: иначе легко
      // получить рецензию не на то, что видит автор.
      const nextInvs = (draft.investigations ?? []).map((inv, i) => ({
        key: `ai_${Date.now().toString(36)}_${i}`,
        name: inv.name ?? "",
        category: inv.category ?? "",
        resultText: inv.resultText ?? "",
        imageUrl: "",
        necessary: Boolean(inv.necessary),
      }));
      const nextForm = {
        ...BLANK,
        title: draft.title ?? "",
        presentation: draft.presentation ?? "",
        difficulty: draft.difficulty ?? aiDifficulty,
        // Происхождение помечаем честно: материал сгенерирован ИИ.
        sourceKind: "ai_generated",
        correctText: draft.diagnosis?.correctText ?? "",
        diagnosisKeys: (draft.diagnosis?.diagnosisKeys ?? []).join(", "),
        diagnosisSynonyms: (draft.diagnosis?.diagnosisSynonyms ?? []).join(", "),
      };
      setSelected("new");
      setStatus("draft");
      setForm(nextForm);
      setInvs(nextInvs);
      resetReview();
      const needed = (draft.investigations ?? []).filter((i) => i.necessary).length;
      setNotice(
        `ИИ составил сценарий: обследований ${draft.investigations?.length ?? 0}, из них нужных ${needed}. Идёт проверка вторым проходом — замечания появятся ниже. Это ЧЕРНОВИК: проверьте результаты и диагноз перед сохранением.`,
      );
      // Второй проход запускаем сразу — к моменту чтения замечания уже будут.
      runVerify(nextInvs, nextForm);
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, "ИИ не смог сгенерировать сценарий"));
    } finally {
      setAiBusy(false);
    }
  }

  // Второй проход отдельным запросом: автор сразу видит заполненную форму,
  // а сбой проверки не отменяет сгенерированный сценарий. Рецензируется то,
  // что сейчас в форме, — можно перепроверить после правок.
  async function runVerify(invsArg, formArg) {
    const useInvs = invsArg ?? invs;
    const useForm = formArg ?? form;
    const investigations = useInvs
      .filter((i) => i.name.trim())
      .map((i) => ({
        name: i.name.trim(),
        category: i.category.trim() || undefined,
        resultText: i.resultText.trim() || undefined,
        necessary: Boolean(i.necessary),
      }));
    if (investigations.length < 2) {
      setError("Для проверки нужно минимум 2 обследования");
      return;
    }
    setVerifyBusy(true);
    try {
      const res = await aiVerifyVpCase({
        caseId: selected !== "new" ? selected : undefined,
        draft: {
          title: useForm.title.trim() || undefined,
          presentation: useForm.presentation.trim() || undefined,
          investigations,
          diagnosis: {
            correctText: useForm.correctText.trim() || undefined,
            diagnosisKeys: parseList(useForm.diagnosisKeys),
            diagnosisSynonyms: parseList(useForm.diagnosisSynonyms),
          },
        },
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

  // ТРЕТИЙ ПРОХОД: машина правит сценарий по замечаниям и перепроверяет себя,
  // пока рецензия не станет чистой. Гейт публикации это не обходит — он
  // считает неразобранные замечания, а после чистой рецензии считать нечего.
  //
  // Сохранённый сценарий сервер переписывает САМ (и сам восстанавливает ключи
  // обследований по названиям): иначе чистая рецензия лежала бы в базе на
  // версии, которой автор ещё не сохранял.
  //
  // onlyIndex — номер одного замечания (кнопка «исправить» на его карточке):
  // тогда правится ровно оно, а не всё сразу.
  async function handleAutofix(onlyIndex = null) {
    const investigations = invs
      .filter((i) => i.name.trim())
      .map((i) => ({
        name: i.name.trim(),
        category: i.category.trim() || undefined,
        resultText: i.resultText.trim() || undefined,
        necessary: Boolean(i.necessary),
      }));
    if (investigations.length < 2) {
      return setError("Для автоправки нужно минимум 2 обследования");
    }
    const only =
      onlyIndex === null ? null : (review?.issues ?? []).filter((_, i) => i === onlyIndex);
    if (only && !only.length) return setError("Замечание не найдено — перепроверьте сценарий");

    setFixBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await aiAutofixVpCase({
        caseId: selected !== "new" ? selected : undefined,
        issues: only ?? undefined,
        hint: fixHint.trim() || undefined,
        draft: {
          title: form.title.trim() || undefined,
          presentation: form.presentation.trim() || undefined,
          investigations,
          diagnosis: {
            correctText: form.correctText.trim() || undefined,
            diagnosisKeys: parseList(form.diagnosisKeys),
            diagnosisSynonyms: parseList(form.diagnosisSynonyms),
          },
        },
      });

      if (res.saved) {
        await refresh();
        await openCase(selected);
      } else {
        setForm((f) => ({
          ...f,
          title: res.draft.title ?? "",
          presentation: res.draft.presentation ?? "",
          difficulty: res.draft.difficulty ?? f.difficulty,
          correctText: res.draft.diagnosis?.correctText ?? "",
          diagnosisKeys: (res.draft.diagnosis?.diagnosisKeys ?? []).join(", "),
          diagnosisSynonyms: (res.draft.diagnosis?.diagnosisSynonyms ?? []).join(", "),
        }));
        setInvs(
          (res.draft.investigations ?? []).map((i) => ({
            key: newKey(),
            name: i.name ?? "",
            category: i.category ?? "",
            resultText: i.resultText ?? "",
            imageUrl: "",
            necessary: Boolean(i.necessary),
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
          res.variantsStale ? "Варианты сценария считались по прежним данным — перегенерируйте их." : null,
          !res.saved ? "Сценарий не сохранён: проверьте правки и нажмите «Сохранить»." : null,
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

  function patchInv(i, patch) {
    setInvs((prev) => prev.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  }

  function buildPayload() {
    return {
      title: form.title.trim(),
      presentation: form.presentation.trim(),
      difficulty: form.difficulty,
      variants,
      timeLimitSec: Number(form.timeLimitMin) > 0 ? Math.round(Number(form.timeLimitMin) * 60) : null,
      investigations: invs
        .filter((i) => i.name.trim())
        .map((i) => ({
          key: i.key,
          name: i.name.trim(),
          category: i.category.trim() || undefined,
          resultText: i.resultText.trim() || undefined,
          imageUrl: i.imageUrl.trim() || null,
          necessary: i.necessary,
        })),
      diagnosis: {
        correctText: form.correctText.trim(),
        diagnosisKeys: parseList(form.diagnosisKeys),
        diagnosisSynonyms: parseList(form.diagnosisSynonyms),
      },
      source: { kind: form.sourceKind, authority: form.authority.trim() || null },
    };
  }

  // Образец «типового ответа чат-бота» на этот кейс: нужен, чтобы замечать
  // дословно перенесённые заключения. На оценку не влияет.
  async function handleAiBaseline() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const saved = await generateVpAiBaseline(selected);
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
      await dismissVpAiIssues(selected, [...next]);
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
      await dismissVpAiIssues(selected, [...next]);
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
      const list = await generateVpVariants(selected, 2);
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
  // сценарий ИЗ БАЗЫ, и правки, которые сейчас в форме, иначе не попали бы ни в
  // рецензию, ни в публикацию — опубликовалось бы одно, а на экране осталось
  // другое.
  //
  // Ставим и busy, и agentBusy: первый выключает соседние действия (публикацию
  // того, что прямо сейчас переписывается), второй нужен только для подписи на
  // самой кнопке.
  async function handleRunAgent() {
    if (selected === "new") return setError("Сначала сохраните сценарий");
    setAgentBusy(true);
    setBusy(true);
    setError(null);
    setNotice(null);
    setAgentReport(null);
    try {
      await updateVpCase(selected, buildPayload());
      const r = await runVpCaseAgent(selected, { hint: fixHint.trim() || undefined });

      await refresh();
      await openCase(selected);

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
      // не произошло, ровно тогда, когда сценарий публикуется.
      if (isConnectionLost(err)) setNotice(AGENT_LOST_NOTICE);
      else setError(readApiError(err, "Агент не смог доработать сценарий"));
    } finally {
      setAgentBusy(false);
      setBusy(false);
    }
  }

  async function handleSave() {
    if (!form.title.trim()) return setError("Введите название");
    if (invs.filter((i) => i.name.trim()).length < 2) return setError("Добавьте минимум 2 обследования");
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (selected === "new") {
        const doc = await createVpCase(buildPayload());
        setNotice("Кейс создан как черновик.");
        await refresh();
        await openCase(doc._id);
      } else {
        await updateVpCase(selected, buildPayload());
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

  // Удаление насовсем — в том числе для ночных автосценариев. Отказ сервера
  // (опубликован / есть попытки врачей) показываем как есть.
  async function handleDeleteForever() {
    const name = form.title.trim() || "сценарий без названия";
    if (!window.confirm(`Удалить «${name}» навсегда? Отменить это будет нельзя.`)) return;
    setBusy(true);
    setError(null);
    try {
      await deleteVpCasePermanently(selected);
      setSelected(null);
      setStatus(null);
      setNotice(`Сценарий «${name}» удалён.`);
      await refresh();
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, "Не удалось удалить сценарий"));
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(next) {
    setBusy(true);
    setError(null);
    try {
      await setVpStatus(selected, next);
      setNotice(next === "published" ? "Кейс опубликован." : next === "archived" ? "Кейс в архиве." : "Снят с публикации.");
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

  const filledInvs = invs.filter((i) => i.name.trim());
  const liveBlockers = [];
  if (filledInvs.length < 2) liveBlockers.push("минимум 2 обследования");
  if (!filledInvs.some((i) => i.necessary)) liveBlockers.push("отметьте нужное обследование");
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
          <h1 className="edu-title" style={{ marginBottom: 4 }}>«Виртуальный пациент» — кейсы</h1>
          <p className="edu-subtitle">Жалоба + обследования (с результатами и пометкой «нужное») + верный диагноз.</p>
        </div>
        <button className="edu-btn" onClick={startNew}>➕ Новый кейс</button>
      </div>

      {error && <div className="edu-error" style={{ marginTop: 12 }}>{error}</div>}
      {notice && <div className="edu-notice" style={{ marginTop: 12 }}>{notice}</div>}

      {/* ИИ-генерация сценария целиком по теме */}
      <div className="rad-panel" style={{ marginTop: 16 }}>
        <div className="edu-card-title" style={{ fontSize: 15 }}>✨ Создать сценарий с помощью ИИ</div>
        {aiEnabled ? (
          <>
            <div className="edu-hint" style={{ marginBottom: 8 }}>
              Опишите тему — ИИ придумает весь сценарий: жалобу и анамнез, набор обследований
              с результатами (нужные и лишние — чтобы игроку было из чего выбирать) и верный
              диагноз. Форма заполнится как новый черновик; вы проверяете и сохраняете.
            </div>
            <div className="edu-form-row" style={{ alignItems: "flex-end" }}>
              <div style={{ flex: 2 }}>
                <div className="edu-field-label" style={{ marginTop: 0 }}>Тема сценария</div>
                <input
                  className="edu-input"
                  style={{ margin: 0 }}
                  placeholder="Напр.: одышка и кашель у курильщика 60 лет"
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
              placeholder="Пожелания (необязательно): напр. «сделай сложным дифдиагноз с ТЭЛА»"
              value={aiHint}
              onChange={(e) => setAiHint(e.target.value)}
            />
            <div className="edu-btn-row" style={{ marginTop: 10 }}>
              <button type="button" className="edu-btn" onClick={handleAiGenerate} disabled={aiBusy || busy || verifyBusy || fixBusy}>
                {aiBusy ? "ИИ составляет сценарий…" : "✨ Сгенерировать сценарий целиком"}
              </button>
              {selected && (
                <button type="button" className="edu-btn edu-btn--ghost" onClick={() => runVerify()} disabled={aiBusy || busy || verifyBusy || fixBusy}>
                  {verifyBusy ? "рецензент проверяет…" : "🔍 Проверить текущий сценарий"}
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
                placeholder="Указание редактору (необязательно): напр. «лишние обследования не убирай, поправь только результаты»"
                value={fixHint}
                onChange={(e) => setFixHint(e.target.value)}
              />
            )}
            {selected && (
              <div className="edu-hint" style={{ marginTop: 8 }}>
                «Исправить замечания» — круг «правка → перепроверка», повторяется, пока
                рецензент не перестанет находить замечания (максимум два круга, несколько
                минут). Сохранённый сценарий переписывается сразу. Публикацию это не
                проталкивает: гейт просто перестаёт что-либо считать, когда замечаний нет.
                Правит и проверяет ОДНА модель — «противоречий не осталось» ≠ «верно».
                Нужно исправить что-то одно — жмите «🛠 исправить» на самом замечании.
              </div>
            )}
          </>
        ) : (
          <div className="edu-warn">
            ИИ выключен: на сервере не задан ANTHROPIC_API_KEY. Сценарии можно создавать вручную.
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
                    <input className="edu-input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Напр.: Одышка и кашель у курильщика" />
                  </div>
                  <div>
                    <div className="edu-field-label" style={{ marginTop: 0 }}>Сложность</div>
                    <select className="edu-select" value={form.difficulty} onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}>
                      {DIFFICULTIES.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="edu-field-label">Жалоба и вводная (видны сразу)</div>
                <textarea className="edu-textarea" rows={3} value={form.presentation} onChange={(e) => setForm((f) => ({ ...f, presentation: e.target.value }))} placeholder="Возраст, пол, жалобы, анамнез…" />
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
                      placeholder="по умолчанию 15"
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
                        храним ответ как образец. Дословное совпадение заключения врача с
                        ним будет видно в сигналах попытки. На оценку не влияет.
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
                  Вариант меняет жалобу и числовые результаты, но не список нужных обследований.
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
                          {v.presentation ? v.presentation.slice(0, 120) : ""}{(v.results ?? []).length > 0 && <> · результатов изменено: {v.results.length}</>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Обследования */}
              <div className="rad-panel">
                <div className="edu-card-title" style={{ fontSize: 15 }}>Обследования</div>
                <div className="edu-hint" style={{ marginBottom: 8 }}>Каждое обследование с результатом. Отметьте «✓ нужное» у тех, что игрок должен был назначить. Для лучевых можно указать URL снимка.</div>
                {invs.map((inv, i) => (
                  <div key={inv.key} style={{ border: "1px solid #e6ecf3", borderRadius: 8, padding: 12, marginBottom: 10 }}>
                    <div className="edu-form-row" style={{ alignItems: "center" }}>
                      <input className="edu-input" style={{ margin: 0, flex: 2 }} placeholder="Название (Рентген ОГК)" value={inv.name} onChange={(e) => patchInv(i, { name: e.target.value })} />
                      <input className="edu-input" style={{ margin: 0, maxWidth: 150 }} placeholder="Категория (Лучевая)" value={inv.category} onChange={(e) => patchInv(i, { category: e.target.value })} />
                      <label style={{ display: "flex", gap: 5, alignItems: "center", fontSize: 12, whiteSpace: "nowrap", cursor: "pointer" }}>
                        <input type="checkbox" checked={inv.necessary} onChange={(e) => patchInv(i, { necessary: e.target.checked })} />
                        нужное
                      </label>
                      {invs.length > 1 && <button type="button" className="edu-btn edu-btn--danger" style={{ padding: "6px 10px" }} onClick={() => setInvs((prev) => prev.filter((_, j) => j !== i))}>×</button>}
                    </div>
                    <textarea className="edu-textarea" style={{ marginTop: 8 }} rows={2} placeholder="Результат обследования (что показал)" value={inv.resultText} onChange={(e) => patchInv(i, { resultText: e.target.value })} />
                    <input className="edu-input" style={{ marginTop: 6, fontSize: 13 }} placeholder="URL снимка (необязательно, для лучевых)" value={inv.imageUrl} onChange={(e) => patchInv(i, { imageUrl: e.target.value })} />
                    <AiRowIssues issues={issuesForRow(review, dismissed, inv.name)} />
                  </div>
                ))}
                <button type="button" className="edu-btn edu-btn--ghost" onClick={() => setInvs((prev) => [...prev, newInv()])}>Добавить обследование</button>
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

              {/* Диагноз */}
              <div className="rad-panel">
                <div className="edu-card-title" style={{ fontSize: 15 }}>Верный диагноз и разбор</div>
                <textarea className="edu-textarea" rows={3} value={form.correctText} onChange={(e) => setForm((f) => ({ ...f, correctText: e.target.value }))} placeholder="Верный диагноз и логика: что на него указывает" />
                <div className="edu-form-row">
                  <div>
                    <div className="edu-field-label">Принятые ключи диагноза</div>
                    <input className="edu-input" value={form.diagnosisKeys} onChange={(e) => setForm((f) => ({ ...f, diagnosisKeys: e.target.value }))} placeholder="пневмония, внебольничная пневмония" />
                    <div className="edu-hint">Через запятую, простыми словами.</div>
                  </div>
                  <div>
                    <div className="edu-field-label">Синонимы (для ИИ)</div>
                    <input className="edu-input" value={form.diagnosisSynonyms} onChange={(e) => setForm((f) => ({ ...f, diagnosisSynonyms: e.target.value }))} placeholder="воспаление лёгких" />
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
              <CaseTranslationsPanel caseType="vp" caseId={selected} />

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
                  {/* Опубликованный сценарий сервер удалить не даст. */}
                  {selected !== "new" && status !== "published" && (
                    <button
                      type="button"
                      className="edu-btn edu-btn--danger"
                      onClick={handleDeleteForever}
                      disabled={busy}
                      title="Стереть сценарий без следа. Если по нему уже есть попытки врачей — сервер откажет, используйте архив."
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
