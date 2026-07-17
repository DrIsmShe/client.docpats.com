import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

// ─── Inline styles (no external deps beyond what project already uses) ───────
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
    --text:     #f1f5f9;
    --muted:    #8899b0;
    --mono:     'JetBrains Mono', monospace;
    --sans:     'Syne', sans-serif;
  }

  .dp-login-root {
    min-height: 100vh;
    background: var(--bg);
    font-family: var(--sans);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }

  /* Background decoration */
  .dp-login-root::before {
    content: '';
    position: absolute;
    top: -200px; left: -200px;
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(61,127,255,.12) 0%, transparent 65%);
    pointer-events: none;
    animation: dp-pulse 6s ease-in-out infinite alternate;
  }
  .dp-login-root::after {
    content: '';
    position: absolute;
    bottom: -150px; right: -150px;
    width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(124,61,255,.1) 0%, transparent 65%);
    pointer-events: none;
    animation: dp-pulse 8s ease-in-out infinite alternate-reverse;
  }
  @keyframes dp-pulse {
    from { transform: scale(1); opacity: 1; }
    to   { transform: scale(1.15); opacity: .7; }
  }

  /* Grid lines overlay */
  .dp-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(61,127,255,.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(61,127,255,.04) 1px, transparent 1px);
    background-size: 48px 48px;
    pointer-events: none;
  }

  /* Card */
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
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Logo / brand */
  .dp-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 36px;
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
    font-family: var(--sans);
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
    background: rgba(61,127,255,.1);
    border: 1px solid rgba(61,127,255,.2);
    padding: 3px 8px;
    border-radius: 4px;
  }

  /* Title */
  .dp-title {
    font-size: 30px;
    font-weight: 800;
    color: var(--text);
    letter-spacing: -.02em;
    line-height: 1.15;
    margin-bottom: 6px;
  }
  .dp-subtitle {
    font-family: var(--mono);
    font-size: 13px;
    color: var(--muted);
    margin-bottom: 32px;
  }

  /* Divider */
  .dp-divider {
    height: 1px;
    background: var(--border);
    margin: 28px 0;
  }

  /* Error alert */
  .dp-alert {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: rgba(239,68,68,.1);
    border: 1px solid rgba(239,68,68,.25);
    border-radius: 8px;
    padding: 12px 14px;
    margin-bottom: 24px;
    font-size: 13px;
    color: #fca5a5;
    font-family: var(--mono);
    animation: dp-fadein .25s ease both;
  }
  .dp-alert-icon { flex-shrink: 0; margin-top: 1px; }

  /* Label */
  .dp-label {
    display: block;
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 8px;
  }

  /* Input */
  .dp-field {
    margin-bottom: 20px;
  }
  .dp-input-wrap {
    position: relative;
  }
  .dp-input-icon {
    position: absolute;
    left: 15px; top: 50%;
    transform: translateY(-50%);
    color: var(--muted);
    font-size: 14px;
    pointer-events: none;
    transition: color .2s;
  }
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
  .dp-input:focus + .dp-input-icon { color: var(--accent); }
  .dp-input-wrap:focus-within .dp-input-icon { color: var(--accent); }

  /* Password toggle */
  .dp-eye {
    position: absolute;
    right: 14px; top: 50%;
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
  .dp-input-pass { padding-right: 40px; }

  /* Submit button */
  .dp-btn {
    width: 100%;
    background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%);
    color: white;
    border: none;
    border-radius: 12px;
    padding: 16px;
    font-family: var(--sans);
    font-size: 15px;
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
    border-radius: inherit;
  }
  .dp-btn:hover:not(:disabled) {
    opacity: .92;
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(61,127,255,.35);
  }
  .dp-btn:active:not(:disabled) { transform: translateY(0); }
  .dp-btn:disabled { opacity: .5; cursor: not-allowed; }

  /* Loader dots */
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

  /* Footer links */
  .dp-footer {
    margin-top: 24px;
    display: flex;
    flex-direction: column;
    gap: 10px;
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

  /* Security badge */
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

export default function Login() {
  const { t } = useTranslation("auth");

  const [email, setEmail] = useState("");
  // If we arrived via QR code from a provisional patient card, the URL
  // looks like /login?provisional=1&email=patient.xxx@docpats.com.
  // Prefill the email field so the patient doesn't have to type it.
  const [searchParams] = useSearchParams();
  React.useEffect(() => {
    const urlEmail = searchParams.get("email");
    if (urlEmail) setEmail(urlEmail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const remember = document.getElementById("rememberMe")?.checked || false;

    try {
      console.log("🌐 API_BASE =", API_BASE);

      const response = await axios.post(
        `${API_BASE}/auth/login`,
        { email, password, remember },
        { withCredentials: true },
      );

      const { user } = response.data;

      if (!user) {
        setError(t("Login.errors.failed"));
        return;
      }

      if (user.isBlocked) {
        setError(t("Login.errors.blocked"));
        return;
      }
      // 🔹 PRIORITY: Provisional user (clinic-issued temp account).
      //    Goes to /complete-registration where they set permanent
      //    email + password via OTP verification. Must come BEFORE
      //    the mustChangePassword branch — otherwise legacy mustChangePassword
      //    (which we no longer set for provisional, but might still
      //    exist on legacy records) would route them to the wrong page.
      if (user.isProvisional || user.mustCompleteRegistration) {
        console.log("🔄 Provisional activation required, redirecting...");
        window.location.assign("/complete-registration");
        return;
      }
      // 🔹 Требуется смена пароля
      if (user.mustChangePassword) {
        console.log("🔄 Password change required, redirecting...");

        setTimeout(() => {
          navigate("/resetpasswordchange");

          setTimeout(() => {
            if (window.location.pathname !== "/resetpasswordchange") {
              window.location.href = "/resetpasswordchange";
            }
          }, 1000);
        }, 500);

        return;
      }

      // 🔹 Сохраняем данные пользователя
      sessionStorage.setItem("userId", user.id);
      sessionStorage.setItem("userRole", user.role);

      // 🔹 Роутинг по ролям
      switch (user.role) {
        case "admin":
          navigate("/admin/admin-panel");
          break;
        case "doctor":
          navigate("/doctor/home-page");
          break;
        case "patient":
          navigate("/patient/home-page");
          break;
        default:
          navigate("/home");
      }
    } catch (error) {
      console.log(
        "🛑 Login error:",
        error.response?.status,
        error.response?.data,
      );

      const status = error.response?.status;
      const data = error.response?.data || {};

      if (status === 403 && data.mustChangePassword) {
        setTimeout(() => {
          navigate("/resetpasswordchange");

          setTimeout(() => {
            if (window.location.pathname !== "/resetpasswordchange") {
              window.location.href = "/resetpasswordchange";
            }
          }, 1000);
        }, 500);

        return;
      }

      // Слишком много запросов с этого IP (rate-limiter отдаёт текст в data.error)
      if (status === 429) {
        setError(
          t("Login.errors.rateLimited", {
            defaultValue:
              "Слишком много попыток входа. Подождите около 15 минут и попробуйте снова.",
          }),
        );
        return;
      }

      // Аккаунт временно заблокирован после серии неверных паролей (H-1)
      if (
        status === 403 &&
        (data.code === "ACCOUNT_LOCKED" || /locked/i.test(data.message || ""))
      ) {
        const mins = data.retryAfterMinutes || 15;
        setError(
          t("Login.errors.locked", {
            mins,
            defaultValue:
              "Аккаунт временно заблокирован из-за нескольких неверных попыток входа. Попробуйте через ~{{mins}} мин или восстановите пароль.",
          }),
        );
        return;
      }

      setError(data.message || data.error || t("Login.errors.failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="dp-login-root">
        <div className="dp-grid" />

        <div className="dp-card">
          {/* Brand */}
          <div className="dp-brand">
            <div className="dp-brand-icon">🩺</div>
            <div className="dp-brand-name">
              Doc<span>Pats</span>
            </div>
            <div className="dp-brand-tag">v2.0</div>
          </div>

          {/* Title */}
          <div className="dp-title">
            {t("Login.title") || "Добро пожаловать"}
          </div>
          <div className="dp-subtitle">
            {t("Login.subtitle") || "// войдите в аккаунт"}
          </div>
          {searchParams.get("provisional") === "1" && (
            <div
              style={{
                background: "rgba(52,211,153,.1)",
                border: "1px solid rgba(52,211,153,.3)",
                color: "#34d399",
                padding: "12px 14px",
                borderRadius: "8px",
                marginBottom: "20px",
                fontSize: "13px",
                fontFamily: "var(--mono)",
              }}
            >
              {t("Login.provisionalHint", {
                defaultValue:
                  "Войдите с временным паролем из карточки клиники — после этого вы сможете задать постоянный пароль.",
              })}
            </div>
          )}
          {/* Error */}
          {error && (
            <div className="dp-alert">
              <span className="dp-alert-icon">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            {/* EMAIL */}
            <div className="dp-field">
              <label className="dp-label" htmlFor="yourEmail">
                {t("Login.email") || "Email"}
              </label>
              <div className="dp-input-wrap">
                <span className="dp-input-icon">✉</span>
                <input
                  type="email"
                  className="dp-input"
                  id="yourEmail"
                  placeholder="doctor@docpats.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="dp-field">
              <label className="dp-label" htmlFor="yourPassword">
                {t("Login.password") || "Пароль"}
              </label>
              <div className="dp-input-wrap">
                <span className="dp-input-icon">🔑</span>
                <input
                  type={showPass ? "text" : "password"}
                  className="dp-input dp-input-pass"
                  id="yourPassword"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="dp-eye"
                  onClick={() => setShowPass((v) => !v)}
                  tabIndex={-1}
                  aria-label="Toggle password"
                >
                  {showPass ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {/* REMEMBER ME — id="rememberMe" читается в handleSubmit */}
            <label
              htmlFor="rememberMe"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontFamily: "var(--mono)",
                fontSize: "12px",
                color: "var(--muted)",
                marginBottom: "8px",
                cursor: "pointer",
              }}
            >
              <input type="checkbox" id="rememberMe" style={{ cursor: "pointer" }} />
              {t("Login.rememberMe") || "Запомнить меня на 30 дней"}
            </label>

            {/* SUBMIT */}
            <button className="dp-btn" type="submit" disabled={loading}>
              {loading ? (
                <span className="dp-dots">
                  <span />
                  <span />
                  <span />
                </span>
              ) : (
                t("Login.submit") || "Войти"
              )}
            </button>
          </form>

          {/* Footer links */}
          <div className="dp-footer">
            <div className="dp-footer-row">
              <span>{t("Login.noAccount") || "Нет аккаунта?"}</span>
              <Link to="/registration">
                {t("Login.createAccount") || "Создать аккаунт"}
              </Link>
            </div>
            <div className="dp-footer-row">
              <span>{t("Login.forgot") || "Забыли пароль?"}</span>
              <Link to="/resetpassword">
                {t("Login.recover") || "Восстановить"}
              </Link>
            </div>
          </div>

          {/* Security badge */}
          <div className="dp-security">
            <div className="dp-security-dot" />
            HTTPS · SESSION ENCRYPTED · HIPAA READY
          </div>
        </div>
      </div>
    </>
  );
}
