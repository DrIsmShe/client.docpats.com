// client/src/components/shared/NotificationSettings.jsx
//
// Единая секция настроек уведомлений: браузерный пуш (PushToggle), опт-аут
// email-дайджеста непрочитанных и подписка на подборку конференций
// (/notifications/preferences).

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import PushToggle from "./PushToggle";

const API_BASE = process.env.REACT_APP_API_URL;

// Подписи к кодам категорий. Сами коды приходят с бэкенда
// (availableConferenceCategories) — здесь только перевод на человеческий.
const CATEGORY_LABELS = {
  therapeutic: "Терапевтические",
  surgical: "Хирургические",
  diagnostics: "Диагностика",
  rehabilitation: "Реабилитация",
  dentistry: "Стоматология",
  "womens-health": "Женское здоровье",
  pediatrics: "Педиатрия",
  "mental-health": "Психическое здоровье",
  "ophthalmology-ent": "Офтальмология и ЛОР",
  "sports-medicine": "Спортивная медицина",
  oncology: "Онкология",
  emergency: "Неотложная помощь",
  "mens-health": "Мужское здоровье",
  pharmacy: "Фармация",
};

export default function NotificationSettings() {
  const { t } = useTranslation();
  const [prefs, setPrefs] = useState(null); // null = загрузка
  const [saving, setSaving] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  useEffect(() => {
    let alive = true;
    axios
      .get(`${API_BASE}/notifications/preferences`, { withCredentials: true })
      .then((r) => alive && setPrefs(r.data || {}))
      .catch(() => alive && setPrefs({}));
    return () => {
      alive = false;
    };
  }, []);

  // Общий сохранятель: рисуем новое состояние сразу, откатываем при ошибке.
  const save = async (patch) => {
    const before = prefs;
    setPrefs({ ...prefs, ...patch });
    setSaving(true);
    try {
      await axios.patch(`${API_BASE}/notifications/preferences`, patch, {
        withCredentials: true,
      });
    } catch {
      setPrefs(before);
    } finally {
      setSaving(false);
    }
  };

  const loading = prefs === null;
  const emailDigest = prefs?.emailDigestEnabled !== false;
  const confDigest = prefs?.conferenceDigestEnabled !== false;
  const confCategories = prefs?.conferenceCategories || [];
  const available = prefs?.availableConferenceCategories || [];

  const toggleCategory = (code) =>
    save({
      conferenceCategories: confCategories.includes(code)
        ? confCategories.filter((c) => c !== code)
        : [...confCategories, code],
    });

  return (
    <div style={wrap}>
      <div style={title}>
        ⚙️ {t("notifSettings.title", { defaultValue: "Настройки уведомлений" })}
      </div>

      <div style={row}>
        <PushToggle />
      </div>

      <label style={{ ...row, cursor: loading ? "default" : "pointer" }}>
        <input
          type="checkbox"
          checked={emailDigest}
          disabled={loading || saving}
          onChange={() => save({ emailDigestEnabled: !emailDigest })}
        />
        <span style={label}>
          {t("notifSettings.emailDigest", {
            defaultValue: "Email-дайджест непрочитанных",
          })}
        </span>
      </label>

      {/* Подборка конференций — только врачам: рассылка адресована им, и
          показывать переключатель пациенту значит обещать письмо, которого
          не будет. Признак приходит с бэкенда. */}
      {prefs?.conferenceDigestAvailable && (
        <>
          <label style={{ ...row, cursor: loading ? "default" : "pointer" }}>
            <input
              type="checkbox"
              checked={confDigest}
              disabled={loading || saving}
              onChange={() => save({ conferenceDigestEnabled: !confDigest })}
            />
            <span style={label}>
              {t("notifSettings.conferenceDigest", {
                defaultValue: "Подборка конференций — раз в неделю",
              })}
            </span>
          </label>

          {confDigest && (
            <div style={{ paddingLeft: 24 }}>
              <button
                type="button"
                onClick={() => setShowCategories((v) => !v)}
                style={linkBtn}
              >
                {showCategories ? "Свернуть направления" : "Выбрать направления"}
                {confCategories.length > 0 ? ` (${confCategories.length})` : " — сейчас все"}
              </button>

              {showCategories && (
                <div style={{ marginTop: 8 }}>
                  {/* Пустой список = все направления. Это не заглушка:
                      пограничные темы — норма (кардиоонкология, диабет,
                      визуализация), а конференции по ИИ или праву не
                      относятся ни к одной специальности и нужны всем. */}
                  <div style={hint}>
                    Ничего не отмечено — приходят все. Отметьте, чтобы сузить.
                  </div>
                  <div style={grid}>
                    {available.map((code) => (
                      <label key={code} style={chip}>
                        <input
                          type="checkbox"
                          checked={confCategories.includes(code)}
                          disabled={saving}
                          onChange={() => toggleCategory(code)}
                        />
                        {CATEGORY_LABELS[code] || code}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const wrap = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  padding: "12px 14px",
  border: "1px solid #e6eaf0",
  borderRadius: 12,
  background: "#f8fafc",
};
const title = { fontWeight: 700, fontSize: 14, color: "#0f172a" };
const row = { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", margin: 0 };
const label = { fontSize: 14, color: "#334155" };
const linkBtn = {
  background: "none",
  border: "none",
  padding: 0,
  color: "#3d7fff",
  cursor: "pointer",
  fontSize: 13,
};
const hint = { fontSize: 12, color: "#64748b", marginBottom: 6 };
const grid = { display: "flex", flexWrap: "wrap", gap: 10 };
const chip = { display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "#334155" };
