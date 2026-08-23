import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import InputMask from "react-input-mask";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import {
  parsePhoneNumberFromString,
  getCountryCallingCode,
} from "libphonenumber-js";
import axios from "axios";
import { track } from "../../../lib/analytics";
import { POLYCLINIC_PATIENT_CREATED } from "../../../lib/events";
import { COUNTRIES, COUNTRY_ISO } from "../../../constants/countries";

const Addpatient = () => {
  const { t } = useTranslation("common");
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

  // Код страны для поля телефона. Раньше здесь лежала маска, собранная из
  // самодельной таблицы «код + число цифр». Формат номера теперь знает
  // react-phone-input-2, нам остаётся только сказать ему страну.
  const [phoneCountry, setPhoneCountry] = useState("az");

  const API_BASE = process.env.REACT_APP_API_URL;
  const [profileImage, setPhoto] = useState(null);

  // -------- Helpers
  const convertDateFormat = (dateString) => {
    // dd/mm/yyyy -> yyyy-mm-dd
    const [dd, mm, yyyy] = (dateString || "").split("/");
    if (dd && mm && yyyy) return `${yyyy}-${mm}-${dd}`;
    return dateString;
  };

  // Телефон в E.164 — либо пусто, если поле не трогали.
  //
  // Поле необязательное, но react-phone-input-2 всегда держит в значении код
  // страны, поэтому «пусто» здесь — это «цифр не больше, чем в коде». Без
  // этой проверки нетронутое поле считалось бы заполненным и форма ругалась
  // бы на номер, которого никто не вводил.
  //
  // Прежняя проверка (+ и до 15 цифр) пропускала недобранный номер: маска
  // оставляла в строке подчёркивания, они не цифры и просто отбрасывались,
  // так что «+994 50 ___ __» уезжало в базу как «+99450».
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

  // -------- Generic handlers
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "country") {
      // Незнакомая страна больше невозможна: COUNTRY_ISO покрывает весь
      // список COUNTRIES. Запасное "az" — на случай пустого выбора.
      setPhoneCountry(COUNTRY_ISO[value] || "az");
      // Номер очищаем: он был набран под прежнюю страну.
      setFormData((prev) => ({ ...prev, phoneNumber: "" }));
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

    // Телефон опционален. Если указан — должен быть настоящим номером.
    const { empty: phoneEmpty, value: phone } = readPhone();
    if (!phoneEmpty && !phone) {
      setGlobalError(
        "Неверный номер телефона: проверьте страну и количество цифр.",
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
  const countries = COUNTRIES;

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
  if (!authChecked) return <div>{t("common:common.loadingDots")}</div>;
  if (!isAuthenticated) return null;

  return (
    <div>
      <div className="pagetitle">
        <h1>{t("patientArea:addPatient.title")}</h1>
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
                          {t("patientArea:addPatient.photo")}
                        </label>
                        <div className="col-md-8 col-lg-9">
                          <img
                            src={
                              profileImage
                                ? URL.createObjectURL(profileImage)
                                : "/images/avatar/1.jpg"
                            }
                            alt={t("patientArea:addPatient.profile")}
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
                              {t("patientArea:addPatient.choosePhoto")}
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
                          {t("patientArea:addPatient.idDocument")}
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
                          {t("patientArea:addPatient.firstName")}
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
                          {t("patientArea:addPatient.lastName")}
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
                          {t("patientArea:addPatient.country")}
                        </label>
                        <div className="col-md-8 col-lg-9">
                          <select
                            className="form-control"
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                          >
                            <option value="">{t("patientArea:addPatient.selectCountry")}</option>
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
                          {t("dp.patient.phone")}
                        </label>
                        <div className="col-md-8 col-lg-9">
                          <PhoneInput
                            country={phoneCountry}
                            value={formData.phoneNumber}
                            countryCodeEditable={false}
                            enableAreaCodes={true}
                            onChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                phoneNumber: value,
                              }))
                            }
                            inputClass="form-control"
                            inputStyle={{ width: "100%", paddingLeft: 48 }}
                          />

                          <small className="text-muted">
                            {t("dp.patient.phoneHint")}
                          </small>
                        </div>
                      </div>

                      {/* Gender */}
                      <div className="row mb-3">
                        <label className="col-md-4 col-lg-3 col-form-label">
                          {t("patientArea:addPatient.gender")}
                        </label>
                        <div className="col-md-8 col-lg-9">
                          <select
                            className="form-control"
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            required
                          >
                            <option value="">{t("patientArea:addPatient.selectGender")}</option>
                            <option value="male">{t("patientArea:addPatient.male")}</option>
                            <option value="female">{t("patientArea:addPatient.female")}</option>
                          </select>
                        </div>
                      </div>

                      {/* Birth date */}
                      <div className="row mb-3">
                        <label className="col-md-4 col-lg-3 col-form-label">
                          {t("dp.patient.birthDate")}
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
                              {t("dp.patient.dateHint")}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Immunization */}
                      <div className="row mb-3">
                        <label className="col-md-4 col-lg-3 col-form-label">
                          {t("patientArea:addPatient.immunization")}
                        </label>
                        <div className="col-md-8 col-lg-9">
                          <select
                            className="form-control"
                            name="immunization"
                            value={formData.immunization}
                            onChange={handleChange}
                          >
                            <option value="">
                              {t("patientArea:addPatient.selectImmunization")}
                            </option>
                            <option value="Fully vaccinated">
                              {t("patientArea:addPatient.fullyVaccinated")}
                            </option>
                            <option value="Partially vaccinated">
                              {t("patientArea:addPatient.partiallyVaccinated")}
                            </option>
                            <option value="Not vaccinated">
                              {t("patientArea:addPatient.notVaccinated")}
                            </option>
                            <option value="Unknown">{t("patientArea:addPatient.unknown")}</option>
                          </select>
                        </div>
                      </div>

                      {/* Allergies */}
                      <div className="row mb-3">
                        <label className="col-md-4 col-lg-3 col-form-label">
                          {t("patientArea:addPatient.allergies")}
                        </label>
                        <div className="col-md-8 col-lg-9">
                          <select
                            className="form-control"
                            name="allergies"
                            value={formData.allergies}
                            onChange={handleChange}
                          >
                            <option value="">{t("patientArea:addPatient.selectAllergen")}</option>
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
                          {t("patientArea:addPatient.chronic")}
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
                          {t("patientArea:addPatient.familyHistory")}
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
                          {t("patientArea:addPatient.operations")}
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
                          {t("patientArea:addPatient.badHabits")}
                        </label>
                        <div className="col-md-8 col-lg-9">
                          <select
                            className="form-control"
                            name="badHabits"
                            value={formData.badHabits}
                            onChange={handleChange}
                          >
                            <option value="">{t("patientArea:addPatient.chooseBadHabit")}</option>
                            <option value="No bad habits">{t("patientArea:addPatient.noBadHabits")}</option>
                            <option value="Smoking">{t("patientArea:addPatient.smoking")}</option>
                            <option value="Alcohol">{t("patientArea:addPatient.alcohol")}</option>
                            <option value="Narcotic">{t("patientArea:addPatient.narcotic")}</option>
                            <option value="Overeating">{t("patientArea:addPatient.overeating")}</option>
                            <option value="Lack of sleep">{t("patientArea:addPatient.lackOfSleep")}</option>
                          </select>
                        </div>
                      </div>

                      {/* About */}
                      <div className="row mb-3">
                        <label className="col-md-4 col-lg-3 col-form-label">
                          {t("patientArea:addPatient.about")}
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
                  alt={t("patientArea:addPatient.profile")}
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
