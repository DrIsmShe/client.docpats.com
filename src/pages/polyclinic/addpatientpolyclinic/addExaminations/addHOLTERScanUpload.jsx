import { useEffect, useState } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import axios from "axios";
import Modal from "react-modal";
import { FileText, FileEdit, Stethoscope, ListChecks } from "lucide-react";
import { useTranslation } from "react-i18next";

Modal.setAppElement("#root");

export default function AddHOLTERScanUpload() {
  const { t } = useTranslation("Examinations");
  const { patientId, patientModel } = useParams(); // ← ДОБАВИЛИ patientModel
  const [warning, setWarning] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

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
              `${API_BASE}/clinic/get-templates-examinations/HOLTERscaner/nameofexam/${patientId}`,
              { withCredentials: true },
            ),
            axios.get(
              `${API_BASE}/clinic/get-templates-examinations/HOLTERscaner/report/${patientId}`,
              { withCredentials: true },
            ),
            axios.get(
              `${API_BASE}/clinic/get-templates-examinations/HOLTERscaner/diagnosis/${patientId}`,
              { withCredentials: true },
            ),
            axios.get(
              `${API_BASE}/clinic/get-templates-examinations/HOLTERscaner/recomandation/${patientId}`,
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
  }, [patientId]); // ← добавили зависимость

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
      alert(t("AddHOLTERScanUpload.messages.patientMissing"));
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
        `${API_BASE}/clinic/add-examinations/add-holter-scan/${patientId}/${patientModel}`,
        data,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        },
      );
      const scan = response.data.data;
      setMessage(t("AddHOLTERScanUpload.messages.success"));

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
        `${t("AddHOLTERScanUpload.messages.errorPrefix")} ${
          error.response?.data?.message || error.message
        }`,
      );
    }

    setLoading(false);
  };

  const renderTemplateButton = (fieldName, createPath, listPath) => (
    <>
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary me-2"
        style={{ marginBottom: "10px" }}
        onClick={() => openModal(fieldName)}
      >
        {t("AddHOLTERScanUpload.buttons.useTemplate")}
      </button>

      <Link
        to={createPath}
        className="btn btn-sm btn-success me-2"
        style={{ marginBottom: "10px" }}
      >
        {t("AddHOLTERScanUpload.buttons.newTemplate")}
      </Link>

      <Link
        to={listPath}
        className="btn btn-sm btn-info"
        style={{ marginBottom: "10px" }}
      >
        {t("AddHOLTERScanUpload.buttons.listTemplates")}
      </Link>
    </>
  );

  const renderTemplateModal = (field) => (
    <Modal
      isOpen={modalState[field]}
      onRequestClose={() => closeModal(field)}
      contentLabel={t("AddHOLTERScanUpload.modal.title", { field })}
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
        {t("AddHOLTERScanUpload.modal.selectTemplateFor")} "{field}"
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
              {t("AddHOLTERScanUpload.buttons.insert")}
            </button>
          </li>
        ))}
      </ul>

      <button className="btn btn-secondary" onClick={() => closeModal(field)}>
        {t("AddHOLTERScanUpload.buttons.close")}
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
        borderRadius: "8px",
        boxShadow: "0 0 10px rgba(0,0,0,0.1)",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
        {t("AddHOLTERScanUpload.page.title")}
      </h2>
      {warning && (
        <div
          style={{
            background: "#fff3cd",
            color: "#856404",
            padding: "10px",
            borderRadius: "5px",
            marginBottom: "10px",
            textAlign: "center",
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
            <FileText /> {t("AddHOLTERScanUpload.fields.nameofexam.label")}
            <div className="float-end">
              {renderTemplateButton(
                "nameofexam",
                "/dp/add-holter-scan-template-nameofexam",
                `/dp/list-holter-scan-template-nameofexam/${patientId}`,
              )}
            </div>
          </label>

          <textarea
            name="nameofexam"
            value={formData.nameofexam}
            onChange={handleChange}
            className="form-control"
            placeholder={t("AddHOLTERScanUpload.fields.nameofexam.placeholder")}
            required
            style={{ marginBottom: "10px" }}
          />

          {renderTemplateModal("nameofexam")}
        </div>

        {/* Report */}
        <div className="form-group">
          <label>
            <FileEdit /> {t("AddHOLTERScanUpload.fields.report.label")}
            <div className="float-end">
              {renderTemplateButton(
                "report",
                "/dp/add-holter-scan-template-report",
                `/dp/list-holter-scan-template-report/${patientId}`,
              )}
            </div>
          </label>

          <textarea
            name="report"
            value={formData.report}
            onChange={handleChange}
            className="form-control"
            placeholder={t("AddHOLTERScanUpload.fields.report.placeholder")}
            style={{ marginBottom: "10px", height: "300px" }}
          />

          {renderTemplateModal("report")}
        </div>

        {/* Diagnosis */}
        <div className="form-group">
          <label>
            <Stethoscope /> {t("AddHOLTERScanUpload.fields.diagnosis.label")}
            <div className="float-end">
              {renderTemplateButton(
                "diagnosis",
                "/dp/add-holter-scan-template-diagnosis",
                `/dp/list-holter-scan-template-diagnosis/${patientId}`,
              )}
            </div>
          </label>

          <textarea
            name="diagnosis"
            value={formData.diagnosis}
            onChange={handleChange}
            className="form-control"
            placeholder={t("AddHOLTERScanUpload.fields.diagnosis.placeholder")}
            style={{ marginBottom: "10px" }}
            required
          />

          {renderTemplateModal("diagnosis")}
        </div>

        {/* Recommendation */}
        <div className="form-group">
          <label>
            <ListChecks /> {t("AddHOLTERScanUpload.fields.recomandation.label")}
            <div className="float-end">
              {renderTemplateButton(
                "recomandation",
                "/dp/add-holter-scan-template-recomandation",
                `/dp/list-holter-scan-template-recomandation/${patientId}`,
              )}
            </div>
          </label>

          <textarea
            name="recomandation"
            value={formData.recomandation}
            onChange={handleChange}
            className="form-control"
            placeholder={t(
              "AddHOLTERScanUpload.fields.recomandation.placeholder",
            )}
            style={{ marginBottom: "10px" }}
          />

          {renderTemplateModal("recomandation")}
        </div>

        {/* Radiation */}
        <div className="form-group">
          <label>{t("AddHOLTERScanUpload.fields.radiationDose.label")}</label>

          <input
            type="number"
            name="radiationDose"
            value={formData.radiationDose}
            onChange={handleChange}
            placeholder={t(
              "AddHOLTERScanUpload.fields.radiationDose.placeholder",
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
            {t("AddHOLTERScanUpload.fields.contrastUsed.label")}
          </label>
        </div>

        {/* Files */}
        <div className="form-group">
          <label>{t("AddHOLTERScanUpload.fields.files.label")}</label>

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
              {t("AddHOLTERScanUpload.fields.files.choose")}
            </button>

            <span style={{ fontSize: "0.9em", color: "#555" }}>
              {formData.files.length > 0
                ? `${formData.files.length} ${t(
                    "AddHOLTERScanUpload.fields.files.selected",
                  )}`
                : t("AddHOLTERScanUpload.fields.files.none")}
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

          {/* File list */}
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
                      {t("AddHOLTERScanUpload.fields.files.type")}: {extension}{" "}
                      | {t("AddHOLTERScanUpload.fields.files.size")}: {sizeInMB}{" "}
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
            ? t("AddHOLTERScanUpload.buttons.loading")
            : t("AddHOLTERScanUpload.buttons.submit")}
        </button>
      </form>
    </div>
  );
}
