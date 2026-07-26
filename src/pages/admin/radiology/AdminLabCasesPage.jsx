// client/src/pages/admin/radiology/AdminLabCasesPage.jsx
//
// Админка → станция «Анализы». Маршрут: /admin/labs
// Авторинг лабораторных кейсов: клинический контекст + панель показателей
// (с отметкой значимых отклонений) + эталонное заключение и диагноз.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchLabCases,
  fetchLabCase,
  createLabCase,
  updateLabCase,
  setLabStatus,
  aiGenerateLabCase,
  aiVerifyLabCase,
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
const STATUS_LABELS = {
  draft: "Черновик",
  published: "Опубликован",
  archived: "В архиве",
  in_review: "На ревью",
  rejected: "Отклонён",
};
const parseList = (s) => String(s ?? "").split(/[\n,;]+/).map((x) => x.trim()).filter(Boolean);
const newKey = () => `k_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e4)}`;
const newRow = () => ({ key: newKey(), name: "", value: "", unit: "", refRange: "", significant: false });

const BLANK = {
  title: "",
  clinicalContext: "",
  difficulty: "medium",
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

  // ИИ-генерация кейса целиком по теме.
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
          fetchLabCases({ scope: "all" }),
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
    setCases(await fetchLabCases({ scope: "all" }));
  }

  function resetReview() {
    setReview(null);
    setDismissed(new Set());
  }

  function startNew() {
    setSelected("new");
    setStatus("draft");
    setForm(BLANK);
    setRows([newRow(), newRow()]);
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
        sourceKind: doc.source?.kind ?? "original",
        authority: doc.source?.authority ?? "",
        sourceUrl: doc.source?.url ?? "",
        licenseNote: doc.source?.licenseNote ?? "",
        correctText: doc.impression?.correctText ?? "",
        diagnosisKeys: (doc.impression?.diagnosisKeys ?? []).join(", "),
        diagnosisSynonyms: (doc.impression?.diagnosisSynonyms ?? []).join(", "),
      });
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
      resetReview();
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
    const useRows = rowsArg ?? rows;
    const useForm = formArg ?? form;
    const panel = useRows
      .filter((r) => r.name.trim() && r.value.trim())
      .map((r) => ({
        name: r.name.trim(),
        value: r.value.trim(),
        unit: r.unit.trim() || undefined,
        refRange: r.refRange.trim() || undefined,
        significant: Boolean(r.significant),
      }));
    if (panel.length < 2) {
      setError("Для проверки нужно минимум 2 заполненных показателя");
      return;
    }
    setVerifyBusy(true);
    try {
      const res = await aiVerifyLabCase({
        draft: {
          title: useForm.title.trim() || undefined,
          clinicalContext: useForm.clinicalContext.trim() || undefined,
          panel,
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
    return {
      title: form.title.trim(),
      clinicalContext: form.clinicalContext.trim(),
      difficulty: form.difficulty,
      panel,
      significantAbnormal,
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
    liveBlockers.push(`разберите замечания рецензента (${openIssues})`);

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
              <button type="button" className="edu-btn" onClick={handleAiGenerate} disabled={aiBusy || busy || verifyBusy}>
                {aiBusy ? "ИИ составляет кейс…" : "✨ Сгенерировать кейс целиком"}
              </button>
              {selected && (
                <button type="button" className="edu-btn edu-btn--ghost" onClick={() => runVerify()} disabled={aiBusy || busy || verifyBusy}>
                  {verifyBusy ? "рецензент проверяет…" : "🔍 Проверить текущий кейс"}
                </button>
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

      <div style={{ display: "grid", gridTemplateColumns: "280px minmax(0,1fr)", gap: 20, marginTop: 16, alignItems: "start" }}>
        {/* Список */}
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
                {liveBlockers.length > 0 && (
                  <div className="edu-warn" style={{ marginTop: 8 }}>Опубликовать нельзя: {liveBlockers.join("; ")}.</div>
                )}
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
                onDismiss={(i) => setDismissed((prev) => new Set(prev).add(i))}
                onRecheck={() => runVerify()}
                busy={verifyBusy}
              />

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
                {liveBlockers.length > 0 && (
                  <div className="edu-hint" style={{ marginTop: 8 }}>Для публикации: {liveBlockers.join("; ")}.</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
