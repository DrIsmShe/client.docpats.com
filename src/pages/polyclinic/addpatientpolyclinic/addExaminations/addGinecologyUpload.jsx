import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Modal from "react-modal";
import { FileText, FileEdit, Stethoscope, ListChecks } from "lucide-react";
import { useTranslation } from "react-i18next";

Modal.setAppElement("#root");

export default function AddGinecologyUpload() {
  const { t } = useTranslation("Examinations");
  const { patientId, patientModel } = useParams();

  const navigate = useNavigate();
  const [warning, setWarning] = useState("");
  const [formData, setFormData] = useState({
    nameofexam: "",
    diagnosis: "",
    report: "",
    recomandation: "",
    radiationDose: "",
    contrastUsed: false,
    files: [],
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [modalState, setModalState] = useState({
    nameofexam: false,
    report: false,
    diagnosis: false,
    recomandation: false,
  });

  const [templates, setTemplates] = useState({
    nameofexam: [],
    report: [],
    diagnosis: [],
    recomandation: [],
  });

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    if (!patientId) return;
    const fetchTemplates = async () => {
      try {
        const [nameofexamRes, reportRes, diagnosisRes, recomandationRes] =
          await Promise.all([
            axios.get(
              `${API_BASE}/clinic/get-templates-examinations/Ginecology/nameofexam/${patientId}`,
              { withCredentials: true },
            ),
            axios.get(
              `${API_BASE}/clinic/get-templates-examinations/Ginecology/report/${patientId}`,
              { withCredentials: true },
            ),
            axios.get(
              `${API_BASE}/clinic/get-templates-examinations/Ginecology/diagnosis/${patientId}`,
              { withCredentials: true },
            ),
            axios.get(
              `${API_BASE}/clinic/get-templates-examinations/Ginecology/recomandation/${patientId}`,
              { withCredentials: true },
            ),
          ]);

        setTemplates({
          nameofexam: nameofexamRes.data,
          report: reportRes.data,
          diagnosis: diagnosisRes.data,
          recomandation: recomandationRes.data,
        });
      } catch (error) {
        console.error("Error loading templates:", error);
      }
    };

    fetchTemplates();
  }, [patientId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      files: Array.from(e.target.files),
    }));
  };

  const openModal = (field) => {
    setModalState((prev) => ({ ...prev, [field]: true }));
  };

  const closeModal = (field) => {
    setModalState((prev) => ({ ...prev, [field]: false }));
  };

  const insertTemplate = (field, content) => {
    setFormData((prev) => ({ ...prev, [field]: content }));
    closeModal(field);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!patientId) {
      alert(t("AddGinecologyUpload.errors.noPatientId"));
      return;
    }

    setLoading(true);
    setMessage("");

    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      if (key === "files") {
        formData.files.forEach((file) => data.append("files", file));
      } else {
        data.append(key, formData[key]);
      }
    });

    try {
      const response = await axios.post(
        `${API_BASE}/clinic/add-examinations/add-ginecology-test/${patientId}`,
        data,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        },
      );
      const scan = response.data.data;

      setMessage(t("AddGinecologyUpload.messages.success"));
      navigate(
        patientModel === "DoctorPrivatePatient"
          ? `/dp/private-patient-detail/${patientId}`
          : `/dp/patient-detail/${patientId}`,
        {
          state: {
            warning: scan.performedOutsideSpecialization
              ? t("addAngiographyScanUpload.messages.outsideSpecialization")
              : null,
            success: true,
          },
        },
      );
    } catch (error) {
      setMessage(
        t("AddGinecologyUpload.messages.error") +
          (error.response?.data?.message || error.message),
      );
    }

    setLoading(false);
  };

  const renderTemplateButton = (fieldName, createPath, listPath) => (
    <>
      <button
        style={{ marginBottom: "10px" }}
        type="button"
        className="btn btn-sm btn-outline-secondary me-2"
        onClick={() => openModal(fieldName)}
      >
        {t("AddGinecologyUpload.buttons.useTemplate")}
      </button>

      <Link
        to={createPath}
        className="btn btn-sm btn-success me-2"
        style={{ marginBottom: "10px" }}
      >
        {t("AddGinecologyUpload.buttons.newTemplate")}
      </Link>

      <Link
        to={listPath}
        className="btn btn-sm btn-info"
        style={{ marginBottom: "10px" }}
      >
        {t("AddGinecologyUpload.buttons.listTemplates")}
      </Link>
    </>
  );

  const renderTemplateModal = (field) => (
    <Modal
      isOpen={modalState[field]}
      onRequestClose={() => closeModal(field)}
      contentLabel={t("AddGinecologyUpload.modal.title", { field })}
      style={{
        content: {
          maxWidth: "500px",
          margin: "auto",
          padding: "20px",
          borderRadius: "8px",
        },
      }}
    >
      <h3>
        {t("AddGinecologyUpload.modal.selectTemplateFor")} "{field}"
      </h3>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {templates[field].map((tpl) => (
          <li
            key={tpl._id}
            style={{
              marginBottom: "15px",
              borderBottom: "1px solid #ddd",
              paddingBottom: "10px",
            }}
          >
            <strong>{tpl.title}</strong>

            <p style={{ fontSize: "0.9em" }}>{tpl.content.slice(0, 100)}...</p>

            <button
              className="btn btn-sm btn-success"
              onClick={() => insertTemplate(field, tpl.content)}
            >
              {t("AddGinecologyUpload.buttons.insert")}
            </button>
          </li>
        ))}
      </ul>

      <button onClick={() => closeModal(field)} className="btn btn-secondary">
        {t("AddGinecologyUpload.buttons.close")}
      </button>
    </Modal>
  );

  return (
    <div
      style={{
        maxWidth: "100%",
        margin: "20px auto",
        padding: "20px",
        background: "#fff",
        boxShadow: "0 0 10px rgba(0,0,0,0.1)",
        borderRadius: "8px",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
        {t("AddGinecologyUpload.page.title")}
      </h2>
      {warning && (
        <div
          style={{
            background: "#fff3cd",
            color: "#856404",
            padding: "10px",
            borderRadius: "5px",
            marginBottom: "10px",
          }}
        >
          {warning}
        </div>
      )}
      {message && (
        <div
          style={{
            padding: "10px",
            backgroundColor: message.startsWith("✅") ? "#d4edda" : "#f8d7da",
            color: message.startsWith("✅") ? "#155724" : "#721c24",
            borderRadius: "5px",
            marginBottom: "10px",
            textAlign: "center",
          }}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Name of Exam */}
        <div className="form-group">
          <label>
            <FileText /> {t("AddGinecologyUpload.fields.nameofexam.label")}
            <div className="float-end">
              {renderTemplateButton(
                "nameofexam",
                "/dp/add-ginecology-test-template-nameofexam",
                `/dp/list-ginecology-test-template-nameofexam/${patientId}`,
              )}
            </div>
          </label>

          <textarea
            name="nameofexam"
            value={formData.nameofexam}
            onChange={handleChange}
            className="form-control"
            placeholder={t("AddGinecologyUpload.fields.nameofexam.placeholder")}
            required
            style={{ marginBottom: "10px" }}
          />

          {renderTemplateModal("nameofexam")}
        </div>

        {/* Report */}
        <div className="form-group">
          <label>
            <FileEdit /> {t("AddGinecologyUpload.fields.report.label")}
            <div className="float-end">
              {renderTemplateButton(
                "report",
                "/dp/add-ginecology-test-template-report",
                `/dp/list-ginecology-test-template-report/${patientId}`,
              )}
            </div>
          </label>

          <textarea
            name="report"
            value={formData.report}
            onChange={handleChange}
            className="form-control"
            placeholder={t("AddGinecologyUpload.fields.report.placeholder")}
            style={{ marginBottom: "10px", height: "300px" }}
          />

          {renderTemplateModal("report")}
        </div>

        {/* Diagnosis */}
        <div className="form-group">
          <label>
            <Stethoscope /> {t("AddGinecologyUpload.fields.diagnosis.label")}
            <div className="float-end">
              {renderTemplateButton(
                "diagnosis",
                "/dp/add-ginecology-test-template-diagnosis",
                `/dp/list-ginecology-test-template-diagnosis/${patientId}`,
              )}
            </div>
          </label>

          <textarea
            name="diagnosis"
            value={formData.diagnosis}
            onChange={handleChange}
            className="form-control"
            placeholder={t("AddGinecologyUpload.fields.diagnosis.placeholder")}
            style={{ marginBottom: "10px" }}
            required
          />

          {renderTemplateModal("diagnosis")}
        </div>

        {/* Recomendation */}
        <div className="form-group">
          <label>
            <ListChecks /> {t("AddGinecologyUpload.fields.recomandation.label")}
            <div className="float-end">
              {renderTemplateButton(
                "recomandation",
                "/dp/add-ginecology-test-template-recomandation",
                `/dp/list-ginecology-test-template-recomandation/${patientId}`,
              )}
            </div>
          </label>

          <textarea
            name="recomandation"
            value={formData.recomandation}
            onChange={handleChange}
            className="form-control"
            placeholder={t(
              "AddGinecologyUpload.fields.recomandation.placeholder",
            )}
            style={{ marginBottom: "10px" }}
          />

          {renderTemplateModal("recomandation")}
        </div>

        {/* Radiation Dose */}
        <div className="form-group">
          <label>{t("AddGinecologyUpload.fields.radiationDose.label")}</label>

          <input
            type="number"
            name="radiationDose"
            value={formData.radiationDose}
            onChange={handleChange}
            className="form-control"
            placeholder={t(
              "AddGinecologyUpload.fields.radiationDose.placeholder",
            )}
          />
        </div>

        {/* Contrast */}
        <div className="form-group" style={{ marginBottom: "20px" }}>
          <input
            type="checkbox"
            name="contrastUsed"
            checked={formData.contrastUsed}
            onChange={handleChange}
          />
          <label style={{ marginLeft: "8px" }}>
            {t("AddGinecologyUpload.fields.contrastUsed.label")}
          </label>
        </div>

        {/* Files */}
        <div className="form-group">
          <label>{t("AddGinecologyUpload.fields.files.label")}</label>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
              marginBottom: "10px",
            }}
          >
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={() => document.getElementById("customFileInput").click()}
            >
              {t("AddGinecologyUpload.fields.files.choose")}
            </button>

            <span style={{ fontSize: "0.9em", color: "#555" }}>
              {formData.files.length > 0
                ? `${formData.files.length} ${t(
                    "AddGinecologyUpload.fields.files.selected",
                  )}`
                : t("AddGinecologyUpload.fields.files.none")}
            </span>
          </div>

          <input
            id="customFileInput"
            type="file"
            multiple
            accept="image/*,application/pdf,video/*,audio/*"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />

          {formData.files.length > 0 && (
            <ul style={{ paddingLeft: "20px" }}>
              {formData.files.map((file, index) => {
                const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
                const extension = file.name.split(".").pop().toUpperCase();

                return (
                  <li
                    key={index}
                    style={{ fontSize: "0.9em", marginBottom: "8px" }}
                  >
                    📎 <strong>{file.name}</strong>
                    <br />
                    <span style={{ color: "#555" }}>
                      {t("AddGinecologyUpload.fields.files.type")}: {extension}{" "}
                      | {t("AddGinecologyUpload.fields.files.size")}: {sizeInMB}{" "}
                      MB
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
          style={{ width: "100%", marginTop: "15px" }}
        >
          {loading
            ? t("AddGinecologyUpload.buttons.loading")
            : t("AddGinecologyUpload.buttons.submit")}
        </button>
      </form>
    </div>
  );
}
