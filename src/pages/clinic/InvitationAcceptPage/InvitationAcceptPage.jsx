// client/src/pages/clinic/InvitationAcceptPage/InvitationAcceptPage.jsx
//
// Public page reached via the email invitation link.
// 3-step wizard:
//   1) Auto preview by token (loads clinic name, role, email)
//   2) Request OTP code (sent to invitation email)
//   3) Accept: enter OTP, name, password → register as ClinicEmployee
// On success, redirects to /clinic/staff-login.

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  previewInvitation,
  requestInvitationOtp,
  acceptInvitation,
} from "../../../api/clinic";
import LanguageSwitcher from "../../../components/LanguageSwitcher";
import "./invitationAcceptPage.css";

const RESEND_COUNTDOWN_SECONDS = 60;

export default function InvitationAcceptPage() {
  const { t, i18n } = useTranslation("clinic");
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token");

  // ─── Wizard state ───
  // "loading" → "preview" → "otp" → "accept" → "success"
  // or → "error"
  const [step, setStep] = useState("loading");
  const [errorCode, setErrorCode] = useState(null); // "expired" | "invalid" | "used" | "generic"
  const [errorMessage, setErrorMessage] = useState(null);

  // Preview data
  const [preview, setPreview] = useState(null);

  // OTP step
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Accept form
  const [form, setForm] = useState({
    otp: "",
    firstName: "",
    lastName: "",
    password: "",
    passwordConfirm: "",
    phoneNumber: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);

  // ─── RTL support ───
  useEffect(() => {
    const lang = (i18n.language || "en").split("-")[0];
    document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", lang);
  }, [i18n.language]);

  // ─── Load preview on mount ───
  useEffect(() => {
    if (!token) {
      setStep("error");
      setErrorCode("invalid");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const data = await previewInvitation(token);
        if (cancelled) return;
        setPreview(data);
        setStep("preview");
      } catch (err) {
        if (cancelled) return;
        const status = err.response?.status;
        const code = err.response?.data?.code;
        if (status === 404) {
          setErrorCode("invalid");
        } else if (status === 410 || code === "EXPIRED") {
          setErrorCode("expired");
        } else if (status === 409 || code === "ALREADY_USED") {
          setErrorCode("used");
        } else {
          setErrorCode("generic");
          setErrorMessage(err.response?.data?.error || err.message);
        }
        setStep("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  // ─── Resend countdown ───
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => {
      setResendCountdown((s) => s - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  // ─── Step 2: Request OTP ───
  const handleRequestOtp = useCallback(async () => {
    if (requestingOtp || resendCountdown > 0) return;
    setRequestingOtp(true);
    setSubmitError(null);
    try {
      await requestInvitationOtp(token);
      setStep("accept");
      setResendCountdown(RESEND_COUNTDOWN_SECONDS);
    } catch (err) {
      const status = err.response?.status;
      if (status === 429) {
        setSubmitError(t("acceptInvitation.errors.tooManyRequests"));
      } else {
        setSubmitError(
          err.response?.data?.error || t("acceptInvitation.errors.otpGeneric"),
        );
      }
    } finally {
      setRequestingOtp(false);
    }
  }, [token, requestingOtp, resendCountdown, t]);

  // ─── Step 3: Accept form helpers ───
  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setForm((p) => ({ ...p, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((p) => ({ ...p, [field]: undefined }));
    }
  };

  function validate() {
    const errors = {};
    if (!form.otp.trim()) {
      errors.otp = t("acceptInvitation.errors.otpRequired");
    } else if (!/^\d{6}$/.test(form.otp.trim())) {
      errors.otp = t("acceptInvitation.errors.otpFormat");
    }
    if (!form.firstName.trim()) {
      errors.firstName = t("acceptInvitation.errors.firstNameRequired");
    }
    if (!form.lastName.trim()) {
      errors.lastName = t("acceptInvitation.errors.lastNameRequired");
    }
    if (!form.password) {
      errors.password = t("acceptInvitation.errors.passwordRequired");
    } else if (form.password.length < 8) {
      errors.password = t("acceptInvitation.errors.passwordMinLength");
    }
    if (form.password !== form.passwordConfirm) {
      errors.passwordConfirm = t("acceptInvitation.errors.passwordMismatch");
    }
    return errors;
  }

  async function handleAccept(e) {
    e.preventDefault();
    setSubmitError(null);
    const v = validate();
    if (Object.keys(v).length > 0) {
      setFieldErrors(v);
      return;
    }

    setSubmitting(true);
    try {
      await acceptInvitation({
        token,
        otp: form.otp.trim(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        ...(form.phoneNumber.trim() && {
          phoneNumber: form.phoneNumber.trim(),
        }),
        language: (i18n.language || "en").split("-")[0],
      });
      setStep("success");
      // Redirect to staff login after a short delay
      setTimeout(() => {
        navigate("/clinic/staff-login", {
          replace: true,
          state: { email: preview?.email },
        });
      }, 2000);
    } catch (err) {
      const status = err.response?.status;
      const code = err.response?.data?.code;
      const data = err.response?.data;

      if (status === 400 && data?.details?.issues) {
        const fe = {};
        for (const issue of data.details.issues) {
          const field = issue.path?.[0];
          if (field) fe[field] = issue.message;
        }
        setFieldErrors(fe);
        setSubmitError(t("acceptInvitation.errors.fixErrors"));
      } else if (status === 401 || code === "INVALID_OTP") {
        setFieldErrors({ otp: t("acceptInvitation.errors.otpWrong") });
      } else if (status === 410 || code === "OTP_EXPIRED") {
        setFieldErrors({ otp: t("acceptInvitation.errors.otpExpired") });
      } else if (status === 429) {
        setSubmitError(t("acceptInvitation.errors.tooManyAttempts"));
      } else {
        setSubmitError(data?.error || t("acceptInvitation.errors.generic"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Render ───

  return (
    <div className="invite-accept">
      <header className="invite-accept-header">
        <Link to="/" className="invite-accept-brand">
          <span className="invite-accept-brand-mark">DP</span>
          <span className="invite-accept-brand-name">
            {t("layout.brandName")}
          </span>
        </Link>
        <LanguageSwitcher />
      </header>

      <main className="invite-accept-main">
        {step === "loading" && (
          <div className="invite-accept-card invite-accept-loading">
            <div className="invite-accept-spinner" />
            <p>{t("common.loading")}</p>
          </div>
        )}

        {step === "error" && (
          <ErrorState errorCode={errorCode} errorMessage={errorMessage} t={t} />
        )}

        {step === "preview" && preview && (
          <PreviewState
            preview={preview}
            requestingOtp={requestingOtp}
            onContinue={handleRequestOtp}
            t={t}
          />
        )}

        {step === "accept" && preview && (
          <AcceptForm
            preview={preview}
            form={form}
            fieldErrors={fieldErrors}
            submitError={submitError}
            submitting={submitting}
            onChange={handleChange}
            onSubmit={handleAccept}
            onResendOtp={handleRequestOtp}
            resendCountdown={resendCountdown}
            requestingOtp={requestingOtp}
            t={t}
          />
        )}

        {step === "success" && <SuccessState preview={preview} t={t} />}
      </main>
    </div>
  );
}

// ─── Sub-components ───

function ErrorState({ errorCode, errorMessage, t }) {
  const titleKey =
    errorCode === "expired"
      ? "acceptInvitation.errorStates.expired.title"
      : errorCode === "used"
        ? "acceptInvitation.errorStates.used.title"
        : errorCode === "invalid"
          ? "acceptInvitation.errorStates.invalid.title"
          : "acceptInvitation.errorStates.generic.title";
  const descKey =
    errorCode === "expired"
      ? "acceptInvitation.errorStates.expired.description"
      : errorCode === "used"
        ? "acceptInvitation.errorStates.used.description"
        : errorCode === "invalid"
          ? "acceptInvitation.errorStates.invalid.description"
          : "acceptInvitation.errorStates.generic.description";

  return (
    <div className="invite-accept-card invite-accept-error">
      <div className="invite-accept-icon">⚠️</div>
      <h1>{t(titleKey)}</h1>
      <p>{t(descKey)}</p>
      {errorMessage && (
        <p className="invite-accept-error-detail">{errorMessage}</p>
      )}
      <Link to="/" className="invite-accept-btn-secondary">
        {t("acceptInvitation.backToHome")}
      </Link>
    </div>
  );
}

function PreviewState({ preview, requestingOtp, onContinue, t }) {
  const roleLabel = t(`roles.${preview.role}`, { defaultValue: preview.role });

  return (
    <div className="invite-accept-card">
      <div className="invite-accept-icon">🏥</div>
      <h1>{t("acceptInvitation.preview.title")}</h1>
      <p className="invite-accept-subtitle">
        {t("acceptInvitation.preview.subtitle", {
          clinicName: preview.clinicName || preview.clinic?.name,
        })}
      </p>

      <div className="invite-accept-info">
        <div className="invite-accept-info-row">
          <span className="invite-accept-info-label">
            {t("acceptInvitation.preview.clinic")}
          </span>
          <span className="invite-accept-info-value">
            {preview.clinicName || preview.clinic?.name || "—"}
          </span>
        </div>
        <div className="invite-accept-info-row">
          <span className="invite-accept-info-label">
            {t("acceptInvitation.preview.role")}
          </span>
          <span className="invite-accept-info-value">
            <span className={`invite-accept-role-badge role-${preview.role}`}>
              {roleLabel}
            </span>
          </span>
        </div>
        <div className="invite-accept-info-row">
          <span className="invite-accept-info-label">
            {t("acceptInvitation.preview.email")}
          </span>
          <span className="invite-accept-info-value">{preview.email}</span>
        </div>
      </div>

      <p className="invite-accept-hint">
        {t("acceptInvitation.preview.continueHint")}
      </p>

      <button
        type="button"
        className="invite-accept-btn-primary"
        onClick={onContinue}
        disabled={requestingOtp}
      >
        {requestingOtp
          ? t("acceptInvitation.preview.sending")
          : t("acceptInvitation.preview.continue")}
      </button>
    </div>
  );
}

function AcceptForm({
  preview,
  form,
  fieldErrors,
  submitError,
  submitting,
  onChange,
  onSubmit,
  onResendOtp,
  resendCountdown,
  requestingOtp,
  t,
}) {
  return (
    <form className="invite-accept-card" onSubmit={onSubmit} noValidate>
      <div className="invite-accept-icon">📨</div>
      <h1>{t("acceptInvitation.accept.title")}</h1>
      <p className="invite-accept-subtitle">
        {t("acceptInvitation.accept.subtitle", { email: preview.email })}
      </p>

      {submitError && (
        <div className="invite-accept-server-error">{submitError}</div>
      )}

      <div className="invite-accept-field">
        <label htmlFor="otp">
          {t("acceptInvitation.fields.otp")} <span className="required">*</span>
        </label>
        <input
          id="otp"
          type="text"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          autoComplete="one-time-code"
          value={form.otp}
          onChange={onChange("otp")}
          placeholder="123456"
          className={`invite-accept-otp-input ${fieldErrors.otp ? "has-error" : ""}`}
          disabled={submitting}
          autoFocus
        />
        {fieldErrors.otp && (
          <div className="invite-accept-field-error">{fieldErrors.otp}</div>
        )}
        <button
          type="button"
          className="invite-accept-resend"
          onClick={onResendOtp}
          disabled={resendCountdown > 0 || requestingOtp || submitting}
        >
          {resendCountdown > 0
            ? t("acceptInvitation.accept.resendIn", {
                seconds: resendCountdown,
              })
            : requestingOtp
              ? t("acceptInvitation.preview.sending")
              : t("acceptInvitation.accept.resend")}
        </button>
      </div>

      <div className="invite-accept-row">
        <div className="invite-accept-field">
          <label htmlFor="firstName">
            {t("acceptInvitation.fields.firstName")}{" "}
            <span className="required">*</span>
          </label>
          <input
            id="firstName"
            type="text"
            value={form.firstName}
            onChange={onChange("firstName")}
            disabled={submitting}
            className={fieldErrors.firstName ? "has-error" : ""}
            maxLength={100}
          />
          {fieldErrors.firstName && (
            <div className="invite-accept-field-error">
              {fieldErrors.firstName}
            </div>
          )}
        </div>

        <div className="invite-accept-field">
          <label htmlFor="lastName">
            {t("acceptInvitation.fields.lastName")}{" "}
            <span className="required">*</span>
          </label>
          <input
            id="lastName"
            type="text"
            value={form.lastName}
            onChange={onChange("lastName")}
            disabled={submitting}
            className={fieldErrors.lastName ? "has-error" : ""}
            maxLength={100}
          />
          {fieldErrors.lastName && (
            <div className="invite-accept-field-error">
              {fieldErrors.lastName}
            </div>
          )}
        </div>
      </div>

      <div className="invite-accept-field">
        <label htmlFor="phoneNumber">
          {t("acceptInvitation.fields.phoneNumber")}{" "}
          <span className="optional">{t("common.optional")}</span>
        </label>
        <input
          id="phoneNumber"
          type="tel"
          value={form.phoneNumber}
          onChange={onChange("phoneNumber")}
          placeholder="+994 50 123 45 67"
          disabled={submitting}
        />
      </div>

      <div className="invite-accept-field">
        <label htmlFor="password">
          {t("acceptInvitation.fields.password")}{" "}
          <span className="required">*</span>
        </label>
        <input
          id="password"
          type="password"
          value={form.password}
          onChange={onChange("password")}
          disabled={submitting}
          className={fieldErrors.password ? "has-error" : ""}
          autoComplete="new-password"
          minLength={8}
        />
        <div className="invite-accept-hint">
          {t("acceptInvitation.fields.passwordHint")}
        </div>
        {fieldErrors.password && (
          <div className="invite-accept-field-error">
            {fieldErrors.password}
          </div>
        )}
      </div>

      <div className="invite-accept-field">
        <label htmlFor="passwordConfirm">
          {t("acceptInvitation.fields.passwordConfirm")}{" "}
          <span className="required">*</span>
        </label>
        <input
          id="passwordConfirm"
          type="password"
          value={form.passwordConfirm}
          onChange={onChange("passwordConfirm")}
          disabled={submitting}
          className={fieldErrors.passwordConfirm ? "has-error" : ""}
          autoComplete="new-password"
        />
        {fieldErrors.passwordConfirm && (
          <div className="invite-accept-field-error">
            {fieldErrors.passwordConfirm}
          </div>
        )}
      </div>

      <button
        type="submit"
        className="invite-accept-btn-primary"
        disabled={submitting}
      >
        {submitting
          ? t("acceptInvitation.accept.submitting")
          : t("acceptInvitation.accept.submit")}
      </button>
    </form>
  );
}

function SuccessState({ preview, t }) {
  return (
    <div className="invite-accept-card invite-accept-success">
      <div className="invite-accept-icon">✅</div>
      <h1>{t("acceptInvitation.success.title")}</h1>
      <p>
        {t("acceptInvitation.success.subtitle", {
          clinicName: preview?.clinicName || preview?.clinic?.name || "",
        })}
      </p>
      <p className="invite-accept-hint">
        {t("acceptInvitation.success.redirecting")}
      </p>
    </div>
  );
}
