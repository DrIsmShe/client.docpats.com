import { useEffect, useState } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import axios from "axios";
import Modal from "react-modal";
import { FileText, FileEdit, Stethoscope, ListChecks } from "lucide-react";
import { useTranslation } from "react-i18next";

Modal.setAppElement("#root");

export default function AddSPECTScanUpload() {
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
    const fetchTemplates = async () => {
      try {
        const [nameofexamRes, reportRes, diagnosisRes, recomandationRes] =
          await Promise.all([
            axios.get(
              `${API_BASE}/clinic/get-templates-examinations/SPECTscaner/nameofexam/${patientId}`,
              { withCredentials: true },
            ),
            axios.get(
              `${API_BASE}/clinic/get-templates-examinations/SPECTscaner/report/${patientId}`,
              { withCredentials: true },
            ),
            axios.get(
              `${API_BASE}/clinic/get-templates-examinations/SPECTscaner/diagnosis/${patientId}`,
              { withCredentials: true },
            ),
            axios.get(
              `${API_BASE}/clinic/get-templates-examinations/SPECTscaner/recomandation/${patientId}`,
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
  }, []);

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
      alert(t("AddSPECTScanUpload.messages.patientMissing"));
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
        `${API_BASE}/clinic/add-examinations/add-spect-scan/${patientId}`,
        data,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        },
      );
      const scan = response.data.data;
      setMessage(t("AddSPECTScanUpload.messages.success"));

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
        `${t("AddSPECTScanUpload.messages.errorPrefix")} ${
          error.response?.data?.message || error.message
        }`,
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
        📋 {t("AddSPECTScanUpload.buttons.useTemplate")}
      </button>

      <Link
        to={createPath}
        className="btn btn-sm btn-success me-2"
        style={{ marginBottom: "10px" }}
      >
        ➕ {t("AddSPECTScanUpload.buttons.newTemplate")}
      </Link>

      <Link
        to={listPath}
        className="btn btn-sm btn-info"
        style={{ marginBottom: "10px" }}
      >
        📂 {t("AddSPECTScanUpload.buttons.listTemplates")}
      </Link>
    </>
  );

  const renderTemplateModal = (field) => (
    <Modal
      isOpen={modalState[field]}
      onRequestClose={() => closeModal(field)}
      contentLabel={t("AddSPECTScanUpload.modal.title")}
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
        {t("AddSPECTScanUpload.modal.select")} "{field}"
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
              ➕ {t("AddSPECTScanUpload.buttons.insert")}
            </button>
          </li>
        ))}
      </ul>

      <button onClick={() => closeModal(field)} className="btn btn-secondary">
        {t("AddSPECTScanUpload.buttons.close")}
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
        {t("AddSPECTScanUpload.page.title")}
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
        {/* NAMEOFEXAM */}
        <div className="form-group">
          <label>
            <FileText /> {t("AddSPECTScanUpload.fields.nameofexam.label")}
            <div className="float-end">
              {renderTemplateButton(
                "nameofexam",
                "/dp/add-spect-scan-template-nameofexam",
                `/dp/list-spect-scan-template-nameofexam/${patientId}`,
              )}
            </div>
          </label>

          <textarea
            style={{ marginBottom: "10px" }}
            name="nameofexam"
            value={formData.nameofexam}
            onChange={handleChange}
            className="form-control"
            placeholder={t("AddSPECTScanUpload.fields.nameofexam.placeholder")}
            required
          />

          {renderTemplateModal("nameofexam")}
        </div>

        {/* REPORT */}
        <div className="form-group">
          <label>
            <FileEdit /> {t("AddSPECTScanUpload.fields.report.label")}
            <div className="float-end">
              {renderTemplateButton(
                "report",
                "/dp/add-spect-scan-template-report",
                `/dp/list-spect-scan-template-report/${patientId}`,
              )}
            </div>
          </label>

          <textarea
            style={{ marginBottom: "10px", height: "300px" }}
            name="report"
            value={formData.report}
            onChange={handleChange}
            className="form-control"
            placeholder={t("AddSPECTScanUpload.fields.report.placeholder")}
          />

          {renderTemplateModal("report")}
        </div>

        {/* DIAGNOSIS */}
        <div className="form-group">
          <label>
            <Stethoscope /> {t("AddSPECTScanUpload.fields.diagnosis.label")}
            <div className="float-end">
              {renderTemplateButton(
                "diagnosis",
                "/dp/add-spect-scan-template-diagnosis",
                `/dp/list-spect-scan-template-diagnosis/${patientId}`,
              )}
            </div>
          </label>

          <textarea
            style={{ marginBottom: "10px" }}
            name="diagnosis"
            value={formData.diagnosis}
            onChange={handleChange}
            className="form-control"
            placeholder={t("AddSPECTScanUpload.fields.diagnosis.placeholder")}
            required
          />

          {renderTemplateModal("diagnosis")}
        </div>

        {/* RECOMMENDATION */}
        <div className="form-group">
          <label>
            <ListChecks /> {t("AddSPECTScanUpload.fields.recomandation.label")}
            <div className="float-end">
              {renderTemplateButton(
                "recomandation",
                "/dp/add-spect-scan-template-recomandation",
                `/dp/list-spect-scan-template-recomandation/${patientId}`,
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
              "AddSPECTScanUpload.fields.recomandation.placeholder",
            )}
          />

          {renderTemplateModal("recomandation")}
        </div>

        {/* RADIATION DOSE */}
        <div className="form-group">
          <label>{t("AddSPECTScanUpload.fields.radiationDose.label")}</label>

          <input
            type="number"
            name="radiationDose"
            value={formData.radiationDose}
            onChange={handleChange}
            className="form-control"
            placeholder={t(
              "AddSPECTScanUpload.fields.radiationDose.placeholder",
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
            {t("AddSPECTScanUpload.fields.contrastUsed.label")}
          </label>
        </div>

        {/* FILES */}
        <div className="form-group">
          <label>{t("AddSPECTScanUpload.fields.files.label")}</label>

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
              📁 {t("AddSPECTScanUpload.fields.files.choose")}
            </button>

            <span style={{ fontSize: "0.9em", color: "#555" }}>
              {formData.files.length > 0
                ? t("AddSPECTScanUpload.fields.files.selected", {
                    count: formData.files.length,
                  })
                : t("AddSPECTScanUpload.fields.files.noFiles")}
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

                let description = "";

                if (type.startsWith("image/"))
                  description = t("AddSPECTScanUpload.files.image");
                else if (type === "application/pdf")
                  description = t("AddSPECTScanUpload.files.pdf");
                else if (type.startsWith("video/"))
                  description = t("AddSPECTScanUpload.files.video");
                else if (type.startsWith("audio/"))
                  description = t("AddSPECTScanUpload.files.audio");
                else description = t("AddSPECTScanUpload.files.file");

                return (
                  <li
                    key={index}
                    style={{ fontSize: "0.9em", marginBottom: "8px" }}
                  >
                    📎 <strong>{file.name}</strong>
                    <br />
                    <span style={{ color: "#555" }}>
                      {description} ({extension}) — {sizeInMB} MB
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
            ? t("AddSPECTScanUpload.buttons.loading")
            : t("AddSPECTScanUpload.buttons.submit")}
        </button>
      </form>
    </div>
  );
}
