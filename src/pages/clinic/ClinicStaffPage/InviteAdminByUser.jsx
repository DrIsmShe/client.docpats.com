// client/src/pages/clinic/staff/InviteAdminByUser.jsx
//
// Owner-only modal: invite an EXISTING DocPats User (doctor/patient) to become
// a clinic ADMIN via MembershipRequest (Variant 2). Replaces the email-based
// admin invite in the UI; the email path (InviteAdminModal) stays in code as a
// fallback for external people.
//
// Flow: owner searches a User (reusing the patient user-search endpoint) →
// picks one → POST /membership-requests { userId, role:"admin", customTitle } →
// the invitee accepts on /clinic/my-invitations → ClinicMembership(actorType
// "user", role "admin") is created.
//
// Reuses:
//   GET  /api/v1/clinic/patients/users/search   (searchClinicUsers)
//   POST /api/v1/clinic/membership-requests      (createMembershipRequest)
//
// i18n: RU defaultValue inline; add iabu.* keys to all 5 locales
// (client/public/locales/<lang>/clinic.json) as a follow-up.

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  searchUsersForLink,
  createMembershipRequest,
} from "../../../api/clinic"; // file lives in pages/clinic/ClinicStaffPage/ — same import as ClinicStaffPage.jsx

// Adapter for the searchUsers response. Defensive: maps the likely field names
// to a stable shape. If your searchUsers returns different keys, fix HERE only.
function normalizeUser(raw = {}) {
  const userId = String(raw.userId || raw._id || raw.id || "");
  const name =
    raw.name ||
    [raw.firstName, raw.lastName].filter(Boolean).join(" ") ||
    raw.username ||
    raw.email ||
    userId;
  return {
    userId,
    name,
    email: raw.email || null,
    username: raw.username || null,
    avatar: raw.avatar || null,
  };
}

function extractUsers(res) {
  // searchUsersForLink returns normalizeList(...) === { items: [...] }
  const arr = Array.isArray(res?.items) ? res.items : [];
  return arr.map(normalizeUser).filter((u) => u.userId);
}

export default function InviteAdminByUser({ onClose, onInvited }) {
  const { t } = useTranslation("clinic");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);

  const [customTitle, setCustomTitle] = useState("");
  const [invitingId, setInvitingId] = useState(null);
  const [invitedName, setInvitedName] = useState(null);

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setSearched(true);
    setError(null);
    setResults([]);
    try {
      // Owner typically knows the colleague's email → email mode. The
      // endpoint also supports dob+name mode if you extend this form.
      const res = await searchUsersForLink({ mode: "email", email: q });
      setResults(extractUsers(res));
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          t("iabu.errorSearch", "Не удалось выполнить поиск"),
      );
    } finally {
      setSearching(false);
    }
  };

  const handleInvite = async (user) => {
    setInvitingId(user.userId);
    setError(null);
    try {
      await createMembershipRequest({
        userId: user.userId,
        role: "admin",
        customTitle: customTitle.trim() || undefined,
      });
      setInvitedName(user.name);
      onInvited?.(user);
    } catch (err) {
      // 409 from service: already a member / pending request already exists.
      setError(
        err?.response?.data?.message ||
          t("iabu.errorInvite", "Не удалось отправить приглашение"),
      );
    } finally {
      setInvitingId(null);
    }
  };

  return (
    <div className="iabu-overlay" onClick={onClose}>
      <div
        className="iabu-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="iabu-header">
          <h2 className="iabu-title">
            {t("iabu.title", "Пригласить администратора")}
          </h2>
          <button
            type="button"
            className="iabu-close"
            aria-label={t("iabu.close", "Закрыть")}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <p className="iabu-hint">
          {t(
            "iabu.hint",
            "Найдите существующего пользователя DocPats по email и пригласите его администратором. Приглашение появится в его кабинете.",
          )}
        </p>

        {invitedName ? (
          <div className="iabu-success">
            {t(
              "iabu.invited",
              "Приглашение отправлено: {{name}}. Оно появится в кабинете пользователя.",
              { name: invitedName },
            )}
            <div className="iabu-success-actions">
              <button
                type="button"
                className="iabu-btn"
                onClick={() => {
                  setInvitedName(null);
                  setQuery("");
                  setResults([]);
                  setSearched(false);
                }}
              >
                {t("iabu.inviteAnother", "Пригласить ещё")}
              </button>
              <button type="button" className="iabu-btn" onClick={onClose}>
                {t("iabu.done", "Готово")}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="iabu-search-row">
              <input
                type="email"
                className="iabu-input"
                placeholder={t("iabu.searchPlaceholder", "Email пользователя")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <button
                type="button"
                className="iabu-btn iabu-btn-search"
                disabled={searching || !query.trim()}
                onClick={handleSearch}
              >
                {searching
                  ? t("iabu.searching", "Поиск…")
                  : t("iabu.search", "Найти")}
              </button>
            </div>

            <div className="iabu-title-row">
              <label className="iabu-label">
                {t("iabu.customTitle", "Должность (необязательно)")}
              </label>
              <input
                type="text"
                className="iabu-input"
                maxLength={200}
                placeholder={t(
                  "iabu.customTitlePlaceholder",
                  "Напр.: Заместитель главного врача",
                )}
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
              />
            </div>

            {error && (
              <div className="iabu-alert iabu-alert-error" role="alert">
                {error}
              </div>
            )}

            {searched && !searching && results.length === 0 && !error && (
              <div className="iabu-empty">
                {t("iabu.noResults", "Пользователь не найден.")}
              </div>
            )}

            {results.length > 0 && (
              <ul className="iabu-results">
                {results.map((u) => {
                  const busy = invitingId === u.userId;
                  return (
                    <li key={u.userId} className="iabu-result">
                      <div className="iabu-result-main">
                        {u.avatar ? (
                          <img
                            className="iabu-avatar"
                            src={u.avatar}
                            alt={u.name}
                          />
                        ) : (
                          <div
                            className="iabu-avatar iabu-avatar-placeholder"
                            aria-hidden
                          >
                            {(u.name || "?").charAt(0)}
                          </div>
                        )}
                        <div className="iabu-result-info">
                          <div className="iabu-result-name">{u.name}</div>
                          {u.email && (
                            <div className="iabu-result-email">{u.email}</div>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="iabu-btn iabu-btn-invite"
                        disabled={busy}
                        onClick={() => handleInvite(u)}
                      >
                        {busy
                          ? t("iabu.inviting", "…")
                          : t("iabu.invite", "Пригласить админом")}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
