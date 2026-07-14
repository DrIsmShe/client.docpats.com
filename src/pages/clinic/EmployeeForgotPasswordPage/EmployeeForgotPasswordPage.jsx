// client/src/pages/clinic/EmployeeForgotPasswordPage/EmployeeForgotPasswordPage.jsx
//
// Шаг 1 восстановления пароля сотрудника: ввод email.
//
// ВАЖНО про UX: сервер намеренно отвечает 200 и на неизвестный адрес — чтобы по
// этой форме нельзя было проверять, работает ли человек в клинике. Поэтому мы
// НИКОГДА не показываем «такого сотрудника нет», а всегда рисуем один и тот же
// экран «письмо отправлено, если такой адрес у нас есть».
//
// Стили берём у страницы входа — экран должен выглядеть её продолжением.

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { employeeForgotPassword } from "../../../api/clinic";
import LanguageSwitcher from "../../../components/LanguageSwitcher";
import "../EmployeeLoginPage/employeeLoginPage.css";

export default function EmployeeForgotPasswordPage() {
  const { t, i18n } = useTranslation("clinic");

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [fieldError, setFieldError] = useState(null);

  useEffect(() => {
    const lang = (i18n.language || "en").split("-")[0];
    document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", lang);
  }, [i18n.language]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const value = email.trim().toLowerCase();
    if (!value) {
      setFieldError(t("employeeLogin.errors.emailRequired"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setFieldError(t("employeeLogin.errors.emailInvalid"));
      return;
    }
    setFieldError(null);

    setSubmitting(true);
    try {
      await employeeForgotPassword({ email: value });
      setSent(true);
    } catch (err) {
      // Сюда попадаем только при сетевой ошибке или 429 (слишком часто) —
      // «нет такого сотрудника» сервер ошибкой не считает.
      const status = err.response?.status;
      setError(
        status === 429
          ? t("employeeForgotPassword.errors.tooMany")
          : t("employeeLogin.errors.generic"),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="employee-login">
      <header className="employee-login-header">
        <Link to="/" className="employee-login-brand">
          <span className="employee-login-brand-mark">DP</span>
          <span className="employee-login-brand-name">
            {t("layout.brandName")}
          </span>
        </Link>
        <LanguageSwitcher />
      </header>

      <main className="employee-login-main">
        {sent ? (
          <div className="employee-login-card">
            <div className="employee-login-icon">📬</div>
            <h1>{t("employeeForgotPassword.sentTitle")}</h1>
            <p className="employee-login-subtitle">
              {t("employeeForgotPassword.sentText", { email })}
            </p>
            <p className="employee-login-subtitle">
              {t("employeeForgotPassword.sentHint")}
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
        ) : (
          <form
            className="employee-login-card"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="employee-login-icon">🔑</div>
            <h1>{t("employeeForgotPassword.title")}</h1>
            <p className="employee-login-subtitle">
              {t("employeeForgotPassword.subtitle")}
            </p>

            {error && (
              <div className="employee-login-server-error">{error}</div>
            )}

            <div className="employee-login-field">
              <label htmlFor="email">
                {t("employeeLogin.fields.email")}{" "}
                <span className="required">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldError) setFieldError(null);
                }}
                placeholder={t("employeeLogin.fields.emailPlaceholder")}
                disabled={submitting}
                className={fieldError ? "has-error" : ""}
                autoComplete="email"
                autoFocus
              />
              {fieldError && (
                <div className="employee-login-field-error">{fieldError}</div>
              )}
            </div>

            <button
              type="submit"
              className="employee-login-btn-primary"
              disabled={submitting}
            >
              {submitting
                ? t("employeeForgotPassword.submitting")
                : t("employeeForgotPassword.submit")}
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
        )}
      </main>
    </div>
  );
}
