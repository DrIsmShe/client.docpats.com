// client/src/pages/clinic/ClinicPatientDetailPage/PrescriptionFormModal.jsx
//
// Modal for issuing a prescription (Rx blank with multiple drug items).
// Stage 2 #4 — WHO Good Prescribing item structure.
//
// Each item: inn (required, generic name) + optional brand, strength, form,
// route, dose, frequency, duration, quantity, prn, instructions.
// WHO principle: prescribe by INN (generic), brand optional.
//
// Uses shared .med-modal-* / .patients-form-* classes from
// medicalRecordsSection.css. No draft — single "Issue" action.

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { createPrescription } from "../../../api/clinic";
import ICD10Autocomplete from "../../../components/ICD10Autocomplete";

const DRUG_FORMS = [
  "tablet",
  "capsule",
  "syrup",
  "spray",
  "drops",
  "ointment",
  "injection",
  "inhaler",
  "suppository",
  "solution",
  "powder",
  "other",
];

const DRUG_ROUTES = [
  "oral",
  "topical",
  "intramuscular",
  "intravenous",
  "subcutaneous",
  "inhalation",
  "nasal",
  "otic",
  "ophthalmic",
  "rectal",
  "sublingual",
  "other",
];

function emptyItem() {
  return {
    inn: "",
    brandName: "",
    strength: "",
    form: "tablet",
    route: "oral",
    dose: "",
    frequency: "",
    duration: "",
    quantity: "",
    prn: false,
    instructions: "",
  };
}

export default function PrescriptionFormModal({ patient, onClose, onSaved }) {
  const { t } = useTranslation("clinic");

  const [items, setItems] = useState([emptyItem()]);
  const [diagnosis, setDiagnosis] = useState({
    code: "",
    codeTitle: "",
    text: "",
  });
  const [generalNotes, setGeneralNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  function setItemField(idx, name, value) {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, [name]: value } : it)),
    );
    if (errors[`item_${idx}_inn`] && name === "inn") {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[`item_${idx}_inn`];
        return next;
      });
    }
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeItem(idx) {
    setItems((prev) =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== idx),
    );
  }

  function handleICD10Select(selected) {
    if (!selected) {
      setDiagnosis({ code: "", codeTitle: "", text: "" });
      return;
    }
    setDiagnosis((prev) => ({
      code: selected.code,
      codeTitle: selected.title,
      text: prev.text || selected.title,
    }));
  }

  function validate() {
    const errs = {};
    let hasOne = false;
    items.forEach((it, idx) => {
      if (!it.inn.trim()) {
        errs[`item_${idx}_inn`] = t(
          "medical.prescriptions.errors.innRequired",
          {
            defaultValue: "Укажите МНН препарата",
          },
        );
      } else {
        hasOne = true;
      }
    });
    if (!hasOne) {
      errs._form = t("medical.prescriptions.errors.atLeastOne", {
        defaultValue: "Добавьте хотя бы один препарат",
      });
    }
    return errs;
  }

  function buildPayload() {
    const cleanItems = items
      .filter((it) => it.inn.trim())
      .map((it) => ({
        inn: it.inn.trim(),
        brandName: it.brandName.trim(),
        strength: it.strength.trim(),
        form: it.form,
        route: it.route,
        dose: it.dose.trim(),
        frequency: it.frequency.trim(),
        duration: it.duration.trim(),
        quantity: it.quantity.trim(),
        prn: !!it.prn,
        instructions: it.instructions.trim(),
      }));

    const payload = { items: cleanItems };

    if (diagnosis.code.trim() || diagnosis.text.trim()) {
      payload.diagnosis = {
        code: diagnosis.code.trim(),
        codeTitle: diagnosis.codeTitle.trim(),
        text: diagnosis.text.trim(),
      };
    }
    if (generalNotes.trim()) payload.generalNotes = generalNotes.trim();

    return payload;
  }

  async function handleSubmit() {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    try {
      const created = await createPrescription(patient._id, buildPayload());
      const saved = created.prescription || created;
      onSaved && onSaved(saved);
    } catch (err) {
      console.error("Failed to issue prescription:", err);
      setErrors({
        _form:
          err.response?.data?.error ||
          t("common.saveFailed", { defaultValue: "Не удалось сохранить" }),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="med-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="med-modal med-modal-encounter"
        role="dialog"
        aria-modal="true"
      >
        <div className="med-modal-head">
          <h3>
            {t("medical.prescriptions.createTitle", {
              defaultValue: "Новый рецепт",
            })}
          </h3>
          <button
            type="button"
            className="med-modal-close"
            onClick={onClose}
            aria-label="Close"
            disabled={submitting}
          >
            ×
          </button>
        </div>

        <div className="med-modal-body">
          {/* Optional diagnosis */}
          <fieldset className="med-fieldset">
            <legend>
              {t("medical.prescriptions.diagnosisTitle", {
                defaultValue: "Диагноз (МКБ-10, необязательно)",
              })}
            </legend>
            <div className="patients-form-field">
              <ICD10Autocomplete
                value={
                  diagnosis.code
                    ? { code: diagnosis.code, title: diagnosis.codeTitle }
                    : null
                }
                onChange={handleICD10Select}
                placeholder={t("medical.encounters.placeholders.icdSearch", {
                  defaultValue:
                    "Поиск МКБ-10 по коду (J45) или англ. названию (asthma)...",
                })}
              />
            </div>
            {diagnosis.code && (
              <div className="patients-form-field" style={{ marginTop: 12 }}>
                <textarea
                  rows={2}
                  value={diagnosis.text}
                  onChange={(e) =>
                    setDiagnosis((prev) => ({ ...prev, text: e.target.value }))
                  }
                  disabled={submitting}
                  placeholder={t(
                    "medical.encounters.placeholders.diagnosisText",
                    { defaultValue: "Диагноз на родном языке" },
                  )}
                />
              </div>
            )}
          </fieldset>

          {/* Items — dynamic drug list (WHO) */}
          <fieldset className="med-fieldset">
            <legend>
              {t("medical.prescriptions.itemsTitle", {
                defaultValue: "Препараты",
              })}
            </legend>

            {items.map((it, idx) => (
              <div key={idx} className="rx-item">
                <div className="rx-item-head">
                  <span className="rx-item-num">{idx + 1}</span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      className="rx-item-remove"
                      onClick={() => removeItem(idx)}
                      disabled={submitting}
                      aria-label={t("common.remove", {
                        defaultValue: "Удалить",
                      })}
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* INN (required) */}
                <div className="patients-form-field">
                  <label>
                    {t("medical.prescriptions.fields.inn", {
                      defaultValue: "МНН (международное название)",
                    })}
                  </label>
                  <input
                    type="text"
                    value={it.inn}
                    onChange={(e) => setItemField(idx, "inn", e.target.value)}
                    className={errors[`item_${idx}_inn`] ? "has-error" : ""}
                    disabled={submitting}
                    placeholder={t("medical.prescriptions.placeholders.inn", {
                      defaultValue: "Например: Loratadinum",
                    })}
                  />
                  {errors[`item_${idx}_inn`] && (
                    <span className="patients-form-error">
                      {errors[`item_${idx}_inn`]}
                    </span>
                  )}
                </div>

                {/* Brand (optional) */}
                <div className="patients-form-field">
                  <label>
                    {t("medical.prescriptions.fields.brandName", {
                      defaultValue: "Торговое название",
                    })}
                    <span className="patients-form-optional">
                      {t("common.optional", { defaultValue: "необязательно" })}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={it.brandName}
                    onChange={(e) =>
                      setItemField(idx, "brandName", e.target.value)
                    }
                    disabled={submitting}
                    placeholder="Кларитин"
                  />
                </div>

                {/* Strength + Form */}
                <div className="rx-item-row">
                  <div className="patients-form-field">
                    <label>
                      {t("medical.prescriptions.fields.strength", {
                        defaultValue: "Сила препарата",
                      })}
                    </label>
                    <input
                      type="text"
                      value={it.strength}
                      onChange={(e) =>
                        setItemField(idx, "strength", e.target.value)
                      }
                      disabled={submitting}
                      placeholder="10 мг"
                    />
                  </div>
                  <div className="patients-form-field">
                    <label>
                      {t("medical.prescriptions.fields.form", {
                        defaultValue: "Форма",
                      })}
                    </label>
                    <select
                      value={it.form}
                      onChange={(e) =>
                        setItemField(idx, "form", e.target.value)
                      }
                      disabled={submitting}
                    >
                      {DRUG_FORMS.map((f) => (
                        <option key={f} value={f}>
                          {t(`medical.prescriptions.forms.${f}`, {
                            defaultValue: f,
                          })}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Route + Dose */}
                <div className="rx-item-row">
                  <div className="patients-form-field">
                    <label>
                      {t("medical.prescriptions.fields.route", {
                        defaultValue: "Путь введения",
                      })}
                    </label>
                    <select
                      value={it.route}
                      onChange={(e) =>
                        setItemField(idx, "route", e.target.value)
                      }
                      disabled={submitting}
                    >
                      {DRUG_ROUTES.map((r) => (
                        <option key={r} value={r}>
                          {t(`medical.prescriptions.routes.${r}`, {
                            defaultValue: r,
                          })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="patients-form-field">
                    <label>
                      {t("medical.prescriptions.fields.dose", {
                        defaultValue: "Разовая доза",
                      })}
                    </label>
                    <input
                      type="text"
                      value={it.dose}
                      onChange={(e) =>
                        setItemField(idx, "dose", e.target.value)
                      }
                      disabled={submitting}
                      placeholder={t(
                        "medical.prescriptions.placeholders.dose",
                        {
                          defaultValue: "1 таблетка",
                        },
                      )}
                    />
                  </div>
                </div>

                {/* Frequency + Duration */}
                <div className="rx-item-row">
                  <div className="patients-form-field">
                    <label>
                      {t("medical.prescriptions.fields.frequency", {
                        defaultValue: "Приём",
                      })}
                    </label>
                    <input
                      type="text"
                      value={it.frequency}
                      onChange={(e) =>
                        setItemField(idx, "frequency", e.target.value)
                      }
                      disabled={submitting}
                      placeholder={t(
                        "medical.prescriptions.placeholders.frequency",
                        { defaultValue: "1 раз в день" },
                      )}
                    />
                  </div>
                  <div className="patients-form-field">
                    <label>
                      {t("medical.prescriptions.fields.duration", {
                        defaultValue: "Длительность",
                      })}
                    </label>
                    <input
                      type="text"
                      value={it.duration}
                      onChange={(e) =>
                        setItemField(idx, "duration", e.target.value)
                      }
                      disabled={submitting}
                      placeholder={t(
                        "medical.prescriptions.placeholders.duration",
                        { defaultValue: "14 дней" },
                      )}
                    />
                  </div>
                </div>

                {/* Instructions */}
                <div className="patients-form-field">
                  <label>
                    {t("medical.prescriptions.fields.instructions", {
                      defaultValue: "Указания",
                    })}
                  </label>
                  <textarea
                    rows={2}
                    value={it.instructions}
                    onChange={(e) =>
                      setItemField(idx, "instructions", e.target.value)
                    }
                    disabled={submitting}
                    placeholder={t(
                      "medical.prescriptions.placeholders.instructions",
                      { defaultValue: "Утром после еды" },
                    )}
                  />
                </div>

                {/* Quantity + PRN */}
                <div className="rx-item-row">
                  <div className="patients-form-field">
                    <label>
                      {t("medical.prescriptions.fields.quantity", {
                        defaultValue: "Кол-во на курс",
                      })}
                      <span className="patients-form-optional">
                        {t("common.optional", {
                          defaultValue: "необязательно",
                        })}
                      </span>
                    </label>
                    <input
                      type="text"
                      value={it.quantity}
                      onChange={(e) =>
                        setItemField(idx, "quantity", e.target.value)
                      }
                      disabled={submitting}
                      placeholder="№20"
                    />
                  </div>
                  <div
                    className="patients-form-field rx-prn-field"
                    style={{ justifyContent: "flex-end" }}
                  >
                    <label className="rx-prn-label">
                      <input
                        type="checkbox"
                        checked={it.prn}
                        onChange={(e) =>
                          setItemField(idx, "prn", e.target.checked)
                        }
                        disabled={submitting}
                      />
                      {t("medical.prescriptions.fields.prn", {
                        defaultValue: "По требованию",
                      })}
                    </label>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              className="staff-page-btn-secondary rx-add-item"
              onClick={addItem}
              disabled={submitting}
            >
              {t("medical.prescriptions.addItemButton", {
                defaultValue: "+ Добавить препарат",
              })}
            </button>
          </fieldset>

          {/* General notes */}
          <fieldset className="med-fieldset">
            <legend>
              {t("medical.prescriptions.generalNotesTitle", {
                defaultValue: "Общие указания",
              })}
              <span className="patients-form-optional">
                {t("common.optional", { defaultValue: "необязательно" })}
              </span>
            </legend>
            <div className="patients-form-field">
              <textarea
                rows={2}
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                disabled={submitting}
                placeholder={t(
                  "medical.prescriptions.placeholders.generalNotes",
                  { defaultValue: "Контрольный осмотр через 2 недели" },
                )}
              />
            </div>
          </fieldset>

          {errors._form && (
            <div className="patients-form-error patients-form-error-banner">
              {errors._form}
            </div>
          )}
        </div>

        <div className="med-modal-foot">
          <button
            type="button"
            className="staff-page-btn-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            {t("common.cancel", { defaultValue: "Отмена" })}
          </button>
          <button
            type="button"
            className="staff-page-btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? t("common.submitting", { defaultValue: "Сохранение..." })
              : t("medical.prescriptions.issueButton", {
                  defaultValue: "Выписать рецепт",
                })}
          </button>
        </div>
      </div>
    </div>
  );
}
