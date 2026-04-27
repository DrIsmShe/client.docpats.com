import React, { useEffect, useState, memo } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaClinicMedical,
  FaHospitalSymbol,
  FaGlobe,
  FaBuilding,
  FaPhoneAlt,
  FaInfoCircle,
  FaUserGraduate,
  FaCheckCircle,
  FaTimesCircle,
  FaUserMd,
  FaFileAlt,
} from "react-icons/fa";

const COUNTRY_DIALS = [
  { code: "AF", name: "Afghanistan", dial: "+93" },
  { code: "AL", name: "Albania", dial: "+355" },
  { code: "DZ", name: "Algeria", dial: "+213" },
  { code: "AD", name: "Andorra", dial: "+376" },
  { code: "AO", name: "Angola", dial: "+244" },
  { code: "AG", name: "Antigua and Barbuda", dial: "+1-268" },
  { code: "AR", name: "Argentina", dial: "+54" },
  { code: "AM", name: "Armenia", dial: "+374" },
  { code: "AU", name: "Australia", dial: "+61" },
  { code: "AT", name: "Austria", dial: "+43" },
  { code: "AZ", name: "Azerbaijan", dial: "+994" },
  { code: "BS", name: "Bahamas", dial: "+1-242" },
  { code: "BH", name: "Bahrain", dial: "+973" },
  { code: "BD", name: "Bangladesh", dial: "+880" },
  { code: "BB", name: "Barbados", dial: "+1-246" },
  { code: "BY", name: "Belarus", dial: "+375" },
  { code: "BE", name: "Belgium", dial: "+32" },
  { code: "BZ", name: "Belize", dial: "+501" },
  { code: "BJ", name: "Benin", dial: "+229" },
  { code: "BT", name: "Bhutan", dial: "+975" },
  { code: "BO", name: "Bolivia", dial: "+591" },
  { code: "BA", name: "Bosnia and Herzegovina", dial: "+387" },
  { code: "BW", name: "Botswana", dial: "+267" },
  { code: "BR", name: "Brazil", dial: "+55" },
  { code: "BN", name: "Brunei Darussalam", dial: "+673" },
  { code: "BG", name: "Bulgaria", dial: "+359" },
  { code: "BF", name: "Burkina Faso", dial: "+226" },
  { code: "BI", name: "Burundi", dial: "+257" },
  { code: "KH", name: "Cambodia", dial: "+855" },
  { code: "CM", name: "Cameroon", dial: "+237" },
  { code: "CA", name: "Canada", dial: "+1" },
  { code: "CV", name: "Cape Verde", dial: "+238" },
  { code: "CF", name: "Central African Republic", dial: "+236" },
  { code: "TD", name: "Chad", dial: "+235" },
  { code: "CL", name: "Chile", dial: "+56" },
  { code: "CN", name: "China", dial: "+86" },
  { code: "CO", name: "Colombia", dial: "+57" },
  { code: "KM", name: "Comoros", dial: "+269" },
  { code: "CG", name: "Congo", dial: "+242" },
  { code: "CD", name: "Congo, Democratic Republic", dial: "+243" },
  { code: "CR", name: "Costa Rica", dial: "+506" },
  { code: "HR", name: "Croatia", dial: "+385" },
  { code: "CU", name: "Cuba", dial: "+53" },
  { code: "CY", name: "Cyprus", dial: "+357" },
  { code: "CZ", name: "Czech Republic", dial: "+420" },
  { code: "DK", name: "Denmark", dial: "+45" },
  { code: "DJ", name: "Djibouti", dial: "+253" },
  { code: "DM", name: "Dominica", dial: "+1-767" },
  { code: "DO", name: "Dominican Republic", dial: "+1-809" },
  { code: "EC", name: "Ecuador", dial: "+593" },
  { code: "EG", name: "Egypt", dial: "+20" },
  { code: "SV", name: "El Salvador", dial: "+503" },
  { code: "GQ", name: "Equatorial Guinea", dial: "+240" },
  { code: "ER", name: "Eritrea", dial: "+291" },
  { code: "EE", name: "Estonia", dial: "+372" },
  { code: "ET", name: "Ethiopia", dial: "+251" },
  { code: "FI", name: "Finland", dial: "+358" },
  { code: "FR", name: "France", dial: "+33" },
  { code: "GE", name: "Georgia", dial: "+995" },
  { code: "DE", name: "Germany", dial: "+49" },
  { code: "GH", name: "Ghana", dial: "+233" },
  { code: "GR", name: "Greece", dial: "+30" },
  { code: "GD", name: "Grenada", dial: "+1-473" },
  { code: "GT", name: "Guatemala", dial: "+502" },
  { code: "GN", name: "Guinea", dial: "+224" },
  { code: "GW", name: "Guinea-Bissau", dial: "+245" },
  { code: "GY", name: "Guyana", dial: "+592" },
  { code: "HT", name: "Haiti", dial: "+509" },
  { code: "HN", name: "Honduras", dial: "+504" },
  { code: "HK", name: "Hong Kong", dial: "+852" },
  { code: "HU", name: "Hungary", dial: "+36" },
  { code: "IS", name: "Iceland", dial: "+354" },
  { code: "IN", name: "India", dial: "+91" },
  { code: "ID", name: "Indonesia", dial: "+62" },
  { code: "IR", name: "Iran", dial: "+98" },
  { code: "IQ", name: "Iraq", dial: "+964" },
  { code: "IE", name: "Ireland", dial: "+353" },
  { code: "IL", name: "Israel", dial: "+972" },
  { code: "IT", name: "Italy", dial: "+39" },
  { code: "JM", name: "Jamaica", dial: "+1-876" },
  { code: "JP", name: "Japan", dial: "+81" },
  { code: "JO", name: "Jordan", dial: "+962" },
  { code: "KZ", name: "Kazakhstan", dial: "+7" },
  { code: "KE", name: "Kenya", dial: "+254" },
  { code: "KR", name: "Korea, Republic of", dial: "+82" },
  { code: "KW", name: "Kuwait", dial: "+965" },
  { code: "KG", name: "Kyrgyzstan", dial: "+996" },
  { code: "LA", name: "Lao PDR", dial: "+856" },
  { code: "LV", name: "Latvia", dial: "+371" },
  { code: "LB", name: "Lebanon", dial: "+961" },
  { code: "LR", name: "Liberia", dial: "+231" },
  { code: "LY", name: "Libya", dial: "+218" },
  { code: "LI", name: "Liechtenstein", dial: "+423" },
  { code: "LT", name: "Lithuania", dial: "+370" },
  { code: "LU", name: "Luxembourg", dial: "+352" },
  { code: "MO", name: "Macao", dial: "+853" },
  { code: "MK", name: "North Macedonia", dial: "+389" },
  { code: "MG", name: "Madagascar", dial: "+261" },
  { code: "MW", name: "Malawi", dial: "+265" },
  { code: "MY", name: "Malaysia", dial: "+60" },
  { code: "MV", name: "Maldives", dial: "+960" },
  { code: "ML", name: "Mali", dial: "+223" },
  { code: "MT", name: "Malta", dial: "+356" },
  { code: "MR", name: "Mauritania", dial: "+222" },
  { code: "MU", name: "Mauritius", dial: "+230" },
  { code: "MX", name: "Mexico", dial: "+52" },
  { code: "MD", name: "Moldova", dial: "+373" },
  { code: "MC", name: "Monaco", dial: "+377" },
  { code: "MN", name: "Mongolia", dial: "+976" },
  { code: "ME", name: "Montenegro", dial: "+382" },
  { code: "MA", name: "Morocco", dial: "+212" },
  { code: "MZ", name: "Mozambique", dial: "+258" },
  { code: "MM", name: "Myanmar", dial: "+95" },
  { code: "NA", name: "Namibia", dial: "+264" },
  { code: "NP", name: "Nepal", dial: "+977" },
  { code: "NL", name: "Netherlands", dial: "+31" },
  { code: "NZ", name: "New Zealand", dial: "+64" },
  { code: "NI", name: "Nicaragua", dial: "+505" },
  { code: "NE", name: "Niger", dial: "+227" },
  { code: "NG", name: "Nigeria", dial: "+234" },
  { code: "NO", name: "Norway", dial: "+47" },
  { code: "OM", name: "Oman", dial: "+968" },
  { code: "PK", name: "Pakistan", dial: "+92" },
  { code: "PA", name: "Panama", dial: "+507" },
  { code: "PG", name: "Papua New Guinea", dial: "+675" },
  { code: "PY", name: "Paraguay", dial: "+595" },
  { code: "PE", name: "Peru", dial: "+51" },
  { code: "PH", name: "Philippines", dial: "+63" },
  { code: "PL", name: "Poland", dial: "+48" },
  { code: "PT", name: "Portugal", dial: "+351" },
  { code: "QA", name: "Qatar", dial: "+974" },
  { code: "RO", name: "Romania", dial: "+40" },
  { code: "RU", name: "Russia", dial: "+7" },
  { code: "RW", name: "Rwanda", dial: "+250" },
  { code: "SA", name: "Saudi Arabia", dial: "+966" },
  { code: "SN", name: "Senegal", dial: "+221" },
  { code: "RS", name: "Serbia", dial: "+381" },
  { code: "SG", name: "Singapore", dial: "+65" },
  { code: "SK", name: "Slovakia", dial: "+421" },
  { code: "SI", name: "Slovenia", dial: "+386" },
  { code: "ZA", name: "South Africa", dial: "+27" },
  { code: "ES", name: "Spain", dial: "+34" },
  { code: "LK", name: "Sri Lanka", dial: "+94" },
  { code: "SD", name: "Sudan", dial: "+249" },
  { code: "SE", name: "Sweden", dial: "+46" },
  { code: "CH", name: "Switzerland", dial: "+41" },
  { code: "SY", name: "Syrian Arab Republic", dial: "+963" },
  { code: "TW", name: "Taiwan", dial: "+886" },
  { code: "TJ", name: "Tajikistan", dial: "+992" },
  { code: "TZ", name: "Tanzania", dial: "+255" },
  { code: "TH", name: "Thailand", dial: "+66" },
  { code: "TL", name: "Timor-Leste", dial: "+670" },
  { code: "TG", name: "Togo", dial: "+228" },
  { code: "TT", name: "Trinidad and Tobago", dial: "+1-868" },
  { code: "TN", name: "Tunisia", dial: "+216" },
  { code: "TR", name: "Türkiye", dial: "+90" },
  { code: "TM", name: "Turkmenistan", dial: "+993" },
  { code: "UG", name: "Uganda", dial: "+256" },
  { code: "UA", name: "Ukraine", dial: "+380" },
  { code: "AE", name: "United Arab Emirates", dial: "+971" },
  { code: "GB", name: "United Kingdom", dial: "+44" },
  { code: "US", name: "United States", dial: "+1" },
  { code: "UY", name: "Uruguay", dial: "+598" },
  { code: "UZ", name: "Uzbekistan", dial: "+998" },
  { code: "VE", name: "Venezuela", dial: "+58" },
  { code: "VN", name: "Viet Nam", dial: "+84" },
  { code: "YE", name: "Yemen", dial: "+967" },
  { code: "ZM", name: "Zambia", dial: "+260" },
  { code: "ZW", name: "Zimbabwe", dial: "+263" },
];

// ✅ формируем COUNTRIES динамически, без ручного дублирования
const COUNTRIES = COUNTRY_DIALS.map((c) => c.name);

/* ---------- Helpers ---------- */
const normalizeDial = (d) => (d ? `+${String(d).replace(/[^\d]/g, "")}` : "");
const looksLikeE164 = (s) => /^\+\d{6,15}$/.test(s.trim());
const cleanPayload = (obj) => {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === "" || v == null) continue;
    if (typeof v === "boolean" || typeof v === "number") out[k] = v;
    else if (Array.isArray(v) && v.length) out[k] = v;
    else if (String(v).trim() !== "") out[k] = String(v).trim();
  }
  return out;
};

const DIALS_NORMALIZED = COUNTRY_DIALS.map((c) => ({
  ...c,
  dialNorm: normalizeDial(c.dial),
}));

const findByCountryName = (name) =>
  DIALS_NORMALIZED.find(
    (c) => c.name.toLowerCase() === String(name).toLowerCase(),
  );

const findByPhonePrefix = (phone) => {
  if (!phone?.startsWith("+")) return null;
  const matches = DIALS_NORMALIZED.filter((c) => phone.startsWith(c.dialNorm));
  return matches.sort((a, b) => b.dialNorm.length - a.dialNorm.length)[0];
};

const stripKnownDial = (phone) => {
  if (!phone?.startsWith("+")) return phone || "";
  const hit = findByPhonePrefix(phone);
  if (!hit) return phone;
  return phone.slice(hit.dialNorm.length);
};

const FieldWrap = memo(({ label, icon: Icon, children, hint }) => (
  <div className="space-y-1 w-full">
    {label && (
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        {Icon && <Icon className="text-emerald-500" />}
        {label}
      </label>
    )}
    <div className="w-full">{children}</div>
    {hint && <p className="text-xs text-slate-500">{hint}</p>}
  </div>
));

const Card = memo(({ title, icon: Icon, children }) => (
  <section className="w-full rounded-2xl border border-emerald-100 bg-white/90 p-6 shadow-md hover:shadow-lg transition-all duration-300">
    {title && (
      <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Icon className="text-emerald-600 text-lg" />
        {title}
      </h2>
    )}
    <div className="flex flex-col gap-5">{children}</div>
  </section>
));

export default function DoctorDetailEditPage() {
  const [verificationStatus, setVerificationStatus] = useState("pending");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [doctorProfileId, setDoctorProfileId] = useState(null);

  const { id: doctorId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    company: "",
    address: "",
    clinic: "",
    country: "Azerbaijan",
    phoneNumber: "+994",
    about: "",
    educationInstitution: "",
    educationStartYear: "",
    educationEndYear: "",
    specializationInstitution: "",
    specializationStartYear: "",
    specializationEndYear: "",
    isVerified: false,
    verificationDocuments: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const API_BASE = process.env.REACT_APP_API_URL;
  const getUrl = `${API_BASE}/admin/doctor-detail-edit/${doctorId}?by=user`;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${API_BASE}/admin/user-detail-get/${doctorId}`,
          { withCredentials: true },
        );

        if (res.data?.success && res.data?.doctorProfile) {
          const profile = res.data.doctorProfile;
          const user = res.data.user;
          setDoctorProfileId(profile._id);
          setVerificationStatus(profile.verificationStatus || "pending");

          // ✅ ВАЖНО — сохраняем ID профиля врача

          // ✅ Заполняем поля формы из базы
          setForm({
            company: profile.company || "",
            address: profile.address || "",
            clinic: profile.clinic || "",
            country: profile.country || user.country || "Azerbaijan",
            phoneNumber:
              profile.phoneNumber || user.phoneNumber || "+994501112233",
            about: profile.about || "",
            educationInstitution: profile.educationInstitution || "",
            educationStartYear: profile.educationStartYear || "",
            educationEndYear: profile.educationEndYear || "",
            specializationInstitution: profile.specializationInstitution || "",
            specializationStartYear: profile.specializationStartYear || "",
            specializationEndYear: profile.specializationEndYear || "",
            isVerified: profile.isVerified || false,
            verificationDocuments: Array.isArray(profile.verificationDocuments)
              ? profile.verificationDocuments.join(", ")
              : profile.verificationDocuments || "",
          });
        } else {
          setError(res.data?.message || "Профиль врача не найден.");
        }
      } catch (err) {
        console.error("Ошибка загрузки профиля:", err);
        setError("Ошибка загрузки данных врача.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [doctorId]);

  /* === уведомления === */
  useEffect(() => {
    if (error || okMsg) {
      const t = setTimeout(() => {
        setError("");
        setOkMsg("");
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [error, okMsg]);

  /* === обработчики === */
  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((s) => ({ ...s, [name]: type === "checkbox" ? checked : value }));
  };
  const onCountryChange = (e) => {
    const selectedCode = e.target.value;
    const found = COUNTRY_DIALS.find((c) => c.code === selectedCode);
    if (found) {
      let stripped = stripKnownDial(form.phoneNumber);
      // Если пользователь ещё не вводил номер — подставляем примерный шаблон
      if (!stripped || stripped.trim().length < 3) stripped = "501234567";

      setForm((s) => ({
        ...s,
        country: found.name,
        phoneNumber: `${found.dial}${stripped}`,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await axios.patch(getUrl, form, {
        withCredentials: true,
      });
      if (data?.ok) setOkMsg("Профиль успешно обновлён.");
      else setError(data?.message || "Ошибка сохранения.");
    } catch {
      setError("Ошибка при сохранении.");
    } finally {
      setSaving(false);
    }
  };
  const updateVerificationStatus = async (status) => {
    if (!doctorProfileId) {
      setError("Doctor profile ID not loaded");
      return;
    }
    try {
      setUpdatingStatus(true);

      const { data } = await axios.put(
        `${API_BASE}/admin/verification/doctor/${doctorProfileId}`,
        { status },
        { withCredentials: true },
      );

      if (data.success) {
        setVerificationStatus(data.verificationStatus);
        setOkMsg("Статус верификации обновлён");
      } else {
        setError(data.message || "Ошибка обновления статуса");
      }
    } catch (err) {
      console.error(err);
      setError("Ошибка при обновлении статуса");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-500">
        Загрузка данных врача...
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sky-50">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-slate-600 hover:text-emerald-600 transition"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 18l-6-6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Назад
            </button>
            <h1 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <FaUserMd className="text-emerald-600" />
              Редактирование профиля врача
            </h1>
          </div>
          <button
            style={{ color: "green" }}
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-xl bg-emerald-600 px-5 py-2  font-medium shadow hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? "Сохранение…" : "💾 Сохранить"}
          </button>
        </div>
      </div>

      {/* Alerts */}
      <div className="max-w-6xl mx-auto px-6 pt-4 space-y-3">
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 flex items-center gap-2">
            <FaTimesCircle /> {error}
          </div>
        )}
        {okMsg && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 px-4 py-3 flex items-center gap-2">
            <FaCheckCircle /> {okMsg}
          </div>
        )}
      </div>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8"
      >
        {/* === Профиль === */}
        <Card title="Профиль врача" icon={FaBuilding}>
          <FieldWrap label="Company" icon={FaBuilding}>
            <input
              style={{ width: "100%" }}
              name="company"
              value={form.company || ""}
              onChange={onChange}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-emerald-400"
              placeholder="Место работы или организация"
            />
          </FieldWrap>

          <FieldWrap label="Clinic" icon={FaClinicMedical}>
            <input
              style={{ width: "100%" }}
              name="clinic"
              value={form.clinic || ""}
              onChange={onChange}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-emerald-400"
              placeholder="Название клиники"
            />
          </FieldWrap>

          <FieldWrap label="Address" icon={FaGlobe}>
            <input
              style={{ width: "100%" }}
              name="address"
              value={form.address || ""}
              onChange={onChange}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-emerald-400"
              placeholder="Адрес врача"
            />
          </FieldWrap>

          <FieldWrap label="Country" icon={FaHospitalSymbol}>
            <select
              style={{ width: "100%" }}
              name="country"
              value={
                COUNTRY_DIALS.find((c) => c.name === form.country)?.code || "AZ"
              }
              onChange={onCountryChange}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 bg-white focus:ring-2 focus:ring-emerald-400"
            >
              {COUNTRY_DIALS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </FieldWrap>
        </Card>

        {/* === Контакты === */}
        {/* === Контакты === */}
        {/* === Контакты === */}
        <Card title="Контакты" icon={FaPhoneAlt}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* ✅ Поле выбора кода страны */}
            <FieldWrap label="Phone Code" icon={FaPhoneAlt}>
              <select
                style={{ width: "100%" }}
                name="dial"
                value={findByPhonePrefix(form.phoneNumber)?.code || "AZ"}
                onChange={onCountryChange}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 bg-white focus:ring-2 focus:ring-emerald-400"
              >
                {COUNTRY_DIALS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.dial})
                  </option>
                ))}
              </select>
            </FieldWrap>

            {/* ✅ Поле ввода полного номера (всегда показывает значение из базы) */}
            <FieldWrap label="Phone Number">
              <input
                style={{ width: "100%" }}
                name="phoneNumber"
                // 🔥 Отображает номер из базы (если он уже есть)
                value={form.phoneNumber || ""}
                onChange={onChange}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-emerald-400"
                placeholder="+994501112233"
              />
            </FieldWrap>
          </div>
        </Card>

        {/* === Остальные блоки === */}
        <Card title="О враче" icon={FaInfoCircle}>
          <FieldWrap label="About" icon={FaInfoCircle}>
            <textarea
              style={{ width: "100%" }}
              name="about"
              value={form.about || ""}
              onChange={onChange}
              rows={5}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-emerald-400 resize-none"
              placeholder="Опыт, подход, достижения"
            />
          </FieldWrap>
        </Card>

        {/* === Образование === */}
        <Card title="Образование" icon={FaUserGraduate}>
          <FieldWrap label="Institution">
            <input
              style={{ width: "100%" }}
              name="educationInstitution"
              value={form.educationInstitution || ""}
              onChange={onChange}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-emerald-400"
              placeholder="Название университета"
            />
          </FieldWrap>

          <FieldWrap label="Period">
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <input
                style={{ width: "100%" }}
                type="date"
                name="educationStartYear"
                value={form.educationStartYear || ""}
                onChange={onChange}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-emerald-400"
              />
              <input
                style={{ width: "100%" }}
                type="date"
                name="educationEndYear"
                value={form.educationEndYear || ""}
                onChange={onChange}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          </FieldWrap>
        </Card>

        {/* === Специализация === */}
        <Card title="Специализация" icon={FaFileAlt}>
          <FieldWrap label="Institution">
            <input
              style={{ width: "100%" }}
              name="specializationInstitution"
              value={form.specializationInstitution || ""}
              onChange={onChange}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-emerald-400"
              placeholder="Место специализации"
            />
          </FieldWrap>

          <FieldWrap label="Period">
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <input
                style={{ width: "100%" }}
                type="date"
                name="specializationStartYear"
                value={form.specializationStartYear || ""}
                onChange={onChange}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-emerald-400"
              />
              <input
                style={{ width: "100%" }}
                type="date"
                name="specializationEndYear"
                value={form.specializationEndYear || ""}
                onChange={onChange}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          </FieldWrap>
        </Card>

        {/* === Администрирование === */}
        <Card title="Администрирование" icon={FaCheckCircle}>
          <div className="flex gap-3 mt-2">
            <button
              style={{ color: "red" }}
              type="button"
              onClick={() => updateVerificationStatus("approved")}
              disabled={updatingStatus || verificationStatus === "approved"}
              className={`px-4 py-2 rounded-xl  ${
                verificationStatus === "approved"
                  ? "bg-emerald-400"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              ✅ Approved
            </button>

            <button
              style={{ color: "red" }}
              type="button"
              onClick={() => updateVerificationStatus("rejected")}
              disabled={updatingStatus || verificationStatus === "rejected"}
              className={`px-4 py-2 rounded-xl  ${
                verificationStatus === "rejected"
                  ? "bg-red-400"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              ❌ Rejected
            </button>

            <button
              style={{ color: "red" }}
              type="button"
              onClick={() => updateVerificationStatus("pending")}
              disabled={updatingStatus || verificationStatus === "pending"}
              className={`px-4 py-2 rounded-xl  ${
                verificationStatus === "pending"
                  ? "bg-gray-400"
                  : "bg-gray-600 hover:bg-gray-700"
              }`}
            >
              ⏳ Pending
            </button>
          </div>
        </Card>
      </form>
    </div>
  );
}
