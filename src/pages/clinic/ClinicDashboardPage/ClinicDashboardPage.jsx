// client/src/pages/clinic/ClinicDashboardPage/ClinicDashboardPage.jsx
//
// PERMISSION-GATED DASHBOARD.
//   Every stat card and quick-action is shown only when the current
//   member has READ permission on the underlying resource. Permissions
//   come from getClinicMe() (meRes.permissions) — the same ROLE_PERMISSIONS
//   the backend enforces — so the dashboard never offers a tile that would
//   403 on click.
//
//   Resource keys (server RESOURCES): staff, department, room, equipment,
//   knowledge, consilium, telemed, patient, clinic. "services" has no own
//   resource → tied to `clinic`. Invitations use canInvite (staff_invite).
//
//   owner/admin have full permissions → they see everything as before.
//   nurse/receptionist see only their slice (e.g. patients + read-only
//   org structure), NOT the management tiles (team, services, invites).

import React, { useEffect, useState } from "react";
import { useNavigate, Link, useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  getClinicMe,
  listStaff,
  listInvitations,
  listDepartments,
  listRooms,
  listEquipment,
  listKnowledge,
  listConsilia,
  listTelemed,
  listServices,
} from "../../../api/clinic";
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
  const [departments, setDepartments] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [knowledge, setKnowledge] = useState([]);
  const [consilia, setConsilia] = useState([]);
  const [telemed, setTelemed] = useState([]);
  const [services, setServices] = useState([]);
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [
          meRes,
          staffRes,
          invitationsRes,
          departmentsRes,
          roomsRes,
          equipmentRes,
          knowledgeRes,
          consiliaRes,
          telemedRes,
          servicesRes,
        ] = await Promise.all([
          getClinicMe(),
          listStaff().catch((err) => {
            console.warn("Failed to load staff:", err);
            return { items: [] };
          }),
          listInvitations("pending").catch((err) => {
            console.warn("Failed to load invitations:", err);
            return { items: [] };
          }),
          listDepartments({ status: "active" }).catch((err) => {
            console.warn("Failed to load departments:", err);
            return { items: [] };
          }),
          listRooms({ status: "active" }).catch((err) => {
            console.warn("Failed to load rooms:", err);
            return { items: [] };
          }),
          listEquipment({}).catch((err) => {
            console.warn("Failed to load equipment:", err);
            return { items: [] };
          }),
          listKnowledge({}).catch((err) => {
            console.warn("Failed to load knowledge:", err);
            return { items: [] };
          }),
          listConsilia({ status: "open" }).catch((err) => {
            console.warn("Failed to load consilia:", err);
            return { items: [] };
          }),
          listTelemed({}).catch((err) => {
            console.warn("Failed to load telemed:", err);
            return { items: [] };
          }),
          listServices().catch((err) => {
            console.warn("Failed to load services:", err);
            return [];
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
        setDepartments(departmentsRes.items || []);
        setRooms(roomsRes.items || []);
        setEquipment(
          (equipmentRes.items || []).filter((e) => e.status !== "archived"),
        );
        setKnowledge(
          (knowledgeRes.items || []).filter((a) => a.status !== "archived"),
        );
        setConsilia(consiliaRes.items || []);
        setTelemed(
          (telemedRes.items || []).filter(
            (x) => x.status === "scheduled" || x.status === "live",
          ),
        );
        setServices(
          (Array.isArray(servicesRes) ? servicesRes : []).filter(
            (s) => s.status !== "archived",
          ),
        );
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // ─── Permission helper ───
  // READ access on a resource. owner/admin have full ROLE_PERMISSIONS so
  // this is true for them across the board; nurse/receptionist only get
  // their allowed slice. Unknown/missing resource → false (hidden).
  const canRead = (resource) => !!permissions?.[resource]?.read;

  const canInvite =
    !!permissions?.staff_invite?.write ||
    !!permissions.canInviteStaff ||
    myRole === "owner" ||
    myRole === "admin";

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
        {canRead("staff") && (
          <StatCard
            icon="👥"
            label={t("dashboard.stats.teamMembers")}
            value={staff.length}
            link="/clinic/staff"
          />
        )}
        {canRead("department") && (
          <StatCard
            icon="🏥"
            label={t("dashboard.stats.departments", {
              defaultValue: "Отделения",
            })}
            value={departments.length}
            link="/clinic/departments"
          />
        )}
        {canRead("room") && (
          <StatCard
            icon="🚪"
            label={t("dashboard.stats.rooms", {
              defaultValue: "Кабинеты",
            })}
            value={rooms.length}
            link="/clinic/rooms"
          />
        )}
        {canRead("equipment") && (
          <StatCard
            icon="🩻"
            label={t("dashboard.stats.equipment", {
              defaultValue: "Оборудование",
            })}
            value={equipment.length}
            link="/clinic/equipment"
          />
        )}
        {canRead("knowledge") && (
          <StatCard
            icon="📚"
            label={t("dashboard.stats.knowledge", {
              defaultValue: "База знаний",
            })}
            value={knowledge.length}
            link="/clinic/knowledge"
          />
        )}
        {canRead("consilium") && (
          <StatCard
            icon="🧑‍⚕️"
            label={t("dashboard.stats.consilia", {
              defaultValue: "Консилиумы",
            })}
            value={consilia.length}
            link="/clinic/consilia"
          />
        )}
        {canRead("telemed") && (
          <StatCard
            icon="📹"
            label={t("dashboard.stats.telemed", {
              defaultValue: "Телемедицина",
            })}
            value={telemed.length}
            link="/clinic/telemed"
          />
        )}
        {canRead("clinic") && (
          <StatCard
            icon="💲"
            label={t("dashboard.stats.services", {
              defaultValue: "Услуги",
            })}
            value={services.length}
            link="/clinic/services"
          />
        )}
        {canInvite && (
          <StatCard
            icon="✉️"
            label={t("dashboard.stats.pendingInvitations")}
            value={invitations.length}
            link="/clinic/staff"
          />
        )}
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
          {/* Реквизиты — рядом с публичной страницей: и то и другое
              «лицо» клиники, только одно для посетителя, другое для
              бланков. Права те же, что у настроек клиники. */}
          {canRead("clinic") && (
            <Link to="/clinic/requisites" className="clinic-dashboard-action">
              <span className="clinic-dashboard-action-icon">📄</span>
              <span className="clinic-dashboard-action-label">
                {t("dashboard.actions.requisites", {
                  defaultValue: "Реквизиты клиники",
                })}
              </span>
              <span className="clinic-dashboard-action-arrow">→</span>
            </Link>
          )}
          {canRead("clinic") && (
            <Link to="/clinic/public-page" className="clinic-dashboard-action">
              <span className="clinic-dashboard-action-icon">🌐</span>
              <span className="clinic-dashboard-action-label">
                {t("dashboard.actions.publicPage", {
                  defaultValue: "Публичная страница",
                })}
              </span>
              <span className="clinic-dashboard-action-arrow">→</span>
            </Link>
          )}
          {/* Уведомления доступны всем, кто вообще попал в кабинет: это не
              данные клиники, а сообщения лично этому пользователю. Гейта по
              правам здесь нет намеренно. */}
          <Link to="/clinic/notifications" className="clinic-dashboard-action">
            <span className="clinic-dashboard-action-icon">🔔</span>
            <span className="clinic-dashboard-action-label">
              {t("dashboard.actions.notifications", {
                defaultValue: "Уведомления",
              })}
            </span>
            <span className="clinic-dashboard-action-arrow">→</span>
          </Link>
          {canRead("analytics") && (
            <Link to="/clinic/analytics" className="clinic-dashboard-action">
              <span className="clinic-dashboard-action-icon">📈</span>
              <span className="clinic-dashboard-action-label">
                {t("dashboard.actions.analytics", {
                  defaultValue: "Аналитика",
                })}
              </span>
              <span className="clinic-dashboard-action-arrow">→</span>
            </Link>
          )}
          {canRead("schedule") && (
            <Link to="/clinic/schedule" className="clinic-dashboard-action">
              <span className="clinic-dashboard-action-icon">📅</span>
              <span className="clinic-dashboard-action-label">
                {t("dashboard.actions.schedule", {
                  defaultValue: "Расписание",
                })}
              </span>
              <span className="clinic-dashboard-action-arrow">→</span>
            </Link>
          )}
          {canRead("pharmacy") && (
            <Link to="/clinic/pharmacy" className="clinic-dashboard-action">
              <span className="clinic-dashboard-action-icon">💊</span>
              <span className="clinic-dashboard-action-label">
                {t("dashboard.actions.pharmacy", { defaultValue: "Аптека" })}
              </span>
              <span className="clinic-dashboard-action-arrow">→</span>
            </Link>
          )}
          {canRead("review") && (
            <Link to="/clinic/reviews" className="clinic-dashboard-action">
              <span className="clinic-dashboard-action-icon">⭐</span>
              <span className="clinic-dashboard-action-label">
                {t("dashboard.actions.reviews", { defaultValue: "Отзывы" })}
              </span>
              <span className="clinic-dashboard-action-arrow">→</span>
            </Link>
          )}
          {/* Заявки с витрины. В зоне владельца входа на эту страницу не было
              вовсе — она жила только плиткой на дашборде сотрудника. Владелец
              и управляющий получают уведомление о новой заявке, но дойти до
              списка сами не могли. Ресурс тот же, что у плитки сотрудника. */}
          {canRead("lead") && (
            <Link to="/clinic/leads" className="clinic-dashboard-action">
              <span className="clinic-dashboard-action-icon">📥</span>
              <span className="clinic-dashboard-action-label">
                {t("dashboard.actions.leads", {
                  defaultValue: "Заявки с сайта",
                })}
              </span>
              <span className="clinic-dashboard-action-arrow">→</span>
            </Link>
          )}
          {canRead("staff") && (
            <Link to="/clinic/staff" className="clinic-dashboard-action">
              <span className="clinic-dashboard-action-icon">👥</span>
              <span className="clinic-dashboard-action-label">
                {t("dashboard.actions.viewTeam")}
              </span>
              <span className="clinic-dashboard-action-arrow">→</span>
            </Link>
          )}
          {canRead("patient") && (
            <Link to="/clinic/patients" className="clinic-dashboard-action">
              <span className="clinic-dashboard-action-icon">🩺</span>
              <span className="clinic-dashboard-action-label">
                {t("dashboard.actions.viewPatients")}
              </span>
              <span className="clinic-dashboard-action-arrow">→</span>
            </Link>
          )}
          {canRead("department") && (
            <Link to="/clinic/departments" className="clinic-dashboard-action">
              <span className="clinic-dashboard-action-icon">🏥</span>
              <span className="clinic-dashboard-action-label">
                {t("dashboard.actions.viewDepartments", {
                  defaultValue: "Отделения",
                })}
              </span>
              <span className="clinic-dashboard-action-arrow">→</span>
            </Link>
          )}
          {canRead("room") && (
            <Link to="/clinic/rooms" className="clinic-dashboard-action">
              <span className="clinic-dashboard-action-icon">🚪</span>
              <span className="clinic-dashboard-action-label">
                {t("dashboard.actions.viewRooms", {
                  defaultValue: "Кабинеты",
                })}
              </span>
              <span className="clinic-dashboard-action-arrow">→</span>
            </Link>
          )}
          {canRead("equipment") && (
            <Link to="/clinic/equipment" className="clinic-dashboard-action">
              <span className="clinic-dashboard-action-icon">🩻</span>
              <span className="clinic-dashboard-action-label">
                {t("dashboard.actions.viewEquipment", {
                  defaultValue: "Оборудование",
                })}
              </span>
              <span className="clinic-dashboard-action-arrow">→</span>
            </Link>
          )}
          {canRead("knowledge") && (
            <Link to="/clinic/knowledge" className="clinic-dashboard-action">
              <span className="clinic-dashboard-action-icon">📚</span>
              <span className="clinic-dashboard-action-label">
                {t("dashboard.actions.viewKnowledge", {
                  defaultValue: "База знаний",
                })}
              </span>
              <span className="clinic-dashboard-action-arrow">→</span>
            </Link>
          )}
          {/* Заготовки формулировок для протоколов исследований. Право своё
              (examination_template), а не от базы знаний: медсестра шаблоны
              читает, но не правит. */}
          {canRead("examination_template") && (
            <Link to="/clinic/exam-templates" className="clinic-dashboard-action">
              <span className="clinic-dashboard-action-icon">🧾</span>
              <span className="clinic-dashboard-action-label">
                {t("dashboard.actions.viewExamTemplates", {
                  defaultValue: "Шаблоны протоколов",
                })}
              </span>
              <span className="clinic-dashboard-action-arrow">→</span>
            </Link>
          )}
          {canRead("knowledge") && (
            <Link
              to="/clinic/announcements"
              className="clinic-dashboard-action"
            >
              {t("dashboard.actions.viewAnnouncements", {
                defaultValue: "Объявления",
              })}
            </Link>
          )}
          {canRead("consilium") && (
            <Link to="/clinic/consilia" className="clinic-dashboard-action">
              <span className="clinic-dashboard-action-icon">🧑‍⚕️</span>
              <span className="clinic-dashboard-action-label">
                {t("dashboard.actions.viewConsilia", {
                  defaultValue: "Консилиумы",
                })}
              </span>
              <span className="clinic-dashboard-action-arrow">→</span>
            </Link>
          )}
          {canRead("telemed") && (
            <Link to="/clinic/telemed" className="clinic-dashboard-action">
              <span className="clinic-dashboard-action-icon">📹</span>
              <span className="clinic-dashboard-action-label">
                {t("dashboard.actions.viewTelemed", {
                  defaultValue: "Телемедицина",
                })}
              </span>
              <span className="clinic-dashboard-action-arrow">→</span>
            </Link>
          )}
          {canRead("clinic") && (
            <Link to="/clinic/services" className="clinic-dashboard-action">
              <span className="clinic-dashboard-action-icon">💲</span>
              <span className="clinic-dashboard-action-label">
                {t("dashboard.actions.viewServices", {
                  defaultValue: "Услуги и прайс",
                })}
              </span>
              <span className="clinic-dashboard-action-arrow">→</span>
            </Link>
          )}
        </div>
      </section>

      {/* Team section — only for members who can read staff */}
      {canRead("staff") && (
        <section className="clinic-dashboard-section">
          <div className="clinic-dashboard-section-header">
            <h2>{t("dashboard.team")}</h2>
            {staff.length > 5 && (
              <Link
                to="/clinic/staff"
                className="clinic-dashboard-section-link"
              >
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
      )}

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

      {/* Clinic details — only for members who can read clinic settings */}
      {canRead("clinic") && (
        <section className="clinic-dashboard-section">
          <h2>{t("dashboard.clinicDetails")}</h2>
          <div className="clinic-dashboard-details">
            <DetailRow
              label={t("dashboard.details.name")}
              value={clinic.name}
            />
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
      )}
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
