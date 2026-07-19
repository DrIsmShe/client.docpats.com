import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Syne:wght@400;600;700;800&display=swap');

  :root {
    --bg:       #111827;
    --surface:  #1c2333;
    --surface2: #222d40;
    --border:   #2d3a52;
    --accent:   #4f8bff;
    --accent2:  #8b5cf6;
    --green:    #34d399;
    --red:      #f87171;
    --yellow:   #fbbf24;
    --text:     #f1f5f9;
    --muted:    #8899b0;
    --mono:     'JetBrains Mono', monospace;
    --sans:     'Syne', sans-serif;
  }

  .dp-rpdc-root {
    min-height: 100vh;
    background: var(--bg);
    font-family: var(--sans);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 16px;
    position: relative;
    overflow: hidden;
  }

  .dp-rpdc-root::before {
    content: '';
    position: fixed;
    top: -200px; left: -200px;
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(139,92,246,.12) 0%, transparent 65%);
    pointer-events: none;
    animation: dp-pulse 7s ease-in-out infinite alternate;
  }
  .dp-rpdc-root::after {
    content: '';
    position: fixed;
    bottom: -150px; right: -150px;
    width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(79,139,255,.09) 0%, transparent 65%);
    pointer-events: none;
    animation: dp-pulse 9s ease-in-out infinite alternate-reverse;
  }
  @keyframes dp-pulse {
    from { transform: scale(1); opacity: 1; }
    to   { transform: scale(1.2); opacity: .6; }
  }

  .dp-grid {
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(79,139,255,.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(79,139,255,.035) 1px, transparent 1px);
    background-size: 48px 48px;
    pointer-events: none;
  }

  /* ── CARD ── */
  .dp-card {
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 460px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 24px;
    padding: 52px 48px 48px;
    box-shadow:
      0 0 0 1px rgba(79,139,255,.08),
      0 32px 80px rgba(0,0,0,.45),
      0 0 80px rgba(139,92,246,.07);
    animation: dp-fadein .5s ease both;
  }
  @keyframes dp-fadein {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── BRAND ── */
  .dp-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 32px;
  }
  .dp-brand-icon {
    width: 36px; height: 36px;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px;
    flex-shrink: 0;
  }
  .dp-brand-name {
    font-weight: 800;
    font-size: 21px;
    color: var(--text);
    letter-spacing: -.02em;
  }
  .dp-brand-name span { color: var(--accent); }
  .dp-brand-tag {
    margin-left: auto;
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: .12em;
    text-transform: uppercase;
    color: var(--accent2);
    background: rgba(139,92,246,.1);
    border: 1px solid rgba(139,92,246,.2);
    padding: 3px 8px;
    border-radius: 4px;
  }

  /* ── STEP FLOW ── */
  .dp-steps {
    display: flex;
    align-items: center;
    margin-bottom: 28px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 14px 18px;
    gap: 8px;
  }
  .dp-step-item {
    display: flex;
    align-items: center;
    gap: 7px;
    flex: 1;
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: .06em;
    text-transform: uppercase;
  }
  .dp-step-item.done   { color: var(--green); }
  .dp-step-item.active { color: var(--accent); }
  .dp-step-item.pending { color: var(--border); }
  .dp-step-dot {
    width: 22px; height: 22px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px;
    font-weight: 700;
    flex-shrink: 0;
  }
  .dp-step-item.done .dp-step-dot {
    background: rgba(52,211,153,.2);
    border: 1px solid var(--green);
    color: var(--green);
  }
  .dp-step-item.active .dp-step-dot {
    background: rgba(79,139,255,.2);
    border: 1px solid var(--accent);
    color: var(--accent);
  }
  .dp-step-item.pending .dp-step-dot {
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--border);
  }
  .dp-step-arrow { color: var(--border); font-size: 12px; flex-shrink: 0; }

  /* ── HERO ── */
  .dp-hero {
    width: 64px; height: 64px;
    background: linear-gradient(135deg, rgba(139,92,246,.18), rgba(79,139,255,.12));
    border: 1px solid rgba(139,92,246,.25);
    border-radius: 16px;
    display: flex; align-items: center; justify-content: center;
    font-size: 28px;
    margin: 0 auto 20px;
  }

  /* ── TITLE ── */
  .dp-title {
    font-size: 26px;
    font-weight: 800;
    color: var(--text);
    letter-spacing: -.02em;
    line-height: 1.15;
    margin-bottom: 6px;
    text-align: center;
  }
  .dp-subtitle {
    font-family: var(--mono);
    font-size: 12px;
    color: var(--muted);
    margin-bottom: 32px;
    text-align: center;
    line-height: 1.7;
  }

  /* ── ALERTS ── */
  .dp-alert {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    border-radius: 10px;
    padding: 13px 15px;
    margin-bottom: 20px;
    font-size: 13px;
    font-family: var(--mono);
    line-height: 1.6;
    animation: dp-fadein .25s ease both;
  }
  .dp-alert.error {
    background: rgba(248,113,113,.1);
    border: 1px solid rgba(248,113,113,.25);
    color: #fca5a5;
  }
  .dp-alert.success {
    background: rgba(52,211,153,.1);
    border: 1px solid rgba(52,211,153,.25);
    color: #6ee7b7;
  }

  /* ── REDIRECT ── */
  .dp-redirect {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: -8px;
    margin-bottom: 16px;
    font-family: var(--mono);
    font-size: 11px;
    color: var(--muted);
  }
  .dp-redirect-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--green);
    animation: dp-blink 1s ease infinite;
  }
  @keyframes dp-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: .2; }
  }

  /* ── LABEL ── */
  .dp-label {
    display: block;
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 8px;
  }

  /* ── FIELD ── */
  .dp-field { margin-bottom: 18px; }

  /* ── INPUT ── */
  .dp-input-wrap { position: relative; }
  .dp-input-icon {
    position: absolute;
    left: 15px; top: 50%;
    transform: translateY(-50%);
    font-size: 14px;
    color: var(--muted);
    pointer-events: none;
    transition: color .2s;
  }
  .dp-input-wrap:focus-within .dp-input-icon { color: var(--accent); }

  .dp-input {
    width: 100%;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 13px 42px 13px 42px;
    color: var(--text);
    font-family: var(--mono);
    font-size: 14px;
    outline: none;
    transition: border-color .2s, box-shadow .2s;
    box-sizing: border-box;
  }
  .dp-input.email-only { padding-right: 13px; }
  .dp-input::placeholder { color: var(--muted); }
  .dp-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(79,139,255,.15);
  }
  .dp-input.match {
    border-color: var(--green);
    box-shadow: 0 0 0 3px rgba(52,211,153,.12);
  }
  .dp-input.mismatch {
    border-color: var(--red);
    box-shadow: 0 0 0 3px rgba(248,113,113,.12);
  }

  /* ── EYE ── */
  .dp-eye {
    position: absolute;
    right: 13px; top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: var(--muted);
    cursor: pointer;
    font-size: 14px;
    padding: 0;
    transition: color .2s;
  }
  .dp-eye:hover { color: var(--text); }

  /* ── MATCH HINT ── */
  .dp-match-hint {
    margin-top: 6px;
    font-family: var(--mono);
    font-size: 11px;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .dp-match-hint.ok { color: var(--green); }
  .dp-match-hint.no { color: var(--red); }

  /* ── STRENGTH ── */
  .dp-strength {
    margin-top: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .dp-strength-bars { display: flex; gap: 4px; flex: 1; }
  .dp-strength-bar {
    flex: 1;
    height: 4px;
    border-radius: 2px;
    background: var(--border);
    transition: background .3s;
  }
  .dp-strength-bar.fill-weak   { background: var(--red); }
  .dp-strength-bar.fill-medium { background: var(--yellow); }
  .dp-strength-bar.fill-strong { background: var(--green); }
  .dp-strength-label {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: .06em;
    text-transform: uppercase;
    width: 52px;
    text-align: right;
    flex-shrink: 0;
  }
  .dp-strength-label.weak   { color: var(--red); }
  .dp-strength-label.medium { color: var(--yellow); }
  .dp-strength-label.strong { color: var(--green); }

  /* ── SUBMIT ── */
  .dp-btn {
    width: 100%;
    background: linear-gradient(135deg, var(--accent2) 0%, var(--accent) 100%);
    color: white;
    border: none;
    border-radius: 12px;
    padding: 16px;
    font-family: var(--sans);
    font-size: 16px;
    font-weight: 700;
    letter-spacing: -.01em;
    cursor: pointer;
    transition: opacity .2s, transform .15s, box-shadow .2s;
    position: relative;
    overflow: hidden;
    margin-top: 8px;
  }
  .dp-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,.12) 0%, transparent 60%);
  }
  .dp-btn:hover {
    opacity: .9;
    transform: translateY(-1px);
    box-shadow: 0 8px 28px rgba(139,92,246,.35);
  }
  .dp-btn:active { transform: translateY(0); }

  /* ── SECURITY ── */
  .dp-security {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-top: 28px;
    font-family: var(--mono);
    font-size: 10px;
    color: #374151;
    letter-spacing: .05em;
  }
  .dp-security-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--green);
    box-shadow: 0 0 8px var(--green);
  }
`;

function getStrength(pwd) {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
}

export default function ResetPasswordChange() {
  const { t } = useTranslation("auth");

  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [repeatPassword, setReapetPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isReapetpasswordVisible, setIsReapetpasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL;

  const togglePasswordVisibility = () => setIsPasswordVisible((prev) => !prev);
  const toggleReapetpasswordVisibility = () =>
    setIsReapetpasswordVisible((prev) => !prev);

  const strength = getStrength(password);
  const strengthLabel =
    strength <= 1 ? "weak" : strength <= 2 ? "medium" : "strong";
  const strengthText =
    strength <= 1 ? "Слабый" : strength <= 2 ? "Средний" : "Сильный";

  const passwordsMatch =
    repeatPassword.length > 0 && password === repeatPassword;
  const passwordsMismatch =
    repeatPassword.length > 0 && password !== repeatPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== repeatPassword) {
      setErrorMessage(t("ResetPasswordDirectChange.errors.notMatch"));
      return;
    }

    // email мог быть введён в поле выше, но если пусто — берём тот, что
    // сохранён на первом шаге. Код подтверждения приходит со страницы ввода OTP.
    const effectiveEmail = email || localStorage.getItem("resetEmail") || "";
    const otpPassword = localStorage.getItem("resetOtp") || "";

    try {
      const response = await axios.post(
        `${API_BASE}/auth/change-password`,
        {
          email: effectiveEmail,
          newPassword: password,
          newRepeatPassword: repeatPassword,
          otpPassword,
          agreement: true,
        },
        { withCredentials: true },
      );

      setSuccessMessage(response.data.message);
      setErrorMessage("");
      setPassword("");
      setReapetPassword("");
      // Код одноразовый — убираем следы из браузера.
      localStorage.removeItem("resetOtp");
      localStorage.removeItem("resetEmail");

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      if (error.response?.status === 429) {
        setErrorMessage(
          t("ResetPasswordDirectChange.errors.tooMany", {
            defaultValue:
              "Слишком много попыток. Подождите ~15 минут и попробуйте снова.",
          }),
        );
      } else {
        setErrorMessage(
          error.response?.data?.message ||
            error.response?.data?.error ||
            t("ResetPasswordDirectChange.errors.unexpected"),
        );
      }
      setSuccessMessage("");
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="dp-rpdc-root">
        <div className="dp-grid" />

        <div className="dp-card">
          {/* Brand */}
          <div className="dp-brand">
            <div className="dp-brand-icon">🩺</div>
            <div className="dp-brand-name">
              Doc<span>Pats</span>
            </div>
            <div className="dp-brand-tag">Смена пароля</div>
          </div>

          {/* Step flow */}
          <div className="dp-steps">
            <div className="dp-step-item done">
              <div className="dp-step-dot">✓</div>
              Email
            </div>
            <div className="dp-step-arrow">›</div>
            <div className="dp-step-item done">
              <div className="dp-step-dot">✓</div>
              OTP
            </div>
            <div className="dp-step-arrow">›</div>
            <div className="dp-step-item active">
              <div className="dp-step-dot">3</div>
              Пароль
            </div>
          </div>

          {/* Hero */}
          <div className="dp-hero">🔐</div>

          {/* Title */}
          <div className="dp-title">
            {t("ResetPasswordDirectChange.title") || "Новый пароль"}
          </div>
          <div className="dp-subtitle">
            {t("ResetPasswordDirectChange.subtitle") ||
              "// последний шаг — придумайте надёжный пароль"}
          </div>

          {/* Alerts */}
          {errorMessage && (
            <div className="dp-alert error">
              <span>⚠</span>
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="dp-alert success">
              <span>✓</span>
              <span>{successMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="dp-redirect">
              <div className="dp-redirect-dot" />
              Перенаправление на страницу входа…
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* EMAIL */}
            <div className="dp-field">
              <label className="dp-label">
                {t("ResetPasswordDirectChange.email") || "Email"}
              </label>
              <div className="dp-input-wrap">
                <span className="dp-input-icon">✉</span>
                <input
                  type="email"
                  className="dp-input email-only"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* NEW PASSWORD */}
            <div className="dp-field">
              <label className="dp-label">
                {t("ResetPasswordDirectChange.newPassword") || "Новый пароль"}
              </label>
              <div className="dp-input-wrap">
                <span className="dp-input-icon">🔑</span>
                <input
                  type={isPasswordVisible ? "text" : "password"}
                  className="dp-input"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="dp-eye"
                  onClick={togglePasswordVisibility}
                  tabIndex={-1}
                >
                  {isPasswordVisible ? "🙈" : "👁"}
                </button>
              </div>
              {password.length > 0 && (
                <div className="dp-strength">
                  <div className="dp-strength-bars">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`dp-strength-bar ${
                          i <= strength
                            ? strength <= 1
                              ? "fill-weak"
                              : strength <= 2
                                ? "fill-medium"
                                : "fill-strong"
                            : ""
                        }`}
                      />
                    ))}
                  </div>
                  <div className={`dp-strength-label ${strengthLabel}`}>
                    {strengthText}
                  </div>
                </div>
              )}
            </div>

            {/* REPEAT PASSWORD */}
            <div className="dp-field">
              <label className="dp-label">
                {t("ResetPasswordDirectChange.repeatPassword") ||
                  "Повторите пароль"}
              </label>
              <div className="dp-input-wrap">
                <span className="dp-input-icon">🔑</span>
                <input
                  type={isReapetpasswordVisible ? "text" : "password"}
                  className={`dp-input ${
                    passwordsMatch
                      ? "match"
                      : passwordsMismatch
                        ? "mismatch"
                        : ""
                  }`}
                  placeholder="••••••••••••"
                  value={repeatPassword}
                  onChange={(e) => setReapetPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="dp-eye"
                  onClick={toggleReapetpasswordVisibility}
                  tabIndex={-1}
                >
                  {isReapetpasswordVisible ? "🙈" : "👁"}
                </button>
              </div>
              {passwordsMatch && (
                <div className="dp-match-hint ok">
                  <span>✓</span> Пароли совпадают
                </div>
              )}
              {passwordsMismatch && (
                <div className="dp-match-hint no">
                  <span>✗</span> Пароли не совпадают
                </div>
              )}
            </div>

            {/* SUBMIT */}
            <button className="dp-btn" type="submit">
              {t("ResetPasswordDirectChange.submit") || "Сохранить пароль →"}
            </button>
          </form>

          {/* Security */}
          <div className="dp-security">
            <div className="dp-security-dot" />
            ENCRYPTED · BCRYPT · HIPAA COMPLIANT
          </div>
        </div>
      </div>
    </>
  );
}
