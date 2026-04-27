// src/modules/dp/routes.jsx
import React from "react";

/* ==== Базовые страницы раздела ПОЛИКЛИНИКА ==== */
import Addpatient from "../../pages/polyclinic/Addpatient.jsx";
import SearchPatient from "../../pages/polyclinic/SearchPatient.jsx";
import AddPatientMedicalHistory from "../../pages/polyclinic/AddPatientMedicalHistory.jsx";

/* ==== Lab ==== */
import AddLabTest from "../../pages/lab/AddLabTest.jsx";

/* ==== CORONOGRAPHY ==== */
import AddCoronographyScanUpload from "../../pages/coronography/AddCoronographyScanUpload.jsx";
import CoronographyScanerDetails from "../../pages/coronography/CoronographyScanerDetails.jsx";
import CoronographyScanTemplateNameofexam from "../../pages/coronography/templates/CoronographyScanTemplateNameofexam.jsx";
import CoronographyScanTemplateReport from "../../pages/coronography/templates/CoronographyScanTemplateReport.jsx";
import CoronographyScanerTemplateDiagnosis from "../../pages/coronography/templates/CoronographyScanerTemplateDiagnosis.jsx";
import CoronographyScanerTemplateRecomendation from "../../pages/coronography/templates/CoronographyScanerTemplateRecomendation.jsx";
import CoronographyScanTemplateNameofexamList from "../../pages/coronography/templates/CoronographyScanTemplateNameofexamList.jsx";
import CoronographyScanerTemplateReportList from "../../pages/coronography/templates/CoronographyScanerTemplateReportList.jsx";
import CoronographyRScanerTemplateDiagnosisList from "../../pages/coronography/templates/CoronographyRScanerTemplateDiagnosisList.jsx";
import CoronographyScanerTemplateRecomendationList from "../../pages/coronography/templates/CoronographyScanerTemplateRecomendationList.jsx";
import CoronographyScanTemplateNameofexamEdit from "../../pages/coronography/templates/CoronographyScanTemplateNameofexamEdit.jsx";
import CoronographyScanerTemplateReportEdit from "../../pages/coronography/templates/CoronographyScanerTemplateReportEdit.jsx";
import CoronographyScanerTemplateDiagnosisEdit from "../../pages/coronography/templates/CoronographyScanerTemplateDiagnosisEdit.jsx";
import CoronographyScanerTemplateRecomendationEdit from "../../pages/coronography/templates/CoronographyScanerTemplateRecomendationEdit.jsx";
import CoronographyScanTemplateNameofexamDetail from "../../pages/coronography/templates/CoronographyScanTemplateNameofexamDetail.jsx";
import CoronographyScanerTemplateReportDetails from "../../pages/coronography/templates/CoronographyScanerTemplateReportDetails.jsx";
import CoronographyScanerTemplateDiagnosisDetails from "../../pages/coronography/templates/CoronographyScanerTemplateDiagnosisDetails.jsx";
import CoronographyScanerTemplateRecomendationDetails from "../../pages/coronography/templates/CoronographyScanerTemplateRecomendationDetails.jsx";

/* ==== ECHO EKG ==== */
import AddEchoEKGScanUpload from "../../pages/echoekg/AddEchoEKGScanUpload.jsx";
import EchoEKGScanerDetails from "../../pages/echoekg/EchoEKGScanerDetails.jsx";
import EchoEKGScanTemplateNameofexam from "../../pages/echoekg/templates/EchoEKGScanTemplateNameofexam.jsx";
import EchoEKGScanTemplateReport from "../../pages/echoekg/templates/EchoEKGScanTemplateReport.jsx";
import EchoEKGScanerTemplateDiagnosis from "../../pages/echoekg/templates/EchoEKGScanerTemplateDiagnosis.jsx";
import EchoEKGScanerTemplateRecomendation from "../../pages/echoekg/templates/EchoEKGScanerTemplateRecomendation.jsx";
import EchoEKGScanTemplateNameofexamList from "../../pages/echoekg/templates/EchoEKGScanTemplateNameofexamList.jsx";
import EchoEKGScanerTemplateReportList from "../../pages/echoekg/templates/EchoEKGScanerTemplateReportList.jsx";
import EchoEKGRScanerTemplateDiagnosisList from "../../pages/echoekg/templates/EchoEKGRScanerTemplateDiagnosisList.jsx";
import EchoEKGScanerTemplateRecomendationList from "../../pages/echoekg/templates/EchoEKGScanerTemplateRecomendationList.jsx";
import EchoEKGScanTemplateNameofexamEdit from "../../pages/echoekg/templates/EchoEKGScanTemplateNameofexamEdit.jsx";
import EchoEKGScanerTemplateReportEdit from "../../pages/echoekg/templates/EchoEKGScanerTemplateReportEdit.jsx";
import EchoEKGScanerTemplateDiagnosisEdit from "../../pages/echoekg/templates/EchoEKGScanerTemplateDiagnosisEdit.jsx";
import EchoEKGScanerTemplateRecomendationEdit from "../../pages/echoekg/templates/EchoEKGScanerTemplateRecomendationEdit.jsx";
import EchoEKGScanTemplateNameofexamDetail from "../../pages/echoekg/templates/EchoEKGScanTemplateNameofexamDetail.jsx";
import EchoEKGScanerTemplateReportDetails from "../../pages/echoekg/templates/EchoEKGScanerTemplateReportDetails.jsx";
import EchoEKGScanerTemplateDiagnosisDetails from "../../pages/echoekg/templates/EchoEKGScanerTemplateDiagnosisDetails.jsx";
import EchoEKGScanerTemplateRecomendationDetails from "../../pages/echoekg/templates/EchoEKGScanerTemplateRecomendationDetails.jsx";

/* ==== EKG ==== */
import AddEKGScanUpload from "../../pages/ekg/AddEKGScanUpload.jsx";
import EKGScanerDetails from "../../pages/ekg/EKGScanerDetails.jsx";
import EKGScanTemplateNameofexam from "../../pages/ekg/templates/EKGScanTemplateNameofexam.jsx";
import EKGScanTemplateReport from "../../pages/ekg/templates/EKGScanTemplateReport.jsx";
import EKGScanerTemplateDiagnosis from "../../pages/ekg/templates/EKGScanerTemplateDiagnosis.jsx";
import EKGScanerTemplateRecomendation from "../../pages/ekg/templates/EKGScanerTemplateRecomendation.jsx";
import EKGScanTemplateNameofexamList from "../../pages/ekg/templates/EKGScanTemplateNameofexamList.jsx";
import EKGScanerTemplateReportList from "../../pages/ekg/templates/EKGScanerTemplateReportList.jsx";
import EKGRScanerTemplateDiagnosisList from "../../pages/ekg/templates/EKGRScanerTemplateDiagnosisList.jsx";
import EKGScanerTemplateRecomendationList from "../../pages/ekg/templates/EKGScanerTemplateRecomendationList.jsx";
import EKGScanTemplateNameofexamEdit from "../../pages/ekg/templates/EKGScanTemplateNameofexamEdit.jsx";
import EKGScanerTemplateReportEdit from "../../pages/ekg/templates/EKGScanerTemplateReportEdit.jsx";
import EKGScanerTemplateDiagnosisEdit from "../../pages/ekg/templates/EKGScanerTemplateDiagnosisEdit.jsx";
import EKGScanerTemplateRecomendationEdit from "../../pages/ekg/templates/EKGScanerTemplateRecomendationEdit.jsx";
import EKGScanTemplateNameofexamDetail from "../../pages/ekg/templates/EKGScanTemplateNameofexamDetail.jsx";
import EKGScanerTemplateReportDetails from "../../pages/ekg/templates/EKGScanerTemplateReportDetails.jsx";
import EKGScanerTemplateDiagnosisDetails from "../../pages/ekg/templates/EKGScanerTemplateDiagnosisDetails.jsx";
import EKGScanerTemplateRecomendationDetails from "../../pages/ekg/templates/EKGScanerTemplateRecomendationDetails.jsx";

/* === ВАЖНО: по такому же принципу импортируешь остальные группы:
   Angiography, CapsuleEndoscopy, Gastroscopy, Dopler, Spirometry, HOLTER,
   Ginecology, EEG, SPECT, PET, XRAY, USM, CT, MRI и блоки временных шаблонов. === */
import Polyclinic from "./pages/polyclinic/polyclinic";
const dpRoutes = [
  /* БАЗОВЫЕ */
  { path: "polyclinic", element: <Polyclinic /> },
  { path: "add-patient-polyclinic", element: <Addpatient /> },
  { path: "search-patient-polyclinic", element: <SearchPatient /> },
  {
    path: "add-patient-medical-history/:id",
    element: <AddPatientMedicalHistory />,
  },

  /* LAB */
  { path: "add-labtest-results/:patientId", element: <AddLabTest /> },

  /* CORONOGRAPHY */
  {
    path: "add-coronography-scan-results/:patientId",
    element: <AddCoronographyScanUpload />,
  },
  {
    path: "details-coronography-scan-results/:id",
    element: <CoronographyScanerDetails />,
  },
  {
    path: "add-coronography-scan-template-nameofexam",
    element: <CoronographyScanTemplateNameofexam />,
  },
  {
    path: "add-coronography-scan-template-report",
    element: <CoronographyScanTemplateReport />,
  },
  {
    path: "add-coronography-scan-template-diagnosis",
    element: <CoronographyScanerTemplateDiagnosis />,
  },
  {
    path: "add-coronography-scan-template-recomandation",
    element: <CoronographyScanerTemplateRecomendation />,
  },
  {
    path: "list-coronography-scan-template-nameofexam/:id",
    element: <CoronographyScanTemplateNameofexamList />,
  },
  {
    path: "list-coronography-scan-template-report/:id",
    element: <CoronographyScanerTemplateReportList />,
  },
  {
    path: "list-coronography-scan-template-diagnosis/:id",
    element: <CoronographyRScanerTemplateDiagnosisList />,
  },
  {
    path: "list-coronography-scan-template-recomandation/:id",
    element: <CoronographyScanerTemplateRecomendationList />,
  },
  {
    path: "update-coronography-scan-template-nameofexam/:id",
    element: <CoronographyScanTemplateNameofexamEdit />,
  },
  {
    path: "update-coronography-scan-template-report/:id",
    element: <CoronographyScanerTemplateReportEdit />,
  },
  {
    path: "update-coronography-scan-template-diagnosis/:id",
    element: <CoronographyScanerTemplateDiagnosisEdit />,
  },
  {
    path: "update-coronography-scan-template-recomandation/:id",
    element: <CoronographyScanerTemplateRecomendationEdit />,
  },
  {
    path: "detail-coronography-scan-template-nameofexam/:id",
    element: <CoronographyScanTemplateNameofexamDetail />,
  },
  {
    path: "detail-coronography-scan-template-report/:id",
    element: <CoronographyScanerTemplateReportDetails />,
  },
  {
    path: "detail-coronography-scan-template-diagnosis/:id",
    element: <CoronographyScanerTemplateDiagnosisDetails />,
  },
  {
    path: "detail-coronography-scan-template-recomandation/:id",
    element: <CoronographyScanerTemplateRecomendationDetails />,
  },

  /* ECHO EKG */
  {
    path: "add-echo-ekg-scan-results/:patientId",
    element: <AddEchoEKGScanUpload />,
  },
  {
    path: "details-echo-ekg-scan-results/:id",
    element: <EchoEKGScanerDetails />,
  },
  {
    path: "add-echo-ekg-scan-template-nameofexam",
    element: <EchoEKGScanTemplateNameofexam />,
  },
  {
    path: "add-echo-ekg-scan-template-report",
    element: <EchoEKGScanTemplateReport />,
  },
  {
    path: "add-echo-ekg-scan-template-diagnosis",
    element: <EchoEKGScanerTemplateDiagnosis />,
  },
  {
    path: "add-echo-ekg-scan-template-recomandation",
    element: <EchoEKGScanerTemplateRecomendation />,
  },
  {
    path: "list-echo-ekg-scan-template-nameofexam/:id",
    element: <EchoEKGScanTemplateNameofexamList />,
  },
  {
    path: "list-echo-ekg-scan-template-report/:id",
    element: <EchoEKGScanerTemplateReportList />,
  },
  {
    path: "list-echo-ekg-scan-template-diagnosis/:id",
    element: <EchoEKGRScanerTemplateDiagnosisList />,
  },
  {
    path: "list-echo-ekg-scan-template-recomandation/:id",
    element: <EchoEKGScanerTemplateRecomendationList />,
  },
  {
    path: "update-echo-ekg-scan-template-nameofexam/:id",
    element: <EchoEKGScanTemplateNameofexamEdit />,
  },
  {
    path: "update-echo-ekg-scan-template-report/:id",
    element: <EchoEKGScanerTemplateReportEdit />,
  },
  {
    path: "update-echo-ekg-scan-template-diagnosis/:id",
    element: <EchoEKGScanerTemplateDiagnosisEdit />,
  },
  {
    path: "update-echo-ekg-scan-template-recomandation/:id",
    element: <EchoEKGScanerTemplateRecomendationEdit />,
  },
  {
    path: "detail-echo-ekg-scan-template-nameofexam/:id",
    element: <EchoEKGScanTemplateNameofexamDetail />,
  },
  {
    path: "detail-echo-ekg-scan-template-report/:id",
    element: <EchoEKGScanerTemplateReportDetails />,
  },
  {
    path: "detail-echo-ekg-scan-template-diagnosis/:id",
    element: <EchoEKGScanerTemplateDiagnosisDetails />,
  },
  {
    path: "detail-echo-ekg-scan-template-recomandation/:id",
    element: <EchoEKGScanerTemplateRecomendationDetails />,
  },

  /* EKG */
  { path: "add-ekg-scan-results/:patientId", element: <AddEKGScanUpload /> },
  { path: "details-ekg-scan-results/:id", element: <EKGScanerDetails /> },
  {
    path: "add-ekg-scan-template-nameofexam",
    element: <EKGScanTemplateNameofexam />,
  },
  { path: "add-ekg-scan-template-report", element: <EKGScanTemplateReport /> },
  {
    path: "add-ekg-scan-template-diagnosis",
    element: <EKGScanerTemplateDiagnosis />,
  },
  {
    path: "add-ekg-scan-template-recomandation",
    element: <EKGScanerTemplateRecomendation />,
  },
  {
    path: "list-ekg-scan-template-nameofexam/:id",
    element: <EKGScanTemplateNameofexamList />,
  },
  {
    path: "list-ekg-scan-template-report/:id",
    element: <EKGScanerTemplateReportList />,
  },
  {
    path: "list-ekg-scan-template-diagnosis/:id",
    element: <EKGRScanerTemplateDiagnosisList />,
  },
  {
    path: "list-ekg-scan-template-recomandation/:id",
    element: <EKGScanerTemplateRecomendationList />,
  },
  {
    path: "update-ekg-scan-template-nameofexam/:id",
    element: <EKGScanTemplateNameofexamEdit />,
  },
  {
    path: "update-ekg-scan-template-report/:id",
    element: <EKGScanerTemplateReportEdit />,
  },
  {
    path: "update-ekg-scan-template-diagnosis/:id",
    element: <EKGScanerTemplateDiagnosisEdit />,
  },
  {
    path: "update-ekg-scan-template-recomandation/:id",
    element: <EKGScanerTemplateRecomendationEdit />,
  },
  {
    path: "detail-ekg-scan-template-nameofexam/:id",
    element: <EKGScanTemplateNameofexamDetail />,
  },
  {
    path: "detail-ekg-scan-template-report/:id",
    element: <EKGScanerTemplateReportDetails />,
  },
  {
    path: "detail-ekg-scan-template-diagnosis/:id",
    element: <EKGScanerTemplateDiagnosisDetails />,
  },
  {
    path: "detail-ekg-scan-template-recomandation/:id",
    element: <EKGScanerTemplateRecomendationDetails />,
  },

  /* === ДАЛЕЕ ДОБАВЬ по шаблону:
     Angiography, Capsule Endoscopy, Gastroscopy, Dopler, Spirometry,
     HOLTER, Ginecology, EEG, SPECT, PET, XRAY, USM, CT, MRI,
     + блоки временных шаблонов/листов/деталей (Temp...) === */
];

export default dpRoutes;
