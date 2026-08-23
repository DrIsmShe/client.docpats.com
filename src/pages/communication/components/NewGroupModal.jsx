// client/src/pages/communication/components/NewGroupModal.jsx
//
// Создание группового диалога — он же комната конференции.
//
// Почему конференция живёт именно здесь, а не в кнопке «добавить участника»
// внутри звонка: пропуск в комнату Jitsi выдаёт сервер и только участнику
// диалога (video.controller.js → resolveDialogRoom). В приватном диалоге
// участников двое, и третьему пропуск взять негде. В групповом — каждый
// участник получает свой, поэтому разговор втроём и больше возможен только
// через группу.
//
// Собеседники берутся из уже существующих личных переписок. Это осознанное
// ограничение первой версии: так не нужен поиск по всем пользователям
// платформы, а значит и не появляется способ перебирать чужие аккаунты.
// Понадобится добавлять людей, с которыми переписки ещё не было, — это
// отдельная задача с поиском и правами.

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { createGroupDialog } from "../api/communicationApi";

export default function NewGroupModal({ dialogs, basePath, onClose }) {
  const { t } = useTranslation("Communication");
  const navigate = useNavigate();

  const [selected, setSelected] = useState(() => new Set());
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Кандидаты — собеседники из личных переписок. Группы отбрасываем:
  // у них нет одного собеседника, добавлять «диалог в диалог» бессмысленно.
  const candidates = useMemo(() => {
    const byUserId = new Map();
    for (const dialog of dialogs || []) {
      const peer = dialog?.peerUser;
      if (dialog?.type !== "private" || !peer?._id) continue;
      const id = String(peer._id);
      if (!byUserId.has(id)) {
        byUserId.set(id, {
          id,
          name: dialog.displayName || peer.username || "Без имени",
          avatarUrl: dialog.avatarUrl || null,
          role: peer.role || "",
        });
      }
    }
    return [...byUserId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [dialogs]);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    setSaving(true);
    setError(null);
    try {
      const { data } = await createGroupDialog({
        participantIds: [...selected],
        title: title.trim(),
      });
      const id = data?._id || data?.dialog?._id;
      onClose();
      // Ведём сразу в созданную группу: там кнопка видеозвонка открывает
      // общую комнату, ради которой всё и затевалось.
      if (id) navigate(`${basePath}/${id}`);
    } catch (err) {
      setError(
        err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          err?.message ||
          "Не удалось создать группу",
      );
    } finally {
      setSaving(false);
    }
  };

  // Двое — это личная переписка, она уже есть. Группа начинается с трёх
  // участников, считая создателя, то есть с двух выбранных.
  const enough = selected.size >= 2;

  return (
    <div className="ngm-backdrop" onClick={onClose}>
      <style>{CSS}</style>
      <div
        className="ngm-modal"
        role="dialog"
        aria-modal="true"
        aria-label={t("group.title")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ngm-head">
          <h2 className="ngm-title">{t("group.title")}</h2>
          <button type="button" className="ngm-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <p className="ngm-lead">
          {t("group.note")}
        </p>

        <label className="ngm-field">
          <span className="ngm-label">{t("group.name")}</span>
          <input
            className="ngm-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("group.namePlaceholder")}
            maxLength={120}
          />
        </label>

        <div className="ngm-field">
          <span className="ngm-label">
            {t("group.members")}
            {selected.size > 0 ? ` — выбрано ${selected.size}` : ""}
          </span>

          {candidates.length === 0 ? (
            <p className="ngm-empty">
              {t("group.nobody")}
            </p>
          ) : (
            <div className="ngm-list">
              {candidates.map((person) => (
                <label
                  key={person.id}
                  className={`ngm-person${selected.has(person.id) ? " ngm-person-on" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(person.id)}
                    onChange={() => toggle(person.id)}
                  />
                  {person.avatarUrl ? (
                    <img
                      className="ngm-avatar"
                      src={person.avatarUrl}
                      alt=""
                    />
                  ) : (
                    <span className="ngm-avatar ngm-avatar-stub">
                      {person.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="ngm-person-name">{person.name}</span>
                  {person.role ? (
                    <span className="ngm-person-role">{person.role}</span>
                  ) : null}
                </label>
              ))}
            </div>
          )}
        </div>

        {error ? <div className="ngm-error">{error}</div> : null}

        <div className="ngm-actions">
          <button type="button" className="ngm-btn" onClick={onClose}>
            {t("group.cancel")}
          </button>
          <button
            type="button"
            className="ngm-btn ngm-btn-primary"
            onClick={handleCreate}
            disabled={!enough || saving}
            title={enough ? "" : "Выберите хотя бы двоих"}
          >
            {saving ? "Создаём…" : "Создать группу"}
          </button>
        </div>
      </div>
    </div>
  );
}

const CSS = `
.ngm-backdrop {
  position: fixed; inset: 0; z-index: 10000;
  background: rgba(10, 20, 19, 0.55);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.ngm-modal {
  width: 100%; max-width: 460px; max-height: 86vh;
  display: flex; flex-direction: column;
  background: #fff; border-radius: 16px;
  box-shadow: 0 24px 64px rgba(0,0,0,.28);
  padding: 20px 22px 18px;
  font-family: "Inter", system-ui, -apple-system, sans-serif;
  color: #16211f;
}
.ngm-head { display: flex; align-items: center; gap: 10px; }
.ngm-title { font-size: 17px; font-weight: 700; margin: 0; margin-inline-end: auto; }
.ngm-close {
  border: none; background: none; font-size: 16px; line-height: 1;
  color: #6b7d79; cursor: pointer; padding: 4px;
}
.ngm-lead { margin: 8px 0 16px; font-size: 13px; line-height: 1.55; color: #6b7d79; }
.ngm-field { display: block; margin-bottom: 14px; }
.ngm-label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; }
.ngm-input {
  width: 100%; border: 1px solid #d3e0dd; border-radius: 9px;
  padding: 9px 11px; font: inherit; font-size: 14px;
}
.ngm-input:focus { outline: none; border-color: #0d6b5e; box-shadow: 0 0 0 3px rgba(13,107,94,.12); }
.ngm-empty { margin: 0; font-size: 13px; color: #8a9a97; line-height: 1.55; }
/* Список прокручивается сам — при полусотне переписок модалка иначе
   уезжает за пределы экрана вместе с кнопкой «Создать». */
.ngm-list {
  max-height: 40vh; overflow-y: auto;
  border: 1px solid #e4ecea; border-radius: 10px;
}
.ngm-person {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 11px; cursor: pointer;
  border-bottom: 1px solid #f2f7f6;
}
.ngm-person:last-child { border-bottom: none; }
.ngm-person:hover { background: #f7fbfa; }
.ngm-person-on { background: #eef8f6; }
.ngm-avatar {
  width: 30px; height: 30px; border-radius: 50%;
  object-fit: cover; flex-shrink: 0;
}
.ngm-avatar-stub {
  display: flex; align-items: center; justify-content: center;
  background: #d9ebe8; color: #0d6b5e; font-size: 13px; font-weight: 700;
}
.ngm-person-name {
  font-size: 14px; margin-inline-end: auto;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.ngm-person-role { font-size: 11px; color: #8a9a97; flex-shrink: 0; }
.ngm-error {
  border-radius: 9px; padding: 9px 11px; margin-bottom: 12px;
  background: #fdecea; color: #8c2118; font-size: 13px;
}
.ngm-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }
.ngm-btn {
  border: 1px solid #d3e0dd; background: #fff; border-radius: 9px;
  padding: 9px 16px; font: inherit; font-size: 14px; cursor: pointer;
  color: #4a5a57;
}
.ngm-btn:hover { border-color: #0d6b5e; }
.ngm-btn-primary { background: #0d6b5e; border-color: #0d6b5e; color: #fff; }
.ngm-btn-primary:hover:not(:disabled) { background: #0a564c; }
.ngm-btn-primary:disabled { background: #a9c6c1; border-color: #a9c6c1; cursor: not-allowed; }
`;
