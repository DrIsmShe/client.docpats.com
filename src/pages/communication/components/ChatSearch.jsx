// client/src/communication/components/ChatSearch.jsx
//
// Использование в ChatPage.jsx (добавь под .chatpage-sidebar-header):
//   <ChatSearch onSelectDialog={(id) => navigate(`/doctor/communication/${id}`)}
//               onSelectMessage={(dialogId, messageId) => {
//                 navigate(`/doctor/communication/${dialogId}`, { state: { scrollToMessage: messageId } });
//               }} />

import { useRef, useEffect, useState } from "react";
import { useSearch } from "../hooks/useSearch";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&display=swap');

  .cs-wrap {
    position: relative;
    padding: 10px 12px;
    background: #fff;
    border-bottom: 1px solid #e2ecf3;
    flex-shrink: 0;
  }

  /* INPUT ROW */
  .cs-input-row {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #f0f4f8;
    border: 1.5px solid #e2ecf3;
    border-radius: 24px;
    padding: 7px 14px;
    transition: border-color .2s, box-shadow .2s;
  }
  .cs-input-row:focus-within {
    border-color: #1a6b8a;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(26,107,138,.1);
  }
  .cs-icon { font-size: 14px; color: #a0aec0; flex-shrink: 0; line-height: 1; }
  .cs-input {
    flex: 1; border: none; outline: none; background: transparent;
    font-family: 'Nunito', sans-serif; font-size: 13.5px; color: #2d3748;
  }
  .cs-input::placeholder { color: #a0aec0; }
  .cs-clear {
    background: none; border: none; cursor: pointer;
    color: #a0aec0; font-size: 14px; line-height: 1; padding: 0;
    display: flex; align-items: center;
    transition: color .15s;
  }
  .cs-clear:hover { color: #4a5568; }

  /* DROPDOWN */
  .cs-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 8px; right: 8px;
    background: #fff;
    border: 1px solid #e2ecf3;
    border-radius: 14px;
    box-shadow: 0 8px 32px rgba(0,0,0,.12);
    z-index: 500;
    overflow: hidden;
    animation: csDrop .18s ease;
    max-height: 420px;
    overflow-y: auto;
  }
  @keyframes csDrop { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
  .cs-dropdown::-webkit-scrollbar { width: 3px; }
  .cs-dropdown::-webkit-scrollbar-thumb { background: #d1dce6; border-radius: 3px; }

  /* SECTION HEADER */
  .cs-section-head {
    padding: 10px 14px 6px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: #a0aec0;
    font-family: 'Nunito', sans-serif;
    background: #f8fafc;
    border-bottom: 1px solid #f0f4f8;
  }

  /* RESULT ITEM */
  .cs-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    cursor: pointer;
    transition: background .12s;
    border-bottom: 1px solid #f0f4f8;
    font-family: 'Nunito', sans-serif;
  }
  .cs-item:last-child { border-bottom: none; }
  .cs-item:hover { background: #f0f6fa; }
  .cs-item:active { background: #e0eef5; }

  /* Avatar */
  .cs-avatar {
    width: 38px; height: 38px; border-radius: 50%;
    object-fit: cover; border: 2px solid #e2ecf3; flex-shrink: 0;
  }
  .cs-avatar-ph {
    width: 38px; height: 38px; border-radius: 50%;
    background: linear-gradient(135deg, #1a6b8a, #1e82a8);
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 700; color: #fff;
    font-family: 'Nunito', sans-serif;
    border: 2px solid #e2ecf3; flex-shrink: 0; user-select: none;
  }

  /* Text */
  .cs-item-text { flex: 1; min-width: 0; }
  .cs-item-name {
    font-size: 13.5px; font-weight: 600; color: #1a202c;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .cs-item-sub {
    font-size: 12px; color: #718096; margin-top: 1px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .cs-item-sub mark {
    background: rgba(26,107,138,.15);
    color: #1a6b8a;
    border-radius: 3px;
    padding: 0 2px;
    font-weight: 600;
  }

  /* Right badge */
  .cs-item-meta {
    font-size: 10.5px; color: #a0aec0; flex-shrink: 0;
    font-family: 'Nunito', sans-serif;
  }

  /* States */
  .cs-loading {
    display: flex; align-items: center; justify-content: center;
    gap: 8px; padding: 18px; color: #718096;
    font-size: 13px; font-family: 'Nunito', sans-serif;
  }
  .cs-spinner {
    width: 16px; height: 16px;
    border: 2px solid #1a6b8a; border-top-color: transparent;
    border-radius: 50%; animation: csSpin .7s linear infinite;
  }
  @keyframes csSpin { to { transform: rotate(360deg); } }

  .cs-empty {
    padding: 18px 14px; text-align: center;
    font-size: 13px; color: #a0aec0; font-family: 'Nunito', sans-serif;
  }
  .cs-empty::before { content: '🔍 '; font-size: 18px; display: block; margin-bottom: 6px; opacity: .5; }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────
function getInitials(name) {
  if (!name) return "?";
  const p = name.trim().split(/\s+/);
  return p.length >= 2
    ? (p[0][0] + p[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function formatTime(d) {
  if (!d) return "";
  const date = new Date(d);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { day: "numeric", month: "short" });
}

/**
 * Подсвечивает вхождения query в text.
 * Возвращает массив span/mark элементов.
 */
function highlight(text, query) {
  if (!text || !query) return text;
  const regex = new RegExp(
    `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi",
  );
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i}>{part}</mark> : part,
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
function ChatSearch({ onSelectDialog, onSelectMessage }) {
  const { query, setQuery, results, loading, clear } = useSearch(280);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const hasResults = results.dialogs.length > 0 || results.messages.length > 0;
  const showDropdown = open && query.trim().length >= 2;

  // Закрыть при клике снаружи
  useEffect(() => {
    const h = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleSelectDialog = (id) => {
    setOpen(false);
    clear();
    onSelectDialog?.(id);
  };

  const handleSelectMessage = (dialogId, messageId) => {
    setOpen(false);
    clear();
    onSelectMessage?.(dialogId, messageId);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="cs-wrap" ref={wrapRef}>
        {/* Search input */}
        <div className="cs-input-row">
          <span className="cs-icon">🔍</span>
          <input
            className="cs-input"
            type="text"
            value={query}
            placeholder="Search dialogs and messages…"
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
          />
          {query && (
            <button
              className="cs-clear"
              type="button"
              onClick={() => {
                clear();
                setOpen(false);
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Dropdown */}
        {showDropdown && (
          <div className="cs-dropdown">
            {loading && (
              <div className="cs-loading">
                <div className="cs-spinner" />
                Searching…
              </div>
            )}

            {!loading && !hasResults && (
              <div className="cs-empty">Nothing found for "{query}"</div>
            )}

            {/* DIALOGS */}
            {!loading && results.dialogs.length > 0 && (
              <>
                <div className="cs-section-head">Dialogs</div>
                {results.dialogs.map((d) => (
                  <div
                    key={String(d._id)}
                    className="cs-item"
                    onClick={() => handleSelectDialog(String(d._id))}
                  >
                    {d.avatarUrl ? (
                      <img src={d.avatarUrl} alt="" className="cs-avatar" />
                    ) : (
                      <div className="cs-avatar-ph">
                        {getInitials(d.displayName)}
                      </div>
                    )}
                    <div className="cs-item-text">
                      <div className="cs-item-name">
                        {highlight(d.displayName, query)}
                      </div>
                      {d.lastMessageAt && (
                        <div className="cs-item-sub">
                          {formatTime(d.lastMessageAt)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* MESSAGES */}
            {!loading && results.messages.length > 0 && (
              <>
                <div className="cs-section-head">Messages</div>
                {results.messages.map((m) => (
                  <div
                    key={String(m._id)}
                    className="cs-item"
                    onClick={() =>
                      handleSelectMessage(String(m.dialogId), String(m._id))
                    }
                  >
                    {m.dialog?.avatarUrl ? (
                      <img
                        src={m.dialog.avatarUrl}
                        alt=""
                        className="cs-avatar"
                      />
                    ) : (
                      <div className="cs-avatar-ph">
                        {getInitials(m.dialog?.displayName)}
                      </div>
                    )}
                    <div className="cs-item-text">
                      <div className="cs-item-name">
                        {m.dialog?.displayName || "Dialog"}
                      </div>
                      <div className="cs-item-sub">
                        {highlight(m.text, query)}
                      </div>
                    </div>
                    <span className="cs-item-meta">
                      {formatTime(m.createdAt)}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default ChatSearch;
