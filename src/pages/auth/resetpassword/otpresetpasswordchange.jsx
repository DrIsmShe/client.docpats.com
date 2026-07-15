import React, { useState, useEffect } from "react";
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

  .dp-otp-root {
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

  .dp-otp-root::before {
    content: '';
    position: fixed;
    top: -200px; right: -200px;
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(79,139,255,.1) 0%, transparent 65%);
    pointer-events: none;
    animation: dp-pulse 7s ease-in-out infinite alternate;
  }
  .dp-otp-root::after {
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
  .dp-step-item.done  { color: var(--green); }
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
    margin-bottom: 10px;
    text-align: center;
    line-height: 1.7;
  }

  /* ── EMAIL PILL ── */
  .dp-email-pill {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    background: rgba(79,139,255,.08);
    border: 1px solid rgba(79,139,255,.15);
    border-radius: 20px;
    padding: 7px 14px;
    font-family: var(--mono);
    font-size: 12px;
    color: var(--accent);
    margin: 0 auto 28px;
    width: fit-content;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* ── ALERT ── */
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
    background: rgba(248,113,113,.1);
    border: 1px solid rgba(248,113,113,.25);
    color: #fca5a5;
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

  /* ── OTP INPUT ── */
  .dp-otp-input {
    width: 100%;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 16px 18px;
    color: var(--text);
    font-family: var(--mono);
    font-size: 24px;
    font-weight: 600;
    letter-spacing: .3em;
    text-align: center;
    outline: none;
    transition: border-color .2s, box-shadow .2s;
    box-sizing: border-box;
    margin-bottom: 20px;
  }
  .dp-otp-input::placeholder {
    color: var(--border);
    letter-spacing: .2em;
    font-size: 20px;
  }
  .dp-otp-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(79,139,255,.15);
  }

  /* ── TIMER ── */
  .dp-timer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-family: var(--mono);
    font-size: 12px;
    color: var(--muted);
    margin-bottom: 20px;
  }
  .dp-timer-val {
    font-size: 14px;
    font-weight: 600;
    color: var(--yellow);
    min-width: 32px;
    text-align: center;
  }
  .dp-timer-val.expired { color: var(--red); }

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
    margin-bottom: 12px;
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

  /* ── RESEND ── */
  .dp-resend {
    width: 100%;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 13px;
    font-family: var(--mono);
    font-size: 13px;
    color: var(--muted);
    cursor: pointer;
    transition: all .2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .dp-resend:hover {
    border-color: rgba(79,139,255,.4);
    color: var(--text);
    background: rgba(79,139,255,.06);
  }
  .dp-resend:disabled {
    opacity: .4;
    cursor: not-allowed;
  }

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

export default function Otpresetpasswordchange() {
  const { t } = useTranslation("auth");

  const [otpPassword, setOtpPassword] = useState("");
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(5 * 60); // 15 min countdown
  const [resendCooldown, setResendCooldown] = useState(0);

  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const storedEmail = localStorage.getItem("resetEmail");
    if (!storedEmail) {
      navigate("/resetpasswordchange");
    } else {
      setEmail(storedEmail);
    }
  }, [navigate]);

  // OTP expiry countdown
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  // Resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const formatTime = (secs) => {
    const m = String(Math.floor(secs / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    // Код НЕ проверяем здесь и НЕ перезапрашиваем: раньше этот submit слал
    // /auth/otp-for-reset-password, который генерировал НОВЫЙ код и затирал
    // тот, что уже в письме. Просто сохраняем введённый код и переходим —
    // сервер проверит его на финальном шаге (/auth/change-password).
    const code = otpPassword.trim();
    if (!code) {
      setErrorMessage(t("OtpResetPasswordChange.errors.unexpected"));
      return;
    }
    localStorage.setItem("resetOtp", code);
    navigate("/resetpasswordchange");
  };

  const handleResendOTP = async () => {
    try {
      const response = await axios.post(`${API_BASE}/auth/reset-password`, {
        email,
      });
      alert(response.data.message);
      setSecondsLeft(15 * 60);
      setResendCooldown(60);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          t("OtpResetPasswordChange.errors.unexpected"),
      );
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="dp-otp-root">
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

          {/* Step flow */}
          <div className="dp-steps">
            <div className="dp-step-item done">
              <div className="dp-step-dot">✓</div>
              Email
            </div>
            <div className="dp-step-arrow">›</div>
            <div className="dp-step-item active">
              <div className="dp-step-dot">2</div>
              OTP
            </div>
            <div className="dp-step-arrow">›</div>
            <div className="dp-step-item pending">
              <div className="dp-step-dot">3</div>
              Пароль
            </div>
          </div>

          {/* Hero */}
          <div className="dp-hero">🔑</div>

          {/* Title */}
          <div className="dp-title">
            {t("OtpResetPasswordChange.title") || "Введите код"}
          </div>
          <div className="dp-subtitle">
            {t("OtpResetPasswordChange.subtitle") ||
              "// код отправлен на вашу почту"}
          </div>

          {/* Email pill */}
          {email && (
            <div className="dp-email-pill">
              <span>✉</span>
              <span>{email}</span>
            </div>
          )}

          {/* Error */}
          {errorMessage && (
            <div className="dp-alert">
              <span>⚠</span>
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <label className="dp-label">
              {t("OtpResetPasswordChange.otp") || "Код подтверждения"}
            </label>

            <input
              type="text"
              className="dp-otp-input"
              placeholder="● ● ● ● ● ● ● ●"
              value={otpPassword}
              onChange={(e) => setOtpPassword(e.target.value)}
              maxLength={8}
              required
            />

            {/* Timer */}
            <div className="dp-timer">
              <span>Код действителен:</span>
              <span
                className={`dp-timer-val ${secondsLeft === 0 ? "expired" : ""}`}
              >
                {secondsLeft > 0 ? formatTime(secondsLeft) : "Истёк"}
              </span>
            </div>

            <button className="dp-btn" type="submit">
              {t("OtpResetPasswordChange.submit") || "Подтвердить код →"}
            </button>

            <button
              type="button"
              className="dp-resend"
              onClick={handleResendOTP}
              disabled={resendCooldown > 0}
            >
              <span>↻</span>
              {resendCooldown > 0
                ? `${t("OtpResetPasswordChange.resend") || "Отправить снова"} (${resendCooldown}с)`
                : t("OtpResetPasswordChange.resend") || "Отправить код снова"}
            </button>
          </form>

          {/* Security */}
          <div className="dp-security">
            <div className="dp-security-dot" />
            OTP · ONE-TIME · 8 CHARS · 5 MIN EXPIRY
          </div>
        </div>
      </div>
    </>
  );
}
