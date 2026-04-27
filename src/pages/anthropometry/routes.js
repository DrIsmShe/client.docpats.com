import CasesListPage from "./pages/CasesListPage.jsx";
import CaseDetailPage from "./pages/CaseDetailPage.jsx";
import StudyDetailPage from "./pages/StudyDetailPage.jsx";
import PhotoAnnotationPage from "./pages/PhotoAnnotationPage.jsx";

/* ─── Роуты модуля antropometry ──────────────────────────────────
   Подключаются в App.jsx как вложенные роуты внутри /doctor/*.
   Пути здесь относительные (без префикса /doctor/anthropometry/).
   ──────────────────────────────────────────────────────────────── */

const anthropometryRoutes = [
  { path: "anthropometry/cases", element: <CasesListPage /> },
  { path: "anthropometry/cases/:caseId", element: <CaseDetailPage /> },
  { path: "anthropometry/studies/:studyId", element: <StudyDetailPage /> },
  {
    path: "anthropometry/photos/:photoId/annotate",
    element: <PhotoAnnotationPage />,
  },
];

export default anthropometryRoutes;
