// client/src/pages/clinic/ClinicPatientDetailPage/MedicalRecordsSection.jsx
//
// Patient's Unified Medical Record (UMR) section.
// Sprint 2 Phase 2D.2 — Step 4 (ALL 7 tabs live, including imaging).
//
// Tab map:
//   encounters     → EncountersTab (full CRUD with sign/amend/delete)
//   allergies      → SubRecordTab (allergies config)
//   chronic        → SubRecordTab (chronic config)
//   operations     → SubRecordTab (operations config)
//   family         → SubRecordTab (family config)
//   immunization   → SubRecordTab (immunization config)
//   imaging        → ImagingTab (grid view + multipart upload + lightbox)

import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router-dom";
import { listEncounters } from "../../../api/clinic";
import EncounterFormModal from "./EncounterFormModal";
import EncounterDetailModal from "./EncounterDetailModal";
import AmendEncounterModal from "./AmendEncounterModal";
import SubRecordTab from "./SubRecordTab";
import { SUB_RECORD_CONFIGS } from "./subRecordConfigs";
import ImagingTab from "./ImagingTab";
import "./medicalRecordsSection.css";

const TABS = [
  {
    id: "encounters",
    labelKey: "medical.tabs.encounters",
    defaultLabel: "Истории болезни",
  },
  {
    id: "allergies",
    labelKey: "medical.tabs.allergies",
    defaultLabel: "Аллергии",
  },
  {
    id: "chronic",
    labelKey: "medical.tabs.chronic",
    defaultLabel: "Хронические заболевания",
  },
  {
    id: "operations",
    labelKey: "medical.tabs.operations",
    defaultLabel: "Операции",
  },
  {
    id: "family",
    labelKey: "medical.tabs.family",
    defaultLabel: "Семейный анамнез",
  },
  {
    id: "immunization",
    labelKey: "medical.tabs.immunization",
    defaultLabel: "Прививки",
  },
  { id: "imaging", labelKey: "medical.tabs.imaging", defaultLabel: "Снимки" },
];

const SUB_TABS = {
  allergies: SUB_RECORD_CONFIGS.allergies,
  chronic: SUB_RECORD_CONFIGS.chronic,
  operations: SUB_RECORD_CONFIGS.operations,
  family: SUB_RECORD_CONFIGS.family,
  immunization: SUB_RECORD_CONFIGS.immunization,
};

export default function MedicalRecordsSection({ patient, canWrite }) {
  const { t, i18n } = useTranslation("clinic");
  const layoutContext = useOutletContext();
  const myRole = layoutContext?.role || "member";
  const canDelete = myRole === "owner";

  const [activeTab, setActiveTab] = useState("encounters");

  return (
    <section className="staff-page-section med-section">
      <h2>
        {t("medical.sectionTitle", { defaultValue: "Медицинская карта" })}
      </h2>

      <div className="med-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`med-tab ${activeTab === tab.id ? "is-active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {t(tab.labelKey, { defaultValue: tab.defaultLabel })}
          </button>
        ))}
      </div>

      <div className="med-tab-content">
        {activeTab === "encounters" && (
          <EncountersTab
            patient={patient}
            canWrite={canWrite}
            canDelete={canDelete}
            myRole={myRole}
            t={t}
            i18n={i18n}
          />
        )}

        {SUB_TABS[activeTab] && (
          <SubRecordTab
            patient={patient}
            config={SUB_TABS[activeTab]}
            canWrite={canWrite}
            canDelete={canDelete}
          />
        )}

        {activeTab === "imaging" && (
          <ImagingTab
            patient={patient}
            canWrite={canWrite}
            canDelete={canDelete}
          />
        )}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  ENCOUNTERS TAB — list + create + view + sign/edit/amend/delete
// ═══════════════════════════════════════════════════════════════════════════
//  (Unchanged from Step 2 — kept here as a co-located helper.)

function EncountersTab({ patient, canWrite, canDelete, myRole, t, i18n }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await listEncounters(patient._id, { limit: 50 });
      setItems(res.items || []);
    } catch (err) {
      console.error("Failed to load encounters:", err);
      setError(
        err.response?.data?.error ||
          t("medical.encounters.loadError", {
            defaultValue: "Не удалось загрузить истории болезни",
          }),
      );
    } finally {
      setLoading(false);
    }
  }, [patient._id, t]);

  useEffect(() => {
    load();
  }, [load]);

  function formatDate(d) {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString(i18n.language || undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return "—";
    }
  }

  function handleCreated(newEncounter) {
    setModal(null);
    setItems((prev) => [newEncounter, ...prev]);
    setTimeout(load, 0);
  }

  function handleChanged(updatedEncounter) {
    setItems((prev) =>
      prev.map((e) =>
        String(e._id) === String(updatedEncounter._id) ? updatedEncounter : e,
      ),
    );
    setModal((m) => {
      if (!m) return null;
      if (
        m.encounter &&
        String(m.encounter._id) === String(updatedEncounter._id)
      ) {
        return { type: "detail", encounter: updatedEncounter };
      }
      return m;
    });
    setTimeout(load, 0);
  }

  function handleDeleted(deletedId) {
    setModal(null);
    setItems((prev) => prev.filter((e) => String(e._id) !== String(deletedId)));
  }

  return (
    <div className="med-pane">
      <div className="med-pane-head">
        <div className="med-pane-title">
          {t("medical.encounters.listTitle", { defaultValue: "Все записи" })}
          <span className="staff-page-count">{items.length}</span>
        </div>
        {canWrite && (
          <button
            type="button"
            className="staff-page-btn-primary med-btn-add"
            onClick={() => setModal({ type: "create" })}
          >
            {t("medical.encounters.addButton", {
              defaultValue: "+ Новая запись",
            })}
          </button>
        )}
      </div>

      {loading ? (
        <div className="med-empty">
          <div className="staff-page-spinner" />
        </div>
      ) : error ? (
        <div className="med-error">
          <p>{error}</p>
          <button
            type="button"
            className="staff-page-btn-secondary"
            onClick={load}
          >
            {t("common.retry", { defaultValue: "Повторить" })}
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="med-empty">
          <p>
            {t("medical.encounters.emptyText", {
              defaultValue: "Пока нет ни одной записи приёма.",
            })}
          </p>
          {canWrite && (
            <button
              type="button"
              className="staff-page-btn-primary"
              onClick={() => setModal({ type: "create" })}
            >
              {t("medical.encounters.addFirstButton", {
                defaultValue: "Создать первую запись",
              })}
            </button>
          )}
        </div>
      ) : (
        <div className="med-table-wrap">
          <table className="med-table">
            <thead>
              <tr>
                <th className="med-th-date">
                  {t("medical.encounters.colDate", { defaultValue: "Дата" })}
                </th>
                <th>
                  {t("medical.encounters.colDiagnosis", {
                    defaultValue: "Диагноз",
                  })}
                </th>
                <th className="med-th-status">
                  {t("medical.encounters.colStatus", {
                    defaultValue: "Статус",
                  })}
                </th>
                <th className="med-th-clinic">
                  {t("medical.encounters.colClinic", {
                    defaultValue: "Клиника",
                  })}
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((enc) => (
                <EncounterRow
                  key={enc._id}
                  encounter={enc}
                  formatDate={formatDate}
                  onClick={() => setModal({ type: "detail", encounter: enc })}
                  t={t}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal?.type === "create" && (
        <EncounterFormModal
          patient={patient}
          mode="create"
          onClose={() => setModal(null)}
          onSaved={handleCreated}
        />
      )}

      {modal?.type === "edit-draft" && modal.encounter && (
        <EncounterFormModal
          patient={patient}
          mode="edit-draft"
          encounter={modal.encounter}
          onClose={() =>
            setModal({ type: "detail", encounter: modal.encounter })
          }
          onSaved={handleChanged}
        />
      )}

      {modal?.type === "detail" && modal.encounter && (
        <EncounterDetailModal
          encounter={modal.encounter}
          canWrite={canWrite}
          canDelete={canDelete}
          myRole={myRole}
          onClose={() => setModal(null)}
          onEdit={() =>
            setModal({ type: "edit-draft", encounter: modal.encounter })
          }
          onAmend={() =>
            setModal({ type: "amend", encounter: modal.encounter })
          }
          onChanged={handleChanged}
          onDeleted={handleDeleted}
        />
      )}

      {modal?.type === "amend" && modal.encounter && (
        <AmendEncounterModal
          encounter={modal.encounter}
          onClose={() =>
            setModal({ type: "detail", encounter: modal.encounter })
          }
          onSaved={handleChanged}
        />
      )}
    </div>
  );
}

function EncounterRow({ encounter, formatDate, onClick, t }) {
  const dx = encounter.mainDiagnosis?.text || "—";
  const dxCode = encounter.mainDiagnosis?.code;
  const isCross = Boolean(encounter.isCrossClinic);

  return (
    <tr
      className={`med-row ${isCross ? "is-cross-clinic" : ""}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <td className="med-td-date">{formatDate(encounter.createdAt)}</td>
      <td className="med-td-diagnosis">
        {dxCode && <span className="med-icd-code">{dxCode}</span>}
        <span className="med-dx-text">{dx}</span>
      </td>
      <td>
        <StatusPill status={encounter.status} t={t} />
      </td>
      <td className="med-td-clinic">
        {isCross && (
          <span
            className="med-cross-clinic-badge"
            title={t("medical.crossClinicHint", {
              defaultValue:
                "Запись создана другой клиникой — доступ через согласие пациента",
            })}
          >
            {t("medical.crossClinicBadge", { defaultValue: "Другая клиника" })}
          </span>
        )}
      </td>
    </tr>
  );
}

function StatusPill({ status, t }) {
  const labels = {
    draft: t("medical.encounters.status.draft", { defaultValue: "Черновик" }),
    preliminary: t("medical.encounters.status.preliminary", {
      defaultValue: "Предварительно",
    }),
    signed: t("medical.encounters.status.signed", {
      defaultValue: "Подписана",
    }),
    amended: t("medical.encounters.status.amended", {
      defaultValue: "Исправлена",
    }),
  };
  return (
    <span className={`med-status med-status-${status || "draft"}`}>
      {labels[status] || status}
    </span>
  );
}
