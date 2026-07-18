// client/src/components/shared/ReferralCard.jsx
//
// Карточка «Пригласить и получить бонус»: личная реферальная ссылка + QR +
// копирование + шэринг (переиспользуем ShareMenu). Данные — GET /api/me/referral.

import React, { useEffect, useState } from "react";
import axios from "axios";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";
import ShareMenu from "./ShareMenu";

const API_BASE = process.env.REACT_APP_API_URL;

export default function ReferralCard() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/me/referral`, { withCredentials: true })
      .then((r) => setData(r.data))
      .catch(() =>
        setError(
          t("referral.error", {
            defaultValue: "Не удалось загрузить приглашение.",
          }),
        ),
      );
  }, [t]);

  const copy = async () => {
    if (!data?.url) return;
    try {
      await navigator.clipboard.writeText(data.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* игнор */
    }
  };

  return (
    <div style={wrap}>
      <div style={{ maxWidth: 520 }}>
        <div style={badge}>🎁 {t("referral.badge", { defaultValue: "Бонус" })}</div>
        <h2 style={title}>
          {t("referral.title", { defaultValue: "Пригласите — получите +30 дней" })}
        </h2>
        <p style={pitch}>
          {t("referral.pitch", {
            defaultValue:
              "Отправьте личную ссылку коллеге или пациенту. Когда он зарегистрируется — вы оба получаете 30 бонус-дней доступа ко всем функциям.",
          })}
        </p>
      </div>

      {error && <div style={{ color: "#b91c1c", marginTop: 14 }}>{error}</div>}

      {!data && !error && (
        <div style={{ marginTop: 16, color: "#64748b" }}>
          {t("referral.loading", { defaultValue: "Загрузка…" })}
        </div>
      )}

      {data && (
        <>
          <div style={linkRow}>
            <input readOnly value={data.url} style={linkInput} onFocus={(e) => e.target.select()} />
            <button type="button" onClick={copy} style={copied ? copyBtnOk : copyBtn}>
              {copied
                ? t("referral.copied", { defaultValue: "Скопировано" })
                : t("referral.copy", { defaultValue: "Копировать" })}
            </button>
            <ShareMenu url={data.url} title={t("referral.shareTitle", { defaultValue: "Присоединяйтесь ко мне в DocPats" })} className="dp-ref-share" />
          </div>

          <div style={grid}>
            <div style={qrBox}>
              <QRCodeSVG value={data.url} size={128} level="M" includeMargin />
              <div style={qrCap}>{t("referral.scan", { defaultValue: "Наведите камеру" })}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, justifyContent: "center" }}>
              <div style={stat}>
                <b>{data.referralCount ?? 0}</b>
                <span>{t("referral.invited", { defaultValue: "приглашено" })}</span>
              </div>
              <div style={stat}>
                <b>+{data.bonusDays ?? 0}</b>
                <span>{t("referral.bonusDays", { defaultValue: "бонус-дней получено" })}</span>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`.dp-ref-share{background:#0f766e;color:#fff;border:none;border-radius:10px;padding:10px 14px;font-size:14px;cursor:pointer;font-weight:600;}`}</style>
    </div>
  );
}

const wrap = { background: "#fff", border: "1px solid #e6eaf0", borderRadius: 16, padding: 24, maxWidth: 720, margin: "0 auto" };
const badge = { display: "inline-block", fontFamily: "monospace", fontSize: 11, letterSpacing: ".08em", color: "#0f766e", background: "#ccfbf1", padding: "4px 10px", borderRadius: 999, marginBottom: 12 };
const title = { fontSize: 22, margin: "0 0 8px", color: "#0f172a" };
const pitch = { color: "#475569", margin: 0, fontSize: 14.5, lineHeight: 1.6 };
const linkRow = { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 20 };
const linkInput = { flex: "1 1 240px", minWidth: 200, padding: "10px 12px", border: "1px solid #d9dfe8", borderRadius: 10, fontSize: 13, color: "#334155", background: "#f8fafc" };
const copyBtn = { padding: "10px 16px", background: "#3d7fff", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 14 };
const copyBtnOk = { ...copyBtn, background: "#067647" };
const grid = { display: "flex", gap: 20, flexWrap: "wrap", marginTop: 22, alignItems: "center" };
const qrBox = { textAlign: "center" };
const qrCap = { fontSize: 11, color: "#94a3b8", marginTop: 6 };
const stat = { display: "flex", alignItems: "baseline", gap: 8 };
