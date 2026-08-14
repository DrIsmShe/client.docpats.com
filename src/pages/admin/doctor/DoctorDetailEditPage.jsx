import React, { useEffect, useState, memo } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import {
  COUNTRY_DIALS,
  COUNTRY_ALIASES,
} from "../../../constants/countries";
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


// ✅ формируем COUNTRIES динамически, без ручного дублирования
const COUNTRIES = COUNTRY_DIALS.map((c) => c.name);

// Приводит унаследованное написание страны к каноническому.
const normalizeCountry = (raw) => COUNTRY_ALIASES[raw] || raw;

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
            // Старые записи хранят «Türkiye», «Viet Nam», «Korea, Republic of» —
            // такие названия эта страница писала до перехода на общий справочник.
            country: normalizeCountry(
              profile.country || user.country || "Azerbaijan",
            ),
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
