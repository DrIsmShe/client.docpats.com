import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Modal from "react-modal";
import { FileText, FileEdit, Stethoscope, ListChecks } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
Modal.setAppElement("#root");

export default function AddAngiographyScanUpload() {
  const { patientId, patientModel } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation("Examinations");
  const [warning, setWarning] = useState("");
  const location = useLocation();
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
        const [nameofexamRes, reportRes, diagnosisRes, recomandationRes] =
          await Promise.all([
            axios.get(
              `${API_BASE}/clinic/get-templates-examinations/Angiographyscaner/nameofexam/${patientId}`,
              { withCredentials: true },
            ),
            axios.get(
              `${API_BASE}/clinic/get-templates-examinations/Angiographyscaner/report/${patientId}`,
              { withCredentials: true },
            ),
            axios.get(
              `${API_BASE}/clinic/get-templates-examinations/Angiographyscaner/diagnosis/${patientId}`,
              { withCredentials: true },
            ),
            axios.get(
              `${API_BASE}/clinic/get-templates-examinations/Angiographyscaner/recomandation/${patientId}`,
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
        console.error("Template load error:", error);
      }
    };

    fetchTemplates();
  }, [API_BASE, patientId]);

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
      alert(`❌ ${t("addAngiographyScanUpload.messages.patientMissing")}`);
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
        `${API_BASE}/clinic/add-examinations/add-angiography-scan/${patientId}`,
        data,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        },
      );
      const scan = response.data.data;
      setMessage(t("addAngiographyScanUpload.messages.success"));
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
      const backendKey = error.response?.data?.messageKey;
      setMessage(
        backendKey
          ? t(backendKey)
          : `${t("AddEEGScanUpload.messages.errorPrefix")} ${
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
        📋 {t("addAngiographyScanUpload.templates.use")}
      </button>

      <Link
        to={createPath}
        className="btn btn-sm btn-success me-2"
        style={{ marginBottom: "10px" }}
      >
        ➕ {t("addAngiographyScanUpload.templates.new")}
      </Link>

      <Link
        to={listPath}
        className="btn btn-sm btn-info"
        style={{ marginBottom: "10px" }}
      >
        📂 {t("addAngiographyScanUpload.templates.list")}
      </Link>
    </>
  );

  const getFieldLabel = (field) => {
    return t(`addAngiographyScanUpload.fields.${field}.label`);
  };

  const renderTemplateModal = (field) => (
    <Modal
      isOpen={modalState[field]}
      onRequestClose={() => closeModal(field)}
      contentLabel={t("addAngiographyScanUpload.templates.modal.title", {
        field: getFieldLabel(field),
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
        {t("addAngiographyScanUpload.templates.modal.title", {
          field: getFieldLabel(field),
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
              ➕ {t("addAngiographyScanUpload.templates.modal.insert")}
            </button>
          </li>
        ))}
      </ul>

      <button className="btn btn-secondary" onClick={() => closeModal(field)}>
        {t("addAngiographyScanUpload.templates.modal.close")}
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
        {t("addAngiographyScanUpload.page.title")}
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
        {/* NAME OF EXAM */}
        <div className="form-group">
          <label>
            <FileText /> {t("addAngiographyScanUpload.fields.nameofexam.label")}
            <div className="float-end">
              {renderTemplateButton(
                "nameofexam",
                "/dp/add-angiography-scan-template-nameofexam",
                `/dp/list-angiography-scan-template-nameofexam/${patientId}`,
              )}
            </div>
          </label>

          <textarea
            className="form-control"
            name="nameofexam"
            value={formData.nameofexam}
            onChange={handleChange}
            style={{ marginBottom: "10px" }}
            required
            placeholder={t(
              "addAngiographyScanUpload.fields.nameofexam.placeholder",
            )}
          />

          {renderTemplateModal("nameofexam")}
        </div>

        {/* REPORT */}
        <div className="form-group">
          <label>
            <FileEdit /> {t("addAngiographyScanUpload.fields.report.label")}
            <div className="float-end">
              {renderTemplateButton(
                "report",
                "/dp/add-angiography-scan-template-report",
                `/dp/list-angiography-scan-template-report/${patientId}`,
              )}
            </div>
          </label>

          <textarea
            className="form-control"
            name="report"
            value={formData.report}
            onChange={handleChange}
            style={{ marginBottom: "10px", height: "300px" }}
            placeholder={t(
              "addAngiographyScanUpload.fields.report.placeholder",
            )}
          />

          {renderTemplateModal("report")}
        </div>

        {/* DIAGNOSIS */}
        <div className="form-group">
          <label>
            <Stethoscope />{" "}
            {t("addAngiographyScanUpload.fields.diagnosis.label")}
            <div className="float-end">
              {renderTemplateButton(
                "diagnosis",
                "/dp/add-angiography-scan-template-diagnosis",
                `/dp/list-angiography-scan-template-diagnosis/${patientId}`,
              )}
            </div>
          </label>

          <textarea
            className="form-control"
            name="diagnosis"
            value={formData.diagnosis}
            onChange={handleChange}
            style={{ marginBottom: "10px" }}
            required
            placeholder={t(
              "addAngiographyScanUpload.fields.diagnosis.placeholder",
            )}
          />

          {renderTemplateModal("diagnosis")}
        </div>

        {/* RECOMMENDATION */}
        <div className="form-group">
          <label>
            <ListChecks />{" "}
            {t("addAngiographyScanUpload.fields.recomandation.label")}
            <div className="float-end">
              {renderTemplateButton(
                "recomandation",
                "/dp/add-angiography-scan-template-recomandation",
                `/dp/list-angiography-scan-template-recomandation/${patientId}`,
              )}
            </div>
          </label>

          <textarea
            className="form-control"
            name="recomandation"
            value={formData.recomandation}
            onChange={handleChange}
            style={{ marginBottom: "10px" }}
            placeholder={t(
              "addAngiographyScanUpload.fields.recomandation.placeholder",
            )}
          />

          {renderTemplateModal("recomandation")}
        </div>

        {/* RADIATION */}
        <div className="form-group">
          <label>
            {t("addAngiographyScanUpload.fields.radiationDose.label")}
          </label>

          <input
            type="number"
            className="form-control"
            name="radiationDose"
            value={formData.radiationDose}
            onChange={handleChange}
            placeholder={t(
              "addAngiographyScanUpload.fields.radiationDose.placeholder",
            )}
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
            {t("addAngiographyScanUpload.fields.contrastUsed.label")}
          </label>
        </div>

        {/* FILES */}
        <div className="form-group">
          <label>{t("addAngiographyScanUpload.fields.files.label")}</label>

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
              📁 {t("addAngiographyScanUpload.fields.files.choose")}
            </button>

            <span style={{ fontSize: "0.9em", color: "#555" }}>
              {formData.files.length > 0
                ? t("addAngiographyScanUpload.fields.files.selected", {
                    count: formData.files.length,
                  })
                : t("addAngiographyScanUpload.fields.files.noneSelected")}
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
                const ext = file.name.split(".").pop().toUpperCase();
                const size = (file.size / 1024 / 1024).toFixed(2);
                const type = file.type;

                let key = "other";
                if (type.startsWith("image/")) key = "image";
                else if (type === "application/pdf") key = "pdf";
                else if (type.startsWith("video/")) key = "video";
                else if (type.startsWith("audio/")) key = "audio";

                return (
                  <li key={index} style={{ marginBottom: "8px" }}>
                    📎 <strong>{file.name}</strong>
                    <br />
                    <span style={{ color: "#555" }}>
                      {t("addAngiographyScanUpload.fields.files.details.type")}:{" "}
                      {t(
                        `addAngiographyScanUpload.fields.files.typeDescription.${key}`,
                      )}{" "}
                      ({ext}) |{" "}
                      {t("addAngiographyScanUpload.fields.files.details.size")}:{" "}
                      {size} MB
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <button
          className="btn btn-primary"
          style={{ width: "100%", marginTop: "15px" }}
          disabled={loading}
          type="submit"
        >
          {loading
            ? t("addAngiographyScanUpload.buttons.loading")
            : t("addAngiographyScanUpload.buttons.submit")}
        </button>
      </form>
    </div>
  );
}
