// client/src/pages/admin/radiology/AdminVpCasesPage.jsx
//
// Админка → «Виртуальный пациент». Маршрут: /admin/vp
// Авторинг сценариев: жалоба + список обследований (каждое с результатом и
// пометкой «нужное») + верный диагноз.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchAllCases,
  fetchVpCase,
  createVpCase,
  updateVpCase,
  setVpStatus,
  aiGenerateVpCase,
  aiVerifyVpCase,
  dismissVpAiIssues,
  generateVpAiBaseline,
  generateVpVariants,
  fetchReadingConfig,
} from "../../../api/radiology";
import { readApiError, isAuthError } from "../../../api/education";
import AiReviewPanel, {
  issuesForRow,
  AiRowIssues,
  unresolvedIssues,
} from "./AiReviewPanel";
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
const STATUS_LABELS = { draft: "Черновик", published: "Опубликован", archived: "В архиве" };
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
  const [verifyBusy, setVerifyBusy] = useState(false);

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
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, "Не удалось выполнить проверку ИИ"));
    } finally {
      setVerifyBusy(false);
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
    liveBlockers.push(`разберите замечания рецензента (${openIssues})`);

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
              <button type="button" className="edu-btn" onClick={handleAiGenerate} disabled={aiBusy || busy || verifyBusy}>
                {aiBusy ? "ИИ составляет сценарий…" : "✨ Сгенерировать сценарий целиком"}
              </button>
              {selected && (
                <button type="button" className="edu-btn edu-btn--ghost" onClick={() => runVerify()} disabled={aiBusy || busy || verifyBusy}>
                  {verifyBusy ? "рецензент проверяет…" : "🔍 Проверить текущий сценарий"}
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="edu-warn">
            ИИ выключен: на сервере не задан ANTHROPIC_API_KEY. Сценарии можно создавать вручную.
            Чтобы включить ИИ — добавьте ключ в .env и перезапустите сервер.
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px minmax(0,1fr)", gap: 20, marginTop: 16, alignItems: "start" }}>
        <div className="rad-panel">
          <div className="edu-card-title" style={{ fontSize: 15 }}>Кейсы ({cases.length})</div>
          {cases.length === 0 && <div className="edu-hint">Пока нет кейсов.</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
            {cases.map((c) => (
              <button key={c._id} type="button" className="edu-list-item" style={{ border: "1px solid #eef2f7", borderRadius: 8, textAlign: "left", background: selected === c._id ? "#eef4ff" : "#fff" }} onClick={() => openCase(c._id)}>
                <div className="edu-list-item-title">{c.title || "Без названия"}</div>
                <div className="edu-list-item-meta">{STATUS_LABELS[c.status] ?? c.status}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          {!selected ? (
            <div className="rad-panel"><div className="edu-hint">Выберите кейс слева или создайте новый.</div></div>
          ) : (
            <>
              <div className="rad-panel">
                <div className="edu-card-title" style={{ fontSize: 15 }}>
                  {selected === "new" ? "Новый кейс" : "Редактирование"} · {STATUS_LABELS[status] ?? status}
                </div>
                {liveBlockers.length > 0 && <div className="edu-warn" style={{ marginTop: 8 }}>Опубликовать нельзя: {liveBlockers.join("; ")}.</div>}
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
                busy={verifyBusy}
              />

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

              {/* Действия */}
              <div className="rad-panel">
                <div className="edu-btn-row" style={{ flexWrap: "wrap" }}>
                  <button type="button" className="edu-btn" onClick={handleSave} disabled={busy}>{busy ? "Сохраняем…" : "Сохранить"}</button>
                  {selected !== "new" && status !== "published" && (
                    <button type="button" className="edu-btn" onClick={() => changeStatus("published")} disabled={busy || liveBlockers.length > 0}>Опубликовать</button>
                  )}
                  {status === "published" && (
                    <button type="button" className="edu-btn edu-btn--ghost" onClick={() => changeStatus("draft")} disabled={busy}>Снять с публикации</button>
                  )}
                  {selected !== "new" && status !== "archived" && (
                    <button type="button" className="edu-btn edu-btn--ghost" onClick={() => changeStatus("archived")} disabled={busy}>В архив</button>
                  )}
                </div>
                {liveBlockers.length > 0 && <div className="edu-hint" style={{ marginTop: 8 }}>Для публикации: {liveBlockers.join("; ")}.</div>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
