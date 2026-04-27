import { useEffect, useState } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import axios from "axios";
import Modal from "react-modal";
import { FileText, FileEdit, Stethoscope, ListChecks } from "lucide-react";
import { useTranslation } from "react-i18next";

Modal.setAppElement("#root");

export default function AddSpirometryScanUpload() {
  const { t } = useTranslation("Examinations");

  const { patientId, patientModel } = useParams();
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
              `${API_BASE}/clinic/get-templates-examinations/Spirometryscaner/nameofexam/${patientId}`,
              { withCredentials: true },
            ),
            axios.get(
              `${API_BASE}/clinic/get-templates-examinations/Spirometryscaner/report/${patientId}`,
              { withCredentials: true },
            ),
            axios.get(
              `${API_BASE}/clinic/get-templates-examinations/Spirometryscaner/diagnosis/${patientId}`,
              { withCredentials: true },
            ),
            axios.get(
              `${API_BASE}/clinic/get-templates-examinations/Spirometryscaner/recomandation/${patientId}`,
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
      alert(t("AddSpirometryScanUpload.messages.error"));
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
        `${API_BASE}/clinic/add-examinations/add-spirometry-scan/${patientId}`,
        data,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        },
      );
      const scan = response.data.data;
      setMessage(t("AddSpirometryScanUpload.messages.success"));
      navigate(
        patientModel === "DoctorPrivatePatient"
          ? `/dp/private-patient-detail/${patientId}`
          : `/dp/patient-detail/${patientId}`,
        {
          state: {
            success: true,
            warning: scan?.performedOutsideSpecialization
              ? t("addAngiographyScanUpload.page.outsideSpecialization")
              : null,
          },
        },
      );
    } catch (error) {
      setMessage(
        t("AddSpirometryScanUpload.messages.error") +
          ": " +
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
        📋 {t("AddSpirometryScanUpload.buttons.useTemplate")}
      </button>

      <Link
        to={createPath}
        className="btn btn-sm btn-success me-2"
        style={{ marginBottom: "10px" }}
      >
        ➕ {t("AddSpirometryScanUpload.buttons.newTemplate")}
      </Link>

      <Link
        to={listPath}
        className="btn btn-sm btn-info"
        style={{ marginBottom: "10px" }}
      >
        📂 {t("AddSpirometryScanUpload.buttons.listTemplates")}
      </Link>
    </>
  );

  const renderTemplateModal = (field) => (
    <Modal
      isOpen={modalState[field]}
      onRequestClose={() => closeModal(field)}
      contentLabel={t("AddSpirometryScanUpload.modal.title")}
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
        {t("AddSpirometryScanUpload.modal.select")} "{field}"
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
              ➕ {t("AddSpirometryScanUpload.buttons.insert")}
            </button>
          </li>
        ))}
      </ul>

      <button onClick={() => closeModal(field)} className="btn btn-secondary">
        {t("AddSpirometryScanUpload.buttons.close")}
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
        {t("AddSpirometryScanUpload.page.title")}
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
        {/* TITLE OF EXAM */}
        <div className="form-group">
          <label>
            <FileText /> {t("AddSpirometryScanUpload.fields.nameofexam.label")}
            <div className="float-end">
              {renderTemplateButton(
                "nameofexam",
                "/dp/add-spirometry-scan-template-nameofexam",
                `/dp/list-spirometry-scan-template-nameofexam/${patientId}`,
              )}
            </div>
          </label>

          <textarea
            style={{ marginBottom: "10px" }}
            name="nameofexam"
            value={formData.nameofexam}
            onChange={handleChange}
            className="form-control"
            required
            placeholder={t(
              "AddSpirometryScanUpload.fields.nameofexam.placeholder",
            )}
          />

          {renderTemplateModal("nameofexam")}
        </div>

        {/* REPORT */}
        <div className="form-group">
          <label>
            <FileEdit /> {t("AddSpirometryScanUpload.fields.report.label")}
            <div className="float-end">
              {renderTemplateButton(
                "report",
                "/dp/add-spirometry-scan-template-report",
                `/dp/list-spirometry-scan-template-report/${patientId}`,
              )}
            </div>
          </label>

          <textarea
            style={{ marginBottom: "10px", height: "300px" }}
            name="report"
            value={formData.report}
            onChange={handleChange}
            className="form-control"
            placeholder={t("AddSpirometryScanUpload.fields.report.placeholder")}
          />

          {renderTemplateModal("report")}
        </div>

        {/* DIAGNOSIS */}
        <div className="form-group">
          <label>
            <Stethoscope />{" "}
            {t("AddSpirometryScanUpload.fields.diagnosis.label")}
            <div className="float-end">
              {renderTemplateButton(
                "diagnosis",
                "/dp/add-spirometry-scan-template-diagnosis",
                `/dp/list-spirometry-scan-template-diagnosis/${patientId}`,
              )}
            </div>
          </label>

          <textarea
            style={{ marginBottom: "10px" }}
            name="diagnosis"
            value={formData.diagnosis}
            onChange={handleChange}
            className="form-control"
            required
            placeholder={t(
              "AddSpirometryScanUpload.fields.diagnosis.placeholder",
            )}
          />

          {renderTemplateModal("diagnosis")}
        </div>

        {/* RECOMMENDATIONS */}
        <div className="form-group">
          <label>
            <ListChecks />{" "}
            {t("AddSpirometryScanUpload.fields.recomandation.label")}
            <div className="float-end">
              {renderTemplateButton(
                "recomandation",
                "/dp/add-spirometry-scan-template-recomandation",
                `/dp/list-spirometry-scan-template-recomandation/${patientId}`,
              )}
            </div>
          </label>

          <textarea
            style={{ marginBottom: "10px" }}
            name="recomandation"
            value={formData.recomandation}
            onChange={handleChange}
            className="form-control"
            placeholder={t(
              "AddSpirometryScanUpload.fields.recomandation.placeholder",
            )}
          />

          {renderTemplateModal("recomandation")}
        </div>

        {/* RADIATION DOSE */}
        <div className="form-group">
          <label>
            {t("AddSpirometryScanUpload.fields.radiationDose.label")}
          </label>

          <input
            type="number"
            name="radiationDose"
            value={formData.radiationDose}
            onChange={handleChange}
            className="form-control"
            placeholder={t(
              "AddSpirometryScanUpload.fields.radiationDose.placeholder",
            )}
          />
        </div>

        {/* CONTRAST USED */}
        <div className="form-group" style={{ marginBottom: "20px" }}>
          <input
            type="checkbox"
            name="contrastUsed"
            checked={formData.contrastUsed}
            onChange={handleChange}
          />

          <label style={{ marginLeft: "8px" }}>
            {t("AddSpirometryScanUpload.fields.contrastUsed.label")}
          </label>
        </div>

        {/* FILES SECTION */}
        <div className="form-group">
          <label>{t("AddSpirometryScanUpload.fields.files.label")}</label>

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
              📁 {t("AddSpirometryScanUpload.fields.files.choose")}
            </button>

            <span style={{ fontSize: "0.9em", color: "#555" }}>
              {formData.files.length > 0
                ? t("AddSpirometryScanUpload.fields.files.selected", {
                    count: formData.files.length,
                  })
                : t("AddSpirometryScanUpload.fields.files.noFiles")}
            </span>
          </div>

          <input
            id="customFileInput"
            type="file"
            multiple
            accept="image/*,application/pdf,video/*,audio/*"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          {formData.files.length > 0 && (
            <ul style={{ paddingLeft: "20px" }}>
              {formData.files.map((file, index) => {
                const size = (file.size / (1024 * 1024)).toFixed(2);
                const ext = file.name.split(".").pop().toUpperCase();

                let typeLabel = "";
                if (file.type.startsWith("image/"))
                  typeLabel = t("AddSpirometryScanUpload.files.image");
                else if (file.type === "application/pdf")
                  typeLabel = t("AddSpirometryScanUpload.files.pdf");
                else if (file.type.startsWith("video/"))
                  typeLabel = t("AddSpirometryScanUpload.files.video");
                else if (file.type.startsWith("audio/"))
                  typeLabel = t("AddSpirometryScanUpload.files.audio");
                else typeLabel = t("AddSpirometryScanUpload.files.file");

                return (
                  <li key={index} style={{ fontSize: "0.9em" }}>
                    📎 <strong>{file.name}</strong>
                    <br />
                    <span style={{ color: "#555" }}>
                      {typeLabel} ({ext}) — {size} MB
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
            ? t("AddSpirometryScanUpload.buttons.loading")
            : t("AddSpirometryScanUpload.buttons.submit")}
        </button>
      </form>
    </div>
  );
}
