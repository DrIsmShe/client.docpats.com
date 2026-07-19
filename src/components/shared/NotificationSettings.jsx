// client/src/components/shared/NotificationSettings.jsx
//
// Единая секция настроек уведомлений: браузерный пуш (PushToggle) + опт-аут
// email-дайджеста непрочитанных (/notifications/preferences).

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import PushToggle from "./PushToggle";

const API_BASE = process.env.REACT_APP_API_URL;

export default function NotificationSettings() {
  const { t } = useTranslation();
  const [emailDigest, setEmailDigest] = useState(null); // null = загрузка
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    axios
      .get(`${API_BASE}/notifications/preferences`, { withCredentials: true })
      .then((r) => alive && setEmailDigest(r.data?.emailDigestEnabled !== false))
      .catch(() => alive && setEmailDigest(true));
    return () => {
      alive = false;
    };
  }, []);

  const toggleEmail = async () => {
    const next = !emailDigest;
    setEmailDigest(next);
    setSaving(true);
    try {
      await axios.patch(
        `${API_BASE}/notifications/preferences`,
        { emailDigestEnabled: next },
        { withCredentials: true },
      );
    } catch {
      setEmailDigest(!next); // откат при ошибке
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={wrap}>
      <div style={title}>
        ⚙️ {t("notifSettings.title", { defaultValue: "Настройки уведомлений" })}
      </div>
      <div style={row}>
        <PushToggle />
      </div>
      <label style={{ ...row, cursor: emailDigest === null ? "default" : "pointer" }}>
        <input
          type="checkbox"
          checked={!!emailDigest}
          disabled={emailDigest === null || saving}
          onChange={toggleEmail}
        />
        <span style={{ fontSize: 14, color: "#334155" }}>
          {t("notifSettings.emailDigest", {
            defaultValue: "Email-дайджест непрочитанных",
          })}
        </span>
      </label>
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
