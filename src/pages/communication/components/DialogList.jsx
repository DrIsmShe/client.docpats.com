import { Link } from "react-router-dom";

import { useTranslation } from "react-i18next";
// ─── Format timestamp like a messenger ────────────────────────────────────────
// Сегодня        → "09:26"
// Вчера          → "вчера"
// На этой неделе → "пн" / "вт" / "ср" ...
// В этом году    → "7 мар"
// Другой год     → "07.03.24"
function formatDialogTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return "";

  const now = new Date();

  // Сегодня
  if (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  ) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  // Вчера
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()
  ) {
    return "вчера";
  }

  // На этой неделе (2–6 дней назад) → короткий день недели
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfMsg = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = (startOfToday - startOfMsg) / (1000 * 60 * 60 * 24);
  if (diffDays < 7) {
    // "пн", "вт", "ср" … (ru-RU, lowercase)
    return d.toLocaleDateString("ru-RU", { weekday: "short" }).replace(".", "");
  }

  // В этом году → "7 мар"
  if (d.getFullYear() === now.getFullYear()) {
    return d
      .toLocaleDateString("ru-RU", { day: "numeric", month: "short" })
      .replace(".", "");
  }

  // Другой год → "07.03.24"
  return d.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

const styles = `
  .dialog-list { display: flex; flex-direction: column; }

  .dialog-item {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 10px 14px;
    text-decoration: none;
    color: inherit;
    border-bottom: 1px solid #f0f4f8;
    transition: background 0.15s;
    cursor: pointer;
    position: relative;
  }
  .dialog-item:hover    { background: #f0f7fa; }
  .dialog-item.active   { background: #e6f2f7; }
  .dialog-item.active .dialog-name { color: #1a6b8a; }

  /* Avatar */
  .dialog-avatar-wrap {
    position: relative;
    flex-shrink: 0;
  }
  .dialog-avatar {
    width: 46px; height: 46px;
    border-radius: 50%;
    object-fit: cover;
    display: block;
    background: #d0e8f0;
  }
  .dialog-avatar-placeholder {
    width: 46px; height: 46px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1a6b8a, #1e82a8);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; font-weight: 700; color: #fff;
    flex-shrink: 0;
  }

  /* Online dot */
  .online-dot {
    position: absolute;
    bottom: 1px; right: 1px;
    width: 11px; height: 11px;
    border-radius: 50%;
    background: #22c55e;
    border: 2px solid #fff;
  }

  /* Text block */
  .dialog-text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .dialog-row1 {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
  }

  .dialog-name {
    font-size: 14px;
    font-weight: 700;
    color: #2d3748;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dialog-time {
    font-size: 11px;
    color: #94a3b8;
    flex-shrink: 0;
    white-space: nowrap;
  }

  .dialog-row2 {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
  }

  .dialog-preview {
    font-size: 12.5px;
    color: #718096;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }
  .dialog-item.active .dialog-preview { color: #4a90a4; }

  /* Unread badge */
  .unread-badge {
    flex-shrink: 0;
    min-width: 20px;
    height: 20px;
    border-radius: 10px;
    background: #1a6b8a;
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 5px;
    line-height: 1;
    animation: badgePop 0.2s cubic-bezier(0.34,1.56,0.64,1);
  }
  @keyframes badgePop {
    from { transform: scale(0); opacity: 0; }
    to   { transform: scale(1); opacity: 1; }
  }
  /* Active dialog — mute the badge */
  .dialog-item.active .unread-badge {
    background: #4a90a4;
  }

  /* Selectable mode highlight */
  .dialog-item.selected {
    background: #e6f2f7;
    border-left: 3px solid #1a6b8a;
  }

  .dialog-empty {
    padding: 24px 16px;
    text-align: center;
    color: #a0aec0;
    font-size: 14px;
  }
`;

function DialogList({
  dialogs = [],
  activeDialogId = null,
  onSelect = null,
  selectable = false,
  onlineUsers = new Set(), // Set of online userId strings
  basePath = "/communication", // ← добавили
}) {
  const { t } = useTranslation("Communication");
  const validDialogs = Array.isArray(dialogs) ? dialogs.filter(Boolean) : [];

  if (validDialogs.length === 0) {
    return (
      <>
        <style>{styles}</style>
        <div className="dialog-empty">{t("ui.noDialogs")}</div>
      </>
    );
  }

  const handleSelect = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (selectable && typeof onSelect === "function") onSelect(id);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="dialog-list">
        {validDialogs.map((d) => {
          const id = String(d._id);
          const isActive = String(activeDialogId) === id;
          const unread = d.unreadCount || 0;
          const initials = (d.displayName || "?").slice(0, 1).toUpperCase();
          const peerId = d.peerUser
            ? String(d.peerUser._id || d.peerUser.id || "")
            : "";
          const isOnline = peerId && onlineUsers.has(peerId);

          const content = (
            <>
              {/* Avatar */}
              <div className="dialog-avatar-wrap">
                {d.avatarUrl ? (
                  <img src={d.avatarUrl} alt="" className="dialog-avatar" />
                ) : (
                  <div className="dialog-avatar-placeholder">{initials}</div>
                )}
                {isOnline && <span className="online-dot" />}
              </div>

              {/* Text */}
              <div className="dialog-text">
                <div className="dialog-row1">
                  <div className="dialog-name">{d.displayName || "Диалог"}</div>
                  <div className="dialog-time">
                    {formatDialogTime(d.lastMessageAt)}
                  </div>
                </div>
                <div className="dialog-row2">
                  <div className="dialog-preview">
                    {d.lastMessagePreview || "Нет сообщений"}
                  </div>
                  {unread > 0 && (
                    <span className="unread-badge">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </div>
              </div>
            </>
          );

          if (selectable) {
            return (
              <div
                key={id}
                onClick={(e) => handleSelect(e, id)}
                className={`dialog-item ${isActive ? "active" : ""}`}
              >
                {content}
              </div>
            );
          }

          return (
            <Link
              key={id}
              to={`${basePath}/${id}`}
              className={`dialog-item ${isActive ? "active" : ""}`}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </>
  );
}

export default DialogList;
