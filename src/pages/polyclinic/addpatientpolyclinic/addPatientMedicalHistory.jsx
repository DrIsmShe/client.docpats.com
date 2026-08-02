import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Modal from "react-modal";
import ICD10Autocomplete from "../../../components/ICD10Autocomplete";
import DictationPanel from "../../../components/dictation/DictationPanel";
import axios from "axios";
import { useTranslation } from "react-i18next";

Modal.setAppElement("#root");

/* ─────────────────────────── CSS ─────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Lora:wght@600;700&display=swap');

.amh-root {
  --teal:#0d6b5e; --teal-dark:#094d44; --teal-mid:#0f8a7a;
  --teal-pale:#e8f7f5; --teal-border:#a3ddd5; --teal-glow:rgba(13,107,94,.12);
  --bg:#eef2f6; --surface:#fff; --surface2:#f7f9fb;
  --border:#dde4ec; --ink:#1a2533; --ink2:#3d4f63; --ink3:#7089a6;
  --red:#c0392b; --red-pale:#fef2f2; --red-border:#fca5a5;
  --blue-pale:#e7f1ff; --blue-border:#b6d4fe;
  --sh:0 2px 12px rgba(10,30,60,.07),0 1px 3px rgba(10,30,60,.04);
  --sh-md:0 8px 32px rgba(10,30,60,.10),0 2px 8px rgba(10,30,60,.05);
  --tr:all .18s cubic-bezier(.4,0,.2,1);
  font-family:'DM Sans',system-ui,sans-serif;
  background:var(--bg); min-height:100vh; padding-bottom:64px;
}

/* ── HERO ── */
.amh-hero {
  background:linear-gradient(130deg,#094d44 0%,#0d6b5e 55%,#1a7a6e 100%);
  padding:32px 40px 88px; position:relative; overflow:hidden;
}
.amh-hero::before {
  content:''; position:absolute; inset:0; pointer-events:none;
  background:radial-gradient(ellipse 600px 300px at 110% 50%,rgba(20,184,166,.18) 0%,transparent 65%),
             radial-gradient(ellipse 300px 400px at -5% 130%,rgba(4,44,38,.5) 0%,transparent 55%);
}
.amh-hero::after {
  content:''; position:absolute; bottom:-1px; left:0; right:0;
  height:60px; background:var(--bg); clip-path:ellipse(54% 100% at 50% 100%);
}
.amh-hero-inner { position:relative; z-index:1; max-width:860px; }
.amh-hero-tag {
  display:inline-flex; align-items:center; gap:7px;
  font-size:9px; font-weight:600; letter-spacing:.15em; text-transform:uppercase;
  color:rgba(255,255,255,.75); background:rgba(255,255,255,.1);
  border:1px solid rgba(255,255,255,.2); padding:4px 13px; border-radius:100px;
  margin-bottom:14px; backdrop-filter:blur(6px);
}
.amh-hero-tag::before { content:''; width:5px; height:5px; background:#5ef4dd; border-radius:50%; }
.amh-hero-h1 {
  font-family:'Lora',Georgia,serif; font-size:clamp(20px,2.6vw,28px); font-weight:700;
  color:#fff; line-height:1.18; margin:0 0 8px; letter-spacing:-.01em;
}
.amh-hero-sub { font-size:13px; color:rgba(255,255,255,.55); margin:0; }

/* ── BODY ── */
.amh-body { max-width:1260px; margin:-52px auto 0; padding:0 24px; position:relative; z-index:2; }
@media(max-width:640px){ .amh-body { padding:0 12px; margin-top:-36px; } }

/* ── PROGRESS ── */
.amh-progress { display:flex; gap:6px; margin-bottom:20px; flex-wrap:wrap; }
.amh-prog-step {
  flex:1; min-width:60px; height:4px; border-radius:2px;
  background:var(--border); transition:var(--tr);
}
.amh-prog-step.done { background:var(--teal); }
.amh-prog-step.active { background:var(--teal-mid); box-shadow:0 0 8px rgba(13,107,94,.4); }

/* ── SECTION CARD ── */
.amh-section {
  background:var(--surface); border:1px solid var(--border);
  border-radius:16px; box-shadow:var(--sh); margin-bottom:14px;
  overflow:hidden; transition:var(--tr);
}
  .amh-section.has-overflow {
  overflow:visible;
}
.amh-section:focus-within { border-color:var(--teal-border); box-shadow:0 0 0 3px var(--teal-glow),var(--sh); }
.amh-section-head {
  display:flex; align-items:center; gap:12px;
  padding:14px 20px; background:var(--surface2);
  border-bottom:1px solid var(--border);
}
.amh-section-icon {
  width:32px; height:32px; border-radius:8px; flex-shrink:0;
  background:var(--teal-pale); border:1px solid var(--teal-border);
  display:flex; align-items:center; justify-content:center; font-size:15px;
}
.amh-section-label {
  font-family:'Lora',Georgia,serif; font-size:14px; font-weight:700; color:var(--ink); flex:1;
}
.amh-req-badge {
  font-size:9px; font-weight:700; letter-spacing:.1em; text-transform:uppercase;
  color:var(--teal); background:var(--teal-pale); border:1px solid var(--teal-border);
  padding:2px 8px; border-radius:100px;
}
.amh-section-body { padding:16px 20px 20px; }

/* ── TEXTAREA ── */
.amh-textarea {
  width:100%; background:var(--surface2); border:1.5px solid var(--border);
  border-radius:10px; font-family:'DM Sans',sans-serif; font-size:13px;
  color:var(--ink); transition:var(--tr); outline:none;
  min-height:140px; padding:12px 14px; resize:vertical; line-height:1.65;
}
.amh-textarea:focus { border-color:var(--teal-mid); box-shadow:0 0 0 3px rgba(13,107,94,.1); background:#fff; }
.amh-textarea::placeholder { color:var(--ink3); }

/* ── INPUT ── */
.amh-input {
  width:100%; background:var(--surface2); border:1.5px solid var(--border);
  border-radius:10px; font-family:'DM Sans',sans-serif; font-size:13px;
  color:var(--ink); transition:var(--tr); outline:none;
  height:52px; padding:0 14px;
}
.amh-input:focus { border-color:var(--teal-mid); box-shadow:0 0 0 3px rgba(13,107,94,.1); background:#fff; }
.amh-input::placeholder { color:var(--ink3); }

/* ── ERROR ── */
.amh-field-error { font-size:11px; color:var(--red); margin-top:5px; display:flex; align-items:center; gap:4px; }

/* ── TEMPLATE BLOCK ── */
.amh-tmpl { margin-top:12px; padding:12px 14px; background:var(--blue-pale); border:1px solid var(--blue-border); border-radius:10px; }
.amh-tmpl-select {
  width:100%; background:#fff; border:1.5px solid var(--blue-border);
  border-radius:8px; font-family:'DM Sans',sans-serif; font-size:12px;
  color:var(--ink2); padding:8px 12px; outline:none; transition:var(--tr);
  margin-bottom:8px; cursor:pointer;
  appearance:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%237089a6' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat:no-repeat; background-position:right 12px center; padding-right:32px;
}
.amh-tmpl-select:focus { border-color:var(--teal-border); box-shadow:0 0 0 3px var(--teal-glow); }
.amh-tmpl-btns { display:flex; gap:6px; margin-bottom:8px; }
.amh-tmpl-btn {
  flex:1; padding:7px 12px; border-radius:8px; font-family:'DM Sans',sans-serif;
  font-size:11px; font-weight:600; cursor:pointer; transition:var(--tr); border:1.5px solid;
}
.amh-tmpl-btn:disabled { opacity:.45; cursor:not-allowed; }
.amh-tmpl-btn.preview {
  background:#fff; color:var(--ink2); border-color:var(--border);
}
.amh-tmpl-btn.preview:hover:not(:disabled) { background:var(--surface2); border-color:var(--teal-border); color:var(--teal); }
.amh-tmpl-btn.insert {
  background:var(--teal-pale); color:var(--teal); border-color:var(--teal-border);
}
.amh-tmpl-btn.insert:hover:not(:disabled) { background:var(--teal); color:#fff; box-shadow:0 2px 10px rgba(13,107,94,.25); }
.amh-tmpl-nav { display:flex; gap:6px; }
.amh-tmpl-nav-btn {
  flex:1; padding:6px 10px; border-radius:8px; font-family:'DM Sans',sans-serif;
  font-size:11px; font-weight:600; text-decoration:none; text-align:center;
  transition:var(--tr); border:1.5px solid; display:inline-flex; align-items:center; justify-content:center; gap:4px;
}
.amh-tmpl-nav-btn.list { background:#fff; color:var(--ink2); border-color:var(--blue-border); }
.amh-tmpl-nav-btn.list:hover { background:var(--blue-pale); color:var(--ink); text-decoration:none; }
.amh-tmpl-nav-btn.create { background:var(--teal-pale); color:var(--teal); border-color:var(--teal-border); }
.amh-tmpl-nav-btn.create:hover { background:var(--teal); color:#fff; text-decoration:none; }

/* ── DIAGNOSIS ── */
.amh-diagnosis-wrap { position:relative; }
.amh-diagnosis-hint { font-size:11px; color:var(--ink3); margin-top:5px; }

/* ── SUBMIT ── */
.amh-footer { padding-top:8px; display:flex; justify-content:center; }
.amh-submit {
  display:inline-flex; align-items:center; gap:9px;
  padding:14px 52px; border:none; border-radius:100px;
  font-family:'DM Sans',sans-serif; font-size:15px; font-weight:600;
  color:#fff; cursor:pointer; transition:var(--tr); letter-spacing:.02em;
  background:linear-gradient(135deg,var(--teal) 0%,var(--teal-mid) 100%);
  box-shadow:0 4px 20px rgba(13,107,94,.32);
}
.amh-submit:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(13,107,94,.42); }

/* ── LOADING ── */
.amh-loading { display:flex; align-items:center; justify-content:center; min-height:40vh; gap:12px; font-size:13px; color:var(--ink3); }
.amh-loading-spin { width:24px; height:24px; border:2.5px solid var(--teal-pale); border-top-color:var(--teal); border-radius:50%; animation:amhSpin .7s linear infinite; }
@keyframes amhSpin { to{transform:rotate(360deg)} }

/* ── MODAL ── */
.amh-modal-overlay {
  position:fixed; inset:0; background:rgba(10,20,40,.55);
  backdrop-filter:blur(4px); z-index:9999;
  display:flex; align-items:center; justify-content:center; padding:24px;
}
.amh-modal {
  background:var(--surface); border-radius:18px; box-shadow:0 24px 80px rgba(10,30,60,.22);
  width:100%; max-width:580px; overflow:hidden;
  animation:amhModalIn .22s cubic-bezier(.34,1.3,.64,1);
}
@keyframes amhModalIn { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:none} }
.amh-modal-head {
  padding:18px 24px 14px; background:var(--surface2); border-bottom:1px solid var(--border);
  display:flex; align-items:center; gap:10px;
}
.amh-modal-title { font-family:'Lora',Georgia,serif; font-size:16px; font-weight:700; color:var(--ink); flex:1; }
.amh-modal-close {
  width:28px; height:28px; border-radius:50%; border:none; background:var(--border);
  color:var(--ink2); cursor:pointer; font-size:14px; display:flex; align-items:center; justify-content:center;
  transition:var(--tr);
}
.amh-modal-close:hover { background:var(--red-pale); color:var(--red); }
.amh-modal-body { padding:20px 24px; max-height:60vh; overflow-y:auto; }
.amh-modal-content { font-size:13px; color:var(--ink2); line-height:1.7; white-space:pre-wrap; }
.amh-modal-footer { padding:14px 24px 18px; border-top:1px solid var(--border); display:flex; gap:8px; justify-content:flex-end; }
.amh-modal-btn {
  padding:9px 20px; border-radius:100px; font-family:'DM Sans',sans-serif;
  font-size:13px; font-weight:600; cursor:pointer; transition:var(--tr); border:1.5px solid;
}
.amh-modal-btn.primary { background:var(--teal); color:#fff; border-color:var(--teal); box-shadow:0 2px 10px rgba(13,107,94,.25); }
.amh-modal-btn.primary:hover { background:var(--teal-dark); }
.amh-modal-btn.cancel { background:var(--surface2); color:var(--ink2); border-color:var(--border); }
.amh-modal-btn.cancel:hover { background:var(--border); }
`;

/* ─────────────────────── SUB-COMPONENTS ─────────────────────── */

const SectionBlock = ({ icon, label, required, children, allowOverflow }) => (
  <div className={`amh-section${allowOverflow ? " has-overflow" : ""}`}>
    <div className="amh-section-head">
      <div className="amh-section-icon">{icon}</div>
      <span className="amh-section-label">{label}</span>
      {required && <span className="amh-req-badge">Required</span>}
    </div>
    <div className="amh-section-body">{children}</div>
  </div>
);

const FieldError = ({ msg }) =>
  msg ? <div className="amh-field-error">⚠ {msg}</div> : null;

export default function AddPatientMedicalHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    patientId: id,
    doctorId: "",
    complaints: "",
    anamnesisMorbi: "",
    anamnesisVitae: "",
    statusPreasens: "",
    statusLocalis: "",
    // ── Структурированный диагноз: МКБ-10 + текст на родном языке ──
    mainDiagnosis: {
      code: "",
      codeTitle: "",
      text: "",
    },
    additionalDiagnosis: "",
    recommendations: "",
    ctScanResults: "",
    mriResults: "",
    ultrasoundResults: "",
    laboratoryTestResults: "",
    immunization: "",
    allergies: "",
    familyHistoryOfDisease: "",
    chronicDiseases: "",
    isConsentGiven: false,
  });

  const [photo, setPhoto] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [errors, setErrors] = useState({});

  const [templates, setTemplates] = useState({
    complaints: [],
    anamnesisMorbi: [],
    anamnesisVitae: [],
    statusPreasens: [],
    statusLocalis: [],
    recommendations: [],
    mriResults: [],
    additionalDiagnosis: [],
    ultrasoundResults: [],
    laboratoryTestResults: [],
    ctScanResults: [],
  });
  const [selectedTemplates, setSelectedTemplates] = useState({});
  const [activeField, setActiveField] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const API_BASE = process.env.REACT_APP_API_URL;

  /* ── Auth check ── */
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const response = await axios.get(`${API_BASE}/common-for-user`, {
          withCredentials: true,
        });
        if (response.data.authenticated) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          navigate("/login");
        }
      } catch (error) {
        console.error("Error checking authorization:", error);
        setIsAuthenticated(false);
        navigate("/login");
      }
    };
    checkAuthentication();
  }, [navigate]);

  /* ── Load templates ── */
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const [
          complaints,
          anamnesisMorbi,
          anamnesisVitae,
          statusPreasens,
          statusLocalis,
          recommendations,
          mriResults,
          ultrasoundResults,
          laboratoryTestResults,
          additionalDiagnosis,
          ctScanResults,
        ] = await Promise.all([
          axios.get(`${API_BASE}/clinic/temp-complaints-list`),
          axios.get(`${API_BASE}/clinic/temp-anamnesis-morbi-list`),
          axios.get(`${API_BASE}/clinic/temp-anamnesis-vitae-list`),
          axios.get(`${API_BASE}/clinic/temp-status-preasens-list`),
          axios.get(`${API_BASE}/clinic/temp-status-localis-list`),
          axios.get(`${API_BASE}/clinic/temp-recommendations-list`),
          axios.get(`${API_BASE}/clinic/temp-mri-results-list`),
          axios.get(`${API_BASE}/clinic/temp-ultrasound-results-list`),
          axios.get(`${API_BASE}/clinic/temp-laboratory-tests-list`),
          axios.get(`${API_BASE}/clinic/temp-additionalDiagnosis-list`),
          axios.get(`${API_BASE}/clinic/temp-ct-scan-list`),
        ]);
        setTemplates({
          complaints: complaints.data,
          anamnesisMorbi: anamnesisMorbi.data,
          anamnesisVitae: anamnesisVitae.data,
          statusPreasens: statusPreasens.data,
          statusLocalis: statusLocalis.data,
          recommendations: recommendations.data,
          additionalDiagnosis: additionalDiagnosis.data,
          mriResults: mriResults.data,
          ultrasoundResults: ultrasoundResults.data,
          laboratoryTestResults: laboratoryTestResults.data,
          ctScanResults: ctScanResults.data,
        });
      } catch (error) {
        console.error("Error loading templates:", error);
      }
    };
    fetchTemplates();
  }, []);

  /* ── Handlers ── */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setPhoto(file);
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /* ────────────────── Голосовая надиктовка ──────────────────
     Панель отдаёт разложенный по разделам черновик, а форма решает, что с
     ним делать. Правило одно: НЕ затирать написанное врачом. «Перенести»
     заполняет только пустые поля, замена возможна лишь отдельной кнопкой у
     конкретного раздела.
  */

  // Разделы, которые ложатся в форму один в один.
  const DICTATION_DIRECT = [
    "complaints",
    "anamnesisMorbi",
    "anamnesisVitae",
    "statusPreasens",
    "statusLocalis",
    "recommendations",
    "ctScanResults",
    "mriResults",
    "ultrasoundResults",
    "laboratoryTestResults",
  ];

  // Код из надиктовки приходит без официального названия: распознаватель
  // слышит «джей сорок пять», а не строку справочника. Название подтянет
  // автокомплит, когда врач подтвердит код.
  const CODE_NOTE = t(
    "dictation.noteCodeFromSpeech",
    "Код МКБ-10 подставлен со слов — названия из справочника у него нет. " +
      "Подтвердите код в поле поиска, чтобы название встало официальное.",
  );
  const TEXT_NEEDS_CODE = t(
    "dictation.noteTextNeedsCode",
    "Текст диагноза не перенесён: поле появляется только после выбора кода " +
      "МКБ-10. Выберите код — и нажмите «→ в поле» ещё раз.",
  );

  const applyDictation = (fields) => {
    const applied = [];
    const skipped = [];
    const notes = [];
    const diagnosis = { ...formData.mainDiagnosis };
    const patch = {};

    // Код разбираем первым: от него зависит, отрисовано ли поле текста.
    if (fields.mainDiagnosisCode) {
      if (diagnosis.code) {
        skipped.push("mainDiagnosisCode");
      } else {
        diagnosis.code = String(fields.mainDiagnosisCode).trim().toUpperCase();
        applied.push("mainDiagnosisCode");
        notes.push(CODE_NOTE);
      }
    }

    if (fields.mainDiagnosisText) {
      if (!diagnosis.code) notes.push(TEXT_NEEDS_CODE);
      else if (diagnosis.text.trim()) skipped.push("mainDiagnosisText");
      else {
        diagnosis.text = fields.mainDiagnosisText;
        applied.push("mainDiagnosisText");
      }
    }

    DICTATION_DIRECT.forEach((key) => {
      if (!fields[key]) return;
      if (String(formData[key] ?? "").trim()) {
        skipped.push(key);
        return;
      }
      patch[key] = fields[key];
      applied.push(key);
    });

    setFormData((prev) => ({ ...prev, ...patch, mainDiagnosis: diagnosis }));
    // Ошибки заполнения по перенесённым разделам больше не актуальны.
    if (applied.length) {
      setErrors((prev) => {
        const next = { ...prev };
        applied.forEach((key) => delete next[key]);
        return next;
      });
    }
    return { applied, skipped, notes };
  };

  // Перенос одного раздела — с заменой, потому что это отдельное действие
  // врача.
  const applyDictationField = (field, value) => {
    if (field === "mainDiagnosisCode") {
      setFormData((prev) => ({
        ...prev,
        mainDiagnosis: {
          ...prev.mainDiagnosis,
          code: String(value).trim().toUpperCase(),
        },
      }));
      return { applied: true, note: CODE_NOTE };
    }
    if (field === "mainDiagnosisText") {
      if (!formData.mainDiagnosis.code) {
        return { applied: false, note: TEXT_NEEDS_CODE };
      }
      setFormData((prev) => ({
        ...prev,
        mainDiagnosis: { ...prev.mainDiagnosis, text: value },
      }));
      return { applied: true };
    }
    if (!DICTATION_DIRECT.includes(field)) return { applied: false };
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    return { applied: true };
  };

  // Когда врач выбирает код МКБ-10 из автокомплита (или сбрасывает)
  const handleICD10Select = (selected) => {
    if (!selected) {
      setFormData((prev) => ({
        ...prev,
        mainDiagnosis: { code: "", codeTitle: "", text: "" },
      }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      mainDiagnosis: {
        code: selected.code,
        codeTitle: selected.title,
        // Автозаполняем text англ. названием ТОЛЬКО если поле пустое.
        // Если врач уже что-то написал — не затираем его текст.
        text: prev.mainDiagnosis.text || selected.title,
      },
    }));
  };

  // Когда врач редактирует текст диагноза на своём языке
  const handleDiagnosisTextChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      mainDiagnosis: { ...prev.mainDiagnosis, text: e.target.value },
    }));
  };

  const handleTemplateSelect = (field, templateId) => {
    if (!templateId) return;
    const category = Object.keys(templates).find((key) =>
      templates[key].some((t) => t._id === templateId),
    );
    if (category) {
      const template = templates[category].find((t) => t._id === templateId);
      setSelectedTemplates((prev) => ({ ...prev, [field]: template }));
    }
  };
  const openModalForField = (field) => {
    if (selectedTemplates[field]) {
      setActiveField(field);
      setIsModalOpen(true);
    }
  };
  const insertTemplateFromModal = () => {
    if (activeField && selectedTemplates[activeField]) {
      setFormData((prev) => ({
        ...prev,
        [activeField]:
          prev[activeField] + "\n" + selectedTemplates[activeField].content,
      }));
      setIsModalOpen(false);
    }
  };
  const insertTemplateDirect = (field) => {
    if (selectedTemplates[field]) {
      setFormData((prev) => ({
        ...prev,
        [field]: prev[field] + "\n" + selectedTemplates[field].content,
      }));
    }
  };

  /* ── Validation ── */
  const validateFields = () => {
    const newErrors = {};
    const requiredTextFields = [
      "complaints",
      "anamnesisMorbi",
      "anamnesisVitae",
      "statusPreasens",
      "statusLocalis",
      "recommendations",
    ];
    requiredTextFields.forEach((field) => {
      const value = formData[field];
      if (typeof value !== "string" || value.trim() === "") {
        const fieldLabel =
          t(`medicalHistoryForm.labels.${field}`, field) || field;
        newErrors[field] = t("medicalHistoryForm.validation.fillRequired", {
          field: fieldLabel,
        });
      }
    });

    // Диагноз — отдельная проверка: и код, и текст должны быть заполнены
    if (!formData.mainDiagnosis.code) {
      newErrors.mainDiagnosisCode = t(
        "medicalHistoryForm.validation.icdRequired",
        "Please select an ICD-10 code",
      );
    }
    if (!formData.mainDiagnosis.text?.trim()) {
      newErrors.mainDiagnosisText = t(
        "medicalHistoryForm.validation.diagnosisTextRequired",
        "Please enter the diagnosis text in your language",
      );
    }

    if (Object.keys(newErrors).length > 0) {
      const messageList = Object.values(newErrors)
        .map((msg) => `• ${msg}`)
        .join("\n");
      alert(
        t(
          "medicalHistoryForm.validation.requiredList",
          "Please fill in the following required fields:",
        ) +
          "\n" +
          messageList,
      );
    }
    return newErrors;
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const fieldErrors = validateFields();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    } else {
      setErrors({});
    }
    if (!isAuthenticated) {
      alert(t("medicalHistoryForm.validation.loginRequired", "Please log in."));
      navigate("/login");
      return;
    }
    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === "mainDiagnosis") {
          // Объект отправляем как JSON-строку — на бэке распарсим
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });
      if (photo) formDataToSend.append("image", photo);
      const response = await axios.post(
        `${API_BASE}/clinic/patients-polyclinic-medical-history/${id}`,
        formDataToSend,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        },
      );
      alert(
        response.data?.message ||
          t(
            "medicalHistoryForm.messages.patientAdded",
            "Patient added successfully!",
          ),
      );
      navigate("/dp/polyclinic");
    } catch (error) {
      console.error("Error adding patient: ", error);
      alert(
        error.response?.data?.message ||
          t("medicalHistoryForm.messages.errorOccurred", "An error occurred."),
      );
    }
  };

  /* ── Template sub-components ── */
  const TemplateSelector = ({ field, category }) => {
    const list = templates[category] || [];
    return (
      <div className="amh-tmpl">
        <select
          className="amh-tmpl-select"
          onChange={(e) => handleTemplateSelect(field, e.target.value)}
          value={selectedTemplates[field] ? selectedTemplates[field]._id : ""}
        >
          <option value="">
            {t("medicalHistoryForm.templateSelector.select", "Select template")}
          </option>
          {list.map((template) => (
            <option key={template._id} value={template._id}>
              {template.title}
            </option>
          ))}
        </select>
        <div className="amh-tmpl-btns">
          <button
            type="button"
            className="amh-tmpl-btn preview"
            onClick={() => openModalForField(field)}
            disabled={!selectedTemplates[field]}
          >
            👁 {t("medicalHistoryForm.buttons.preview", "Preview")}
          </button>
          <button
            type="button"
            className="amh-tmpl-btn insert"
            onClick={() => insertTemplateDirect(field)}
            disabled={!selectedTemplates[field]}
          >
            ↙ {t("medicalHistoryForm.buttons.insert", "Insert")}
          </button>
        </div>
      </div>
    );
  };

  const TemplateNav = ({ listTo, createTo, openInNewTab = true }) => (
    <div className="amh-tmpl-nav" style={{ marginTop: 8 }}>
      <Link
        to={listTo}
        target={openInNewTab ? "_blank" : undefined}
        className="amh-tmpl-nav-btn list"
      >
        📋 {t("medicalHistoryForm.buttons.toTemplates", "To templates")}
      </Link>
      <Link to={createTo} className="amh-tmpl-nav-btn create">
        ✚ {t("medicalHistoryForm.buttons.createTemplate", "Create template")}
      </Link>
    </div>
  );

  /* ── Computed progress ── */
  const requiredFields = [
    "complaints",
    "anamnesisMorbi",
    "anamnesisVitae",
    "statusPreasens",
    "statusLocalis",
    "mainDiagnosis",
    "recommendations",
  ];
  const isFieldFilled = (f) => {
    const v = formData[f];
    if (f === "mainDiagnosis") {
      return !!(v.code && v.text?.trim());
    }
    if (typeof v === "string") return v.trim().length > 0;
    if (Array.isArray(v)) return v.length > 0;
    return !!v;
  };
  const filledCount = requiredFields.filter(isFieldFilled).length;

  if (!isAuthenticated) {
    return (
      <div className="amh-root">
        <style>{CSS}</style>
        <div className="amh-loading">
          <div className="amh-loading-spin" />
          {t("medicalHistoryForm.loading", "Loading...")}
        </div>
      </div>
    );
  }

  return (
    <div className="amh-root">
      <style>{CSS}</style>

      {/* ── HERO ── */}
      <div className="amh-hero">
        <div className="amh-hero-inner">
          <div className="amh-hero-tag">DocPats · Medical History</div>
          <h1 className="amh-hero-h1">
            {t("medicalHistoryForm.title", "Add Medical History")}
          </h1>
          <p className="amh-hero-sub">
            {filledCount} / {requiredFields.length}{" "}
            {t("medicalHistoryForm.requiredFilled", "required fields filled")}
          </p>
        </div>
      </div>

      <div className="amh-body">
        {/* ── Progress bar ── */}
        <div className="amh-progress">
          {requiredFields.map((f, i) => {
            const filled = isFieldFilled(f);
            return (
              <div
                key={f}
                className={`amh-prog-step${filled ? " done" : i === filledCount ? " active" : ""}`}
              />
            );
          })}
        </div>

        {/* ── Голосовая надиктовка. Сама решает, показываться ли: без ключей
             распознавания сервер отвечает ready:false и панель не рисуется —
             мёртвой кнопки «записать» врач не увидит. ── */}
        <DictationPanel
          patientId={id}
          onApply={applyDictation}
          onApplyField={applyDictationField}
        />

        <form onSubmit={handleSubmit}>
          {/* ── Complaints ── */}
          <SectionBlock
            icon="💬"
            label={t("medicalHistoryForm.labels.complaints", "Complaints")}
            required
            allowOverflow
          >
            <textarea
              className="amh-textarea"
              name="complaints"
              value={formData.complaints}
              onChange={handleChange}
              rows="8"
              required
              placeholder={t(
                "medicalHistoryForm.placeholders.complaints",
                "Describe patient complaints...",
              )}
            />
            <FieldError msg={errors.complaints} />
            <TemplateSelector field="complaints" category="complaints" />
            <TemplateNav
              listTo="/dp/temp-complaints-list"
              createTo="/dp/add-complainte-template"
            />
          </SectionBlock>

          {/* ── Anamnesis Morbi ── */}
          <SectionBlock
            icon="📖"
            label={t(
              "medicalHistoryForm.labels.anamnesisMorbi",
              "Anamnesis Morbi",
            )}
            required
          >
            <textarea
              className="amh-textarea"
              name="anamnesisMorbi"
              value={formData.anamnesisMorbi}
              onChange={handleChange}
              rows="8"
              placeholder={t(
                "medicalHistoryForm.placeholders.anamnesisMorbi",
                "History of the present illness...",
              )}
            />
            <FieldError msg={errors.anamnesisMorbi} />
            <TemplateSelector
              field="anamnesisMorbi"
              category="anamnesisMorbi"
            />
            <TemplateNav
              listTo="/dp/anamnes-morbi-template-list"
              createTo="/dp/add-anamnes-morbi-template"
            />
          </SectionBlock>

          {/* ── Anamnesis Vitae ── */}
          <SectionBlock
            icon="🧬"
            label={t(
              "medicalHistoryForm.labels.anamnesisVitae",
              "Anamnesis Vitae",
            )}
            required
          >
            <textarea
              className="amh-textarea"
              name="anamnesisVitae"
              value={formData.anamnesisVitae}
              onChange={handleChange}
              rows="8"
              placeholder={t(
                "medicalHistoryForm.placeholders.anamnesisVitae",
                "Life history, past conditions...",
              )}
            />
            <FieldError msg={errors.anamnesisVitae} />
            <TemplateSelector
              field="anamnesisVitae"
              category="anamnesisVitae"
            />
            <TemplateNav
              listTo="/dp/anamnes-vitae-template-list"
              createTo="/dp/add-anamnes-vitae-template"
            />
          </SectionBlock>

          {/* ── Status Praesens ── */}
          <SectionBlock
            icon="🩺"
            label={t(
              "medicalHistoryForm.labels.statusPreasens",
              "Status Praesens",
            )}
            required
          >
            <textarea
              className="amh-textarea"
              name="statusPreasens"
              value={formData.statusPreasens}
              onChange={handleChange}
              rows="8"
              placeholder={t(
                "medicalHistoryForm.placeholders.statusPreasens",
                "Current objective status...",
              )}
            />
            <FieldError msg={errors.statusPreasens} />
            <TemplateSelector
              field="statusPreasens"
              category="statusPreasens"
            />
            <TemplateNav
              listTo="/dp/status-preasens-template-list"
              createTo="/dp/add-status-preasens-template"
            />
          </SectionBlock>

          {/* ── Status Localis ── */}
          <SectionBlock
            icon="🔬"
            label={t(
              "medicalHistoryForm.labels.statusLocalis",
              "Status Localis",
            )}
            required
          >
            <textarea
              className="amh-textarea"
              name="statusLocalis"
              value={formData.statusLocalis}
              onChange={handleChange}
              rows="8"
              placeholder={t(
                "medicalHistoryForm.placeholders.statusLocalis",
                "Local status description...",
              )}
            />
            <FieldError msg={errors.statusLocalis} />
            <TemplateSelector field="statusLocalis" category="statusLocalis" />
            <TemplateNav
              listTo="/dp/status-localis-template-list"
              createTo="/dp/add-status-localis-template"
            />
          </SectionBlock>

          {/* ── CT Scan ── */}
          <SectionBlock
            icon="🖥️"
            label={t(
              "medicalHistoryForm.labels.ctScanResults",
              "CT Scan Results",
            )}
          >
            <textarea
              className="amh-textarea"
              name="ctScanResults"
              value={formData.ctScanResults}
              onChange={handleChange}
              rows="6"
              placeholder={t(
                "medicalHistoryForm.placeholders.ctScanResults",
                "CT scan findings...",
              )}
            />
            <TemplateSelector field="ctScanResults" category="ctScanResults" />
            <TemplateNav
              listTo="/dp/ct-results-template-list"
              createTo="/dp/add-ct-results-template"
            />
          </SectionBlock>

          {/* ── MRI ── */}
          <SectionBlock
            icon="🧲"
            label={t("medicalHistoryForm.labels.mriResults", "MRI Results")}
          >
            <textarea
              className="amh-textarea"
              name="mriResults"
              value={formData.mriResults}
              onChange={handleChange}
              rows="6"
              placeholder={t(
                "medicalHistoryForm.placeholders.mriResults",
                "MRI findings...",
              )}
            />
            <TemplateSelector field="mriResults" category="mriResults" />
            <TemplateNav
              listTo="/dp/mri-results-template-list"
              createTo="/dp/add-mri-results-template"
            />
          </SectionBlock>

          {/* ── Ultrasound ── */}
          <SectionBlock
            icon="📡"
            label={t(
              "medicalHistoryForm.labels.ultrasoundResults",
              "Ultrasound Results",
            )}
          >
            <textarea
              className="amh-textarea"
              name="ultrasoundResults"
              value={formData.ultrasoundResults}
              onChange={handleChange}
              rows="6"
              placeholder={t(
                "medicalHistoryForm.placeholders.ultrasoundResults",
                "Ultrasound findings...",
              )}
            />
            <TemplateSelector
              field="ultrasoundResults"
              category="ultrasoundResults"
            />
            <TemplateNav
              listTo="/dp/ultrasound-tests-template-list"
              createTo="/dp/add-ultrasound-tests-template"
            />
          </SectionBlock>

          {/* ── Lab Tests ── */}
          <SectionBlock
            icon="🧪"
            label={t(
              "medicalHistoryForm.labels.laboratoryTestResults",
              "Laboratory Test Results",
            )}
          >
            <textarea
              className="amh-textarea"
              name="laboratoryTestResults"
              value={formData.laboratoryTestResults}
              onChange={handleChange}
              rows="6"
              placeholder={t(
                "medicalHistoryForm.placeholders.laboratoryTestResults",
                "Lab test results...",
              )}
            />
            <TemplateSelector
              field="laboratoryTestResults"
              category="laboratoryTestResults"
            />
            <TemplateNav
              listTo="/dp/laboratory-tests-template-list"
              createTo="/dp/add-laboratory-tests-template"
            />
          </SectionBlock>

          {/* ── Diagnosis (ICD-10 + текст на родном языке) ── */}
          <SectionBlock
            icon="🏥"
            label={t(
              "medicalHistoryForm.labels.diagnosis",
              "Diagnosis (ICD-10)",
            )}
            required
          >
            <ICD10Autocomplete
              value={
                formData.mainDiagnosis.code
                  ? {
                      code: formData.mainDiagnosis.code,
                      title: formData.mainDiagnosis.codeTitle,
                    }
                  : null
              }
              onChange={handleICD10Select}
              placeholder={t(
                "medicalHistoryForm.placeholders.diagnosisInput",
                "Search ICD-10 by code (e.g. J45) or English name (e.g. asthma)...",
              )}
            />
            <FieldError msg={errors.mainDiagnosisCode} />

            {formData.mainDiagnosis.code && (
              <>
                <textarea
                  className="amh-textarea"
                  style={{ marginTop: 12, minHeight: 90 }}
                  value={formData.mainDiagnosis.text}
                  onChange={handleDiagnosisTextChange}
                  rows="3"
                  placeholder={t(
                    "medicalHistoryForm.placeholders.diagnosisText",
                    "Diagnosis text in your language (auto-filled from ICD-10, you can edit)...",
                  )}
                />
                <div className="amh-diagnosis-hint">
                  💡{" "}
                  {t(
                    "medicalHistoryForm.hints.diagnosisText",
                    "Auto-filled from ICD-10. Feel free to translate or rephrase in your language.",
                  )}
                </div>
                <FieldError msg={errors.mainDiagnosisText} />
              </>
            )}
          </SectionBlock>

          {/* ── Additional Diagnosis (без изменений) ── */}
          <SectionBlock
            icon="➕"
            label={t(
              "medicalHistoryForm.labels.additionalDiagnosis",
              "Additional Diagnosis",
            )}
          >
            <input
              className="amh-input"
              type="text"
              name="additionalDiagnosis"
              value={formData.additionalDiagnosis}
              onChange={handleChange}
              placeholder={t(
                "medicalHistoryForm.placeholders.additionalDiagnosis",
                "Write your addition to the diagnosis...",
              )}
            />
            <TemplateSelector
              field="additionalDiagnosis"
              category="additionalDiagnosis"
            />
            <TemplateNav
              listTo="/dp/list-additional-diagnosis-template"
              createTo="/dp/add-additional-diagnosis-template"
            />
          </SectionBlock>

          {/* ── Recommendations ── */}
          <SectionBlock
            icon="📝"
            label={t(
              "medicalHistoryForm.labels.recommendations",
              "Recommendations",
            )}
            required
          >
            <textarea
              className="amh-textarea"
              name="recommendations"
              value={formData.recommendations}
              onChange={handleChange}
              rows="8"
              placeholder={t(
                "medicalHistoryForm.placeholders.recommendations",
                "Treatment recommendations, follow-up plan...",
              )}
            />
            <FieldError msg={errors.recommendations} />
            <TemplateSelector
              field="recommendations"
              category="recommendations"
            />
            <TemplateNav
              listTo="/dp/recomendation-tests-template-list"
              createTo="/dp/add-recomendation-template"
              openInNewTab={false}
            />
          </SectionBlock>

          {/* ── Submit ── */}
          <div className="amh-footer">
            <button type="submit" className="amh-submit">
              ✓ {t("medicalHistoryForm.buttons.submit", "Save Medical History")}
            </button>
          </div>
        </form>
      </div>

      {/* ── Modal preview ── */}
      {isModalOpen && (
        <div
          className="amh-modal-overlay"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="amh-modal" onClick={(e) => e.stopPropagation()}>
            <div className="amh-modal-head">
              <span className="amh-modal-title">
                {selectedTemplates[activeField]?.title}
              </span>
              <button
                className="amh-modal-close"
                onClick={() => setIsModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="amh-modal-body">
              <pre className="amh-modal-content">
                {selectedTemplates[activeField]?.content}
              </pre>
            </div>
            <div className="amh-modal-footer">
              <button
                className="amh-modal-btn cancel"
                onClick={() => setIsModalOpen(false)}
              >
                {t("medicalHistoryForm.buttons.close", "Close")}
              </button>
              <button
                className="amh-modal-btn primary"
                onClick={insertTemplateFromModal}
              >
                ↙{" "}
                {t(
                  "medicalHistoryForm.buttons.insertTemplate",
                  "Insert template",
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
