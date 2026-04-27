import { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import axios from "axios";
import {
  TEST_TYPES,
  LABTEST_PARAMETER_TEMPLATES,
} from "./labtestParameterTemplates.jsx";
import { useTranslation } from "react-i18next";

/* ===== helpers ===== */
const isEmpty = (v) => v === "" || v === null || typeof v === "undefined";
const deepClone = (o) => JSON.parse(JSON.stringify(o || {}));

function normalizeParameters(params) {
  const arr = Array.isArray(params) ? params : [];
  return arr.map((p0) => {
    const p = { ...p0 };
    p.name = String(p.name ?? "").trim();

    let vt = p.valueType;
    if (!vt) {
      const hasRange =
        p.referenceRange &&
        (!isEmpty(p.referenceRange.min) || !isEmpty(p.referenceRange.max));
      const looksNumeric = !isEmpty(p.value) && !Number.isNaN(Number(p.value));
      vt = hasRange || looksNumeric ? "number" : "text";
    }
    p.valueType = vt === "number" ? "number" : "text";

    // Default unit should be EN, not RU
    if (isEmpty(p.unit))
      p.unit =
        p.valueType === "number" ? "unit.defaultNumber" : "unit.defaultText";

    if (p.valueType === "text") {
      p.value = String(p.value ?? "");
      p.referenceRange = null;
    } else {
      const toNum = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
      };
      p.value = isEmpty(p.value) ? null : toNum(p.value);
      const min = p.referenceRange?.min;
      const max = p.referenceRange?.max;
      p.referenceRange = {
        min: isEmpty(min) ? null : toNum(min),
        max: isEmpty(max) ? null : toNum(max),
      };
    }

    return p;
  });
}

export default function AddLabTest() {
  const { t } = useTranslation("Examinations");
  const { patientId, patientModel } = useParams();
  const navigate = useNavigate();
  const [warning, setWarning] = useState("");
  const location = useLocation();
  const [testType, setTestType] = useState("");
  const [labName, setLabName] = useState("");
  const [report, setReport] = useState("");
  const [parameters, setParameters] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    if (testType && LABTEST_PARAMETER_TEMPLATES[testType]) {
      const base = deepClone(LABTEST_PARAMETER_TEMPLATES[testType]).map(
        (p) => ({
          ...p,
          value: "",
        }),
      );
      setParameters(normalizeParameters(base));
    } else {
      setParameters([]);
    }
  }, [testType]);

  const handleAddParameter = () => {
    setParameters((prev) =>
      prev.concat([
        {
          name: "",
          value: "",
          unit: "unit.defaultText",
          valueType: "text",
          referenceRange: null,
        },
      ]),
    );
  };

  const handleRemoveParameter = (index) => {
    setParameters((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChangeParameter = (index, field, value, subField) => {
    setParameters((prev) => {
      const clone = deepClone(prev);
      const row = clone[index] ?? {};

      if (field === "valueType") {
        row.valueType = value === "number" ? "number" : "text";

        if (row.valueType === "text") {
          row.value = String(row.value ?? "");
          row.referenceRange = null;
          if (!row.unit || row.unit === "unit.defaultNumber")
            row.unit = "unit.defaultText";
        } else {
          row.value = isEmpty(row.value) ? "" : String(row.value);
          row.referenceRange = row.referenceRange ?? { min: "", max: "" };
          if (!row.unit || row.unit === "unit.defaultText")
            row.unit = "unit.defaultNumber";
        }
      } else if (subField) {
        row.referenceRange = row.referenceRange || { min: "", max: "" };
        row.referenceRange[subField] = value;
      } else {
        row[field] = value;
      }

      clone[index] = row;
      return clone;
    });
  };

  const handleCopyFromPrevious = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/clinic/get-detail-examinations/get-latest-labtest/${patientId}`,
        { withCredentials: true },
      );
      const dt = res?.data?.data;
      if (dt?.testParameters) {
        setParameters(normalizeParameters(dt.testParameters));
        if (dt.testType) setTestType(dt.testType);
      } else {
        alert(t("AddLabTest.messages.noPrevious"));
      }
    } catch {
      alert(t("AddLabTest.messages.copyError"));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!testType || parameters.length === 0) {
      alert(t("AddLabTest.errors.noTestType"));
      return;
    }

    const clean = normalizeParameters(parameters);

    // Clean units (English default via i18n keys)
    clean.forEach((p) => {
      if (isEmpty(p.unit))
        p.unit =
          p.valueType === "number" ? "unit.defaultNumber" : "unit.defaultText";
    });

    const missing = clean
      .map((p, i) => ({ p, i }))

      .filter(({ p }) =>
        p.valueType === "text"
          ? String(p.value || "").trim().length === 0
          : p.value === null || Number.isNaN(p.value),
      );

    if (missing.length) {
      const names = missing
        .map(({ p, i }) => p.name?.trim() || `#${i + 1}`)
        .join(", ");
      alert(t("AddLabTest.errors.missingValues", { list: names }));
      return;
    }

    const data = new FormData();
    data.append("testType", testType);
    data.append("labName", labName);
    data.append("report", report);
    data.append("testParameters", JSON.stringify(clean));
    files.forEach((f) => data.append("files", f));

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE}/clinic/add-examinations/add-labtest-scan/${patientId}`,
        data,
        { withCredentials: true },
      );
      const scan = response.data.data;
      setMessage(t("AddLabTest.messages.success"));

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
    } catch (err) {
      setMessage(
        t("AddLabTest.messages.error") +
          (err?.response?.data?.message || err.message),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <h2>{t("AddLabTest.page.title")}</h2>
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
          className={`alert ${
            message.startsWith("✅") ? "alert-success" : "alert-danger"
          }`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Test type */}
        <div className="form-group mb-3">
          <label>{t("AddLabTest.fields.testType.label")}</label>
          <select
            className="form-select"
            value={testType}
            onChange={(e) => setTestType(e.target.value)}
            required
          >
            <option value="">
              {t("AddLabTest.fields.testType.placeholder")}
            </option>

            {TEST_TYPES.map((tst) => (
              <option key={tst.value} value={tst.value}>
                {t(`AddLabTest.testTypes.${tst.value}`)}
              </option>
            ))}
          </select>
        </div>

        {/* Copy from previous */}
        <button
          type="button"
          className="btn btn-outline-info mb-3"
          onClick={handleCopyFromPrevious}
        >
          📋 {t("AddLabTest.buttons.copyFromPrevious")}
        </button>

        {/* Lab name */}
        <div className="form-group mb-3">
          <label>{t("AddLabTest.fields.labName.label")}</label>
          <input
            type="text"
            className="form-control"
            placeholder={t("AddLabTest.fields.labName.placeholder")}
            value={labName}
            onChange={(e) => setLabName(e.target.value)}
          />
        </div>

        {/* Doctor comment */}
        <div className="form-group mb-3">
          <label>{t("AddLabTest.fields.report.label")}</label>
          <textarea
            className="form-control"
            rows={3}
            placeholder={t("AddLabTest.fields.report.placeholder")}
            value={report}
            onChange={(e) => setReport(e.target.value)}
          />
        </div>

        {/* Parameters */}
        <h5>{t("AddLabTest.section.parameters")}</h5>

        {parameters.map((param, idx) => {
          const isText = param.valueType === "text";
          return (
            <div key={idx} className="row g-2 mb-2 align-items-start">
              <div className="col-md-3">
                <input
                  className="form-control"
                  placeholder={t("AddLabTest.fields.parameter.placeholder")}
                  value={param.name}
                  onChange={(e) =>
                    handleChangeParameter(idx, "name", e.target.value)
                  }
                  required
                />
              </div>

              <div className="col-md-2">
                <select
                  className="form-select"
                  value={param.valueType}
                  onChange={(e) =>
                    handleChangeParameter(idx, "valueType", e.target.value)
                  }
                >
                  <option value="text">{t("AddLabTest.valueType.text")}</option>
                  <option value="number">
                    {t("AddLabTest.valueType.number")}
                  </option>
                </select>
              </div>

              <div className="col-md-3">
                {isText ? (
                  <input
                    className="form-control"
                    placeholder={t(
                      "AddLabTest.fields.parameter.valueTextPlaceholder",
                    )}
                    type="text"
                    value={param.value ?? ""}
                    onChange={(e) =>
                      handleChangeParameter(idx, "value", e.target.value)
                    }
                    required
                  />
                ) : (
                  <input
                    className="form-control"
                    placeholder={t(
                      "AddLabTest.fields.parameter.valueNumberPlaceholder",
                    )}
                    type="number"
                    step="any"
                    value={param.value ?? ""}
                    onChange={(e) =>
                      handleChangeParameter(idx, "value", e.target.value)
                    }
                    required
                  />
                )}
              </div>

              <div className="col-md-2">
                <input
                  className="form-control"
                  placeholder={t("AddLabTest.fields.unit.placeholder")}
                  value={t(`AddLabTest.units.${param.unit}`)}
                  onChange={(e) =>
                    handleChangeParameter(idx, "unit", e.target.value)
                  }
                  required
                />
              </div>

              {!isText && (
                <>
                  <div className="col-md-1">
                    <input
                      className="form-control"
                      placeholder={t("AddLabTest.fields.referenceRange.min")}
                      type="number"
                      step="any"
                      value={param.referenceRange?.min ?? ""}
                      onChange={(e) =>
                        handleChangeParameter(
                          idx,
                          "referenceRange",
                          e.target.value,
                          "min",
                        )
                      }
                    />
                  </div>
                  <div className="col-md-1">
                    <input
                      className="form-control"
                      placeholder={t("AddLabTest.fields.referenceRange.max")}
                      type="number"
                      step="any"
                      value={param.referenceRange?.max ?? ""}
                      onChange={(e) =>
                        handleChangeParameter(
                          idx,
                          "referenceRange",
                          e.target.value,
                          "max",
                        )
                      }
                    />
                  </div>
                </>
              )}

              <div className="col-md-1 d-flex justify-content-end">
                <button
                  type="button"
                  onClick={() => handleRemoveParameter(idx)}
                  className="btn btn-danger"
                  title={t("AddLabTest.buttons.deleteParameter")}
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}

        {/* Add parameter */}
        <button
          type="button"
          className="btn btn-outline-primary mb-3"
          onClick={handleAddParameter}
        >
          ➕ {t("AddLabTest.buttons.addParameter")}
        </button>

        {/* Files */}
        <div className="form-group mb-3">
          <label>{t("AddLabTest.fields.files.label")}</label>

          {/* hidden file input */}
          <input
            type="file"
            id="add-labtest-files-input"
            style={{ display: "none" }}
            multiple
            accept="application/pdf,image/*"
            onChange={(e) => setFiles(Array.from(e.target.files))}
          />

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() =>
                document.getElementById("add-labtest-files-input").click()
              }
            >
              {t("AddLabTest.fields.files.choose")}
            </button>

            <span>
              {files?.length > 0
                ? files.map((f) => f.name).join(", ")
                : t("AddLabTest.fields.files.noFile")}
            </span>
          </div>
        </div>

        {/* Submit */}
        <button type="submit" className="btn btn-success" disabled={loading}>
          {loading
            ? t("AddLabTest.buttons.loading")
            : t("AddLabTest.buttons.submit")}
        </button>
      </form>
    </div>
  );
}
