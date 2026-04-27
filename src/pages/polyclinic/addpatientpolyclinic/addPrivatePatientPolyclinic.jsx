import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import InputMask from "react-input-mask";
import axios from "axios";
import { useTranslation } from "react-i18next";

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

  const [phoneMask, setPhoneMask] = useState("+___ ___ ___ ___");
  const API_BASE = process.env.REACT_APP_API_URL;
  const [profileImage, setPhoto] = useState(null);

  const convertDateFormat = (dateString) => {
    const [dd, mm, yyyy] = (dateString || "").split("/");
    if (dd && mm && yyyy) return `${yyyy}-${mm}-${dd}`;
    return dateString;
  };

  const toE164 = (s) => {
    if (!s) return "";
    const raw = String(s).replace(/[^\d+]/g, "");
    const withPlus = raw.startsWith("+")
      ? raw
      : `+${raw.replace(/^(\+)?/, "")}`;
    return /^\+\d{1,15}$/.test(withPlus) ? withPlus : "";
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

  const countryPhoneMeta = {
    Afghanistan: { code: "+93", digits: 9 },
    Albania: { code: "+355", digits: 9 },
    Algeria: { code: "+213", digits: 9 },
    Andorra: { code: "+376", digits: 6 },
    Angola: { code: "+244", digits: 9 },
    Argentina: { code: "+54", digits: 10 },
    Armenia: { code: "+374", digits: 8 },
    Australia: { code: "+61", digits: 9 },
    Austria: { code: "+43", digits: 10 },
    Azerbaijan: { code: "+994", digits: 9 },
    Bahrain: { code: "+973", digits: 8 },
    Bangladesh: { code: "+880", digits: 10 },
    Belarus: { code: "+375", digits: 9 },
    Belgium: { code: "+32", digits: 9 },
    Brazil: { code: "+55", digits: 10 },
    Bulgaria: { code: "+359", digits: 9 },
    Canada: { code: "+1", digits: 10 },
    China: { code: "+86", digits: 11 },
    Croatia: { code: "+385", digits: 9 },
    Cyprus: { code: "+357", digits: 8 },
    Czech_Republic: { code: "+420", digits: 9 },
    Denmark: { code: "+45", digits: 8 },
    Egypt: { code: "+20", digits: 10 },
    Estonia: { code: "+372", digits: 8 },
    Finland: { code: "+358", digits: 9 },
    France: { code: "+33", digits: 9 },
    Georgia: { code: "+995", digits: 9 },
    Germany: { code: "+49", digits: 10 },
    Greece: { code: "+30", digits: 10 },
    Hungary: { code: "+36", digits: 9 },
    Iceland: { code: "+354", digits: 7 },
    India: { code: "+91", digits: 10 },
    Iran: { code: "+98", digits: 10 },
    Iraq: { code: "+964", digits: 10 },
    Ireland: { code: "+353", digits: 9 },
    Israel: { code: "+972", digits: 9 },
    Italy: { code: "+39", digits: 10 },
    Japan: { code: "+81", digits: 10 },
    Jordan: { code: "+962", digits: 9 },
    Kazakhstan: { code: "+7", digits: 10 },
    Kuwait: { code: "+965", digits: 8 },
    Kyrgyzstan: { code: "+996", digits: 9 },
    Latvia: { code: "+371", digits: 8 },
    Lebanon: { code: "+961", digits: 8 },
    Lithuania: { code: "+370", digits: 8 },
    Luxembourg: { code: "+352", digits: 9 },
    Malaysia: { code: "+60", digits: 9 },
    Mexico: { code: "+52", digits: 10 },
    Moldova: { code: "+373", digits: 8 },
    Monaco: { code: "+377", digits: 8 },
    Mongolia: { code: "+976", digits: 8 },
    Montenegro: { code: "+382", digits: 8 },
    Morocco: { code: "+212", digits: 9 },
    Netherlands: { code: "+31", digits: 9 },
    New_Zealand: { code: "+64", digits: 9 },
    Nigeria: { code: "+234", digits: 10 },
    North_Macedonia: { code: "+389", digits: 8 },
    Norway: { code: "+47", digits: 8 },
    Oman: { code: "+968", digits: 8 },
    Pakistan: { code: "+92", digits: 10 },
    Palestine: { code: "+970", digits: 9 },
    Peru: { code: "+51", digits: 9 },
    Philippines: { code: "+63", digits: 10 },
    Poland: { code: "+48", digits: 9 },
    Portugal: { code: "+351", digits: 9 },
    Qatar: { code: "+974", digits: 8 },
    Romania: { code: "+40", digits: 9 },
    Russia: { code: "+7", digits: 10 },
    Saudi_Arabia: { code: "+966", digits: 9 },
    Serbia: { code: "+381", digits: 8 },
    Singapore: { code: "+65", digits: 8 },
    Slovakia: { code: "+421", digits: 9 },
    Slovenia: { code: "+386", digits: 8 },
    South_Africa: { code: "+27", digits: 9 },
    South_Korea: { code: "+82", digits: 9 },
    Spain: { code: "+34", digits: 9 },
    Sri_Lanka: { code: "+94", digits: 9 },
    Sweden: { code: "+46", digits: 9 },
    Switzerland: { code: "+41", digits: 9 },
    Syria: { code: "+963", digits: 9 },
    Taiwan: { code: "+886", digits: 9 },
    Tajikistan: { code: "+992", digits: 9 },
    Tanzania: { code: "+255", digits: 9 },
    Thailand: { code: "+66", digits: 9 },
    Turkey: { code: "+90", digits: 10 },
    Turkmenistan: { code: "+993", digits: 8 },
    UAE: { code: "+971", digits: 9 },
    Uganda: { code: "+256", digits: 9 },
    Ukraine: { code: "+380", digits: 9 },
    United_Kingdom: { code: "+44", digits: 10 },
    United_States: { code: "+1", digits: 10 },
    Uruguay: { code: "+598", digits: 9 },
    Uzbekistan: { code: "+998", digits: 9 },
    Vietnam: { code: "+84", digits: 9 },
    Yemen: { code: "+967", digits: 9 },
    Zambia: { code: "+260", digits: 9 },
    Zimbabwe: { code: "+263", digits: 9 },
  };

  const makeMask = (code, digits) => {
    if (!code || !digits) return "+9 999 999 9999";
    const g = [];
    if (digits <= 7) g.push("9".repeat(digits));
    else if (digits === 8) g.push("99", "999", "999");
    else if (digits === 9) g.push("99", "999", "99", "99");
    else if (digits === 10) g.push("999", "999", "9999");
    else if (digits === 11) g.push("999", "999", "999", "99");
    else g.push("9".repeat(digits));
    return `${code} ${g.join(" ")}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "country") {
      const meta = countryPhoneMeta[value];
      if (meta) {
        setPhoneMask(makeMask(meta.code, meta.digits));
        setFormData((prev) => ({ ...prev, phoneNumber: meta.code + " " }));
      }
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
    let phone = formData.phoneNumber ? toE164(formData.phoneNumber) : "";
    if (formData.phoneNumber && !phone) {
      setGlobalError(
        "Неверный формат телефона. Используйте международный формат, например +994...",
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

  const countries = [
    "Afghanistan",
    "Albania",
    "Algeria",
    "Andorra",
    "Angola",
    "Antigua and Barbuda",
    "Argentina",
    "Armenia",
    "Australia",
    "Austria",
    "Azerbaijan",
    "Bahamas",
    "Bahrain",
    "Bangladesh",
    "Barbados",
    "Belarus",
    "Belgium",
    "Belize",
    "Benin",
    "Bhutan",
    "Bolivia",
    "Bosnia and Herzegovina",
    "Botswana",
    "Brazil",
    "Brunei",
    "Bulgaria",
    "Burkina Faso",
    "Burundi",
    "Cabo Verde",
    "Cambodia",
    "Cameroon",
    "Canada",
    "Central African Republic",
    "Chad",
    "Chile",
    "China",
    "Colombia",
    "Comoros",
    "Congo (Congo-Brazzaville)",
    "Costa Rica",
    "Croatia",
    "Cuba",
    "Cyprus",
    "Czech Republic",
    "Democratic Republic of the Congo",
    "Denmark",
    "Djibouti",
    "Dominica",
    "Dominican Republic",
    "Ecuador",
    "Egypt",
    "El Salvador",
    "Equatorial Guinea",
    "Eritrea",
    "Estonia",
    "Eswatini",
    "Ethiopia",
    "Fiji",
    "Finland",
    "France",
    "Gabon",
    "Gambia",
    "Georgia",
    "Germany",
    "Ghana",
    "Greece",
    "Grenada",
    "Guatemala",
    "Guinea",
    "Guinea-Bissau",
    "Guyana",
    "Haiti",
    "Honduras",
    "Hungary",
    "Iceland",
    "India",
    "Indonesia",
    "Iran",
    "Iraq",
    "Ireland",
    "Israel",
    "Italy",
    "Ivory Coast",
    "Jamaica",
    "Japan",
    "Jordan",
    "Kazakhstan",
    "Kenya",
    "Kiribati",
    "Kuwait",
    "Kyrgyzstan",
    "Laos",
    "Latvia",
    "Lebanon",
    "Lesotho",
    "Liberia",
    "Libya",
    "Liechtenstein",
    "Lithuania",
    "Luxembourg",
    "Madagascar",
    "Malawi",
    "Malaysia",
    "Maldives",
    "Mali",
    "Malta",
    "Marshall Islands",
    "Mauritania",
    "Mauritius",
    "Mexico",
    "Micronesia",
    "Moldova",
    "Monaco",
    "Mongolia",
    "Montenegro",
    "Morocco",
    "Mozambique",
    "Myanmar (Burma)",
    "Namibia",
    "Nauru",
    "Nepal",
    "Netherlands",
    "New Zealand",
    "Nicaragua",
    "Niger",
    "Nigeria",
    "North Korea",
    "North Macedonia",
    "Norway",
    "Oman",
    "Pakistan",
    "Palau",
    "Palestine",
    "Panama",
    "Papua New Guinea",
    "Paraguay",
    "Peru",
    "Philippines",
    "Poland",
    "Portugal",
    "Qatar",
    "Romania",
    "Russia",
    "Rwanda",
    "Saint Kitts and Nevis",
    "Saint Lucia",
    "Saint Vincent and the Grenadines",
    "Samoa",
    "San Marino",
    "Sao Tome and Principe",
    "Saudi Arabia",
    "Senegal",
    "Serbia",
    "Seychelles",
    "Sierra Leone",
    "Singapore",
    "Slovakia",
    "Slovenia",
    "Solomon Islands",
    "Somalia",
    "South Africa",
    "South Korea",
    "South Sudan",
    "Spain",
    "Sri Lanka",
    "Sudan",
    "Suriname",
    "Sweden",
    "Switzerland",
    "Syria",
    "Taiwan",
    "Tajikistan",
    "Tanzania",
    "Thailand",
    "Timor-Leste",
    "Togo",
    "Tonga",
    "Trinidad and Tobago",
    "Tunisia",
    "Turkey",
    "Turkmenistan",
    "Tuvalu",
    "UAE",
    "Uganda",
    "Ukraine",
    "United Kingdom",
    "United States",
    "Uruguay",
    "Uzbekistan",
    "Vanuatu",
    "Vatican City",
    "Venezuela",
    "Vietnam",
    "Yemen",
    "Zambia",
    "Zimbabwe",
  ];

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
          <div className="ap-hero-tag">DocPats · Polyclinic</div>
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
                <span className="ap-section-label">Основная информация</span>
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
                      alt="Profile"
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
                <span className="ap-section-label">Контакты</span>
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
                  <InputMask
                    mask={phoneMask}
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    name="phoneNumber"
                    className="ap-input"
                    placeholder={phoneMask}
                  />
                  <div className="ap-hint">{t("phoneAuto")}</div>
                </div>
              </div>

              <div className="ap-section">
                <span className="ap-section-label">Демография</span>
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
                <span className="ap-section-label">Медицинская история</span>
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
                <span className="ap-section-label">Дополнительно</span>
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
