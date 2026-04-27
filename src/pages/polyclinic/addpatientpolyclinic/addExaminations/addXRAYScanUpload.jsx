import { useEffect, useState } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import axios from "axios";
import Modal from "react-modal";
import { FileText, FileEdit, Stethoscope, ListChecks } from "lucide-react";
import { useTranslation } from "react-i18next";

Modal.setAppElement("#root");

export default function AddXRAYScanUpload() {
  const { t } = useTranslation("Examinations");
  const { patientId } = useParams();
  const navigate = useNavigate();
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
              `${API_BASE}/clinic/get-templates-examinations/XRAYscaner/nameofexam/${patientId}`,
              { withCredentials: true },
            ),
            axios.get(
              `${API_BASE}/clinic/get-templates-examinations/XRAYscaner/report/${patientId}`,
              { withCredentials: true },
            ),
            axios.get(
              `${API_BASE}/clinic/get-templates-examinations/XRAYscaner/diagnosis/${patientId}`,
              { withCredentials: true },
            ),
            axios.get(
              `${API_BASE}/clinic/get-templates-examinations/XRAYscaner/recomandation/${patientId}`,
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

    if (patientId) {
      fetchTemplates();
    }
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
      alert(t("AddXRAYScanUpload.messages.noPatientId"));
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
        `${API_BASE}/clinic/add-examinations/add-xray-scan/${patientId}`,
        data,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        },
      );
      const scan = response.data.data;
      setMessage(t("AddXRAYScanUpload.messages.success"));

      const modelFromServer = response.data?.data?.patientModel;

      navigate(
        modelFromServer === "DoctorPrivatePatient"
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
        `${t("AddXRAYScanUpload.messages.error")}: ${
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
        📋 {t("AddXRAYScanUpload.buttons.useTemplate")}
      </button>

      <Link
        to={createPath}
        className="btn btn-sm btn-success me-2"
        style={{ marginBottom: "10px" }}
      >
        ➕ {t("AddXRAYScanUpload.buttons.newTemplate")}
      </Link>

      <Link
        to={listPath}
        className="btn btn-sm btn-info"
        style={{ marginBottom: "10px" }}
      >
        📂 {t("AddXRAYScanUpload.buttons.listTemplates")}
      </Link>
    </>
  );

  const renderTemplateModal = (field) => (
    <Modal
      isOpen={modalState[field]}
      onRequestClose={() => closeModal(field)}
      contentLabel={t("AddXRAYScanUpload.modal.title")}
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
        {t("AddXRAYScanUpload.modal.select")} "{field}"
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
              ➕ {t("AddXRAYScanUpload.buttons.insert")}
            </button>
          </li>
        ))}
      </ul>

      <button onClick={() => closeModal(field)} className="btn btn-secondary">
        {t("AddXRAYScanUpload.buttons.close")}
      </button>
    </Modal>
  );

  const fileTypeLabel = (file) => {
    if (file.type.startsWith("image/"))
      return t("AddXRAYScanUpload.files.image");
    if (file.type === "application/pdf")
      return t("AddXRAYScanUpload.files.pdf");
    if (file.type.startsWith("video/"))
      return t("AddXRAYScanUpload.files.video");
    if (file.type.startsWith("audio/"))
      return t("AddXRAYScanUpload.files.audio");
    return t("AddXRAYScanUpload.files.file");
  };

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
        {t("AddXRAYScanUpload.page.title")}
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
            <FileText /> {t("AddXRAYScanUpload.fields.nameofexam.label")} &nbsp;
            <div className="float-end">
              {renderTemplateButton(
                "nameofexam",
                "/dp/add-xray-scan-template-nameofexam",
                `/dp/list-xray-scan-template-nameofexam/${patientId}`,
              )}
            </div>
          </label>

          <textarea
            style={{ marginBottom: "10px" }}
            name="nameofexam"
            value={formData.nameofexam}
            onChange={handleChange}
            placeholder={t("AddXRAYScanUpload.fields.nameofexam.placeholder")}
            className="form-control"
            required
          />

          {renderTemplateModal("nameofexam")}
        </div>

        {/* REPORT */}
        <div className="form-group">
          <label>
            <FileEdit /> {t("AddXRAYScanUpload.fields.report.label")} &nbsp;
            <div className="float-end">
              {renderTemplateButton(
                "report",
                "/dp/add-xray-scan-template-report",
                `/dp/list-xray-scan-template-report/${patientId}`,
              )}
            </div>
          </label>

          <textarea
            style={{ marginBottom: "10px", height: "300px" }}
            name="report"
            value={formData.report}
            placeholder={t("AddXRAYScanUpload.fields.report.placeholder")}
            onChange={handleChange}
            className="form-control"
          />

          {renderTemplateModal("report")}
        </div>

        {/* DIAGNOSIS */}
        <div className="form-group">
          <label>
            <Stethoscope /> {t("AddXRAYScanUpload.fields.diagnosis.label")}{" "}
            &nbsp;
            <div className="float-end">
              {renderTemplateButton(
                "diagnosis",
                "/dp/add-xray-scan-template-diagnosis",
                `/dp/list-xray-scan-template-diagnosis/${patientId}`,
              )}
            </div>
          </label>

          <textarea
            style={{ marginBottom: "10px" }}
            name="diagnosis"
            value={formData.diagnosis}
            placeholder={t("AddXRAYScanUpload.fields.diagnosis.placeholder")}
            onChange={handleChange}
            className="form-control"
            required
          />

          {renderTemplateModal("diagnosis")}
        </div>

        {/* RECOMMENDATION */}
        <div className="form-group">
          <label>
            <ListChecks /> {t("AddXRAYScanUpload.fields.recomandation.label")}{" "}
            &nbsp;
            <div className="float-end">
              {renderTemplateButton(
                "recomandation",
                "/dp/add-xray-scan-template-recomandation",
                `/dp/list-xray-scan-template-recomandation/${patientId}`,
              )}
            </div>
          </label>

          <textarea
            style={{ marginBottom: "10px" }}
            name="recomandation"
            value={formData.recomandation}
            placeholder={t(
              "AddXRAYScanUpload.fields.recomandation.placeholder",
            )}
            onChange={handleChange}
            className="form-control"
          />

          {renderTemplateModal("recomandation")}
        </div>

        {/* RADIATION DOSE */}
        <div className="form-group">
          <label>{t("AddXRAYScanUpload.fields.radiationDose.label")}</label>

          <input
            type="number"
            name="radiationDose"
            value={formData.radiationDose}
            placeholder={t(
              "AddXRAYScanUpload.fields.radiationDose.placeholder",
            )}
            onChange={handleChange}
            className="form-control"
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
            {t("AddXRAYScanUpload.fields.contrastUsed.label")}
          </label>
        </div>

        {/* FILES */}
        <div className="form-group">
          <label>{t("AddXRAYScanUpload.fields.files.label")}</label>

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
              📁 {t("AddXRAYScanUpload.fields.files.choose")}
            </button>

            <span style={{ fontSize: "0.9em", color: "#555" }}>
              {formData.files.length > 0
                ? t("AddXRAYScanUpload.fields.files.selected", {
                    count: formData.files.length,
                  })
                : t("AddXRAYScanUpload.fields.files.noFiles")}
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

                return (
                  <li
                    key={index}
                    style={{ fontSize: "0.9em", marginBottom: "8px" }}
                  >
                    📎 <strong>{file.name}</strong>
                    <br />
                    <span style={{ color: "#555" }}>
                      {t("AddXRAYScanUpload.files.type")}: {fileTypeLabel(file)}{" "}
                      ({extension}) | {t("AddXRAYScanUpload.files.size")}:{" "}
                      {sizeInMB} MB
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
          style={{ width: "100%", marginTop: "15px" }}
        >
          {loading
            ? t("AddXRAYScanUpload.buttons.loading")
            : t("AddXRAYScanUpload.buttons.submit")}
        </button>
      </form>
    </div>
  );
}
