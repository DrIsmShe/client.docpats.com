// src/.../Addpatient.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import InputMask from "react-input-mask";
import axios from "axios";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { parsePhoneNumberFromString } from "libphonenumber-js";

const Addpatient = () => {
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState({});
  const [profileImage, setPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [phoneCountry, setPhoneCountry] = useState("az");
  const [phoneError, setPhoneError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    identityDocument: "",
    birthDate: "", // dd/mm/yyyy в инпуте (маска) -> конвертим в yyyy-mm-dd при сабмите
    gender: "",
    immunization: "",
    allergies: "",
    chronicDiseases: "",
    familyHistoryOfDisease: "",
    operations: "",
    about: "",
    country: "",
    phoneNumber: "", // обязателен для совместимости со схемой (может быть пустым)
  });

  const API_BASE = process.env.REACT_APP_API_URL;
  const COUNTRY_PHONE_MAP = {
    Afghanistan: "af",
    Albania: "al",
    Algeria: "dz",
    Andorra: "ad",
    Angola: "ao",
    Antigua: "ag",
    "Antigua and Barbuda": "ag",
    Argentina: "ar",
    Armenia: "am",
    Australia: "au",
    Austria: "at",
    Azerbaijan: "az",
    Bahamas: "bs",
    Bahrain: "bh",
    Bangladesh: "bd",
    Barbados: "bb",
    Belarus: "by",
    Belgium: "be",
    Belize: "bz",
    Benin: "bj",
    Bhutan: "bt",
    Bolivia: "bo",
    "Bosnia and Herzegovina": "ba",
    Botswana: "bw",
    Brazil: "br",
    Brunei: "bn",
    Bulgaria: "bg",
    "Burkina Faso": "bf",
    Burundi: "bi",
    Cambodia: "kh",
    Cameroon: "cm",
    Canada: "ca",
    "Cape Verde": "cv",
    "Cabo Verde": "cv",
    "Central African Republic": "cf",
    Chad: "td",
    Chile: "cl",
    China: "cn",
    Colombia: "co",
    Comoros: "km",
    Congo: "cg",
    "Democratic Republic of the Congo": "cd",
    "Costa Rica": "cr",
    Croatia: "hr",
    Cuba: "cu",
    Cyprus: "cy",
    "Czech Republic": "cz",
    Denmark: "dk",
    Djibouti: "dj",
    Dominica: "dm",
    "Dominican Republic": "do",
    Ecuador: "ec",
    Egypt: "eg",
    "El Salvador": "sv",
    "Equatorial Guinea": "gq",
    Eritrea: "er",
    Estonia: "ee",
    Eswatini: "sz",
    Ethiopia: "et",
    Fiji: "fj",
    Finland: "fi",
    France: "fr",
    Gabon: "ga",
    Gambia: "gm",
    Georgia: "ge",
    Germany: "de",
    Ghana: "gh",
    Greece: "gr",
    Grenada: "gd",
    Guatemala: "gt",
    Guinea: "gn",
    "Guinea-Bissau": "gw",
    Guyana: "gy",
    Haiti: "ht",
    Honduras: "hn",
    Hungary: "hu",
    Iceland: "is",
    India: "in",
    Indonesia: "id",
    Iran: "ir",
    Iraq: "iq",
    Ireland: "ie",
    Israel: "il",
    Italy: "it",
    Jamaica: "jm",
    Japan: "jp",
    Jordan: "jo",
    Kazakhstan: "kz",
    Kenya: "ke",
    Kiribati: "ki",
    Kuwait: "kw",
    Kyrgyzstan: "kg",
    Laos: "la",
    Latvia: "lv",
    Lebanon: "lb",
    Lesotho: "ls",
    Liberia: "lr",
    Libya: "ly",
    Liechtenstein: "li",
    Lithuania: "lt",
    Luxembourg: "lu",
    Madagascar: "mg",
    Malawi: "mw",
    Malaysia: "my",
    Maldives: "mv",
    Mali: "ml",
    Malta: "mt",
    "Marshall Islands": "mh",
    Mauritania: "mr",
    Mauritius: "mu",
    Mexico: "mx",
    Micronesia: "fm",
    Moldova: "md",
    Monaco: "mc",
    Mongolia: "mn",
    Montenegro: "me",
    Morocco: "ma",
    Mozambique: "mz",
    Myanmar: "mm",
    Namibia: "na",
    Nauru: "nr",
    Nepal: "np",
    Netherlands: "nl",
    "New Zealand": "nz",
    Nicaragua: "ni",
    Niger: "ne",
    Nigeria: "ng",
    "North Korea": "kp",
    "North Macedonia": "mk",
    Norway: "no",
    Oman: "om",
    Pakistan: "pk",
    Palau: "pw",
    Palestine: "ps",
    Panama: "pa",
    "Papua New Guinea": "pg",
    Paraguay: "py",
    Peru: "pe",
    Philippines: "ph",
    Poland: "pl",
    Portugal: "pt",
    Qatar: "qa",
    Romania: "ro",
    Russia: "ru",
    Rwanda: "rw",
    "Saint Kitts and Nevis": "kn",
    "Saint Lucia": "lc",
    "Saint Vincent and the Grenadines": "vc",
    Samoa: "ws",
    "San Marino": "sm",
    "Sao Tome and Principe": "st",
    "Saudi Arabia": "sa",
    Senegal: "sn",
    Serbia: "rs",
    Seychelles: "sc",
    "Sierra Leone": "sl",
    Singapore: "sg",
    Slovakia: "sk",
    Slovenia: "si",
    "Solomon Islands": "sb",
    Somalia: "so",
    "South Africa": "za",
    "South Korea": "kr",
    "South Sudan": "ss",
    Spain: "es",
    "Sri Lanka": "lk",
    Sudan: "sd",
    Suriname: "sr",
    Sweden: "se",
    Switzerland: "ch",
    Syria: "sy",
    Taiwan: "tw",
    Tajikistan: "tj",
    Tanzania: "tz",
    Thailand: "th",
    "Timor-Leste": "tl",
    Togo: "tg",
    Tonga: "to",
    "Trinidad and Tobago": "tt",
    Tunisia: "tn",
    Turkey: "tr",
    Turkmenistan: "tm",
    Tuvalu: "tv",
    Uganda: "ug",
    Ukraine: "ua",
    "United Arab Emirates": "ae",
    "United Kingdom": "gb",
    "United States": "us",
    Uruguay: "uy",
    Uzbekistan: "uz",
    Vanuatu: "vu",
    Vatican: "va",
    "Vatican City": "va",
    Venezuela: "ve",
    Vietnam: "vn",
    Yemen: "ye",
    Zambia: "zm",
    Zimbabwe: "zw",
  };
  const validatePhone = (value) => {
    try {
      const phone = parsePhoneNumberFromString(value);
      if (!phone || !phone.isValid()) {
        setPhoneError("Invalid phone number.");
        return false;
      }
      setPhoneError("");
      return true;
    } catch (e) {
      setPhoneError("Invalid phone format.");
      return false;
    }
  };
  const handleCountrySelect = (e) => {
    const selected = e.target.value;

    setFormData((prev) => ({ ...prev, country: selected }));

    const iso = COUNTRY_PHONE_MAP[selected] || "az";
    setPhoneCountry(iso);

    // Очистка старого номера
    setFormData((prev) => ({ ...prev, phoneNumber: "" }));
    setPhoneError("");
  };

  // страны (сокращено — оставь свой массив при желании)
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

  const allergens = useMemo(
    () => [
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
      "Insulin (especially of animal origin)",
      "Hormonal contraceptives (oral and injectable)",
      "Corticosteroids (Prednisolone, Dexamethasone, Hydrocortisone)",
      "Phenytoin",
      "Carbamazepine",
      "Lamotrigine",
      "Iodine-containing contrast agents",
      "Gadolinium (MRI contrast)",
      "Anti-tetanus serum",
      "Measles, rubella, mumps vaccine (if allergic to gelatin or eggs)",
      "Influenza vaccines",
      "Beta-blockers (Propranolol, Atenolol)",
      "ACE inhibitors (Enalapril, Captopril)",
      "Dust",
      "Plant blooms (seasonal allergies)",
      "Food products (nuts, milk, eggs, honey, seafood)",
      "Animals (wool, saliva, skin)",
      "Mold",
      "Insects (wasps, bees, mosquitoes)",
      "Chemicals (household chemicals, dyes, varnishes)",
      "Metals",
      "Cold",
      "Sun",
      "Other",
    ],
    []
  );

  // авторизация и автозаполнение email/имени/фамилии
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/common-for-user`, {
          withCredentials: true,
        });
        if (data?.authenticated) {
          setIsAuthenticated(true);
          setUser(data.user || {});
          setFormData((prev) => ({
            ...prev,
            email: String(data.user?.email || "")
              .trim()
              .toLowerCase(),
            firstName: data.user?.firstName || "",
            lastName: data.user?.lastName || "",
          }));
        } else {
          setIsAuthenticated(false);
          navigate("/login");
        }
      } catch (e) {
        console.error("❌ Ошибка авторизации:", e);
        setIsAuthenticated(false);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const onChangeField = (e) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
  };

  const onPhotoChange = (e) => {
    const f = e.target.files?.[0];
    if (f) setPhoto(f);
  };

  // контроллер понимает dd/mm/yyyy и ISO, но для стабильности конвертим в ISO
  const convertDateDDMMYYYYtoISO = (ddmmyyyy) => {
    const [dd, mm, yyyy] = String(ddmmyyyy || "").split("/");
    if (!dd || !mm || !yyyy) return ddmmyyyy; // сервер сам провалидирует
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated || submitting) return;

    // простая клиентская валидация обязательных полей, чтобы не слать пустое
    if (
      !formData.email ||
      !formData.firstName ||
      !formData.lastName ||
      !formData.identityDocument ||
      !formData.birthDate ||
      !formData.gender
    ) {
      alert("Заполните все обязательные поля.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        ...formData,
        email: String(formData.email || "")
          .trim()
          .toLowerCase(),
      };

      if (payload.birthDate?.includes("/")) {
        payload.birthDate = convertDateDDMMYYYYtoISO(payload.birthDate);
      }

      // формируем FormData (важно: НЕ ставить вручную Content-Type)
      const fd = new FormData();
      Object.entries(payload).forEach(([k, v]) => {
        if (Array.isArray(v)) {
          v.forEach((item) => {
            if (item !== undefined && item !== null && item !== "")
              fd.append(k, item);
          });
        } else if (v !== undefined && v !== null && v !== "") {
          fd.append(k, v);
        }
      });

      if (profileImage) fd.append("image", profileImage); // контроллер ждёт "image"

      await axios.post(
        `${API_BASE}/patient-profile/add-patient-polyclinic`,
        fd,
        { withCredentials: true } // axios сам проставит boundary
      );

      navigate("/patient/home-page");
    } catch (error) {
      console.error("Error adding patient:", error);
      alert(
        error?.response?.data?.message ||
          "There was an error adding the patient."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !isAuthenticated) {
    return <div>Загрузка...</div>;
  }

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
                      <div
                        className="row mb-3"
                        style={{ marginLeft: 20, marginRight: 20, padding: 10 }}
                      >
                        <label className="row mb-3" style={{ padding: 10 }} />
                      </div>

                      {/* Email (read-only) */}
                      <div
                        className="email row mb-3"
                        style={{
                          display: "flex",
                          justifyContent: "space-around",
                        }}
                      >
                        <label className="col-md-3 col-lg-3">Email</label>
                        <div className="col-md-9 col-lg-9">
                          <input
                            name="email"
                            value={formData.email}
                            onChange={onChangeField}
                            type="email"
                            className="form-control"
                            id="Email"
                            required
                            readOnly
                          />
                        </div>
                      </div>

                      {/* Фото */}
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
                            style={{ maxWidth: 150, borderRadius: 8 }}
                          />
                          <div
                            className="pt-2"
                            style={{
                              display: "flex",
                              gap: 10,
                              alignItems: "center",
                            }}
                          >
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
                            onChange={onPhotoChange}
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
                            onChange={onChangeField}
                            className="form-control"
                            required
                          />
                        </div>
                      </div>

                      {/* First/Last Name (read-only) */}
                      <div className="row mb-3">
                        <label className="col-md-4 col-lg-3 col-form-label">
                          First Name
                        </label>
                        <div className="col-md-8 col-lg-9">
                          <input
                            type="text"
                            className="form-control"
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={onChangeField}
                            readOnly
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
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={onChangeField}
                            readOnly
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
                            id="country"
                            name="country"
                            value={formData.country}
                            onChange={handleCountrySelect} // ✅ так правильно
                          >
                            <option value="">Select country</option>
                            {countries.map((c, idx) => (
                              <option key={idx} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      {/* Phone number (по контракту — сырая строка, модель сама нормализует/шифрует) */}
                      <div className="row mb-3">
                        <label className="col-md-4 col-lg-3 col-form-label">
                          Phone Number
                        </label>
                        <div className="col-md-8 col-lg-9">
                          <PhoneInput
                            country={phoneCountry}
                            value={formData.phoneNumber}
                            enableAreaCodes={true}
                            countryCodeEditable={false}
                            disableCountryCode={false}
                            onChange={(value, data) => {
                              const full = "+" + value;

                              setFormData((prev) => ({
                                ...prev,
                                phoneNumber: full,
                              }));

                              validatePhone(full);
                            }}
                            inputStyle={{
                              width: "100%",
                              border: phoneError
                                ? "2px solid red"
                                : "1px solid #ced4da",
                            }}
                          />

                          {phoneError && (
                            <div
                              style={{
                                color: "red",
                                fontSize: "12px",
                                marginTop: "5px",
                              }}
                            >
                              {phoneError}
                            </div>
                          )}

                          <small className="text-muted">
                            Формат: “+” и до 15 цифр.
                          </small>
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
                            id="badHabits"
                            name="badHabits"
                            value={formData.badHabits}
                            onChange={onChangeField}
                          >
                            <option value="">Choose a bad habit</option>
                            <option value="нет">No bad habits</option>
                            <option value="Курение">Smoking</option>
                            <option value="Алкоголь">Alcohol</option>
                            <option value="Наркотики">Narcotic</option>
                            <option value="Переедание">Overeating</option>
                            <option value="Недостаток сна">
                              Lack of sleep
                            </option>
                          </select>
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
                            id="gender"
                            name="gender"
                            value={formData.gender}
                            onChange={onChangeField}
                            required
                          >
                            <option value="">Select gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
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
                            id="immunization"
                            name="immunization"
                            value={formData.immunization}
                            onChange={onChangeField}
                          >
                            <option value="">
                              Select your immunization status
                            </option>
                            <option value="Полностью привит">
                              Fully vaccinated
                            </option>
                            <option value="Частично привит">
                              Partially vaccinated
                            </option>
                            <option value="Не привит">Not vaccinated</option>
                            <option value="Неизвестно">Unknown</option>
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
                            id="allergies"
                            name="allergies"
                            value={formData.allergies}
                            onChange={onChangeField}
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
                            id="chronicDiseases"
                            name="chronicDiseases"
                            value={formData.chronicDiseases}
                            onChange={onChangeField}
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
                            id="familyHistoryOfDisease"
                            name="familyHistoryOfDisease"
                            value={formData.familyHistoryOfDisease}
                            onChange={onChangeField}
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
                            id="operations"
                            name="operations"
                            value={formData.operations}
                            onChange={onChangeField}
                          />
                        </div>
                      </div>

                      {/* Birth date (маска dd/mm/yyyy) */}
                      <div className="row mb-3">
                        <label className="col-md-4 col-lg-3 col-form-label">
                          Date of birth
                        </label>
                        <div className="col-md-8 col-lg-9">
                          <InputMask
                            mask="99/99/9999"
                            value={formData.birthDate}
                            onChange={(e) =>
                              setFormData((s) => ({
                                ...s,
                                birthDate: e.target.value,
                              }))
                            }
                            placeholder="dd/mm/yyyy"
                            className="form-control"
                            required
                          />
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
                            onChange={onChangeField}
                            className="form-control"
                            id="about"
                            style={{ height: 100 }}
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

            {/* карточка профиля справа/снизу */}
            <div className="card">
              <div className="card-body profile-card pt-4 d-flex flex-column align-items-center">
                <img
                  src="assets/img/profile-img.jpg"
                  alt="Profile"
                  className="rounded-circle"
                />
                <h2>{user?.firstName || "Имя не указано"}</h2>
                <h2>{user?.lastName || "Фамилия не указана"}</h2>
                <h3>{user?.speciality || "Без специализации"}</h3>

                <div className="social-links mt-2">
                  <Link to="#" className="twitter">
                    <i className="bi bi-twitter" />
                  </Link>
                  <Link to="#" className="facebook">
                    <i className="bi bi-facebook" />
                  </Link>
                  <Link to="#" className="instagram">
                    <i className="bi bi-instagram" />
                  </Link>
                  <Link to="#" className="linkedin">
                    <i className="bi bi-linkedin" />
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
