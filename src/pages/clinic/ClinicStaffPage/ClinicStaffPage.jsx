// client/src/pages/clinic/ClinicStaffPage/ClinicStaffPage.jsx

import React, { useEffect, useState, useCallback } from "react";
import { Link, useOutletContext, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  listStaff,
  listInvitations,
  revokeInvitation,
  removeStaff,
  changeStaffRole,
} from "../../../api/clinic";
import InviteEmployeeModal from "./InviteEmployeeModal";
import AddDoctorModal from "./AddDoctorModal";
import "./clinicStaffPage.css";

const CHANGEABLE_ROLES = [
  "admin",
  "manager",
  "doctor",
  "receptionist",
  "nurse",
  "accountant",
  "pharmacist",
  "marketer",
];

export default function ClinicStaffPage() {
  const { t, i18n } = useTranslation("clinic");
  const layoutContext = useOutletContext();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [staff, setStaff] = useState([]);
  const [invitations, setInvitations] = useState([]);

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [addDoctorModalOpen, setAddDoctorModalOpen] = useState(false);

  const [actionLoading, setActionLoading] = useState({});

  const myRole = layoutContext?.role || "member";
  const canInvite = ["owner", "admin"].includes(myRole);
  const canManageRoles = ["owner", "admin"].includes(myRole);
  const canRemove = ["owner", "admin"].includes(myRole);

  const loadAll = useCallback(async () => {
    try {
      setError(null);
      const [staffRes, invitationsRes] = await Promise.all([
        listStaff(),
        listInvitations("pending").catch(() => ({ items: [] })),
      ]);
      setStaff(staffRes.items || []);
      setInvitations(invitationsRes.items || []);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load staff:", err);
      if (err.response?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      setError(err.message || "Failed to load staff");
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  function staffDisplayName(m) {
    return (
      [m.firstName, m.lastName].filter(Boolean).join(" ") ||
      m.email ||
      m.username ||
      t("staff.unnamed")
    );
  }

  async function handleRevokeInvitation(invitationId) {
    if (!window.confirm(t("staff.confirmRevoke"))) return;
    setActionLoading((p) => ({ ...p, [invitationId]: true }));
    try {
      await revokeInvitation(invitationId);
      await loadAll();
    } catch (err) {
      alert(err.response?.data?.error || t("staff.revokeFailed"));
    } finally {
      setActionLoading((p) => ({ ...p, [invitationId]: false }));
    }
  }

  async function handleRemoveStaff(membership) {
    const name = staffDisplayName(membership);
    if (!window.confirm(t("staff.confirmRemove", { name }))) return;
    const id = membership.membershipId || membership._id;
    setActionLoading((p) => ({ ...p, [id]: true }));
    try {
      await removeStaff(id);
      await loadAll();
    } catch (err) {
      alert(err.response?.data?.error || t("staff.removeFailed"));
    } finally {
      setActionLoading((p) => ({ ...p, [id]: false }));
    }
  }

  async function handleChangeRole(membership, newRole) {
    if (membership.role === newRole) return;
    const id = membership.membershipId || membership._id;
    setActionLoading((p) => ({ ...p, [id]: true }));
    try {
      await changeStaffRole(id, newRole);
      await loadAll();
    } catch (err) {
      alert(err.response?.data?.error || t("staff.changeRoleFailed"));
    } finally {
      setActionLoading((p) => ({ ...p, [id]: false }));
    }
  }

  function handleInviteSuccess() {
    setInviteModalOpen(false);
    loadAll();
  }

  function handleAddDoctorSuccess() {
    setAddDoctorModalOpen(false);
    loadAll();
  }

  const formatDate = (d) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString(i18n.language || undefined);
    } catch {
      return "—";
    }
  };

  if (loading) {
    return (
      <div className="staff-page-loading">
        <div className="staff-page-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="staff-page-error">
        <h2>{t("staff.errorTitle")}</h2>
        <p>{error}</p>
        <button onClick={loadAll}>{t("common.retry")}</button>
      </div>
    );
  }

  return (
    <div className="staff-page">
      <div className="staff-page-header">
        <div className="staff-page-header-left">
          <Link to="/clinic/dashboard" className="staff-page-back">
            {t("staff.back")}
          </Link>
          <h1>{t("staff.title")}</h1>
          <p className="staff-page-subtitle">{t("staff.subtitle")}</p>
        </div>
        {canInvite && (
          <div className="staff-page-header-actions">
            <button
              className="staff-page-btn-secondary"
              onClick={() => setAddDoctorModalOpen(true)}
              type="button"
            >
              {t("staff.addDoctor")}
            </button>
            <button
              className="staff-page-btn-primary"
              onClick={() => setInviteModalOpen(true)}
              type="button"
            >
              {t("staff.inviteEmployee")}
            </button>
          </div>
        )}
      </div>

      {invitations.length > 0 && (
        <section className="staff-page-section">
          <h2>
            {t("staff.pendingInvitations")}
            <span className="staff-page-count">{invitations.length}</span>
          </h2>
          <div className="staff-page-list">
            {invitations.map((inv) => (
              <InvitationRow
                key={inv.invitationId || inv._id || inv.id}
                invitation={inv}
                onRevoke={canInvite ? handleRevokeInvitation : null}
                isLoading={actionLoading[inv.invitationId || inv._id || inv.id]}
                t={t}
                formatDate={formatDate}
              />
            ))}
          </div>
        </section>
      )}

      <section className="staff-page-section">
        <h2>
          {t("staff.teamMembers")}
          <span className="staff-page-count">{staff.length}</span>
        </h2>
        {staff.length === 0 ? (
          <div className="staff-page-empty">
            <p>{t("staff.noTeamMembers")}</p>
            {canInvite && (
              <button
                className="staff-page-btn-primary"
                onClick={() => setInviteModalOpen(true)}
                type="button"
              >
                {t("staff.inviteFirstMember")}
              </button>
            )}
          </div>
        ) : (
          <div className="staff-page-list">
            {staff.map((m) => (
              <StaffRow
                key={m.membershipId || m._id || m.id}
                membership={m}
                canManageRole={canManageRoles && m.role !== "owner"}
                canRemove={canRemove && m.role !== "owner"}
                onChangeRole={handleChangeRole}
                onRemove={handleRemoveStaff}
                isLoading={actionLoading[m.membershipId || m._id || m.id]}
                staffDisplayName={staffDisplayName}
                t={t}
              />
            ))}
          </div>
        )}
      </section>

      {inviteModalOpen && (
        <InviteEmployeeModal
          onClose={() => setInviteModalOpen(false)}
          onSuccess={handleInviteSuccess}
        />
      )}
      {addDoctorModalOpen && (
        <AddDoctorModal
          onClose={() => setAddDoctorModalOpen(false)}
          onSuccess={handleAddDoctorSuccess}
        />
      )}
    </div>
  );
}

// ─── Sub-components ───

function StaffRow({
  membership,
  canManageRole,
  canRemove,
  onChangeRole,
  onRemove,
  isLoading,
  staffDisplayName,
  t,
}) {
  const name = staffDisplayName(membership);
  const initial = (name[0] || "?").toUpperCase();
  const [editingRole, setEditingRole] = useState(false);

  return (
    <div className={`staff-row ${isLoading ? "is-loading" : ""}`}>
      <div className="staff-row-avatar">{initial}</div>
      <div className="staff-row-info">
        <div className="staff-row-name">{name}</div>
        <div className="staff-row-email">{membership.email || ""}</div>
      </div>
      <div className="staff-row-role">
        {editingRole && canManageRole ? (
          <select
            value={membership.role}
            onChange={(e) => {
              onChangeRole(membership, e.target.value);
              setEditingRole(false);
            }}
            onBlur={() => setEditingRole(false)}
            autoFocus
            disabled={isLoading}
          >
            {CHANGEABLE_ROLES.map((r) => (
              <option key={r} value={r}>
                {t(`roles.${r}`, { defaultValue: r })}
              </option>
            ))}
          </select>
        ) : (
          <button
            className={`staff-row-role-badge role-${membership.role} ${
              canManageRole ? "is-clickable" : ""
            }`}
            onClick={canManageRole ? () => setEditingRole(true) : undefined}
            disabled={!canManageRole || isLoading}
            type="button"
          >
            {t(`roles.${membership.role}`, { defaultValue: membership.role })}
            {canManageRole && <span className="staff-row-role-edit"> ✎</span>}
          </button>
        )}
      </div>
      <div className="staff-row-actions">
        {canRemove && (
          <button
            className="staff-row-btn-remove"
            onClick={() => onRemove(membership)}
            disabled={isLoading}
            type="button"
          >
            {t("staff.remove")}
          </button>
        )}
      </div>
    </div>
  );
}

function InvitationRow({ invitation, onRevoke, isLoading, t, formatDate }) {
  const roleLabel = t(`roles.${invitation.role}`, {
    defaultValue: invitation.role,
  });
  return (
    <div
      className={`staff-row staff-row-invitation ${isLoading ? "is-loading" : ""}`}
    >
      <div className="staff-row-avatar staff-row-avatar-pending">✉</div>
      <div className="staff-row-info">
        <div className="staff-row-name">{invitation.email}</div>
        <div className="staff-row-email">
          {t("staff.invitedAsRoleExpires", {
            role: roleLabel,
            date: formatDate(invitation.expiresAt),
          })}
        </div>
      </div>
      <div className="staff-row-role">
        <span className="staff-row-pending-badge">{t("staff.pending")}</span>
      </div>
      <div className="staff-row-actions">
        {onRevoke && (
          <button
            className="staff-row-btn-remove"
            onClick={() =>
              onRevoke(
                invitation.invitationId || invitation._id || invitation.id,
              )
            }
            disabled={isLoading}
            type="button"
          >
            {t("staff.revoke")}
          </button>
        )}
      </div>
    </div>
  );
}
