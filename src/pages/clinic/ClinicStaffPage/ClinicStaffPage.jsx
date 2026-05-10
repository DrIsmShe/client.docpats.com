// client/src/pages/clinic/ClinicStaffPage/ClinicStaffPage.jsx
//
// Staff management page for clinic owner/admin.
// Lists current team and pending invitations,
// allows inviting new employees and adding existing DocPats doctors.

import React, { useEffect, useState, useCallback } from "react";
import { Link, useOutletContext, useNavigate } from "react-router-dom";
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

const ROLE_LABELS = {
  owner: "Owner",
  admin: "Admin",
  manager: "Manager",
  doctor: "Doctor",
  receptionist: "Receptionist",
  nurse: "Nurse",
  accountant: "Accountant",
  pharmacist: "Pharmacist",
  marketer: "Marketer",
};

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
      setError(err.message || "Failed to load");
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function handleRevokeInvitation(invitationId) {
    if (
      !window.confirm(
        "Revoke this invitation? The recipient won't be able to use it.",
      )
    ) {
      return;
    }
    setActionLoading((p) => ({ ...p, [invitationId]: true }));
    try {
      await revokeInvitation(invitationId);
      await loadAll();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to revoke invitation");
    } finally {
      setActionLoading((p) => ({ ...p, [invitationId]: false }));
    }
  }

  async function handleRemoveStaff(membership) {
    const name = staffDisplayName(membership);
    if (
      !window.confirm(`Remove ${name} from the clinic? This cannot be undone.`)
    ) {
      return;
    }
    const id = membership.membershipId || membership._id;
    setActionLoading((p) => ({ ...p, [id]: true }));
    try {
      await removeStaff(id);
      await loadAll();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to remove member");
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
      alert(err.response?.data?.error || "Failed to change role");
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
        <h2>Couldn't load team</h2>
        <p>{error}</p>
        <button onClick={loadAll}>Retry</button>
      </div>
    );
  }

  return (
    <div className="staff-page">
      {/* Header */}
      <div className="staff-page-header">
        <div className="staff-page-header-left">
          <Link to="/clinic/dashboard" className="staff-page-back">
            ← Dashboard
          </Link>
          <h1>Team</h1>
          <p className="staff-page-subtitle">
            Manage your clinic's team members and invitations
          </p>
        </div>
        {canInvite && (
          <div className="staff-page-header-actions">
            <button
              className="staff-page-btn-secondary"
              onClick={() => setAddDoctorModalOpen(true)}
            >
              + Add doctor
            </button>
            <button
              className="staff-page-btn-primary"
              onClick={() => setInviteModalOpen(true)}
            >
              + Invite employee
            </button>
          </div>
        )}
      </div>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <section className="staff-page-section">
          <h2>
            Pending invitations
            <span className="staff-page-count">{invitations.length}</span>
          </h2>
          <div className="staff-page-list">
            {invitations.map((inv) => (
              <InvitationRow
                key={inv.invitationId || inv._id || inv.id}
                invitation={inv}
                onRevoke={canInvite ? handleRevokeInvitation : null}
                isLoading={actionLoading[inv.invitationId || inv._id || inv.id]}
              />
            ))}
          </div>
        </section>
      )}

      {/* Team members */}
      <section className="staff-page-section">
        <h2>
          Team members
          <span className="staff-page-count">{staff.length}</span>
        </h2>
        {staff.length === 0 ? (
          <div className="staff-page-empty">
            <p>No team members yet.</p>
            {canInvite && (
              <button
                className="staff-page-btn-primary"
                onClick={() => setInviteModalOpen(true)}
              >
                Invite your first team member
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
              />
            ))}
          </div>
        )}
      </section>

      {/* Modals */}
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

function staffDisplayName(m) {
  return (
    [m.firstName, m.lastName].filter(Boolean).join(" ") ||
    m.email ||
    m.username ||
    "Unnamed"
  );
}

function StaffRow({
  membership,
  canManageRole,
  canRemove,
  onChangeRole,
  onRemove,
  isLoading,
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
                {ROLE_LABELS[r]}
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
          >
            {ROLE_LABELS[membership.role] || membership.role}
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
            title="Remove from clinic"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

function InvitationRow({ invitation, onRevoke, isLoading }) {
  const expiresAt = invitation.expiresAt
    ? new Date(invitation.expiresAt).toLocaleDateString()
    : "—";

  return (
    <div
      className={`staff-row staff-row-invitation ${isLoading ? "is-loading" : ""}`}
    >
      <div className="staff-row-avatar staff-row-avatar-pending">✉</div>
      <div className="staff-row-info">
        <div className="staff-row-name">{invitation.email}</div>
        <div className="staff-row-email">
          Invited as{" "}
          <strong>{ROLE_LABELS[invitation.role] || invitation.role}</strong> ·
          expires {expiresAt}
        </div>
      </div>
      <div className="staff-row-role">
        <span className="staff-row-pending-badge">Pending</span>
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
          >
            Revoke
          </button>
        )}
      </div>
    </div>
  );
}
