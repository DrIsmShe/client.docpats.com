// client/src/pages/clinic/ClinicPublicPageSettings/DeleteClinicSection.jsx
//
// "Danger zone" for permanently deleting a clinic (OWNER only).
//
// Deletion is destructive: it hard-deletes construction data (departments,
// rooms, articles, schedules, …) and soft-deletes PHI/history (patients,
// appointments, the clinic itself) on the server. Global clinic-worker
// identities are NOT deleted — only their memberships to this clinic end.
//
// To guard against accidents, the confirm button stays disabled until the
// user types the clinic's EXACT name. Wire this into the clinic settings page
// and pass the current clinic { id, name }.
//
// API wrapper to add in src/api/clinic.js:
//   export const deleteClinic = async (clinicId, confirmationName) => {
//     const res = await axios.delete(`/api/v1/clinic/clinics/${clinicId}`, {
//       data: { confirmationName },
//     });
//     return res.data;
//   };

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { deleteClinic } from "../../../api/clinic";
import "./deleteClinicSection.css";

export default function DeleteClinicSection({ clinicId, clinicName }) {
  const { t } = useTranslation("clinic");
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const nameMatches = typed.trim() === (clinicName || "").trim();

  const closeModal = () => {
    if (submitting) return;
    setOpen(false);
    setTyped("");
    setError(null);
  };

  async function handleDelete() {
    if (!nameMatches || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await deleteClinic(clinicId, typed.trim());
      // Clinic is gone — leave the clinic zone entirely.
      navigate("/clinic", { replace: true });
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;
      if (status === 403) {
        setError(
          data?.error ||
            t("deleteClinic.errors.notOwner", {
              defaultValue: "Только владелец может удалить клинику.",
            }),
        );
      } else if (status === 409) {
        setError(
          data?.error ||
            t("deleteClinic.errors.nameMismatch", {
              defaultValue: "Название не совпадает.",
            }),
        );
      } else {
        setError(
          data?.error ||
            t("deleteClinic.errors.generic", {
              defaultValue: "Не удалось удалить клинику. Попробуйте снова.",
            }),
        );
      }
      setSubmitting(false);
    }
  }

  return (
    <section className="delete-clinic-danger">
      <div className="delete-clinic-danger-header">
        <h2>{t("deleteClinic.title", { defaultValue: "Опасная зона" })}</h2>
        <p>
          {t("deleteClinic.description", {
            defaultValue:
              "Удаление клиники необратимо. Отделения, кабинеты, оборудование, статьи и расписания будут удалены. Данные пациентов и история приёмов сохраняются в архиве в соответствии с требованиями.",
          })}
        </p>
      </div>

      <button
        type="button"
        className="delete-clinic-trigger"
        onClick={() => setOpen(true)}
      >
        {t("deleteClinic.button", { defaultValue: "Удалить клинику" })}
      </button>

      {open && (
        <div
          className="delete-clinic-overlay"
          onClick={closeModal}
          role="presentation"
        >
          <div
            className="delete-clinic-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="delete-clinic-modal-icon">⚠️</div>
            <h3>
              {t("deleteClinic.modal.title", {
                defaultValue: "Удалить клинику навсегда?",
              })}
            </h3>
            <p className="delete-clinic-modal-text">
              {t("deleteClinic.modal.text", {
                clinicName,
                defaultValue:
                  "Это действие нельзя отменить. Чтобы подтвердить, введите название клиники: {{clinicName}}",
              })}
            </p>

            {error && <div className="delete-clinic-error">{error}</div>}

            <input
              type="text"
              className="delete-clinic-input"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={clinicName}
              disabled={submitting}
              autoFocus
              autoComplete="off"
            />

            <div className="delete-clinic-actions">
              <button
                type="button"
                className="delete-clinic-cancel"
                onClick={closeModal}
                disabled={submitting}
              >
                {t("common.cancel", { defaultValue: "Отмена" })}
              </button>
              <button
                type="button"
                className="delete-clinic-confirm"
                onClick={handleDelete}
                disabled={!nameMatches || submitting}
              >
                {submitting
                  ? t("deleteClinic.modal.deleting", {
                      defaultValue: "Удаление…",
                    })
                  : t("deleteClinic.modal.confirm", {
                      defaultValue: "Удалить навсегда",
                    })}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
