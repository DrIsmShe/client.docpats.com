// client/src/pages/clinic/ClinicLeadsPage/ClinicLeadsPage.jsx
//
// Mounted in BOTH clinic zones:
//   /clinic/leads            -> owner zone    (owner/admin, lead RW)
//   /clinic/employee/leads   -> employee zone (manager, lead RW)
//
// Manager inbox for contact requests left on the public vitrina.
// clinicId is NOT sent — backend scopes by tenant context.

import React, { useEffect, useState, useCallback } from "react";
import { Link, useOutletContext, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useClinicZone } from "../../../lib/useClinicZone";
import { listLeads, updateLeadStatus } from "../../../api/clinic";
import "./clinicLeadsPage.css";

const STATUS_TABS = [
  { key: "new", labelKey: "leads.tabs.new" },
  { key: "in_progress", labelKey: "leads.tabs.in_progress" },
  { key: "closed", labelKey: "leads.tabs.closed" },
  { key: "all", labelKey: "leads.tabs.all" },
];

// Ключи перевода, а не готовые подписи: словарь вычисляется один раз при
// загрузке модуля, и русский текст в нём остался бы русским на любом языке.
const STATUS_KEY = {
  new: "leads.status.new",
  in_progress: "leads.status.inProgress",
  closed: "leads.status.closed",
};

const TYPE_KEY = {
  callback: "leads.type.callback",
  message: "leads.type.message",
  booking: "leads.type.booking",
};

/** Желаемое время заявки на запись — в часовом поясе смотрящего. */
function formatDesired(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "";
  }
}

function extractLeads(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  return data.leads || data.items || [];
}

export default function ClinicLeadsPage() {
  const { t } = useTranslation("clinic");
  const layoutContext = useOutletContext();
  const navigate = useNavigate();
  const { dashboardPath, loginPath } = useClinicZone();

  const [statusTab, setStatusTab] = useState("new");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leads, setLeads] = useState([]);
  const [actionLoading, setActionLoading] = useState({});

  const myRole = layoutContext?.role || "member";
  const perms = layoutContext?.permissions || {};
  const isOwner = myRole === "owner";
  const canWrite = isOwner || !!perms?.lead?.write;

  const load = useCallback(
    async (tab) => {
      try {
        setError(null);
        setLoading(true);
        const opts = tab && tab !== "all" ? { status: tab } : {};
        const res = await listLeads(opts);
        setLeads(extractLeads(res));
        setLoading(false);
      } catch (err) {
        console.error("Failed to load leads:", err);
        if (err.response?.status === 401) {
          navigate(loginPath, { replace: true });
          return;
        }
        setError(err.response?.data?.error || err.message || "Failed to load leads");
        setLoading(false);
      }
    },
    [navigate, loginPath],
  );

  useEffect(() => {
    load(statusTab);
  }, [statusTab, load]);

  async function changeStatus(lead, newStatus) {
    const id = lead._id || lead.id;
    if (!id) return;
    setActionLoading((p) => ({ ...p, [id]: true }));
    try {
      await updateLeadStatus(id, { status: newStatus });
      await load(statusTab);
    } catch (err) {
      alert(
        err.response?.data?.error ||
          t("leads.updateFailed", {
            defaultValue: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0431\u043D\u043E\u0432\u0438\u0442\u044C \u0441\u0442\u0430\u0442\u0443\u0441",
          }),
      );
    } finally {
      setActionLoading((p) => ({ ...p, [id]: false }));
    }
  }

  function formatDate(d) {
    if (!d) return "";
    try {
      return new Date(d).toLocaleString();
    } catch {
      return "";
    }
  }

  return (
    <div className="lead-page">
      <div className="lead-page-header">
        <Link to={dashboardPath} className="lead-page-back">
          {t("leads.back", { defaultValue: "\u2190 \u0414\u0430\u0448\u0431\u043E\u0440\u0434" })}
        </Link>
        <h1>{t("leads.title", { defaultValue: "\u041E\u0431\u0440\u0430\u0449\u0435\u043D\u0438\u044F" })}</h1>
        <p className="lead-page-subtitle">
          {t("leads.subtitle", { defaultValue: "\u0417\u0430\u044F\u0432\u043A\u0438 \u0441 \u0441\u0430\u0439\u0442\u0430 \u043A\u043B\u0438\u043D\u0438\u043A\u0438" })}
        </p>
      </div>

      <div className="lead-tabs">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={"lead-tab " + (statusTab === tab.key ? "is-active" : "")}
            onClick={() => setStatusTab(tab.key)}
            disabled={loading}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {error ? (
        <div className="lead-error">
          <p>{error}</p>
          <button onClick={() => load(statusTab)} type="button">
            {t("common.retry", { defaultValue: "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C" })}
          </button>
        </div>
      ) : loading ? (
        <div className="lead-loading">
          <div className="lead-spinner" />
        </div>
      ) : leads.length === 0 ? (
        <div className="lead-empty">
          {t("leads.empty", { defaultValue: "\u041E\u0431\u0440\u0430\u0449\u0435\u043D\u0438\u0439 \u043D\u0435\u0442" })}
        </div>
      ) : (
        <div className="lead-list">
          {leads.map((lead) => {
            const id = lead._id || lead.id;
            const busy = !!actionLoading[id];
            return (
              <div key={id} className={"lead-card status-" + lead.status}>
                <div className="lead-card-top">
                  <span className="lead-name">{lead.name}</span>
                  <span className={"lead-badge badge-" + lead.status}>
                    {t(STATUS_KEY[lead.status] || "leads.status.new") || lead.status}
                  </span>
                </div>

                <div className="lead-card-row">
                  <a className="lead-phone" href={"tel:" + (lead.phone || "")} dir="ltr">
                    {lead.phone}
                  </a>
                  <span className="lead-type">
                    {t(TYPE_KEY[lead.type] || "leads.type.message") || lead.type}
                  </span>
                </div>

                {/* Пожелание по записи. Показываем врача и время прямо в
                    карточке: без них «заявка на запись» ничем не отличается от
                    обычного обращения, и менеджеру пришлось бы перезванивать
                    только чтобы выяснить, к кому просились. */}
                {lead.type === "booking" && (
                  <div className="lead-booking">
                    {lead.desiredDoctorName ? (
                      <span className="lead-booking-doctor">
                        {lead.desiredDoctorName}
                      </span>
                    ) : null}
                    {lead.desiredStartUTC ? (
                      <span className="lead-booking-time">
                        {formatDesired(lead.desiredStartUTC)}
                      </span>
                    ) : null}
                    <span className="lead-booking-hint">
                      время не забронировано — подтвердите
                    </span>
                  </div>
                )}

                {lead.message ? (
                  <p className="lead-message">{lead.message}</p>
                ) : null}

                <div className="lead-card-meta">{formatDate(lead.createdAt)}</div>

                {canWrite && (
                  <div className="lead-actions">
                    {lead.status !== "in_progress" && (
                      <button
                        type="button"
                        className="lead-btn lead-btn-progress"
                        onClick={() => changeStatus(lead, "in_progress")}
                        disabled={busy}
                      >
                        {t("leads.toInProgress", { defaultValue: "\u0412 \u0440\u0430\u0431\u043E\u0442\u0443" })}
                      </button>
                    )}
                    {lead.status !== "closed" && (
                      <button
                        type="button"
                        className="lead-btn lead-btn-close"
                        onClick={() => changeStatus(lead, "closed")}
                        disabled={busy}
                      >
                        {t("leads.toClosed", { defaultValue: "\u0417\u0430\u043A\u0440\u044B\u0442\u044C" })}
                      </button>
                    )}
                    {lead.status !== "new" && (
                      <button
                        type="button"
                        className="lead-btn lead-btn-reopen"
                        onClick={() => changeStatus(lead, "new")}
                        disabled={busy}
                      >
                        {t("leads.toNew", { defaultValue: "\u0412\u0435\u0440\u043D\u0443\u0442\u044C \u0432 \u043D\u043E\u0432\u044B\u0435" })}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}