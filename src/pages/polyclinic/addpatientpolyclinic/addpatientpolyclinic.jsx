import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import InputMask from "react-input-mask";
import axios from "axios";
import { track } from "../../../lib/analytics";
import { POLYCLINIC_PATIENT_CREATED } from "../../../lib/events";

const Addpatient = () => {
  const navigate = useNavigate();

  // -------- Auth / UI state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState("");

  // -------- Form state
  const [formData, setFormData] = useState({
    email: "",
    phoneNumber: "", // 📞
    identityDocument: "",
    firstName: "",
    lastName: "",
    gender: "",
    birthDate: "", // dd/mm/yyyy (маска)
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

  // -------- Helpers
  const convertDateFormat = (dateString) => {
    // dd/mm/yyyy -> yyyy-mm-dd
    const [dd, mm, yyyy] = (dateString || "").split("/");
    if (dd && mm && yyyy) return `${yyyy}-${mm}-${dd}`;
    return dateString;
  };

  // Нормализация телефона в E.164: + и до 15 цифр
  const toE164 = (s) => {
    if (!s) return "";
    const raw = String(s).replace(/[^\d+]/g, "");
    const withPlus = raw.startsWith("+")
      ? raw
      : `+${raw.replace(/^(\+)?/, "")}`;
    const ok = /^\+\d{1,15}$/.test(withPlus);
    return ok ? withPlus : "";
  };

  const isBirthDateValid = useMemo(() => {
    // простая проверка dd/mm/yyyy
    const m = formData.birthDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return false;
    const dd = +m[1],
      mm = +m[2],
      yyyy = +m[3];
    if (mm < 1 || mm > 12) return false;
    if (dd < 1 || dd > 31) return false;
    if (yyyy < 1900 || yyyy > new Date().getFullYear()) return false;
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
  // Создаём маску по коду страны и количеству цифр
  const makeMask = (code, digits) => {
    if (!code || !digits) return "+999 999 9999"; // дефолт

    // делаем маску вида: +994 999 999 999 (в зависимости от digits)
    const numbers = "9".repeat(digits);

    return code + " " + numbers;
  };

  // -------- Generic handlers
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "country") {
      const meta = countryPhoneMeta[value];

      if (meta) {
        const newMask = makeMask(meta.code, meta.digits);
        setPhoneMask(newMask);

        setFormData((prev) => ({
          ...prev,
          phoneNumber: meta.code + " ",
        }));
      }
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    setPhoto(f || null);
  };

  // -------- Auth check
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
      } catch (err) {
        setIsAuthenticated(false);
        navigate("/login");
      } finally {
        setAuthChecked(true);
      }
    };
    run();
  }, [navigate]);

  // -------- Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError("");

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    // Валидации перед отправкой
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

    // Телефон опционален. Если указан — должен быть валидным E.164
    let phone = formData.phoneNumber ? toE164(formData.phoneNumber) : "";
    if (formData.phoneNumber && !phone) {
      setGlobalError(
        "Неверный формат телефона. Используйте международный формат, например +994...",
      );
      return;
    }

    try {
      setSubmitting(true);

      // Подготавливаем данные
      const payload = { ...formData };
      payload.birthDate = convertDateFormat(payload.birthDate);
      payload.phoneNumber = phone; // уже E.164

      const fd = new FormData();
      for (const k of Object.keys(payload)) {
        fd.append(k, payload[k] ?? "");
      }
      if (profileImage) fd.append("image", profileImage);

      const res = await axios.post(
        `${API_BASE}/clinic/add-patient-polyclinic`,
        fd,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      // Только тип карточки и был ли снимок. Всё содержимое формы — ПД.
      track(POLYCLINIC_PATIENT_CREATED, { kind: "regular", withPhoto: Boolean(profileImage) });

      alert(res?.data?.message || "Patient added successfully!");
      navigate("/dp/polyclinic");
    } catch (err) {
      // Показать сообщение сервера, если есть
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "There was an error adding the patient.";
      setGlobalError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // -------- Static data
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

  const allergens = [
    "No allergy",
    "Penicillins (Amoxicillin, Ampicillin, Benzylpenicillin)",
    "Cephalosporins (Cefalexin, Ceftriaxone, Cefazolin)",
    "Sulfonamides (Sulfamethoxazole, Biseptol)",
    "Macrolides (Erythromycin, Clarithromycin, Azithromycin)",
    "Tetracyclines (Doxycycline, Tetracycline)",
    "Fluoroquinolones (Ciprofloxacin, Levofloxacin, Moxifloxacin)",
    "Aspirin (Acetylsalicylic acid)",
    "Ibuprofen (Nurofen, Brufen)",
    "Ketoprofen (Ketonal)",
    "Diclofenac (Voltaren)",
    "Piroxicam",
    "Lidocaine",
    "Novocaine",
    "Articaine",
    "Procaine",
    "Insulin (animal origin)",
    "Hormonal contraceptives",
    "Corticosteroids",
    "Phenytoin",
    "Carbamazepine",
    "Lamotrigine",
    "Iodine-containing contrast agents",
    "Gadolinium (MRI contrast)",
    "Anti-tetanus serum",
    "MMR (if gelatin/egg allergy)",
    "Influenza vaccines",
    "Beta-blockers",
    "ACE inhibitors",
    "Dust",
    "Plant blooms",
    "Food (nuts, milk, eggs, honey, seafood)",
    "Animals",
    "Mold",
    "Insects",
    "Chemicals",
    "Metals",
    "Cold",
    "Sun",
    "Other",
  ];
  useEffect(() => {
    return () => {
      if (profileImage) {
        URL.revokeObjectURL(profileImage);
      }
    };
  }, [profileImage]);

  // -------- Render
  if (!authChecked) return <div>Загрузка...</div>;
  if (!isAuthenticated) return null;

  return (
    <div>
      <div className="pagetitle">
        <h1>Add New patient</h1>
      </div>

      <section className="section profile">
        <div className="row">
          <div className="col-xl-12">
            <div className="card">
              <div className="card-body pt-3">
                <div className="tab-content pt-2">
                  <div
                    className="tab-pane fade show active profile-edit pt-3"
                    id="profile-edit"
                  >
                    <form onSubmit={handleSubmit}>
                      {/* Глобальная ошибка */}
                      {globalError && (
                        <div className="alert alert-danger" role="alert">
                          {globalError}
                        </div>
                      )}

                      {/* Email */}
                      <div className="row mb-3">
                        <label className="col-md-4 col-lg-3 col-form-label">
                          Email
                        </label>
                        <div className="col-md-8 col-lg-9">
                          <input
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            type="email"
                            className="form-control"
                            required
                          />
                        </div>
                      </div>

                      {/* Photo */}
                      <div className="row mb-3">
                        <label
                          htmlFor="profileImage"
                          className="col-md-4 col-lg-3 col-form-label"
                        >
                          Patient photo
                        </label>
                        <div className="col-md-8 col-lg-9">
                          <img
                            src={
                              profileImage
                                ? URL.createObjectURL(profileImage)
                                : "/images/avatar/1.jpg"
                            }
                            alt="Profile"
                            style={{ maxWidth: "150px", borderRadius: "8px" }}
                          />
                          <div className="pt-2 d-flex align-items-center gap-2">
                            <button
                              type="button"
                              className="btn btn-outline-primary"
                              onClick={() =>
                                document.getElementById("profileImage").click()
                              }
                            >
                              📁 Choose Photo
                            </button>
                            <span style={{ fontSize: "0.9em", color: "#555" }}>
                              {profileImage
                                ? profileImage.name
                                : "No photo selected"}
                            </span>
                          </div>
                          <input
                            type="file"
                            id="profileImage"
                            accept="image/*"
                            onChange={handleFileChange}
                            style={{ display: "none" }}
                            className="form-control"
                          />
                        </div>
                      </div>

                      {/* Identity Document */}
                      <div className="row mb-3">
                        <label className="col-md-4 col-lg-3 col-form-label">
                          Identity Document
                        </label>
                        <div className="col-md-8 col-lg-9">
                          <input
                            type="text"
                            name="identityDocument"
                            value={formData.identityDocument}
                            onChange={handleChange}
                            className="form-control"
                            required
                          />
                        </div>
                      </div>

                      {/* First & Last Name */}
                      <div className="row mb-3">
                        <label className="col-md-4 col-lg-3 col-form-label">
                          First Name
                        </label>
                        <div className="col-md-8 col-lg-9">
                          <input
                            type="text"
                            className="form-control"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>

                      <div className="row mb-3">
                        <label className="col-md-4 col-lg-3 col-form-label">
                          Last Name
                        </label>
                        <div className="col-md-8 col-lg-9">
                          <input
                            type="text"
                            className="form-control"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>

                      {/* Country */}
                      <div className="row mb-3">
                        <label className="col-md-4 col-lg-3 col-form-label">
                          Country
                        </label>
                        <div className="col-md-8 col-lg-9">
                          <select
                            className="form-control"
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                          >
                            <option value="">Select country</option>
                            {countries.map((c, i) => (
                              <option key={i} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      {/* Phone */}
                      <div className="row mb-3">
                        <label className="col-md-4 col-lg-3 col-form-label">
                          Phone
                        </label>
                        <div className="col-md-8 col-lg-9">
                          <InputMask
                            mask={phoneMask}
                            maskChar="_"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            name="phoneNumber"
                            className="form-control"
                            placeholder={phoneMask}
                          />

                          <small className="text-muted">
                            Automatically uses country phone code.
                          </small>
                        </div>
                      </div>

                      {/* Gender */}
                      <div className="row mb-3">
                        <label className="col-md-4 col-lg-3 col-form-label">
                          Gender
                        </label>
                        <div className="col-md-8 col-lg-9">
                          <select
                            className="form-control"
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            required
                          >
                            <option value="">Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                          </select>
                        </div>
                      </div>

                      {/* Birth date */}
                      <div className="row mb-3">
                        <label className="col-md-4 col-lg-3 col-form-label">
                          Birth date
                        </label>
                        <div className="col-md-8 col-lg-9">
                          <InputMask
                            mask="99/99/9999"
                            value={formData.birthDate}
                            onChange={handleChange}
                            name="birthDate"
                            placeholder="dd/mm/yyyy"
                            className={`form-control ${
                              formData.birthDate && !isBirthDateValid
                                ? "is-invalid"
                                : ""
                            }`}
                          />
                          {!isBirthDateValid && formData.birthDate && (
                            <div className="invalid-feedback">
                              Use format dd/mm/yyyy.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Immunization */}
                      <div className="row mb-3">
                        <label className="col-md-4 col-lg-3 col-form-label">
                          Immunization
                        </label>
                        <div className="col-md-8 col-lg-9">
                          <select
                            className="form-control"
                            name="immunization"
                            value={formData.immunization}
                            onChange={handleChange}
                          >
                            <option value="">
                              Select your immunization status
                            </option>
                            <option value="Fully vaccinated">
                              Fully vaccinated
                            </option>
                            <option value="Partially vaccinated">
                              Partially vaccinated
                            </option>
                            <option value="Not vaccinated">
                              Not vaccinated
                            </option>
                            <option value="Unknown">Unknown</option>
                          </select>
                        </div>
                      </div>

                      {/* Allergies */}
                      <div className="row mb-3">
                        <label className="col-md-4 col-lg-3 col-form-label">
                          Allergies
                        </label>
                        <div className="col-md-8 col-lg-9">
                          <select
                            className="form-control"
                            name="allergies"
                            value={formData.allergies}
                            onChange={handleChange}
                          >
                            <option value="">Select an allergen</option>
                            {allergens.map((a, i) => (
                              <option key={i} value={a}>
                                {a}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Chronic / Family / Operations */}
                      <div className="row mb-3">
                        <label className="col-md-4 col-lg-3 col-form-label">
                          Chronic Diseases
                        </label>
                        <div className="col-md-8 col-lg-9">
                          <input
                            type="text"
                            className="form-control"
                            name="chronicDiseases"
                            value={formData.chronicDiseases}
                            onChange={handleChange}
                          />
                        </div>
                      </div>

                      <div className="row mb-3">
                        <label className="col-md-4 col-lg-3 col-form-label">
                          Family History Of Disease
                        </label>
                        <div className="col-md-8 col-lg-9">
                          <input
                            type="text"
                            className="form-control"
                            name="familyHistoryOfDisease"
                            value={formData.familyHistoryOfDisease}
                            onChange={handleChange}
                          />
                        </div>
                      </div>

                      <div className="row mb-3">
                        <label className="col-md-4 col-lg-3 col-form-label">
                          History of operations
                        </label>
                        <div className="col-md-8 col-lg-9">
                          <input
                            type="text"
                            className="form-control"
                            name="operations"
                            value={formData.operations}
                            onChange={handleChange}
                          />
                        </div>
                      </div>

                      {/* Bad habits */}
                      <div className="row mb-3">
                        <label className="col-md-4 col-lg-3 col-form-label">
                          Bad habits
                        </label>
                        <div className="col-md-8 col-lg-9">
                          <select
                            className="form-control"
                            name="badHabits"
                            value={formData.badHabits}
                            onChange={handleChange}
                          >
                            <option value="">Choose a bad habit</option>
                            <option value="No bad habits">No bad habits</option>
                            <option value="Smoking">Smoking</option>
                            <option value="Alcohol">Alcohol</option>
                            <option value="Narcotic">Narcotic</option>
                            <option value="Overeating">Overeating</option>
                            <option value="Lack of sleep">Lack of sleep</option>
                          </select>
                        </div>
                      </div>

                      {/* About */}
                      <div className="row mb-3">
                        <label className="col-md-4 col-lg-3 col-form-label">
                          About
                        </label>
                        <div className="col-md-8 col-lg-9">
                          <textarea
                            name="about"
                            value={formData.about}
                            onChange={handleChange}
                            className="form-control"
                            style={{ height: "100px" }}
                          />
                        </div>
                      </div>

                      <div className="text-center">
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={submitting}
                        >
                          {submitting ? "Saving..." : "Add new patient"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar card with doctor info */}
            <div className="card">
              <div className="card-body profile-card pt-4 d-flex flex-column align-items-center">
                <img
                  src="assets/img/profile-img.jpg"
                  alt="Profile"
                  className="rounded-circle"
                />
                <h2>{user?.firstName}</h2>
                <h2>{user?.lastName}</h2>
                <h3>{user?.speciality}</h3>
                <div className="social-links mt-2">
                  <Link to="#" className="twitter">
                    <i className="bi bi-twitter"></i>
                  </Link>
                  <Link to="#" className="facebook">
                    <i className="bi bi-facebook"></i>
                  </Link>
                  <Link to="#" className="instagram">
                    <i className="bi bi-instagram"></i>
                  </Link>
                  <Link to="#" className="linkedin">
                    <i className="bi bi-linkedin"></i>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Addpatient;
