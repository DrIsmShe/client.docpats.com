import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Modal from "react-modal";
import axios from "axios";

Modal.setAppElement("#root");

export default function AddPatientMedicalHistory() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    patientId: id,
    doctorId: "",
    complaints: "",
    anamnesisMorbi: "",
    anamnesisVitae: "",
    statusPreasens: "",
    statusLocalis: "",
    diagnosis: [],
    recommendations: "",
    ctScanResults: "",
    mriResults: "",
    ultrasoundResults: "",
    laboratoryTestResults: "",
    isConsentGiven: false,
  });

  const [templates, setTemplates] = useState({});
  const [selectedTemplates, setSelectedTemplates] = useState({});
  const [modals, setModals] = useState({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState("");

  const fields = Object.keys(formData).filter(
    (field) =>
      field !== "patientId" &&
      field !== "doctorId" &&
      field !== "isConsentGiven"
  );

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
  }, [navigate]);

  useEffect(() => {
    const fetchTemplates = async () => {
      const newTemplates = {};
      for (const field of fields) {
        try {
          const response = await axios.get(endpoints[field]);
          newTemplates[field] = response.data;
        } catch (err) {
          console.error(`Ошибка загрузки шаблонов для ${field}:`, err);
          newTemplates[field] = [];
        }
      }
      setTemplates(newTemplates);
    };
    fetchTemplates();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleTemplateSelect = (field, templateId) => {
    const template = templates[field]?.find((t) => t._id === templateId);
    setSelectedTemplates((prev) => ({ ...prev, [field]: template }));
  };

  const toggleModal = (field) => {
    setModals((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const insertTemplate = (field) => {
    if (selectedTemplates[field]) {
      setFormData((prevData) => ({
        ...prevData,
        [field]: prevData[field] + "\n" + selectedTemplates[field].content,
      }));
    }
    toggleModal(field);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `http://localhost:11000/patients-polyclinic-medical-history/${id}`,
        formData,
        { withCredentials: true }
      );
      alert(response.data?.message || "Данные успешно сохранены!");
      navigate("/polyclinic");
    } catch (error) {
      console.error("Ошибка при сохранении данных:", error);
      alert("Ошибка при сохранении данных. Пожалуйста, попробуйте еще раз.");
    }
  };

  if (!isAuthenticated) {
    return <div>Загрузка...</div>;
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        {fields.map((field) => (
          <div className="row mb-3" key={field}>
            <label className="col-md-4 col-lg-2 col-form-label">{field}</label>
            <div className="col-md-8 col-lg-10">
              <textarea
                name={field}
                value={formData[field]}
                onChange={handleChange}
                className="form-control"
                style={{ height: "100px" }}
              ></textarea>
              <div className="template-actions" style={{ marginTop: "10px" }}>
                <select
                  onChange={(e) => handleTemplateSelect(field, e.target.value)}
                >
                  <option value="">Выберите шаблон</option>
                  {templates[field]?.map((template) => (
                    <option key={template._id} value={template._id}>
                      {template.title}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={() => toggleModal(field)}>
                  Preview
                </button>
              </div>
              <Modal
                isOpen={modals[field]}
                onRequestClose={() => toggleModal(field)}
              >
                <h2>{selectedTemplates[field]?.title}</h2>
                <p>{selectedTemplates[field]?.content}</p>
                <button onClick={() => insertTemplate(field)}>
                  Вставить шаблон
                </button>
                <button onClick={() => toggleModal(field)}>Закрыть</button>
              </Modal>
            </div>
          </div>
        ))}
        <button type="submit" className="btn btn-success">
          Сохранить все
        </button>
      </form>
    </div>
  );
}
