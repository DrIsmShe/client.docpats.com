// client/src/components/shared/OnboardingChecklist.jsx
//
// Онбординг: чек-лист заполнения профиля с прогрессом. Данные — GET
// /api/me/onboarding. Скрывается, когда всё выполнено или пользователь закрыл.

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const API_BASE = process.env.REACT_APP_API_URL;

const TITLES = {
  avatar: "Загрузить фото профиля",
  specialization: "Указать специализацию",
  verification: "Пройти верификацию врача",
  schedule: "Настроить расписание приёма",
  article: "Опубликовать первую статью",
  invite: "Пригласить коллегу или пациента",
  consultation: "Задать вопрос AI-врачу",
  doctor: "Найти и записаться к врачу",
};

export default function OnboardingChecklist() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem("onboardingDismissed") === "1",
  );

  useEffect(() => {
    if (dismissed) return;
    let alive = true;
    axios
      .get(`${API_BASE}/api/me/onboarding`, { withCredentials: true })
      .then((r) => alive && setData(r.data))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [dismissed]);

  if (dismissed || !data?.success) return null;
  if (data.completed >= data.total) return null; // всё готово — не мешаем

  const pct = Math.round((data.completed / data.total) * 100);
  const close = () => {
    localStorage.setItem("onboardingDismissed", "1");
    setDismissed(true);
  };

  return (
    <div style={wrap}>
      <div style={head}>
        <div style={{ fontWeight: 700, color: "#0f172a" }}>
          🚀 {t("onboarding.title", { defaultValue: "Настройте профиль" })}
          <span style={{ color: "#64748b", fontWeight: 400, marginLeft: 8 }}>
            {data.completed}/{data.total}
          </span>
        </div>
        <button type="button" onClick={close} style={closeBtn} title="Скрыть">
          ✕
        </button>
      </div>

      <div style={barOuter}>
        <div style={{ ...barInner, width: `${pct}%` }} />
      </div>

      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
        {data.steps.map((s) => (
          <Link
            key={s.key}
            to={s.done ? "#" : s.link}
            onClick={(e) => s.done && e.preventDefault()}
            style={{
              ...step,
              cursor: s.done ? "default" : "pointer",
            }}
          >
            <span style={{ fontSize: 18, lineHeight: "20px" }}>
              {s.done ? "✅" : "⭕"}
            </span>
            <span
              style={{
                flex: 1,
                textDecoration: s.done ? "line-through" : "none",
                color: s.done ? "#94a3b8" : "#0f172a",
              }}
            >
              {t(`onboarding.steps.${s.key}`, {
                defaultValue: TITLES[s.key] || s.key,
              })}
            </span>
            {!s.done && <span style={{ color: "#0f766e", fontWeight: 700 }}>→</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}

const wrap = {
  background: "#fff",
  border: "1px solid #e6eaf0",
  borderRadius: 14,
  padding: 18,
  margin: "16px 0",
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  maxWidth: 620,
};
const head = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 };
const closeBtn = { background: "none", border: "none", color: "#94a3b8", fontSize: 16, cursor: "pointer", lineHeight: 1 };
const barOuter = { height: 8, background: "#eef2f7", borderRadius: 999, overflow: "hidden" };
const barInner = { height: "100%", background: "#0f766e", borderRadius: 999, transition: "width .3s ease" };
const step = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "8px 10px",
  borderRadius: 10,
  background: "#f8fafc",
  textDecoration: "none",
  fontSize: 14,
};
