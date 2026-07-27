// client/src/pages/radiology/ArenaDuelsPage.jsx
//
// Дуэли 1×1. Маршрут: /arena/duels (раньше /radiology/duels)
//
// Что было не так со прошлой версией: три равноправные панели подряд —
// «открытые вызовы», «мои дуэли», «бросить вызов», — и в каждой плоский список
// строк с мелким текстом через точку. Из такой страницы нельзя понять главное:
// где сейчас ход мой, а где я жду соперника. А список «бросить вызов» выводил
// ВСЕ кейсы целиком и повторял проблему старого каталога — на сотне кейсов он
// становится нечитаемым.
//
// Поэтому здесь порядок по действию, а не по типу записи:
//   1. «Ваш ход» — то, где от вас что-то требуется. Сверху и всегда видно.
//   2. «Ждут соперника» — сделано, ждём.
//   3. «Завершённые» — история со счётом.
//   4. «Бросить вызов» — с поиском, а не простынёй.
//
// Счёт показан двумя числами рядом, а не строкой «X vs Y» мелким шрифтом:
// сравнение двух чисел — это то, ради чего сюда заходят.

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchDuels, createDuel, fetchCatalogPage } from "../../api/radiology";
import { readApiError, isAuthError } from "../../api/education";
import { MODALITY_LABELS, DIFFICULTY_LABELS } from "./arenaLabels";
import "../education/education.css";
import "./radiology.css";

const PAGE = 8;
// Пауза перед запросом при наборе — как в каталоге хаба.
const SEARCH_DEBOUNCE_MS = 350;

const pct = (x) => (x == null ? "—" : `${Math.round(x * 100)}%`);

export default function ArenaDuelsPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState([]);
  const [mine, setMine] = useState([]);
  const [casePage, setCasePage] = useState({ items: [], total: 0, hasMore: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [queryApplied, setQueryApplied] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [o, m] = await Promise.all([fetchDuels("open"), fetchDuels("mine")]);
        setOpen(o);
        setMine(m);
      } catch (err) {
        if (isAuthError(err)) return navigate("/login");
        setError(readApiError(err, "Не удалось загрузить дуэли"));
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  async function challenge(caseId) {
    setBusy(true);
    setError(null);
    try {
      const duel = await createDuel(caseId);
      // Сразу проходим свой кейс дуэли: вызов станет доступен соперникам
      // только после того, как автор показал свой результат.
      navigate(`/arena/cases/${caseId}?duel=${duel._id}`);
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, "Не удалось создать дуэль"));
      setBusy(false);
    }
  }

  // Раскладка по действию, а не по типу записи.
  const myTurn = useMemo(
    () => [
      ...open.map((d) => ({ ...d, action: "accept" })),
      ...mine
        .filter((d) => d.status === "awaiting_challenger" && d.challenger?.isMe)
        .map((d) => ({ ...d, action: "play" })),
    ],
    [open, mine],
  );
  const waiting = useMemo(() => mine.filter((d) => d.status === "open"), [mine]);
  const finished = useMemo(() => mine.filter((d) => d.status === "completed"), [mine]);

  // Поиск кейса для вызова идёт на сервере — по той же причине, что и в
  // каталоге: искать на клиенте можно только среди доехавшего, а доезжает
  // одна страница. Раньше сюда выгружался весь список кейсов целиком.
  useEffect(() => {
    const id = setTimeout(() => setQueryApplied(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    let alive = true;
    fetchCatalogPage("radiology", { q: queryApplied, skip: 0, limit: PAGE })
      .then((res) => alive && setCasePage(res))
      .catch((err) => alive && setError(readApiError(err, "Не удалось загрузить кейсы")));
    return () => {
      alive = false;
    };
  }, [queryApplied]);

  async function loadMoreCases() {
    if (loadingMore || !casePage.hasMore) return;
    setLoadingMore(true);
    try {
      const res = await fetchCatalogPage("radiology", {
        q: queryApplied,
        skip: casePage.items.length,
        limit: PAGE,
      });
      setCasePage((prev) => ({
        items: [...prev.items, ...res.items],
        total: res.total,
        hasMore: res.hasMore,
      }));
    } catch (err) {
      setError(readApiError(err, "Не удалось догрузить кейсы"));
    } finally {
      setLoadingMore(false);
    }
  }

  if (loading) {
    return (
      <div className="rad-page">
        <div className="edu-state">Загрузка…</div>
      </div>
    );
  }

  return (
    <div className="rad-page">
      <div className="arena-back">
        <Link className="edu-back-link" to="/arena">
          ← В тренажёр
        </Link>
        <Link className="edu-back-link" to="/doctor/home-page">
          В кабинет
        </Link>
      </div>

      <div className="arena-head">
        <div className="arena-head-main">
          <p className="edu-eyebrow">Тренажёр диагностики · дуэли</p>
          <h1 className="edu-title" style={{ marginBottom: 4 }}>
            Дуэли 1×1
          </h1>
          <p className="edu-subtitle" style={{ maxWidth: "68ch" }}>
            Один и тот же кейс проходят двое, вслепую друг от друга. У кого балл выше — тот
            победил; победа даёт бонус к XP. Соперник не видит ваш результат, пока не сдаст свой.
          </p>
        </div>
      </div>

      {error && <div className="edu-error" style={{ marginTop: 12 }}>{error}</div>}

      {/* ─── 1. Ваш ход ──────────────────────────────────────────── */}
      <section className="arena-duel-section">
        <div className="arena-duel-head">
          <h2 className="edu-card-title" style={{ fontSize: 17, margin: 0 }}>
            Ваш ход
          </h2>
          {myTurn.length > 0 && <span className="arena-badge-count">{myTurn.length}</span>}
        </div>

        {myTurn.length === 0 ? (
          <p className="edu-hint">
            Ничего не требуется. Бросьте вызов ниже или примите чужой, когда появится.
          </p>
        ) : (
          <div className="arena-duel-list">
            {myTurn.map((d) => (
              <div key={d._id} className="arena-duel arena-duel--turn">
                <div className="arena-duel-main">
                  <strong className="arena-duel-title">{d.caseTitle}</strong>
                  <div className="arena-duel-meta">
                    <span className="rad-tag">{MODALITY_LABELS[d.modality] ?? d.modality}</span>
                    {d.action === "accept" ? (
                      <span>
                        вызов от <strong>{d.challenger?.name}</strong> · его результат{" "}
                        {pct(d.challenger?.score)}
                      </span>
                    ) : (
                      <span>вы создали вызов — сначала пройдите кейс сами</span>
                    )}
                  </div>
                </div>
                <Link className="edu-btn" to={`/arena/cases/${d.caseId}?duel=${d._id}`}>
                  {d.action === "accept" ? "Принять вызов" : "Пройти кейс"}
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── 2. Ждут соперника ───────────────────────────────────── */}
      {waiting.length > 0 && (
        <section className="arena-duel-section">
          <div className="arena-duel-head">
            <h2 className="edu-card-title" style={{ fontSize: 17, margin: 0 }}>
              Ждут соперника
            </h2>
            <span className="arena-badge-count">{waiting.length}</span>
          </div>
          <div className="arena-duel-list">
            {waiting.map((d) => (
              <div key={d._id} className="arena-duel">
                <div className="arena-duel-main">
                  <strong className="arena-duel-title">{d.caseTitle}</strong>
                  <div className="arena-duel-meta">
                    <span className="rad-tag">{MODALITY_LABELS[d.modality] ?? d.modality}</span>
                    <span>ваш результат {pct(d.challenger?.score)} — ждём, кто ответит</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── 3. Завершённые ──────────────────────────────────────── */}
      {finished.length > 0 && (
        <section className="arena-duel-section">
          <div className="arena-duel-head">
            <h2 className="edu-card-title" style={{ fontSize: 17, margin: 0 }}>
              Завершённые
            </h2>
            <span className="arena-badge-count">{finished.length}</span>
          </div>
          <div className="arena-duel-list">
            {finished.map((d) => (
              <DuelResult key={d._id} duel={d} />
            ))}
          </div>
        </section>
      )}

      {/* ─── 4. Бросить вызов ────────────────────────────────────── */}
      <section className="arena-duel-section">
        <div className="arena-duel-head">
          <h2 className="edu-card-title" style={{ fontSize: 17, margin: 0 }}>
            Бросить вызов
          </h2>
        </div>
        <p className="edu-hint" style={{ marginBottom: 10 }}>
          Выберите кейс — вы пройдёте его первым, затем вызов станет доступен соперникам.
          Дуэли идут только по станции снимков.
        </p>

        {(
          <>
            <div className="arena-filters" style={{ marginBottom: 12 }}>
              <input
                className="edu-search-input"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск кейса по названию"
                aria-label="Поиск кейса по названию"
                maxLength={200}
              />
              <span className="edu-hint">
                {queryApplied.trim() ? `найдено ${casePage.total}` : `всего ${casePage.total}`}
              </span>
            </div>

            {casePage.items.length === 0 ? (
              <p className="edu-hint">
                {queryApplied.trim()
                  ? "Ничего не найдено — попробуйте другое слово."
                  : "Нет опубликованных кейсов снимков."}
              </p>
            ) : (
              <div className="arena-duel-list">
                {casePage.items.map((c) => (
                  <div key={c._id} className="arena-duel">
                    <div className="arena-duel-main">
                      <strong className="arena-duel-title">{c.title}</strong>
                      <div className="arena-duel-meta">
                        <span className="rad-tag">{MODALITY_LABELS[c.modality] ?? c.modality}</span>
                        <span className="rad-tag">
                          {DIFFICULTY_LABELS[c.difficulty] ?? c.difficulty}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="edu-btn edu-btn--ghost"
                      disabled={busy}
                      onClick={() => challenge(c._id)}
                    >
                      Вызвать
                    </button>
                  </div>
                ))}
              </div>
            )}

            {casePage.hasMore && (
              <div className="arena-more">
                <button
                  type="button"
                  className="edu-btn edu-btn--ghost"
                  onClick={loadMoreCases}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Загружаем…" : "Показать ещё"}
                </button>
                <span className="edu-hint">
                  показано {casePage.items.length} из {casePage.total}
                </span>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

/** Завершённая дуэль: два числа рядом и исход словом. */
function DuelResult({ duel: d }) {
  const meWon =
    (d.winner === "challenger" && d.challenger?.isMe) ||
    (d.winner === "opponent" && d.opponent?.isMe);
  const draw = d.winner === "draw";

  return (
    <div
      className={`arena-duel arena-duel--${draw ? "draw" : meWon ? "win" : "loss"}`}
    >
      <div className="arena-duel-main">
        <strong className="arena-duel-title">{d.caseTitle}</strong>
        <div className="arena-duel-meta">
          <span className="rad-tag">{MODALITY_LABELS[d.modality] ?? d.modality}</span>
        </div>
      </div>

      <div className="arena-duel-score">
        <div className="arena-duel-side">
          <span className="arena-duel-name">
            {d.challenger?.isMe ? "Вы" : d.challenger?.name}
          </span>
          <span className="arena-duel-num">{pct(d.challenger?.score)}</span>
        </div>
        <span className="arena-duel-vs">:</span>
        <div className="arena-duel-side">
          <span className="arena-duel-name">
            {d.opponent?.isMe ? "Вы" : d.opponent?.name || "—"}
          </span>
          <span className="arena-duel-num">{pct(d.opponent?.score)}</span>
        </div>
      </div>

      <div className="arena-duel-verdict">
        {draw ? "Ничья" : meWon ? "Победа 🏆" : "Поражение"}
      </div>
    </div>
  );
}
