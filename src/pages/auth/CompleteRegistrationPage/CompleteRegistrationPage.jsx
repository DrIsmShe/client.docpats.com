// client/src/pages/auth/CompleteRegistrationPage/CompleteRegistrationPage.jsx
//
// Two-step activation page for provisional User accounts:
//
//   STEP 1 — form
//     Patient enters new email + new password + repeat password.
//     On submit: POST /auth/complete-provisional-registration/request
//                → backend generates OTP, emails it to newEmail,
//                  stashes pending state in session.
//                → frontend advances to STEP 2.
//
//   STEP 2 — OTP
//     6-digit code input (auto-advancing between cells, paste-friendly).
//     Patient enters the code received by email.
//     On submit: POST /auth/complete-provisional-registration/confirm
//                → backend verifies, applies changes to User, clears
//                  pending state and the middleware cache.
//                → frontend redirects to /patient/home-page.
//     "Send code again" link with 60s cooldown timer.
//
// Defensive UX:
//   - "Edit email" button on STEP 2 returns to STEP 1 with prior values.
//   - "Logout" link always present so patient can bail out.
//   - OTP cells: auto-focus next on type, auto-focus prev on backspace,
//     accepts pasted code, numbers only.

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "../../../axios";
import "./completeRegistrationPage.css";

const RESEND_COOLDOWN_SEC = 60;

export default function CompleteRegistrationPage() {
  const { t } = useTranslation("clinic");
  const navigate = useNavigate();

  // ─── Internal step state ───
  const [innerStep, setInnerStep] = useState(1); // 1 = form, 2 = otp

  // ─── STEP 1 state ───
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // ─── STEP 2 state ───
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [emailMasked, setEmailMasked] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0); // seconds left
  const otpRefs = useRef([]);

  // ─── Shared state ───
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // ─── Resend cooldown ticker ───
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendCooldown]);

  // ─── Auto-focus first OTP cell on entering step 2 ───
  useEffect(() => {
    if (innerStep === 2) {
      // Small delay so the DOM has time to mount the input
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    }
  }, [innerStep]);

  // ──────────────────────────────────────────────────────────────────
  // STEP 1 — submit form
  // ──────────────────────────────────────────────────────────────────

  function validateStep1() {
    const errs = {};
    if (!newEmail.trim()) {
      errs.email = t("completeRegistration.errors.emailRequired", {
        defaultValue: "Введите новый email",
      });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
      errs.email = t("completeRegistration.errors.emailInvalid", {
        defaultValue: "Неверный формат email",
      });
    }
    if (!newPassword) {
      errs.password = t("completeRegistration.errors.passwordRequired", {
        defaultValue: "Введите пароль",
      });
    } else if (newPassword.length < 8) {
      errs.password = t("completeRegistration.errors.passwordShort", {
        defaultValue: "Минимум 8 символов",
      });
    }
    if (newPassword !== repeatPassword) {
      errs.repeatPassword = t("completeRegistration.errors.passwordMismatch", {
        defaultValue: "Пароли не совпадают",
      });
    }
    return errs;
  }

  async function handleSubmitStep1(e) {
    e.preventDefault();
    setError(null);

    const errs = validateStep1();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);

    try {
      const res = await axios.post(
        "/auth/complete-provisional-registration/request",
        {
          newEmail: newEmail.trim().toLowerCase(),
          newPassword,
        },
      );
      // Backend returns { emailMasked: "ism***@example.com" }
      setEmailMasked(res.data?.emailMasked || newEmail);
      setResendCooldown(RESEND_COOLDOWN_SEC);
      setOtpDigits(["", "", "", "", "", ""]);
      setInnerStep(2);
    } catch (err) {
      console.error("activation request failed:", err);
      const status = err.response?.status;
      const data = err.response?.data;

      if (status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      if (status === 409) {
        setFieldErrors({
          email: t("completeRegistration.errors.emailTaken", {
            defaultValue: "Этот email уже используется",
          }),
        });
        return;
      }
      if (status === 403) {
        setError(
          t("completeRegistration.errors.notProvisional", {
            defaultValue:
              "Этот аккаунт не требует активации. Перейдите в личный кабинет.",
          }),
        );
        return;
      }
      // Validation 400 with zod issues
      if (status === 400 && data?.details?.issues) {
        const fe = {};
        for (const issue of data.details.issues) {
          const path = issue.path?.[0];
          if (path === "newEmail") fe.email = issue.message;
          else if (path === "newPassword") fe.password = issue.message;
        }
        if (Object.keys(fe).length > 0) {
          setFieldErrors(fe);
          return;
        }
      }
      setError(
        data?.error ||
          t("completeRegistration.errors.sendFailed", {
            defaultValue:
              "Не удалось отправить код. Проверьте интернет и попробуйте ещё раз.",
          }),
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ──────────────────────────────────────────────────────────────────
  // STEP 2 — OTP handling
  // ──────────────────────────────────────────────────────────────────

  function handleOtpChange(index, value) {
    // Strip non-digits, take at most 1 char
    const digit = value.replace(/\D/g, "").slice(0, 1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);

    // Auto-advance to next cell when a digit is typed
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index, e) {
    // Backspace on empty cell — go to previous cell
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    // Arrow keys for navigation between cells
    if (e.key === "ArrowLeft" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpPaste(e) {
    // Allow pasting the entire 6-digit code into any cell
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (pasted.length === 0) return;
    e.preventDefault();
    const next = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] || "";
    }
    setOtpDigits(next);
    // Focus the cell AFTER the last pasted digit, or the last cell
    const focusIdx = Math.min(pasted.length, 5);
    otpRefs.current[focusIdx]?.focus();
  }

  async function handleSubmitStep2(e) {
    e?.preventDefault?.();
    setError(null);

    const otp = otpDigits.join("");
    if (otp.length !== 6) {
      setError(
        t("completeRegistration.errors.otpIncomplete", {
          defaultValue: "Введите все 6 цифр кода",
        }),
      );
      return;
    }
    setSubmitting(true);

    try {
      await axios.post("/auth/complete-provisional-registration/confirm", {
        otp,
      });
      // Activation complete. Force full reload to clear stale state.
      window.location.assign("/patient/home-page");
    } catch (err) {
      console.error("activation confirm failed:", err);
      const status = err.response?.status;
      const data = err.response?.data;
      const code = data?.details?.code;

      if (status === 401) {
        navigate("/login", { replace: true });
        return;
      }

      // Backend signals via details.code which kind of failure
      if (code === "otp_expired") {
        setError(
          t("completeRegistration.errors.otpExpired", {
            defaultValue: "Код истёк. Запросите новый.",
          }),
        );
        setOtpDigits(["", "", "", "", "", ""]);
        return;
      }
      if (code === "too_many_attempts") {
        setError(
          t("completeRegistration.errors.otpTooManyAttempts", {
            defaultValue:
              "Слишком много неудачных попыток. Запросите новый код.",
          }),
        );
        setOtpDigits(["", "", "", "", "", ""]);
        return;
      }
      if (code === "otp_invalid") {
        const remaining = data?.details?.attemptsRemaining;
        setError(
          remaining != null
            ? t("completeRegistration.errors.otpInvalidWithCount", {
                defaultValue: `Неверный код. Осталось попыток: ${remaining}`,
                count: remaining,
              })
            : t("completeRegistration.errors.otpInvalid", {
                defaultValue: "Неверный код",
              }),
        );
        // Clear cells so user can retype, focus first
        setOtpDigits(["", "", "", "", "", ""]);
        setTimeout(() => otpRefs.current[0]?.focus(), 50);
        return;
      }
      if (code === "no_pending") {
        // Session lost the pending state — back to step 1
        setError(
          t("completeRegistration.errors.sessionLost", {
            defaultValue: "Сессия истекла. Начните заново.",
          }),
        );
        setInnerStep(1);
        return;
      }
      if (status === 409) {
        setError(
          t("completeRegistration.errors.emailRaced", {
            defaultValue:
              "Этот email только что зарегистрировал кто-то другой. Используйте другой email.",
          }),
        );
        setInnerStep(1);
        return;
      }
      setError(
        data?.error ||
          t("completeRegistration.errors.generic", {
            defaultValue:
              "Не удалось завершить регистрацию. Попробуйте ещё раз.",
          }),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0 || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await axios.post(
        "/auth/complete-provisional-registration/resend",
      );
      if (res.data?.emailMasked) setEmailMasked(res.data.emailMasked);
      setOtpDigits(["", "", "", "", "", ""]);
      setResendCooldown(RESEND_COOLDOWN_SEC);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } catch (err) {
      console.error("resend failed:", err);
      const data = err.response?.data;
      const code = data?.details?.code;
      if (code === "resend_cooldown") {
        const wait = data?.details?.retryAfterSeconds || RESEND_COOLDOWN_SEC;
        setResendCooldown(wait);
        return;
      }
      if (code === "no_pending") {
        setInnerStep(1);
        setError(
          t("completeRegistration.errors.sessionLost", {
            defaultValue: "Сессия истекла. Начните заново.",
          }),
        );
        return;
      }
      setError(
        data?.error ||
          t("completeRegistration.errors.resendFailed", {
            defaultValue: "Не удалось отправить код повторно.",
          }),
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ──────────────────────────────────────────────────────────────────
  // Logout
  // ──────────────────────────────────────────────────────────────────

  async function handleLogout() {
    try {
      await axios.post("/auth/logout");
    } catch {
      // ignore
    }
    window.location.assign("/login");
  }

  // ──────────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────────

  return (
    <div className="cr-root">
      <div className="cr-card">
        <div className="cr-brand">
          <div className="cr-brand-icon">🩺</div>
          <div className="cr-brand-name">
            Doc<span>Pats</span>
          </div>
        </div>

        {innerStep === 1 ? (
          <Step1Form
            t={t}
            newEmail={newEmail}
            setNewEmail={setNewEmail}
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            repeatPassword={repeatPassword}
            setRepeatPassword={setRepeatPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            error={error}
            fieldErrors={fieldErrors}
            submitting={submitting}
            onSubmit={handleSubmitStep1}
            onLogout={handleLogout}
          />
        ) : (
          <Step2Otp
            t={t}
            emailMasked={emailMasked}
            otpDigits={otpDigits}
            otpRefs={otpRefs}
            handleOtpChange={handleOtpChange}
            handleOtpKeyDown={handleOtpKeyDown}
            handleOtpPaste={handleOtpPaste}
            error={error}
            submitting={submitting}
            resendCooldown={resendCooldown}
            onSubmit={handleSubmitStep2}
            onResend={handleResend}
            onEditEmail={() => {
              setInnerStep(1);
              setError(null);
            }}
            onLogout={handleLogout}
          />
        )}
      </div>
    </div>
  );
}

// ─── STEP 1 sub-component ─────────────────────────────────────────────

function Step1Form({
  t,
  newEmail,
  setNewEmail,
  newPassword,
  setNewPassword,
  repeatPassword,
  setRepeatPassword,
  showPassword,
  setShowPassword,
  error,
  fieldErrors,
  submitting,
  onSubmit,
  onLogout,
}) {
  return (
    <>
      <h1 className="cr-title">
        {t("completeRegistration.title", {
          defaultValue: "Завершите регистрацию",
        })}
      </h1>

      <p className="cr-subtitle">
        {t("completeRegistration.subtitle", {
          defaultValue:
            "Это временный аккаунт, созданный клиникой. Замените временный email и пароль на свои.",
        })}
      </p>

      <div className="cr-benefits">
        <div className="cr-benefits-title">
          {t("completeRegistration.afterTitle", {
            defaultValue: "После активации вы получите:",
          })}
        </div>
        <ul>
          <li>
            {t("completeRegistration.benefit1", {
              defaultValue: "Доступ к результатам обследований из всех клиник",
            })}
          </li>
          <li>
            {t("completeRegistration.benefit2", {
              defaultValue: "Онлайн-консультации с врачами",
            })}
          </li>
          <li>
            {t("completeRegistration.benefit3", {
              defaultValue: "AI-помощник и полную историю болезни",
            })}
          </li>
        </ul>
      </div>

      {error && <div className="cr-alert">{error}</div>}

      <form onSubmit={onSubmit} noValidate>
        <div className="cr-field">
          <label htmlFor="newEmail">
            {t("completeRegistration.newEmail", {
              defaultValue: "Новый email",
            })}{" "}
            *
          </label>
          <input
            id="newEmail"
            type="email"
            autoComplete="email"
            autoFocus
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="you@example.com"
            className={fieldErrors.email ? "has-error" : ""}
          />
          {fieldErrors.email && (
            <span className="cr-field-error">{fieldErrors.email}</span>
          )}
          <span className="cr-field-hint">
            {t("completeRegistration.emailHint", {
              defaultValue:
                "На этот email мы пришлём код подтверждения. Это будет ваш постоянный email для входа.",
            })}
          </span>
        </div>

        <div className="cr-field">
          <label htmlFor="newPassword">
            {t("completeRegistration.newPassword", {
              defaultValue: "Новый пароль",
            })}{" "}
            *
          </label>
          <div className="cr-input-wrap">
            <input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className={fieldErrors.password ? "has-error" : ""}
            />
            <button
              type="button"
              className="cr-eye"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
            >
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>
          {fieldErrors.password && (
            <span className="cr-field-error">{fieldErrors.password}</span>
          )}
          <span className="cr-field-hint">
            {t("completeRegistration.passwordHint", {
              defaultValue: "Минимум 8 символов.",
            })}
          </span>
        </div>

        <div className="cr-field">
          <label htmlFor="repeatPassword">
            {t("completeRegistration.repeatPassword", {
              defaultValue: "Повторите пароль",
            })}{" "}
            *
          </label>
          <input
            id="repeatPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={repeatPassword}
            onChange={(e) => setRepeatPassword(e.target.value)}
            placeholder="••••••••"
            className={fieldErrors.repeatPassword ? "has-error" : ""}
          />
          {fieldErrors.repeatPassword && (
            <span className="cr-field-error">{fieldErrors.repeatPassword}</span>
          )}
        </div>

        <button type="submit" className="cr-submit" disabled={submitting}>
          {submitting
            ? t("common.submitting", { defaultValue: "Отправка..." })
            : t("completeRegistration.sendCode", {
                defaultValue: "Получить код подтверждения",
              })}
        </button>
      </form>

      <div className="cr-footer">
        <button type="button" className="cr-link" onClick={onLogout}>
          {t("completeRegistration.logoutLater", {
            defaultValue: "Активировать позже — выйти",
          })}
        </button>
      </div>
    </>
  );
}

// ─── STEP 2 sub-component ─────────────────────────────────────────────

function Step2Otp({
  t,
  emailMasked,
  otpDigits,
  otpRefs,
  handleOtpChange,
  handleOtpKeyDown,
  handleOtpPaste,
  error,
  submitting,
  resendCooldown,
  onSubmit,
  onResend,
  onEditEmail,
  onLogout,
}) {
  const otpComplete = otpDigits.every((d) => d !== "");

  return (
    <>
      <h1 className="cr-title">
        {t("completeRegistration.otp.title", {
          defaultValue: "Подтвердите email",
        })}
      </h1>

      <p className="cr-subtitle">
        {t("completeRegistration.otp.subtitle", {
          defaultValue: "Мы отправили 6-значный код на",
        })}{" "}
        <strong>{emailMasked}</strong>
        <br />
        <button
          type="button"
          className="cr-link cr-link-inline"
          onClick={onEditEmail}
        >
          {t("completeRegistration.otp.editEmail", {
            defaultValue: "Изменить email",
          })}
        </button>
      </p>

      {error && <div className="cr-alert">{error}</div>}

      <form onSubmit={onSubmit} noValidate>
        <div className="cr-otp-row">
          {otpDigits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => (otpRefs.current[i] = el)}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(i, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(i, e)}
              onPaste={i === 0 ? handleOtpPaste : undefined}
              className="cr-otp-cell"
              aria-label={`OTP digit ${i + 1}`}
            />
          ))}
        </div>

        <button
          type="submit"
          className="cr-submit"
          disabled={submitting || !otpComplete}
        >
          {submitting
            ? t("common.submitting", { defaultValue: "Отправка..." })
            : t("completeRegistration.otp.confirm", {
                defaultValue: "Активировать аккаунт",
              })}
        </button>
      </form>

      <div className="cr-resend">
        {resendCooldown > 0 ? (
          <span className="cr-resend-timer">
            {t("completeRegistration.otp.resendIn", {
              defaultValue: `Отправить код повторно через ${resendCooldown} с`,
              seconds: resendCooldown,
            })}
          </span>
        ) : (
          <button
            type="button"
            className="cr-link"
            onClick={onResend}
            disabled={submitting}
          >
            {t("completeRegistration.otp.resend", {
              defaultValue: "Отправить код повторно",
            })}
          </button>
        )}
      </div>

      <div className="cr-footer">
        <button type="button" className="cr-link" onClick={onLogout}>
          {t("completeRegistration.logoutLater", {
            defaultValue: "Активировать позже — выйти",
          })}
        </button>
      </div>
    </>
  );
}
