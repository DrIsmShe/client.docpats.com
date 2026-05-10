// client/src/pages/clinic/CreateClinicPage/CreateClinicPage.jsx

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { createClinic } from "../../../api/clinic";
import "./createClinicPage.css";

const LANGUAGE_CODES = ["ru", "en", "tr", "az", "ar"];
const CURRENCY_CODES = ["AZN", "USD", "EUR", "RUB", "TRY"];
const TIMEZONE_CODES = [
  "Asia/Baku",
  "Europe/Moscow",
  "Europe/Istanbul",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Dubai",
  "America/New_York",
];

export default function CreateClinicPage() {
  const { t } = useTranslation("clinic");
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    slug: "",
    timezone: "Asia/Baku",
    defaultCurrency: "AZN",
    defaultLanguage: "az",
    phone: "",
    email: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);

  function handleChange(field) {
    return (e) => {
      const value = e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };
  }

  function validate() {
    const newErrors = {};
    if (!form.name.trim()) {
      newErrors.name = t("createClinic.errors.nameRequired");
    } else if (form.name.trim().length < 2) {
      newErrors.name = t("createClinic.errors.nameMinLength");
    } else if (form.name.trim().length > 200) {
      newErrors.name = t("createClinic.errors.nameMaxLength");
    }
    if (form.slug && !/^[a-z0-9-]+$/.test(form.slug)) {
      newErrors.slug = t("createClinic.errors.slugFormat");
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = t("createClinic.errors.emailFormat");
    }
    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError(null);

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: form.name.trim(),
        timezone: form.timezone,
        defaultCurrency: form.defaultCurrency,
        defaultLanguage: form.defaultLanguage,
      };
      if (form.slug.trim()) {
        payload.slug = form.slug.trim();
      }
      const contacts = {};
      if (form.phone.trim()) contacts.phone = form.phone.trim();
      if (form.email.trim()) contacts.email = form.email.trim();
      if (Object.keys(contacts).length > 0) {
        payload.contacts = contacts;
      }

      await createClinic(payload);
      navigate("/clinic/dashboard", { replace: true });
    } catch (err) {
      console.error("Failed to create clinic:", err);
      const status = err.response?.status;
      const data = err.response?.data;

      if (status === 400 && data?.details?.issues) {
        const fieldErrors = {};
        for (const issue of data.details.issues) {
          const field = issue.path?.[0];
          if (field) fieldErrors[field] = issue.message;
        }
        setErrors(fieldErrors);
        setServerError(t("createClinic.errors.fixErrors"));
      } else if (status === 409) {
        setErrors({ slug: t("createClinic.errors.slugTaken") });
        setServerError(t("createClinic.errors.duplicate"));
      } else {
        setServerError(data?.error || t("createClinic.errors.generic"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="create-clinic">
      <div className="create-clinic-header">
        <Link to="/clinic" className="create-clinic-back">
          ← {t("createClinic.back")}
        </Link>
        <h1>{t("createClinic.title")}</h1>
        <p>{t("createClinic.subtitle")}</p>
      </div>

      <form className="create-clinic-form" onSubmit={handleSubmit} noValidate>
        {serverError && (
          <div className="create-clinic-server-error">{serverError}</div>
        )}

        <div className="create-clinic-field">
          <label htmlFor="name">
            {t("createClinic.fields.name")} <span className="required">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={handleChange("name")}
            placeholder={t("createClinic.fields.namePlaceholder")}
            disabled={submitting}
            maxLength={200}
            className={errors.name ? "has-error" : ""}
          />
          {errors.name && (
            <div className="create-clinic-error">{errors.name}</div>
          )}
        </div>

        <div className="create-clinic-field">
          <label htmlFor="slug">
            {t("createClinic.fields.slug")}{" "}
            <span className="optional">{t("common.optional")}</span>
          </label>
          <input
            id="slug"
            type="text"
            value={form.slug}
            onChange={handleChange("slug")}
            placeholder={t("createClinic.fields.slugPlaceholder")}
            disabled={submitting}
            className={errors.slug ? "has-error" : ""}
          />
          <div className="create-clinic-hint">
            {t("createClinic.fields.slugHint")}
          </div>
          {errors.slug && (
            <div className="create-clinic-error">{errors.slug}</div>
          )}
        </div>

        <div className="create-clinic-row">
          <div className="create-clinic-field">
            <label htmlFor="defaultLanguage">
              {t("createClinic.fields.defaultLanguage")}
            </label>
            <select
              id="defaultLanguage"
              value={form.defaultLanguage}
              onChange={handleChange("defaultLanguage")}
              disabled={submitting}
            >
              {LANGUAGE_CODES.map((code) => (
                <option key={code} value={code}>
                  {t(`languages.${code}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="create-clinic-field">
            <label htmlFor="defaultCurrency">
              {t("createClinic.fields.defaultCurrency")}
            </label>
            <select
              id="defaultCurrency"
              value={form.defaultCurrency}
              onChange={handleChange("defaultCurrency")}
              disabled={submitting}
            >
              {CURRENCY_CODES.map((code) => (
                <option key={code} value={code}>
                  {t(`currencies.${code}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="create-clinic-field">
          <label htmlFor="timezone">{t("createClinic.fields.timezone")}</label>
          <select
            id="timezone"
            value={form.timezone}
            onChange={handleChange("timezone")}
            disabled={submitting}
          >
            {TIMEZONE_CODES.map((tz) => (
              <option key={tz} value={tz}>
                {t(`timezones.${tz}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="create-clinic-section">
          <h3>{t("createClinic.fields.contactsSection")}</h3>
          <p className="create-clinic-section-hint">
            {t("createClinic.fields.contactsHint")}
          </p>
        </div>

        <div className="create-clinic-row">
          <div className="create-clinic-field">
            <label htmlFor="phone">{t("createClinic.fields.phone")}</label>
            <input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange("phone")}
              placeholder={t("createClinic.fields.phonePlaceholder")}
              disabled={submitting}
            />
          </div>

          <div className="create-clinic-field">
            <label htmlFor="email">{t("createClinic.fields.email")}</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={handleChange("email")}
              placeholder={t("createClinic.fields.emailPlaceholder")}
              disabled={submitting}
              className={errors.email ? "has-error" : ""}
            />
            {errors.email && (
              <div className="create-clinic-error">{errors.email}</div>
            )}
          </div>
        </div>

        <div className="create-clinic-actions">
          <Link to="/clinic" className="create-clinic-cancel">
            {t("common.cancel")}
          </Link>
          <button
            type="submit"
            className="create-clinic-submit"
            disabled={submitting}
          >
            {submitting ? t("createClinic.creating") : t("createClinic.submit")}
          </button>
        </div>
      </form>
    </div>
  );
}
