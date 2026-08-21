// client/src/pages/communication/components/ChatWindow.jsx
import React from "react";
import { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from "react";
import { useChat } from "../hooks/useChat";
import DialogList from "./DialogList";
import { useLocation, useNavigate } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";
import { getSocket } from "../socket";
import { useBlockStatus } from "../hooks/useBlockStatus";
import { uploadAttachment } from "../api/uploadAttachment";
import { useCallContext } from "../context/GlobalCallProvider";
import { useMessageTranslation } from "../hooks/useMessageTranslation";
import { usePeerPresence } from "../hooks/usePeerPresence";
import { useTranslation } from "react-i18next";
import JitsiRoom from "./JitsiRoom";

const ScribeDraftModal = lazy(() => import("./ScribeDraftModal"));

const API = process.env.REACT_APP_API_URL || "http://localhost:11000";

// ─── Флаги языков ─────────────────────────────────────────────────────────────
const FLAGS = {
  af: "🇿🇦",
  sq: "🇦🇱",
  hy: "🇦🇲",
  az: "🇦🇿",
  eu: "🏴",
  be: "🇧🇾",
  bs: "🇧🇦",
  bg: "🇧🇬",
  ca: "🏴",
  hr: "🇭🇷",
  cs: "🇨🇿",
  da: "🇩🇰",
  nl: "🇳🇱",
  en: "🇬🇧",
  et: "🇪🇪",
  fi: "🇫🇮",
  fr: "🇫🇷",
  gl: "🏴",
  ka: "🇬🇪",
  de: "🇩🇪",
  el: "🇬🇷",
  hu: "🇭🇺",
  is: "🇮🇸",
  ga: "🇮🇪",
  it: "🇮🇹",
  lv: "🇱🇻",
  lt: "🇱🇹",
  lb: "🇱🇺",
  mk: "🇲🇰",
  mt: "🇲🇹",
  no: "🇳🇴",
  pl: "🇵🇱",
  pt: "🇵🇹",
  ro: "🇷🇴",
  ru: "🇷🇺",
  sr: "🇷🇸",
  sk: "🇸🇰",
  sl: "🇸🇮",
  es: "🇪🇸",
  sv: "🇸🇪",
  uk: "🇺🇦",
  cy: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
  zh: "🇨🇳",
  ja: "🇯🇵",
  ko: "🇰🇷",
  hi: "🇮🇳",
  bn: "🇧🇩",
  id: "🇮🇩",
  ms: "🇲🇾",
  my: "🇲🇲",
  ne: "🇳🇵",
  th: "🇹🇭",
  tl: "🇵🇭",
  ur: "🇵🇰",
  uz: "🇺🇿",
  vi: "🇻🇳",
  ar: "🇸🇦",
  he: "🇮🇱",
  fa: "🇮🇷",
  tr: "🇹🇷",
  kk: "🇰🇿",
  ky: "🇰🇬",
  mn: "🇲🇳",
  sw: "🇰🇪",
  am: "🇪🇹",
};

// ─── Инлайн компонент выбора языка (дропдаун прямо в шапке) ──────────────────
function LangDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [langs, setLangs] = useState([]);
  const [saving, setSaving] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/communication/translations/languages`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((d) => setLangs(d.languages || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!open) return;
    const h = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const filtered = langs.filter(({ code, name }) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return name.toLowerCase().includes(q) || code.includes(q);
  });

  const currentLang = langs.find((l) => l.code === value);

  const handleSelect = async (code) => {
    setSaving(true);
    try {
      await fetch(`${API}/communication/translations/preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ lang: code }),
      });
      onChange(code);
    } catch {}
    setSaving(false);
    setOpen(false);
    setSearch("");
  };

  return (
    <div ref={dropRef} style={{ position: "relative" }}>
      <button
        type="button"
        title="Translation language"
        onClick={() => setOpen((v) => !v)}
        style={{
          background: open ? "#eff6ff" : "none",
          border: open ? "1.5px solid #bfdbfe" : "1.5px solid transparent",
          width: 34,
          height: 34,
          borderRadius: 8,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          transition: "all 0.15s",
          color: "#6b7280",
          flexShrink: 0,
        }}
      >
        {FLAGS[value] || "🌐"}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            width: 250,
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 8px 30px rgba(0,0,0,0.14), 0 0 0 1px #e5e7eb",
            zIndex: 9999,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "10px 12px 8px",
              borderBottom: "1px solid #f3f4f6",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 6,
              }}
            >
              Translate messages to
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 6,
              }}
            >
              <span style={{ fontSize: 16 }}>{FLAGS[value] || "🌐"}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                {currentLang?.name || value}
              </span>
              {saving && (
                <span
                  style={{ fontSize: 11, color: "#9ca3af", marginLeft: "auto" }}
                >
                  Saving…
                </span>
              )}
            </div>
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search language…"
              style={{
                width: "100%",
                boxSizing: "border-box",
                border: "1px solid #e5e7eb",
                borderRadius: 7,
                padding: "5px 9px",
                fontSize: 12,
                outline: "none",
                background: "#f9fafb",
                color: "#111827",
                fontFamily: "inherit",
              }}
            />
          </div>
          <div style={{ maxHeight: 230, overflowY: "auto" }}>
            {filtered.length === 0 && (
              <div
                style={{
                  padding: "14px",
                  textAlign: "center",
                  color: "#9ca3af",
                  fontSize: 12,
                }}
              >
                Not found
              </div>
            )}
            {filtered.map(({ code, name }) => {
              const active = code === value;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleSelect(code)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    padding: "7px 12px",
                    background: active ? "#eff6ff" : "transparent",
                    border: "none",
                    borderBottom: "1px solid #f9fafb",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.background = "#f9fafb";
                  }}
                  onMouseLeave={(e) => {
                    if (!active)
                      e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span style={{ fontSize: 16, width: 22, flexShrink: 0 }}>
                    {FLAGS[code] || "🌐"}
                  </span>
                  <span
                    style={{
                      fontSize: 12.5,
                      color: active ? "#2563eb" : "#374151",
                      fontWeight: active ? 600 : 400,
                      flex: 1,
                    }}
                  >
                    {name}
                  </span>
                  <span style={{ fontSize: 10, color: "#9ca3af" }}>{code}</span>
                  {active && (
                    <span style={{ color: "#2563eb", fontSize: 12 }}>✓</span>
                  )}
                </button>
              );
            })}
          </div>
          <div
            style={{
              padding: "5px 12px",
              borderTop: "1px solid #f3f4f6",
              fontSize: 10,
              color: "#9ca3af",
              textAlign: "right",
            }}
          >
            {langs.length} languages · GPT-4o-mini
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Кнопка перевода (компактная, инлайн) ────────────────────────────────────
function TranslateBtn({
  messageId,
  originalText,
  isTranslated,
  isLoading,
  error,
  onToggle,
  isMine,
}) {
  if (!originalText) return null;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      disabled={isLoading}
      title={
        isLoading
          ? "Translating..."
          : isTranslated
            ? "Show original"
            : "Translate"
      }
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        background: "none",
        border: "none",
        cursor: isLoading ? "wait" : "pointer",
        padding: "1px 4px",
        borderRadius: 4,
        fontSize: 10,
        fontFamily: "inherit",
        color: error
          ? "#ef4444"
          : isTranslated
            ? isMine
              ? "rgba(255,255,255,0.9)"
              : "#1a6b8a"
            : isMine
              ? "rgba(255,255,255,0.55)"
              : "#94a3b8",
        opacity: isLoading ? 0.7 : 1,
        transition: "color 0.15s",
        whiteSpace: "nowrap",
        lineHeight: 1,
        marginTop: 2,
      }}
    >
      {isLoading ? (
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          style={{ animation: "tSpin 0.8s linear infinite", flexShrink: 0 }}
        >
          <style>{`@keyframes tSpin { to { transform: rotate(360deg); } }`}</style>
          <circle
            cx="5"
            cy="5"
            r="3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="12 6"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg
          width="10"
          height="10"
          viewBox="0 0 12 12"
          fill="none"
          style={{ flexShrink: 0 }}
        >
          <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
          <ellipse
            cx="6"
            cy="6"
            rx="2"
            ry="5"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <line
            x1="1"
            y1="6"
            x2="11"
            y2="6"
            stroke="currentColor"
            strokeWidth="1"
          />
        </svg>
      )}
      {error ? "Error" : isTranslated ? "Original" : "Translate"}
    </button>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Lora:wght@500;600&display=swap');

  * { box-sizing: border-box; }

  .chat-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #f6f8fa;
    font-family: 'Inter', sans-serif;
    position: relative;
    overflow: hidden;
  }

  /* ── HEADER ── */
  .chat-header.whatsapp {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    height: 62px;
    background: #ffffff;
    border-bottom: 1px solid #eaecf0;
    z-index: 10;
    gap: 10px;
    flex-shrink: 0;
  }
  .chat-header-left { display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1; }
  .back-button {
    background: none; border: none; color: #5c6370;
    width: 32px; height: 32px; border-radius: 8px;
    font-size: 18px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s; flex-shrink: 0;
  }
  .back-button:hover { background: #f0f2f5; }
  .chat-header .avatar {
    width: 38px; height: 38px; border-radius: 50%;
    object-fit: cover; flex-shrink: 0;
    border: 2px solid #eaecf0;
  }
  .chat-header-info { min-width: 0; }
  .chat-header-info .chat-title {
    font-family: 'Inter', sans-serif;
    font-size: 14px; font-weight: 600; color: #111827;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.3;
  }
  .chat-header-info .chat-status { font-size: 11px; color: #6b7280; min-height: 14px; }
  .chat-header-actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
  .chat-header-actions .icon-button {
    background: none; border: none;
    width: 34px; height: 34px; border-radius: 8px;
    font-size: 15px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: #6b7280; transition: background 0.15s;
  }
  .chat-header-actions .icon-button:hover { background: #f0f2f5; }
  .block-button {
    background: none; border: none;
    width: 34px; height: 34px; border-radius: 8px;
    font-size: 15px; cursor: pointer;
    display: flex; align-items: center; justify-content: center; transition: background 0.15s;
  }
  .block-button:hover { background: #f0f2f5; }
  .block-button.blocked { background: #fef2f2; }
  .block-button.blocked:hover { background: #fee2e2; }

  /* ── MESSAGES AREA ── */
  .chat-container { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
  .messages {
    flex: 1; overflow-y: auto;
    padding: 20px 16px 12px;
    display: flex; flex-direction: column; gap: 2px;
  }
  .messages::-webkit-scrollbar { width: 4px; }
  .messages::-webkit-scrollbar-track { background: transparent; }
  .messages::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }

  /* ── MESSAGE ROWS ── */
  .message-row { display: flex; justify-content: flex-start; padding-bottom: 2px; animation: msgIn 0.18s ease; }
  @keyframes msgIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
  .message-row.mine { justify-content: flex-end; }

  .bubble-wrapper {
    display: flex; flex-direction: column; align-items: flex-start;
    max-width: 62%; position: relative;
  }
  .message-row.mine .bubble-wrapper { align-items: flex-end; }

  /* ── SENDER LABEL ── */
  .sender-label {
    font-size: 11px; font-weight: 600; color: #2563eb;
    margin-bottom: 3px; padding-left: 2px;
  }

  /* ── BUBBLE ── */
  .bubble {
    background: #ffffff;
    border-radius: 2px 16px 16px 16px;
    padding: 10px 13px 6px;
    font-size: 13.5px; color: #1f2937;
    line-height: 1.55;
    border: 1px solid #eaecf0;
    position: relative; cursor: pointer;
    transition: border-color 0.15s;
    word-break: break-word;
  }
  .bubble:hover { border-color: #d1d5db; }
  .message-row.mine .bubble {
    background: #2563eb; color: #ffffff;
    border-radius: 16px 2px 16px 16px;
    border-color: transparent;
  }
  .message-row.mine .bubble:hover { background: #1d4ed8; }

  /* ── QUOTED ── */
  .quoted-message {
    background: #f9fafb; border-left: 3px solid #2563eb;
    padding: 5px 8px; border-radius: 0 6px 6px 0;
    margin-bottom: 6px; font-size: 12px;
  }
  .message-row.mine .quoted-message {
    background: rgba(255,255,255,0.15); border-left-color: rgba(255,255,255,0.6);
  }
  .quoted-author { font-weight: 600; font-size: 11px; margin-bottom: 1px; color: #2563eb; }
  .message-row.mine .quoted-author { color: rgba(255,255,255,0.85); }

  .deleted-message { color: #9ca3af; font-style: italic; font-size: 13px; }
  .message-row.mine .deleted-message { color: rgba(255,255,255,0.55); }

  /* ── MSG FOOTER ── */
  .msg-footer {
    display: flex; align-items: center; justify-content: flex-end;
    gap: 4px; margin-top: 4px;
  }
  .time { font-size: 10px; color: #9ca3af; white-space: nowrap; }
  .message-row.mine .time { color: rgba(255,255,255,0.65); }
  .msg-ticks { font-size: 11px; line-height: 1; }
  .msg-ticks.read { color: #60a5fa; }
  .msg-ticks.sent { color: rgba(255,255,255,0.5); }

  /* ── MESSAGE ACTIONS ── */
  .message-actions {
    position: absolute; bottom: calc(100% + 4px); right: 0;
    background: #ffffff; border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.12), 0 0 0 1px #eaecf0;
    display: flex; align-items: center; gap: 1px;
    padding: 4px; z-index: 100;
  }
  .message-row.mine .message-actions { right: 0; left: auto; }
  .message-actions button {
    background: none; border: none; cursor: pointer;
    width: 28px; height: 28px; border-radius: 7px;
    font-size: 13px; display: flex; align-items: center; justify-content: center;
    transition: background 0.12s; color: #6b7280;
  }
  .message-actions button:hover { background: #f3f4f6; color: #111827; }
  .message-actions .close-actions { color: #9ca3af; }

  /* ── REACTION BAR ── */
  .reaction-bar {
    position: absolute; top: -46px; left: 0;
    background: #ffffff; border-radius: 999px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.1), 0 0 0 1px #eaecf0;
    display: flex; align-items: center; gap: 1px;
    padding: 4px 6px; z-index: 200;
    transition: opacity 0.14s, transform 0.14s;
  }
  .reaction-bar.hidden { opacity: 0; pointer-events: none; transform: translateY(4px) scale(0.9); }
  .reaction-bar.visible { opacity: 1; pointer-events: auto; transform: translateY(0) scale(1); }
  .reaction-btn {
    background: none; border: none; cursor: pointer;
    font-size: 18px; width: 32px; height: 32px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.12s, background 0.12s;
  }
  .reaction-btn:hover { transform: scale(1.3); background: #f3f4f6; }
  .reaction-btn.active { background: #eff6ff; }

  /* ── REACTION CHIPS ── */
  .reaction-chips { display: flex; flex-wrap: wrap; gap: 3px; margin-top: 4px; }
  .reaction-chip {
    display: inline-flex; align-items: center; gap: 3px;
    background: #f9fafb; border: 1px solid #e5e7eb;
    border-radius: 999px; padding: 2px 8px 2px 5px;
    font-size: 12px; cursor: default;
    animation: chipPop 0.18s cubic-bezier(0.34,1.56,0.64,1);
  }
  .reaction-chip.mine-reaction { border-color: #bfdbfe; background: #eff6ff; }
  @keyframes chipPop { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  .reaction-chip-count { font-size: 10px; font-weight: 600; color: #4b5563; }
  .reaction-chip.mine-reaction .reaction-chip-count { color: #2563eb; }

  /* ── DATE SEPARATOR ── */
  .date-separator { display: flex; align-items: center; gap: 10px; padding: 14px 0 6px; user-select: none; }
  .date-separator::before, .date-separator::after { content: ''; flex: 1; height: 1px; background: #e5e7eb; }
  .date-separator-label {
    font-size: 11px; font-weight: 500; color: #9ca3af;
    white-space: nowrap; letter-spacing: 0.04em; text-transform: uppercase;
  }

  /* ── TYPING ── */
  .typing { font-size: 12px; color: #6b7280; padding: 2px 10px; display: flex; align-items: center; gap: 6px; }
  .typing-dots { display: flex; gap: 3px; align-items: center; }
  .typing-dots span {
    width: 6px; height: 6px; border-radius: 50%; background: #9ca3af;
    animation: tdot 1s ease infinite;
  }
  .typing-dots span:nth-child(2) { animation-delay: 0.15s; }
  .typing-dots span:nth-child(3) { animation-delay: 0.3s; }
  @keyframes tdot { 0%,80%,100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }

  /* ── INPUT AREA ── */
  .input-area {
    display: flex; align-items: flex-end; gap: 6px;
    padding: 10px 14px 10px;
    background: #ffffff; border-top: 1px solid #eaecf0;
  }
  .input-area .icon-button {
    background: none; border: none; cursor: pointer;
    width: 36px; height: 36px; border-radius: 8px;
    font-size: 17px; display: flex; align-items: center; justify-content: center;
    color: #6b7280; transition: background 0.15s, color 0.15s; flex-shrink: 0;
  }
  .input-area .icon-button:hover { background: #f3f4f6; color: #2563eb; }
  .input-area .mic.recording { color: #ef4444; background: #fef2f2; animation: pulse 1s ease infinite; }
  @keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,.3); } 50% { box-shadow: 0 0 0 7px rgba(239,68,68,0); } }

  .input-wrapper { flex: 1; position: relative; }
  .input-wrapper input[type="text"] {
    width: 100%; box-sizing: border-box;
    border: 1.5px solid #e5e7eb; border-radius: 22px;
    padding: 9px 16px;
    font-family: 'Inter', sans-serif; font-size: 13.5px;
    color: #111827; background: #f9fafb;
    outline: none; transition: border-color 0.2s, background 0.2s;
  }
  .input-wrapper input[type="text"]:focus { border-color: #2563eb; background: #fff; }
  .input-wrapper input[type="text"]::placeholder { color: #9ca3af; }

  .send-button {
    background: #2563eb; border: none;
    width: 38px; height: 38px; border-radius: 50%;
    color: #fff; font-size: 15px; cursor: pointer;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    transition: background 0.15s, transform 0.12s;
  }
  .send-button:hover { background: #1d4ed8; }
  .send-button:active { transform: scale(0.94); }

  /* ── REPLY PREVIEW ── */
  .reply-preview {
    background: #f9fafb; border-top: 1px solid #eaecf0;
    border-left: 3px solid #2563eb; padding: 8px 14px;
    display: flex; flex-direction: column; gap: 2px;
  }
  .reply-header {
    display: flex; justify-content: space-between; align-items: center;
    font-size: 11px; font-weight: 600; color: #2563eb; text-transform: uppercase; letter-spacing: 0.05em;
  }
  .reply-header button { background: none; border: none; cursor: pointer; color: #9ca3af; font-size: 14px; line-height: 1; transition: color 0.12s; }
  .reply-header button:hover { color: #ef4444; }
  .reply-text { font-size: 12px; color: #4b5563; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  /* ── FILE PREVIEW ── */
  .file-preview-panel {
    background: #f9fafb; border-top: 1px solid #eaecf0;
    padding: 8px 14px; display: flex; align-items: center; gap: 10px;
  }
  .file-preview-thumb { width: 48px; height: 48px; border-radius: 8px; object-fit: cover; border: 1px solid #e5e7eb; flex-shrink: 0; }
  .file-preview-icon { width: 48px; height: 48px; border-radius: 8px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
  .file-preview-info { flex: 1; min-width: 0; }
  .file-preview-name { font-size: 12px; font-weight: 500; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .file-preview-size { font-size: 10px; color: #9ca3af; margin-top: 1px; }
  .file-preview-remove { background: none; border: none; cursor: pointer; color: #9ca3af; font-size: 17px; transition: color 0.12s; }
  .file-preview-remove:hover { color: #ef4444; }

  /* ── BANNERS ── */
  .blocked-banner {
    background: #fef2f2; border-top: 1px solid #fecaca;
    padding: 8px 16px; display: flex; align-items: center; justify-content: space-between; gap: 10px;
    font-size: 12px; color: #dc2626;
  }
  .blocked-banner-text { display: flex; align-items: center; gap: 7px; font-weight: 600; }
  .blocked-banner button {
    background: none; border: 1px solid #fca5a5; color: #dc2626;
    border-radius: 6px; padding: 3px 10px; font-size: 11px; cursor: pointer; transition: background 0.12s;
  }
  .blocked-banner button:hover { background: #fee2e2; }
  .blocked-by-peer-banner { background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 8px 16px; text-align: center; font-size: 12px; color: #6b7280; }
  .input-area.disabled { opacity: 0.5; pointer-events: none; }

  /* ── ERROR TOAST ── */
  .error-toast {
    position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
    background: #fef2f2; color: #dc2626; border: 1px solid #fecaca;
    border-radius: 8px; padding: 7px 16px; font-size: 12px; font-weight: 500;
    z-index: 999; white-space: nowrap; animation: toastIn 0.16s ease;
  }
  @keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(-6px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

  /* ── JITSI VIDEO OVERLAY ── */
  .jitsi-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.6);
    display: flex; align-items: center; justify-content: center;
    z-index: 6000; padding: 24px;
  }
  .jitsi-panel {
    width: 100%; max-width: 920px; height: 78vh; max-height: 700px;
    border-radius: 14px; overflow: hidden;
    box-shadow: 0 24px 60px rgba(0,0,0,0.4);
  }

  /* ── MEDIA CARDS ── */
  .video-card { position: relative; border-radius: 10px; overflow: hidden; cursor: pointer; background: #111; max-width: 260px; }
  .video-thumb { width: 100%; max-height: 180px; object-fit: cover; display: block; opacity: 0.75; }
  .video-play { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); font-size: 30px; color: #fff; pointer-events: none; background: rgba(0,0,0,.4); border-radius: 50%; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; }
  .video-download { position: absolute; top: 6px; right: 6px; background: rgba(0,0,0,.5); border: none; color: #fff; border-radius: 5px; padding: 3px 7px; cursor: pointer; font-size: 11px; }
  .video-info { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent,rgba(0,0,0,.6)); color: #fff; font-size: 10px; padding: 14px 8px 5px; display: flex; justify-content: space-between; }

  .video-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.92); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 9999; cursor: zoom-out; padding: 16px; }
  .video-modal-inner { position: relative; max-width: 90vw; max-height: 82vh; display: flex; flex-direction: column; align-items: center; gap: 10px; cursor: default; }
  .video-modal-player { max-width: 90vw; max-height: 72vh; border-radius: 10px; outline: none; background: #000; }
  .video-modal-bar { display: flex; align-items: center; gap: 10px; }
  .video-modal-name { color: rgba(255,255,255,.8); font-size: 12px; max-width: 260px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .video-modal-dl { background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.22); color: #fff; border-radius: 6px; padding: 4px 10px; font-size: 11px; cursor: pointer; }
  .video-modal-close { position: absolute; top: -12px; right: -12px; background: rgba(255,255,255,.14); border: none; color: #fff; border-radius: 50%; width: 28px; height: 28px; font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; }

  .audio-card { display: flex; align-items: center; gap: 9px; background: #f3f4f6; border-radius: 12px; padding: 9px 11px; min-width: 190px; max-width: 250px; }
  .message-row.mine .audio-card { background: rgba(255,255,255,.18); }
  .audio-play { background: #2563eb; border: none; color: #fff; width: 32px; height: 32px; border-radius: 50%; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .audio-play:hover { background: #1d4ed8; }
  .audio-info { flex: 1; min-width: 0; }
  .audio-name { font-size: 11px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: inherit; }
  .audio-meta { font-size: 9px; color: #9ca3af; margin-top: 1px; }
  .message-row.mine .audio-meta { color: rgba(255,255,255,.58); }
  .audio-wave { height: 3px; background: rgba(0,0,0,.1); border-radius: 2px; margin-top: 5px; overflow: hidden; }
  .message-row.mine .audio-wave { background: rgba(255,255,255,.22); }
  .audio-progress { height: 100%; background: #2563eb; border-radius: 2px; transition: width .1s linear; }
  .message-row.mine .audio-progress { background: rgba(255,255,255,.8); }
  .audio-time { font-size: 10px; color: #9ca3af; flex-shrink: 0; }
  .message-row.mine .audio-time { color: rgba(255,255,255,.62); }
  .audio-download { background: none; border: none; cursor: pointer; font-size: 13px; color: #9ca3af; padding: 2px; flex-shrink: 0; }
  .audio-download:hover { color: #2563eb; }

  /* ── SHARE MODAL ── */
  .share-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center; z-index: 2000; }
  .share-modal { background: #fff; border-radius: 16px; padding: 22px 18px 16px; width: 310px; max-width: 90vw; max-height: 68vh; overflow-y: auto; box-shadow: 0 20px 50px rgba(0,0,0,.18); }
  .share-modal h3 { font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 14px; }
  .share-empty { color: #9ca3af; font-size: 13px; text-align: center; padding: 16px 0; }
  .share-modal button[type="button"] { font-family: 'Inter', sans-serif; cursor: pointer; border-radius: 8px; font-size: 13px; font-weight: 500; transition: all 0.15s; border: none; padding: 8px 14px; }
  .share-modal button[type="button"]:not(:disabled):not([data-secondary]) { background: #2563eb; color: #fff; }
  .share-modal button[type="button"]:not(:disabled):not([data-secondary]):hover { background: #1d4ed8; }
  .share-modal button[type="button"]:disabled { background: #f3f4f6; color: #9ca3af; cursor: not-allowed; }

  .empty { display: flex; align-items: center; justify-content: center; height: 100%; color: #9ca3af; font-size: 13px; background: #f6f8fa; }
`;

const QUICK_REACTIONS = ["❤️", "😂", "👍", "😮", "😢", "🔥"];

const formatFileSize = (bytes) => {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return mb.toFixed(2) + " MB";
  return (bytes / 1024).toFixed(0) + " KB";
};

const downloadFile = async (url, name) => {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = name || "file";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error("Download failed", err);
  }
};

function applyReactionUpdate(
  prev,
  { messageId, emoji, userId, action },
  currentUserId,
) {
  const key = String(messageId);
  const msgReactions = { ...(prev[key] || {}) };
  const existing = msgReactions[emoji] || { count: 0, reactedByMe: false };
  const isMine = String(userId) === String(currentUserId);
  if (action === "add") {
    msgReactions[emoji] = {
      count: existing.count + 1,
      reactedByMe: isMine ? true : existing.reactedByMe,
    };
  } else {
    const newCount = Math.max(0, existing.count - 1);
    msgReactions[emoji] = {
      count: newCount,
      reactedByMe: isMine ? false : existing.reactedByMe,
    };
    if (msgReactions[emoji].count === 0) delete msgReactions[emoji];
  }
  return { ...prev, [key]: msgReactions };
}

function formatDateLabel(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (isSameDay(d, today)) return "Today";
  if (isSameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

function getDayKey(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr || "unknown";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function groupMessagesByDate(msgs) {
  const map = new Map();
  const order = [];
  for (const m of msgs) {
    const dayKey = getDayKey(m.createdAt);
    if (!map.has(dayKey)) {
      map.set(dayKey, {
        label: formatDateLabel(m.createdAt),
        dayKey,
        messages: [m],
      });
      order.push(dayKey);
    } else map.get(dayKey).messages.push(m);
  }
  return order.map((k) => map.get(k));
}

function ReadTicks({ isMine, readBy = [], currentUserId }) {
  if (!isMine) return null;
  const isRead =
    Array.isArray(readBy) &&
    readBy.some((r) => {
      const rid = r.userId?._id || r.userId;
      return rid && String(rid) !== String(currentUserId);
    });
  return (
    <span className={`msg-ticks ${isRead ? "read" : "sent"}`}>
      {isRead ? "✓✓" : "✓"}
    </span>
  );
}

function AudioPlayer({ src, name, size, mime }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) a.pause();
    else a.play();
    setPlaying(!playing);
  };
  const formatTime = (sec) =>
    !sec
      ? "0:00"
      : `${Math.floor(sec / 60)}:${Math.floor(sec % 60)
          .toString()
          .padStart(2, "0")}`;
  const formatSz = (b) =>
    !b
      ? ""
      : b / (1024 * 1024) >= 1
        ? (b / (1024 * 1024)).toFixed(2) + " MB"
        : (b / 1024).toFixed(0) + " KB";
  const ext = mime?.split("/")[1] || "";
  return (
    <div className="audio-card">
      <button className="audio-play" onClick={toggle}>
        {playing ? "⏸" : "▶"}
      </button>
      <div className="audio-info">
        <div className="audio-name">{name}</div>
        <div className="audio-meta">
          {ext.toUpperCase()} • {formatSz(size)}
        </div>
        <div className="audio-wave">
          <div className="audio-progress" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="audio-time">{formatTime(duration)}</div>
      <button
        className="audio-download"
        onClick={(e) => {
          e.stopPropagation();
          downloadFile(src, name);
        }}
      >
        ⬇
      </button>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={() => {
          const a = audioRef.current;
          if (a) setProgress((a.currentTime / a.duration) * 100);
        }}
        onLoadedMetadata={(e) => setDuration(e.target.duration)}
        onEnded={() => setPlaying(false)}
      />
    </div>
  );
}

function ChatWindow({
  dialogId,
  currentUser,
  dialogs = [],
  peerUser,
  dialogTitle,
  dialogAvatar,
  onShareMessage,
}) {
  const {
    messages,
    isReady,
    sendMessage,
    typingUsers,
    emitTyping,
    loadMore,
    hasMore,
    loadingMore,
  } = useChat(dialogId);
  const location = useLocation();
  const navigate = useNavigate();

  const emojiRef = useRef(null);
  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);
  const chatContainerRef = useRef(null);
  const recognitionRef = useRef(null);

  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [replyMessage, setReplyMessage] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [messageToShare, setMessageToShare] = useState(null);
  const [selectedDialogToShare, setSelectedDialogToShare] = useState(null);
  const [errorToast, setErrorToast] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [zoomImage, setZoomImage] = useState(null);
  const [zoomVideo, setZoomVideo] = useState(null);
  const [reactions, setReactions] = useState({});
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  // ── Jitsi видеоконференция (отдельно от native-звонка) ──
  const [showJitsi, setShowJitsi] = useState(false);
  const hoverTimerRef = useRef(null);

  const extractId = (obj) => {
    if (!obj) return null;
    if (typeof obj === "string") return obj;
    return obj._id || obj.id || null;
  };

  const currentUserId = extractId(currentUser);
  const peerId = extractId(peerUser);

  // Звонить тому, кого нет на сайте, бессмысленно: экран входящего
  // показывать некому, и звонящий 45 секунд слушает гудки в пустоту.
  // Пуш о вызове ему всё равно уйдёт (call.gateway.js), но начинать
  // разговор, которого не будет, — не нужно.
  //
  // null означает «не знаем» и кнопки НЕ гасит: в групповом диалоге
  // личного собеседника нет вовсе, а до ответа сервера запрещать звонок
  // не за что.
  const peerOnline = usePeerPresence(peerId);
  const callBlocked = peerOnline === false;
  // Русский текст вторым аргументом: пока словарь грузится, показывается
  // он, а не голый ключ (та же схема, что в ScribePanel).
  const { t } = useTranslation("Communication");

  // Черновик приёма, собранный из разговора. Показывается врачу сразу
  // после завершения записи, поверх чата.
  const [scribeDraft, setScribeDraft] = useState(null);

  // Имя текущего пользователя для подписи в видеокомнате
  const myDisplayName =
    [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(" ") ||
    currentUser?.name ||
    dialogTitle ||
    "User";

  // ── Язык перевода ─────────────────────────────────────────────────────────
  const [userLang, setUserLang] = useState(
    currentUser?.preferredLanguage || "ru",
  );
  // Запоминаем какие сообщения были показаны переведёнными — чтобы переперевести при смене языка
  const shownTranslationsRef = useRef(new Map()); // messageId → originalText

  const { callState, initiateCall } = useCallContext();
  const {
    toggleTranslation: _toggleTranslation,
    isTranslated,
    getText,
    loadingIds,
    errorIds,
  } = useMessageTranslation(userLang);

  // Обёртка над toggleTranslation — запоминаем показанные переводы
  const toggleTranslation = useCallback(
    (messageId, originalText) => {
      _toggleTranslation(messageId, originalText);
      // Если сейчас НЕ показан — значит будет показан после toggle → запоминаем
      if (!isTranslated(messageId)) {
        shownTranslationsRef.current.set(messageId, originalText);
      } else {
        shownTranslationsRef.current.delete(messageId);
      }
    },
    [_toggleTranslation, isTranslated],
  );

  // При смене языка — автоматически перезапросить переводы для ранее показанных сообщений
  useEffect(() => {
    const shown = shownTranslationsRef.current;
    if (!shown.size) return;
    const timer = setTimeout(() => {
      shown.forEach((originalText, messageId) => {
        _toggleTranslation(messageId, originalText);
      });
    }, 60);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLang]);

  const showError = (msg) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(null), 4000);
  };
  const {
    isBlocked,
    blockedByPeer,
    loading: blockLoading,
    fetchStatus,
    block,
    unblock,
  } = useBlockStatus(peerId);
  const formatTime = (createdAt) => {
    if (!createdAt) return "";
    return new Date(createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const DELETE_TIME_LIMIT_MS = 10 * 60 * 1000;
  const canDeleteMessage = (message) => {
    const senderId = extractId(message.sender);
    if (!senderId || !currentUserId) return false;
    if (String(senderId) !== String(currentUserId)) return false;
    if (!message.createdAt) return false;
    return (
      Date.now() - new Date(message.createdAt).getTime() <= DELETE_TIME_LIMIT_MS
    );
  };

  const isAtBottomRef = useRef(true);
  const prevScrollHeightRef = useRef(0);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const distFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      isAtBottomRef.current = distFromBottom < 80;
      if (container.scrollTop < 80 && hasMore && !loadingMore) {
        prevScrollHeightRef.current = container.scrollHeight;
        loadMore();
      }
    };
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [hasMore, loadingMore, loadMore]);

  useEffect(() => {
    if (loadingMore) return;
    const container = chatContainerRef.current;
    if (!container || !prevScrollHeightRef.current) return;
    const diff = container.scrollHeight - prevScrollHeightRef.current;
    if (diff > 0) {
      container.scrollTop += diff;
      prevScrollHeightRef.current = 0;
    }
  }, [loadingMore]);

  useEffect(() => {
    if (!dialogId) return;
    const socket = getSocket();
    const h = ({ message }) => showError(message || "Server error");
    socket.on("error", h);
    return () => socket.off("error", h);
  }, [dialogId]);
  useEffect(() => {
    if (!dialogId) return;
    const socket = getSocket();
    const h = (p) =>
      setReactions((prev) => applyReactionUpdate(prev, p, currentUserId));
    socket.on("message:reaction", h);
    return () => socket.off("message:reaction", h);
  }, [dialogId, currentUserId]);
  useEffect(() => {
    if (!dialogId) return;
    const socket = getSocket();
    const h = () => {
      fetchStatus();
    };
    socket.on("message:blocked", h);
    return () => socket.off("message:blocked", h);
  }, [dialogId, fetchStatus]);

  useEffect(() => {
    messages.forEach((m) => {
      if (m.isDeleted)
        setReactions((prev) => {
          const key = String(m.id);
          if (!prev[key]) return prev;
          const next = { ...prev };
          delete next[key];
          return next;
        });
    });
  }, [messages]);

  useEffect(() => {
    if (!messages.length) return;
    setReactions((prev) => {
      const next = { ...prev };
      messages.forEach((m) => {
        const key = String(m.id);
        if (m.reactions && !next[key]) {
          const grouped = {};
          m.reactions.forEach(({ emoji, userId }) => {
            if (!grouped[emoji])
              grouped[emoji] = { count: 0, reactedByMe: false };
            grouped[emoji].count++;
            if (String(userId) === String(currentUserId))
              grouped[emoji].reactedByMe = true;
          });
          next[key] = grouped;
        }
      });
      return next;
    });
  }, [messages, currentUserId]);

  const handleReact = useCallback(
    (messageId, emoji) => {
      const socket = getSocket();
      const key = String(messageId);
      const existing = reactions[key]?.[emoji];
      const action = existing?.reactedByMe ? "remove" : "add";
      setReactions((prev) =>
        applyReactionUpdate(
          prev,
          { messageId, emoji, userId: currentUserId, action },
          currentUserId,
        ),
      );
      socket.emit("message:react", { messageId, dialogId, emoji, action });
    },
    [reactions, currentUserId, dialogId],
  );

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    const h = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target))
        setShowEmojiPicker(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    if (location.state?.forwardedMessage) {
      const fwd = location.state.forwardedMessage;
      const fwdPayload = { text: fwd.text || "" };
      if (fwd.attachments?.length > 0) {
        const att = fwd.attachments[0];
        fwdPayload.attachment = {
          url: att.url,
          originalName: att.originalName || "file",
          mimeType: att.mimeType || "",
          fileSizeBytes: att.fileSizeBytes || 0,
          type: att.type || att.mimeType?.split("/")[0] || "file",
          storageKey: att.storageKey || "",
        };
      }
      sendMessage(fwdPayload);
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, isReady, navigate, location.pathname, sendMessage]);

  useEffect(() => {
    const h = () => setSelectedMessage(null);
    window.addEventListener("click", h);
    return () => window.removeEventListener("click", h);
  }, []);

  const prevMessagesLenRef = useRef(0);
  const initialScrollDoneRef = useRef(false);

  useEffect(() => {
    if (loadingMore) return;
    const container = chatContainerRef.current;
    if (!container) return;
    const prevLen = prevMessagesLenRef.current;
    const currLen = messages.length;
    prevMessagesLenRef.current = currLen;
    if (!isReady) return;
    if (!initialScrollDoneRef.current && currLen > 0) {
      initialScrollDoneRef.current = false;
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
        isAtBottomRef.current = true;
        initialScrollDoneRef.current = true;
      });
      return;
    }
    if (currLen === prevLen + 1 && isAtBottomRef.current)
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
  }, [messages, loadingMore, isReady]);

  useEffect(() => {
    initialScrollDoneRef.current = false;
    prevMessagesLenRef.current = 0;
    isAtBottomRef.current = true;
    prevScrollHeightRef.current = 0;
  }, [dialogId]);
  useEffect(() => {
    if (!dialogId) return;
    if (text.length > 0) emitTyping("start");
    else emitTyping("stop");
    const t = setTimeout(() => emitTyping("stop"), 2000);
    return () => clearTimeout(t);
  }, [text, dialogId, emitTyping]);

  // Закрыть видео при смене диалога
  useEffect(() => {
    setShowJitsi(false);
  }, [dialogId]);

  const MAX_MSG_LENGTH = 5000;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isBlocked || blockedByPeer) return;
    if (!text.trim() && !pendingFile) return;
    if (text.length > MAX_MSG_LENGTH) {
      showError(`Message too long (${text.length}/${MAX_MSG_LENGTH})`);
      return;
    }
    if (pendingFile) {
      setUploadProgress(0);
      uploadAttachment(pendingFile.file, dialogId, (pct) =>
        setUploadProgress(pct),
      )
        .then((uploaded) => {
          sendMessage({
            text: text || "",
            attachment: {
              url: uploaded.url || uploaded.fileUrl,
              originalName:
                uploaded.originalName ||
                uploaded.fileName ||
                pendingFile.file.name,
              mimeType:
                uploaded.mimeType ||
                uploaded.fileFormat ||
                pendingFile.file.type,
              fileSizeBytes:
                uploaded.fileSizeBytes ||
                uploaded.fileSize ||
                pendingFile.file.size,
              type:
                uploaded.fileType ||
                pendingFile.file.type.split("/")[0] ||
                "file",
              storageKey: uploaded.storageKey || "",
            },
            replyToId: replyMessage?.id || null,
            onError: showError,
          });
        })
        .catch((err) => showError(err.message || "Upload failed"))
        .finally(() => {
          setUploadProgress(null);
          if (pendingFile.previewUrl)
            URL.revokeObjectURL(pendingFile.previewUrl);
          setPendingFile(null);
        });
    } else {
      sendMessage({
        text,
        replyToId: replyMessage?.id || null,
        onError: showError,
      });
    }
    setText("");
    setShowEmojiPicker(false);
    setReplyMessage(null);
  };

  const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "video/mp4",
    "video/webm",
    "audio/mpeg",
    "audio/ogg",
    "audio/wav",
  ];
  const MAX_FILE_SIZE_MB = 20;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      showError(`Invalid file type: ${file.type || "unknown"}`);
      e.target.value = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      showError(`File too large (max ${MAX_FILE_SIZE_MB} MB)`);
      e.target.value = "";
      return;
    }
    const previewUrl = file.type.startsWith("image/")
      ? URL.createObjectURL(file)
      : null;
    setPendingFile({ file, previewUrl });
    e.target.value = "";
  };

  const handleEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const toggleVoice = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Voice input not supported");
      return;
    }
    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (e) => {
      const t = e.results[0][0].transcript;
      setText((prev) => (prev ? prev + " " + t : t));
    };
    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleShareToDialog = (targetDialogId) => {
    if (!messageToShare) return;
    onShareMessage?.(targetDialogId, messageToShare);
    setShowShareModal(false);
    setMessageToShare(null);
  };
  const otherDialogs = useMemo(
    () => dialogs.filter((d) => String(d._id) !== String(dialogId)),
    [dialogs, dialogId],
  );
  const socket = getSocket();
  const handleDeleteMessage = (messageId) => {
    socket.emit("message:delete", { messageId });
    setReactions((prev) => {
      const next = { ...prev };
      delete next[String(messageId)];
      return next;
    });
  };
  const handleBack = () => {
    navigate(
      location.pathname.startsWith("/doctor")
        ? "/doctor/communication"
        : "/patient/communication",
    );
  };

  if (!dialogId) return <div className="empty">Select a dialog</div>;
  if (!isReady) return <div className="empty">Loading messages…</div>;

  return (
    <>
      <style>{styles}</style>
      <div className="chat-wrapper">
        {/* ── ШАПКА ── */}
        <div className="chat-header whatsapp">
          <div className="chat-header-left">
            <button type="button" className="back-button" onClick={handleBack}>
              ←
            </button>
            {dialogAvatar && (
              <img src={dialogAvatar} alt="" className="avatar" />
            )}
            <div className="chat-header-info">
              <div className="chat-title">{dialogTitle || "Untitled"}</div>
              <div className="chat-status">
                {typingUsers.size > 0
                  ? "typing…"
                  : callBlocked
                    ? t("call.peerOffline", "Не в сети")
                    : ""}
              </div>
            </div>
          </div>

          <div className="chat-header-actions">
            {/* Аудио звонок */}
            <button
              className="icon-button"
              title={
                callBlocked
                  ? t("call.peerOfflineHint", "Собеседник не в сети")
                  : "Audio call"
              }
              disabled={callBlocked}
              onClick={() => {
                if (callState !== "idle" || !peerId || callBlocked) return;
                initiateCall({
                  targetDialogId: dialogId,
                  targetPeerId: peerId,
                  peerName: dialogTitle || "Unknown",
                  peerAvatar: dialogAvatar,
                  type: "audio",
                });
              }}
              style={{ opacity: callState !== "idle" || callBlocked ? 0.4 : 1 }}
            >
              📞
            </button>

            {/* Видеозвонок.
                Идёт через ТУ ЖЕ сигнализацию, что и аудио (call:initiate →
                call:incoming), поэтому у второй стороны появляется окно
                входящего вызова с «Принять / Отклонить».
                Раньше кнопка просто открывала комнату Jitsi у себя:
                собеседник ничего не видел и, чтобы связь появилась, должен
                был сам нажать «Начать видеозвонок» — то есть звонка как
                такового не было, была общая комната.
                Групповой диалог (персонального собеседника нет) по-прежнему
                открывает комнату напрямую: звонить там некому лично. */}
            <button
              className="icon-button"
              title={
                callBlocked
                  ? t("call.peerOfflineHint", "Собеседник не в сети")
                  : "Video call"
              }
              // Групповой диалог кнопку не теряет: там peerId нет, значит и
              // callBlocked никогда не выставится — она по-прежнему просто
              // открывает общую комнату.
              disabled={callBlocked}
              onClick={() => {
                if (!peerId) {
                  setShowJitsi(true);
                  return;
                }
                if (callState !== "idle" || callBlocked) return;
                initiateCall({
                  targetDialogId: dialogId,
                  targetPeerId: peerId,
                  peerName: dialogTitle || "Unknown",
                  peerAvatar: dialogAvatar,
                  type: "video",
                });
              }}
              style={{ opacity: callState !== "idle" || callBlocked ? 0.4 : 1 }}
            >
              🎥
            </button>

            {/* Блокировка */}
            <button
              className={`block-button ${isBlocked ? "blocked" : ""}`}
              title={isBlocked ? "Unblock user" : "Block user"}
              disabled={blockLoading}
              onClick={isBlocked ? unblock : block}
            >
              {isBlocked ? "🔓" : "🚫"}
            </button>

            {/* 🌐 Выбор языка перевода — компактный дропдаун */}
            <LangDropdown value={userLang} onChange={setUserLang} />
          </div>
        </div>

        <div className="chat-container">
          {errorToast && <div className="error-toast">⚠️ {errorToast}</div>}

          {loadingMore && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "12px 0",
                gap: 5,
              }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#1a6b8a",
                    opacity: 0.7,
                    animation: "pulse 1s ease infinite",
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
          )}
          {!hasMore && messages.length > 0 && isReady && (
            <div
              style={{
                textAlign: "center",
                padding: "10px 0",
                color: "#94a3b8",
                fontSize: 11,
              }}
            >
              — Start of conversation —
            </div>
          )}

          {/* Зум фото */}
          {zoomImage && (
            <div
              onClick={() => setZoomImage(null)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.95)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
                cursor: "zoom-out",
              }}
            >
              <img
                src={zoomImage}
                style={{
                  maxWidth: "95%",
                  maxHeight: "95%",
                  objectFit: "contain",
                  borderRadius: 8,
                }}
              />
            </div>
          )}

          {/* Зум видео */}
          {zoomVideo && (
            <div
              className="video-modal-overlay"
              onClick={() => setZoomVideo(null)}
            >
              <div
                className="video-modal-inner"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="video-modal-close"
                  onClick={() => setZoomVideo(null)}
                >
                  ✕
                </button>
                <video
                  className="video-modal-player"
                  src={zoomVideo.url}
                  controls
                  autoPlay
                  playsInline
                  preload="auto"
                />
                <div className="video-modal-bar">
                  <span className="video-modal-name">🎬 {zoomVideo.name}</span>
                  <button
                    className="video-modal-dl"
                    onClick={() => downloadFile(zoomVideo.url, zoomVideo.name)}
                  >
                    ⬇ Download
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── СПИСОК СООБЩЕНИЙ ── */}
          <div className="messages" ref={chatContainerRef}>
            {groupMessagesByDate(messages).map(
              ({ label, dayKey, messages: group }) => (
                <React.Fragment key={dayKey}>
                  <div className="date-separator">
                    <span className="date-separator-label">{label}</span>
                  </div>

                  {group.map((m) => {
                    const senderId = extractId(m.sender);
                    const isMine =
                      senderId &&
                      currentUserId &&
                      String(senderId) === String(currentUserId);
                    const msgReactions = reactions[String(m.id)] || {};
                    const hasReactions = Object.keys(msgReactions).length > 0;

                    return (
                      <div
                        key={m.id}
                        className={`message-row ${isMine ? "mine" : ""}`}
                      >
                        <div
                          className={`bubble-wrapper ${isMine ? "mine-wrapper" : ""}`}
                          onMouseEnter={() => {
                            if (!isMine && !m.isDeleted) {
                              clearTimeout(hoverTimerRef.current);
                              setHoveredMessageId(m.id);
                            }
                          }}
                          onMouseLeave={() => {
                            hoverTimerRef.current = setTimeout(
                              () => setHoveredMessageId(null),
                              200,
                            );
                          }}
                        >
                          {/* Быстрые реакции */}
                          {!isMine && !m.isDeleted && (
                            <div
                              className={`reaction-bar ${hoveredMessageId === m.id ? "visible" : "hidden"}`}
                              onMouseEnter={() => {
                                clearTimeout(hoverTimerRef.current);
                                setHoveredMessageId(m.id);
                              }}
                              onMouseLeave={() => {
                                hoverTimerRef.current = setTimeout(
                                  () => setHoveredMessageId(null),
                                  200,
                                );
                              }}
                            >
                              {QUICK_REACTIONS.map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  className={`reaction-btn ${msgReactions[emoji]?.reactedByMe ? "active" : ""}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReact(m.id, emoji);
                                  }}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}

                          <div
                            className="bubble"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMessage(m);
                            }}
                          >
                            {/* Цитата */}
                            {m.replyTo &&
                              (() => {
                                const rSender = m.replyTo.sender;
                                const rName = rSender
                                  ? [rSender.firstName, rSender.lastName]
                                      .filter(Boolean)
                                      .join(" ") ||
                                    rSender.email ||
                                    "User"
                                  : String(m.replyTo.senderId || "") ===
                                      String(currentUserId)
                                    ? "You"
                                    : "User";
                                const rAtt = m.replyTo.attachments?.[0];
                                const rExt =
                                  rAtt?.url?.split(".").pop()?.toLowerCase() ||
                                  "";
                                const rIsImg = [
                                  "jpg",
                                  "jpeg",
                                  "png",
                                  "gif",
                                  "webp",
                                ].includes(rExt);
                                return (
                                  <div className="quoted-message">
                                    <div className="quoted-author">{rName}</div>
                                    {rAtt ? (
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 7,
                                          marginTop: 2,
                                        }}
                                      >
                                        {rIsImg && (
                                          <img
                                            src={rAtt.url}
                                            style={{
                                              width: 34,
                                              height: 34,
                                              borderRadius: 4,
                                              objectFit: "cover",
                                              flexShrink: 0,
                                            }}
                                          />
                                        )}
                                        {!rIsImg && (
                                          <span style={{ fontSize: 16 }}>
                                            📎
                                          </span>
                                        )}
                                        <span
                                          style={{ fontSize: 11, opacity: 0.8 }}
                                        >
                                          {rAtt.originalName || "File"}
                                        </span>
                                      </div>
                                    ) : (
                                      <div
                                        style={{ fontSize: 12, opacity: 0.8 }}
                                      >
                                        {m.replyTo.text || "—"}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}

                            {/* Тело сообщения */}
                            {m.isDeleted ? (
                              <i className="deleted-message">Message deleted</i>
                            ) : (
                              <>
                                {m.text && (
                                  <div style={{ lineHeight: 1.55 }}>
                                    {getText(String(m.id), m.text)}
                                  </div>
                                )}

                                {/* Вложения */}
                                {m.attachments?.map((att, i) => {
                                  if (!att?.url) return null;
                                  const url = att.url;
                                  const name = att.originalName || "file";
                                  const mime = att.mimeType || "";
                                  const ext =
                                    url.split(".").pop()?.toLowerCase() || "";
                                  const isImage = [
                                    "jpg",
                                    "jpeg",
                                    "png",
                                    "gif",
                                    "webp",
                                  ].includes(ext);
                                  const isVideo = [
                                    "mp4",
                                    "webm",
                                    "mov",
                                  ].includes(ext);
                                  const isAudio = [
                                    "mp3",
                                    "wav",
                                    "ogg",
                                  ].includes(ext);
                                  return (
                                    <div
                                      key={i}
                                      style={{ marginTop: m.text ? 5 : 0 }}
                                    >
                                      {isImage && (
                                        <div
                                          style={{
                                            position: "relative",
                                            display: "inline-block",
                                          }}
                                        >
                                          <img
                                            src={url}
                                            alt={name}
                                            style={{
                                              maxWidth: "100%",
                                              maxHeight: 280,
                                              borderRadius: 9,
                                              cursor: "zoom-in",
                                            }}
                                            onClick={() => setZoomImage(url)}
                                          />
                                          <button
                                            onClick={() =>
                                              downloadFile(url, name)
                                            }
                                            style={{
                                              position: "absolute",
                                              bottom: 5,
                                              right: 5,
                                              background: "rgba(0,0,0,0.58)",
                                              border: "none",
                                              color: "#fff",
                                              borderRadius: 5,
                                              padding: "3px 5px",
                                              cursor: "pointer",
                                              fontSize: 11,
                                            }}
                                          >
                                            ⬇
                                          </button>
                                        </div>
                                      )}
                                      {isVideo && (
                                        <div
                                          className="video-card"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setZoomVideo({ url, name });
                                          }}
                                        >
                                          <video
                                            className="video-thumb"
                                            src={url}
                                            muted
                                            preload="metadata"
                                          />
                                          <div className="video-play">▶</div>
                                          <button
                                            className="video-download"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              downloadFile(url, name);
                                            }}
                                          >
                                            ⬇
                                          </button>
                                          <div className="video-info">
                                            <span>🎬 {ext.toUpperCase()}</span>
                                            <span>
                                              {formatFileSize(
                                                att.fileSizeBytes,
                                              )}
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                      {isAudio && (
                                        <AudioPlayer
                                          src={url}
                                          name={name}
                                          size={att.fileSizeBytes}
                                          mime={mime}
                                        />
                                      )}
                                      {!isImage && !isVideo && !isAudio && (
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            gap: 8,
                                            background: isMine
                                              ? "rgba(255,255,255,0.12)"
                                              : "#f1f5f9",
                                            borderRadius: 9,
                                            padding: "8px 10px",
                                            marginTop: 3,
                                          }}
                                        >
                                          <div
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              gap: 7,
                                            }}
                                          >
                                            <span style={{ fontSize: 20 }}>
                                              📄
                                            </span>
                                            <div
                                              style={{
                                                fontSize: 12,
                                                fontWeight: 600,
                                              }}
                                            >
                                              {name}
                                            </div>
                                          </div>
                                          <button
                                            onClick={() =>
                                              downloadFile(url, name)
                                            }
                                            style={{
                                              background: "#1a6b8a",
                                              border: "none",
                                              color: "#fff",
                                              borderRadius: 5,
                                              padding: "5px 9px",
                                              cursor: "pointer",
                                              fontSize: 11,
                                            }}
                                          >
                                            ⬇
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </>
                            )}

                            {/* Действия с сообщением */}
                            {selectedMessage?.id === m.id && (
                              <div
                                className="message-actions"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  title="Reply"
                                  onClick={() => {
                                    setReplyMessage(m);
                                    setSelectedMessage(null);
                                  }}
                                >
                                  ↩
                                </button>
                                <button
                                  type="button"
                                  title="Copy"
                                  onClick={() => {
                                    navigator.clipboard.writeText(m.text || "");
                                    setSelectedMessage(null);
                                  }}
                                >
                                  📋
                                </button>
                                <button
                                  type="button"
                                  title="Forward"
                                  onClick={() => {
                                    setMessageToShare(m);
                                    setShowShareModal(true);
                                    setSelectedMessage(null);
                                  }}
                                >
                                  📤
                                </button>
                                {canDeleteMessage(m) && (
                                  <button
                                    type="button"
                                    title="Delete"
                                    onClick={() => {
                                      handleDeleteMessage(m.id);
                                      setSelectedMessage(null);
                                    }}
                                  >
                                    🗑
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="close-actions"
                                  onClick={() => setSelectedMessage(null)}
                                >
                                  ✕
                                </button>
                              </div>
                            )}

                            {/* Футер: время + тики + кнопка перевода */}
                            <div className="msg-footer">
                              {/* Кнопка перевода — ТОЛЬКО для текстовых сообщений */}
                              {!m.isDeleted && m.text && (
                                <TranslateBtn
                                  messageId={String(m.id)}
                                  originalText={m.text}
                                  isTranslated={isTranslated(String(m.id))}
                                  isLoading={loadingIds.has(String(m.id))}
                                  error={errorIds.get(String(m.id))}
                                  onToggle={() =>
                                    toggleTranslation(String(m.id), m.text)
                                  }
                                  isMine={isMine}
                                />
                              )}
                              <span className="time">
                                {formatTime(m.createdAt)}
                              </span>
                              <ReadTicks
                                isMine={isMine}
                                readBy={m.readBy || []}
                                currentUserId={currentUserId}
                              />
                            </div>
                          </div>

                          {/* Чипы реакций */}
                          {hasReactions && (
                            <div className="reaction-chips">
                              {Object.entries(msgReactions).map(
                                ([emoji, { count, reactedByMe }]) =>
                                  count > 0 ? (
                                    <span
                                      key={emoji}
                                      className={`reaction-chip ${reactedByMe ? "mine-reaction" : ""}`}
                                    >
                                      {emoji}
                                      <span className="reaction-chip-count">
                                        {count}
                                      </span>
                                    </span>
                                  ) : null,
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </React.Fragment>
              ),
            )}

            {typingUsers.size > 0 && (
              <div className="typing">
                <div className="typing-dots">
                  <span />
                  <span />
                  <span />
                </div>
                Typing…
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Баннеры блокировки */}
          {isBlocked && (
            <div className="blocked-banner">
              <div className="blocked-banner-text">
                🚫 You have blocked this user
              </div>
              <button onClick={unblock} disabled={blockLoading}>
                Unblock
              </button>
            </div>
          )}
          {!isBlocked && blockedByPeer && (
            <div className="blocked-by-peer-banner">
              🔒 This user has restricted incoming messages
            </div>
          )}

          {/* Reply preview */}
          {replyMessage && (
            <div className="reply-preview">
              <div className="reply-header">
                Replying to message
                <button type="button" onClick={() => setReplyMessage(null)}>
                  ✕
                </button>
              </div>
              {(() => {
                const att = replyMessage.attachments?.[0];
                const ext = att?.url?.split(".").pop()?.toLowerCase() || "";
                const isImg = ["jpg", "jpeg", "png", "gif", "webp"].includes(
                  ext,
                );
                if (att)
                  return (
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 7 }}
                    >
                      {isImg && (
                        <img
                          src={att.url}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 4,
                            objectFit: "cover",
                          }}
                        />
                      )}
                      {!isImg && <span style={{ fontSize: 18 }}>📎</span>}
                      <div className="reply-text">
                        {att.originalName || "File"}
                        {replyMessage.text ? ` — ${replyMessage.text}` : ""}
                      </div>
                    </div>
                  );
                return (
                  <div className="reply-text">{replyMessage.text || "—"}</div>
                );
              })()}
            </div>
          )}

          {/* File preview */}
          {pendingFile && (
            <div className="file-preview-panel">
              {pendingFile.previewUrl ? (
                <img
                  src={pendingFile.previewUrl}
                  alt="preview"
                  className="file-preview-thumb"
                />
              ) : (
                <div className="file-preview-icon">📎</div>
              )}
              <div className="file-preview-info">
                <div className="file-preview-name">{pendingFile.file.name}</div>
                <div className="file-preview-size">
                  {(pendingFile.file.size / 1024 / 1024).toFixed(2)} MB
                </div>
                {uploadProgress !== null && (
                  <div
                    style={{
                      height: 3,
                      background: "#e2e8f0",
                      borderRadius: 2,
                      marginTop: 4,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${uploadProgress}%`,
                        height: "100%",
                        background: "#1a6b8a",
                        transition: "width 0.2s",
                      }}
                    />
                  </div>
                )}
              </div>
              <button
                type="button"
                className="file-preview-remove"
                onClick={() => {
                  if (pendingFile.previewUrl)
                    URL.revokeObjectURL(pendingFile.previewUrl);
                  setPendingFile(null);
                }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className={`input-area ${isBlocked || blockedByPeer ? "disabled" : ""}`}
          >
            <button
              type="button"
              className="icon-button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach"
            >
              📎
            </button>
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <button
              type="button"
              className="icon-button"
              onClick={() => setShowEmojiPicker((v) => !v)}
              title="Emoji"
            >
              😄
            </button>

            {text.length > 4000 && (
              <div
                style={{
                  textAlign: "right",
                  padding: "0 12px",
                  fontSize: 11,
                  color: text.length > 4800 ? "#ef4444" : "#f59e0b",
                }}
              >
                {text.length}/5000
              </div>
            )}

            <div className="input-wrapper">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write a message…"
              />
              {showEmojiPicker && (
                <div
                  ref={emojiRef}
                  style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.38)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 5000,
                  }}
                  onClick={() => setShowEmojiPicker(false)}
                >
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      background: "#fff",
                      borderRadius: 14,
                      overflow: "hidden",
                    }}
                  >
                    <EmojiPicker
                      onEmojiClick={handleEmojiClick}
                      previewConfig={{ showPreview: false }}
                      theme="light"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              className={`icon-button mic ${isRecording ? "recording" : ""}`}
              onClick={toggleVoice}
              title="Voice"
            >
              🎙
            </button>
            <button type="submit" className="send-button" title="Send">
              ➤
            </button>
          </form>
        </div>

        {/* ── Jitsi видеоконференция (оверлей) ── */}
        {showJitsi && (
          <div
            className="jitsi-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowJitsi(false);
            }}
          >
            <div className="jitsi-panel" onClick={(e) => e.stopPropagation()}>
              <JitsiRoom
                dialogId={dialogId}
                displayName={myDisplayName}
                onClose={() => setShowJitsi(false)}
                /* Запись приёма: собеседник по диалогу и есть вторая
                   сторона разговора. Без него врач не сможет начать
                   сеанс, и панель не появится. */
                scribePeerUserId={peerId}
                /* Имя собеседника — чтобы завести карту одним нажатием,
                   а не переписывать его с экрана звонка. */
                scribePeerName={dialogTitle || ""}
                onScribeDraft={setScribeDraft}
              />
            </div>
          </div>
        )}

        {/* Черновик приёма — врачу, сразу после записи. Лениво: окно
            открывается один раз в конце приёма, а ChatWindow грузится
            при каждом открытии переписки. */}
        {scribeDraft && (
          <Suspense fallback={null}>
            <ScribeDraftModal
              data={scribeDraft}
              onClose={() => setScribeDraft(null)}
            />
          </Suspense>
        )}

        {/* Share modal */}
        {showShareModal && (
          <div
            className="share-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowShareModal(false);
                setSelectedDialogToShare(null);
              }
            }}
          >
            <div className="share-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Forward message</h3>
              {otherDialogs.length === 0 ? (
                <div className="share-empty">No other dialogs</div>
              ) : (
                <>
                  <DialogList
                    selectable
                    dialogs={otherDialogs}
                    activeDialogId={selectedDialogToShare}
                    onSelect={(id) => setSelectedDialogToShare(id)}
                  />
                  <div style={{ marginTop: 10 }}>
                    <button
                      type="button"
                      disabled={!selectedDialogToShare}
                      onClick={() => handleShareToDialog(selectedDialogToShare)}
                      style={{ width: "100%", padding: 9 }}
                    >
                      Forward
                    </button>
                  </div>
                </>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowShareModal(false);
                  setSelectedDialogToShare(null);
                }}
                style={{
                  marginTop: 7,
                  width: "100%",
                  background: "#f0f4f8",
                  color: "#4a5568",
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default ChatWindow;
