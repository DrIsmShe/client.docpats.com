// src/components/auth/confirmationregister.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
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

  .dp-confirm-root {
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

  .dp-confirm-root::before {
    content: '';
    position: fixed;
    top: -200px; left: -200px;
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(79,139,255,.1) 0%, transparent 65%);
    pointer-events: none;
    animation: dp-pulse 7s ease-in-out infinite alternate;
  }
  .dp-confirm-root::after {
    content: '';
    position: fixed;
    bottom: -150px; right: -150px;
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
    color: var(--green);
    background: rgba(52,211,153,.1);
    border: 1px solid rgba(52,211,153,.2);
    padding: 3px 8px;
    border-radius: 4px;
  }

  /* ── OTP ICON ── */
  .dp-otp-icon {
    width: 64px; height: 64px;
    background: linear-gradient(135deg, rgba(79,139,255,.15), rgba(139,92,246,.15));
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

  /* ── ERROR ── */
  .dp-alert {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: rgba(248,113,113,.1);
    border: 1px solid rgba(248,113,113,.25);
    border-radius: 10px;
    padding: 13px 15px;
    margin-bottom: 24px;
    font-size: 13px;
    color: #fca5a5;
    font-family: var(--mono);
    animation: dp-fadein .25s ease both;
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

  /* ── OTP INPUT (big digits) ── */
  .dp-otp-input {
    width: 100%;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 14px 18px;
    color: var(--text);
    font-family: var(--mono);
    font-size: 22px;
    font-weight: 600;
    letter-spacing: .25em;
    text-align: center;
    outline: none;
    transition: border-color .2s, box-shadow .2s;
    box-sizing: border-box;
  }
  .dp-otp-input::placeholder {
    color: var(--border);
    letter-spacing: .15em;
    font-size: 18px;
  }
  .dp-otp-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(79,139,255,.15);
  }

  /* ── CHILD STEP CARDS ── */
  .dp-step-cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 24px;
  }
  .dp-step-card {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 14px 12px;
    text-align: center;
  }
  .dp-step-card.active {
    background: rgba(79,139,255,.08);
    border-color: var(--accent);
  }
  .dp-step-card.done {
    background: rgba(52,211,153,.07);
    border-color: var(--green);
  }
  .dp-step-num {
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: .12em;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .dp-step-card.active .dp-step-num { color: var(--accent); }
  .dp-step-card.done .dp-step-num { color: var(--green); }
  .dp-step-card:not(.active):not(.done) .dp-step-num { color: var(--muted); }
  .dp-step-title {
    font-size: 12px;
    font-weight: 700;
    color: var(--text);
  }
  .dp-step-card:not(.active):not(.done) .dp-step-title { color: var(--muted); }

  /* ── SECTION DIVIDER ── */
  .dp-section-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: var(--muted);
    margin: 20px 0 14px;
  }
  .dp-section-label::before, .dp-section-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
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
    margin-top: 6px;
  }
  .dp-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,.12) 0%, transparent 60%);
  }
  .dp-btn:hover:not(:disabled) {
    opacity: .9;
    transform: translateY(-1px);
    box-shadow: 0 8px 28px rgba(79,139,255,.35);
  }
  .dp-btn:active:not(:disabled) { transform: translateY(0); }
  .dp-btn:disabled { opacity: .45; cursor: not-allowed; }

  /* ── LOADER DOTS ── */
  .dp-dots span {
    display: inline-block;
    width: 5px; height: 5px;
    border-radius: 50%;
    background: white;
    margin: 0 2px;
    animation: dp-dot .9s ease-in-out infinite;
  }
  .dp-dots span:nth-child(2) { animation-delay: .15s; }
  .dp-dots span:nth-child(3) { animation-delay: .3s; }
  @keyframes dp-dot {
    0%, 80%, 100% { transform: scale(.6); opacity: .4; }
    40%           { transform: scale(1); opacity: 1; }
  }

  /* ── HELP NOTE ── */
  .dp-help {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: rgba(79,139,255,.07);
    border: 1px solid rgba(79,139,255,.15);
    border-radius: 10px;
    padding: 13px 15px;
    margin-bottom: 20px;
    font-size: 12px;
    color: var(--muted);
    font-family: var(--mono);
    line-height: 1.6;
  }
  .dp-help strong { color: var(--text); }

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

export default function ConfirmationRegister() {
  const { t } = useTranslation("auth");

  const [searchParams] = useSearchParams();
  const isChild = searchParams.get("isChild") === "1";

  const [email, setEmail] = useState("");
  const [otpPassword, setOtpPassword] = useState("");

  const [childOtp, setChildOtp] = useState("");
  const [parentOtp, setParentOtp] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL;

  // 1️⃣ Взрослый (18+)
  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await axios.post(`${API_BASE}/auth/confirmation`, {
        email,
        otpPassword,
      });

      navigate("/login");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          t("ConfirmationRegister.errors.unexpected"),
      );
    } finally {
      setLoading(false);
    }
  };

  // 2️⃣ Ребёнок (<18)
  const handleSubmitChild = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!localStorage.getItem("childConfirmed")) {
        await axios.post(`${API_BASE}/auth/confirmation-child`, {
          email,
          childOtp,
        });

        localStorage.setItem("childConfirmed", "1");
        alert(t("ConfirmationRegister.alerts.childConfirmed"));
        return;
      }

      await axios.post(`${API_BASE}/auth/confirmation-child`, {
        email,
        parentOtp,
      });

      localStorage.removeItem("childConfirmed");
      alert(t("ConfirmationRegister.alerts.accountActivated"));
      navigate("/login");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          t("ConfirmationRegister.errors.unexpected"),
      );
    } finally {
      setLoading(false);
    }
  };

  const childStep = localStorage.getItem("childConfirmed") ? 2 : 1;

  return (
    <>
      <style>{styles}</style>
      <div className="dp-confirm-root">
        <div className="dp-grid" />

        <div className="dp-card">
          {/* Brand */}
          <div className="dp-brand">
            <div className="dp-brand-icon">🩺</div>
            <div className="dp-brand-name">
              Doc<span>Pats</span>
            </div>
            <div className="dp-brand-tag">OTP</div>
          </div>

          {/* Icon */}
          <div className="dp-otp-icon">{isChild ? "👨‍👩‍👧" : "✉️"}</div>

          {/* Title */}
          <div className="dp-title">
            {t("ConfirmationRegister.title") || "Подтверждение"}
          </div>
          <div className="dp-subtitle">
            {isChild
              ? t("ConfirmationRegister.subtitleChild") ||
                "// подтвердите аккаунт ребёнка и родителя"
              : t("ConfirmationRegister.subtitleAdult") ||
                "// введите код из письма на вашем email"}
          </div>

          {/* Error */}
          {error && (
            <div className="dp-alert">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* ── ВЗРОСЛЫЙ ── */}
          {!isChild && (
            <form onSubmit={handleSubmit} noValidate>
              <div className="dp-help">
                <span>📬</span>
                <span>
                  <strong>Проверьте почту</strong> — мы отправили 6-значный код
                  подтверждения на указанный email.
                </span>
              </div>

              <div className="dp-field">
                <label className="dp-label">
                  {t("ConfirmationRegister.email") || "Email"}
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

              <div className="dp-field">
                <label className="dp-label">
                  {t("ConfirmationRegister.otpAdult") || "Код подтверждения"}
                </label>
                <input
                  type="text"
                  className="dp-otp-input"
                  placeholder="● ● ● ● ● ●"
                  value={otpPassword}
                  onChange={(e) => setOtpPassword(e.target.value)}
                  maxLength={6}
                  required
                />
              </div>

              <button className="dp-btn" type="submit" disabled={loading}>
                {loading ? (
                  <span className="dp-dots">
                    <span />
                    <span />
                    <span />
                  </span>
                ) : (
                  t("ConfirmationRegister.verify") || "Подтвердить аккаунт →"
                )}
              </button>
            </form>
          )}

          {/* ── РЕБЁНОК ── */}
          {isChild && (
            <form onSubmit={handleSubmitChild} noValidate>
              {/* Step indicator */}
              <div className="dp-step-cards">
                <div
                  className={`dp-step-card ${childStep === 1 ? "active" : "done"}`}
                >
                  <div className="dp-step-num">
                    {childStep > 1 ? "✓ Шаг 1" : "Шаг 1"}
                  </div>
                  <div className="dp-step-title">Пациент</div>
                </div>
                <div
                  className={`dp-step-card ${childStep === 2 ? "active" : ""}`}
                >
                  <div className="dp-step-num">Шаг 2</div>
                  <div className="dp-step-title">Родитель</div>
                </div>
              </div>

              <div className="dp-help">
                <span>📬</span>
                <span>
                  <strong>Два письма:</strong> код ребёнка отправлен на его
                  email, код родителя — на email опекуна.
                </span>
              </div>

              {/* Email */}
              <div className="dp-field">
                <label className="dp-label">
                  {t("ConfirmationRegister.childEmail") || "Email ребёнка"}
                </label>
                <div className="dp-input-wrap">
                  <span className="dp-input-icon">✉</span>
                  <input
                    type="email"
                    className="dp-input"
                    placeholder="child@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Child OTP */}
              <div className="dp-section-label">Код ребёнка</div>
              <div className="dp-field">
                <label className="dp-label">
                  {t("ConfirmationRegister.otpChild") || "OTP ребёнка"}
                </label>
                <input
                  type="text"
                  className="dp-otp-input"
                  placeholder="● ● ● ● ● ●"
                  value={childOtp}
                  onChange={(e) => setChildOtp(e.target.value)}
                  maxLength={6}
                  required
                />
              </div>

              {/* Parent OTP */}
              <div className="dp-section-label">Код родителя</div>
              <div className="dp-field">
                <label className="dp-label">
                  {t("ConfirmationRegister.otpParent") || "OTP родителя"}
                </label>
                <input
                  type="text"
                  className="dp-otp-input"
                  placeholder="● ● ● ● ● ●"
                  value={parentOtp}
                  onChange={(e) => setParentOtp(e.target.value)}
                  maxLength={6}
                  required
                />
              </div>

              <button className="dp-btn" type="submit" disabled={loading}>
                {loading ? (
                  <span className="dp-dots">
                    <span />
                    <span />
                    <span />
                  </span>
                ) : (
                  t("ConfirmationRegister.verifyMultiple") ||
                  "Подтвердить оба кода →"
                )}
              </button>
            </form>
          )}

          {/* Security */}
          <div className="dp-security">
            <div className="dp-security-dot" />
            OTP · ONE-TIME · EXPIRES IN 15 MIN
          </div>
        </div>
      </div>
    </>
  );
}
