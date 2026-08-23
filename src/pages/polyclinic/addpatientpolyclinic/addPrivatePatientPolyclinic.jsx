import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import InputMask from "react-input-mask";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import {
  parsePhoneNumberFromString,
  getCountryCallingCode,
} from "libphonenumber-js";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { track } from "../../../lib/analytics";
import { POLYCLINIC_PATIENT_CREATED } from "../../../lib/events";
import { COUNTRIES, COUNTRY_ISO } from "../../../constants/countries";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Lora:wght@600;700&display=swap');

.ap-root {
  --teal:#0d6b5e; --teal-dark:#094d44; --teal-mid:#0f8a7a;
  --teal-pale:#e8f7f5; --teal-border:#a3ddd5;
  --bg:#eef2f6; --surface:#fff; --surface2:#f7f9fb;
  --border:#dde4ec; --ink:#1a2533; --ink2:#3d4f63; --ink3:#7089a6;
  --red:#c0392b; --red-pale:#fef2f2; --red-border:#fca5a5;
  --sh:0 2px 12px rgba(10,30,60,.07),0 1px 3px rgba(10,30,60,.04);
  --sh-md:0 8px 32px rgba(10,30,60,.10),0 2px 8px rgba(10,30,60,.05);
  --tr:all .18s cubic-bezier(.4,0,.2,1);
  font-family:'DM Sans',system-ui,sans-serif;
  background:var(--bg); min-height:100vh; padding-bottom:64px;
}

/* HERO */
.ap-hero {
  background:linear-gradient(130deg,#094d44 0%,#0d6b5e 55%,#1a7a6e 100%);
  padding:36px 40px 80px; position:relative; overflow:hidden;
}
.ap-hero::before {
  content:''; position:absolute; inset:0; pointer-events:none;
  background:radial-gradient(ellipse 600px 300px at 105% 60%,rgba(20,184,166,.18) 0%,transparent 65%),
             radial-gradient(ellipse 300px 500px at -5% 140%,rgba(4,44,38,.5) 0%,transparent 55%);
}
.ap-hero::after {
  content:''; position:absolute; bottom:-1px; left:0; right:0;
  height:56px; background:var(--bg); clip-path:ellipse(54% 100% at 50% 100%);
}
.ap-hero-inner { position:relative; z-index:1; max-width:780px; }
.ap-hero-tag {
  display:inline-flex; align-items:center; gap:7px;
  font-size:9px; font-weight:600; letter-spacing:.15em; text-transform:uppercase;
  color:rgba(255,255,255,.75); background:rgba(255,255,255,.1);
  border:1px solid rgba(255,255,255,.2); padding:4px 13px; border-radius:100px;
  margin-bottom:16px; backdrop-filter:blur(6px);
}
.ap-hero-tag::before { content:''; width:5px; height:5px; background:#5ef4dd; border-radius:50%; flex-shrink:0; }
.ap-hero-h1 {
  font-family:'Lora',Georgia,serif; font-size:clamp(22px,2.8vw,30px); font-weight:700;
  color:#fff; line-height:1.18; margin:0 0 8px; letter-spacing:-.01em;
}
.ap-hero-sub { font-size:13px; color:rgba(255,255,255,.58); margin:0; }

/* BODY */
.ap-body { max-width:1080px; margin:-44px auto 0; padding:0 24px; position:relative; z-index:2; }
@media(max-width:640px){ .ap-body { padding:0 12px; margin-top:-32px; } }

/* CARD */
.ap-card { background:var(--surface); border:1px solid var(--border); border-radius:18px; box-shadow:var(--sh-md); overflow:hidden; }

/* CARD HEAD */
.ap-card-head { padding:16px 28px 14px; background:var(--surface2); border-bottom:1px solid var(--border); display:flex; align-items:center; gap:11px; }
.ap-card-head-icon { width:34px; height:34px; border-radius:9px; flex-shrink:0; background:var(--teal-pale); border:1px solid var(--teal-border); display:flex; align-items:center; justify-content:center; font-size:16px; }
.ap-card-head-title { font-family:'Lora',Georgia,serif; font-size:15px; font-weight:700; color:var(--ink); }

/* FORM BODY */
.ap-form-body { padding:28px 28px 4px; }
@media(max-width:640px){ .ap-form-body { padding:18px 16px 4px; } }

/* SECTION DIVIDER */
.ap-section { display:flex; align-items:center; gap:10px; margin:28px 0 16px; }
.ap-section:first-child { margin-top:0; }
.ap-section-label { font-size:9px; font-weight:700; letter-spacing:.13em; text-transform:uppercase; color:var(--ink3); white-space:nowrap; }
.ap-section-line { flex:1; height:1px; background:var(--border); }

/* FIELD */
.ap-field { display:grid; grid-template-columns:190px 1fr; align-items:start; gap:0 16px; margin-bottom:13px; }
@media(max-width:680px){ .ap-field { grid-template-columns:1fr; gap:5px 0; } }
.ap-label { font-size:12px; font-weight:500; color:var(--ink2); padding-top:9px; line-height:1.3; display:flex; align-items:baseline; gap:3px; }
.ap-req { color:var(--teal); font-size:14px; line-height:1; }

/* CONTROLS */
.ap-input,.ap-select,.ap-textarea {
  width:100%; background:var(--surface2); border:1.5px solid var(--border);
  border-radius:10px; font-family:'DM Sans',sans-serif; font-size:13px;
  color:var(--ink); transition:var(--tr); outline:none;
}
.ap-input,.ap-select { height:40px; padding:0 13px; }
.ap-textarea { min-height:96px; padding:10px 13px; resize:vertical; line-height:1.55; }
.ap-input::placeholder { color:var(--ink3); }
.ap-input:focus,.ap-select:focus,.ap-textarea:focus {
  border-color:var(--teal-mid); box-shadow:0 0 0 3px rgba(13,107,94,.1); background:#fff;
}
.ap-select {
  appearance:none; cursor:pointer; padding-right:32px;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%237089a6' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat:no-repeat; background-position:right 12px center; background-color:var(--surface2);
}
.ap-hint { font-size:11px; color:var(--ink3); margin-top:4px; }

/* PHOTO */
.ap-photo-wrap { display:flex; align-items:flex-start; gap:14px; flex-wrap:wrap; }
.ap-photo-img { width:80px; height:80px; border-radius:12px; object-fit:cover; border:2px solid var(--border); background:var(--surface2); flex-shrink:0; box-shadow:var(--sh); }
.ap-photo-side { display:flex; flex-direction:column; justify-content:center; gap:8px; }
.ap-photo-btn { display:inline-flex; align-items:center; gap:6px; padding:7px 16px; border-radius:100px; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:11px; font-weight:600; color:var(--teal); background:var(--teal-pale); border:1.5px solid var(--teal-border); transition:var(--tr); }
.ap-photo-btn:hover { background:#fff; box-shadow:0 2px 10px rgba(13,107,94,.14); }
.ap-photo-name { font-size:11px; color:var(--ink3); word-break:break-all; }

/* ERROR */
.ap-error { display:flex; align-items:flex-start; gap:10px; padding:13px 16px; border-radius:10px; background:var(--red-pale); border:1.5px solid var(--red-border); margin-bottom:20px; font-size:13px; color:var(--red); line-height:1.55; animation:apFadeIn .2s ease; }
.ap-error-ico { font-size:15px; flex-shrink:0; margin-top:1px; }
@keyframes apFadeIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:none} }

/* FOOTER */
.ap-form-footer { padding:20px 28px 24px; border-top:1px solid var(--border); background:var(--surface2); display:flex; align-items:center; justify-content:center; }
.ap-submit { display:inline-flex; align-items:center; gap:9px; padding:13px 44px; border:none; border-radius:100px; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:600; color:#fff; cursor:pointer; transition:var(--tr); letter-spacing:.02em; background:linear-gradient(135deg,var(--teal) 0%,var(--teal-mid) 100%); box-shadow:0 4px 18px rgba(13,107,94,.32); }
.ap-submit:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 28px rgba(13,107,94,.42); }
.ap-submit:disabled { opacity:.55; cursor:not-allowed; transform:none; }
.ap-spin { width:15px; height:15px; flex-shrink:0; border:2px solid rgba(255,255,255,.35); border-top-color:#fff; border-radius:50%; animation:apSpin .65s linear infinite; }
@keyframes apSpin { to{transform:rotate(360deg)} }
.ap-loading { display:flex; align-items:center; justify-content:center; min-height:40vh; gap:12px; font-family:'DM Sans',sans-serif; font-size:13px; color:var(--ink3); }
.ap-loading-spin { width:24px; height:24px; border:2.5px solid var(--teal-pale); border-top-color:var(--teal); border-radius:50%; animation:apSpin .7s linear infinite; }
`;

/* ── SUB-COMPONENTS ── */
const FormInput = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
}) => (
  <div className="ap-field">
    <label className="ap-label">
      {label}
      {required && <span className="ap-req">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="ap-input"
    />
  </div>
);

const FormSelect = ({
  label,
  name,
  value,
  onChange,
  options = [],
  required = false,
}) => (
  <div className="ap-field">
    <label className="ap-label">
      {label}
      {required && <span className="ap-req">*</span>}
    </label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="ap-select"
    >
      {options.map((opt, i) => (
        <option key={i} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

const FormTextarea = ({ label, name, value, onChange }) => (
  <div className="ap-field">
    <label className="ap-label">{label}</label>
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      className="ap-textarea"
    />
  </div>
);

/* ── MAIN ── */
const Addpatient = () => {
  const navigate = useNavigate();
  const { t } = useTranslation("Addpatient");

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    phoneNumber: "",
    identityDocument: "",
    firstName: "",
    lastName: "",
    gender: "",
    birthDate: "",
    country: "",
    address: "",
    immunization: "",
    allergies: "",
    chronicDiseases: "",
    familyHistoryOfDisease: "",
    operations: "",
    badHabits: "",
    about: "",
  });

  // Код страны для поля телефона: формат номера знает react-phone-input-2.
  const [phoneCountry, setPhoneCountry] = useState("az");
  const API_BASE = process.env.REACT_APP_API_URL;
  const [profileImage, setPhoto] = useState(null);

  const convertDateFormat = (dateString) => {
    const [dd, mm, yyyy] = (dateString || "").split("/");
    if (dd && mm && yyyy) return `${yyyy}-${mm}-${dd}`;
    return dateString;
  };

  // Телефон в E.164 — либо пусто, если поле не трогали.
  //
  // Поле необязательное, но react-phone-input-2 всегда держит в значении код
  // страны, поэтому «пусто» здесь — «цифр не больше, чем в коде». Прежняя
  // проверка (+ и до 15 цифр) пропускала недобранный номер: подчёркивания
  // маски не цифры и просто отбрасывались, и «+994 50 ___ __» уезжало в базу
  // как «+99450».
  const readPhone = () => {
    const digits = String(formData.phoneNumber || "").replace(/\D/g, "");

    let dial = "";
    try {
      dial = getCountryCallingCode(phoneCountry.toUpperCase());
    } catch {
      dial = "";
    }
    if (digits.length <= dial.length) return { empty: true, value: "" };

    const parsed = parsePhoneNumberFromString(`+${digits}`);
    if (!parsed || !parsed.isValid()) return { empty: false, value: "" };
    return { empty: false, value: parsed.number };
  };

  const isBirthDateValid = useMemo(() => {
    const m = formData.birthDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return false;
    const dd = +m[1],
      mm = +m[2],
      yyyy = +m[3];
    if (
      mm < 1 ||
      mm > 12 ||
      dd < 1 ||
      dd > 31 ||
      yyyy < 1900 ||
      yyyy > new Date().getFullYear()
    )
      return false;
    return true;
  }, [formData.birthDate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "country") {
      // COUNTRY_ISO покрывает весь список COUNTRIES; "az" — на пустой выбор.
      setPhoneCountry(COUNTRY_ISO[value] || "az");
      // Номер очищаем: он был набран под прежнюю страну.
      setFormData((prev) => ({ ...prev, phoneNumber: "" }));
    }
  };

  const handleFileChange = (e) => {
    setPhoto(e.target.files?.[0] || null);
  };

  useEffect(() => {
    const run = async () => {
      try {
        const res = await axios.get(`${API_BASE}/common-for-user`, {
          withCredentials: true,
        });
        if (res?.data?.authenticated) {
          setIsAuthenticated(true);
          setUser(res.data.user);
        } else {
          setIsAuthenticated(false);
          navigate("/login");
        }
      } catch {
        setIsAuthenticated(false);
        navigate("/login");
      } finally {
        setAuthChecked(true);
      }
    };
    run();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError("");
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!formData.email) {
      setGlobalError("Email обязателен.");
      return;
    }
    if (!formData.identityDocument) {
      setGlobalError("Номер удостоверения личности обязателен.");
      return;
    }
    if (!formData.firstName || !formData.lastName) {
      setGlobalError("Имя и фамилия обязательны.");
      return;
    }
    if (!formData.gender) {
      setGlobalError("Пол обязателен.");
      return;
    }
    if (!isBirthDateValid) {
      setGlobalError("Дата рождения должна быть в формате dd/mm/yyyy.");
      return;
    }
    const { empty: phoneEmpty, value: phone } = readPhone();
    if (!phoneEmpty && !phone) {
      setGlobalError(
        "Неверный номер телефона: проверьте страну и количество цифр.",
      );
      return;
    }
    try {
      setSubmitting(true);
      const payload = { ...formData };
      payload.birthDate = convertDateFormat(payload.birthDate);
      payload.phoneNumber = phone;
      const fd = new FormData();
      for (const k of Object.keys(payload)) fd.append(k, payload[k] ?? "");
      if (profileImage) fd.append("image", profileImage);
      const res = await axios.post(
        `${API_BASE}/clinic/add-private-patient-polyclinic`,
        fd,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      track(POLYCLINIC_PATIENT_CREATED, { kind: "private", withPhoto: Boolean(profileImage) });
      alert(res?.data?.message || "Patient added successfully!");
      navigate("/dp/polyclinic");
    } catch (err) {
      const errorCode = err?.response?.data?.code;
      if (errorCode === "PATIENT_LIMIT_REACHED") {
        setGlobalError(t("planLimitReached"));
        setTimeout(() => navigate("/pricing"), 1500);
        return;
      }
      if (errorCode === "DUPLICATE_PATIENT") {
        setGlobalError(t("duplicatePatient"));
        return;
      }
      setGlobalError(
        err?.response?.data?.message || err?.message || t("unknownError"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const countries = COUNTRIES;

  useEffect(() => {
    return () => {
      if (profileImage) URL.revokeObjectURL(profileImage);
    };
  }, [profileImage]);

  if (!authChecked)
    return (
      <div className="ap-root">
        <style>{CSS}</style>
        <div className="ap-loading">
          <div className="ap-loading-spin" />
          {t("loading")}
        </div>
      </div>
    );
  if (!isAuthenticated) return null;

  return (
    <div className="ap-root">
      <style>{CSS}</style>

      <div className="ap-hero">
        <div className="ap-hero-inner">
          <div className="ap-hero-tag">{t("common:dp.pageTitle.polyclinic")}</div>
          <h1 className="ap-hero-h1">➕ {t("title")}</h1>
          <p className="ap-hero-sub"> {t("heroSub")}</p>
        </div>
      </div>

      <div className="ap-body">
        <div className="ap-card">
          <div className="ap-card-head">
            <span className="ap-card-head-icon">🫀</span>
            <span className="ap-card-head-title">{t("title")}</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="ap-form-body">
              {globalError && (
                <div className="ap-error">
                  <span className="ap-error-ico">⚠️</span>
                  {globalError}
                </div>
              )}

              <div className="ap-section">
                <span className="ap-section-label">{t("common:dp.patient.mainInfo")}</span>
                <span className="ap-section-line" />
              </div>

              <FormInput
                label={t("email")}
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />

              <div className="ap-field">
                <label className="ap-label">{t("patientPhoto")}</label>
                <div>
                  <div className="ap-photo-wrap">
                    <img
                      src={
                        profileImage
                          ? URL.createObjectURL(profileImage)
                          : "/images/avatar/1.jpg"
                      }
                      alt={t("patientArea:addPatient.profile")}
                      className="ap-photo-img"
                    />
                    <div className="ap-photo-side">
                      <button
                        type="button"
                        className="ap-photo-btn"
                        onClick={() =>
                          document.getElementById("profileImage").click()
                        }
                      >
                        📁 {t("choosePhoto")}
                      </button>
                      <span className="ap-photo-name">
                        {profileImage
                          ? profileImage.name
                          : t("noPhotoSelected")}
                      </span>
                    </div>
                  </div>
                  <input
                    type="file"
                    id="profileImage"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                </div>
              </div>

              <FormInput
                label={t("identityDocument")}
                name="identityDocument"
                value={formData.identityDocument}
                onChange={handleChange}
                required
              />
              <FormInput
                label={t("firstName")}
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
              <FormInput
                label={t("lastName")}
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />

              <div className="ap-section">
                <span className="ap-section-label">{t("common:dp.patient.contacts")}</span>
                <span className="ap-section-line" />
              </div>

              <FormSelect
                label={t("country")}
                name="country"
                value={formData.country}
                onChange={handleChange}
                options={[
                  { value: "", label: t("selectCountry") },
                  ...countries.map((c) => ({ value: c, label: c })),
                ]}
              />

              <div className="ap-field">
                <label className="ap-label">{t("phone")}</label>
                <div>
                  <PhoneInput
                    country={phoneCountry}
                    value={formData.phoneNumber}
                    countryCodeEditable={false}
                    enableAreaCodes={true}
                    onChange={(value) =>
                      setFormData((prev) => ({ ...prev, phoneNumber: value }))
                    }
                    inputClass="ap-input"
                    inputStyle={{ width: "100%", paddingLeft: 48 }}
                  />
                  <div className="ap-hint">{t("phoneAuto")}</div>
                </div>
              </div>

              <div className="ap-section">
                <span className="ap-section-label">{t("common:dp.patient.demography")}</span>
                <span className="ap-section-line" />
              </div>

              <FormSelect
                label={t("gender")}
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                options={[
                  { value: "", label: t("selectGender") },
                  { value: "male", label: t("male") },
                  { value: "female", label: t("female") },
                ]}
              />
              <FormInput
                label={t("birthDate")}
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                placeholder="dd/mm/yyyy"
              />

              <div className="ap-section">
                <span className="ap-section-label">{t("common:dp.patient.medicalHistory")}</span>
                <span className="ap-section-line" />
              </div>

              <FormSelect
                label={t("immunization")}
                name="immunization"
                value={formData.immunization}
                onChange={handleChange}
                options={[
                  { value: "", label: t("selectImmunization") },
                  { value: "fully", label: t("fullyVaccinated") },
                  { value: "partial", label: t("partiallyVaccinated") },
                  { value: "none", label: t("notVaccinated") },
                  { value: "unknown", label: t("unknown") },
                ]}
              />
              <FormSelect
                label={t("allergies")}
                name="allergies"
                value={formData.allergies}
                onChange={handleChange}
                options={[
                  { value: "", label: t("selectAllergen") },
                  ...t("allergenList", { returnObjects: true }),
                ]}
              />
              <FormInput
                label={t("chronicDiseases")}
                name="chronicDiseases"
                value={formData.chronicDiseases}
                onChange={handleChange}
              />
              <FormInput
                label={t("familyHistory")}
                name="familyHistoryOfDisease"
                value={formData.familyHistoryOfDisease}
                onChange={handleChange}
              />
              <FormInput
                label={t("operations")}
                name="operations"
                value={formData.operations}
                onChange={handleChange}
              />
              <FormSelect
                label={t("badHabits")}
                name="badHabits"
                value={formData.badHabits}
                onChange={handleChange}
                options={[
                  { value: "", label: t("chooseBadHabit") },
                  { value: "none", label: t("noBadHabits") },
                  { value: "smoking", label: t("smoking") },
                  { value: "alcohol", label: t("alcohol") },
                  { value: "narcotic", label: t("narcotic") },
                  { value: "overeating", label: t("overeating") },
                  { value: "sleep", label: t("lackOfSleep") },
                ]}
              />

              <div className="ap-section">
                <span className="ap-section-label">{t("common:dp.patient.extra")}</span>
                <span className="ap-section-line" />
              </div>

              <FormTextarea
                label={t("about")}
                name="about"
                value={formData.about}
                onChange={handleChange}
              />
            </div>

            <div className="ap-form-footer">
              <button type="submit" className="ap-submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <div className="ap-spin" />
                    {t("saving")}
                  </>
                ) : (
                  <>✓&nbsp;{t("addPatient")}</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Addpatient;
