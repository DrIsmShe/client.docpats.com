// client/src/pages/clinic/staff/MyClinicInvitations.jsx
//
// Shared "My clinic invitations" page for MembershipRequest (Variant 2).
// Reached by ANY authenticated DocPats User — doctor OR patient — because an
// invitee is not yet a clinic member. MUST be mounted OUTSIDE ClinicLayout
// (which redirects non-members to /patient/home-page), as a top-level route
// next to /clinic/membership-invitations/accept:
//
//   <Route path="/clinic/my-invitations" element={<MyClinicInvitations />} />
//
// Backed by the invitee-side endpoints:
//   GET  /api/v1/clinic/my-membership-requests
//   POST /api/v1/clinic/my-membership-requests/:id/accept
//   POST /api/v1/clinic/my-membership-requests/:id/reject
//
// i18n: RU defaultValue inline now; add the mci.* keys to all 5 locales
// (client/public/locales/<lang>/clinic.json) as a follow-up.

import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  getMyMembershipRequests,
  acceptMembershipRequest,
  rejectMembershipRequest,
} from "../../../api/clinic"; // file lives in pages/clinic/MyClinicInvitations/ (own folder, like MembershipInviteAccept)

// Mirrors server roleLabel() so the UI reads naturally regardless of role.
function useRoleLabel() {
  const { t } = useTranslation("clinic");
  return (role) => {
    switch (role) {
      case "admin":
        return t("mci.role.admin", "администратор");
      case "doctor":
        return t("mci.role.doctor", "врач");
      case "owner":
        return t("mci.role.owner", "владелец");
      default:
        return t("mci.role.staff", "сотрудник");
    }
  };
}

export default function MyClinicInvitations() {
  const { t } = useTranslation("clinic");
  const roleLabel = useRoleLabel();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null); // requestId currently acting on
  const [accepted, setAccepted] = useState(false); // show "go to clinic" hint

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyMembershipRequests();
      setItems(data?.items || []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          t("mci.errorLoad", "Не удалось загрузить приглашения"),
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAccept = async (requestId) => {
    setBusyId(requestId);
    setError(null);
    try {
      await acceptMembershipRequest(requestId);
      setItems((prev) => prev.filter((r) => r.requestId !== requestId));
      setAccepted(true);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          t("mci.errorAccept", "Не удалось принять приглашение"),
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (requestId) => {
    setBusyId(requestId);
    setError(null);
    try {
      await rejectMembershipRequest(requestId);
      setItems((prev) => prev.filter((r) => r.requestId !== requestId));
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          t("mci.errorReject", "Не удалось отклонить приглашение"),
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mci-page">
      <div className="mci-header">
        <h1 className="mci-title">{t("mci.title", "Приглашения в клиники")}</h1>
        <p className="mci-subtitle">
          {t(
            "mci.subtitle",
            "Клиники, которые пригласили вас присоединиться. Примите или отклоните приглашение.",
          )}
        </p>
      </div>

      {error && (
        <div className="mci-alert mci-alert-error" role="alert">
          {error}
        </div>
      )}

      {accepted && (
        <div className="mci-alert mci-alert-success">
          {t("mci.acceptedHint", "Приглашение принято. ")}
          <Link to="/clinic" className="mci-link">
            {t("mci.goToClinic", "Перейти в кабинет клиники")}
          </Link>
        </div>
      )}

      {loading ? (
        <div className="mci-loading">{t("mci.loading", "Загрузка…")}</div>
      ) : items.length === 0 ? (
        <div className="mci-empty">
          {t("mci.empty", "У вас нет активных приглашений.")}
        </div>
      ) : (
        <ul className="mci-list">
          {items.map((r) => {
            const busy = busyId === r.requestId;
            return (
              <li key={r.requestId} className="mci-card">
                <div className="mci-card-main">
                  {r.clinicLogo ? (
                    <img
                      className="mci-logo"
                      src={r.clinicLogo}
                      alt={r.clinicName}
                    />
                  ) : (
                    <div className="mci-logo mci-logo-placeholder" aria-hidden>
                      {(r.clinicName || "?").charAt(0)}
                    </div>
                  )}
                  <div className="mci-info">
                    <div className="mci-clinic-name">{r.clinicName}</div>
                    {r.clinicCity && (
                      <div className="mci-clinic-city">{r.clinicCity}</div>
                    )}
                    <div className="mci-role">
                      {t("mci.roleLine", "Роль: {{role}}", {
                        role: r.customTitle || roleLabel(r.role),
                      })}
                    </div>
                  </div>
                </div>

                <div className="mci-actions">
                  <button
                    type="button"
                    className="mci-btn mci-btn-accept"
                    disabled={busy}
                    onClick={() => handleAccept(r.requestId)}
                  >
                    {busy
                      ? t("mci.processing", "…")
                      : t("mci.accept", "Принять")}
                  </button>
                  <button
                    type="button"
                    className="mci-btn mci-btn-reject"
                    disabled={busy}
                    onClick={() => handleReject(r.requestId)}
                  >
                    {t("mci.reject", "Отклонить")}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
