import React, { useEffect, useState } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Link, useNavigate } from "react-router-dom";
import "react-phone-input-2/lib/style.css";
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

  .dp-reg-root {
    min-height: 100vh;
    background: var(--bg);
    font-family: var(--sans);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 48px 16px 72px;
    position: relative;
    overflow-x: hidden;
  }

  .dp-reg-root::before {
    content: '';
    position: fixed;
    top: -200px; left: -200px;
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(61,127,255,.1) 0%, transparent 65%);
    pointer-events: none;
    animation: dp-pulse 7s ease-in-out infinite alternate;
  }
  .dp-reg-root::after {
    content: '';
    position: fixed;
    bottom: -150px; right: -150px;
    width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(124,61,255,.09) 0%, transparent 65%);
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
      linear-gradient(rgba(61,127,255,.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(61,127,255,.035) 1px, transparent 1px);
    background-size: 48px 48px;
    pointer-events: none;
  }

  /* ── CARD ── */
  .dp-reg-card {
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 540px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 24px;
    padding: 52px 48px 48px;
    box-shadow:
      0 0 0 1px rgba(79,139,255,.08),
      0 40px 100px rgba(0,0,0,.45),
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
    background: rgba(61,127,255,.1);
    border: 1px solid rgba(61,127,255,.2);
    padding: 3px 8px;
    border-radius: 4px;
  }

  /* ── STEP INDICATOR ── */
  .dp-steps {
    display: flex;
    align-items: center;
    gap: 0;
    margin-bottom: 28px;
  }
  .dp-step {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: var(--muted);
    flex: 1;
  }
  .dp-step.active { color: var(--accent); }
  .dp-step.done { color: var(--green); }
  .dp-step-num {
    width: 24px; height: 24px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px;
    font-weight: 700;
    background: var(--surface2);
    border: 1px solid var(--border);
    flex-shrink: 0;
  }
  .dp-step.active .dp-step-num {
    background: rgba(61,127,255,.15);
    border-color: var(--accent);
    color: var(--accent);
  }
  .dp-step.done .dp-step-num {
    background: rgba(34,197,94,.15);
    border-color: var(--green);
    color: var(--green);
  }
  .dp-step-line {
    flex: 1;
    height: 1px;
    background: var(--border);
    margin: 0 8px;
  }

  /* ── TITLE ── */
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

  /* ── ROLE PICKER ── */
  .dp-role-picker {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 20px;
  }
  .dp-role-btn {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px 14px;
    cursor: pointer;
    text-align: center;
    transition: all .2s;
    color: var(--muted);
    font-family: var(--sans);
  }
  .dp-role-btn:hover {
    border-color: rgba(61,127,255,.4);
    color: var(--text);
  }
  .dp-role-btn.selected {
    background: rgba(61,127,255,.1);
    border-color: var(--accent);
    color: var(--text);
    box-shadow: 0 0 20px rgba(61,127,255,.15);
  }
  .dp-role-btn.selected-patient {
    background: rgba(34,197,94,.08);
    border-color: var(--green);
    box-shadow: 0 0 20px rgba(34,197,94,.1);
  }
  .dp-role-icon { font-size: 28px; margin-bottom: 8px; }
  .dp-role-label { font-size: 15px; font-weight: 700; letter-spacing: -.01em; }
  .dp-role-desc { font-size: 11px; font-family: var(--mono); color: var(--muted); margin-top: 3px; }

  /* ── SECTION HEADER ── */
  .dp-section-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: var(--muted);
    margin: 22px 0 14px;
  }
  .dp-section-label::before, .dp-section-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
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
  .dp-field-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-bottom: 18px;
  }
  .dp-field-row .dp-field { margin-bottom: 0; }

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
    -webkit-appearance: none;
  }
  .dp-input::placeholder { color: var(--muted); }
  .dp-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(79,139,255,.15);
  }
  .dp-input.no-icon { padding-left: 14px; }
  .dp-input option { background: #222d40; }

  /* ── DATEPICKER OVERRIDE ── */
  .dp-datepicker-wrap .react-datepicker-wrapper { width: 100%; }
  .dp-datepicker-wrap .react-datepicker__input-container input {
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
  .dp-datepicker-wrap .react-datepicker__input-container input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(79,139,255,.15);
  }
  .dp-datepicker-wrap .react-datepicker {
    background: #161b28;
    border: 1px solid #1e2535;
    font-family: var(--mono);
    color: var(--text);
    border-radius: 10px;
    box-shadow: 0 20px 60px rgba(0,0,0,.5);
  }
  .dp-datepicker-wrap .react-datepicker__header {
    background: #111520;
    border-bottom: 1px solid #1e2535;
    border-radius: 10px 10px 0 0;
  }
  .dp-datepicker-wrap .react-datepicker__current-month,
  .dp-datepicker-wrap .react-datepicker__day-name,
  .dp-datepicker-wrap .react-datepicker-time__header { color: var(--muted); font-size: 11px; }
  .dp-datepicker-wrap .react-datepicker__day { color: var(--text); border-radius: 6px; }
  .dp-datepicker-wrap .react-datepicker__day:hover { background: rgba(61,127,255,.2); }
  .dp-datepicker-wrap .react-datepicker__day--selected { background: var(--accent) !important; color: white; }
  .dp-datepicker-wrap .react-datepicker__day--keyboard-selected { background: rgba(61,127,255,.3); }
  .dp-datepicker-wrap .react-datepicker__navigation-icon::before { border-color: var(--muted); }
  .dp-datepicker-wrap select {
    background: #161b28;
    color: var(--text);
    border: 1px solid #1e2535;
    border-radius: 4px;
    padding: 2px 4px;
    font-size: 12px;
  }

  /* ── PASSWORD TOGGLE ── */
  .dp-eye {
    position: absolute;
    right: 13px; top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: var(--muted);
    cursor: pointer;
    font-size: 13px;
    padding: 0;
    transition: color .2s;
  }
  .dp-eye:hover { color: var(--text); }
  .dp-input-pass { padding-right: 38px; }

  /* ── CHECKBOX ── */
  .dp-checkbox-wrap {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 14px 16px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 8px;
    margin-bottom: 20px;
    cursor: pointer;
    transition: border-color .2s;
  }
  .dp-checkbox-wrap:hover { border-color: rgba(61,127,255,.3); }
  .dp-checkbox-wrap input[type=checkbox] {
    width: 16px; height: 16px;
    accent-color: var(--accent);
    margin-top: 2px;
    flex-shrink: 0;
    cursor: pointer;
  }
  .dp-checkbox-label {
    font-size: 13px;
    color: var(--muted);
    font-family: var(--mono);
    line-height: 1.6;
  }
  .dp-checkbox-label a {
    color: var(--accent);
    text-decoration: none;
  }
  .dp-checkbox-label a:hover { text-decoration: underline; }

  /* ── AGE BADGE ── */
  .dp-age-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-family: var(--mono);
    font-size: 10px;
    padding: 3px 9px;
    border-radius: 20px;
    margin-top: 6px;
  }
  .dp-age-badge.minor {
    background: rgba(245,158,11,.12);
    border: 1px solid rgba(245,158,11,.25);
    color: var(--yellow);
  }
  .dp-age-badge.adult {
    background: rgba(34,197,94,.1);
    border: 1px solid rgba(34,197,94,.2);
    color: var(--green);
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
  }
  .dp-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,.12) 0%, transparent 60%);
  }
  .dp-btn:hover { opacity: .9; transform: translateY(-1px); box-shadow: 0 8px 28px rgba(61,127,255,.35); }
  .dp-btn:active { transform: translateY(0); }

  /* ── FOOTER ── */
  .dp-footer {
    margin-top: 22px;
    text-align: center;
    font-family: var(--mono);
    font-size: 12px;
    color: var(--muted);
  }
  .dp-footer a { color: var(--accent); text-decoration: none; }
  .dp-footer a:hover { text-decoration: underline; }

  /* ── SECURITY ── */
  .dp-security {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-top: 24px;
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

  /* ── CHILD NOTICE ── */
  .dp-notice {
    background: rgba(245,158,11,.08);
    border: 1px solid rgba(245,158,11,.2);
    border-radius: 8px;
    padding: 12px 14px;
    margin-bottom: 16px;
    font-size: 12px;
    font-family: var(--mono);
    color: var(--yellow);
    display: flex;
    gap: 8px;
    align-items: flex-start;
  }
`;

export default function Registration() {
  const { t } = useTranslation("auth");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [speciality, setSpeciality] = useState("");
  const [specialities, setSpecialities] = useState([]);
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState(null);
  const [parentEmail, setParentEmail] = useState("");

  const [bio, setBio] = useState("");
  const [agreement, setAgreement] = useState(false);
  const [role, setRole] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    if (role === "doctor") {
      axios
        .get(`${API_BASE}/auth/register/get-specialization`)
        .then((response) => setSpecialities(response.data))
        .catch((error) => console.error("Error fetching specialities:", error));
    } else {
      setSpeciality("");
      setSpecialities([]);
    }
  }, [role]);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prev) => !prev);
  };

  const today = new Date();

  const maxDateForDoctor = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate(),
  );

  const minDate = new Date(
    today.getFullYear() - 100,
    today.getMonth(),
    today.getDate(),
  );

  const calculateAge = (dob) => {
    if (!dob) return null;
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(dateOfBirth);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!dateOfBirth) {
      return alert(t("Registration.errors.dob"));
    }

    const formData = {
      email,
      password,
      speciality,
      username,
      firstName,
      lastName,
      dateOfBirth: dateOfBirth.toISOString(),
      bio,
      agreement,
      role,
      // Реферальный код из ссылки /register?ref=CODE (если пришли по приглашению)
      ref:
        new URLSearchParams(window.location.search).get("ref") || undefined,
      parentEmail:
        role === "patient" && age !== null && age < 18
          ? parentEmail
          : undefined,
    };

    try {
      const response = await axios.post(`${API_BASE}/auth/register`, formData);

      if (response?.data) {
        alert(t("Registration.success"));
        navigate(`/confirmationregister?isChild=${age < 18 ? "1" : "0"}`);
      }
    } catch (error) {
      alert(
        t("Registration.failed") +
          ": " +
          (error.response?.data?.message || error.message),
      );
    }
  };

  // Determine step for visual indicator
  const step = !role ? 1 : !firstName && !lastName ? 2 : 3;

  return (
    <>
      <style>{styles}</style>
      <div className="dp-reg-root">
        <div className="dp-grid" />

        <div className="dp-reg-card">
          {/* Brand */}
          <div className="dp-brand">
            <div className="dp-brand-icon">🩺</div>
            <div className="dp-brand-name">
              Doc<span>Pats</span>
            </div>
            <div className="dp-brand-tag">Регистрация</div>
          </div>

          {/* Step indicator */}
          <div className="dp-steps">
            <div
              className={`dp-step ${step >= 1 ? (step > 1 ? "done" : "active") : ""}`}
            >
              <div className="dp-step-num">{step > 1 ? "✓" : "1"}</div>
              <span>Роль</span>
            </div>
            <div className="dp-step-line" />
            <div
              className={`dp-step ${step >= 2 ? (step > 2 ? "done" : "active") : ""}`}
            >
              <div className="dp-step-num">{step > 2 ? "✓" : "2"}</div>
              <span>Данные</span>
            </div>
            <div className="dp-step-line" />
            <div className={`dp-step ${step >= 3 ? "active" : ""}`}>
              <div className="dp-step-num">3</div>
              <span>Аккаунт</span>
            </div>
          </div>

          {/* Title */}
          <div className="dp-title">
            {t("Registration.title") || "Создать аккаунт"}
          </div>
          <div className="dp-subtitle">
            {t("Registration.subtitle") || "// заполните все поля"}
          </div>

          <form onSubmit={handleSubmit}>
            {/* ── ROLE ── */}
            <div className="dp-section-label">Выберите роль</div>
            <div className="dp-role-picker">
              <div
                className={`dp-role-btn ${role === "doctor" ? "selected" : ""}`}
                onClick={() => setRole("doctor")}
              >
                <div className="dp-role-icon">👨‍⚕️</div>
                <div className="dp-role-label">
                  {t("Registration.doctor") || "Врач"}
                </div>
                <div className="dp-role-desc">// специалист</div>
              </div>
              <div
                className={`dp-role-btn ${role === "patient" ? "selected selected-patient" : ""}`}
                onClick={() => setRole("patient")}
              >
                <div className="dp-role-icon">🧑‍🦱</div>
                <div className="dp-role-label">
                  {t("Registration.patient") || "Пациент"}
                </div>
                <div className="dp-role-desc">// пользователь</div>
              </div>
            </div>
            {/* Hidden select for form validation */}
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              style={{ display: "none" }}
            >
              <option value=""></option>
              <option value="doctor">doctor</option>
              <option value="patient">patient</option>
            </select>

            {/* ── SPECIALITY ── */}
            {role === "doctor" && (
              <div className="dp-field">
                <label className="dp-label">
                  {t("Registration.speciality") || "Специализация"}
                </label>
                <div className="dp-input-wrap">
                  <span className="dp-input-icon">🏥</span>
                  <select
                    value={speciality}
                    onChange={(e) => setSpeciality(e.target.value)}
                    className="dp-input"
                    required
                  >
                    <option value="">
                      {t("Registration.chooseSpeciality") ||
                        "Выберите специализацию"}
                    </option>
                    {specialities.map((spec) => (
                      <option key={spec._id} value={spec.name}>
                        {spec.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* ── PERSONAL DATA ── */}
            <div className="dp-section-label">Личные данные</div>

            <div className="dp-field-row">
              {/* FIRST NAME */}
              <div className="dp-field">
                <label className="dp-label">
                  {t("Registration.firstName") || "Имя"}
                </label>
                <div className="dp-input-wrap">
                  <span className="dp-input-icon">✦</span>
                  <input
                    className="dp-input"
                    placeholder="Иван"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* LAST NAME */}
              <div className="dp-field">
                <label className="dp-label">
                  {t("Registration.lastName") || "Фамилия"}
                </label>
                <div className="dp-input-wrap">
                  <span className="dp-input-icon">✦</span>
                  <input
                    className="dp-input"
                    placeholder="Иванов"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* GENDER */}
            <div className="dp-field">
              <label className="dp-label">
                {t("Registration.gender") || "Пол"}
              </label>
              <div className="dp-input-wrap">
                <span className="dp-input-icon">⚥</span>
                <select
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="dp-input"
                  required
                >
                  <option value="">
                    {t("Registration.chooseVariant") || "Выберите"}
                  </option>
                  <option value="Woman">
                    {t("Registration.woman") || "Женщина"}
                  </option>
                  <option value="Man">
                    {t("Registration.man") || "Мужчина"}
                  </option>
                </select>
              </div>
            </div>

            {/* DOB */}
            <div className="dp-field">
              <label className="dp-label">
                {t("Registration.dob") || "Дата рождения"}
              </label>
              <div className="dp-input-wrap dp-datepicker-wrap">
                <span className="dp-input-icon">📅</span>
                <DatePicker
                  selected={dateOfBirth}
                  onChange={setDateOfBirth}
                  dateFormat="dd/MM/yyyy"
                  minDate={minDate}
                  maxDate={role === "doctor" ? maxDateForDoctor : today}
                  showYearDropdown
                  showMonthDropdown
                  dropdownMode="select"
                  scrollableYearDropdown
                  yearDropdownItemNumber={100}
                  placeholderText={
                    t("Registration.dobPlaceholder") || "дд/мм/гггг"
                  }
                  required
                />
              </div>
              {age !== null && (
                <div className={`dp-age-badge ${age < 18 ? "minor" : "adult"}`}>
                  {age < 18 ? "⚠" : "✓"} {age}{" "}
                  {age === 1 ? "год" : age < 5 ? "года" : "лет"}
                  {age < 18 && " · несовершеннолетний"}
                </div>
              )}
            </div>

            {/* CHILD NOTICE + PARENT EMAIL */}
            {role === "patient" && age !== null && age < 18 && (
              <>
                <div className="dp-notice">
                  <span>⚠</span>
                  <span>
                    Для несовершеннолетних пациентов требуется email родителя
                    или опекуна.
                  </span>
                </div>
                <div className="dp-field">
                  <label className="dp-label">
                    {t("Registration.parentEmail") || "Email родителя"}
                  </label>
                  <div className="dp-input-wrap">
                    <span className="dp-input-icon">✉</span>
                    <input
                      type="email"
                      className="dp-input"
                      placeholder="parent@example.com"
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {/* ── ACCOUNT ── */}
            <div className="dp-section-label">Аккаунт</div>

            {/* USERNAME */}
            <div className="dp-field">
              <label className="dp-label">
                {t("Registration.username") || "Никнейм"}
              </label>
              <div className="dp-input-wrap">
                <span className="dp-input-icon">@</span>
                <input
                  className="dp-input"
                  placeholder="ivan_ivanov"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* EMAIL */}
            <div className="dp-field">
              <label className="dp-label">
                {t("Registration.email") || "Email"}
              </label>
              <div className="dp-input-wrap">
                <span className="dp-input-icon">✉</span>
                <input
                  type="email"
                  className="dp-input"
                  placeholder="ivan@docpats.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="dp-field">
              <label className="dp-label">
                {t("Registration.password") || "Пароль"}
              </label>
              <div className="dp-input-wrap">
                <span className="dp-input-icon">🔑</span>
                <input
                  type={isPasswordVisible ? "text" : "password"}
                  className="dp-input dp-input-pass"
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
                  aria-label="Toggle password"
                >
                  {isPasswordVisible ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {/* TERMS */}
            <label className="dp-checkbox-wrap">
              <input
                type="checkbox"
                checked={agreement}
                onChange={(e) => setAgreement(e.target.checked)}
                required
              />
              <span className="dp-checkbox-label">
                {t("Registration.termsText") || "Я согласен с"}{" "}
                <a
                  href="/terms-consent-page"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("Registration.termsLink") || "условиями использования"}
                </a>
              </span>
            </label>

            {/* SUBMIT */}
            <button className="dp-btn" type="submit">
              {t("Registration.submit") || "Создать аккаунт"} →
            </button>
          </form>

          {/* Footer */}
          <div className="dp-footer">
            {t("Registration.alreadyHaveAccount") || "Уже есть аккаунт?"}{" "}
            <Link to="/login">{t("Registration.login") || "Войти"}</Link>
          </div>

          {/* Security */}
          <div className="dp-security">
            <div className="dp-security-dot" />
            HTTPS · HIPAA COMPLIANT · DATA ENCRYPTED
          </div>
        </div>
      </div>
    </>
  );
}
