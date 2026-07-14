// client/src/pages/clinic/EmployeeResetPasswordPage/EmployeeResetPasswordPage.jsx
//
// Шаг 2 восстановления: сотрудник пришёл по ссылке из письма
// (/clinic/staff-reset-password?token=...) и вводит код из того же письма
// плюс новый пароль. Нужны ОБЕ половины — одной ссылки недостаточно.
//
// Три состояния экрана:
//   checking → проверяем ссылку через GET (до показа формы)
//   invalid  → ссылка мертва (истекла, уже использована или сожжена попытками)
//   форма    → показываем маскированный email, поля кода и пароля
//
// Стили берём у страницы входа — экран должен выглядеть её продолжением.

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  getEmployeeResetContext,
  employeeResetPassword,
} from "../../../api/clinic";
import LanguageSwitcher from "../../../components/LanguageSwitcher";
import "../EmployeeLoginPage/employeeLoginPage.css";

const MIN_PASSWORD_LENGTH = 8; // должно совпадать с employeePassword.schemas.js

export default function EmployeeResetPasswordPage() {
  const { t, i18n } = useTranslation("clinic");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [status, setStatus] = useState("checking"); // checking | valid | invalid
  const [maskedEmail, setMaskedEmail] = useState(null);
  const [attemptsLeft, setAttemptsLeft] = useState(null);

  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [done, setDone] = useState(false);

  useEffect(() => {
    const lang = (i18n.language || "en").split("-")[0];
    document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", lang);
  }, [i18n.language]);

  // Проверяем ссылку до того, как человек начнёт что-то печатать: если она
  // протухла, честнее сказать сразу, а не после ввода пароля.
  const checkToken = useCallback(async () => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    try {
      const data = await getEmployeeResetContext(token);
      setMaskedEmail(data.maskedEmail || null);
      setAttemptsLeft(
        typeof data.attemptsLeft === "number" ? data.attemptsLeft : null,
      );
      setStatus("valid");
    } catch {
      setStatus("invalid");
    }
  }, [token]);

  useEffect(() => {
    checkToken();
  }, [checkToken]);

  function validate() {
    const errors = {};
    if (!/^\d{6}$/.test(otp.trim())) {
      errors.otp = t("employeeResetPassword.errors.otpFormat");
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      errors.password = t("employeeResetPassword.errors.passwordShort", {
        count: MIN_PASSWORD_LENGTH,
      });
    }
    if (password !== repeat) {
      errors.repeat = t("employeeResetPassword.errors.passwordMismatch");
    }
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const v = validate();
    if (Object.keys(v).length > 0) {
      setFieldErrors(v);
      return;
    }
    setFieldErrors({});

    setSubmitting(true);
    try {
      await employeeResetPassword({ token, otp: otp.trim(), password });
      setDone(true);
      // Даём прочитать сообщение об успехе и уводим на вход.
      setTimeout(() => navigate("/clinic/staff-login", { replace: true }), 2500);
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;

      if (status === 409) {
        // Ссылка мертва — форму дальше показывать бессмысленно.
        setStatus("invalid");
      } else if (status === 400) {
        const left = data?.details?.attemptsLeft;
        if (typeof left === "number") {
          setAttemptsLeft(left);
          setError(
            left > 0
              ? t("employeeResetPassword.errors.otpWrongWithAttempts", {
                  count: left,
                })
              : t("employeeResetPassword.errors.otpWrong"),
          );
        } else {
          // Пароль не прошёл проверку на сервере.
          setError(t("employeeLogin.errors.fixErrors"));
        }
      } else if (status === 429) {
        setError(t("employeeForgotPassword.errors.tooMany"));
      } else {
        setError(t("employeeLogin.errors.generic"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  const header = (
    <header className="employee-login-header">
      <Link to="/" className="employee-login-brand">
        <span className="employee-login-brand-mark">DP</span>
        <span className="employee-login-brand-name">
          {t("layout.brandName")}
        </span>
      </Link>
      <LanguageSwitcher />
    </header>
  );

  if (status === "checking") {
    return (
      <div className="employee-login">
        {header}
        <main className="employee-login-main">
          <div className="employee-login-card">
            <p className="employee-login-subtitle">
              {t("employeeResetPassword.checking")}
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="employee-login">
        {header}
        <main className="employee-login-main">
          <div className="employee-login-card">
            <div className="employee-login-icon">⚠️</div>
            <h1>{t("employeeResetPassword.invalidTitle")}</h1>
            <p className="employee-login-subtitle">
              {t("employeeResetPassword.invalidText")}
            </p>
            <Link
              to="/clinic/staff-forgot-password"
              className="employee-login-btn-primary"
              style={{ display: "block", textAlign: "center" }}
            >
              {t("employeeResetPassword.requestNew")}
            </Link>
            <div className="employee-login-footer">
              <Link
                to="/clinic/staff-login"
                className="employee-login-footer-link"
              >
                {t("employeeForgotPassword.backToLogin")}
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (done) {
    return (
      <div className="employee-login">
        {header}
        <main className="employee-login-main">
          <div className="employee-login-card">
            <div className="employee-login-icon">✅</div>
            <h1>{t("employeeResetPassword.successTitle")}</h1>
            <p className="employee-login-subtitle">
              {t("employeeResetPassword.successText")}
            </p>
            <div className="employee-login-footer">
              <Link
                to="/clinic/staff-login"
                className="employee-login-footer-link"
              >
                {t("employeeForgotPassword.backToLogin")}
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="employee-login">
      {header}
      <main className="employee-login-main">
        <form className="employee-login-card" onSubmit={handleSubmit} noValidate>
          <div className="employee-login-icon">🔐</div>
          <h1>{t("employeeResetPassword.title")}</h1>
          <p className="employee-login-subtitle">
            {maskedEmail
              ? t("employeeResetPassword.subtitleWithEmail", {
                  email: maskedEmail,
                })
              : t("employeeResetPassword.subtitle")}
          </p>

          {error && <div className="employee-login-server-error">{error}</div>}

          <div className="employee-login-field">
            <label htmlFor="otp">
              {t("employeeResetPassword.fields.otp")}{" "}
              <span className="required">*</span>
            </label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, ""));
                if (fieldErrors.otp) {
                  setFieldErrors((p) => ({ ...p, otp: undefined }));
                }
              }}
              placeholder="000000"
              disabled={submitting}
              className={fieldErrors.otp ? "has-error" : ""}
              autoComplete="one-time-code"
              autoFocus
            />
            {fieldErrors.otp && (
              <div className="employee-login-field-error">{fieldErrors.otp}</div>
            )}
            {typeof attemptsLeft === "number" && attemptsLeft < 3 && (
              <div className="employee-login-field-error">
                {t("employeeResetPassword.attemptsLeft", {
                  count: attemptsLeft,
                })}
              </div>
            )}
          </div>

          <div className="employee-login-field">
            <label htmlFor="password">
              {t("employeeResetPassword.fields.newPassword")}{" "}
              <span className="required">*</span>
            </label>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((p) => ({ ...p, password: undefined }));
                }
              }}
              disabled={submitting}
              className={fieldErrors.password ? "has-error" : ""}
              autoComplete="new-password"
            />
            {fieldErrors.password && (
              <div className="employee-login-field-error">
                {fieldErrors.password}
              </div>
            )}
          </div>

          <div className="employee-login-field">
            <label htmlFor="repeat">
              {t("employeeResetPassword.fields.repeatPassword")}{" "}
              <span className="required">*</span>
            </label>
            <input
              id="repeat"
              type={showPassword ? "text" : "password"}
              value={repeat}
              onChange={(e) => {
                setRepeat(e.target.value);
                if (fieldErrors.repeat) {
                  setFieldErrors((p) => ({ ...p, repeat: undefined }));
                }
              }}
              disabled={submitting}
              className={fieldErrors.repeat ? "has-error" : ""}
              autoComplete="new-password"
            />
            {fieldErrors.repeat && (
              <div className="employee-login-field-error">
                {fieldErrors.repeat}
              </div>
            )}
          </div>

          <label className="employee-login-show-password">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              disabled={submitting}
            />{" "}
            {t("employeeResetPassword.showPassword")}
          </label>

          <button
            type="submit"
            className="employee-login-btn-primary"
            disabled={submitting}
          >
            {submitting
              ? t("employeeResetPassword.submitting")
              : t("employeeResetPassword.submit")}
          </button>

          <div className="employee-login-footer">
            <Link
              to="/clinic/staff-login"
              className="employee-login-footer-link"
            >
              {t("employeeForgotPassword.backToLogin")}
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
