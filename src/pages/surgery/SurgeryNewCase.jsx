import React, { useState, useEffect, useRef, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { createCase } from "./surgerySlice";
import axios from "axios";
import styles from "./Surgery.module.css";
import { PROCEDURE_GROUPS } from "./surgeryConstants";

const API_BASE = process.env.REACT_APP_API_URL;

const ANESTHESIA_KEYS = [
  "local",
  "sedation",
  "general",
  "spinal",
  "epidural",
  "regional",
];

const PATIENT_TYPE_KEYS = ["registered", "private", "anonymous"];

// ─── Поиск пациента ───────────────────────────────────────────────────────
function PatientSearch({ type, onSelect, selected, userId }) {
  const { t } = useTranslation("Surgery");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");
  const timer = useRef(null);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      setStatus("");
      return;
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setLoading(true);
      setStatus("");
      try {
        let uid = userId;
        if (!uid) {
          const me = await axios.get(`${API_BASE}/common-for-user`, {
            withCredentials: true,
          });
          uid = me.data?.user?.userId || me.data?.user?._id || "";
        }
        if (!uid) {
          setStatus(t("newCase.errors.noUserId"));
          setLoading(false);
          return;
        }

        const isEmail = query.includes("@");
        const parts = query.trim().split(" ").filter(Boolean);

        const buildParams = (extra = {}) => {
          const p = new URLSearchParams({
            page: 1,
            pageSize: 20,
            archiveStatus: "active",
          });
          if (type === "private") p.set("patientType", "private");
          Object.entries(extra).forEach(([k, v]) => p.set(k, v));
          return p.toString();
        };

        let qs;
        if (isEmail) qs = buildParams({ email: query.trim() });
        else if (parts.length >= 2)
          qs = buildParams({
            firstName: parts[0],
            lastName: parts.slice(1).join(" "),
          });
        else qs = buildParams({ firstName: query.trim() });

        const url = `${API_BASE}/clinic/patients-polyclinic/${uid}?${qs}`;
        const res = await axios.get(url, { withCredentials: true });
        const raw = res.data;
        let list = Array.isArray(raw)
          ? raw
          : raw?.patients ||
            raw?.data ||
            raw?.items ||
            raw?.results ||
            raw?.list ||
            raw?.docs ||
            [];

        // Если по firstName ничего — ищем по lastName
        if (!list.length && !isEmail && parts.length === 1) {
          const url2 = `${API_BASE}/clinic/patients-polyclinic/${uid}?${buildParams({ lastName: query.trim() })}`;
          const res2 = await axios.get(url2, { withCredentials: true });
          list = res2.data?.patients || [];
        }

        setResults(list);
        setOpen(list.length > 0);
        setStatus(list.length ? "" : t("newCase.notFoundInPatients"));
      } catch (e) {
        console.error("[PatientSearch]", e);
        setStatus(
          `${t("newCase.errors.requestFailed")}: ${e.response?.status || e.message}`,
        );
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, [query, type, userId, t]);

  const handleSelect = (p) => {
    onSelect(p);
    setQuery(`${p.firstName || ""} ${p.lastName || ""}`.trim());
    setOpen(false);
    setStatus("");
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        className={styles.input}
        placeholder={t("newCase.searchPlaceholder")}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!e.target.value) {
            onSelect(null);
            setStatus("");
          }
        }}
        onFocus={() => results.length && setOpen(true)}
      />
      {loading && (
        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
          {t("newCase.searching")}
        </div>
      )}
      {status && (
        <div style={{ fontSize: 11, color: "#b45309", marginTop: 4 }}>
          {status}
        </div>
      )}
      {open && results.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            boxShadow: "0 4px 16px rgba(0,0,0,.08)",
            zIndex: 100,
            maxHeight: 220,
            overflowY: "auto",
          }}
        >
          {results.map((p) => (
            <div
              key={p._id}
              onClick={() => handleSelect(p)}
              style={{
                padding: "10px 14px",
                cursor: "pointer",
                borderBottom: "0.5px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#f8fafc")
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
            >
              {p.photo || p.image ? (
                <img
                  src={p.photo || p.image}
                  alt=""
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "#ede9fe",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    color: "#5b21b6",
                    fontWeight: 600,
                  }}
                >
                  {(p.firstName?.[0] || "?").toUpperCase()}
                </div>
              )}
              <div>
                <div
                  style={{ fontSize: 13, fontWeight: 500, color: "#0f172a" }}
                >
                  {p.firstName} {p.lastName}
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>
                  {p.email || p.patientId || p.externalId || ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {selected && (
        <div
          style={{
            marginTop: 8,
            padding: "8px 12px",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: 8,
            fontSize: 12,
            color: "#15803d",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          ✓ {t("newCase.selected")}:{" "}
          <strong>
            {selected.firstName} {selected.lastName}
          </strong>
          <button
            onClick={() => {
              onSelect(null);
              setQuery("");
              setStatus("");
            }}
            style={{
              marginInlineStart: "auto",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#94a3b8",
              fontSize: 14,
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Главная форма ────────────────────────────────────────────────────────
export default function SurgeryNewCase() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation("Surgery");
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    axios
      .get(`${API_BASE}/common-for-user`, { withCredentials: true })
      .then((r) => setUserId(r.data?.user?.userId || r.data?.user?._id || ""))
      .catch(() => {});
  }, []);

  const urlPatientType = searchParams.get("patientType") || "registered";
  const urlPatientId = searchParams.get("patientId");

  const [patientType, setPatientType] = useState(urlPatientType);
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    if (!urlPatientId) return;
    const endpoint =
      urlPatientType === "registered"
        ? `/clinic/patient-details/${urlPatientId}`
        : `/clinic/private-patient-details/${urlPatientId}`;
    axios
      .get(`${API_BASE}${endpoint}`, { withCredentials: true })
      .then((r) => {
        const p = r.data?.patient || r.data?.data || r.data;
        if (p?._id) setSelectedPatient(p);
      })
      .catch(() => {});
  }, [urlPatientId, urlPatientType]);

  const [form, setForm] = useState({
    procedure: "",
    operationDate: new Date().toISOString().split("T")[0],
    patientIdHash: "",
    consentGiven: false,
    plan: { text: "" },
    metrics: {
      technique: "",
      implantType: "",
      implantSize: "",
      volume: "",
      duration: "",
      anesthesia: "",
    },
  });

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const setMetric = (field, value) =>
    setForm((f) => ({ ...f, metrics: { ...f.metrics, [field]: value } }));

  const handleSubmit = async () => {
    setError("");
    if (!form.procedure) return setError(t("newCase.errors.selectProcedure"));
    if (patientType !== "anonymous" && !selectedPatient)
      return setError(t("newCase.errors.selectPatient"));
    if (patientType === "anonymous" && !form.patientIdHash)
      return setError(t("newCase.errors.enterAnonymousCode"));

    setLoading(true);
    const payload = {
      ...form,
      patientType,
      registeredPatientId:
        patientType === "registered" ? selectedPatient?._id : undefined,
      privatePatientId:
        patientType === "private" ? selectedPatient?._id : undefined,
      patientIdHash: patientType === "anonymous" ? form.patientIdHash : "",
      metrics: {
        ...form.metrics,
        duration: form.metrics.duration
          ? Number(form.metrics.duration)
          : undefined,
      },
    };

    const result = await dispatch(createCase(payload));
    setLoading(false);

    if (result.meta.requestStatus === "fulfilled") {
      navigate(`/dp/surgery/${result.payload._id}`);
    } else {
      setError(result.payload || t("newCase.errors.createFailed"));
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <button
            className={styles.btnBack}
            onClick={() => navigate("/dp/surgery")}
          >
            {t("planForm.back")}
          </button>
          <div className={styles.breadcrumb}>{t("newCase.breadcrumb")}</div>
          <h1 className={styles.title}>{t("newCase.title")}</h1>
        </div>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}

      <div className={styles.formGrid}>
        {/* ─── Пациент ──────────────────────────────────────────────── */}
        <div className={styles.formSection}>
          <h3 className={styles.cardTitle}>{t("newCase.patient")}</h3>
          <label className={styles.label}>{t("newCase.patientType")}</label>
          <div
            style={{
              display: "flex",
              gap: 6,
              marginBottom: 4,
              flexWrap: "wrap",
            }}
          >
            {PATIENT_TYPE_KEYS.map((key) => (
              <button
                key={key}
                onClick={() => {
                  setPatientType(key);
                  setSelectedPatient(null);
                }}
                style={{
                  padding: "7px 14px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all .12s",
                  border: patientType === key ? "none" : "1px solid #e2e8f0",
                  background: patientType === key ? "#0f172a" : "#fff",
                  color: patientType === key ? "#fff" : "#64748b",
                }}
              >
                {t(`newCase.patientTypes.${key}`)}
              </button>
            ))}
          </div>

          {patientType === "registered" && (
            <>
              <label className={styles.label}>
                {t("newCase.searchRegistered")}
              </label>
              <PatientSearch
                type="registered"
                onSelect={setSelectedPatient}
                selected={selectedPatient}
                userId={userId}
              />
            </>
          )}
          {patientType === "private" && (
            <>
              <label className={styles.label}>
                {t("newCase.searchPrivate")}
              </label>
              <PatientSearch
                type="private"
                onSelect={setSelectedPatient}
                selected={selectedPatient}
                userId={userId}
              />
            </>
          )}
          {patientType === "anonymous" && (
            <>
              <label className={styles.label}>
                {t("newCase.anonymousCode")}{" "}
                <span
                  style={{
                    fontWeight: 400,
                    color: "#94a3b8",
                    fontSize: 11,
                    marginInlineStart: 6,
                  }}
                >
                  {t("newCase.noPersonalData")}
                </span>
              </label>
              <input
                className={styles.input}
                placeholder={t("newCase.anonymousCodePlaceholder")}
                value={form.patientIdHash}
                onChange={(e) => set("patientIdHash", e.target.value)}
              />
            </>
          )}

          <label className={styles.checkRow} style={{ marginTop: 8 }}>
            <input
              type="checkbox"
              checked={form.consentGiven}
              onChange={(e) => set("consentGiven", e.target.checked)}
            />
            <span>{t("newCase.consentText")}</span>
          </label>
        </div>

        {/* ─── Основное ─────────────────────────────────────────────── */}
        <div className={styles.formSection}>
          <h3 className={styles.cardTitle}>{t("newCase.mainInfo")}</h3>

          <label className={styles.label}>
            {t("newCase.procedureRequired")}
          </label>
          <select
            className={styles.select}
            value={form.procedure}
            onChange={(e) => set("procedure", e.target.value)}
          >
            <option value="">{t("newCase.selectProcedurePlaceholder")}</option>
            {PROCEDURE_GROUPS.map(({ groupKey, items }) => (
              <optgroup key={groupKey} label={t(`procedureGroups.${groupKey}`)}>
                {items.map((key) => (
                  <option key={key} value={key}>
                    {t(`procedures.${key}`)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          <label className={styles.label}>{t("newCase.operationDate")}</label>
          <input
            className={styles.input}
            type="date"
            value={form.operationDate}
            onChange={(e) => set("operationDate", e.target.value)}
          />
        </div>

        {/* ─── Технические параметры ────────────────────────────────── */}
        <div className={styles.formSection}>
          <h3 className={styles.cardTitle}>{t("newCase.technicalParams")}</h3>

          <label className={styles.label}>{t("info.anesthesia")}</label>
          <select
            className={styles.select}
            value={form.metrics.anesthesia}
            onChange={(e) => setMetric("anesthesia", e.target.value)}
          >
            <option value="">{t("newCase.notSpecified")}</option>
            {ANESTHESIA_KEYS.map((key) => (
              <option key={key} value={key}>
                {t(`newCase.anesthesia.${key}`)}
              </option>
            ))}
          </select>

          <label className={styles.label}>{t("newCase.techniqueLabel")}</label>
          <input
            className={styles.input}
            placeholder={t("newCase.techniquePlaceholder")}
            value={form.metrics.technique}
            onChange={(e) => setMetric("technique", e.target.value)}
          />

          <label className={styles.label}>{t("newCase.implantLabel")}</label>
          <input
            className={styles.input}
            placeholder={t("newCase.implantPlaceholder")}
            value={form.metrics.implantType}
            onChange={(e) => setMetric("implantType", e.target.value)}
          />

          <div className={styles.row2}>
            <div>
              <label className={styles.label}>{t("newCase.sizeLabel")}</label>
              <input
                className={styles.input_surgery}
                placeholder={t("newCase.sizePlaceholder")}
                value={form.metrics.implantSize}
                onChange={(e) => setMetric("implantSize", e.target.value)}
              />
            </div>
            <div>
              <label className={styles.label}>
                {t("newCase.durationLabel")}
              </label>
              <input
                className={styles.input_surgery}
                type="number"
                placeholder="90"
                value={form.metrics.duration}
                onChange={(e) => setMetric("duration", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ─── Операционный план ────────────────────────────────────── */}
        <div className={`${styles.formSection} ${styles.fullWidth}`}>
          <h3 className={styles.cardTitle}>{t("info.plan")}</h3>
          <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>
            {t("newCase.planHint")}
          </p>
          <textarea
            className={styles.textarea}
            placeholder={t("newCase.planPlaceholder")}
            value={form.plan.text}
            onChange={(e) => set("plan", { text: e.target.value })}
            rows={5}
          />
        </div>
      </div>

      <div className={styles.formActions}>
        <button
          className={styles.btnSecondary}
          onClick={() => navigate("/dp/surgery")}
        >
          {t("newCase.cancel")}
        </button>
        <button
          className={styles.btnPrimary}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? t("newCase.creating") : t("tab.createCase")}
        </button>
      </div>
    </div>
  );
}
