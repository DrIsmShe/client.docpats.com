// client/src/pages/clinic/ClinicStaffPage/AddDoctorModal.jsx

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { searchDoctors, addStaff } from "../../../api/clinic";
import "./inviteEmployeeModal.css";
import "./addDoctorModal.css";

export default function AddDoctorModal({ onClose, onSuccess }) {
  const { t } = useTranslation("clinic");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchDoctors(query.trim());
        setResults(res.items || []);
      } catch (err) {
        console.error("Search failed:", err);
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  function getId(d) {
    return d?.userId || d?._id || d?.id || null;
  }

  async function handleAdd() {
    const userId = getId(selectedDoctor);
    if (!userId) return;
    setSubmitting(true);
    setError(null);
    try {
      await addStaff({ userId, role: "doctor" });
      onSuccess();
    } catch (err) {
      const data = err.response?.data;
      setError(data?.error || t("addDoctorModal.errors.generic"));
    } finally {
      setSubmitting(false);
    }
  }

  const selectedId = getId(selectedDoctor);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>{t("addDoctorModal.title")}</h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label={t("common.cancel")}
            type="button"
          >
            ×
          </button>
        </header>

        <div className="modal-body">
          <p className="modal-intro">{t("addDoctorModal.intro")}</p>

          {error && <div className="modal-error">{error}</div>}

          <div className="modal-field">
            <label htmlFor="doctor-search">
              {t("addDoctorModal.searchLabel")}
            </label>
            <input
              id="doctor-search"
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedDoctor(null);
              }}
              placeholder={t("addDoctorModal.searchPlaceholder")}
              autoFocus
            />
          </div>

          <div className="add-doctor-results">
            {searching && (
              <div className="add-doctor-status">
                {t("addDoctorModal.searching")}
              </div>
            )}
            {!searching && query.trim().length >= 2 && results.length === 0 && (
              <div className="add-doctor-status">
                {t("addDoctorModal.noResults")}
              </div>
            )}
            {!searching && results.length > 0 && (
              <div className="add-doctor-list">
                {results.map((d) => {
                  const id = getId(d);
                  const isSelected = selectedId && selectedId === id;
                  const name =
                    [d.firstName, d.lastName].filter(Boolean).join(" ") ||
                    d.username ||
                    d.email;
                  return (
                    <button
                      key={id || `${d.username}-${d.email}`}
                      className={`add-doctor-item ${isSelected ? "is-selected" : ""}`}
                      onClick={() => setSelectedDoctor(d)}
                      type="button"
                    >
                      <div className="add-doctor-avatar">
                        {(name[0] || "?").toUpperCase()}
                      </div>
                      <div className="add-doctor-info">
                        <div className="add-doctor-name">{name}</div>
                        <div className="add-doctor-email">{d.email}</div>
                        {d.username && d.username !== name.toLowerCase() && (
                          <div className="add-doctor-spec">@{d.username}</div>
                        )}
                      </div>
                      {isSelected && (
                        <span className="add-doctor-check">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <footer className="modal-footer">
            <button
              className="modal-btn-cancel"
              onClick={onClose}
              disabled={submitting}
              type="button"
            >
              {t("common.cancel")}
            </button>
            <button
              className="modal-btn-submit"
              onClick={handleAdd}
              disabled={!selectedDoctor || submitting}
              type="button"
            >
              {submitting
                ? t("addDoctorModal.adding")
                : t("addDoctorModal.submit")}
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
