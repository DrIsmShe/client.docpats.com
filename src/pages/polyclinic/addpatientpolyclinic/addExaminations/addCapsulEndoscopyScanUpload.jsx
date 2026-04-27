import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Modal from "react-modal";
import { FileText, FileEdit, Stethoscope, ListChecks } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
Modal.setAppElement("#root");

export default function AddCapsulEndoscopyScanUpload() {
  const { patientId, patientModel } = useParams();
  const navigate = useNavigate();
  const [warning, setWarning] = useState("");
  const location = useLocation();
  const { t } = useTranslation("Examinations");
  const prefix = "AddCapsulEndoscopyScanUpload";

  const [formData, setFormData] = useState({
    nameofexam: "",
    diagnosis: "",
    report: "",
    recomandation: "",
    radiationDose: "",
    contrastUsed: false,
    files: [],
  });

  const API_BASE = process.env.REACT_APP_API_URL;
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

  useEffect(() => {
    if (!patientId) return;
    const fetchTemplates = async () => {
      try {
        const [nameRes, reportRes, diagRes, recRes] = await Promise.all([
          axios.get(
            `${API_BASE}/clinic/get-templates-examinations/CapsuleEndoscopyscaner/nameofexam/${patientId}`,
            { withCredentials: true },
          ),
          axios.get(
            `${API_BASE}/clinic/get-templates-examinations/CapsuleEndoscopyscaner/report/${patientId}`,
            { withCredentials: true },
          ),
          axios.get(
            `${API_BASE}/clinic/get-templates-examinations/CapsuleEndoscopyscaner/diagnosis/${patientId}`,
            { withCredentials: true },
          ),
          axios.get(
            `${API_BASE}/clinic/get-templates-examinations/CapsuleEndoscopyscaner/recomandation/${patientId}`,
            { withCredentials: true },
          ),
        ]);

        setTemplates({
          nameofexam: nameRes.data,
          report: reportRes.data,
          diagnosis: diagRes.data,
          recomandation: recRes.data,
        });
      } catch (err) {
        console.error("Template load error:", err);
      }
    };

    fetchTemplates();
  }, [API_BASE, patientId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, files: Array.from(e.target.files) });
  };

  const openModal = (field) =>
    setModalState((prev) => ({ ...prev, [field]: true }));
  const closeModal = (field) =>
    setModalState((prev) => ({ ...prev, [field]: false }));

  const insertTemplate = (field, content) => {
    setFormData((prev) => ({ ...prev, [field]: content }));
    closeModal(field);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!patientId) {
      alert("❌ " + t(`${prefix}.messages.patientMissing`));
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
        `${API_BASE}/clinic/add-examinations/add-CapsuleEndoscopy-scan/${patientId}`,
        data,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        },
      );
      const scan = response.data.data;
      setMessage(t(`${prefix}.messages.success`));
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
      const errMsg = error.response?.data?.message || error.message;
      setMessage(`${t(`${prefix}.messages.errorPrefix`)} ${errMsg}`);
    }

    setLoading(false);
  };

  const renderTemplateButton = (field, createPath, listPath) => (
    <>
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary me-2"
        style={{ marginBottom: "10px" }}
        onClick={() => openModal(field)}
      >
        📋 {t(`${prefix}.templates.use`)}
      </button>

      <Link
        to={createPath}
        className="btn btn-sm btn-success me-2"
        style={{ marginBottom: "10px" }}
      >
        ➕ {t(`${prefix}.templates.new`)}
      </Link>

      <Link
        to={listPath}
        className="btn btn-sm btn-info"
        style={{ marginBottom: "10px" }}
      >
        📂 {t(`${prefix}.templates.list`)}
      </Link>
    </>
  );

  const fieldLabel = (field) => t(`${prefix}.fields.${field}.label`);

  const renderTemplateModal = (field) => (
    <Modal
      isOpen={modalState[field]}
      onRequestClose={() => closeModal(field)}
      contentLabel={t(`${prefix}.templates.modal.title`, {
        field: fieldLabel(field),
      })}
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
        {t(`${prefix}.templates.modal.title`, {
          field: fieldLabel(field),
        })}
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
              ➕ {t(`${prefix}.templates.modal.insert`)}
            </button>
          </li>
        ))}
      </ul>

      <button className="btn btn-secondary" onClick={() => closeModal(field)}>
        {t(`${prefix}.templates.modal.close`)}
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
        {t(`${prefix}.page.title`)}
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
        {/* nameofexam */}
        <div className="form-group">
          <label>
            <FileText /> {fieldLabel("nameofexam")}
            <div className="float-end">
              {renderTemplateButton(
                "nameofexam",
                "/dp/add-capsule-endoscopy-scan-template-nameofexam",
                `/dp/list-capsule-endoscopy-scan-template-nameofexam/${patientId}`,
              )}
            </div>
          </label>
          <textarea
            name="nameofexam"
            value={formData.nameofexam}
            onChange={handleChange}
            className="form-control"
            style={{ marginBottom: "10px" }}
            required
            placeholder={t(`${prefix}.fields.nameofexam.placeholder`)}
          />
          {renderTemplateModal("nameofexam")}
        </div>

        {/* report */}
        <div className="form-group">
          <label>
            <FileEdit /> {fieldLabel("report")}
            <div className="float-end">
              {renderTemplateButton(
                "report",
                "/dp/add-capsule-endoscopy-scan-template-report",
                `/dp/list-capsule-endoscopy-scan-template-report/${patientId}`,
              )}
            </div>
          </label>
          <textarea
            name="report"
            value={formData.report}
            onChange={handleChange}
            className="form-control"
            style={{ marginBottom: "10px", height: "300px" }}
            placeholder={t(`${prefix}.fields.report.placeholder`)}
          />
          {renderTemplateModal("report")}
        </div>

        {/* diagnosis */}
        <div className="form-group">
          <label>
            <Stethoscope /> {fieldLabel("diagnosis")}
            <div className="float-end">
              {renderTemplateButton(
                "diagnosis",
                "/dp/add-capsule-endoscopy-scan-template-diagnosis",
                `/dp/list-capsule-endoscopy-scan-template-diagnosis/${patientId}`,
              )}
            </div>
          </label>
          <textarea
            name="diagnosis"
            value={formData.diagnosis}
            onChange={handleChange}
            className="form-control"
            style={{ marginBottom: "10px" }}
            required
            placeholder={t(`${prefix}.fields.diagnosis.placeholder`)}
          />
          {renderTemplateModal("diagnosis")}
        </div>

        {/* recomandation */}
        <div className="form-group">
          <label>
            <ListChecks /> {fieldLabel("recomandation")}
            <div className="float-end">
              {renderTemplateButton(
                "recomandation",
                "/dp/add-capsule-endoscopy-scan-template-recomandation",
                `/dp/list-capsule-endoscopy-scan-template-recomandation/${patientId}`,
              )}
            </div>
          </label>
          <textarea
            name="recomandation"
            value={formData.recomandation}
            onChange={handleChange}
            className="form-control"
            style={{ marginBottom: "10px" }}
            placeholder={t(`${prefix}.fields.recomandation.placeholder`)}
          />
          {renderTemplateModal("recomandation")}
        </div>

        {/* RADIATION */}
        <div className="form-group">
          <label>{fieldLabel("radiationDose")}</label>
          <input
            type="number"
            name="radiationDose"
            value={formData.radiationDose}
            onChange={handleChange}
            className="form-control"
            placeholder={t(`${prefix}.fields.radiationDose.placeholder`)}
          />
        </div>

        {/* CONTRAST */}
        <div className="form-group" style={{ marginBottom: "20px" }}>
          <input
            type="checkbox"
            name="contrastUsed"
            checked={formData.contrastUsed}
            onChange={handleChange}
          />
          <label style={{ marginLeft: "8px" }}>
            {fieldLabel("contrastUsed")}
          </label>
        </div>

        {/* FILES */}
        <div className="form-group">
          <label>{fieldLabel("files")}</label>

          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "10px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <button
              type="button"
              className="btn btn-outline_primary"
              onClick={() =>
                document.getElementById("fileInputCapsule").click()
              }
            >
              📁 {t(`${prefix}.fields.files.choose`)}
            </button>

            <span style={{ fontSize: "0.9em", color: "#555" }}>
              {formData.files.length
                ? t(`${prefix}.fields.files.selected`, {
                    count: formData.files.length,
                  })
                : t(`${prefix}.fields.files.noneSelected`)}
            </span>
          </div>

          <input
            id="fileInputCapsule"
            type="file"
            multiple
            style={{ display: "none" }}
            onChange={handleFileChange}
            accept="image/*,application/pdf,video/*,audio/*"
          />

          {formData.files.length > 0 && (
            <ul style={{ paddingLeft: "20px" }}>
              {formData.files.map((file, index) => {
                const size = (file.size / 1024 / 1024).toFixed(2);
                const ext = file.name.split(".").pop().toUpperCase();

                let typeKey = "other";
                if (file.type.startsWith("image/")) typeKey = "image";
                else if (file.type === "application/pdf") typeKey = "pdf";
                else if (file.type.startsWith("video/")) typeKey = "video";
                else if (file.type.startsWith("audio/")) typeKey = "audio";

                return (
                  <li key={index} style={{ marginBottom: "8px" }}>
                    📎 <strong>{file.name}</strong>
                    <br />
                    <span style={{ color: "#555" }}>
                      {t(`${prefix}.fields.files.details.type`)}:{" "}
                      {t(`${prefix}.fields.files.typeDescription.${typeKey}`)} (
                      {ext}) | {t(`${prefix}.fields.files.details.size`)}:{" "}
                      {size} MB
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* BUTTON SUBMIT */}
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
          style={{ width: "100%", marginTop: "15px" }}
        >
          {loading
            ? t(`${prefix}.buttons.loading`)
            : t(`${prefix}.buttons.submit`)}
        </button>
      </form>
    </div>
  );
}
