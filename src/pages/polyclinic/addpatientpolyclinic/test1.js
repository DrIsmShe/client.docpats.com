import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Modal from "react-modal";
import ICD10 from "../ICD10";
import axios from "axios";

// Устанавливаем элемент приложения для модальных окон
Modal.setAppElement("#root");

export default function AddPatientMedicalHistory() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    patientId: id,
    metaDescription: [],
    metaKeywords: [],
    doctorId: "",
    complaints: "",
    anamnesisMorbi: "",
    anamnesisVitae: "",
    statusPreasens: "",
    statusLocalis: "",
    diagnosis: [],
    recommendations: "",
    operationsPerformed: "",
    ctScanResults: "",
    mriResults: "",
    ultrasoundResults: "",
    laboratoryTestResults: "",
    immunization: "",
    allergies: "",
    familyHistoryOfDisease: "",
    operations: [],
    chronicDiseases: "",
    isConsentGiven: false,
  });

  const [photo, setPhoto] = useState(null);
  const [complaintsList, setComplaintsList] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState("");
  const [anamnesisMorbiList, setAnamnesisMorbiList] = useState([]);
  // Состояния для работы с шаблонами
  // selectedTemplates — объект вида { fieldName: template }
  const [selectedTemplates, setSelectedTemplates] = useState({});
  // activeField — поле, для которого сейчас открыто модальное окно
  const [activeField, setActiveField] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Проверка авторизации
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const response = await axios.get(
          "http://localhost:11000/common-for-user",
          { withCredentials: true }
        );
        if (response.data.authenticated) {
          setIsAuthenticated(true);
          setUserId(response.data.user);
        } else {
          setIsAuthenticated(false);
          navigate("/login");
        }
      } catch (error) {
        console.error("Ошибка при проверке авторизации:", error);
        setIsAuthenticated(false);
        navigate("/login");
      }
    };

    checkAuthentication();
  }, []);

  const [templates, setTemplates] = useState({});
  // Загрузка списка шаблонов (жалоб)
  useEffect(() => {
    const fetchTemplates = async () => {
      const endpoints = {
        complaints: "http://localhost:11000/temp-complaints-list",
        anamnesisMorbi: "http://localhost:11000/temp-anamnesis-morbi-list",
        anamnesisVitae: "http://localhost:11000/temp-anamnesis-vitae-list",
        statusPreasens: "http://localhost:11000/temp-status-preasens-list",
        statusLocalis: "http://localhost:11000/temp-status-localis-list",
        ctScanResults: "http://localhost:11000/temp-ct-scan-list",
        mriResults: "http://localhost:11000/temp-mri-list",
        ultrasoundResults: "http://localhost:11000/temp-ultrasound-list",
        laboratoryTestResults: "http://localhost:11000/temp-laboratory-list",
        recommendations: "http://localhost:11000/temp-recommendations-list",
      };

      try {
        const templateRequests = Object.entries(endpoints).map(
          async ([field, url]) => {
            const response = await axios.get(url);
            console.log(`Данные для ${field}:`, response.data); // <-- Проверка в консоли
            return { [field]: response.data };
          }
        );

        const results = await Promise.all(templateRequests);
        const newTemplates = Object.assign({}, ...results);

        console.log("Все загруженные шаблоны:", newTemplates);
        setTemplates(newTemplates);
      } catch (error) {
        console.error("Ошибка загрузки шаблонов:", error);
      }
    };

    fetchTemplates();
  }, []);

  // Загрузка списка шаблонов (жалоб)
  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await axios.get(
          "http://localhost:11000/temp-anamnesis-morbi-list"
        );
        setAnamnesisMorbiList(response.data);
      } catch (error) {
        console.error("Ошибка при загрузке жалоб:", error);
      }
    };

    fetchComplaints();
  }, []);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
    }
  };

  // Обновление выбранного шаблона для конкретного поля
  const handleTemplateSelect = (field, templateId) => {
    const template = templates[field]?.find((t) => t._id === templateId);
    setSelectedTemplates({ ...selectedTemplates, [field]: template || null });
  };
  // Открытие модального окна для предварительного просмотра шаблона
  const openModalForField = (field) => {
    const template = selectedTemplates[field];
    if (template) {
      setActiveField(field);
      setPreviewTitle(template.title);
      setPreviewText(template.content);
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Вставка шаблона из модального окна для активного поля
  const insertTemplateFromModal = () => {
    if (activeField && selectedTemplates[activeField]) {
      setFormData((prevData) => ({
        ...prevData,
        [activeField]:
          prevData[activeField] + "\n" + selectedTemplates[activeField].content,
      }));
      closeModal();
    }
  };

  // Прямая вставка шаблона без предварительного просмотра
  const insertTemplateDirect = (field) => {
    if (selectedTemplates[field]) {
      setFormData((prevData) => ({
        ...prevData,
        [field]: prevData[field] + "\n" + selectedTemplates[field].content,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      alert("Пожалуйста, войдите в систему.");
      navigate("/login");
      return;
    }

    try {
      const formDataToSend = new FormData();

      Object.keys(formData).forEach((key) => {
        if (Array.isArray(formData[key])) {
          formData[key].forEach((item) => formDataToSend.append(key, item));
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      if (photo) {
        formDataToSend.append("image", photo);
      }

      const response = await axios.post(
        `http://localhost:11000/patients-polyclinic-medical-history/${id}`,
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        }
      );

      alert(response.data?.message || "Пациент успешно добавлен!");
      navigate("/polyclinic");
    } catch (error) {
      console.error("Ошибка при добавлении пациента: ", error);
      alert(error.response ? error.response.data.message : "Произошла ошибка.");
    }
  };

  if (!isAuthenticated) {
    return <div>Загрузка...</div>;
  }

  // Повторно используемый компонент для работы с шаблонами в конкретном поле
  const TemplateActions = ({ field }) => {
    console.log(`Рендеринг шаблонов для ${field}:`, templates[field]);
    return (
      <div className="template-actions" style={{ marginTop: "10px" }}>
        <select onChange={(e) => handleTemplateSelect(field, e.target.value)}>
          <option value="">Выберите шаблон</option>
          {templates[field]?.length > 0 ? (
            templates[field].map((template) => (
              <option key={template._id} value={template._id}>
                {template.title}
              </option>
            ))
          ) : (
            <option disabled>Нет доступных шаблонов</option>
          )}
        </select>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => openModalForField(field)}
          disabled={!selectedTemplates[field]}
          style={{ marginRight: "5px" }}
        >
          Preview
        </button>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => insertTemplateDirect(field)}
          disabled={!selectedTemplates[field]}
          style={{ marginRight: "5px" }}
        >
          Insert
        </button>
        <Link to="/add-complainte-template">
          <button
            type="button"
            className="btn btn-info"
            style={{ width: "350px", marginTop: "5px" }}
          >
            Создать новый шаблон
          </button>
        </Link>
      </div>
    );
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
                      <div className="row mb-3">
                        <label className="col-md-4 col-lg-2 col-form-label">
                          Complaints
                        </label>
                        <div className="col-md-8 col-lg-10">
                          <textarea
                            name="complaints"
                            value={formData.complaints}
                            onChange={handleChange}
                            rows="10"
                            cols="30"
                            className="form-control"
                            id="complaints"
                            style={{ height: "100px" }}
                          ></textarea>
                          <TemplateActions field="complaints" />
                        </div>
                      </div>
                      {/* Anamnesis morbi Field */}
                      <div className="row mb-3">
                        <label className="col-md-4 col-lg-2 col-form-label">
                          Anamnesis morbi
                        </label>
                        <div className="col-md-8 col-lg-10">
                          <textarea
                            name="anamnesisMorbi"
                            value={formData.anamnesisMorbi}
                            onChange={handleChange}
                            rows="10"
                            cols="30"
                            className="form-control"
                            id="anamnesisMorbi"
                            style={{ height: "100px" }}
                          ></textarea>
                          <TemplateActions field="anamnesisMorbi" />
                        </div>
                      </div>
                      {/* Anamnesis vitae Field */}
                      <div className="row mb-3">
                        <label className="col-md-4 col-lg-2 col-form-label">
                          Anamnesis vitae
                        </label>
                        <div className="col-md-8 col-lg-10">
                          <textarea
                            name="anamnesisVitae"
                            value={formData.anamnesisVitae}
                            onChange={handleChange}
                            className="form-control"
                            id="anamnesisVitae"
                            style={{ height: "100px" }}
                          ></textarea>
                          <TemplateActions field="anamnesisVitae" />
                        </div>
                      </div>
                      {/* Status preasens Field */}
                      <div className="row mb-3">
                        <label className="col-md-4 col-lg-2 col-form-label">
                          Status preasens
                        </label>
                        <div className="col-md-8 col-lg-10">
                          <textarea
                            name="statusPreasens"
                            value={formData.statusPreasens}
                            onChange={handleChange}
                            className="form-control"
                            id="statusPreasens"
                            style={{ height: "100px" }}
                          ></textarea>
                          <TemplateActions field="statusPreasens" />
                        </div>
                      </div>
                      {/* Status localis Field */}
                      <div className="row mb-3">
                        <label className="col-md-4 col-lg-2 col-form-label">
                          Status localis
                        </label>
                        <div className="col-md-8 col-lg-10">
                          <textarea
                            name="statusLocalis"
                            value={formData.statusLocalis}
                            onChange={handleChange}
                            className="form-control"
                            id="statusLocalis"
                            style={{ height: "100px" }}
                          ></textarea>
                          <TemplateActions field="statusLocalis" />
                        </div>
                      </div>
                      {/* CT scan results Field */}
                      <div className="row mb-3">
                        <label className="col-md-4 col-lg-2 col-form-label">
                          CT scan results
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
                            style={{ height: "100px" }}
                          ></textarea>
                          <TemplateActions field="ctScanResults" />
                        </div>
                      </div>
                      {/* MRI results Field */}
                      <div className="row mb-3">
                        <label className="col-md-4 col-lg-2 col-form-label">
                          MRI results
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
                            style={{ height: "100px" }}
                          ></textarea>
                          <TemplateActions field="mriResults" />
                        </div>
                      </div>
                      {/* Ultrasound results Field */}
                      <div className="row mb-3">
                        <label className="col-md-4 col-lg-2 col-form-label">
                          Ultrasound results
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
                            style={{ height: "100px" }}
                          ></textarea>
                          <TemplateActions field="ultrasoundResults" />
                        </div>
                      </div>
                      {/* Laboratory test results Field */}
                      <div className="row mb-3">
                        <label className="col-md-4 col-lg-2 col-form-label">
                          Laboratory test results
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
                            style={{ height: "100px" }}
                          ></textarea>
                          <TemplateActions field="laboratoryTestResults" />
                        </div>
                      </div>
                      {/* Diagnosis Field */}
                      <div className="row mb-3">
                        <label className="col-md-4 col-lg-2 col-form-label">
                          Diagnosis
                        </label>
                        <div className="col-md-8 col-lg-10">
                          <div className="search-container">
                            <input
                              type="text"
                              name="diagnosis"
                              value={formData.diagnosis}
                              onChange={handleChange}
                              list="diseases"
                              className="search-input"
                              placeholder="Select from the list..."
                            />
                            <datalist id="diseases">
                              <ICD10 />
                            </datalist>
                          </div>
                        </div>
                      </div>
                      {/* Recommendations Field */}
                      <div className="row mb-3">
                        <label className="col-md-1 col-lg-2 col-form-label">
                          Recommendations
                        </label>
                        <div className="col-md-11 col-lg-10">
                          <textarea
                            name="recommendations"
                            value={formData.recommendations}
                            onChange={handleChange}
                            className="form-control"
                            id="recommendations"
                            style={{ height: "100px" }}
                          ></textarea>
                          <TemplateActions field="recommendations" />
                        </div>
                      </div>
                      {/* Operations performed Field */}
                      <div className="row mb-3">
                        <label className="col-md-4 col-lg-2 col-form-label">
                          Operations performed
                        </label>
                        <div className="col-md-8 col-lg-10">
                          <div className="search-container">
                            <input
                              list="diseases"
                              className="search-input"
                              placeholder="Select from the list..."
                            />
                            <datalist id="diseases">
                              <ICD10 />
                            </datalist>
                          </div>
                        </div>
                      </div>
                      {/* Consent */}
                      <div
                        className="text-center"
                        style={{ marginBottom: "20px" }}
                      >
                        <label style={{ marginRight: "20px" }}>
                          Согласен на обработку моих данных:
                        </label>
                        <input
                          type="checkbox"
                          name="isConsentGiven"
                          checked={formData.isConsentGiven}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              isConsentGiven: e.target.checked,
                            })
                          }
                        />
                      </div>
                      <div className="text-center">
                        <button type="submit" className="btn btn-primary">
                          Add new patient
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
      {/* Модальное окно для предпросмотра шаблона */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Preview"
        shouldCloseOnOverlayClick={true}
        style={{
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          },
          content: {
            top: "50%",
            left: "50%",
            right: "auto",
            bottom: "auto",
            transform: "translate(-50%, -50%)",
          },
        }}
      >
        <h2>{previewTitle}</h2>
        <p>{previewText}</p>
        <button onClick={insertTemplateFromModal} type="button">
          Вставить шаблон
        </button>
        <button onClick={closeModal}>Закрыть</button>
      </Modal>
    </div>
  );
}
