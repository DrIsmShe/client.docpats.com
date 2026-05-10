import React, { useEffect, useState, useMemo, Suspense, lazy } from "react";
import axios from "axios";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

/* LAZY BLOCKS */

const AIConfidenceScoreBlock = lazy(
  () => import("../../components/ai/AIConfidenceScoreBlock"),
);

const RiskHeatmapBlock = lazy(
  () => import("../../components/ai/RiskHeatmapBlock"),
);

const ClinicalProgressionGraph = lazy(
  () => import("../../components/ai/ClinicalProgressionGraph"),
);

const DiagnosisProbabilityBars = lazy(
  () => import("../../components/ai/DiagnosisProbabilityBars"),
);

const DiagnosticInventoryBlock = lazy(
  () => import("../../components/ai/DiagnosticInventoryBlock"),
);

const ClinicalRiskBlock = lazy(
  () => import("../../components/ai/ClinicalRiskBlock"),
);

const ClinicalAlertsBlock = lazy(
  () => import("../../components/ai/ClinicalAlertsBlock"),
);

const PriorityRisksBlock = lazy(
  () => import("../../components/ai/PriorityRisksBlock"),
);

const ClinicalScoreBlock = lazy(
  () => import("../../components/ai/ClinicalScoreBlock"),
);

const PatientTimeline = lazy(
  () => import("../../components/ai/PatientTimeline"),
);

const DiseaseProbabilityBlock = lazy(
  () => import("../../components/ai/DiseaseProbabilityBlock"),
);

const DeteriorationBlock = lazy(
  () => import("../../components/ai/DeteriorationBlock"),
);

const PrognosisBlock = lazy(() => import("../../components/ai/PrognosisBlock"));

const ExplainabilityBlock = lazy(
  () => import("../../components/ai/ExplainabilityBlock"),
);

const DataCompletenessBlock = lazy(
  () => import("../../components/ai/DataCompletenessBlock"),
);

/* UI */

const Section = ({ title, items, text }) => (
  <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow mb-4">
    <h3 className="font-semibold mb-3">{title}</h3>

    {Array.isArray(items) && items.length > 0 && (
      <ul className="list-disc ms-3">
        {items.map((i, idx) => (
          <li key={idx}>{i}</li>
        ))}
      </ul>
    )}

    {text && <p>{text}</p>}
  </div>
);

const SeverityBadge = ({ level }) => {
  const { t } = useTranslation("PatientClinicalSummary");

  if (!level) return null;

  const colors = {
    low: "bg-green-200",
    moderate: "bg-yellow-200",
    high: "bg-red-200",
  };

  return (
    <div
      className={`inline-block px-3 py-2 rounded border ${
        colors[level] || "bg-gray-200"
      }`}
      style={{ color: "black" }}
    >
      <div style={{ fontWeight: 600 }}>
        {t("severity.title")} : {t(`severity.level.${level}`, level)}
      </div>

      <div style={{ fontSize: "0.85rem" }}>
        {t(`severity.description.${level}`)}
      </div>
    </div>
  );
};

export default function PatientClinicalSummary() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("PatientClinicalSummary");

  const API_BASE = process.env.REACT_APP_API_URL;

  const [patient, setPatient] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [aiMeta, setAiMeta] = useState(null);
  const [diagnosticInventory, setDiagnosticInventory] = useState(null);

  const [timelineEvents, setTimelineEvents] = useState([]);
  const [timelinePage, setTimelinePage] = useState(1);
  const [timelineTotalPages, setTimelineTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState(null);

  /* AUTH */

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get(`${API_BASE}/common-for-user`, {
          withCredentials: true,
        });

        if (!res.data.authenticated) navigate("/login");
      } catch {
        navigate("/login");
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [API_BASE, navigate]);

  /* LOAD DATA */

  useEffect(() => {
    if (authLoading) return;

    const load = async () => {
      try {
        setLoading(true);

        // ✅ Загружаем пациента — пробуем сначала обычный эндпоинт,
        // если 404 — пробуем приватный. Так покрываем оба типа пациентов.
        const loadPatient = async () => {
          try {
            const r = await axios.get(
              `${API_BASE}/clinic/patient-details/${id}`,
              { withCredentials: true },
            );
            return { ...r.data, _resolvedType: "registered" };
          } catch (err) {
            if (err?.response?.status !== 404) {
              // не 404 — это другая ошибка, пробрасываем
              throw err;
            }
            // 404 на обычном — пробуем приватного
            try {
              const r2 = await axios.get(
                `${API_BASE}/clinic/private-patient-details/${id}`,
                { withCredentials: true },
              );
              return {
                ...r2.data,
                _resolvedType: "private",
                isPrivate: true,
              };
            } catch (err2) {
              // Оба 404 — пациент действительно не найден
              if (err2?.response?.status === 404) return null;
              throw err2;
            }
          }
        };

        const [patientResult, summaryRes] = await Promise.allSettled([
          loadPatient(),
          axios.post(
            `${API_BASE}/ai/generate-clinical-summary/${id}`,
            { language: i18n.language },
            { withCredentials: true },
          ),
        ]);

        if (patientResult.status === "fulfilled" && patientResult.value) {
          setPatient(patientResult.value);
        }

        if (summaryRes.status === "fulfilled") {
          const data = summaryRes.value.data;

          setAiSummary(data.summary);
          setAiMeta(data.meta || null);

          setDiagnosticInventory(
            data.diagnosticInventory ||
              data.summary?.diagnosticInventory ||
              null,
          );
        }
      } catch {
        setError(t("errors.failedToGenerate"));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [API_BASE, id, i18n.language, authLoading, t]);

  /* TIMELINE */

  useEffect(() => {
    if (!aiSummary) return;

    const loadTimeline = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/ai/generate-clinical-summary/patient/${id}/timeline?page=${timelinePage}&limit=5`,
          { withCredentials: true },
        );

        setTimelineEvents(res.data.events || []);
        setTimelineTotalPages(res.data.totalPages || 1);
      } catch (err) {
        console.error("timeline error", err);
      }
    };

    loadTimeline();
  }, [timelinePage, aiSummary, id, API_BASE]);

  /* SUMMARY SECTIONS */

  const sections = useMemo(() => {
    if (!aiSummary) return [];

    return [
      {
        title: `🩺 ${t("sections.mainComplaints")}`,
        items: aiSummary.mainComplaints,
      },
      {
        title: `📋 ${t("sections.history")}`,
        text: aiSummary.historyOfPresentIllness,
      },
      {
        title: `🔍 ${t("sections.objective")}`,
        items: aiSummary.objectiveFindings,
      },
      {
        title: `❤️ ${t("sections.cardiovascular")}`,
        items: aiSummary.organSystems?.cardiovascular,
      },
      {
        title: `🫁 ${t("sections.respiratory")}`,
        items: aiSummary.organSystems?.respiratory,
      },
      {
        title: `🧠 ${t("sections.nervous")}`,
        items: aiSummary.organSystems?.nervous,
      },
      {
        title: `🦠 ${t("sections.gastrointestinal")}`,
        items: aiSummary.organSystems?.gastrointestinal,
      },
      {
        title: `🧬 ${t("sections.genitourinary")}`,
        items: aiSummary.organSystems?.genitourinary,
      },
      {
        title: `👃 ${t("sections.ent")}`,
        items: aiSummary.organSystems?.ent,
      },
      {
        title: `🧪 ${t("sections.laboratory")}`,
        items: aiSummary.keyDiagnostics?.labAbnormalities,
      },
    ];
  }, [aiSummary, t]);

  if (authLoading) return <div>{t("auth.checking")}...</div>;

  // ✅ Определение типа пациента — учитываем все возможные источники.
  // _resolvedType ставится при загрузке выше, isPrivate/patientType/type
  // могут прийти с бэка, linkedUserId === null — fallback для старых ответов.
  const isPrivatePatient =
    patient?._resolvedType === "private" ||
    patient?.isPrivate === true ||
    patient?.patientType === "private" ||
    patient?.type === "private" ||
    patient?.linkedUserId === null;

  const patientDetailPath = isPrivatePatient
    ? `/dp/private-patient-detail/${id}`
    : `/dp/patient-detail/${id}`;

  return (
    <div className="container py-4">
      {/* HEADER */}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">{t("titles.clinicalSummaryTitle")}</h1>

          {patient && (
            <p className="text-muted mb-0">
              {patient.firstName || patient.firstNameDecrypted || ""}{" "}
              {patient.lastName || patient.lastNameDecrypted || ""}
            </p>
          )}
        </div>

        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-secondary"
            onClick={() => navigate(-1)}
          >
            ← {t("buttons.backToPatient")}
          </button>

          <Link className="btn btn-outline-primary" to={patientDetailPath}>
            {t("buttons.openPatientCard")}
          </Link>
        </div>
      </div>

      {loading && <div>{t("buttons.generating")}...</div>}
      {error && <div className="alert alert-warning">{error}</div>}

      {!loading && aiSummary && (
        <>
          {/* SUMMARY */}

          <h4 className="mb-3">🩺 Patient clinical summary</h4>

          {sections.map((s, i) => (
            <Section key={i} {...s} />
          ))}

          <Suspense
            fallback={
              <div className="text-muted py-3">AI analysis loading...</div>
            }
          >
            {/* CLINICAL STATUS */}

            <h4 className="mt-5 mb-3">🚨 Clinical status</h4>

            <ClinicalScoreBlock summary={aiSummary} />

            <div className="mt-3 mb-3">
              <SeverityBadge level={aiSummary?.clinicalSeverity} />
            </div>

            {aiSummary?.clinicalAlerts?.length > 0 && (
              <ClinicalAlertsBlock alerts={aiSummary.clinicalAlerts} />
            )}

            <DeteriorationBlock summary={aiSummary} />

            {aiSummary?.priorityRisks?.length > 0 && (
              <PriorityRisksBlock risks={aiSummary.priorityRisks} />
            )}

            {/* DIAGNOSTIC */}

            <h4 className="mt-5 mb-3">🧠 Diagnostic analysis</h4>

            <DiagnosisProbabilityBars
              probabilities={aiSummary?.diseaseProbabilities}
            />

            {aiSummary?.diseaseProbabilities?.length > 0 && (
              <DiseaseProbabilityBlock
                probabilities={aiSummary.diseaseProbabilities}
              />
            )}

            {(aiSummary?.fullRiskAssessment || aiSummary?.riskAssessment) && (
              <ClinicalRiskBlock
                fullRiskAssessment={aiSummary.fullRiskAssessment}
                riskAssessment={aiSummary.riskAssessment}
              />
            )}

            {aiSummary?.prognosis?.length > 0 && (
              <PrognosisBlock prognosis={aiSummary.prognosis} />
            )}

            {aiSummary?.explainability && (
              <ExplainabilityBlock explainability={aiSummary.explainability} />
            )}

            {/* EVOLUTION */}

            <h4 className="mt-5 mb-3">📈 Disease progression</h4>

            <ClinicalProgressionGraph
              summary={aiSummary}
              timelineEvents={timelineEvents}
            />

            <PatientTimeline events={timelineEvents} />

            <div className="d-flex gap-2 mt-3">
              <button
                className="btn btn-outline-secondary"
                disabled={timelinePage <= 1}
                onClick={() => setTimelinePage((p) => Math.max(1, p - 1))}
              >
                ← Prev
              </button>

              <span className="px-3 py-2">
                Page {timelinePage} / {timelineTotalPages}
              </span>

              <button
                className="btn btn-outline-secondary"
                disabled={timelinePage >= timelineTotalPages}
                onClick={() =>
                  setTimelinePage((p) => Math.min(timelineTotalPages, p + 1))
                }
              >
                Next →
              </button>
            </div>

            {/* AI META */}

            <details className="mt-5">
              <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                🔬 AI analysis details
              </summary>

              <div className="mt-3">
                <AIConfidenceScoreBlock summary={aiSummary} meta={aiMeta} />

                <RiskHeatmapBlock summary={aiSummary} />

                {aiMeta && <DataCompletenessBlock meta={aiMeta} />}

                {diagnosticInventory && (
                  <DiagnosticInventoryBlock
                    diagnosticInventory={diagnosticInventory}
                  />
                )}
              </div>
            </details>
          </Suspense>
        </>
      )}
    </div>
  );
}
