// client/src/pages/communication/components/AddParticipantModal.jsx
//
// «Добавить участника» — приглашение третьего и следующих прямо в идущий
// разговор. Приглашённому звонит телефон, он принимает и попадает в ту же
// комнату Jitsi.
//
// Список собеседников подгружается САМ и только при открытии окна.
// Держать его в GlobalCallProvider было бы дороже: провайдер оборачивает всё
// приложение, и запрос списка диалогов уходил бы на каждой странице у каждого
// пользователя — ради окна, которое открывают редко.
//
// Приглашать можно тех, с кем уже есть личная переписка: сервер проверяет
// право именно по ней (call:invite → isDialogParticipant для обоих). Без
// такой привязки кнопка превратилась бы в способ дозвониться кому угодно
// по идентификатору.

import { useEffect, useMemo, useState } from "react";

import { getDialogs } from "../api/communicationApi";

const STATUS_TEXT = {
  ringing: "Звоним…",
  joined: "В разговоре",
  declined: "Отклонил вызов",
  no_answer: "Не ответил",
  left: "Вышел",
  busy: "Занят другим звонком",
  not_allowed: "Нельзя пригласить этого человека",
  failed: "Не удалось пригласить",
};

export default function AddParticipantModal({
  onInvite,
  inviteStatus = {},
  onClose,
}) {
  const [dialogs, setDialogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    getDialogs()
      .then((res) => {
        if (!cancelled) setDialogs(res?.data || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || "Не удалось загрузить список");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const people = useMemo(() => {
    const byUserId = new Map();
    for (const dialog of dialogs) {
      const peer = dialog?.peerUser;
      if (dialog?.type !== "private" || !peer?._id) continue;
      const id = String(peer._id);
      if (byUserId.has(id)) continue;
      byUserId.set(id, {
        id,
        // dialogId личной переписки — им сервер проверяет право позвать.
        dialogId: String(dialog._id),
        name: dialog.displayName || peer.username || "Без имени",
        avatarUrl: dialog.avatarUrl || null,
      });
    }
    const list = [...byUserId.values()].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    const q = query.trim().toLowerCase();
    return q ? list.filter((p) => p.name.toLowerCase().includes(q)) : list;
  }, [dialogs, query]);

  // Статусы приходят картой userId → состояние: позвать можно нескольких
  // подряд, и судьба каждого приглашения должна быть видна своя.
  const statusFor = (id) => inviteStatus?.[id] || null;

  return (
    <div className="apm-backdrop" onClick={onClose}>
      <style>{CSS}</style>
      <div
        className="apm-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Добавить участника"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="apm-head">
          <h2 className="apm-title">Добавить участника</h2>
          <button type="button" className="apm-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <p className="apm-lead">
          Человеку поступит вызов. Приняв его, он окажется в этом же разговоре.
        </p>

        <input
          className="apm-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по имени"
        />

        {loading ? (
          <p className="apm-note">Загружаем список…</p>
        ) : error ? (
          <p className="apm-note apm-note-error">{error}</p>
        ) : people.length === 0 ? (
          <p className="apm-note">
            {query
              ? "Никого не нашлось."
              : "Пригласить можно тех, с кем уже есть личная переписка."}
          </p>
        ) : (
          <div className="apm-list">
            {people.map((person) => {
              const state = statusFor(person.id);
              // Повторно звать того, кому уже звоним или кто уже здесь,
              // незачем — кнопка гаснет, а не молча ничего не делает.
              const busy = state === "ringing" || state === "joined";
              return (
                <div key={person.id} className="apm-person">
                  {person.avatarUrl ? (
                    <img className="apm-avatar" src={person.avatarUrl} alt="" />
                  ) : (
                    <span className="apm-avatar apm-avatar-stub">
                      {person.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="apm-name">{person.name}</span>
                  {state ? (
                    <span
                      className={`apm-status${
                        state === "joined" ? " apm-status-ok" : ""
                      }`}
                    >
                      {STATUS_TEXT[state] || state}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    className="apm-btn"
                    disabled={busy}
                    onClick={() =>
                      onInvite({ userId: person.id, dialogId: person.dialogId })
                    }
                  >
                    {busy ? "…" : "Позвать"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const CSS = `
.apm-backdrop {
  position: fixed; inset: 0; z-index: 10001;
  background: rgba(8, 16, 15, .6);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.apm-modal {
  width: 100%; max-width: 420px; max-height: 82vh;
  display: flex; flex-direction: column;
  background: #fff; border-radius: 16px;
  box-shadow: 0 24px 64px rgba(0,0,0,.35);
  padding: 18px 20px 16px;
  font-family: "Inter", system-ui, -apple-system, sans-serif;
  color: #16211f;
}
.apm-head { display: flex; align-items: center; gap: 10px; }
.apm-title { font-size: 16px; font-weight: 700; margin: 0; margin-inline-end: auto; }
.apm-close { border: none; background: none; font-size: 15px; color: #6b7d79; cursor: pointer; padding: 4px; }
.apm-lead { margin: 6px 0 12px; font-size: 12.5px; line-height: 1.55; color: #6b7d79; }
.apm-search {
  width: 100%; border: 1px solid #d3e0dd; border-radius: 9px;
  padding: 8px 11px; font: inherit; font-size: 14px; margin-bottom: 10px;
}
.apm-search:focus { outline: none; border-color: #0d6b5e; box-shadow: 0 0 0 3px rgba(13,107,94,.12); }
.apm-note { margin: 8px 0; font-size: 13px; color: #8a9a97; line-height: 1.55; }
.apm-note-error { color: #8c2118; }
/* Список прокручивается сам: окно висит поверх идущего звонка и не должно
   вырастать во весь экран. */
.apm-list { overflow-y: auto; border: 1px solid #e4ecea; border-radius: 10px; }
.apm-person {
  display: flex; align-items: center; gap: 9px;
  padding: 8px 10px; border-bottom: 1px solid #f2f7f6;
}
.apm-person:last-child { border-bottom: none; }
.apm-avatar { width: 30px; height: 30px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.apm-avatar-stub {
  display: flex; align-items: center; justify-content: center;
  background: #d9ebe8; color: #0d6b5e; font-size: 13px; font-weight: 700;
}
.apm-name {
  font-size: 14px; margin-inline-end: auto;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.apm-status { font-size: 11px; color: #96601a; white-space: nowrap; }
.apm-status-ok { color: #0d6b45; }
.apm-btn {
  flex-shrink: 0;
  border: 1px solid #0d6b5e; background: #0d6b5e; color: #fff;
  border-radius: 8px; padding: 5px 12px;
  font: inherit; font-size: 13px; font-weight: 600; cursor: pointer;
}
.apm-btn:hover:not(:disabled) { background: #0a564c; }
.apm-btn:disabled { background: #a9c6c1; border-color: #a9c6c1; cursor: default; }
`;
