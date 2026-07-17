// client/src/components/shared/ShareMenu.jsx
//
// Профессиональный шэринг: нативное меню ОС (Web Share API) на мобильных +
// аккуратное выпадающее меню на десктопе (копировать ссылку + соцсети).
// Делимся ВСЕГДА публичной ссылкой (url), чтобы получатель открыл без логина.

import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BsFillShareFill } from "react-icons/bs";
import {
  FaXTwitter,
  FaFacebookF,
  FaLinkedinIn,
  FaWhatsapp,
  FaTelegram,
  FaLink,
  FaEnvelope,
  FaCheck,
} from "react-icons/fa6";

export default function ShareMenu({ url, title = "", className = "sa-share-btn" }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrapRef = useRef(null);

  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const shareTitle = title || (typeof document !== "undefined" ? document.title : "");

  // Закрытие по клику вне меню / Esc
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleTrigger = async () => {
    // На мобильных/поддерживающих браузерах — нативное меню ОС.
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url: shareUrl });
        return;
      } catch {
        // отменили или ошибка — падаем в выпадающее меню
      }
    }
    setOpen((v) => !v);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // старые браузеры — fallback
      const ta = document.createElement("textarea");
      ta.value = shareUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const u = encodeURIComponent(shareUrl);
  const txt = encodeURIComponent(shareTitle);
  const openExt = (href) => {
    window.open(href, "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  const items = [
    { key: "x", label: "X", color: "#000000", icon: <FaXTwitter />, href: `https://twitter.com/intent/tweet?url=${u}&text=${txt}` },
    { key: "fb", label: "Facebook", color: "#1877F2", icon: <FaFacebookF />, href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { key: "in", label: "LinkedIn", color: "#0A66C2", icon: <FaLinkedinIn />, href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { key: "wa", label: "WhatsApp", color: "#25D366", icon: <FaWhatsapp />, href: `https://wa.me/?text=${encodeURIComponent(`${shareTitle} ${shareUrl}`)}` },
    { key: "tg", label: "Telegram", color: "#26A5E4", icon: <FaTelegram />, href: `https://t.me/share/url?url=${u}&text=${txt}` },
    { key: "em", label: t("article_single.share_email", { defaultValue: "Эл. почта" }), color: "#6b7280", icon: <FaEnvelope />, href: `mailto:?subject=${txt}&body=${u}` },
  ];

  return (
    <span ref={wrapRef} style={{ position: "relative", display: "inline-block" }}>
      <button type="button" className={className} onClick={handleTrigger}>
        <BsFillShareFill size={13} />
        {t("article_single.share")}
      </button>

      {open && (
        <div style={menu} role="menu">
          <button type="button" style={row} onClick={copyLink}>
            <span style={{ ...iconBox, background: copied ? "#dcfce7" : "#eef2f7", color: copied ? "#16a34a" : "#334155" }}>
              {copied ? <FaCheck /> : <FaLink />}
            </span>
            <span>{copied ? t("article_single.share_copied", { defaultValue: "Ссылка скопирована" }) : t("article_single.share_copy", { defaultValue: "Скопировать ссылку" })}</span>
          </button>

          <div style={divider} />

          {items.map((it) => (
            <button key={it.key} type="button" style={row} onClick={() => openExt(it.href)}>
              <span style={{ ...iconBox, background: "#f1f5f9", color: it.color }}>{it.icon}</span>
              <span>{it.label}</span>
            </button>
          ))}
        </div>
      )}
    </span>
  );
}

const menu = {
  position: "absolute",
  bottom: "calc(100% + 8px)",
  left: 0,
  zIndex: 1000,
  minWidth: 220,
  background: "#fff",
  border: "1px solid #e6eaf0",
  borderRadius: 12,
  boxShadow: "0 12px 32px rgba(15,23,42,.16)",
  padding: 6,
};
const row = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  width: "100%",
  padding: "9px 10px",
  background: "transparent",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 14,
  color: "#0f172a",
  textAlign: "left",
};
const iconBox = {
  width: 30,
  height: 30,
  borderRadius: 8,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 14,
  flexShrink: 0,
};
const divider = { height: 1, background: "#eef2f7", margin: "6px 4px" };
