// client/src/pages/clinic/CreateClinicPage/CreateClinicPage.jsx
//
// Form to create a new clinic. The current user becomes its owner.
// On success, redirects to /clinic/dashboard.

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createClinic } from "../../../api/clinic";
import "./createClinicPage.css";

const LANGUAGES = [
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
  { value: "tr", label: "Türkçe" },
  { value: "az", label: "Azərbaycanca" },
  { value: "ar", label: "العربية" },
];

const CURRENCIES = [
  { value: "AZN", label: "Azerbaijani Manat (₼)" },
  { value: "USD", label: "US Dollar ($)" },
  { value: "EUR", label: "Euro (€)" },
  { value: "RUB", label: "Russian Ruble (₽)" },
  { value: "TRY", label: "Turkish Lira (₺)" },
];

const TIMEZONES = [
  { value: "Asia/Baku", label: "Baku (UTC+4)" },
  { value: "Europe/Moscow", label: "Moscow (UTC+3)" },
  { value: "Europe/Istanbul", label: "Istanbul (UTC+3)" },
  { value: "Europe/London", label: "London (UTC+0/+1)" },
  { value: "Europe/Berlin", label: "Berlin (UTC+1/+2)" },
  { value: "Asia/Dubai", label: "Dubai (UTC+4)" },
  { value: "America/New_York", label: "New York (UTC-5/-4)" },
];

export default function CreateClinicPage() {
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
      newErrors.name = "Clinic name is required";
    } else if (form.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    } else if (form.name.trim().length > 200) {
      newErrors.name = "Name must be 200 characters or less";
    }

    if (form.slug && !/^[a-z0-9-]+$/.test(form.slug)) {
      newErrors.slug =
        "Slug can only contain lowercase letters, numbers, and hyphens";
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Invalid email address";
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
        // Zod validation errors from backend
        const fieldErrors = {};
        for (const issue of data.details.issues) {
          const field = issue.path?.[0];
          if (field) {
            fieldErrors[field] = issue.message;
          }
        }
        setErrors(fieldErrors);
        setServerError("Please fix the errors below");
      } else if (status === 409) {
        setErrors({ slug: "This slug is already taken" });
        setServerError("A clinic with this slug already exists");
      } else {
        setServerError(
          data?.error || "Failed to create clinic. Please try again.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="create-clinic">
      <div className="create-clinic-header">
        <Link to="/clinic" className="create-clinic-back">
          ← Back
        </Link>
        <h1>Create a clinic</h1>
        <p>Set up your clinic workspace. You'll be the owner.</p>
      </div>

      <form className="create-clinic-form" onSubmit={handleSubmit} noValidate>
        {serverError && (
          <div className="create-clinic-server-error">{serverError}</div>
        )}

        <div className="create-clinic-field">
          <label htmlFor="name">
            Clinic name <span className="required">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={handleChange("name")}
            placeholder="My Medical Center"
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
            URL slug <span className="optional">(optional)</span>
          </label>
          <input
            id="slug"
            type="text"
            value={form.slug}
            onChange={handleChange("slug")}
            placeholder="my-medical-center"
            disabled={submitting}
            className={errors.slug ? "has-error" : ""}
          />
          <div className="create-clinic-hint">
            Used for your public clinic page. Auto-generated from name if left
            blank.
          </div>
          {errors.slug && (
            <div className="create-clinic-error">{errors.slug}</div>
          )}
        </div>

        <div className="create-clinic-row">
          <div className="create-clinic-field">
            <label htmlFor="defaultLanguage">Default language</label>
            <select
              id="defaultLanguage"
              value={form.defaultLanguage}
              onChange={handleChange("defaultLanguage")}
              disabled={submitting}
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          <div className="create-clinic-field">
            <label htmlFor="defaultCurrency">Default currency</label>
            <select
              id="defaultCurrency"
              value={form.defaultCurrency}
              onChange={handleChange("defaultCurrency")}
              disabled={submitting}
            >
              {CURRENCIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="create-clinic-field">
          <label htmlFor="timezone">Timezone</label>
          <select
            id="timezone"
            value={form.timezone}
            onChange={handleChange("timezone")}
            disabled={submitting}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>

        <div className="create-clinic-section">
          <h3>Contact information</h3>
          <p className="create-clinic-section-hint">
            Optional. You can change these later in settings.
          </p>
        </div>

        <div className="create-clinic-row">
          <div className="create-clinic-field">
            <label htmlFor="phone">Phone</label>
            <input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange("phone")}
              placeholder="+994 50 123 45 67"
              disabled={submitting}
            />
          </div>

          <div className="create-clinic-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={handleChange("email")}
              placeholder="info@myclinic.com"
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
            Cancel
          </Link>
          <button
            type="submit"
            className="create-clinic-submit"
            disabled={submitting}
          >
            {submitting ? "Creating..." : "Create clinic"}
          </button>
        </div>
      </form>
    </div>
  );
}
