// client/src/pages/clinic/ClinicPatientsPage/PatientRegistrationWizard.jsx
//
// 3-step patient registration wizard.
//
//   STEP 1 — Search
//     Two tabs: by email | by date of birth + name filter.
//     Email mode: debounced lookup via searchUsersForLink({mode:"email"}).
//     DOB mode: explicit "Search" button via searchUsersForLink({mode:"dob"}).
//     Results show DocPats Users matching the query.
//
//   STEP 2 — Form
//     Standard patient data form. Email field is OPTIONAL and serves as
//     a DELIVERY CHANNEL for the patient card after provisional creation.
//     Department is OPTIONAL — routes the patient to a clinic department.
//
//   STEP 3 — Confirm
//     Summary + provisional-creation checkbox. On submit:
//       - calls createPatient() with the right flags
//       - SERVER may respond 409 with one of these codes (22 May 2026):
//
//         * patient_duplicate_in_clinic
//             same phone/email already in THIS clinic
//             → DuplicatePatientModal, "open existing" button
//
//         * user_exists_active_consent_required
//             email matches an ACTIVE DocPats user globally
//             → ConsentConfirmationModal(mode="active") with full
//               firstName/lastName/dateOfBirth of the found user;
//               on confirm — resubmit with patientConsentConfirmed:true
//             → server then creates ClinicPatient with linkedUserId,
//               NO card issued
//
//         * user_exists_provisional_consent_required
//             email matches an UNACTIVATED provisional user
//             (from this OR another clinic)
//             → ConsentConfirmationModal(mode="provisional") with full
//               data + original issuance date + reissue count;
//               on confirm — resubmit with patientConsentConfirmed:true
//             → server reissues credentials (new tmp email/password,
//               +3y expiry), returns new card to print/email
//
//         * already_linked_here
//             ClinicPatient already linked to this user in this clinic
//             → DuplicatePatientModal, "open existing" button
//
//       - SUCCESS path:
//         { patient } — case B (active link, no card)
//         { patient, provisionalCredentials } — case C reissue OR case D new
//       - In both cases — UI carries on to the printable card view
//         (PatientCardView) if credentials are present, otherwise
//         straight to onComplete().

import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useOutletContext, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  searchUsersForLink,
  createPatient,
  listDepartments,
} from "../../../api/clinic";
import PatientCardView from "./PatientCardView";
import ConsentConfirmationModal from "./ConsentConfirmationModal";
import DuplicatePatientModal from "./DuplicatePatientModal";
import "./patientRegistrationWizard.css";

const SEARCH_DEBOUNCE_MS = 400;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Today's date in "YYYY-MM-DD" — used as max on date-of-birth inputs
// so the browser won't allow picking a future date.
const TODAY_ISO = new Date().toISOString().slice(0, 10);

function isLikelyEmail(s) {
  return EMAIL_REGEX.test(s.trim());
}

export default function PatientRegistrationWizard({ onComplete, onCancel }) {
  const { t } = useTranslation("clinic");
  const navigate = useNavigate();
  const layoutContext = useOutletContext();
  const clinic = layoutContext?.clinic || null;
  const location = useLocation();
  // ─── Wizard state ───
  const [step, setStep] = useState(1); // 1=search, 2=form, 3=confirm

  // Carried between steps:
  const [selectedUser, setSelectedUser] = useState(null);

  // Form data, lives across step 2 ↔ step 3
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    dateOfBirth: "",
    gender: "",
    weightKg: "",
    departmentId: "",
    notes: "",
  });

  // Active clinic departments — for the optional department selector.
  const [departments, setDepartments] = useState([]);

  // Step 3 option
  const [createProvisional, setCreateProvisional] = useState(true);

  // Final submission result — non-null = we're showing the post-create
  // view (card if provisional, else immediate handoff to parent).
  const [submitResult, setSubmitResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // ─── Dedup modal state (22 May 2026) ───
  // When server responds 409 with a known code, we stash the response
  // detail here and show the appropriate modal. The original payload
  // (formData snapshot) stays in formData state, so confirming the modal
  // simply resubmits with patientConsentConfirmed: true.
  //
  // Shape: { code, ...detailsFromServer } or null
  const [dedupConflict, setDedupConflict] = useState(null);

  // ─── Step 1: search state ───
  const [searchMode, setSearchMode] = useState("email"); // "email" | "dob"
  const [emailQuery, setEmailQuery] = useState("");
  const [dobQuery, setDobQuery] = useState("");
  const [dobFirstName, setDobFirstName] = useState("");
  const [dobLastName, setDobLastName] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounce + race-condition guard for email autocomplete
  const emailDebounceRef = useRef(null);
  const searchSeqRef = useRef(0);

  // ─── Load active departments once (optional field) ───
  useEffect(() => {
    let cancelled = false;
    listDepartments({ status: "active" })
      .then((res) => {
        if (!cancelled) setDepartments(res.items || []);
      })
      .catch(() => {
        /* department selection is optional — ignore failures */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Email autocomplete ───
  useEffect(() => {
    if (searchMode !== "email") return;
    if (emailDebounceRef.current) clearTimeout(emailDebounceRef.current);

    const q = emailQuery.trim();
    if (!q || !isLikelyEmail(q)) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    emailDebounceRef.current = setTimeout(async () => {
      const seq = ++searchSeqRef.current;
      setSearchLoading(true);
      setSearchError(null);
      try {
        const res = await searchUsersForLink({ mode: "email", email: q });
        if (seq !== searchSeqRef.current) return;
        setSearchResults(res.items || []);
        setHasSearched(true);
      } catch (err) {
        if (seq !== searchSeqRef.current) return;
        console.error(err);
        setSearchResults([]);
        setSearchError(
          err.response?.data?.error ||
            t("patients.wizard.search.errors.failed", {
              defaultValue: "Не удалось выполнить поиск",
            }),
        );
      } finally {
        if (seq === searchSeqRef.current) setSearchLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (emailDebounceRef.current) clearTimeout(emailDebounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailQuery, searchMode]);

  // ─── DOB search (manual trigger) ───
  async function handleDobSearch() {
    if (!dobQuery) {
      setSearchError(
        t("patients.wizard.search.errors.dobRequired", {
          defaultValue: "Укажите дату рождения",
        }),
      );
      return;
    }
    const seq = ++searchSeqRef.current;
    setSearchLoading(true);
    setSearchError(null);
    setHasSearched(false);
    try {
      const res = await searchUsersForLink({
        mode: "dob",
        dateOfBirth: dobQuery,
        ...(dobFirstName.trim() && { firstName: dobFirstName.trim() }),
        ...(dobLastName.trim() && { lastName: dobLastName.trim() }),
      });
      if (seq !== searchSeqRef.current) return;
      setSearchResults(res.items || []);
      setHasSearched(true);
    } catch (err) {
      if (seq !== searchSeqRef.current) return;
      console.error(err);
      setSearchResults([]);
      setSearchError(
        err.response?.data?.error ||
          t("patients.wizard.search.errors.failed", {
            defaultValue: "Не удалось выполнить поиск",
          }),
      );
    } finally {
      if (seq === searchSeqRef.current) setSearchLoading(false);
    }
  }

  // ─── Step 1 actions ───
  function handlePickUser(user) {
    setSelectedUser(user);
    setFormData((prev) => ({
      ...prev,
      firstName: user.firstName || prev.firstName,
      lastName: user.lastName || prev.lastName,
      email: user.email || prev.email,
      dateOfBirth: user.dateOfBirth
        ? new Date(user.dateOfBirth).toISOString().slice(0, 10)
        : prev.dateOfBirth,
    }));
    setCreateProvisional(false);
    setStep(2);
  }

  function handleCreateFresh() {
    setSelectedUser(null);
    if (searchMode === "email" && emailQuery.trim()) {
      setFormData((prev) => ({ ...prev, email: emailQuery.trim() }));
    }
    if (searchMode === "dob") {
      if (dobQuery) {
        setFormData((prev) => ({ ...prev, dateOfBirth: dobQuery }));
      }
      if (dobFirstName.trim()) {
        setFormData((prev) => ({ ...prev, firstName: dobFirstName.trim() }));
      }
      if (dobLastName.trim()) {
        setFormData((prev) => ({ ...prev, lastName: dobLastName.trim() }));
      }
    }
    setCreateProvisional(true);
    setStep(2);
  }

  // ─── Step 2 actions ───
  function handleFormChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function handleFormNext() {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setSubmitError(
        t("patients.wizard.form.errors.nameRequired", {
          defaultValue: "Имя и фамилия обязательны",
        }),
      );
      return;
    }
    if (formData.dateOfBirth && formData.dateOfBirth > TODAY_ISO) {
      setSubmitError(
        t("patients.wizard.form.errors.dobInFuture", {
          defaultValue: "Дата рождения не может быть в будущем",
        }),
      );
      return;
    }
    if (formData.email.trim() && !EMAIL_REGEX.test(formData.email.trim())) {
      setSubmitError(
        t("patients.wizard.form.errors.emailInvalid", {
          defaultValue: "Неверный формат email",
        }),
      );
      return;
    }
    setSubmitError(null);
    setStep(3);
  }

  // ─── Step 3: final submit ───
  // Pulled out into a parameterized helper so the consent-modal "Confirm"
  // button can call it with patientConsentConfirmed: true on the second
  // round-trip. First call from Step 3 button passes false (default).
  async function performSubmit({ patientConsentConfirmed = false } = {}) {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        dateOfBirth: formData.dateOfBirth || null,
        gender: formData.gender || null,
        // Пустое поле — это «не измеряли», а не ноль килограммов.
        weightKg:
          String(formData.weightKg).trim() === ""
            ? null
            : Number(formData.weightKg),
        notes: formData.notes.trim() || null,
        ...(formData.departmentId && { departmentId: formData.departmentId }),
        patientConsentConfirmed,
      };

      if (createProvisional && !selectedUser) {
        if (!payload.dateOfBirth) {
          setSubmitError(
            t("patients.wizard.confirm.errors.dobRequired", {
              defaultValue:
                "Для создания аккаунта DocPats укажите дату рождения",
            }),
          );
          setSubmitting(false);
          return;
        }
        payload.createProvisionalUser = true;
      }

      const result = await createPatient(payload);
      const patient = result?.patient || result;

      // Selected-from-Step-1 link path (existing behaviour, separate from
      // server-side dedup branches). Only triggered when receptionist
      // explicitly picked a user on Step 1 — those go through a separate
      // linkPatientToUser call.
      if (selectedUser && patient?._id) {
        try {
          const { linkPatientToUser } = await import("../../../api/clinic");
          await linkPatientToUser(patient._id, selectedUser._id);
        } catch (linkErr) {
          console.warn("Link to existing user failed:", linkErr);
        }
      }

      // Successful submit — clear any pending modal and show result.
      setDedupConflict(null);
      setSubmitResult(result);

      const hasCredentials = Boolean(result?.provisionalCredentials);
      if (!hasCredentials) {
        // Case B (active link, no card) or vanilla create without
        // provisional flag — hand off to parent immediately.
        onComplete(result);
      }
      // else: stay on this screen; render branch below shows
      // PatientCardView with the new credentials.
    } catch (err) {
      console.error("createPatient failed:", err);
      console.error("Response data:", err.response?.data);
      const status = err.response?.status;
      const data = err.response?.data;
      const code = data?.details?.code;

      // ─── 409 dedup handling ───
      // Server returns ConflictError with details.code identifying which
      // branch was hit. We show the appropriate modal; user either
      // confirms (resubmit with consent) or cancels (back to form).
      if (status === 409 && code) {
        switch (code) {
          case "patient_duplicate_in_clinic":
            setDedupConflict({
              kind: "duplicate",
              reason: "duplicate_in_clinic",
              matchedField: data?.details?.matchedField,
              existingPatientId: data?.details?.existingPatientId,
            });
            return; // do NOT setSubmitError — modal handles it
          case "already_linked_here":
            setDedupConflict({
              kind: "duplicate",
              reason: "already_linked_here",
              existingPatientId: data?.details?.existingPatientId,
            });
            return;
          case "user_exists_active_consent_required":
            setDedupConflict({
              kind: "consent",
              mode: "active",
              existingUser: data?.details?.existingUser,
            });
            return;
          case "user_exists_provisional_consent_required":
            setDedupConflict({
              kind: "consent",
              mode: "provisional",
              existingUser: data?.details?.existingUser,
              originalIssuedAt: data?.details?.originalIssuedAt,
              reissueCount: data?.details?.reissueCount || 0,
            });
            return;
          default:
            // Unknown 409 code — fall through to generic handler below
            break;
        }
      }

      // zod issues (400)
      let detailedMsg = null;
      if (data?.details?.issues && Array.isArray(data.details.issues)) {
        detailedMsg = data.details.issues
          .map((issue) => {
            const path = issue.path?.join(".") || "?";
            return `${path}: ${issue.message}`;
          })
          .join("; ");
      }

      if (status === 409) {
        setSubmitError(
          data?.error ||
            t("patients.wizard.confirm.errors.duplicatePhone", {
              defaultValue: "Пациент с такими данными уже существует",
            }),
        );
      } else if (status === 400 && detailedMsg) {
        setSubmitError(`${data.error || "Validation failed"}: ${detailedMsg}`);
      } else {
        setSubmitError(
          data?.error ||
            t("patients.wizard.confirm.errors.generic", {
              defaultValue: "Не удалось создать пациента",
            }),
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit() {
    await performSubmit({ patientConsentConfirmed: false });
  }

  // Consent-modal Confirm — resubmit with the flag.
  async function handleConsentConfirm() {
    // Note: we do NOT clear dedupConflict here. We keep the modal open
    // showing the "Отправка..." state so the user sees the action is
    // in progress. On success, performSubmit() clears it.
    // On failure (rare double-conflict race), they see the error
    // surfaced and can retry / cancel.
    await performSubmit({ patientConsentConfirmed: true });
  }

  function handleConsentCancel() {
    if (submitting) return; // don't cancel mid-submit
    setDedupConflict(null);
  }

  function handleOpenExisting() {
    const id = dedupConflict?.existingPatientId;
    if (!id) return;
    const isEmployee =
      layoutContext?.kind === "employee" ||
      location.pathname.startsWith("/clinic/employee");
    // Employee zone has no patient detail page yet — return to the list.
    if (isEmployee) {
      navigate("/clinic/employee/patients");
    } else {
      navigate(`/clinic/patients/${id}`);
    }
  }
  // Human label for a department id (used in the Step 3 summary).
  function departmentLabel(id) {
    if (!id) return null;
    const d = departments.find((x) => String(x._id || x.id) === String(id));
    if (!d) return null;
    return `${d.name}${d.code ? ` (${d.code})` : ""}`;
  }

  // ─── Render ───

  // After a successful provisional create — show the printable card.
  if (submitResult?.provisionalCredentials) {
    const c = submitResult.provisionalCredentials;
    const patient = submitResult.patient || submitResult;
    return (
      <PatientCardView
        patient={patient}
        credentials={c}
        clinic={clinic}
        onDone={() => onComplete(submitResult)}
      />
    );
  }

  // Dedup modals — overlaid on top of current step. Rendered alongside
  // step UI so cancel returns user to the same step with form intact.
  const dedupModal = (() => {
    if (!dedupConflict) return null;
    if (dedupConflict.kind === "consent") {
      return (
        <ConsentConfirmationModal
          mode={dedupConflict.mode}
          existingUser={dedupConflict.existingUser}
          originalIssuedAt={dedupConflict.originalIssuedAt}
          reissueCount={dedupConflict.reissueCount}
          submitting={submitting}
          onConfirm={handleConsentConfirm}
          onCancel={handleConsentCancel}
        />
      );
    }
    if (dedupConflict.kind === "duplicate") {
      return (
        <DuplicatePatientModal
          reason={dedupConflict.reason}
          matchedField={dedupConflict.matchedField}
          existingPatientId={dedupConflict.existingPatientId}
          onOpenExisting={handleOpenExisting}
          onCancel={handleConsentCancel}
        />
      );
    }
    return null;
  })();

  // ─── Stepper UI (shared across all 3 steps) ───
  const Stepper = (
    <div className="prw-stepper">
      <div
        className={`prw-step ${step === 1 ? "is-active" : step > 1 ? "is-done" : ""}`}
      >
        <span className="prw-step-num">1</span>
        <span className="prw-step-label">
          {t("patients.wizard.steps.search", {
            defaultValue: "Поиск",
          })}
        </span>
      </div>
      <div className="prw-step-sep" />
      <div
        className={`prw-step ${step === 2 ? "is-active" : step > 2 ? "is-done" : ""}`}
      >
        <span className="prw-step-num">2</span>
        <span className="prw-step-label">
          {t("patients.wizard.steps.form", {
            defaultValue: "Данные",
          })}
        </span>
      </div>
      <div className="prw-step-sep" />
      <div className={`prw-step ${step === 3 ? "is-active" : ""}`}>
        <span className="prw-step-num">3</span>
        <span className="prw-step-label">
          {t("patients.wizard.steps.confirm", {
            defaultValue: "Подтверждение",
          })}
        </span>
      </div>
    </div>
  );

  // ─── STEP 1 ───
  if (step === 1) {
    return (
      <div className="prw">
        {Stepper}
        <div className="prw-panel">
          <h2 className="prw-h2">
            {t("patients.wizard.search.title", {
              defaultValue: "Проверим, есть ли пациент в DocPats",
            })}
          </h2>
          <p className="prw-sub">
            {t("patients.wizard.search.subtitle", {
              defaultValue:
                "Поиск по существующим пользователям DocPats — поможет привязать карту к их аккаунту и избежать дублей.",
            })}
          </p>

          <div className="prw-tabs">
            <button
              type="button"
              className={`prw-tab ${searchMode === "email" ? "is-active" : ""}`}
              onClick={() => {
                setSearchMode("email");
                setSearchResults([]);
                setSearchError(null);
                setHasSearched(false);
              }}
            >
              {t("patients.wizard.search.tabEmail", {
                defaultValue: "По email",
              })}
            </button>
            <button
              type="button"
              className={`prw-tab ${searchMode === "dob" ? "is-active" : ""}`}
              onClick={() => {
                setSearchMode("dob");
                setSearchResults([]);
                setSearchError(null);
                setHasSearched(false);
              }}
            >
              {t("patients.wizard.search.tabDob", {
                defaultValue: "По дате рождения",
              })}
            </button>
          </div>

          {searchMode === "email" && (
            <div className="prw-field">
              <label>
                {t("patients.wizard.search.emailLabel", {
                  defaultValue: "Email пациента",
                })}
              </label>
              <input
                type="email"
                placeholder="patient@example.com"
                value={emailQuery}
                onChange={(e) => setEmailQuery(e.target.value)}
                autoFocus
              />
              <span className="prw-hint">
                {t("patients.wizard.search.emailHint", {
                  defaultValue: "Введите полный email — поиск автоматически",
                })}
              </span>
            </div>
          )}

          {searchMode === "dob" && (
            <>
              <div className="prw-field">
                <label>
                  {t("patients.wizard.search.dobLabel", {
                    defaultValue: "Дата рождения",
                  })}
                </label>
                <input
                  type="date"
                  value={dobQuery}
                  max={TODAY_ISO}
                  onChange={(e) => setDobQuery(e.target.value)}
                  placeholder={t("patients.wizard.search.dobPlaceholder", {
                    defaultValue: "ДД.ММ.ГГГГ",
                  })}
                  autoFocus
                />
                <span className="prw-hint">
                  {t("patients.wizard.search.dobHint", {
                    defaultValue:
                      "Сначала укажите дату рождения. Имя и фамилия — для уточнения.",
                  })}
                </span>
              </div>
              <div className="prw-row-2">
                <div className="prw-field">
                  <label>
                    {t("patients.wizard.search.firstNameLabel", {
                      defaultValue: "Имя",
                    })}
                  </label>
                  <input
                    type="text"
                    value={dobFirstName}
                    onChange={(e) => setDobFirstName(e.target.value)}
                  />
                </div>
                <div className="prw-field">
                  <label>
                    {t("patients.wizard.search.lastNameLabel", {
                      defaultValue: "Фамилия",
                    })}
                  </label>
                  <input
                    type="text"
                    value={dobLastName}
                    onChange={(e) => setDobLastName(e.target.value)}
                  />
                </div>
              </div>
              <button
                type="button"
                className="staff-page-btn-primary"
                onClick={handleDobSearch}
                disabled={searchLoading || !dobQuery}
              >
                {searchLoading
                  ? t("common.loading", { defaultValue: "Загрузка..." })
                  : t("patients.wizard.search.searchButton", {
                      defaultValue: "Найти",
                    })}
              </button>
            </>
          )}

          {searchError && (
            <div className="patients-form-error patients-form-error-banner">
              {searchError}
            </div>
          )}

          {searchLoading && searchMode === "email" && (
            <div className="prw-status">
              {t("common.loading", { defaultValue: "Загрузка..." })}
            </div>
          )}

          {hasSearched && !searchLoading && searchResults.length === 0 && (
            <div className="prw-status prw-status-empty">
              {t("patients.wizard.search.notFound", {
                defaultValue:
                  "В DocPats никого с такими данными нет. Можно создать нового пациента.",
              })}
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="prw-results">
              <h3 className="prw-results-title">
                {t("patients.wizard.search.foundTitle", {
                  defaultValue: "Найдено в DocPats",
                })}
              </h3>
              {searchResults.map((u) => (
                <UserResultRow
                  key={u._id}
                  user={u}
                  onLink={() => handlePickUser(u)}
                  t={t}
                />
              ))}
            </div>
          )}

          <div className="prw-actions prw-actions-spread">
            <button
              type="button"
              className="staff-page-btn-secondary"
              onClick={onCancel}
            >
              {t("common.cancel", { defaultValue: "Отмена" })}
            </button>
            <button
              type="button"
              className="staff-page-btn-primary"
              onClick={handleCreateFresh}
            >
              {t("patients.wizard.search.createFresh", {
                defaultValue: "Создать нового пациента →",
              })}
            </button>
          </div>
        </div>
        {dedupModal}
      </div>
    );
  }

  // ─── STEP 2 ───
  if (step === 2) {
    return (
      <div className="prw">
        {Stepper}
        <div className="prw-panel">
          <h2 className="prw-h2">
            {t("patients.wizard.form.title", {
              defaultValue: "Данные пациента",
            })}
          </h2>
          {selectedUser && (
            <div className="prw-prefilled-banner">
              {t("patients.wizard.form.prefilledFromUser", {
                defaultValue:
                  "Данные предзаполнены из аккаунта DocPats — проверьте и при необходимости уточните.",
              })}
            </div>
          )}

          <div className="prw-row-2">
            <div className="prw-field">
              <label>
                {t("patients.fields.firstName", { defaultValue: "Имя" })} *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleFormChange("firstName", e.target.value)}
                autoFocus
              />
            </div>
            <div className="prw-field">
              <label>
                {t("patients.fields.lastName", { defaultValue: "Фамилия" })} *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleFormChange("lastName", e.target.value)}
              />
            </div>
          </div>

          <div className="prw-row-2">
            <div className="prw-field">
              <label>
                {t("patients.fields.phone", { defaultValue: "Телефон" })}
              </label>
              <input
                type="text"
                placeholder="+994 50 123 45 67"
                value={formData.phone}
                onChange={(e) => handleFormChange("phone", e.target.value)}
              />
            </div>
            <div className="prw-field">
              <label>
                {t("patients.fields.email", { defaultValue: "Email" })}{" "}
                <span className="patients-form-optional">
                  {t("common.optional", { defaultValue: "(необязательно)" })}
                </span>
              </label>
              <input
                type="email"
                placeholder="patient@example.com"
                value={formData.email}
                onChange={(e) => handleFormChange("email", e.target.value)}
              />
              <span className="prw-hint">
                {t("patients.wizard.form.emailDeliveryHint", {
                  defaultValue:
                    "Если введёте — отправим карточку пациента сюда на почту. Иначе просто распечатаем на руку.",
                })}
              </span>
            </div>
          </div>

          <div className="prw-row-2">
            <div className="prw-field">
              <label>
                {t("patients.fields.dateOfBirth", {
                  defaultValue: "Дата рождения",
                })}
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                max={TODAY_ISO}
                onChange={(e) =>
                  handleFormChange("dateOfBirth", e.target.value)
                }
              />
            </div>
            <div className="prw-field">
              <label>
                {t("patients.fields.gender", { defaultValue: "Пол" })}
              </label>
              <select
                value={formData.gender}
                onChange={(e) => handleFormChange("gender", e.target.value)}
              >
                <option value="">—</option>
                <option value="male">
                  {t("patients.gender.male", { defaultValue: "Мужской" })}
                </option>
                <option value="female">
                  {t("patients.gender.female", { defaultValue: "Женский" })}
                </option>
                <option value="other">
                  {t("patients.gender.other", { defaultValue: "Другой" })}
                </option>
                <option value="unknown">
                  {t("patients.gender.unknown", { defaultValue: "Не указан" })}
                </option>
              </select>
            </div>
            {/* Вес нужен не для статистики: по нему считают дозу у детей, в
                нефрологии и онкологии, и он печатается в рецептурном бланке —
                там это поле стандарта ВОЗ. */}
            <div className="prw-field">
              <label>
                {t("patients.fields.weightKg", { defaultValue: "Вес, кг" })}
              </label>
              <input
                type="number"
                min="0"
                max="700"
                step="0.1"
                value={formData.weightKg}
                onChange={(e) => handleFormChange("weightKg", e.target.value)}
              />
            </div>
          </div>

          {/* Department (optional) — shown only if the clinic has any */}
          {departments.length > 0 && (
            <div className="prw-field">
              <label>
                {t("patients.fields.department", {
                  defaultValue: "Отделение",
                })}{" "}
                <span className="patients-form-optional">
                  {t("common.optional", { defaultValue: "(необязательно)" })}
                </span>
              </label>
              <select
                value={formData.departmentId}
                onChange={(e) =>
                  handleFormChange("departmentId", e.target.value)
                }
              >
                <option value="">
                  {t("patients.wizard.form.departmentNone", {
                    defaultValue: "— не указано —",
                  })}
                </option>
                {departments.map((d) => (
                  <option key={d._id || d.id} value={d._id || d.id}>
                    {d.name}
                    {d.code ? ` (${d.code})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="prw-field">
            <label>
              {t("patients.wizard.form.notesLabel", {
                defaultValue: "Примечания",
              })}
              <span className="patients-form-optional">
                {" "}
                {t("common.optional", { defaultValue: "(необязательно)" })}
              </span>
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => handleFormChange("notes", e.target.value)}
            />
          </div>

          {submitError && (
            <div className="patients-form-error patients-form-error-banner">
              {submitError}
            </div>
          )}

          <div className="prw-actions prw-actions-spread">
            <button
              type="button"
              className="staff-page-btn-secondary"
              onClick={() => setStep(1)}
            >
              {t("common.back", { defaultValue: "← Назад" })}
            </button>
            <button
              type="button"
              className="staff-page-btn-primary"
              onClick={handleFormNext}
            >
              {t("patients.wizard.form.next", {
                defaultValue: "Далее →",
              })}
            </button>
          </div>
        </div>
        {dedupModal}
      </div>
    );
  }

  // ─── STEP 3 ───
  return (
    <div className="prw">
      {Stepper}
      <div className="prw-panel">
        <h2 className="prw-h2">
          {t("patients.wizard.confirm.title", {
            defaultValue: "Подтверждение",
          })}
        </h2>
        <p className="prw-sub">
          {t("patients.wizard.confirm.subtitle", {
            defaultValue: "Проверьте данные перед созданием.",
          })}
        </p>

        <div className="prw-summary">
          <SummaryRow
            label={t("patients.fields.firstName", { defaultValue: "Имя" })}
            value={formData.firstName}
          />
          <SummaryRow
            label={t("patients.fields.lastName", { defaultValue: "Фамилия" })}
            value={formData.lastName}
          />
          {formData.phone && (
            <SummaryRow
              label={t("patients.fields.phone", { defaultValue: "Телефон" })}
              value={formData.phone}
            />
          )}
          {formData.email && (
            <SummaryRow
              label={t("patients.fields.email", { defaultValue: "Email" })}
              value={formData.email}
            />
          )}
          {formData.dateOfBirth && (
            <SummaryRow
              label={t("patients.fields.dateOfBirth", {
                defaultValue: "Дата рождения",
              })}
              value={formData.dateOfBirth}
            />
          )}
          {formData.departmentId && departmentLabel(formData.departmentId) && (
            <SummaryRow
              label={t("patients.fields.department", {
                defaultValue: "Отделение",
              })}
              value={departmentLabel(formData.departmentId)}
            />
          )}
          {selectedUser && (
            <SummaryRow
              label={t("patients.wizard.confirm.linkedTo", {
                defaultValue: "Привязка к DocPats",
              })}
              value={
                [selectedUser.firstName, selectedUser.lastName]
                  .filter(Boolean)
                  .join(" ") || selectedUser.email
              }
              highlight
            />
          )}
        </div>

        {formData.email && createProvisional && !selectedUser && (
          <div className="prw-delivery-notice">
            <span className="prw-delivery-icon">📧</span>
            <span>
              {t("patients.wizard.confirm.emailDeliveryNotice", {
                email: formData.email,
                defaultValue:
                  "После создания карточка пациента будет отправлена на {{email}}",
              })}
            </span>
          </div>
        )}

        <div className="prw-provisional-box">
          <label className="prw-checkbox">
            <input
              type="checkbox"
              checked={createProvisional && !selectedUser}
              disabled={!!selectedUser}
              onChange={(e) => setCreateProvisional(e.target.checked)}
            />
            <span>
              <strong>
                {t("patients.wizard.confirm.createProvisionalTitle", {
                  defaultValue: "Создать аккаунт DocPats для пациента",
                })}
              </strong>
              <small>
                {selectedUser
                  ? t("patients.wizard.confirm.alreadyLinkedNote", {
                      defaultValue:
                        "Пациент уже привязан к существующему аккаунту — новый создавать не нужно.",
                    })
                  : t("patients.wizard.confirm.createProvisionalNote", {
                      defaultValue:
                        "Клиника создаст временный email и пароль. Пациент получит карточку и сможет войти в DocPats, чтобы видеть результаты обследований, переписку с врачами и историю.",
                    })}
              </small>
            </span>
          </label>
        </div>

        {submitError && (
          <div className="patients-form-error patients-form-error-banner">
            {submitError}
          </div>
        )}

        <div className="prw-actions prw-actions-spread">
          <button
            type="button"
            className="staff-page-btn-secondary"
            onClick={() => setStep(2)}
            disabled={submitting}
          >
            {t("common.back", { defaultValue: "← Назад" })}
          </button>
          <button
            type="button"
            className="staff-page-btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? t("common.submitting", { defaultValue: "Отправка..." })
              : t("patients.wizard.confirm.submit", {
                  defaultValue: "Создать пациента",
                })}
          </button>
        </div>
      </div>
      {dedupModal}
    </div>
  );
}

// ─── Sub-components ───

function UserResultRow({ user, onLink, t }) {
  const name =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.username ||
    user.email ||
    "—";
  const roleLabel = user.role
    ? t(`patients.linkSection.role.${user.role}`, {
        defaultValue: user.role,
      })
    : null;
  return (
    <div className="prw-user-row">
      <div className="prw-user-info">
        <div className="prw-user-name">
          {name}
          {roleLabel && <span className="prw-user-role">{roleLabel}</span>}
        </div>
        <div className="prw-user-meta">
          {user.email && <span>{user.email}</span>}
          {user.email && user.dateOfBirth && (
            <span className="patient-meta-sep">·</span>
          )}
          {user.dateOfBirth && (
            <span>{new Date(user.dateOfBirth).toLocaleDateString()}</span>
          )}
        </div>
      </div>
      <button
        type="button"
        className="staff-page-btn-primary prw-link-btn"
        onClick={onLink}
      >
        {t("patients.wizard.search.linkButton", {
          defaultValue: "Привязать",
        })}
      </button>
    </div>
  );
}

function SummaryRow({ label, value, highlight }) {
  return (
    <div className={`prw-summary-row ${highlight ? "is-highlight" : ""}`}>
      <span className="prw-summary-label">{label}</span>
      <span className="prw-summary-value">{value}</span>
    </div>
  );
}
