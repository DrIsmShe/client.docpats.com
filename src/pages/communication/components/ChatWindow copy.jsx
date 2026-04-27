// client/src/communication/components/ChatWindow.jsx

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useChat } from "../hooks/useChat";
import DialogList from "./DialogList";
import { useLocation, useNavigate } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";
import { getSocket } from "../socket";
import { useBlockStatus } from "../hooks/useBlockStatus";
import { uploadAttachment } from "../api/uploadAttachment";
import LazyMedia from "./LazyMedia";
import { Virtuoso } from "react-virtuoso";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700&family=Playfair+Display:wght@600&display=swap');

  .chat-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #f0f4f8;
    font-family: 'Nunito', sans-serif;
    position: relative;
    overflow: hidden;
  }

  .chat-wrapper::before {
    content: '';
    position: absolute;
    top: -120px;
    right: -80px;
    width: 340px;
    height: 340px;
    background: radial-gradient(circle, rgba(99,179,237,0.12) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
    z-index: 0;
  }

  /* HEADER */
  .chat-header.whatsapp {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    background: linear-gradient(135deg, #1a6b8a 0%, #0f4c6b 100%);
    box-shadow: 0 4px 20px rgba(15,76,107,0.25);
    z-index: 10;
    position: relative;
  }

  .chat-header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .back-button {
    background: rgba(255,255,255,0.15);
    border: none;
    color: #fff;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }
  .back-button:hover { background: rgba(255,255,255,0.25); }

  .chat-header .avatar {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(255,255,255,0.4);
  }

  .chat-header-info .chat-title {
    font-family: 'Playfair Display', serif;
    font-size: 16px;
    font-weight: 600;
    color: #fff;
    line-height: 1.2;
  }

  .chat-header-info .chat-status {
    font-size: 12px;
    color: rgba(255,255,255,0.7);
    min-height: 16px;
  }

  .chat-header-actions {
    display: flex;
    gap: 6px;
  }

  .chat-header-actions .icon-button {
    background: rgba(255,255,255,0.15);
    border: none;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }
  .chat-header-actions .icon-button:hover { background: rgba(255,255,255,0.25); }

  /* CONTAINER */
  .chat-container {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
    position: relative;
    z-index: 1;
  }

  /* MESSAGES */
  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px 16px 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    scroll-behavior: smooth;
  }

  .messages::-webkit-scrollbar { width: 4px; }
  .messages::-webkit-scrollbar-track { background: transparent; }
  .messages::-webkit-scrollbar-thumb { background: #c5d5e0; border-radius: 4px; }

  .message-row {
    display: flex;
    justify-content: flex-start;
    animation: msgIn 0.25s ease;
    /* extra bottom space for reactions */
    padding-bottom: 4px;
  }
  @keyframes msgIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .message-row.mine { justify-content: flex-end; }

  /* BUBBLE WRAPPER — wraps bubble + reactions */
  .bubble-wrapper {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    max-width: 68%;
    position: relative;
  }
  .message-row.mine .bubble-wrapper { align-items: flex-end; }

  .bubble {

  
    background: #ffffff;
    border-radius: 18px 18px 18px 4px;
    padding: 10px 14px 6px;
    font-size: 14.5px;
    color: #2d3748;
    line-height: 1.5;
    box-shadow: 0 2px 12px rgba(0,0,0,0.07);
    position: relative;
    cursor: pointer;
    transition: box-shadow 0.2s;
  }
  .bubble:hover { box-shadow: 0 4px 18px rgba(0,0,0,0.12); }

  .message-row.mine .bubble {
    background: linear-gradient(135deg, #1a6b8a 0%, #1e82a8 100%);
    color: #ffffff;
    border-radius: 18px 18px 4px 18px;
    box-shadow: 0 2px 14px rgba(26,107,138,0.3);
  }

  .quoted-message {
    background: rgba(0,0,0,0.06);
    border-left: 3px solid #1a6b8a;
    padding: 6px 10px;
    border-radius: 6px;
    margin-bottom: 6px;
    font-size: 12.5px;
  }
  .message-row.mine .quoted-message {
    background: rgba(255,255,255,0.18);
    border-left-color: rgba(255,255,255,0.6);
  }

  .quoted-author {
    font-weight: 700;
    font-size: 11.5px;
    margin-bottom: 2px;
    color: #1a6b8a;
  }
  .message-row.mine .quoted-author { color: rgba(255,255,255,0.85); }

  .deleted-message {
    color: #a0aec0;
    font-style: italic;
    font-size: 13px;
  }
  .message-row.mine .deleted-message { color: rgba(255,255,255,0.6); }

  .time {
    font-size: 10.5px;
    text-align: right;
    margin-top: 4px;
    color: #94a3b8;
  }
  .message-row.mine .time { color: rgba(255,255,255,0.65); }

  /* MESSAGE ACTIONS */
  .message-actions {
    position: absolute;
    bottom: calc(100% + 6px);
    right: 0;
    background: #fff;
    border-radius: 14px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.15);
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 5px 8px;
    z-index: 100;
    border: 1px solid #e2e8f0;
    width:150px;
    margin-left: 30px;
  }

  .message-row.mine .message-actions { right: 0; left: auto; }

  .message-actions button {
    background: none;
    border: none;
    cursor: pointer;
    width: 30px;
    height: 30px;
    border-radius: 8px;
    font-size: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s;
  }
  .message-actions button:hover { background: #f0f4f8; }
  .message-actions .close-actions { color: #a0aec0; }

  /* ─── REACTION QUICK-BAR ─── */
  .reaction-bar {
    position: absolute;
;
    left: 0;
    background: #fff;
    border-radius: 999px;
    box-shadow: 0 6px 24px rgba(0,0,0,0.13), 0 0 0 1px #e2e8f0;
    display: flex;
    align-items: center;
    gap: 1px;
    padding: 4px 6px;
    z-index: 200;
    transition: opacity 0.18s ease, transform 0.18s ease;
  }

  .reaction-bar.hidden {
    opacity: 0;
    pointer-events: none;
    transform: translateY(4px) scale(0.92);
  }

  .reaction-bar.visible {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0) scale(1);
  }

  .reaction-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 20px;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.15s, background 0.15s;
    line-height: 1;
  }
  .reaction-btn:hover {
    transform: scale(1.3);
    background: #f0f4f8;
  }
  .reaction-btn.active {
    background: rgba(26,107,138,0.1);
  }

  /* ─── REACTION CHIPS (under bubble) ─── */
  .reaction-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 5px;
    padding: 0 2px;
  }

  .reaction-chip {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    background: #fff;
    border: 1.5px solid #e2e8f0;
    border-radius: 999px;
    padding: 2px 8px 2px 6px;
    font-size: 13px;
    cursor: default;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    animation: chipPop 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    transition: border-color 0.15s, background 0.15s;
    user-select: none;
  }
  .reaction-chip.mine-reaction {
    border-color: #1a6b8a;
    background: rgba(26,107,138,0.06);
  }
  @keyframes chipPop {
    from { transform: scale(0.5); opacity: 0; }
    to   { transform: scale(1);   opacity: 1; }
  }

  .reaction-chip-count {
    font-size: 11px;
    font-weight: 700;
    color: #4a5568;
    font-family: 'Nunito', sans-serif;
    line-height: 1;
  }
  .reaction-chip.mine-reaction .reaction-chip-count { color: #1a6b8a; }

  /* TYPING */
  .typing {
    font-size: 13px;
    color: #718096;
    padding: 4px 14px;
    display: flex;
    align-items: center;
    gap: 6px;
    font-style: italic;
  }
  .typing::before {
    content: '';
    display: inline-block;
    width: 28px;
    height: 16px;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28 16'%3E%3Ccircle cx='5' cy='8' r='3' fill='%231a6b8a'%3E%3Canimate attributeName='cy' values='8;4;8' dur='0.8s' begin='0s' repeatCount='indefinite'/%3E%3C/circle%3E%3Ccircle cx='14' cy='8' r='3' fill='%231a6b8a'%3E%3Canimate attributeName='cy' values='8;4;8' dur='0.8s' begin='0.15s' repeatCount='indefinite'/%3E%3C/circle%3E%3Ccircle cx='23' cy='8' r='3' fill='%231a6b8a'%3E%3Canimate attributeName='cy' values='8;4;8' dur='0.8s' begin='0.3s' repeatCount='indefinite'/%3E%3C/circle%3E%3C/svg%3E") no-repeat center;
  }

  /* REPLY PREVIEW */
  .reply-preview {
    background: #fff;
    border-top: 1px solid #e2e8f0;
    border-left: 4px solid #1a6b8a;
    padding: 10px 16px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .reply-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    font-weight: 700;
    color: #1a6b8a;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .reply-header button {
    background: none;
    border: none;
    cursor: pointer;
    color: #a0aec0;
    font-size: 14px;
    line-height: 1;
    padding: 0;
    transition: color 0.2s;
  }
  .reply-header button:hover { color: #e53e3e; }

  .reply-text {
    font-size: 13px;
    color: #4a5568;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* INPUT AREA */
  .input-area {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: #fff;
    border-top: 1px solid #e8eff5;
    box-shadow: 0 -4px 20px rgba(0,0,0,0.05);
  }

  .input-area .icon-button {
    background: none;
    border: none;
    cursor: pointer;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #718096;
    transition: background 0.2s, color 0.2s;
    flex-shrink: 0;
  }
  .input-area .icon-button:hover {
    background: #edf2f7;
    color: #1a6b8a;
  }

  .input-area .mic.recording {
    color: #e53e3e;
    background: #fff5f5;
    animation: pulse 1s ease infinite;
  }
  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(229,62,62,0.4); }
    50% { box-shadow: 0 0 0 8px rgba(229,62,62,0); }
  }

  .input-wrapper {
    flex: 1;
    position: relative;
  }

  .input-wrapper input[type="text"] {
    width: 100%;
    box-sizing: border-box;
    border: 1.5px solid #d1dce6;
    border-radius: 24px;
    padding: 10px 18px;
    font-family: 'Nunito', sans-serif;
    font-size: 14px;
    color: #2d3748;
    background: #f7fafc;
    outline: none;
    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  }
  .input-wrapper input[type="text"]:focus {
    border-color: #1a6b8a;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(26,107,138,0.1);
  }
  .input-wrapper input[type="text"]::placeholder { color: #a0aec0; }

  .send-button {
    background: linear-gradient(135deg, #1a6b8a 0%, #1e82a8 100%);
    border: none;
    width: 42px;
    height: 42px;
    border-radius: 50%;
    color: #fff;
    font-size: 17px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(26,107,138,0.35);
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .send-button:hover {
    transform: scale(1.07);
    box-shadow: 0 6px 18px rgba(26,107,138,0.45);
  }
  .send-button:active { transform: scale(0.96); }

  /* SHARE MODAL */
  .share-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15,30,50,0.5);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    animation: fadeIn 0.2s ease;
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .share-modal {
    background: #fff;
    border-radius: 20px;
    padding: 28px 24px 20px;
    width: 340px;
    max-width: 90vw;
    max-height: 70vh;
    overflow-y: auto;
    box-shadow: 0 24px 60px rgba(0,0,0,0.2);
    animation: slideUp 0.25s ease;
  }
  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  .share-modal h3 {
    font-family: 'Playfair Display', serif;
    font-size: 18px;
    color: #1a365d;
    margin: 0 0 18px;
  }

  .share-empty {
    color: #a0aec0;
    font-size: 13.5px;
    text-align: center;
    padding: 20px 0;
  }

  .share-modal button[type="button"] {
    font-family: 'Nunito', sans-serif;
    cursor: pointer;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.2s;
    border: none;
    padding: 10px 16px;
  }

  .share-modal button[type="button"]:not(:disabled):not([style*="margin-top: 8px"]) {
    background: linear-gradient(135deg, #1a6b8a 0%, #1e82a8 100%);
    color: #fff;
    box-shadow: 0 4px 12px rgba(26,107,138,0.3);
  }
  .share-modal button[type="button"]:not(:disabled):not([style*="margin-top: 8px"]):hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(26,107,138,0.4);
  }
  .share-modal button[type="button"]:disabled {
    background: #e2e8f0;
    color: #a0aec0;
    cursor: not-allowed;
  }

  /* ─── READ TICKS ─── */
  .msg-ticks {
    display: inline-flex;
    align-items: center;
    margin-left: 4px;
    font-size: 13px;
    line-height: 1;
    vertical-align: middle;
  }
  .msg-ticks.read    { color: #4fc3f7; }
  .msg-ticks.sent    { color: rgba(255,255,255,0.55); }

  /* ─── ERROR TOAST ─── */
  .error-toast {
    position: absolute;
    top: 14px;
    left: 50%;
    transform: translateX(-50%);
    background: #fed7d7;
    color: #c53030;
    border: 1px solid #fc8181;
    border-radius: 10px;
    padding: 10px 20px;
    font-size: 13px;
    font-weight: 600;
    z-index: 999;
    box-shadow: 0 4px 16px rgba(0,0,0,0.12);
    animation: toastIn 0.2s ease;
    white-space: nowrap;
  }
  @keyframes toastIn {
    from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
  }

  /* FILE PREVIEW */
  .file-preview-panel {
    background: #fff;
    border-top: 1px solid #e2e8f0;
    padding: 10px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .file-preview-thumb {
    width: 56px; height: 56px;
    border-radius: 8px; object-fit: cover;
    border: 1px solid #e2e8f0; flex-shrink: 0;
  }
  .file-preview-icon {
    width: 56px; height: 56px;
    border-radius: 8px; background: #edf2f7;
    display: flex; align-items: center; justify-content: center;
    font-size: 28px; flex-shrink: 0;
  }
  .file-preview-info { flex: 1; min-width: 0; }
  .file-preview-name {
    font-size: 13px; font-weight: 600; color: #2d3748;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .file-preview-size { font-size: 11px; color: #94a3b8; margin-top: 2px; }
  .file-preview-remove {
    background: none; border: none; cursor: pointer;
    color: #a0aec0; font-size: 20px; padding: 4px;
    border-radius: 50%; transition: color 0.15s;
  }
  .file-preview-remove:hover { color: #e53e3e; }

  /* EMPTY STATE */
  .empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #718096;
    font-family: 'Nunito', sans-serif;
    font-size: 15px;
    background: #f0f4f8;
  }

  /* ─── BLOCK BUTTON ─── */
  .block-button {
    background: rgba(255,255,255,0.15);
    border: none;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
    position: relative;
  }
  .block-button:hover { background: rgba(255,255,255,0.25); }
  .block-button.blocked {
    background: rgba(229,62,62,0.3);
  }
  .block-button.blocked:hover { background: rgba(229,62,62,0.45); }

  /* ─── BLOCKED BANNER ─── */
  .blocked-banner {
    background: #fff5f5;
    border-top: 1px solid #fed7d7;
    padding: 10px 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    font-size: 13px;
    color: #c53030;
  }
  .blocked-banner-text {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
  }
  .blocked-banner button {
    background: none;
    border: 1px solid #fc8181;
    color: #c53030;
    border-radius: 8px;
    padding: 4px 12px;
    font-size: 12px;
    font-family: 'Nunito', sans-serif;
    cursor: pointer;
    transition: background 0.15s;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .blocked-banner button:hover { background: #fed7d7; }

  /* ─── BLOCKED BY PEER BANNER ─── */
  .blocked-by-peer-banner {
    background: #f7fafc;
    border-top: 1px solid #e2e8f0;
    padding: 10px 18px;
    text-align: center;
    font-size: 13px;
    color: #718096;
  }

  /* disabled input */
  .input-area.disabled {
    opacity: 0.5;
    pointer-events: none;
  }
  @keyframes shimmer {
  0% {
    background-position: -400px 0;
  }
  100% {
    background-position: 400px 0;
  }
}
`;

// ─── Quick-reaction emoji set ───────────────────────────────────────────────
const QUICK_REACTIONS = ["❤️", "😂", "👍", "😮", "😢", "🔥"];

const formatFileSize = (bytes) => {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return mb.toFixed(2) + " MB";

  const kb = bytes / 1024;
  return kb.toFixed(0) + " KB";
};

const openVideoFullscreen = (videoUrl) => {
  const video = document.createElement("video");

  video.src = videoUrl;
  video.controls = true;
  video.autoplay = true;
  video.style.width = "100%";
  video.style.height = "100%";

  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.top = "0";
  wrapper.style.left = "0";
  wrapper.style.width = "100vw";
  wrapper.style.height = "100vh";
  wrapper.style.background = "rgba(0,0,0,0.95)";
  wrapper.style.display = "flex";
  wrapper.style.alignItems = "center";
  wrapper.style.justifyContent = "center";
  wrapper.style.zIndex = "9999";

  wrapper.onclick = () => wrapper.remove();

  wrapper.appendChild(video);
  document.body.appendChild(wrapper);
};
// ─── Helpers ─────────────────────────────────────────────────────────────────
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
/**
 * Merge an incoming reaction update into local reactions state.
 * reactions shape: { [emoji]: { count: number, reactedByMe: boolean } }
 */
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
    if (msgReactions[emoji].count === 0) {
      delete msgReactions[emoji];
    }
  }

  return { ...prev, [key]: msgReactions };
}

// ─── Read status helper ─────────────────────────────────────────────────────
function ReadTicks({ isMine, readBy = [], currentUserId }) {
  if (!isMine) return null;
  // ✓✓ только если кто-то ДРУГОЙ (не отправитель) прочитал сообщение
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
function extractId(obj) {
  if (!obj) return null;
  if (typeof obj === "string") return obj;
  return obj._id || obj.id || null;
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
  const currentUserId =
    typeof currentUser === "string"
      ? currentUser
      : currentUser?._id || currentUser?.id || null;
  const peerId = extractId(peerUser);
  const {
    messages,
    isReady,
    sendMessage,
    typingUsers,
    emitTyping,
    loadMore,
    hasMore,
    loadingMore,
  } = useChat(dialogId, {
    isActive: true,
    currentUserId,
  });

  const location = useLocation();
  const navigate = useNavigate();
  const [zoomImage, setZoomImage] = useState(null);
  const emojiRef = useRef(null);
  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);
  const topRef = useRef(null);
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
  const [uploadProgress, setUploadProgress] = useState(null); // null | 0-100
  const [pendingFile, setPendingFile] = useState(null); // { file, previewUrl }

  // ─── Reactions state ──────────────────────────────────────────────────────
  // { [messageId]: { [emoji]: { count: number, reactedByMe: boolean } } }
  const [reactions, setReactions] = useState({});
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const hoverTimerRef = useRef(null);

  const showError = (msg) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(null), 4000);
  };

  // ─── Block status ─────────────────────────────────────────────────────────
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
    const diff = Date.now() - new Date(message.createdAt).getTime();
    return diff <= DELETE_TIME_LIMIT_MS;
  };

  // ─── Infinite scroll: load older messages on scroll to top ─────────────────

  // ─── Socket: server errors (rate limit etc) ──────────────────────────────
  useEffect(() => {
    if (!dialogId) return;
    const socket = getSocket();
    const handleError = ({ message }) => {
      showError(message || "Ошибка сервера");
    };
    socket.on("error", handleError);
    return () => socket.off("error", handleError);
  }, [dialogId]);

  // ─── Socket: reactions ────────────────────────────────────────────────────
  useEffect(() => {
    if (!dialogId) return;
    const socket = getSocket();

    const handleReactionUpdate = (payload) => {
      setReactions((prev) => applyReactionUpdate(prev, payload, currentUserId));
    };

    socket.on("message:reaction", handleReactionUpdate);

    return () => {
      socket.off("message:reaction", handleReactionUpdate);
    };
  }, [dialogId, currentUserId]);

  // ─── Listen for server-side block rejection ──────────────────────────────
  // If the server rejected the message (blocked) — refresh the block status
  useEffect(() => {
    if (!dialogId) return;
    const socket = getSocket();
    const handleBlocked = ({ reason }) => {
      // Force-refresh status — the server indicated a block is active
      fetchStatus();
      console.warn("message:blocked received, reason:", reason);
    };
    socket.on("message:blocked", handleBlocked);
    return () => socket.off("message:blocked", handleBlocked);
  }, [dialogId, fetchStatus]);

  // ─── Clear reactions when message is deleted ─────────────────────────────
  // useChat owns the message:deleted socket event and sets isDeleted: true.
  // We watch messages array — when any entry flips to isDeleted we immediately
  // drop its reactions from state. No duplicate socket listener needed.
  useEffect(() => {
    messages.forEach((m) => {
      if (m.isDeleted) {
        setReactions((prev) => {
          const key = String(m.id);
          if (!prev[key]) return prev; // nothing to clear, avoid re-render
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    });
  }, [messages]);

  // ─── Load initial reactions when messages arrive ──────────────────────────
  // If your server sends reactions embedded in messages, seed from there:
  useEffect(() => {
    if (!messages.length) return;
    setReactions((prev) => {
      const next = { ...prev };
      messages.forEach((m) => {
        const key = String(m.id);
        if (m.reactions && !next[key]) {
          // m.reactions expected as array: [{ emoji, userId }]
          const grouped = {};
          m.reactions.forEach(({ emoji, userId }) => {
            if (!grouped[emoji])
              grouped[emoji] = { count: 0, reactedByMe: false };
            grouped[emoji].count += 1;
            if (String(userId) === String(currentUserId)) {
              grouped[emoji].reactedByMe = true;
            }
          });
          next[key] = grouped;
        }
      });
      return next;
    });
  }, [messages, currentUserId]);

  // ─── Send reaction via socket ─────────────────────────────────────────────
  const handleReact = useCallback(
    (messageId, emoji) => {
      const socket = getSocket();
      const key = String(messageId);
      const existing = reactions[key]?.[emoji];
      const action = existing?.reactedByMe ? "remove" : "add";

      // Optimistic update
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

  // ─── Fetch block status when dialog opens ────────────────────────────────
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // ─── Other effects ────────────────────────────────────────────────────────

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    if (location.state?.forwardedMessage) {
      sendMessage({ text: location.state.forwardedMessage.text });
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, isReady, navigate, location.pathname, sendMessage]);

  useEffect(() => {
    const handleWindowClick = () => setSelectedMessage(null);
    window.addEventListener("click", handleWindowClick);
    return () => window.removeEventListener("click", handleWindowClick);
  }, []);

  // Scroll to bottom only on initial load or new incoming message,
  // NOT when loading older history (loadingMore)
  const prevMessagesLenRef = useRef(0);
  useEffect(() => {
    if (loadingMore) return; // don't scroll while loading history

    const prevLen = prevMessagesLenRef.current;
    const currLen = messages.length;
    prevMessagesLenRef.current = currLen;

    // Initial load or new message appended at the end
    if (prevLen === 0 || currLen === prevLen + 1) {
      bottomRef.current?.scrollIntoView({
        behavior: prevLen === 0 ? "auto" : "smooth",
      });
    }
  }, [messages, loadingMore]);

  useEffect(() => {
    if (!dialogId) return;
    if (text.length > 0) emitTyping("start");
    else emitTyping("stop");
    const timeout = setTimeout(() => emitTyping("stop"), 2000);
    return () => clearTimeout(timeout);
  }, [text, dialogId, emitTyping]);

  const MAX_MSG_LENGTH = 5000;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isBlocked || blockedByPeer) return;
    if (!text.trim() && !pendingFile) return;
    if (text.length > MAX_MSG_LENGTH) {
      showError(
        `Сообщение слишком длинное (${text.length}/${MAX_MSG_LENGTH} символов)`,
      );
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
        .catch((err) => showError(err.message || "Ошибка загрузки файла"))
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

  const handleAttachClick = () => fileInputRef.current?.click();

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
      showError(`Недопустимый тип файла: ${file.type || "неизвестный"}`);
      e.target.value = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      showError(`Файл слишком большой (максимум ${MAX_FILE_SIZE_MB} МБ)`);
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
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setText((prev) => (prev ? prev + " " + transcript : transcript));
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
    // Optimistically clear reactions immediately — no need to wait for reload
    setReactions((prev) => {
      const next = { ...prev };
      delete next[String(messageId)];
      return next;
    });
  };

  if (!dialogId) return <div className="empty">Select a dialog</div>;
  if (!isReady) return <div className="empty">Loading messages…</div>;
  const handleBack = () => {
    if (currentUser?.role === "doctor") {
      navigate("/doctor/communication");
    } else {
      navigate("/patient/communication");
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="chat-wrapper">
        {/* HEADER */}
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
                {typingUsers.size > 0 ? "typing…" : ""}
              </div>
            </div>
          </div>
          <div className="chat-header-actions">
            {/* <button className="icon-button" title="Call">
              📞
            </button>
            <button className="icon-button" title="Video call">
              📹
            </button> */}
            <button
              className={`block-button ${isBlocked ? "blocked" : ""}`}
              title={isBlocked ? "Unblock user" : "Block user"}
              disabled={blockLoading}
              onClick={isBlocked ? unblock : block}
            >
              {isBlocked ? "🔓" : "🚫"}
            </button>
            {/* <button className="icon-button" title="Menu">
              ⋮
            </button> */}
          </div>
        </div>

        {/* MESSAGES */}
        <div className="chat-container">
          {errorToast && <div className="error-toast">⚠️ {errorToast}</div>}
          {loadingMore && (
            <div
              style={{
                textAlign: "center",
                padding: "12px 0",
                color: "#94a3b8",
                fontSize: 13,
              }}
            >
              ⏳ Загрузка истории...
            </div>
          )}
          {!hasMore && messages.length > 0 && isReady && (
            <div
              style={{
                textAlign: "center",
                padding: "12px 0",
                color: "#94a3b8",
                fontSize: 12,
              }}
            >
              — Начало переписки —
            </div>
          )}
          <div className="messages">
            <Virtuoso
              data={messages}
              followOutput="smooth"
              initialTopMostItemIndex={messages.length - 1}
              style={{ height: "100%" }}
              startReached={() => {
                if (hasMore && !loadingMore) {
                  loadMore();
                }
              }}
              itemContent={(index, m) => {
                const messageId = m._id || m.id; // ✅ добавили

                const senderId = extractId(m.sender);

                const isMine =
                  senderId &&
                  currentUserId &&
                  String(senderId) === String(currentUserId);

                const msgReactions = reactions[String(messageId)] || {};
                const hasReactions = Object.keys(msgReactions).length > 0;

                return (
                  <div
                    key={messageId}
                    className={`message-row ${isMine ? "mine" : ""}`}
                  >
                    <div
                      className={`bubble-wrapper ${isMine ? "mine-wrapper" : ""}`}
                    >
                      <div
                        className="bubble"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMessage(m);
                        }}
                      >
                        {m.text && <span>{m.text}</span>}

                        {m.attachments?.map((att, i) => {
                          if (!att?.url) return null;

                          const url = att.url;
                          const ext = url.split(".").pop()?.toLowerCase();

                          const isImage = [
                            "jpg",
                            "jpeg",
                            "png",
                            "gif",
                            "webp",
                          ].includes(ext);

                          const isVideo = ["mp4", "webm", "mov"].includes(ext);

                          return (
                            <div key={i} style={{ marginTop: 6 }}>
                              {isImage && (
                                <LazyMedia
                                  type="image"
                                  src={url}
                                  style={{
                                    maxWidth: "100%",
                                    maxHeight: 300,
                                    borderRadius: 10,
                                    cursor: "zoom-in",
                                  }}
                                  onClick={() => setZoomImage(url)}
                                />
                              )}

                              {isVideo && (
                                <LazyMedia
                                  type="video"
                                  src={url}
                                  controls
                                  style={{
                                    maxWidth: "100%",
                                    borderRadius: 10,
                                  }}
                                  onClick={() => openVideoFullscreen(url)}
                                />
                              )}
                            </div>
                          );
                        })}

                        <div className="time">
                          {formatTime(m.createdAt)}
                          <ReadTicks
                            isMine={isMine}
                            readBy={m.readBy || []}
                            currentUserId={currentUserId}
                          />
                        </div>
                      </div>

                      {hasReactions && (
                        <div className="reaction-chips">
                          {Object.entries(msgReactions).map(
                            ([emoji, { count, reactedByMe }]) =>
                              count > 0 && (
                                <span
                                  key={emoji}
                                  className={`reaction-chip ${
                                    reactedByMe ? "mine-reaction" : ""
                                  }`}
                                >
                                  {emoji}
                                  <span className="reaction-chip-count">
                                    {count}
                                  </span>
                                </span>
                              ),
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }}
            />
          </div>

          {/* BLOCKED BANNERS */}
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

          {/* REPLY PREVIEW */}
          {replyMessage && (
            <div className="reply-preview">
              <div className="reply-header">
                Replying to message
                <button type="button" onClick={() => setReplyMessage(null)}>
                  ✕
                </button>
              </div>
              <div className="reply-text">{replyMessage.text}</div>
            </div>
          )}

          {/* FILE PREVIEW PANEL */}
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
                  {(pendingFile.file.size / 1024 / 1024).toFixed(2)} МБ
                </div>
                {uploadProgress !== null && (
                  <div
                    style={{
                      height: 3,
                      background: "#e2e8f0",
                      borderRadius: 2,
                      marginTop: 5,
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

          {/* INPUT */}
          <form
            onSubmit={handleSubmit}
            className={`input-area ${isBlocked || blockedByPeer ? "disabled" : ""}`}
          >
            <button
              type="button"
              className="icon-button"
              onClick={handleAttachClick}
              title="Attach file"
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

            {uploadProgress !== null && (
              <div style={{ padding: "4px 16px" }}>
                <div
                  style={{
                    background: "#e2e8f0",
                    borderRadius: 4,
                    height: 4,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${uploadProgress}%`,
                      background: "#3d7fff",
                      height: "100%",
                      transition: "width 0.2s",
                    }}
                  />
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                  Загрузка файла... {uploadProgress}%
                </div>
              </div>
            )}
            {text.length > 4000 && (
              <div
                style={{
                  textAlign: "right",
                  padding: "2px 16px 0",
                  fontSize: 12,
                  color: text.length > 4800 ? "#ef4444" : "#f59e0b",
                }}
              >
                {text.length} / 5000
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
                    background: "rgba(0,0,0,0.4)",
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
                      borderRadius: 16,
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
              title="Voice input"
            >
              🎙
            </button>
            <button type="submit" className="send-button" title="Send">
              ➤
            </button>
          </form>
        </div>

        {/* SHARE MODAL */}
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
                  <div style={{ marginTop: 12 }}>
                    <button
                      type="button"
                      disabled={!selectedDialogToShare}
                      onClick={() => handleShareToDialog(selectedDialogToShare)}
                      style={{ width: "100%", padding: 10 }}
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
                  marginTop: 8,
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
