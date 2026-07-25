// client/src/pages/radiology/RadiologyDuelsPage.jsx
//
// Дуэли 1×1 (учащийся). Маршрут: /radiology/duels
// Бросить вызов на кейсе снимков → соперник проходит тот же кейс → у кого
// балл выше, тот победил. XP-бонус победителю идёт в общий рейтинг.

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchDuels, createDuel, fetchCases } from "../../api/radiology";
import { readApiError, isAuthError } from "../../api/education";
import { MODALITY_LABELS } from "./RadiologyCatalogPage";
import "../education/education.css";
import "./radiology.css";

const pct = (x) => (x == null ? "—" : `${Math.round(x * 100)}%`);

const STATUS_LABELS = {
  awaiting_challenger: "ждёт вашего прохождения",
  open: "ждёт соперника",
  completed: "завершена",
};

export default function RadiologyDuelsPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState([]);
  const [mine, setMine] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [o, m, cs] = await Promise.all([
          fetchDuels("open"),
          fetchDuels("mine"),
          fetchCases(),
        ]);
        setOpen(o);
        setMine(m);
        setCases(cs);
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
      // Сразу проходим свой кейс дуэли.
      navigate(`/radiology/cases/${caseId}?duel=${duel._id}`);
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, "Не удалось создать дуэль"));
      setBusy(false);
    }
  }

  function resultLine(d) {
    if (d.status !== "completed") return null;
    const meWon =
      (d.winner === "challenger" && d.challenger.isMe) ||
      (d.winner === "opponent" && d.opponent.isMe);
    if (d.winner === "draw") return <span className="rad-tag">Ничья</span>;
    return <span className={meWon ? "rad-pass" : "rad-fail"}>{meWon ? "Победа 🏆" : "Поражение"}</span>;
  }

  if (loading) return <div className="rad-page"><div className="edu-state">Загрузка…</div></div>;

  return (
    <div className="rad-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
        <div>
          <h1 className="edu-title" style={{ marginBottom: 4 }}>⚔️ Дуэли</h1>
          <p className="edu-subtitle">Один кейс на двоих — у кого балл выше, тот победил. Победа даёт бонус к XP.</p>
        </div>
        <Link className="edu-btn edu-btn--ghost" to="/radiology">← В арену</Link>
      </div>

      {error && <div className="edu-error" style={{ marginTop: 12 }}>{error}</div>}

      {/* Открытые вызовы */}
      <div className="rad-panel" style={{ marginTop: 12 }}>
        <div className="edu-card-title" style={{ fontSize: 16 }}>Открытые вызовы</div>
        {open.length === 0 ? (
          <div className="edu-hint">Открытых вызовов нет. Бросьте свой — ниже.</div>
        ) : (
          open.map((d) => (
            <div key={d._id} className="an-row">
              <span style={{ flex: 1, minWidth: 0 }}>
                <strong>{d.caseTitle}</strong>{" "}
                <small style={{ color: "#8b9aab" }}>· {MODALITY_LABELS[d.modality] ?? d.modality} · вызов от {d.challenger.name} ({pct(d.challenger.score)})</small>
              </span>
              <Link className="edu-btn" to={`/radiology/cases/${d.caseId}?duel=${d._id}`}>Принять</Link>
            </div>
          ))
        )}
      </div>

      {/* Мои дуэли */}
      <div className="rad-panel" style={{ marginTop: 12 }}>
        <div className="edu-card-title" style={{ fontSize: 16 }}>Мои дуэли</div>
        {mine.length === 0 ? (
          <div className="edu-hint">Вы ещё не участвовали в дуэлях.</div>
        ) : (
          mine.map((d) => {
            const iAmChallenger = d.challenger.isMe;
            const needPlay = d.status === "awaiting_challenger" && iAmChallenger;
            return (
              <div key={d._id} className="an-row">
                <span style={{ flex: 1, minWidth: 0 }}>
                  <strong>{d.caseTitle}</strong>{" "}
                  <small style={{ color: "#8b9aab" }}>
                    · {d.challenger.name} {pct(d.challenger.score)} vs {d.opponent.name || "…"} {pct(d.opponent.score)} · {STATUS_LABELS[d.status]}
                  </small>
                </span>
                {needPlay ? (
                  <Link className="edu-btn" to={`/radiology/cases/${d.caseId}?duel=${d._id}`}>Пройти</Link>
                ) : (
                  resultLine(d)
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Бросить вызов */}
      <div className="rad-panel" style={{ marginTop: 12 }}>
        <div className="edu-card-title" style={{ fontSize: 16 }}>Бросить вызов</div>
        <div className="edu-hint" style={{ marginBottom: 8 }}>Выберите кейс — вы пройдёте его первым, затем вызов станет доступен соперникам.</div>
        {cases.length === 0 ? (
          <div className="edu-hint">Нет опубликованных кейсов снимков.</div>
        ) : (
          cases.map((c) => (
            <div key={c._id} className="an-row">
              <span style={{ flex: 1, minWidth: 0 }}>
                <strong>{c.title}</strong>{" "}
                <small style={{ color: "#8b9aab" }}>· {MODALITY_LABELS[c.modality] ?? c.modality}</small>
              </span>
              <button type="button" className="edu-btn edu-btn--ghost" disabled={busy} onClick={() => challenge(c._id)}>Вызвать</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
