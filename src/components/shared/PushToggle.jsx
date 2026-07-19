// client/src/components/shared/PushToggle.jsx
//
// Кнопка «Включить/выключить пуш-уведомления». Скрывается, если браузер не
// поддерживает push. Управляет подпиской через utils/webPush.

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  pushSupported,
  getPushState,
  enablePush,
  disablePush,
} from "../../utils/webPush";

export default function PushToggle() {
  const { t } = useTranslation();
  const [state, setState] = useState({ supported: true, subscribed: false });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const refresh = async () => {
    try {
      setState(await getPushState());
    } catch {
      setState({ supported: false });
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  if (!pushSupported() || state.supported === false) return null;

  const blocked = state.permission === "denied";

  const toggle = async () => {
    setBusy(true);
    setErr("");
    try {
      if (state.subscribed) await disablePush();
      else await enablePush();
      await refresh();
    } catch (e) {
      setErr(e.message || "Ошибка");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <button
        type="button"
        onClick={toggle}
        disabled={busy || blocked}
        title={blocked ? t("push.blocked", { defaultValue: "Уведомления заблокированы в настройках браузера" }) : ""}
        style={{
          border: "1px solid #cbd5e1",
          background: state.subscribed ? "#dcfce7" : "#fff",
          color: state.subscribed ? "#166534" : "#334155",
          borderRadius: 10,
          padding: "6px 12px",
          fontSize: 13,
          fontWeight: 600,
          cursor: busy || blocked ? "default" : "pointer",
        }}
      >
        {busy
          ? "…"
          : state.subscribed
            ? `🔕 ${t("push.disable", { defaultValue: "Выключить пуш" })}`
            : `🔔 ${t("push.enable", { defaultValue: "Включить пуш-уведомления" })}`}
      </button>
      {blocked && (
        <span style={{ fontSize: 12, color: "#b45309" }}>
          {t("push.blockedHint", { defaultValue: "Разрешите уведомления в настройках браузера" })}
        </span>
      )}
      {err && <span style={{ fontSize: 12, color: "#c0392b" }}>{err}</span>}
    </div>
  );
}
