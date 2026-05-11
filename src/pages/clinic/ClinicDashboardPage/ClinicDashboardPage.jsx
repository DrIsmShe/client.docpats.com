// client/src/pages/clinic/ClinicDashboardPage/ClinicDashboardPage.jsx

import React, { useEffect, useState } from "react";
import { useNavigate, Link, useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getClinicMe, listStaff, listInvitations } from "../../../api/clinic";
import "./clinicDashboardPage.css";

const getMembershipId = (m) => m?.membershipId || m?._id || m?.id || null;
const getInvitationId = (inv) =>
  inv?.invitationId || inv?._id || inv?.id || null;

export default function ClinicDashboardPage() {
  const { t, i18n } = useTranslation("clinic");
  const navigate = useNavigate();
  const layoutContext = useOutletContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [clinic, setClinic] = useState(null);
  const [permissions, setPermissions] = useState({});
  // eslint-disable-next-line no-unused-vars
  const [features, setFeatures] = useState({});
  const [staff, setStaff] = useState([]);
  const [invitations, setInvitations] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
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
        setError(err.message || t("common.error"));
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
        <h2>{t("dashboard.errorTitle")}</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          {t("common.errorReload")}
        </button>
      </div>
    );
  }

  const tier = clinic?.tier || "starter";
  const myRole = layoutContext?.role || "member";
  const canInvite =
    !!permissions.canInviteStaff || myRole === "owner" || myRole === "admin";

  const formatDate = (d) => {
    if (!d) return "";
    try {
      return new Date(d).toLocaleDateString(i18n.language || undefined);
    } catch {
      return "";
    }
  };

  return (
    <div className="clinic-dashboard">
      <header className="clinic-dashboard-header">
        <div>
          <h1 className="clinic-dashboard-title">{clinic.name}</h1>
          <div className="clinic-dashboard-meta">
            <span className={`clinic-dashboard-tier-badge tier-${tier}`}>
              {t(`tiers.${tier}`, { defaultValue: tier })}
            </span>
            {clinic.slug && (
              <span className="clinic-dashboard-slug">/{clinic.slug}</span>
            )}
            <span className="clinic-dashboard-role">
              {t("dashboard.yourRole")}{" "}
              <strong>{t(`roles.${myRole}`, { defaultValue: myRole })}</strong>
            </span>
          </div>
        </div>
      </header>

      <section className="clinic-dashboard-stats">
        <StatCard
          icon="👥"
          label={t("dashboard.stats.teamMembers")}
          value={staff.length}
          link="/clinic/staff"
        />
        <StatCard
          icon="✉️"
          label={t("dashboard.stats.pendingInvitations")}
          value={invitations.length}
          link={canInvite ? "/clinic/staff" : null}
        />
        <StatCard
          icon="📅"
          label={t("dashboard.stats.subscription")}
          value={t(`tiers.${tier}`, { defaultValue: tier })}
          isText
        />
      </section>

      <section className="clinic-dashboard-section">
        <h2>{t("dashboard.quickActions")}</h2>
        <div className="clinic-dashboard-actions">
          {canInvite && (
            <Link to="/clinic/staff" className="clinic-dashboard-action">
              <span className="clinic-dashboard-action-icon">✉️</span>
              <span className="clinic-dashboard-action-label">
                {t("dashboard.actions.inviteTeamMember")}
              </span>
              <span className="clinic-dashboard-action-arrow">→</span>
            </Link>
          )}
          <Link to="/clinic/staff" className="clinic-dashboard-action">
            <span className="clinic-dashboard-action-icon">👥</span>
            <span className="clinic-dashboard-action-label">
              {t("dashboard.actions.viewTeam")}
            </span>
            <span className="clinic-dashboard-action-arrow">→</span>
          </Link>
          <button
            className="clinic-dashboard-action clinic-dashboard-action-disabled"
            disabled
          >
            <span className="clinic-dashboard-action-icon">📋</span>
            <span className="clinic-dashboard-action-label">
              {t("dashboard.actions.scheduleSoon")}
            </span>
          </button>
        </div>
      </section>

      <section className="clinic-dashboard-section">
        <div className="clinic-dashboard-section-header">
          <h2>{t("dashboard.team")}</h2>
          {staff.length > 5 && (
            <Link to="/clinic/staff" className="clinic-dashboard-section-link">
              {t("dashboard.viewAll", { count: staff.length })}
            </Link>
          )}
        </div>
        {staff.length === 0 ? (
          <div className="clinic-dashboard-empty">
            <p>{t("dashboard.noTeamMembers")}</p>
            {canInvite && (
              <Link to="/clinic/staff" className="clinic-dashboard-empty-cta">
                {t("dashboard.inviteFirstMember")}
              </Link>
            )}
          </div>
        ) : (
          <div className="clinic-dashboard-team-list">
            {staff.slice(0, 5).map((m) => (
              <TeamRow
                key={getMembershipId(m) || `${m.userId}-${m.role}`}
                member={m}
                t={t}
              />
            ))}
          </div>
        )}
      </section>

      {invitations.length > 0 && canInvite && (
        <section className="clinic-dashboard-section">
          <div className="clinic-dashboard-section-header">
            <h2>{t("dashboard.pendingInvitations")}</h2>
            <Link to="/clinic/staff" className="clinic-dashboard-section-link">
              {t("dashboard.manage")}
            </Link>
          </div>
          <div className="clinic-dashboard-invitations-list">
            {invitations.slice(0, 5).map((inv) => (
              <InvitationRow
                key={getInvitationId(inv) || `${inv.email}-${inv.role}`}
                invitation={inv}
                t={t}
                formatDate={formatDate}
              />
            ))}
          </div>
        </section>
      )}

      <section className="clinic-dashboard-section">
        <h2>{t("dashboard.clinicDetails")}</h2>
        <div className="clinic-dashboard-details">
          <DetailRow label={t("dashboard.details.name")} value={clinic.name} />
          <DetailRow
            label={t("dashboard.details.slug")}
            value={clinic.slug || "—"}
          />
          <DetailRow
            label={t("dashboard.details.timezone")}
            value={clinic.timezone || "—"}
          />
          <DetailRow
            label={t("dashboard.details.defaultCurrency")}
            value={clinic.defaultCurrency || "—"}
          />
          <DetailRow
            label={t("dashboard.details.defaultLanguage")}
            value={clinic.defaultLanguage || "—"}
          />
          <DetailRow
            label={t("dashboard.details.tier")}
            value={t(`tiers.${tier}`, { defaultValue: tier })}
          />
          {clinic.contacts?.phone && (
            <DetailRow
              label={t("dashboard.details.phone")}
              value={clinic.contacts.phone}
            />
          )}
          {clinic.contacts?.email && (
            <DetailRow
              label={t("dashboard.details.email")}
              value={clinic.contacts.email}
            />
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

function TeamRow({ member, t }) {
  const name =
    [member.firstName, member.lastName].filter(Boolean).join(" ") ||
    member.email ||
    member.username ||
    t("staff.unnamed");

  return (
    <div className="clinic-dashboard-team-row">
      <div className="clinic-dashboard-team-avatar">
        {(name[0] || "?").toUpperCase()}
      </div>
      <div className="clinic-dashboard-team-info">
        <div className="clinic-dashboard-team-name">{name}</div>
        {member.email && (
          <div className="clinic-dashboard-team-email">{member.email}</div>
        )}
      </div>
      <div className="clinic-dashboard-team-role">
        <span className={`clinic-dashboard-role-badge role-${member.role}`}>
          {t(`roles.${member.role}`, { defaultValue: member.role })}
        </span>
      </div>
    </div>
  );
}

function InvitationRow({ invitation, t, formatDate }) {
  const roleLabel = t(`roles.${invitation.role}`, {
    defaultValue: invitation.role,
  });
  return (
    <div className="clinic-dashboard-invitation-row">
      <div className="clinic-dashboard-invitation-info">
        <div className="clinic-dashboard-invitation-email">
          {invitation.email}
        </div>
        <div className="clinic-dashboard-invitation-role">
          {t("dashboard.invitedAsRoleExpires", {
            role: roleLabel,
            date: formatDate(invitation.expiresAt),
          })}
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
