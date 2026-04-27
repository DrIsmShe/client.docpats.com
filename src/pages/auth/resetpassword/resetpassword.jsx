import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
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

  .dp-rp-root {
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

  .dp-rp-root::before {
    content: '';
    position: fixed;
    top: -200px; right: -200px;
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(79,139,255,.1) 0%, transparent 65%);
    pointer-events: none;
    animation: dp-pulse 7s ease-in-out infinite alternate;
  }
  .dp-rp-root::after {
    content: '';
    position: fixed;
    bottom: -150px; left: -150px;
    width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(139,92,246,.09) 0%, transparent 65%);
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
      0 0 80px rgba(79,139,255,.06);
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
    color: var(--accent);
    background: rgba(79,139,255,.1);
    border: 1px solid rgba(79,139,255,.2);
    padding: 3px 8px;
    border-radius: 4px;
  }

  /* ── HERO ICON ── */
  .dp-hero {
    width: 64px; height: 64px;
    background: linear-gradient(135deg, rgba(79,139,255,.15), rgba(139,92,246,.12));
    border: 1px solid rgba(79,139,255,.2);
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

  /* ── STEPS ── */
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
  .dp-step-item.active { color: var(--accent); }
  .dp-step-item:not(.active) { color: var(--border); }
  .dp-step-dot {
    width: 22px; height: 22px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px;
    font-weight: 700;
    flex-shrink: 0;
  }
  .dp-step-item.active .dp-step-dot {
    background: rgba(79,139,255,.2);
    border: 1px solid var(--accent);
    color: var(--accent);
  }
  .dp-step-item:not(.active) .dp-step-dot {
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--border);
  }
  .dp-step-arrow {
    color: var(--border);
    font-size: 12px;
    flex-shrink: 0;
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
  .dp-field { margin-bottom: 20px; }

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
    padding: 13px 14px 13px 42px;
    color: var(--text);
    font-family: var(--mono);
    font-size: 14px;
    outline: none;
    transition: border-color .2s, box-shadow .2s;
    box-sizing: border-box;
  }
  .dp-input::placeholder { color: var(--muted); }
  .dp-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(79,139,255,.15);
  }

  /* ── SUBMIT ── */
  .dp-btn {
    width: 100%;
    background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%);
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
    margin-top: 4px;
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
    box-shadow: 0 8px 28px rgba(79,139,255,.35);
  }
  .dp-btn:active { transform: translateY(0); }

  /* ── REDIRECT ── */
  .dp-redirect {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 14px;
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

  /* ── FOOTER ── */
  .dp-footer {
    margin-top: 24px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    background: #06021c;
  }
  .dp-footer-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-family: var(--mono);
    font-size: 12px;
    color: var(--muted);
  }
  .dp-footer-row a {
    color: var(--accent);
    text-decoration: none;
    transition: opacity .15s;
  }
  .dp-footer-row a:hover { opacity: .75; text-decoration: underline; }

  /* ── SECURITY ── */
  .dp-security {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-top: 26px;
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

export default function ResetPassword() {
  const { t } = useTranslation("auth");

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError(t("ResetPassword.errors.required"));
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/auth/reset-password`, {
        email,
      });

      setSuccess(response.data.message);
      localStorage.setItem("resetEmail", email);

      setTimeout(() => {
        navigate("/otpresetpasswordchange");
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message || t("ResetPassword.errors.unexpected"),
      );
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="dp-rp-root">
        <div className="dp-grid" />

        <div className="dp-card">
          {/* Brand */}
          <div className="dp-brand">
            <div className="dp-brand-icon">🩺</div>
            <div className="dp-brand-name">
              Doc<span>Pats</span>
            </div>
            <div className="dp-brand-tag">Сброс пароля</div>
          </div>

          {/* Hero */}

          {/* Title */}
          <div className="dp-title">
            {t("ResetPassword.title") || "Восстановление пароля"}
          </div>
          <div className="dp-subtitle">
            {t("ResetPassword.subtitle") ||
              "// введите email — мы отправим код для сброса"}
          </div>

          {/* Step flow */}
          <div className="dp-steps">
            <div className="dp-step-item active">
              <div className="dp-step-dot">1</div>
              Email
            </div>
            <div className="dp-step-arrow">›</div>
            <div className="dp-step-item">
              <div className="dp-step-dot">2</div>
              OTP
            </div>
            <div className="dp-step-arrow">›</div>
            <div className="dp-step-item">
              <div className="dp-step-dot">3</div>
              Пароль
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="dp-alert error">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="dp-alert success">
              <span>✓</span>
              <span>{success}</span>
            </div>
          )}
          {success && (
            <div className="dp-redirect">
              <div className="dp-redirect-dot" />
              Переход к вводу кода…
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="dp-field">
              <label className="dp-label">
                {t("ResetPassword.email") || "Email"}
              </label>
              <div className="dp-input-wrap">
                <span className="dp-input-icon">✉</span>
                <input
                  type="email"
                  className="dp-input"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button className="dp-btn" type="submit">
              {t("ResetPassword.submit") || "Отправить код →"}
            </button>
          </form>

          {/* Footer links */}
          <div className="dp-footer">
            <div className="dp-footer-row">
              <span>{t("ResetPassword.noAccount") || "Нет аккаунта?"}</span>
              <Link to="/registration">
                {t("ResetPassword.createAccount") || "Создать аккаунт"}
              </Link>
            </div>
            <div className="dp-footer-row">
              <span>
                {t("ResetPassword.haveAccount") || "Уже есть аккаунт?"}
              </span>
              <Link to="/login">{t("ResetPassword.login") || "Войти"}</Link>
            </div>
          </div>

          {/* Security */}
          <div className="dp-security">
            <div className="dp-security-dot" />
            SECURE RESET · OTP · 15 MIN EXPIRY
          </div>
        </div>
      </div>
    </>
  );
}
