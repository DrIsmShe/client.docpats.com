// client/src/pages/clinic/ClinicDashboardPage/ClinicDashboardPage.jsx
//
// Main authenticated dashboard for clinic owners/admins.
// Shows stats, team preview, pending invitations, and quick actions.

import React, { useEffect, useState } from "react";
import { useNavigate, Link, useOutletContext } from "react-router-dom";
import { getClinicMe, listStaff, listInvitations } from "../../../api/clinic";
import "./clinicDashboardPage.css";

// Helpers
const getMembershipId = (m) => m?.membershipId || m?._id || m?.id || null;
const getInvitationId = (inv) =>
  inv?.invitationId || inv?._id || inv?.id || null;

export default function ClinicDashboardPage() {
  const navigate = useNavigate();
  const layoutContext = useOutletContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [clinic, setClinic] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [features, setFeatures] = useState({});
  const [staff, setStaff] = useState([]);
  const [invitations, setInvitations] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Parallel fetches to prevent race conditions
        const [meRes, staffRes, invitationsRes] = await Promise.all([
          getClinicMe(),
          listStaff().catch((err) => {
            console.warn("Failed to load staff:", err);
            return { items: [] };
          }),
          listInvitations("pending").catch((err) => {
            console.warn("Failed to load invitations:", err);
            return { items: [] };
          }),
        ]);

        if (cancelled) return;

        // If no clinic — redirect to hub
        if (!meRes.hasClinic) {
          navigate("/clinic", { replace: true });
          return;
        }

        setClinic(meRes.clinic || null);
        setPermissions(meRes.permissions || {});
        setFeatures(meRes.features || {});
        setStaff(staffRes.items || []);
        setInvitations(invitationsRes.items || []);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error("Dashboard load failed:", err);
        setError(err.message || "Failed to load dashboard");
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="clinic-dashboard-loading">
        <div className="clinic-dashboard-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="clinic-dashboard-error">
        <h2>Couldn't load your dashboard</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  const tier = clinic?.tier || "starter";
  const myRole = layoutContext?.role || "member";
  const canInvite =
    !!permissions.canInviteStaff || myRole === "owner" || myRole === "admin";

  return (
    <div className="clinic-dashboard">
      {/* Header */}
      <header className="clinic-dashboard-header">
        <div>
          <h1 className="clinic-dashboard-title">{clinic.name}</h1>
          <div className="clinic-dashboard-meta">
            <span className={`clinic-dashboard-tier-badge tier-${tier}`}>
              {tier}
            </span>
            {clinic.slug && (
              <span className="clinic-dashboard-slug">/{clinic.slug}</span>
            )}
            <span className="clinic-dashboard-role">
              Your role: <strong>{myRole}</strong>
            </span>
          </div>
        </div>
      </header>

      {/* Stats */}
      <section className="clinic-dashboard-stats">
        <StatCard
          icon="👥"
          label="Team members"
          value={staff.length}
          link="/clinic/staff"
        />
        <StatCard
          icon="✉️"
          label="Pending invitations"
          value={invitations.length}
          link={canInvite ? "/clinic/staff" : null}
        />
        <StatCard icon="📅" label="Subscription" value={tier} isText />
      </section>

      {/* Quick actions */}
      <section className="clinic-dashboard-section">
        <h2>Quick actions</h2>
        <div className="clinic-dashboard-actions">
          {canInvite && (
            <Link to="/clinic/staff" className="clinic-dashboard-action">
              <span className="clinic-dashboard-action-icon">✉️</span>
              <span className="clinic-dashboard-action-label">
                Invite team member
              </span>
              <span className="clinic-dashboard-action-arrow">→</span>
            </Link>
          )}
          <Link to="/clinic/staff" className="clinic-dashboard-action">
            <span className="clinic-dashboard-action-icon">👥</span>
            <span className="clinic-dashboard-action-label">View team</span>
            <span className="clinic-dashboard-action-arrow">→</span>
          </Link>
          <button
            className="clinic-dashboard-action clinic-dashboard-action-disabled"
            disabled
            title="Coming in Week 3"
          >
            <span className="clinic-dashboard-action-icon">📋</span>
            <span className="clinic-dashboard-action-label">
              Schedule (soon)
            </span>
          </button>
        </div>
      </section>

      {/* Team preview */}
      <section className="clinic-dashboard-section">
        <div className="clinic-dashboard-section-header">
          <h2>Team</h2>
          {staff.length > 5 && (
            <Link to="/clinic/staff" className="clinic-dashboard-section-link">
              View all ({staff.length}) →
            </Link>
          )}
        </div>
        {staff.length === 0 ? (
          <div className="clinic-dashboard-empty">
            <p>No team members yet.</p>
            {canInvite && (
              <Link to="/clinic/staff" className="clinic-dashboard-empty-cta">
                Invite your first team member →
              </Link>
            )}
          </div>
        ) : (
          <div className="clinic-dashboard-team-list">
            {staff.slice(0, 5).map((m) => (
              <TeamRow
                key={getMembershipId(m) || `${m.userId}-${m.role}`}
                member={m}
              />
            ))}
          </div>
        )}
      </section>

      {/* Pending invitations */}
      {invitations.length > 0 && canInvite && (
        <section className="clinic-dashboard-section">
          <div className="clinic-dashboard-section-header">
            <h2>Pending invitations</h2>
            <Link to="/clinic/staff" className="clinic-dashboard-section-link">
              Manage →
            </Link>
          </div>
          <div className="clinic-dashboard-invitations-list">
            {invitations.slice(0, 5).map((inv) => (
              <InvitationRow
                key={getInvitationId(inv) || `${inv.email}-${inv.role}`}
                invitation={inv}
              />
            ))}
          </div>
        </section>
      )}

      {/* Clinic details */}
      <section className="clinic-dashboard-section">
        <h2>Clinic details</h2>
        <div className="clinic-dashboard-details">
          <DetailRow label="Name" value={clinic.name} />
          <DetailRow label="Slug" value={clinic.slug || "—"} />
          <DetailRow label="Timezone" value={clinic.timezone || "—"} />
          <DetailRow
            label="Default currency"
            value={clinic.defaultCurrency || "—"}
          />
          <DetailRow
            label="Default language"
            value={clinic.defaultLanguage || "—"}
          />
          <DetailRow label="Tier" value={tier} />
          {clinic.contacts?.phone && (
            <DetailRow label="Phone" value={clinic.contacts.phone} />
          )}
          {clinic.contacts?.email && (
            <DetailRow label="Email" value={clinic.contacts.email} />
          )}
        </div>
      </section>
    </div>
  );
}

// ─── Sub-components ───

function StatCard({ icon, label, value, link, isText }) {
  const content = (
    <>
      <div className="clinic-dashboard-stat-icon">{icon}</div>
      <div className="clinic-dashboard-stat-body">
        <div
          className={`clinic-dashboard-stat-value ${isText ? "is-text" : ""}`}
        >
          {value}
        </div>
        <div className="clinic-dashboard-stat-label">{label}</div>
      </div>
    </>
  );

  if (link) {
    return (
      <Link
        to={link}
        className="clinic-dashboard-stat clinic-dashboard-stat-clickable"
      >
        {content}
      </Link>
    );
  }
  return <div className="clinic-dashboard-stat">{content}</div>;
}

function TeamRow({ member }) {
  // Backend may return: firstName/lastName/email decrypted, OR may return just userId.
  // Show whatever's available, gracefully degrading.
  const name =
    [member.firstName, member.lastName].filter(Boolean).join(" ") ||
    member.email ||
    member.username ||
    "Team member";

  const initial = (name[0] || "?").toUpperCase();

  return (
    <div className="clinic-dashboard-team-row">
      <div className="clinic-dashboard-team-avatar">{initial}</div>
      <div className="clinic-dashboard-team-info">
        <div className="clinic-dashboard-team-name">{name}</div>
        {member.email && (
          <div className="clinic-dashboard-team-email">{member.email}</div>
        )}
      </div>
      <div className="clinic-dashboard-team-role">
        <span className={`clinic-dashboard-role-badge role-${member.role}`}>
          {member.role}
        </span>
      </div>
    </div>
  );
}

function InvitationRow({ invitation }) {
  const formatDate = (d) => {
    if (!d) return "";
    try {
      return new Date(d).toLocaleDateString();
    } catch {
      return "";
    }
  };

  return (
    <div className="clinic-dashboard-invitation-row">
      <div className="clinic-dashboard-invitation-info">
        <div className="clinic-dashboard-invitation-email">
          {invitation.email}
        </div>
        <div className="clinic-dashboard-invitation-role">
          Invited as {invitation.role} · expires{" "}
          {formatDate(invitation.expiresAt)}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="clinic-dashboard-detail-row">
      <span className="clinic-dashboard-detail-label">{label}</span>
      <span className="clinic-dashboard-detail-value">{value}</span>
    </div>
  );
}
