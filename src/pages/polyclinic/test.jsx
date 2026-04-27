import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Modal from "react-modal";
import ICD10 from "../ICD10";
import axios from "axios";
import { useTranslation } from "react-i18next";

// Устанавливаем элемент приложения для модальных окон
Modal.setAppElement("#root");

export default function AddPatientMedicalHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation(); // используем общий namespace с ключом medicalHistoryForm.*

  const [formData, setFormData] = useState({
    patientId: id,
    doctorId: "",
    complaints: "",
    anamnesisMorbi: "",
    anamnesisVitae: "",
    statusPreasens: "",
    statusLocalis: "",
    // ✅ diagnosis как строка, а не массив — так, как реально используется в инпуте
    diagnosis: "",
    additionalDiagnosis: "",
    recommendations: "",
    ctScanResults: "",
    mriResults: "",
    ultrasoundResults: "",
    laboratoryTestResults: "",
    immunization: "",
    allergies: "",
    familyHistoryOfDisease: "",
    chronicDiseases: "",
    isConsentGiven: false,
  });

  const [photo, setPhoto] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState("");

  // Состояния для шаблонов
  const [templates, setTemplates] = useState({
    complaints: [],
    anamnesisMorbi: [],
    anamnesisVitae: [],
    statusPreasens: [],
    statusLocalis: [],
    recommendations: [],
    mriResults: [],
    additionalDiagnosis: [],
    ultrasoundResults: [],
    laboratoryTestResults: [],
    ctScanResults: [],
  });

  const [selectedTemplates, setSelectedTemplates] = useState({});
  const [activeField, setActiveField] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [errors, setErrors] = useState({});

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const response = await axios.get(`${API_BASE}/common-for-user`, {
          withCredentials: true,
        });
        if (response.data.authenticated) {
          setIsAuthenticated(true);
          setUserId(response.data.user);
        } else {
          setIsAuthenticated(false);
          navigate("/login");
        }
      } catch (error) {
        console.error("Error checking authorization:", error);
        setIsAuthenticated(false);
        navigate("/login");
      }
    };
    checkAuthentication();
  }, [navigate, API_BASE]);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const [
          complaints,
          anamnesisMorbi,
          anamnesisVitae,
          statusPreasens,
          statusLocalis,
          recommendations,
          mriResults,
          ultrasoundResults,
          laboratoryTestResults,
          additionalDiagnosis,
          ctScanResults,
        ] = await Promise.all([
          axios.get(`${API_BASE}/clinic/temp-complaints-list`),
          axios.get(`${API_BASE}/clinic/temp-anamnesis-morbi-list`),
          axios.get(`${API_BASE}/clinic/temp-anamnesis-vitae-list`),
          axios.get(`${API_BASE}/clinic/temp-status-preasens-list`),
          axios.get(`${API_BASE}/clinic/temp-status-localis-list`),
          axios.get(`${API_BASE}/clinic/temp-recommendations-list`),
          axios.get(`${API_BASE}/clinic/temp-mri-results-list`),
          axios.get(`${API_BASE}/clinic/temp-ultrasound-results-list`),
          axios.get(`${API_BASE}/clinic/temp-laboratory-tests-list`),
          axios.get(`${API_BASE}/clinic/temp-additionalDiagnosis-list`),
          axios.get(`${API_BASE}/clinic/temp-ct-scan-list`),
        ]);

        setTemplates({
          complaints: complaints.data,
          anamnesisMorbi: anamnesisMorbi.data,
          anamnesisVitae: anamnesisVitae.data,
          statusPreasens: statusPreasens.data,
          statusLocalis: statusLocalis.data,
          recommendations: recommendations.data,
          additionalDiagnosis: additionalDiagnosis.data,
          mriResults: mriResults.data,
          ultrasoundResults: ultrasoundResults.data,
          laboratoryTestResults: laboratoryTestResults.data,
          ctScanResults: ctScanResults.data,
        });
      } catch (error) {
        console.error("Error loading templates:", error);
      }
    };

    fetchTemplates();
  }, [API_BASE]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setPhoto(file);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleDiagnosisChange = (e) => {
    const { value } = e.target;
    const options = document.querySelectorAll("#icd10-codes option");
    const values = Array.from(options).map((o) => o.value);

    if (!values.includes(value.trim())) {
      setFormData((prev) => ({ ...prev, diagnosis: "" }));
      alert(
        t(
          "medicalHistoryForm.validation.invalidDiagnosis",
          "Please select a valid diagnosis from the list."
        )
      );
    } else {
      setFormData((prev) => ({ ...prev, diagnosis: value }));
    }
  };

  // Выбор шаблона
  const handleTemplateSelect = (field, templateId) => {
    if (!templateId) return;

    const category = Object.keys(templates).find((key) =>
      templates[key].some((t) => t._id === templateId)
    );
    if (category) {
      const template = templates[category].find((t) => t._id === templateId);
      setSelectedTemplates((prev) => ({ ...prev, [field]: template }));
    }
  };

  // Модалка предпросмотра
  const openModalForField = (field) => {
    if (selectedTemplates[field]) {
      setActiveField(field);
      setIsModalOpen(true);
    }
  };

  const insertTemplateFromModal = () => {
    if (activeField && selectedTemplates[activeField]) {
      setFormData((prev) => ({
        ...prev,
        [activeField]:
          (prev[activeField] ? prev[activeField] + "\n" : "") +
          selectedTemplates[activeField].content,
      }));
      setIsModalOpen(false);
    }
  };

  // Прямая вставка
  const insertTemplateDirect = (field) => {
    if (selectedTemplates[field]) {
      setFormData((prev) => ({
        ...prev,
        [field]:
          (prev[field] ? prev[field] + "\n" : "") +
          selectedTemplates[field].content,
      }));
    }
  };

  const validateFields = () => {
    const newErrors = {};
    const requiredFields = [
      "complaints",
      "anamnesisMorbi",
      "anamnesisVitae",
      "statusPreasens",
      "statusLocalis",
      "diagnosis",
      "recommendations",
    ];

    requiredFields.forEach((field) => {
      const value = formData[field];
      if (typeof value !== "string" || value.trim() === "") {
        const fieldLabel =
          t(`medicalHistoryForm.labels.${field}`, field) || field;
        newErrors[field] = t("medicalHistoryForm.validation.fillRequired", {
          field: fieldLabel,
        });
      }
    });

    if (Object.keys(newErrors).length > 0) {
      const messageList = Object.values(newErrors)
        .map((msg) => `• ${msg}`)
        .join("\n");
      alert(
        t(
          "medicalHistoryForm.validation.requiredList",
          "Please fill in the following required fields:"
        ) +
          "\n" +
          messageList
      );
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fieldErrors = validateFields();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    } else {
      setErrors({});
    }

    if (!isAuthenticated) {
      alert(t("medicalHistoryForm.validation.loginRequired", "Please log in."));
      navigate("/login");
      return;
    }

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach((key) =>
        formDataToSend.append(key, formData[key])
      );
      if (photo) formDataToSend.append("image", photo);

      const response = await axios.post(
        `${API_BASE}/clinic/patients-polyclinic-medical-history/${id}`,
        formDataToSend,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );

      alert(
        response.data?.message ||
          t(
            "medicalHistoryForm.messages.patientAdded",
            "Patient added successfully!"
          )
      );
      navigate("/dp/polyclinic");
    } catch (error) {
      console.error("Error adding patient: ", error);
      alert(
        error.response?.data?.message ||
          t("medicalHistoryForm.messages.errorOccurred", "An error occurred.")
      );
    }
  };

  const getFieldError = (field) =>
    errors[field] ? (
      <div className="text-danger mt-1" style={{ fontSize: "0.875rem" }}>
        {errors[field]}
      </div>
    ) : null;

  if (!isAuthenticated)
    return <div>{t("medicalHistoryForm.loading", "Loading...")}</div>;

  // ===== Новый переиспользуемый компонент ссылок на списки/создание шаблонов =====
  const TemplateNav = ({ listTo, createTo, openInNewTab = true }) => (
    <div
      style={{ display: "flex", width: "100%", gap: "5px", marginTop: "5px" }}
    >
      <Link
        to={listTo}
        target={openInNewTab ? "_blank" : undefined}
        className="w-100"
      >
        <button
          type="button"
          className="btn btn-outline-info w-100"
          style={{
            backgroundColor: "rgb(231 241 255)",
            color: "black",
            border: "1px solid #b6d4fe",
            borderRadius: "4px",
            padding: "5px",
            marginLeft: 5,
          }}
        >
          {t("medicalHistoryForm.buttons.toTemplates", "To templates")}
        </button>
      </Link>
      <Link to={createTo} className="w-100">
        <button
          type="button"
          className="btn btn-warning w-100"
          style={{
            backgroundColor: "#dbdef1",
            color: "black",
            border: "1px solid #b6d4fe",
            borderRadius: "4px",
            padding: "5px",
            marginLeft: 5,
          }}
        >
          {t(
            "medicalHistoryForm.buttons.createTemplate",
            "Create a new template"
          )}
        </button>
      </Link>
    </div>
  );

  // Повторно используемый селектор шаблонов
  const TemplateSelector = ({ field, category }) => {
    const list = templates[category] || [];

    return (
      <div className="template-actions" style={{ marginTop: "10px" }}>
        <select
          onChange={(e) => handleTemplateSelect(field, e.target.value)}
          value={selectedTemplates[field] ? selectedTemplates[field]._id : ""}
          style={{
            width: "100%",
            backgroundColor: "#e7f1ff",
            marginBottom: "5px",
            border: "1px solid #b6d4fe",
            borderRadius: "4px",
            padding: "5px",
          }}
        >
          <option value="">
            {t("medicalHistoryForm.templateSelector.select", "Select template")}
          </option>
          {list.map((template) => (
            <option key={template._id} value={template._id}>
              {template.title}
            </option>
          ))}
        </select>

        <div style={{ display: "flex" }}>
          <button
            className="btn btn-outline-secondary"
            onClick={() => openModalForField(field)}
            disabled={!selectedTemplates[field]}
            style={{
              width: "50%",
              marginLeft: 5,
              backgroundColor: "#f6f9ff",
              color: "black",
              border: "1px solid #badbcc",
              borderRadius: "1px",
              padding: "5px",
              boxShadow: "0 2px 6px rgba(1, 1, 1, 0.18)",
            }}
          >
            {t("medicalHistoryForm.buttons.preview", "Preview")}
          </button>
          <button
            className="btn btn-success"
            onClick={() => insertTemplateDirect(field)}
            disabled={!selectedTemplates[field]}
            style={{
              width: "50%",
              marginLeft: 5,
              backgroundColor: "#f6f9ff",
              color: "black",
              border: "1px solid #badbcc",
              borderRadius: "1px",
              padding: "15px",
              boxShadow: "0 2px 6px rgba(1, 1, 1, 0.18)",
            }}
          >
            {t("medicalHistoryForm.buttons.insert", "Insert")}
          </button>
        </div>
      </div>
    );
  };

  const blockStyle = {
    border: "1px solid #badbcc",
    borderRadius: "6px",
    padding: "15px",
    boxShadow: "0 2px 6px rgba(1, 1, 1, 0.18)",
    backgroundColor: "rgb(232 234 246)",
  };

  return (
    <div>
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
                      {/* Complaints Field */}
                      <div className="row mb-3" style={blockStyle}>
                        <label className="col-md-4 col-lg-2 col-form-label">
                          {t(
                            "medicalHistoryForm.labels.complaints",
                            "Complaints"
                          )}
                        </label>
                        <div className="col-md-8 col-lg-10">
                          <textarea
                            name="complaints"
                            value={formData.complaints}
                            onChange={handleChange}
                            className="form-control"
                            rows="10"
                            cols="30"
                            id="complaints"
                            required
                          />
                          {getFieldError("complaints")}
                          <TemplateSelector
                            field="complaints"
                            category="complaints"
                          />
                          <TemplateNav
                            listTo="/dp/temp-complaints-list"
                            createTo="/dp/add-complainte-template"
                          />
                        </div>
                      </div>

                      {/* Anamnesis morbi Field */}
                      <div className="row mb-3" style={blockStyle}>
                        <label className="col-md-4 col-lg-2 col-form-label">
                          {t(
                            "medicalHistoryForm.labels.anamnesisMorbi",
                            "Anamnesis morbi"
                          )}
                        </label>
                        <div className="col-md-8 col-lg-10">
                          <textarea
                            name="anamnesisMorbi"
                            value={formData.anamnesisMorbi}
                            onChange={handleChange}
                            className="form-control"
                            rows="10"
                            cols="30"
                            id="anamnesisMorbi"
                          />
                          {getFieldError("anamnesisMorbi")}
                          <TemplateSelector
                            field="anamnesisMorbi"
                            category="anamnesisMorbi"
                          />
                          <TemplateNav
                            listTo="/dp/anamnes-morbi-template-list"
                            createTo="/dp/add-anamnes-morbi-template"
                          />
                        </div>
                      </div>

                      {/* Anamnesis vitae Field */}
                      <div className="row mb-3" style={blockStyle}>
                        <label className="col-md-4 col-lg-2 col-form-label">
                          {t(
                            "medicalHistoryForm.labels.anamnesisVitae",
                            "Anamnesis vitae"
                          )}
                        </label>
                        <div className="col-md-8 col-lg-10">
                          <textarea
                            name="anamnesisVitae"
                            value={formData.anamnesisVitae}
                            onChange={handleChange}
                            className="form-control"
                            id="anamnesisVitae"
                            rows="10"
                            cols="30"
                          />
                          {getFieldError("anamnesisVitae")}
                          <TemplateSelector
                            field="anamnesisVitae"
                            category="anamnesisVitae"
                          />
                          <TemplateNav
                            listTo="/dp/anamnes-vitae-template-list"
                            createTo="/dp/add-anamnes-vitae-template"
                          />
                        </div>
                      </div>

                      {/* Status preasens Field */}
                      <div className="row mb-3" style={blockStyle}>
                        <label className="col-md-4 col-lg-2 col-form-label">
                          {t(
                            "medicalHistoryForm.labels.statusPreasens",
                            "Status preasens"
                          )}
                        </label>
                        <div className="col-md-8 col-lg-10">
                          <textarea
                            name="statusPreasens"
                            value={formData.statusPreasens}
                            onChange={handleChange}
                            className="form-control"
                            id="statusPreasens"
                            rows="10"
                            cols="30"
                          />
                          {getFieldError("statusPreasens")}
                          <TemplateSelector
                            field="statusPreasens"
                            category="statusPreasens"
                          />
                          <TemplateNav
                            listTo="/dp/status-preasens-template-list"
                            createTo="/dp/add-status-preasens-template"
                          />
                        </div>
                      </div>

                      {/* Status localis Field */}
                      <div className="row mb-3" style={blockStyle}>
                        <label className="col-md-4 col-lg-2 col-form-label">
                          {t(
                            "medicalHistoryForm.labels.statusLocalis",
                            "Status localis"
                          )}
                        </label>
                        <div className="col-md-8 col-lg-10">
                          <textarea
                            name="statusLocalis"
                            value={formData.statusLocalis}
                            onChange={handleChange}
                            className="form-control"
                            id="statusLocalis"
                            rows="10"
                            cols="30"
                          />
                          {getFieldError("statusLocalis")}
                          <TemplateSelector
                            field="statusLocalis"
                            category="statusLocalis"
                          />
                          <TemplateNav
                            listTo="/dp/status-localis-template-list"
                            createTo="/dp/add-status-localis-template"
                          />
                        </div>
                      </div>

                      {/* CT scan results Field */}
                      <div className="row mb-3" style={blockStyle}>
                        <label className="col-md-4 col-lg-2 col-form-label">
                          {t(
                            "medicalHistoryForm.labels.ctScanResults",
                            "CT scan results"
                          )}
                        </label>
                        <div className="col-md-8 col-lg-10">
                          <textarea
                            name="ctScanResults"
                            value={formData.ctScanResults}
                            onChange={handleChange}
                            rows="10"
                            cols="30"
                            className="form-control"
                            id="ctScanResults"
                          />
                          <TemplateSelector
                            field="ctScanResults"
                            category="ctScanResults"
                          />
                          <TemplateNav
                            listTo="/dp/ct-results-template-list"
                            createTo="/dp/add-ct-results-template"
                          />
                        </div>
                      </div>

                      {/* MRI results Field */}
                      <div className="row mb-3" style={blockStyle}>
                        <label className="col-md-4 col-lg-2 col-form-label">
                          {t(
                            "medicalHistoryForm.labels.mriResults",
                            "MRI results"
                          )}
                        </label>
                        <div className="col-md-8 col-lg-10">
                          <textarea
                            name="mriResults"
                            value={formData.mriResults}
                            onChange={handleChange}
                            rows="10"
                            cols="30"
                            className="form-control"
                            id="mriResults"
                          />
                          <TemplateSelector
                            field="mriResults"
                            category="mriResults"
                          />
                          <TemplateNav
                            listTo="/dp/mri-results-template-list"
                            createTo="/dp/add-mri-results-template"
                          />
                        </div>
                      </div>

                      {/* Ultrasound results Field */}
                      <div className="row mb-3" style={blockStyle}>
                        <label className="col-md-4 col-lg-2 col-form-label">
                          {t(
                            "medicalHistoryForm.labels.ultrasoundResults",
                            "Ultrasound results"
                          )}
                        </label>
                        <div className="col-md-8 col-lg-10">
                          <textarea
                            name="ultrasoundResults"
                            value={formData.ultrasoundResults}
                            onChange={handleChange}
                            rows="10"
                            cols="30"
                            className="form-control"
                            id="ultrasoundResults"
                          />
                          <TemplateSelector
                            field="ultrasoundResults"
                            category="ultrasoundResults"
                          />
                          <TemplateNav
                            listTo="/dp/ultrasound-tests-template-list"
                            createTo="/dp/add-ultrasound-tests-template"
                          />
                        </div>
                      </div>

                      {/* Laboratory test results Field */}
                      <div className="row mb-3" style={blockStyle}>
                        <label className="col-md-4 col-lg-2 col-form-label">
                          {t(
                            "medicalHistoryForm.labels.laboratoryTestResults",
                            "Laboratory test results"
                          )}
                        </label>
                        <div className="col-md-8 col-lg-10">
                          <textarea
                            name="laboratoryTestResults"
                            value={formData.laboratoryTestResults}
                            onChange={handleChange}
                            rows="10"
                            cols="30"
                            className="form-control"
                            id="laboratoryTestResults"
                          />
                          <TemplateSelector
                            field="laboratoryTestResults"
                            category="laboratoryTestResults"
                          />
                          <TemplateNav
                            listTo="/dp/laboratory-tests-template-list"
                            createTo="/dp/add-laboratory-tests-template"
                          />
                        </div>
                      </div>

                      {/* Diagnosis Field */}
                      <div className="row mb-3" style={blockStyle}>
                        <label className="col-md-4 col-lg-2 col-form-label">
                          {t(
                            "medicalHistoryForm.labels.diagnosis",
                            "Diagnosis"
                          )}
                        </label>
                        <div className="col-md-8 col-lg-10">
                          <input
                            style={{ height: "70px", width: "100%" }}
                            type="text"
                            name="diagnosis"
                            value={formData.diagnosis}
                            onChange={handleDiagnosisChange}
                            className="search-input"
                            list="icd10-codes"
                            placeholder={t(
                              "medicalHistoryForm.placeholders.diagnosisInput",
                              "Choose a diagnosis from the list..."
                            )}
                          />
                          {getFieldError("diagnosis")}
                          <datalist id="icd10-codes">
                            <ICD10 />
                          </datalist>
                        </div>
                      </div>

                      {/* Additional Diagnosis Field */}
                      <div className="row mb-3" style={blockStyle}>
                        <label className="col-md-4 col-lg-2 col-form-label">
                          {t(
                            "medicalHistoryForm.labels.additionalDiagnosis",
                            "Additional Diagnosis"
                          )}
                        </label>
                        <div className="col-md-8 col-lg-10">
                          <input
                            style={{ height: "70px", width: "100%" }}
                            type="text"
                            name="additionalDiagnosis"
                            value={formData.additionalDiagnosis}
                            onChange={handleChange}
                            className="search-input"
                            placeholder={t(
                              "medicalHistoryForm.placeholders.additionalDiagnosis",
                              "Write your addition to the diagnosis..."
                            )}
                          />
                          <TemplateSelector
                            field="additionalDiagnosis"
                            category="additionalDiagnosis"
                          />
                          <TemplateNav
                            listTo="/dp/list-additional-diagnosis-template"
                            createTo="/dp/add-additional-diagnosis-template"
                          />
                        </div>
                      </div>

                      {/* Recommendations Field */}
                      <div className="row mb-3" style={blockStyle}>
                        <label className="col-md-1 col-lg-2 col-form-label">
                          {t(
                            "medicalHistoryForm.labels.recommendations",
                            "Recommendations"
                          )}
                        </label>
                        <div className="col-md-11 col-lg-10">
                          <textarea
                            name="recommendations"
                            value={formData.recommendations}
                            onChange={handleChange}
                            className="form-control"
                            id="recommendations"
                            rows="10"
                            cols="30"
                          />
                          {getFieldError("recommendations")}
                          <TemplateSelector
                            field="recommendations"
                            category="recommendations"
                          />
                          <TemplateNav
                            listTo="/dp/recomendation-tests-template-list"
                            createTo="/dp/add-recomendation-template"
                            openInNewTab={false}
                          />
                        </div>
                      </div>

                      {/* Submit */}
                      <div className="text-center">
                        <button type="submit" className="btn btn-primary">
                          {t(
                            "medicalHistoryForm.buttons.submit",
                            "Add new patient"
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>

            {/* Карточка профиля */}
            <div className="card">
              <div className="card-body profile-card pt-4 d-flex flex-column align-items-center">
                <img
                  src="assets/img/profile-img.jpg"
                  alt="Profile"
                  className="rounded-circle"
                />
                <h2>{userId.firstName}</h2>
                <h2>{userId.lastName}</h2>
                <h3>{userId.speciality}</h3>
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

      {/* Модальное окно предпросмотра шаблона */}
      <Modal isOpen={isModalOpen} onRequestClose={() => setIsModalOpen(false)}>
        <div style={{ width: "100%", paddingLeft: "20%", paddingTop: "100px" }}>
          <h2>{selectedTemplates[activeField]?.title}</h2>
          <p>{selectedTemplates[activeField]?.content}</p>
          <button
            className="btn btn-success me-2"
            onClick={insertTemplateFromModal}
          >
            {t("medicalHistoryForm.buttons.insertTemplate", "Insert template")}
          </button>
          <button
            className="btn btn-outline-secondary"
            onClick={() => setIsModalOpen(false)}
          >
            {t("medicalHistoryForm.buttons.close", "Close")}
          </button>
        </div>
      </Modal>
    </div>
  );
}
