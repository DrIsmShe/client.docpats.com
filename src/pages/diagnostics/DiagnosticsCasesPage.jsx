// client/src/pages/diagnostics/DiagnosticsCasesPage.jsx
//
// Список дел врача + заведение нового. Маршрут: /diagnostics
//
// Форма создания намеренно короткая: заголовок, вопрос, возраст/пол. Всё
// остальное — материалы, контекст, разбор — добавляется уже в деле. Длинная
// форма на входе означает, что врач заполняет её вместо работы, а половина
// полей остаётся пустой.
//
// Метка пациента вместо ФИО — тоже намеренно. Поле подписано так, чтобы это
// было понятно без чтения документации: сюда пишут «пациент К., 54» или номер
// карты, а не имя. Само поле всё равно шифруется на сервере, но лучший способ
// не потерять персональные данные — не собирать их.

import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { fetchCases, createCase, fetchModalities } from "../../api/diagnostics";
import { readApiError, isAuthError } from "../../api/education";
import "../education/education.css";
import "./diagnostics.css";

const STATUS_LABELS = {
  draft: "Черновик",
  analyzing: "Идёт разбор",
  ready: "Разбор готов",
  closed: "Закрыто",
};

const SEX_LABELS = { male: "мужчина", female: "женщина", other: "другое", unknown: "не указан" };

export function CaseStatus({ status }) {
  return (
    <span className={`dg-status dg-status--${status}`}>
      {status === "analyzing" && <span className="dg-spinner" aria-hidden="true" />}
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DiagnosticsCasesPage() {
  const navigate = useNavigate();

  const [cases, setCases] = useState([]);
  const [advisory, setAdvisory] = useState("");
  const [modalities, setModalities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("");

  // Форма нового дела
  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [label, setLabel] = useState("");
  const [ageYears, setAgeYears] = useState("");
  const [sex, setSex] = useState("unknown");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [items, guide] = await Promise.all([
        fetchCases(filter ? { status: filter } : {}),
        // Справочник не должен блокировать список: если он не пришёл,
        // работать с делами всё равно можно.
        fetchModalities().catch(() => ({ modalities: [], advisoryNotice: "" })),
      ]);
      setCases(items);
      setModalities(guide.modalities);
      setAdvisory(guide.advisoryNotice);
      setError(null);
    } catch (err) {
      if (isAuthError(err)) {
        navigate("/login");
        return;
      }
      setError(readApiError(err, "Не удалось загрузить дела"));
    } finally {
      setLoading(false);
    }
  }, [filter, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e) {
    e.preventDefault();
    if (creating) return;
    setCreating(true);
    setError(null);
    try {
      const payload = {
        title: title.trim() || "Без названия",
        question: question.trim(),
        patient: {
          kind: "anonymous",
          label: label.trim(),
          sex,
          ageYears: ageYears === "" ? null : Number(ageYears),
        },
      };
      const created = await createCase(payload);
      navigate(`/diagnostics/cases/${created._id}`);
    } catch (err) {
      setError(readApiError(err, "Не удалось создать дело"));
      setCreating(false);
    }
  }

  const textCount = modalities.filter((m) => m.capabilities?.includes("text")).length;
  const imageCount = modalities.filter((m) => m.capabilities?.includes("image")).length;

  return (
    <div className="dg-page">
      <header className="dg-head">
        <div className="dg-head-main">
          <p className="edu-eyebrow">Диагностическая помощь</p>
          <h1 className="dg-title">Разбор материалов</h1>
          <p className="dg-subtitle">
            Второе мнение по заключениям, анализам и клиническим случаям: что стоит
            перепроверить, чего не хватает в данных и что нельзя пропустить. Итог по делу
            пишет и подписывает врач.
          </p>
        </div>
      </header>

      {advisory && (
        <div className="dg-advisory">
          <span className="dg-advisory-mark">!</span>
          <span>{advisory}</span>
        </div>
      )}

      {error && <div className="dg-err">{error}</div>}

      <div className="dg-layout">
        <div className="dg-col">
          <section className="dg-panel">
            <h2 className="dg-panel-title">Новое дело</h2>
            <p className="dg-panel-note">
              Материалы и клинический контекст добавите внутри — здесь только то, без чего
              дело не найти в списке.
            </p>

            <form className="dg-stack" onSubmit={submit}>
              <div>
                <span className="dg-label">Название дела</span>
                <input
                  className="edu-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Например: КТ ОГК, очаговое образование S6"
                  maxLength={300}
                />
              </div>

              <div>
                <span className="dg-label">Вопрос, на который нужен разбор</span>
                <textarea
                  className="edu-textarea"
                  rows={3}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Что именно вас смущает? Конкретный вопрос даёт конкретный ответ."
                  maxLength={2000}
                />
              </div>

              <div className="dg-row">
                <div className="dg-grow">
                  <span className="dg-label">Метка пациента — не ФИО</span>
                  <input
                    className="edu-input"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="«Пациент К.» или номер карты"
                    maxLength={200}
                  />
                </div>
                <div style={{ width: 110 }}>
                  <span className="dg-label">Возраст</span>
                  <input
                    className="edu-input dg-nums"
                    type="number"
                    min={0}
                    max={130}
                    value={ageYears}
                    onChange={(e) => setAgeYears(e.target.value)}
                    placeholder="лет"
                  />
                </div>
                <div style={{ width: 150 }}>
                  <span className="dg-label">Пол</span>
                  <select
                    className="edu-select"
                    value={sex}
                    onChange={(e) => setSex(e.target.value)}
                  >
                    <option value="unknown">не указан</option>
                    <option value="male">мужчина</option>
                    <option value="female">женщина</option>
                    <option value="other">другое</option>
                  </select>
                </div>
              </div>

              <p className="dg-muted">
                Возраст и пол влияют на трактовку почти любого показателя, поэтому их стоит
                указать. Имя не нужно нигде и никогда: разбор от него не зависит.
              </p>

              <div>
                <button className="edu-btn" type="submit" disabled={creating}>
                  {creating ? "Создаём…" : "Завести дело"}
                </button>
              </div>
            </form>
          </section>

          <section className="dg-panel">
            <div className="dg-row" style={{ justifyContent: "space-between" }}>
              <h2 className="dg-panel-title">Мои дела</h2>
              <select
                className="edu-filter-select"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                aria-label="Фильтр по статусу"
              >
                <option value="">Все</option>
                <option value="draft">Черновики</option>
                <option value="analyzing">Идёт разбор</option>
                <option value="ready">Разбор готов</option>
                <option value="closed">Закрытые</option>
              </select>
            </div>

            {loading ? (
              <p className="dg-empty">Загружаем…</p>
            ) : cases.length === 0 ? (
              <p className="dg-empty">
                Дел пока нет. Заведите первое — материалы можно добавлять постепенно.
              </p>
            ) : (
              <div className="dg-cases">
                {cases.map((c) => (
                  <Link key={c._id} className="dg-case-row" to={`/diagnostics/cases/${c._id}`}>
                    <div className="dg-case-main">
                      <p className="dg-case-title">{c.title || "Без названия"}</p>
                      <div className="dg-case-meta">
                        {c.patient?.label && <span>{c.patient.label}</span>}
                        {c.patient?.ageYears ? <span>{c.patient.ageYears} лет</span> : null}
                        {c.patient?.sex && c.patient.sex !== "unknown" && (
                          <span>{SEX_LABELS[c.patient.sex]}</span>
                        )}
                        <span>изменено {formatDate(c.updatedAt)}</span>
                      </div>
                    </div>
                    <div className="dg-case-side">
                      <CaseStatus status={c.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="dg-col">
          <section className="dg-panel">
            <h2 className="dg-panel-title">Что модуль умеет</h2>
            <p className="dg-panel-note">
              {textCount} направлени{textCount === 1 ? "е" : "й"} разбирают текст заключений и
              данные.{" "}
              {imageCount > 0
                ? `${imageCount} умеют читать само изображение.`
                : "Чтения самих изображений пока нет — снимок разбирается по вашему описанию и тексту заключения."}
            </p>

            {modalities.map((m) => (
              <div key={m.key} className="dg-mod">
                <div className="dg-mod-head" style={{ cursor: "default" }}>
                  <span className="dg-mod-name">{m.title}</span>
                  <span className="dg-mod-cap">
                    {m.capabilities?.includes("image") ? "текст + снимок" : "текст"}
                  </span>
                </div>
                <p className="dg-mod-purpose">{m.purpose}</p>
              </div>
            ))}
          </section>

          <section className="dg-panel">
            <h2 className="dg-panel-title">Как это устроено</h2>
            <p className="dg-panel-note" style={{ marginBottom: 0 }}>
              Разбор идёт по открытому протоколу: у каждого направления есть чек-лист и список
              того, что нельзя пропустить, — вы видите их до отправки материала, в самом деле.
              Каждый вывод помечен значимостью и уверенностью, и рядом с ним стоит вопрос,
              согласны ли вы. Ваши поправки — единственный способ понять, где разбор ошибается
              систематически, поэтому они важнее согласий.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
