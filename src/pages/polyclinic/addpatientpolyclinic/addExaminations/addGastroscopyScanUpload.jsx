import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Modal from "react-modal";
import { FileText, FileEdit, Stethoscope, ListChecks } from "lucide-react";
import { useTranslation } from "react-i18next";

Modal.setAppElement("#root");

export default function AddGastroscopyScanUpload() {
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
              `${API_BASE}/clinic/get-templates-examinations/Gastroscopyscaner/nameofexam/${patientId}`,
              { withCredentials: true },
            ),
            axios.get(
              `${API_BASE}/clinic/get-templates-examinations/Gastroscopyscaner/report/${patientId}`,
              { withCredentials: true },
            ),
            axios.get(
              `${API_BASE}/clinic/get-templates-examinations/Gastroscopyscaner/diagnosis/${patientId}`,
              { withCredentials: true },
            ),
            axios.get(
              `${API_BASE}/clinic/get-templates-examinations/Gastroscopyscaner/recomandation/${patientId}`,
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
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, files: Array.from(e.target.files) });
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
      alert(t("AddGastroscopyScanUpload.errors.noPatientId"));
      return;
    }

    setLoading(true);
    setMessage("");

    const data = new FormData();
    data.append("patient", patientId);
    Object.keys(formData).forEach((key) => {
      if (key === "files") {
        formData.files.forEach((file) => data.append("files", file));
      } else {
        data.append(key, formData[key]);
      }
    });

    try {
      const response = await axios.post(
        `${API_BASE}/clinic/add-examinations/add-gastroscopy-scan/${patientId}`,
        data,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        },
      );
      const scan = response.data.data;
      setMessage(t("AddGastroscopyScanUpload.messages.success"));
      navigate(
        patientModel === "DoctorPrivatePatient"
          ? `/dp/private-patient-detail/${patientId}`
          : `/dp/patient-detail/${patientId}`,
        {
          state: {
            success: true,
            warning: scan?.performedOutsideSpecialization
              ? t("addAngiographyScanUpload.messages.outsideSpecialization")
              : null,
          },
        },
      );
    } catch (error) {
      setMessage(
        t("AddGastroscopyScanUpload.messages.error") +
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
        {t("AddGastroscopyScanUpload.buttons.useTemplate")}
      </button>

      <Link
        to={createPath}
        className="btn btn-sm btn-success me-2"
        style={{ marginBottom: "10px" }}
      >
        {t("AddGastroscopyScanUpload.buttons.newTemplate")}
      </Link>

      <Link
        to={listPath}
        className="btn btn-sm btn-info"
        style={{ marginBottom: "10px" }}
      >
        {t("AddGastroscopyScanUpload.buttons.listTemplates")}
      </Link>
    </>
  );

  const renderTemplateModal = (field) => (
    <Modal
      isOpen={modalState[field]}
      onRequestClose={() => closeModal(field)}
      contentLabel={t("AddGastroscopyScanUpload.modal.title", { field })}
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
        {t("AddGastroscopyScanUpload.modal.selectTemplateFor")} "{field}"
      </h3>
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
              {t("AddGastroscopyScanUpload.buttons.insert")}
            </button>
          </li>
        ))}
      </ul>

      <button
        onClick={() => closeModal(field)}
        className="btn btn-secondary mt-2"
      >
        {t("AddGastroscopyScanUpload.buttons.close")}
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
        {t("AddGastroscopyScanUpload.page.title")}
      </h2>

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
          <div className="d-flex justify-content-between align-items-center mb-1">
            <label className="mb-0">
              <FileText />{" "}
              {t("AddGastroscopyScanUpload.fields.nameofexam.label")}
            </label>

            <div>
              {renderTemplateButton(
                "nameofexam",
                "/dp/add-gastroscopy-scan-template-nameofexam",
                `/dp/list-gastroscopy-scan-template-nameofexam/${patientId}`,
              )}
            </div>
          </div>

          <textarea
            style={{ marginBottom: "10px" }}
            name="nameofexam"
            value={formData.nameofexam}
            onChange={handleChange}
            placeholder={t(
              "AddGastroscopyScanUpload.fields.nameofexam.placeholder",
            )}
            className="form-control"
            required
          />
          {renderTemplateModal("nameofexam")}
        </div>

        {/* Report */}
        {/* <div className="form-group">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <label className="mb-0">
              <FileEdit /> {t("AddGastroscopyScanUpload.fields.report.label")}
            </label>

            <div>
              {renderTemplateButton(
                "report",
                "/dp/add-gastroscopy-scan-template-report",
                `/dp/list-gastroscopy-scan-template-report/${patientId}`
              )}
            </div>
          </div>

          <textarea
            style={{ marginBottom: "10px", height: "300px" }}
            name="report"
            value={formData.report}
            onChange={handleChange}
            placeholder={t(
              "AddGastroscopyScanUpload.fields.report.placeholder"
            )}
            className="form-control"
          />
          {renderTemplateModal("report")}
        </div> */}

        {/* Diagnosis */}
        <div className="form-group">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <label className="mb-0">
              <Stethoscope />{" "}
              {t("AddGastroscopyScanUpload.fields.report.label")} -
              {t("AddGastroscopyScanUpload.fields.diagnosis.label")}{" "}
            </label>

            <div>
              {renderTemplateButton(
                "diagnosis",
                "/dp/add-gastroscopy-scan-template-diagnosis",
                `/dp/list-gastroscopy-scan-template-diagnosis/${patientId}`,
              )}
            </div>
          </div>

          <textarea
            style={{ marginBottom: "10px" }}
            name="diagnosis"
            value={formData.diagnosis}
            onChange={handleChange}
            placeholder={t(
              "AddGastroscopyScanUpload.fields.diagnosis.placeholder",
            )}
            className="form-control"
            required
          />
          {renderTemplateModal("diagnosis")}
        </div>

        {/* Recommendations */}
        <div className="form-group">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <label className="mb-0">
              <ListChecks />{" "}
              {t("AddGastroscopyScanUpload.fields.recomandation.label")}
            </label>

            <div>
              {renderTemplateButton(
                "recomandation",
                "/dp/add-gastroscopy-scan-template-recomandation",
                `/dp/list-gastroscopy-scan-template-recomandation/${patientId}`,
              )}
            </div>
          </div>

          <textarea
            style={{ marginBottom: "10px" }}
            name="recomandation"
            value={formData.recomandation}
            onChange={handleChange}
            placeholder={t(
              "AddGastroscopyScanUpload.fields.recomandation.placeholder",
            )}
            className="form-control"
          />
          {renderTemplateModal("recomandation")}
        </div>

        {/* Radiation */}
        <div className="form-group">
          <label>
            {t("AddGastroscopyScanUpload.fields.radiationDose.label")}
          </label>
          <input
            type="number"
            name="radiationDose"
            value={formData.radiationDose}
            onChange={handleChange}
            placeholder={t(
              "AddGastroscopyScanUpload.fields.radiationDose.placeholder",
            )}
            className="form-control"
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
            {t("AddGastroscopyScanUpload.fields.contrastUsed.label")}
          </label>
        </div>

        {/* Files */}
        <div className="form-group">
          <label>{t("AddGastroscopyScanUpload.fields.files.label")}</label>

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
              {t("AddGastroscopyScanUpload.fields.files.choose")}
            </button>

            <span style={{ fontSize: "0.9em", color: "#555" }}>
              {formData.files.length > 0
                ? `${formData.files.length} ${t(
                    "AddGastroscopyScanUpload.fields.files.selected",
                  )}`
                : t("AddGastroscopyScanUpload.fields.files.none")}
            </span>
          </div>

          <input
            id="customFileInput"
            type="file"
            multiple
            onChange={handleFileChange}
            accept="image/*,application/pdf,video/*,audio/*"
            style={{ display: "none" }}
          />

          {formData.files.length > 0 && (
            <ul style={{ paddingLeft: "20px" }}>
              {formData.files.map((file, index) => {
                const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
                const extension = file.name.split(".").pop().toUpperCase();
                const type = file.type;

                return (
                  <li
                    key={index}
                    style={{ fontSize: "0.9em", marginBottom: "8px" }}
                  >
                    📎 <strong>{file.name}</strong>
                    <br />
                    <span style={{ color: "#555" }}>
                      {t("AddGastroscopyScanUpload.fields.files.type")}:{" "}
                      {extension} |{" "}
                      {t("AddGastroscopyScanUpload.fields.files.size")}:{" "}
                      {sizeInMB} MB
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
            ? t("AddGastroscopyScanUpload.buttons.loading")
            : t("AddGastroscopyScanUpload.buttons.submit")}
        </button>
      </form>
    </div>
  );
}
