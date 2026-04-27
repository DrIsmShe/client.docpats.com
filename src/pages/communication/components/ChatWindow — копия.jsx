// client/src/pages/communication/components/ChatWindow.jsx
import React from "react";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useChat } from "../hooks/useChat";
import DialogList from "./DialogList";
import { useLocation, useNavigate } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";
import { getSocket } from "../socket";
import { useBlockStatus } from "../hooks/useBlockStatus";
import { uploadAttachment } from "../api/uploadAttachment";
import { useCall } from "../hooks/useCall";
import CallUI from "./CallUI";

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
    padding-bottom: 4px;
  }
  @keyframes msgIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .message-row.mine { justify-content: flex-end; }

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
    width: 150px;
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

  /* REACTION QUICK-BAR */
  .reaction-bar {
    position: absolute;
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
  .reaction-btn:hover { transform: scale(1.3); background: #f0f4f8; }
  .reaction-btn.active { background: rgba(26,107,138,0.1); }

  /* REACTION CHIPS */
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
  .input-area .icon-button:hover { background: #edf2f7; color: #1a6b8a; }
  .input-area .mic.recording {
    color: #e53e3e;
    background: #fff5f5;
    animation: pulse 1s ease infinite;
  }
  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(229,62,62,0.4); }
    50% { box-shadow: 0 0 0 8px rgba(229,62,62,0); }
  }

  .input-wrapper { flex: 1; position: relative; }
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
  .send-button:hover { transform: scale(1.07); box-shadow: 0 6px 18px rgba(26,107,138,0.45); }
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
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
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
  .share-modal h3 { font-family: 'Playfair Display', serif; font-size: 18px; color: #1a365d; margin: 0 0 18px; }
  .share-empty { color: #a0aec0; font-size: 13.5px; text-align: center; padding: 20px 0; }
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
  .share-modal button[type="button"]:disabled {
    background: #e2e8f0;
    color: #a0aec0;
    cursor: not-allowed;
  }

  /* DATE SEPARATOR */
  .date-separator {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 0 6px;
    user-select: none;
  }
  .date-separator::before,
  .date-separator::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #d1dce6;
  }
  .date-separator-label {
    font-size: 12px;
    font-weight: 700;
    color: #94a3b8;
    white-space: nowrap;
    font-family: 'Nunito', sans-serif;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  /* READ TICKS */
  .msg-ticks {
    display: inline-flex;
    align-items: center;
    margin-left: 4px;
    font-size: 13px;
    line-height: 1;
    vertical-align: middle;
  }
  .msg-ticks.read { color: #4fc3f7; }
  .msg-ticks.sent { color: rgba(255,255,255,0.55); }

  /* ERROR TOAST */
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
  .file-preview-name { font-size: 13px; font-weight: 600; color: #2d3748; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
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

  /* BLOCK BUTTON */
  .block-button {
    background: rgba(255,255,255,0.15);
    border: none;
    width: 36px; height: 36px;
    border-radius: 50%;
    font-size: 16px;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.2s;
    position: relative;
  }
  .block-button:hover { background: rgba(255,255,255,0.25); }
  .block-button.blocked { background: rgba(229,62,62,0.3); }
  .block-button.blocked:hover { background: rgba(229,62,62,0.45); }

  /* BLOCKED BANNER */
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
  .blocked-banner-text { display: flex; align-items: center; gap: 8px; font-weight: 600; }
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

  .blocked-by-peer-banner {
    background: #f7fafc;
    border-top: 1px solid #e2e8f0;
    padding: 10px 18px;
    text-align: center;
    font-size: 13px;
    color: #718096;
  }

  .input-area.disabled { opacity: 0.5; pointer-events: none; }

  /* VIDEO CARD */
  .video-card {
    position: relative;
    border-radius: 10px;
    overflow: hidden;
    cursor: pointer;
    background: #000;
    max-width: 280px;
  }
  .video-thumb { width: 100%; max-height: 200px; object-fit: cover; display: block; opacity: 0.7; }
  .video-play {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    font-size: 32px; color: #fff;
    text-shadow: 0 2px 8px rgba(0,0,0,0.5);
    pointer-events: none;
  }
  .video-download {
    position: absolute; top: 6px; right: 6px;
    background: rgba(0,0,0,0.55); border: none; color: #fff;
    border-radius: 6px; padding: 4px 8px; cursor: pointer; font-size: 13px;
    backdrop-filter: blur(4px);
  }
  .video-download:hover { background: rgba(0,0,0,0.75); }
  .video-info {
    position: absolute; bottom: 0; left: 0; right: 0;
    background: linear-gradient(transparent, rgba(0,0,0,0.6));
    color: #fff; font-size: 11px; padding: 16px 8px 6px;
    display: flex; justify-content: space-between;
  }

  /* AUDIO CARD */
  .audio-card {
    display: flex; align-items: center; gap: 10px;
    background: rgba(0,0,0,0.06);
    border-radius: 12px; padding: 10px 12px;
    min-width: 220px; max-width: 280px;
  }
  .message-row.mine .audio-card { background: rgba(255,255,255,0.18); }
  .audio-play {
    background: #1a6b8a; border: none; color: #fff;
    width: 36px; height: 36px; border-radius: 50%; font-size: 14px;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: background 0.15s;
  }
  .audio-play:hover { background: #1e82a8; }
  .audio-info { flex: 1; min-width: 0; }
  .audio-name { font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: inherit; }
  .audio-meta { font-size: 10px; color: #94a3b8; margin-top: 1px; }
  .message-row.mine .audio-meta { color: rgba(255,255,255,0.6); }
  .audio-wave { height: 4px; background: rgba(0,0,0,0.1); border-radius: 2px; margin-top: 6px; overflow: hidden; }
  .message-row.mine .audio-wave { background: rgba(255,255,255,0.25); }
  .audio-progress { height: 100%; background: #1a6b8a; border-radius: 2px; transition: width 0.1s linear; }
  .message-row.mine .audio-progress { background: rgba(255,255,255,0.8); }
  .audio-time { font-size: 11px; color: #94a3b8; flex-shrink: 0; }
  .message-row.mine .audio-time { color: rgba(255,255,255,0.65); }
  .audio-download { background: none; border: none; cursor: pointer; font-size: 14px; color: #94a3b8; padding: 2px; flex-shrink: 0; transition: color 0.15s; }
  .audio-download:hover { color: #1a6b8a; }
  .message-row.mine .audio-download:hover { color: #fff; }
`;

const QUICK_REACTIONS = ["❤️", "😂", "👍", "😮", "😢", "🔥"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function groupMessagesByDate(msgs) {
  const groups = [];
  let lastLabel = null;
  for (const m of msgs) {
    const label = formatDateLabel(m.createdAt);
    if (label !== lastLabel) {
      groups.push({ label, messages: [m] });
      lastLabel = label;
    } else groups[groups.length - 1].messages.push(m);
  }
  return groups;
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
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) audio.pause();
    else audio.play();
    setPlaying(!playing);
  };
  const formatTime = (sec) => {
    if (!sec) return "0:00";
    return `${Math.floor(sec / 60)}:${Math.floor(sec % 60)
      .toString()
      .padStart(2, "0")}`;
  };
  const formatSize = (bytes) => {
    if (!bytes) return "";
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? mb.toFixed(2) + " MB" : (bytes / 1024).toFixed(0) + " KB";
  };
  const ext = mime?.split("/")[1] || "";

  return (
    <div className="audio-card">
      <button className="audio-play" onClick={toggle}>
        {playing ? "⏸" : "▶"}
      </button>
      <div className="audio-info">
        <div className="audio-name">{name}</div>
        <div className="audio-meta">
          {ext.toUpperCase()} • {formatSize(size)}
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
  const [reactions, setReactions] = useState({});
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const hoverTimerRef = useRef(null);

  const extractId = (obj) => {
    if (!obj) return null;
    if (typeof obj === "string") return obj;
    return obj._id || obj.id || null;
  };

  const currentUserId = extractId(currentUser);
  const peerId = extractId(peerUser);

  const {
    callState,
    callId,
    callType,
    peerId: callPeerId,
    peerInfo: callPeerInfo,
    isMuted,
    durationSec,
    endedInfo,
    formattedDuration,
    remoteAudioRef,
    initiateCall,
    acceptCall,
    declineCall,
    cancelCall,
    endCall,
    toggleMute,
  } = useCall(currentUserId);

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

  // Infinite scroll
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      if (container.scrollTop < 100 && hasMore && !loadingMore) {
        const prevHeight = container.scrollHeight;
        loadMore().then(() => {
          requestAnimationFrame(() => {
            container.scrollTop = container.scrollHeight - prevHeight;
          });
        });
      }
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [hasMore, loadingMore, loadMore]);

  // Socket: server errors
  useEffect(() => {
    if (!dialogId) return;
    const socket = getSocket();
    const handleError = ({ message }) => showError(message || "Server error");
    socket.on("error", handleError);
    return () => socket.off("error", handleError);
  }, [dialogId]);

  // Socket: reactions
  useEffect(() => {
    if (!dialogId) return;
    const socket = getSocket();
    const handleReactionUpdate = (payload) => {
      setReactions((prev) => applyReactionUpdate(prev, payload, currentUserId));
    };
    socket.on("message:reaction", handleReactionUpdate);
    return () => socket.off("message:reaction", handleReactionUpdate);
  }, [dialogId, currentUserId]);

  // Socket: block rejection
  useEffect(() => {
    if (!dialogId) return;
    const socket = getSocket();
    const handleBlocked = ({ reason }) => {
      fetchStatus();
      console.warn("message:blocked:", reason);
    };
    socket.on("message:blocked", handleBlocked);
    return () => socket.off("message:blocked", handleBlocked);
  }, [dialogId, fetchStatus]);

  // Clear reactions on delete
  useEffect(() => {
    messages.forEach((m) => {
      if (m.isDeleted) {
        setReactions((prev) => {
          const key = String(m.id);
          if (!prev[key]) return prev;
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    });
  }, [messages]);

  // Seed reactions from messages
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
            grouped[emoji].count += 1;
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
    const handleClickOutside = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target))
        setShowEmojiPicker(false);
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

  const prevMessagesLenRef = useRef(0);
  useEffect(() => {
    if (loadingMore) return;
    const prevLen = prevMessagesLenRef.current;
    const currLen = messages.length;
    prevMessagesLenRef.current = currLen;
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
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input not supported");
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
            <button
              className="icon-button"
              title="Audio call"
              onClick={() => {
                if (callState !== "idle") return;
                if (!peerId) return;
                initiateCall({
                  targetDialogId: dialogId,
                  targetPeerId: peerId,
                  peerName: dialogTitle || "Unknown",
                  peerAvatar: dialogAvatar,
                  type: "audio",
                });
              }}
              style={{ opacity: callState !== "idle" ? 0.4 : 1 }}
            >
              📞
            </button>
            <button
              className={`block-button ${isBlocked ? "blocked" : ""}`}
              title={isBlocked ? "Unblock user" : "Block user"}
              disabled={blockLoading}
              onClick={isBlocked ? unblock : block}
            >
              {isBlocked ? "🔓" : "🚫"}
            </button>
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
              ⏳ Loading history...
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
              — Start of conversation —
            </div>
          )}

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

          <div className="messages" ref={chatContainerRef}>
            {groupMessagesByDate(messages).map(({ label, messages: group }) => (
              <React.Fragment key={label}>
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
                        {/* REACTION BAR */}
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
                                title={emoji}
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

                        {/* BUBBLE */}
                        <div
                          className="bubble"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMessage(m);
                          }}
                        >
                          {m.replyTo && (
                            <div className="quoted-message">
                              <div className="quoted-author">
                                {m.replyTo.sender?.firstName || "Interlocutor"}
                              </div>
                              <div className="quoted-text">
                                {m.replyTo.text}
                              </div>
                            </div>
                          )}

                          {m.isDeleted ? (
                            <i className="deleted-message">Message deleted</i>
                          ) : (
                            <>
                              {m.text && <span>{m.text}</span>}
                              {/* ATTACHMENTS */}
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
                                const isVideo = ["mp4", "webm", "mov"].includes(
                                  ext,
                                );
                                const isAudio = ["mp3", "wav", "ogg"].includes(
                                  ext,
                                );

                                return (
                                  <div
                                    key={i}
                                    style={{ marginTop: m.text ? 6 : 0 }}
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
                                            maxHeight: 300,
                                            borderRadius: 10,
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
                                            bottom: 6,
                                            right: 6,
                                            background: "rgba(0,0,0,0.6)",
                                            border: "none",
                                            color: "#fff",
                                            borderRadius: 6,
                                            padding: "4px 6px",
                                            cursor: "pointer",
                                            fontSize: 12,
                                          }}
                                        >
                                          ⬇
                                        </button>
                                      </div>
                                    )}
                                    {isVideo && (
                                      <div
                                        className="video-card"
                                        onClick={() =>
                                          window.open(url, "_blank")
                                        }
                                      >
                                        <video
                                          className="video-thumb"
                                          src={url}
                                          muted
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
                                          <span>🎬 {ext}</span>
                                          <span>
                                            {formatFileSize(att.fileSizeBytes)}
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
                                          gap: 10,
                                          background: "#f1f5f9",
                                          borderRadius: 10,
                                          padding: "10px 12px",
                                          marginTop: 4,
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                          }}
                                        >
                                          <span style={{ fontSize: 22 }}>
                                            📄
                                          </span>
                                          <div
                                            style={{
                                              fontSize: 13,
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
                                            borderRadius: 6,
                                            padding: "6px 10px",
                                            cursor: "pointer",
                                            fontSize: 12,
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
                                  navigator.clipboard.writeText(m.text);
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

                          <div className="time">
                            {formatTime(m.createdAt)}
                            <ReadTicks
                              isMine={isMine}
                              readBy={m.readBy || []}
                              currentUserId={currentUserId}
                            />
                          </div>
                        </div>

                        {/* REACTION CHIPS */}
                        {hasReactions && (
                          <div className="reaction-chips">
                            {Object.entries(msgReactions).map(
                              ([emoji, { count, reactedByMe }]) =>
                                count > 0 ? (
                                  <span
                                    key={emoji}
                                    className={`reaction-chip ${reactedByMe ? "mine-reaction" : ""}`}
                                    title={
                                      reactedByMe ? "You reacted" : undefined
                                    }
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
            ))}

            {typingUsers.size > 0 && (
              <div className="typing">Interlocutor is typing</div>
            )}
            <div ref={bottomRef} />
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

          {/* FILE PREVIEW */}
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
              onClick={() => fileInputRef.current?.click()}
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
                  Uploading... {uploadProgress}%
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

        {/* CALL UI */}
        <CallUI
          callState={callState}
          peerInfo={callPeerInfo || { name: dialogTitle, avatar: dialogAvatar }}
          isMuted={isMuted}
          formattedDuration={formattedDuration}
          durationSec={durationSec}
          endedInfo={endedInfo}
          remoteAudioRef={remoteAudioRef}
          onAccept={() => acceptCall(callId)}
          onDecline={() => declineCall(callId)}
          onCancel={cancelCall}
          onEnd={endCall}
          onToggleMute={toggleMute}
        />

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
