// src/components/PrivatePatientClinicalSummary.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import DiagnosticInventoryBlock from "../../components/ai/DiagnosticInventoryBlock";
import ClinicalRiskBlock from "../../components/ai/ClinicalRiskBlock.jsx";
import ClinicalAlertsBlock from "../../components/ai/ClinicalAlertsBlock";
import PriorityRisksBlock from "../../components/ai/PriorityRisksBlock.jsx";

import ClinicalScoreBlock from "../../components/ai/ClinicalScoreBlock";
import PatientTimeline from "../../components/ai/PatientTimeline";
import DiseaseProbabilityBlock from "../../components/ai/DiseaseProbabilityBlock";
import DeteriorationBlock from "../../components/ai/DeteriorationBlock";

import PrognosisBlock from "../../components/ai/PrognosisBlock";
import ExplainabilityBlock from "../../components/ai/ExplainabilityBlock";
import DataCompletenessBlock from "../../components/ai/DataCompletenessBlock";

const Section = ({ title, children }) => (
  <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow mb-4">
    <h3 className="font-semibold mb-3">{title}</h3>
    <div className="space-y-2">{children}</div>
  </div>
);

const SeverityBadge = ({ level }) => {
  const colors = {
    low: "bg-green-500",
    moderate: "bg-yellow-500",
    high: "bg-red-500",
  };

  if (!level) return null;

  return (
    <div
      className={`inline-block px-3 py-1 rounded text-white ${
        colors[level] || "bg-gray-500"
      }`}
    >
      Clinical Severity: {level}
    </div>
  );
};

export default function PrivatePatientClinicalSummary() {
  const { t, i18n } = useTranslation("patientDetail");
  const navigate = useNavigate();
  const { id } = useParams();

  const API_BASE = process.env.REACT_APP_API_URL;
  const [timelinePage, setTimelinePage] = useState(1);
  const [timelineTotalPages, setTimelineTotalPages] = useState(1);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [diagnosticInventory, setDiagnosticInventory] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [aiMeta, setAiMeta] = useState(null);
  const [patient, setPatient] = useState(null);

  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState(null);

  /* 1. Проверка авторизации */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get(`${API_BASE}/common-for-user`, {
          withCredentials: true,
        });

        if (!res.data.authenticated) {
          navigate("/login");
          return;
        }
      } catch (err) {
        navigate("/login");
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [API_BASE, navigate]);

  /* 2. Подгружаем пациента (для заголовка) */
  useEffect(() => {
    if (authLoading) return;

    const fetchPatient = async () => {
      try {
        const { data } = await axios.get(
          `${API_BASE}/clinic/private-patient-details/${id}`,
          { withCredentials: true },
        );
        setPatient(data);
      } catch (err) {
        console.error("Error loading patient:", err);
        setError(t("errors.patientNotFound") || "Patient not found");
      }
    };

    fetchPatient();
  }, [API_BASE, authLoading, id, t]);

  /* 3. Генерация клинического резюме при загрузке страницы */
  useEffect(() => {
    if (authLoading) return;

    const generate = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await axios.post(
          `${API_BASE}/ai/generate-clinical-summary/${id}`,
          { language: i18n.language },
          { withCredentials: true },
        );

        console.log("AI summary response:", res.data);

        setAiSummary(res.data.summary);
        setAiMeta(res.data.meta || null);

        // Если backend кладёт diagnosticInventory отдельно
        const di =
          res.data.diagnosticInventory ||
          res.data.summary?.diagnosticInventory ||
          null;

        console.log("DiagnosticInventory extracted:", di);
        setDiagnosticInventory(di);
      } catch (err) {
        console.error("AI summary error:", err);
        if (err.response?.status === 403 || err.response?.status === 400) {
          setError(err.response.data.message || "Недостаточно данных");
        } else {
          setError("Не удалось сформировать клиническое резюме.");
        }
      } finally {
        setLoading(false);
      }
    };

    generate();
  }, [API_BASE, id, i18n.language, authLoading]);

  if (authLoading) {
    return <div>Checking auth...</div>;
  }
  const isPrivatePatient =
    patient?.isPrivate ||
    patient?.type === "private" ||
    patient?.linkedUserId === null ||
    false;

  const patientDetailPath = isPrivatePatient
    ? `/dp/private-patient-detail/${id}`
    : `/dp/patient-detail/${id}`;
  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">
            {t("titles.clinicalSummaryTitle", "Клиническое резюме")}
          </h1>
          {patient && (
            <p className="text-muted mb-0">
              {patient.firstName} {patient.lastName}
            </p>
          )}
        </div>

        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-secondary"
            onClick={() => navigate(-1)}
          >
            ← {t("buttons.backToPatient", "Назад к пациенту")}
          </button>

          <Link
            className="btn btn-outline-primary"
            to={
              isPrivatePatient
                ? `/dp/private-patient-detail/${id}`
                : `/dp/patient-detail/${id}`
            }
          >
            {t("buttons.openPatientCard", "Открыть карту пациента")}
          </Link>
        </div>
      </div>

      {loading && (
        <div>{t("buttons.generating", "Формирование резюме")}...</div>
      )}

      {error && !loading && <div className="alert alert-warning">{error}</div>}

      {!loading && !error && !aiSummary && (
        <div className="alert alert-info">
          {t(
            "errors.noSummaryData",
            "Клиническое резюме не получено. Попробуйте позже.",
          )}
        </div>
      )}

      {!loading && aiSummary && (
        <div className="mt-3">
          {/* 🩺 Жалобы */}
          <Section title="🩺 Основные жалобы">
            <ul className="list-disc ms-3">
              {aiSummary?.mainComplaints?.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </Section>

          {/* 📋 История */}
          <Section title="📋 История заболевания">
            <p>{aiSummary?.historyOfPresentIllness}</p>
          </Section>

          {/* 🔍 Объективные данные */}
          <Section title="🔍 Объективные данные">
            <ul className="list-disc ms-3">
              {aiSummary?.objectiveFindings?.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </Section>

          {/* ❤️ Сердечно-сосудистая */}
          <Section title="❤️ Сердечно-сосудистая система">
            <ul className="list-disc ms-3">
              {aiSummary?.organSystems?.cardiovascular?.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </Section>

          {/* 🫁 Дыхательная */}
          <Section title="🫁 Дыхательная система">
            <ul className="list-disc ms-3">
              {aiSummary?.organSystems?.respiratory?.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </Section>

          {/* 🧠 Нервная */}
          <Section title="🧠 Нервная система">
            <ul className="list-disc ms-3">
              {aiSummary?.organSystems?.nervous?.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </Section>

          {/* 🦠 ЖКТ */}
          <Section title="🦠 Желудочно-кишечная система">
            <ul className="list-disc ms-3">
              {aiSummary?.organSystems?.gastrointestinal?.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </Section>

          {/* 🧬 Мочеполовая */}
          <Section title="🧬 Мочеполовая система">
            <ul className="list-disc ms-3">
              {aiSummary?.organSystems?.genitourinary?.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </Section>

          {/* 👃 ЛОР */}
          <Section title="👃 ЛОР">
            <ul className="list-disc ms-3">
              {aiSummary?.organSystems?.ent?.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </Section>

          {/* 📊 Ангиография */}
          <Section title="🩸 Ангиография">
            <ul className="list-disc ms-3">
              {aiSummary?.keyDiagnostics?.angiography?.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </Section>

          {/* 🖥 Лучевая диагностика */}
          <Section title="🖥 Лучевая диагностика">
            <ul className="list-disc ms-3">
              {aiSummary?.keyDiagnostics?.imagingSummary?.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </Section>

          {/* 🧪 Лаборатория */}
          <Section title="🧪 Лабораторные исследования">
            <ul className="list-disc ms-3">
              {aiSummary?.keyDiagnostics?.labAbnormalities?.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </Section>

          {/* 📈 Динамика */}
          <Section title="📈 Динамика">
            <ul className="list-disc ms-3">
              {aiSummary?.dynamics?.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </Section>

          {/* ⚠️ Факторы риска */}
          <Section title="⚠️ Факторы риска">
            <ul className="list-disc ms-3">
              {aiSummary?.riskFactors?.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </Section>

          {/* 📚 Фон */}
          <Section title="📚 Клинический фон">
            <ul className="list-disc ms-3">
              {aiSummary?.background?.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </Section>

          {/* 📌 Рекомендации */}
          <Section title="📌 Рекомендации по наблюдению">
            <ul className="list-disc ms-3">
              {aiSummary?.followUpRecommendations?.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </Section>

          {/* 🔥 Тяжесть */}
          <div className="mt-3">
            <SeverityBadge level={aiSummary?.clinicalSeverity} />
          </div>
        </div>
      )}

      {/* 🚨 Clinical alerts */}
      {aiSummary?.clinicalAlerts?.length > 0 && (
        <ClinicalAlertsBlock alerts={aiSummary.clinicalAlerts} />
      )}

      {/* 🔥 Priority risks */}
      {aiSummary?.priorityRisks?.length > 0 && (
        <PriorityRisksBlock risks={aiSummary.priorityRisks} />
      )}

      {/* ⚠️ Full risk map */}
      {(aiSummary?.fullRiskAssessment || aiSummary?.riskAssessment) && (
        <ClinicalRiskBlock
          fullRiskAssessment={aiSummary?.fullRiskAssessment}
          riskAssessment={aiSummary?.riskAssessment}
        />
      )}

      {/* 📊 Diagnostic inventory */}
      {diagnosticInventory && (
        <DiagnosticInventoryBlock diagnosticInventory={diagnosticInventory} />
      )}
      {!loading && aiSummary && (
        <div className="mt-3">
          {/* ... твои Section'ы ... */}

          {/* 🔥 Тяжесть */}
          <div className="mt-3">
            <SeverityBadge level={aiSummary?.clinicalSeverity} />
          </div>
        </div>
      )}
      {!loading && aiSummary && (
        <div className="mt-4">
          {/* 🧠 AI Clinical Score */}
          <ClinicalScoreBlock summary={aiSummary} />

          {/* 🔥 Clinical Severity */}
          <div className="mt-3">
            <SeverityBadge level={aiSummary?.clinicalSeverity} />
          </div>

          {/* 🚨 Clinical alerts */}
          {aiSummary?.clinicalAlerts?.length > 0 && (
            <ClinicalAlertsBlock alerts={aiSummary.clinicalAlerts} />
          )}

          {/* ⚠ Clinical deterioration */}
          <DeteriorationBlock summary={aiSummary} />

          {/* 🔥 Priority risks */}
          {aiSummary?.priorityRisks?.length > 0 && (
            <PriorityRisksBlock risks={aiSummary.priorityRisks} />
          )}

          {/* 🧬 Disease probability */}
          {aiSummary?.diseaseProbabilities?.length > 0 && (
            <DiseaseProbabilityBlock
              probabilities={aiSummary.diseaseProbabilities}
            />
          )}

          {/* ⚠ Full risk map */}
          {(aiSummary?.fullRiskAssessment || aiSummary?.riskAssessment) && (
            <ClinicalRiskBlock
              fullRiskAssessment={aiSummary?.fullRiskAssessment}
              riskAssessment={aiSummary?.riskAssessment}
            />
          )}

          {/* 📅 Patient timeline */}
          <PatientTimeline diagnosticInventory={diagnosticInventory} />

          {/* 📊 Diagnostic inventory */}
          {diagnosticInventory && (
            <DiagnosticInventoryBlock
              diagnosticInventory={diagnosticInventory}
            />
          )}
        </div>
      )}
    </div>
  );
}
