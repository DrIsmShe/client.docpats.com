import { lazy, Suspense } from "react";
import {
  Routes,
  Route,
  BrowserRouter,
  Navigate,
  useLocation,
} from "react-router-dom";
import AnalyticsRouteTracker from "./lib/AnalyticsRouteTracker";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { GlobalCallProvider } from "./pages/communication/context/GlobalCallProvider";
import { useCurrentUserId } from "./pages/communication/hooks/useCurrentUserId";
import GuideWidget from "./components/guide/GuideWidget";
import FontSizeControl from "./components/FontSizeControl";
// Рендерится вне <Routes> и вне Suspense — только обычный импорт (import/first
// здесь ошибка сборки, а lazy без границы Suspense сорвал бы первый рендер).
import UpcomingAppointmentBanner from "./components/shared/UpcomingAppointmentBanner";

const DoctorsAll = lazy(() => import("./pages/doctorProfilePages/shared/doctors/doctors"));

const DoctorArticlesForPatient = lazy(() => import("./pages/patientProfilePages/shared/doctors/doctorsArticles"));
const ArtislesFromDoctorsForPatient = lazy(() => import("./pages/patientProfilePages/shared/articles/ArticlesFromDoctorsForPatient.jsx"));
const DoctorDetails = lazy(() => import("./pages/doctorProfilePages/shared/doctors/doctorDetails"));
const DoctorDetail = lazy(() => import("./pages/patientProfilePages/shared/doctors/doctorDetails"));
const TempComplaintsList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templates/tempComplaintsList.jsx"));
const TempAnamnesisMorbiList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templates/tempAnamnesisMorbiList.jsx"));
const TempAnamnesisMorbiDetail = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templates/tempAnamnesisMorbiDetail.jsx"));
const TempAnamnesisVitaeList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templates/tempAnamnesisVitaeList.jsx"));
const TempAnamnesisVitaeDetail = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templates/TempAnamnesisVitaeDetail.jsx"));
const TempCScanerResultsList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templates/tempCScanerResultsList.jsx"));
const TempCScanerResultsDelail = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templates/tempCScanerResultsDelail.jsx"));
const TempMRIResultsList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templates/tempMRIResultsList.jsx"));
const TempMriResultsDeltail = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templates/tempMriResultsDeltail.jsx"));
const SearchPatient = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/searchPatient.jsx"));
const AddPatient = lazy(() => import("./pages/patientProfilePages/addPatient/addPatient.jsx"));
const SearchPatientFromPatient = lazy(() => import("./pages/patientProfilePages/addPatient/searchPatientFromPatient.jsx"));
const DeletePatientFromOffice = lazy(() => import("./pages/polyclinic/deletePatientFromOffice.jsx"));
const Notifications = lazy(() => import("./pages/patientProfilePages/Notifications.jsx"));

// Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎвЂєР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС› Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В РІР‚в„ўР вЂ™Р’В  Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎвЂєР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В
const Registration = lazy(() => import("./pages/auth/register/registration"));
const AuthLayout = lazy(() => import("./layoutes/authLayout/authLayout"));
const Login = lazy(() => import("./pages/auth/login/login"));
const Confirmationregister = lazy(() => import("./pages/auth/confirmationregister/confirmationregister"));
const Resetpassword = lazy(() => import("./pages/auth/resetpassword/resetpassword"));
const Resetpasswordchange = lazy(() => import("./pages/auth/resetpassword/resetpasswordchange"));
const Otpresetpasswordchange = lazy(() => import("./pages/auth/resetpassword/otpresetpasswordchange"));
const Pagenotfound = lazy(() => import("./pages/pagenotfound/pagenotfound"));

// Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎвЂєР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС› Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В РІР‚в„ўР вЂ™Р’В  Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎвЂєР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†Р вЂљРЎвЂќР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎвЂєР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎвЂєР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°

const DoctorpofileLayout = lazy(() => import("./layoutes/doctorprofileLayout/doctorprofileLayout"));
const ReferralCard = lazy(() => import("./components/shared/ReferralCard"));
const PricingCheckoutPage = lazy(() => import("./pages/payments/PricingCheckoutPage"));
const MockCheckoutPage = lazy(() => import("./pages/payments/MockCheckoutPage"));
// Подготовка к экзаменам (modules/education на бэкенде)
const ExamCatalogPage = lazy(() => import("./pages/education/ExamCatalogPage"));
const ExamProgramPage = lazy(() => import("./pages/education/ExamProgramPage"));
const ExamAttemptPage = lazy(() => import("./pages/education/ExamAttemptPage"));
const DoctorOnlyRoute = lazy(() => import("./pages/education/DoctorOnlyRoute"));
// Управление тестами — только из админ-панели (см. блок роутов admin).
const AdminExamImportPage = lazy(() => import("./pages/admin/education/AdminExamImportPage"));
const AdminExamReviewPage = lazy(() => import("./pages/admin/education/AdminExamReviewPage"));
const AdminExamProgramsPage = lazy(() => import("./pages/admin/education/AdminExamProgramsPage"));
const AdminExamCategoriesPage = lazy(() => import("./pages/admin/education/AdminExamCategoriesPage"));
// Тренажёр диагностики (modules/radiology на бэкенде). Зона /arena: внутри не
// только радиология, но и анализы с виртуальным пациентом, поэтому и раздел, и
// путь называются по сути, а не по первой станции. Имя «radiology» осталось в
// путях к файлам и в API — врачу оно нигде не показывается.
const ArenaHubPage = lazy(() => import("./pages/radiology/ArenaHubPage"));
const RadiologyReaderPage = lazy(() => import("./pages/radiology/RadiologyReaderPage"));
const LabReaderPage = lazy(() => import("./pages/radiology/LabReaderPage"));
const VirtualPatientReaderPage = lazy(() => import("./pages/radiology/VirtualPatientReaderPage"));
const ArenaDuelsPage = lazy(() => import("./pages/radiology/ArenaDuelsPage"));
const RadiologyLegacyRedirect = lazy(() => import("./pages/radiology/RadiologyLegacyRedirect"));
const AdminRadiologyCasesPage = lazy(() => import("./pages/admin/radiology/AdminRadiologyCasesPage"));
const AdminDocsPage = lazy(() => import("./pages/admin/docs/AdminDocsPage"));
const AdminLabCasesPage = lazy(() => import("./pages/admin/radiology/AdminLabCasesPage"));
const AdminVpCasesPage = lazy(() => import("./pages/admin/radiology/AdminVpCasesPage"));
const AdminArenaAnalyticsPage = lazy(() => import("./pages/admin/radiology/AdminArenaAnalyticsPage"));
// Диагностическая помощь (modules/diagnostics на бэкенде). НЕ путать с
// radiology выше: там учебная арена с выдуманными кейсами, здесь — материалы
// живых пациентов, другие коллекции и другая ответственность.
const DiagnosticsCasesPage = lazy(() => import("./pages/diagnostics/DiagnosticsCasesPage"));
const DiagnosticCasePage = lazy(() => import("./pages/diagnostics/DiagnosticCasePage"));
// Справочник кодов МКБ (server/modules/medicalCodes). Отдельная страница, а не
// только автокомплит в форме приёма: код часто нужно просто найти и скопировать
// в направление или выписку.
const MedicalCodesPage = lazy(() => import("./pages/medicalCodes/MedicalCodesPage"));
const EvidencePage = lazy(() => import("./pages/ebm/EvidencePage"));
const AdminBillingPage = lazy(() => import("./pages/admin/billing/AdminBillingPage"));
const TopDoctorsPage = lazy(() => import("./pages/public/TopDoctorsPage"));
const DocsPage = lazy(() => import("./pages/public/DocsPage"));
const DocsIndexPage = lazy(() => import("./pages/public/DocsIndexPage"));
const PaymentClaimPage = lazy(() => import("./pages/public/PaymentClaimPage"));
const HomeDoctorMainPage = lazy(() => import("./pages/doctorProfilePages/home/homeMainPage"));

const ProfileDoctorHomePage = lazy(() => import("./pages/doctorProfilePages/home/profileDoctorHomePage.jsx"));
const DoctorSchedule = lazy(() => import("./pages/doctorProfilePages/schedule/DoctorSchedule.jsx"));
const DoctorAppointment = lazy(() => import("./pages/doctorProfilePages/appointments/DoctorAppointmentsPage.jsx"));
const DoctorBookingPage = lazy(() => import("./pages/doctorProfilePages/appointments/DoctorBookingPage.jsx"));
const DoctorAppointmenDashboardt = lazy(() => import("./pages/doctorProfilePages/appointments/DoctorAppointmenDashboardt.jsx"));
const DoctorAppointmenBlackDates = lazy(() => import("./pages/doctorProfilePages/appointments/DoctorAppointmenBlackDates.jsx"));
const DoctorAppointmenAuditId = lazy(() => import("./pages/doctorProfilePages/appointments/DoctorAppointmenAuditId.jsx"));
const DoctorDashboardMain = lazy(() => import("./pages/doctorProfilePages/appointments/DoctorDashboardMain.jsx"));
const DoctorNotificationsPage = lazy(() => import("./pages/doctorProfilePages/notifications/DoctorNotificationsPage.jsx"));
const DoctorAppointmentsArchivePage = lazy(() => import("./pages/doctorProfilePages/appointments/DoctorAppointmentsArchivePage.jsx"));
const AuditTimelinesPage = lazy(() => import("./pages/doctorProfilePages/appointments/AuditTimelinesPage.jsx"));

const MyArticlesDoctor = lazy(() => import("./pages/doctorProfilePages/articles/myArticles"));
const SingleArticlePage = lazy(() => import("./pages/doctorProfilePages/shared/articles/singleArticle"));
const CreateMyArticleDoctor = lazy(() => import("./pages/doctorProfilePages/articles/createArticle"));
const EditMyArticleDoctor = lazy(() => import("./pages/doctorProfilePages/articles/editMyArticleDoctor"));
const ArtislesFromDoctors = lazy(() => import("./pages/doctorProfilePages/shared/articles/artislesFromDoctors"));
const DoctorArticles = lazy(() => import("./pages/doctorProfilePages/shared/doctors/doctorsArticles"));

const MyArticlesScientificDoctor = lazy(() => import("./pages/doctorProfilePages/articles/myArticlesScientific.jsx"));
const SingleArticleScientificPage = lazy(() => import("./pages/doctorProfilePages/shared/articles/singleArticleScientific.jsx"));
const CreateMyArticleScientificDoctor = lazy(() => import("./pages/doctorProfilePages/articles/createArticleScientific.jsx"));
const EditMyArticleScientificDoctor = lazy(() => import("./pages/doctorProfilePages/articles/editMyArticleScientificDoctor.jsx"));
const ArtislesScientificFromDoctors = lazy(() => import("./pages/doctorProfilePages/shared/articles/artislesScientificFromDoctors.jsx"));
const DoctorArticlesScientific = lazy(() => import("./pages/doctorProfilePages/shared/doctors/doctorsArticlesScientific"));

// Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎвЂєР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС› Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В РІР‚в„ўР вЂ™Р’В  Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎвЂєР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°
const AdminLayout = lazy(() => import("./layoutes/adminLayout/adminLyout"));
const HomeAdminMainPage = lazy(() => import("./pages/admin/dashboard/AdminHomeDashboard"));
const UsersListPage = lazy(() => import("./pages/admin/user/usersList.jsx"));
const AdminClinicsPage = lazy(() => import("./pages/admin/clinics/AdminClinicsPage.jsx"));
const AdminDashboardPage = lazy(() => import("./pages/admin/overview/AdminDashboardPage.jsx"));
const AdminAnalyticsPage = lazy(() => import("./pages/admin/analytics/AdminAnalyticsPage.jsx"));
const AdminAuditPage = lazy(() => import("./pages/admin/overview/AdminAuditPage.jsx"));
const AdminDoctorsPage = lazy(() => import("./pages/admin/entities/AdminDoctorsPage.jsx"));
const AdminDoctorsManagePage = lazy(() => import("./pages/admin/doctor/AdminDoctorsManagePage.jsx"));
const AdminVerificationPage = lazy(() => import("./pages/admin/ops/AdminVerificationPage.jsx"));
const AdminSecurityPage = lazy(() => import("./pages/admin/ops/AdminSecurityPage.jsx"));
const AdminReviewsPage = lazy(() => import("./pages/admin/ops/AdminReviewsPage.jsx"));
const AdminSystemPage = lazy(() => import("./pages/admin/ops/AdminSystemPage.jsx"));
const AdminFeaturesPage = lazy(() => import("./pages/admin/ops/AdminFeaturesPage.jsx"));
const AdminDatabasePage = lazy(() => import("./pages/admin/database/AdminDatabasePage.jsx"));
const UsersRoleUpdate = lazy(() => import("./pages/admin/user/UpdateUserRole.jsx"));
const BlockUser = lazy(() => import("./pages/admin/BlockUser"));
const DeleteUser = lazy(() => import("./pages/admin/handleDeleteUser"));
const UserDoctorDetailAdmintPage = lazy(() => import("./pages/admin/user/userDoctorDetailEditAdmin.jsx"));
const UserDetailInformGetDoktor = lazy(() => import("./pages/admin/user/userDetailInformGetDoktor.jsx"));
const CreateCategoryPage = lazy(() => import("./pages/admin/doctor/createCategories"));
const DoctorDetailEditPage = lazy(() => import("./pages/admin/doctor/DoctorDetailEditPage"));
const PatientDetailEditPage = lazy(() => import("./pages/admin/patient/PatientDetailEditPage"));
const UserDetailInformGetPatient = lazy(() => import("./pages/admin/patient/UserDetailInformGetPatient"));
const PolyclinicStatistic = lazy(() => import("./pages/admin/polyclinic/PolyclinicStatistic"));
const PolyclinicPatientDetail = lazy(() => import("./pages/admin/patient/PolyclinicPatientDetail"));
const PolyclinicPatientDelete = lazy(() => import("./pages/admin/patient/PolyclinicPatientDelete"));
const AdminExportCollection = lazy(() => import("./pages/admin/components/AdminExportCollection"));

// Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎвЂєР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС› Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В РІР‚в„ўР вЂ™Р’В  Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎвЂєР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В
const MainPolyclinicLayout = lazy(() => import("./layoutes/polyclinic/MainPolyclinicLayout"));
const Polyclinic = lazy(() => import("./pages/polyclinic/polyclinic"));
const Patientdetail = lazy(() => import("./pages/polyclinic/patientdetail"));
const PrivatePatientDetail = lazy(() => import("./pages/polyclinic/privatePatientDetail.jsx"));

const Addpatient = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/addpatientpolyclinic"));
const AddPatientMedicalHistory = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/addPatientMedicalHistory"));
const MedicalHistory = lazy(() => import("./pages/polyclinic/medicalHistory"));

// Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎвЂєР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС› Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎвЂєР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎвЂєР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В  Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В РІР‚в„ўР вЂ™Р’В¦ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІР‚С”Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎС™
const TempComplaints = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templates/tempComplaints"));
const ComplaintDetail = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templates/ComplaintDetail"));
const TempAnamnesisMorbi = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templates/tempAnamnesisMorbi"));
const TempAnamnesisVitae = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templates/tempAnamnesisVitae"));
const TempRecommendations = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templates/tempRecommendations"));
const TempStatusLocalis = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templates/tempStatusLocalis"));
const TempStatusPreasens = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templates/tempStatusPreasens"));
const TempMriResults = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templates/tempMriResults"));
const TempCScanerResults = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templates/tempCScanerResults"));
const TempUltrasoundResults = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templates/tempUltrasoundResults"));
const TempLaboratoryTestResults = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templates/tempLaboratoryTestResults"));

// Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎвЂєР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС› Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В РІР‚в„ўР вЂ™Р’В  Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎвЂєР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†Р вЂљРЎвЂќР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°
const PatientNotificationsMain = lazy(() => import("./pages/patientProfilePages/notifications/PatientNotificationsPage.jsx"));
const PatientAppointmentsMain = lazy(() => import("./pages/patientProfilePages/appointments/PatientAppointmentsMain.jsx"));
const PatientAppointmentsHistory = lazy(() => import("./pages/patientProfilePages/appointments/PatientAppointmentsHistory.jsx"));
const PatientsMyAppointment = lazy(() => import("./pages/patientProfilePages/appointments/PatientMyAppointmentsPage.jsx"));
const PatientAppointment = lazy(() => import("./pages/patientProfilePages/appointments/PatientAppointmentsPage.jsx"));
const PatientLayout = lazy(() => import("./layoutes/patientLayout/patientLayout"));
const HomePatientMainPage = lazy(() => import("./pages/patientProfilePages/home/HomePatientMainPage"));
const PatientHomePage = lazy(() => import("./pages/patientProfilePages/home/PatientHomePage.jsx"));
const SingleArticleForPatient = lazy(() => import("./pages/patientProfilePages/shared/articles/singleArticle"));
const DoctorsAllForPatient = lazy(() => import("./pages/patientProfilePages/shared/doctors/doctors"));
const AddEEGScanUpload = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/addExaminations/addEEGScanUpload.jsx"));
const EEGScanerDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EEGScanerTemplateAdd/EEGScanerDetails.jsx"));
const EEGScanTemplateNameofexam = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EEGScanerTemplateAdd/EEGScanTemplateNameofexam.jsx"));
const EEGScanerTemplateReport = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EEGScanerTemplateAdd/EEGScanerTemplateReport.jsx"));
const EEGScanerTemplateDiagnosis = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EEGScanerTemplateAdd/EEGScanerTemplateDiagnosis.jsx"));
const EEGScanerTemplateRecomendation = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EEGScanerTemplateAdd/EEGScanerTemplateRecomendation.jsx"));
const EEGScanTemplateNameofexamList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EEGScanerTemplateAdd/EEGScanTemplateNameofexamList.jsx"));
const EEGScanerTemplateReportList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EEGScanerTemplateAdd/EEGScanerTemplateReportList.jsx"));
const SPECTScanerTemplateDiagnosisList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/SPECTcanerTemplateAdd/SPECTScanerTemplateDiagnosisList.jsx"));
const EEGScanerTemplateDiagnosisList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EEGScanerTemplateAdd/EEGScanerTemplateDiagnosisList.jsx"));
const EEGScanTemplateNameofexamEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EEGScanerTemplateAdd/EEGScanTemplateNameofexamEdit.jsx"));
const EEGScanerTemplateReportEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EEGScanerTemplateAdd/EEGScanerTemplateReportEdit.jsx"));
const EEGScanerTemplateDiagnosisEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EEGScanerTemplateAdd/EEGScanerTemplateDiagnosisEdit.jsx"));
const EEGScanerTemplateRecomendationEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EEGScanerTemplateAdd/EEGScanerTemplateRecomendationEdit.jsx"));
const EEGScanTemplateNameofexamDetail = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EEGScanerTemplateAdd/EEGScanTemplateNameofexamDetail.jsx"));
const EEGScanerTemplateReportDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EEGScanerTemplateAdd/EEGScanerTemplateReportDetails.jsx"));
const EEGScanerTemplateDiagnosisDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EEGScanerTemplateAdd/EEGScanerTemplateDiagnosisDetails.jsx"));
const EEGScanerTemplateRecomendationDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EEGScanerTemplateAdd/EEGScanerTemplateRecomendationDetails.jsx"));
const AddSPECTScanUpload = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/addExaminations/addSPECTScanUpload.jsx"));
const SPECTScanerDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/SPECTcanerTemplateAdd/SPECTScanerDetails.jsx"));
const SPECTScanTemplateNameofexam = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/SPECTcanerTemplateAdd/SPECTScanTemplateNameofexam.jsx"));
const SPECTScanerTemplateReport = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/SPECTcanerTemplateAdd/SPECTScanerTemplateReport.jsx"));
const SPECTScanerTemplateDiagnosis = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/SPECTcanerTemplateAdd/SPECTScanerTemplateDiagnosis.jsx"));
const SPECTScanerTemplateRecomendation = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/SPECTcanerTemplateAdd/SPECTScanerTemplateRecomendation.jsx"));
const SPECTScanTemplateNameofexamList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/SPECTcanerTemplateAdd/SPECTScanTemplateNameofexamList.jsx"));
const SPECTScanerTemplateReportList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/SPECTcanerTemplateAdd/SPECTScanerTemplateReportList.jsx"));
const SPECTScanerTemplateRecomendationList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/SPECTcanerTemplateAdd/SPECTScanerTemplateRecomendationList.jsx"));
const SPECTScanTemplateNameofexamEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/SPECTcanerTemplateAdd/SPECTScanTemplateNameofexamEdit.jsx"));
const SPECTScanerTemplateReportEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/SPECTcanerTemplateAdd/SPECTScanerTemplateReportEdit.jsx"));
const SPECTScanerTemplateDiagnosisEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/SPECTcanerTemplateAdd/SPECTScanerTemplateDiagnosisEdit.jsx"));
const SPECTScanerTemplateRecomendationEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/SPECTcanerTemplateAdd/SPECTScanerTemplateRecomendationEdit.jsx"));
const SPECTScanTemplateNameofexamDetail = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/SPECTcanerTemplateAdd/SPECTScanTemplateNameofexamDetail.jsx"));
const SPECTScanerTemplateReportDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/SPECTcanerTemplateAdd/SPECTScanerTemplateReportDetails.jsx"));
const SPECTScanerTemplateDiagnosisDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/SPECTcanerTemplateAdd/SPECTScanerTemplateDiagnosisDetails.jsx"));
const SPECTScanerTemplateRecomendationDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/SPECTcanerTemplateAdd/SPECTScanerTemplateRecomendationDetails.jsx"));
const AddPETScanUpload = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/addExaminations/addPETScanUpload.jsx"));
const PETScanerDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/PETScanerTemplateAdd/PETScanerDetails.jsx"));
const PETScanTemplateNameofexam = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/PETScanerTemplateAdd/PETScanTemplateNameofexam.jsx"));
const PETScanerTemplateReport = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/PETScanerTemplateAdd/PETScanerTemplateReport.jsx"));
const PETScanerTemplateDiagnosis = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/PETScanerTemplateAdd/PETScanerTemplateDiagnosis.jsx"));
const PETScanerTemplateRecomendation = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/PETScanerTemplateAdd/PETScanerTemplateRecomendation.jsx"));
const PETScanTemplateNameofexamList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/PETScanerTemplateAdd/PETScanTemplateNameofexamList.jsx"));
const PETScanerTemplateReportList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/PETScanerTemplateAdd/PETScanerTemplateReportList.jsx"));
const PETScanerTemplateDiagnosisList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/PETScanerTemplateAdd/PETScanerTemplateDiagnosisList.jsx"));
const PETScanerTemplateRecomendationList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/PETScanerTemplateAdd/PETScanerTemplateRecomendationList.jsx"));
const PETScanTemplateNameofexamEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/PETScanerTemplateAdd/PETScanTemplateNameofexamEdit.jsx"));
const PETScanerTemplateReportEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/PETScanerTemplateAdd/PETScanerTemplateReportEdit.jsx"));
const PETScanerTemplateDiagnosisEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/PETScanerTemplateAdd/PETScanerTemplateDiagnosisEdit.jsx"));
const PETScanerTemplateRecomendationEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/PETScanerTemplateAdd/PETScanerTemplateRecomendationEdit.jsx"));
const PETScanTemplateNameofexamDetail = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/PETScanerTemplateAdd/PETScanTemplateNameofexamDetail.jsx"));
const PETScanerTemplateReportDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/PETScanerTemplateAdd/PETScanerTemplateReportDetails.jsx"));
const PETScanerTemplateDiagnosisDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/PETScanerTemplateAdd/PETScanerTemplateDiagnosisDetails.jsx"));
const PETScanerTemplateRecomendationDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/PETScanerTemplateAdd/PETScanerTemplateRecomendationDetails.jsx"));
const AddXRAYScanUpload = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/addExaminations/addXRAYScanUpload.jsx"));
const XRAYScanerDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/XRAYScanerTemplateAdd/XRAYScanerDetails.jsx"));
const XRAYScanTemplateNameofexam = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/XRAYScanerTemplateAdd/XRAYScanTemplateNameofexam.jsx"));
const XRAYScanerTemplateReport = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/XRAYScanerTemplateAdd/XRAYScanerTemplateReport.jsx"));
const XRAYScanerTemplateDiagnosis = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/XRAYScanerTemplateAdd/XRAYScanerTemplateDiagnosis.jsx"));
const XRAYScanerTemplateRecomendation = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/XRAYScanerTemplateAdd/XRAYScanerTemplateRecomendation.jsx"));
const XRAYScanTemplateNameofexamList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/XRAYScanerTemplateAdd/XRAYScanTemplateNameofexamList.jsx"));
const XRAYScanerTemplateReportList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/XRAYScanerTemplateAdd/XRAYScanerTemplateReportList.jsx"));
const XRAYScanerTemplateDiagnosisList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/XRAYScanerTemplateAdd/XRAYScanerTemplateDiagnosisList.jsx"));
const XRAYScanerTemplateRecomendationList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/XRAYScanerTemplateAdd/XRAYScanerTemplateRecomendationList.jsx"));
const XRAYScanTemplateNameofexamEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/XRAYScanerTemplateAdd/XRAYScanTemplateNameofexamEdit.jsx"));
const XRAYScanerTemplateReportEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/XRAYScanerTemplateAdd/XRAYScanerTemplateReportEdit.jsx"));
const XRAYScanerTemplateDiagnosisEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/XRAYScanerTemplateAdd/XRAYScanerTemplateDiagnosisEdit.jsx"));
const XRAYScanerTemplateRecomendationEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/XRAYScanerTemplateAdd/XRAYScanerTemplateRecomendationEdit.jsx"));
const XRAYScanTemplateNameofexamDetail = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/XRAYScanerTemplateAdd/XRAYScanTemplateNameofexamDetail.jsx"));
const XRAYScanerTemplateReportDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/XRAYScanerTemplateAdd/XRAYScanerTemplateReportDetails.jsx"));
const XRAYScanerTemplateDiagnosisDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/XRAYScanerTemplateAdd/XRAYScanerTemplateDiagnosisDetails.jsx"));
const XRAYScanerTemplateRecomendationDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/XRAYScanerTemplateAdd/XRAYScanerTemplateRecomendationDetails.jsx"));
const AddUSMScanUpload = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/addExaminations/addUSMScanUpload.jsx"));
const USMScanerDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/USMScanerTemplateAdd/USMScanerDetails.jsx"));
const USMScanTemplateNameofexamList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/USMScanerTemplateAdd/USMScanerTemplateNameofexamList.jsx"));
const USMScanerTemplateReportList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/USMScanerTemplateAdd/USMScanerTemplateReportList.jsx"));
const USMScanerTemplateDiagnosisList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/USMScanerTemplateAdd/USMScanerTemplateDiagnosisList.jsx"));
const USMScanerTemplateRecomendationList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/USMScanerTemplateAdd/USMScanerTemplateRecomendationList.jsx"));
const USMScanTemplateNameofexam = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/USMScanerTemplateAdd/USMScanerTemplateNameofexam.jsx"));
const USMScanTemplateReport = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/USMScanerTemplateAdd/USMScanerTemplateReport.jsx"));
const USMScanerTemplateDiagnosis = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/USMScanerTemplateAdd/USMScanerTemplateDiagnosis.jsx"));
const USMScanerTemplateRecomendation = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/USMScanerTemplateAdd/USMScanerTemplateRecomendation.jsx"));
const USMScanTemplateNameofexamEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/USMScanerTemplateAdd/USMScanerTemplateNameofexamEdit.jsx"));
const USMScanerTemplateReportEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/USMScanerTemplateAdd/USMScanerTemplateReportEdit.jsx"));
const USMScanerTemplateDiagnosisEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/USMScanerTemplateAdd/USMScanerTemplateDiagnosisEdit.jsx"));
const USMScanerTemplateRecomendationEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/USMScanerTemplateAdd/USMScanerTemplateRecomendationEdit.jsx"));
const USMScanerTemplateRecomendationDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/USMScanerTemplateAdd/USMScanerTemplateRecomendationDetails.jsx"));
const USMScanerTemplateReportDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/USMScanerTemplateAdd/USMScanerTemplateReportDetails.jsx"));
const USMScanerTemplateDiagnosisDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/USMScanerTemplateAdd/USMScanerTemplateDiagnosisDetails.jsx"));
const AddCTScanUpload = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/addExaminations/addCTScanUpload.jsx"));
const CTScanerDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CTScanerTemplateAdd/CTScanerDetails.jsx"));
const CTScanTemplateNameofexam = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CTScanerTemplateAdd/CTScanTemplateNameofexam.jsx"));
const CTScanerTemplateReport = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CTScanerTemplateAdd/CTScanerTemplateReport.jsx"));
const CTScanerTemplateDiagnosis = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CTScanerTemplateAdd/CTScanerTemplateDiagnosis.jsx"));
const CTScanerTemplateRecomendation = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CTScanerTemplateAdd/CTScanerTemplateRecomendation.jsx"));
const CTScanTemplateNameofexamList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CTScanerTemplateAdd/CTScanTemplateNameofexamList.jsx"));
const CTScanerTemplateReportList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CTScanerTemplateAdd/CTScanerTemplateReportList.jsx"));
const CTScanerTemplateDiagnosisList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CTScanerTemplateAdd/CTScanerTemplateDiagnosisList.jsx"));
const CTScanerTemplateRecomendationList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CTScanerTemplateAdd/CTScanerTemplateRecomendationList.jsx"));
const CTScanTemplateNameofexamEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CTScanerTemplateAdd/CTScanTemplateNameofexamEdit.jsx"));
const CTScanerTemplateReportEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CTScanerTemplateAdd/CTScanerTemplateReportEdit.jsx"));
const CTScanerTemplateDiagnosisEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CTScanerTemplateAdd/CTScanerTemplateDiagnosisEdit.jsx"));
const CTScanerTemplateRecomendationEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CTScanerTemplateAdd/CTScanerTemplateRecomendationEdit.jsx"));
const CTScanTemplateNameofexamDetail = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CTScanerTemplateAdd/CTScanTemplateNameofexamDetail.jsx"));
const CTScanerTemplateReportDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CTScanerTemplateAdd/CTScanerTemplateReportDetails.jsx"));
const CTScanerTemplateDiagnosisDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CTScanerTemplateAdd/CTScanerTemplateDiagnosisDetails.jsx"));
const CTScanerTemplateRecomendationDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CTScanerTemplateAdd/CTScanerTemplateRecomendationDetails.jsx"));
const AddMRIScanUpload = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/addExaminations/addMRIScanUpload.jsx"));
const MRIScanerDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/MRIScanerTemplateAdd/MRIScanerDetails.jsx"));
const MRIScanTemplateNameofexam = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/MRIScanerTemplateAdd/MRIScanTemplateNameofexam.jsx"));
const MRIScanerTemplateReport = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/MRIScanerTemplateAdd/MRIScanerTemplateReport.jsx"));
const MRIScanerTemplateDiagnosis = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/MRIScanerTemplateAdd/MRIScanerTemplateDiagnosis.jsx"));
const MRIScanerTemplateRecomendation = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/MRIScanerTemplateAdd/MRIScanerTemplateRecomendation.jsx"));
const MRIScanTemplateNameofexamList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/MRIScanerTemplateAdd/MRIScanTemplateNameofexamList.jsx"));
const MRIScanerTemplateReportList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/MRIScanerTemplateAdd/MRIScanerTemplateReportList.jsx"));
const MRIScanerTemplateDiagnosisList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/MRIScanerTemplateAdd/MRIScanerTemplateDiagnosisList.jsx"));
const MRIScanerTemplateRecomendationList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/MRIScanerTemplateAdd/MRIScanerTemplateRecomendationList.jsx"));
const MRIScanTemplateNameofexamEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/MRIScanerTemplateAdd/MRIScanTemplateNameofexamEdit.jsx"));
const MRIScanerTemplateReportEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/MRIScanerTemplateAdd/MRIScanerTemplateReportEdit.jsx"));
const MRIScanerTemplateDiagnosisEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/MRIScanerTemplateAdd/MRIScanerTemplateDiagnosisEdit.jsx"));
const MRIScanerTemplateRecomendationEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/MRIScanerTemplateAdd/MRIScanerTemplateRecomendationEdit.jsx"));
const MRIScanTemplateNameofexamDetail = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/MRIScanerTemplateAdd/MRIScanTemplateNameofexamDetail.jsx"));
const MRIScanerTemplateReportDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/MRIScanerTemplateAdd/MRIScanerTemplateReportDetails.jsx"));
const MRIScanerTemplateDiagnosisDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/MRIScanerTemplateAdd/MRIScanerTemplateDiagnosisDetails.jsx"));
const MRIScanerTemplateRecomendationDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/MRIScanerTemplateAdd/MRIScanerTemplateRecomendationDetails.jsx"));
const TempAdditionalDiagnosis = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templates/tempAdditionalDiagnosis.jsx"));
const TempAdditionalDiagnosisList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templates/tempAdditionalDiagnosisList.jsx"));
const TempAdditionalDiagnosisDetail = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templates/tempAdditionalDiagnosisDetail.jsx"));
const TempLaboratoryResultsDetail = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templates/tempLaboratoryResultsDetail.jsx"));
const TempUltrasoundResultsList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templates/tempUltrasoundResultsList.jsx"));
const TempLaboratoryResultsList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templates/tempLaboratoryResultsList.jsx"));
const TempRecommendationsList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templates/tempRecommendationsList.jsx"));
const TempStatusPreasensList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templates/tempStatusPreasensList.jsx"));
const TempStatusPreasensDetail = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templates/tempStatusPreasensDetail.jsx"));
const TempRecommendationsDetail = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templates/tempRecommendationsDetail.jsx"));
const TempUltrasoundResultsDetail = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templates/tempUltrasoundResultsDetail.jsx"));
const TempStatusLocalisDetail = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templates/tempStatusLocalisDetail.jsx"));
const TempStatusLocalisList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templates/tempStatusLocalisList.jsx"));
const AddGinecologyUpload = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/addExaminations/addGinecologyUpload.jsx"));
const GinecologyDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/GinecologyTemplateAdd/GinecologyDetails.jsx"));
const GinecologyTemplateNameofexam = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/GinecologyTemplateAdd/GinecologyTemplateNameofexam.jsx"));
const GinecologyTemplateReport = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/GinecologyTemplateAdd/GinecologyTemplateReport.jsx"));
const GinecologyTemplateDiagnosis = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/GinecologyTemplateAdd/GinecologyTemplateDiagnosis.jsx"));
const GinecologyTemplateRecomendation = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/GinecologyTemplateAdd/GinecologyTemplateRecomendation.jsx"));
const GinecologyTemplateNameofexamList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/GinecologyTemplateAdd/GinecologyTemplateNameofexamList.jsx"));
const GinecologyTemplateReportList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/GinecologyTemplateAdd/GinecologyTemplateReportList.jsx"));
const GinecologyTemplateDiagnosisList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/GinecologyTemplateAdd/GinecologyTemplateDiagnosisList.jsx"));
const GinecologyTemplateRecomendationList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/GinecologyTemplateAdd/GinecologyTemplateRecomendationList.jsx"));
const GinecologyTemplateNameofexamEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/GinecologyTemplateAdd/GinecologyTemplateNameofexamEdit.jsx"));
const GinecologyTemplateDiagnosisEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/GinecologyTemplateAdd/GinecologyTemplateDiagnosisEdit.jsx"));
const GinecologyTemplateReportEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/GinecologyTemplateAdd/GinecologyTemplateReportEdit.jsx"));
const GinecologyTemplateRecomendationEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/GinecologyTemplateAdd/GinecologyTemplateRecomendationEdit.jsx"));
const GinecologyTemplateNameofexamDetail = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/GinecologyTemplateAdd/GinecologyTemplateNameofexamDetail.jsx"));
const GinecologyTemplateReportDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/GinecologyTemplateAdd/GinecologyTemplateReportDetails.jsx"));
const GinecologyTemplateDiagnosisDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/GinecologyTemplateAdd/GinecologyTemplateDiagnosisDetails.jsx"));
const GinecologyTemplateRecomendationDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/GinecologyTemplateAdd/GinecologyTemplateRecomendationDetails.jsx"));
const AddHOLTERScanUpload = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/addExaminations/addHOLTERScanUpload.jsx"));
const HOLTERScanerDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/HOLTERScanerTemplateAdd/HOLTERScanerDetails.jsx"));
const HOLTERScanTemplateNameofexam = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/HOLTERScanerTemplateAdd/HOLTERScanerTemplateNameofexam.jsx"));
const HOLTERScanTemplateReport = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/HOLTERScanerTemplateAdd/HOLTERScanerTemplateReport.jsx"));
const HOLTERScanerTemplateDiagnosis = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/HOLTERScanerTemplateAdd/HOLTERScanerTemplateDiagnosis.jsx"));
const HOLTERScanerTemplateRecomendation = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/HOLTERScanerTemplateAdd/HOLTERScanerTemplateRecomendation.jsx"));
const HOLTERScanTemplateNameofexamList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/HOLTERScanerTemplateAdd/HOLTERScanerTemplateNameofexamList.jsx"));
const HOLTERScanerTemplateReportList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/HOLTERScanerTemplateAdd/HOLTERScanerTemplateReportList.jsx"));
const HOLTERScanerTemplateDiagnosisList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/HOLTERScanerTemplateAdd/HOLTERScanerTemplateDiagnosisList.jsx"));
const EEGScanerTemplateRecomendationList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EEGScanerTemplateAdd/EEGScanerTemplateRecomendationList.jsx"));
const HOLTERScanerTemplateRecomendationList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/HOLTERScanerTemplateAdd/HOLTERScanerTemplateRecomendationList.jsx"));
const HOLTERScanTemplateNameofexamEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/HOLTERScanerTemplateAdd/HOLTERScanerTemplateNameofexamEdit.jsx"));
const HOLTERScanerTemplateReportEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/HOLTERScanerTemplateAdd/HOLTERScanerTemplateReportEdit.jsx"));
const HOLTERScanerTemplateDiagnosisEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/HOLTERScanerTemplateAdd/HOLTERScanerTemplateDiagnosisEdit.jsx"));
const HOLTERScanerTemplateRecomendationEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/HOLTERScanerTemplateAdd/HOLTERScanerTemplateRecomendationEdit.jsx"));
const HOLTERScanTemplateNameofexamDetail = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/HOLTERScanerTemplateAdd/HOLTERScanerTemplateNameofexamDetail.jsx"));
const HOLTERScanerTemplateReportDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/HOLTERScanerTemplateAdd/HOLTERScanerTemplateReportDetails.jsx"));
const HOLTERScanerTemplateDiagnosisDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/HOLTERScanerTemplateAdd/HOLTERScanerTemplateDiagnosisDetails.jsx"));
const HOLTERScanerTemplateRecomendationDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/HOLTERScanerTemplateAdd/HOLTERScanerTemplateRecomendationDetails.jsx"));
const AddSpirometryScanUpload = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/addExaminations/addSpirometryScanUpload.jsx"));
const SpirometryScanerDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/SpirometryScanerTemplateAdd/SpirometryScanerDetails.jsx"));
const SpirometryScanTemplateNameofexam = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/SpirometryScanerTemplateAdd/SpirometryScanTemplateNameofexam.jsx"));
const SpirometryScanerTemplateReport = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/SpirometryScanerTemplateAdd/SpirometryScanerTemplateReport.jsx"));
const SpirometryScanerTemplateDiagnosis = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/SpirometryScanerTemplateAdd/SpirometryScanerTemplateDiagnosis.jsx"));
const SpirometryScanerTemplateRecomendation = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/SpirometryScanerTemplateAdd/SpirometryScanerTemplateRecomendation.jsx"));
const SpirometryScanTemplateNameofexamList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/SpirometryScanerTemplateAdd/SpirometryScanTemplateNameofexamList.jsx"));
const SpirometryScanerTemplateReportList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/SpirometryScanerTemplateAdd/SpirometryScanerTemplateReportList.jsx"));
const SpirometryScanerTemplateDiagnosisList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/SpirometryScanerTemplateAdd/SpirometryScanerTemplateDiagnosisList.jsx"));
const SpirometryScanerTemplateRecomendationList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/SpirometryScanerTemplateAdd/SpirometryScanerTemplateRecomendationList.jsx"));
const SpirometryScanTemplateNameofexamEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/SpirometryScanerTemplateAdd/SpirometryScanTemplateNameofexamEdit.jsx"));
const SpirometryScanerTemplateReportEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/SpirometryScanerTemplateAdd/SpirometryScanerTemplateReportEdit.jsx"));
const SpirometryScanerTemplateDiagnosisEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/SpirometryScanerTemplateAdd/SpirometryScanerTemplateDiagnosisEdit.jsx"));
const SpirometryScanerTemplateRecomendationEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/SpirometryScanerTemplateAdd/SpirometryScanerTemplateRecomendationEdit.jsx"));
const SpirometryScanTemplateNameofexamDetail = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/SpirometryScanerTemplateAdd/SpirometryScanTemplateNameofexamDetail.jsx"));
const SpirometryScanerTemplateReportDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/SpirometryScanerTemplateAdd/SpirometryScanerTemplateReportDetails.jsx"));
const SpirometryScanerTemplateDiagnosisDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/SpirometryScanerTemplateAdd/SpirometryScanerTemplateDiagnosisDetails.jsx"));
const SpirometryScanerTemplateRecomendationDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/SpirometryScanerTemplateAdd/SpirometryScanerTemplateRecomendationDetails.jsx"));
const AddDoplerScanUpload = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/addExaminations/addDoplerScanUpload.jsx"));
const DopleryScanerDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/DoplerScanerTemplateAdd/DoplerScanerDetails.jsx"));
const DoplerScanTemplateNameofexam = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/DoplerScanerTemplateAdd/DoplerScanTemplateNameofexam.jsx"));
const DoplerScanerTemplateReport = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/DoplerScanerTemplateAdd/DoplerScanerTemplateReport.jsx"));
const DoplerScanerTemplateDiagnosis = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/DoplerScanerTemplateAdd/DoplerScanerTemplateDiagnosis.jsx"));
const DoplerScanerTemplateRecomendation = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/DoplerScanerTemplateAdd/DoplerScanerTemplateRecomendation.jsx"));
const DoplerScanTemplateNameofexamList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/DoplerScanerTemplateAdd/DoplerScanTemplateNameofexamList.jsx"));
const DoplerScanerTemplateReportList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/DoplerScanerTemplateAdd/DoplerScanerTemplateReportList.jsx"));
const DoplerScanerTemplateDiagnosisList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/DoplerScanerTemplateAdd/DoplerScanerTemplateDiagnosisList.jsx"));
const DoplerScanerTemplateRecomendationList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/DoplerScanerTemplateAdd/DoplerScanerTemplateRecomendationList.jsx"));
const DoplerScanTemplateNameofexamEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/DoplerScanerTemplateAdd/DoplerScanTemplateNameofexamEdit.jsx"));
const DoplerScanerTemplateReportEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/DoplerScanerTemplateAdd/DoplerScanerTemplateReportEdit.jsx"));
const DoplerScanerTemplateDiagnosisEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/DoplerScanerTemplateAdd/DoplerScanerTemplateDiagnosisEdit.jsx"));
const DoplerScanerTemplateRecomendationEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/DoplerScanerTemplateAdd/DoplerScanerTemplateRecomendationEdit.jsx"));
const DoplerScanTemplateNameofexamDetail = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/DoplerScanerTemplateAdd/DoplerScanTemplateNameofexamDetail.jsx"));
const DoplerScanerTemplateReportDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/DoplerScanerTemplateAdd/DoplerScanerTemplateReportDetails.jsx"));
const DoplerScanerTemplateRecomendationDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/DoplerScanerTemplateAdd/DoplerScanerTemplateRecomendationDetails.jsx"));
const DoplerScanerTemplateDiaqnosisDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/DoplerScanerTemplateAdd/DoplerScanerTemplateDiagnosisDetails.jsx"));
const AddGastroscopyScanUpload = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/addExaminations/addGastroscopyScanUpload.jsx"));
const GastroscopyScanerDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/GastroscopyScanerTemplateAdd/GastroscopyScanerDetails.jsx"));
const GastroscopyScanTemplateNameofexam = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/GastroscopyScanerTemplateAdd/GastroscopyScanTemplateNameofexam.jsx"));
const GastroscopyScanerTemplateReport = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/GastroscopyScanerTemplateAdd/GastroscopyScanerTemplateReport.jsx"));
const GastroscopyScanerTemplateDiagnosis = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/GastroscopyScanerTemplateAdd/GastroscopyScanerTemplateDiagnosis.jsx"));
const GastroscopyScanerTemplateRecomendation = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/GastroscopyScanerTemplateAdd/GastroscopyScanerTemplateRecomendation.jsx"));
const GastroscopyScanTemplateNameofexamList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/GastroscopyScanerTemplateAdd/GastroscopyScanTemplateNameofexamList.jsx"));
const GastroscopyScanerTemplateDiagnosisList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/GastroscopyScanerTemplateAdd/GastroscopyScanerTemplateDiagnosisList.jsx"));
const GastroscopyScanerTemplateRecomendationList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/GastroscopyScanerTemplateAdd/GastroscopyScanerTemplateRecomendationList.jsx"));
const GastroscopyScanTemplateNameofexamEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/GastroscopyScanerTemplateAdd/GastroscopyScanTemplateNameofexamEdit.jsx"));
const GastroscopyScanerTemplateReportEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/GastroscopyScanerTemplateAdd/GastroscopyScanerTemplateReportEdit.jsx"));
const GastroscopyScanerTemplateDiagnosisEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/GastroscopyScanerTemplateAdd/GastroscopyScanerTemplateDiagnosisEdit.jsx"));
const GastroscopyScanerTemplateRecomendationEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/GastroscopyScanerTemplateAdd/GastroscopyScanerTemplateRecomendationEdit.jsx"));
const GastroscopyScanTemplateNameofexamDetail = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/GastroscopyScanerTemplateAdd/GastroscopyScanTemplateNameofexamDetail.jsx"));
const GastroscopyScanerTemplateReportDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/GastroscopyScanerTemplateAdd/GastroscopyScanerTemplateReportDetails.jsx"));
const GastroscopyScanerTemplateDiagnosisDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/GastroscopyScanerTemplateAdd/GastroscopyScanerTemplateDiagnosisDetails.jsx"));
const GastroscopyScanerTemplateRecomendationDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/GastroscopyScanerTemplateAdd/GastroscopyScanerTemplateRecomendationDetails.jsx"));
const AddCapsulEndoscopyScanUpload = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/addExaminations/addCapsulEndoscopyScanUpload.jsx"));
const CapsuleEndoscopyScanerDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CapsuleEndoscopyScanerTemplateAdd/CapsuleEndoscopyScanerDetails.jsx"));
const CapsuleEndoscopyScanTemplateNameofexam = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CapsuleEndoscopyScanerTemplateAdd/CapsuleEndoscopyScanTemplateNameofexam.jsx"));
const CapsuleEndoscopyScanerTemplateReport = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CapsuleEndoscopyScanerTemplateAdd/CapsuleEndoscopyScanerTemplateReport.jsx"));
const CapsuleEndoscopyScanerTemplateDiagnosis = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CapsuleEndoscopyScanerTemplateAdd/CapsuleEndoscopyScanerTemplateDiagnosis.jsx"));
const CapsuleEndoscopyScanerTemplateRecomendation = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CapsuleEndoscopyScanerTemplateAdd/CapsuleEndoscopyScanerTemplateRecomendation.jsx"));
const CapsuleEndoscopyScanTemplateNameofexamList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CapsuleEndoscopyScanerTemplateAdd/CapsuleEndoscopyScanTemplateNameofexamList.jsx"));
const CapsuleEndoscopyScanerTemplateReportList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CapsuleEndoscopyScanerTemplateAdd/CapsuleEndoscopyScanerTemplateReportList.jsx"));
const CapsuleEndoscopyScanerTemplateDiagnosisList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CapsuleEndoscopyScanerTemplateAdd/CapsuleEndoscopyScanerTemplateDiagnosisList.jsx"));
const CapsuleEndoscopyScanTemplateNameofexamEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CapsuleEndoscopyScanerTemplateAdd/CapsuleEndoscopyScanTemplateNameofexamEdit.jsx"));
const CapsuleEndoscopyScanerTemplateReportEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CapsuleEndoscopyScanerTemplateAdd/CapsuleEndoscopyScanerTemplateReportEdit.jsx"));
const CapsuleEndoscopyScanerTemplateDiagnosisEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CapsuleEndoscopyScanerTemplateAdd/CapsuleEndoscopyScanerTemplateDiagnosisEdit.jsx"));
const CapsuleEndoscopyScanTemplateNameofexamDetail = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CapsuleEndoscopyScanerTemplateAdd/CapsuleEndoscopyScanTemplateNameofexamDetail.jsx"));
const CapsuleEndoscopyScanerTemplateReportDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CapsuleEndoscopyScanerTemplateAdd/CapsuleEndoscopyScanerTemplateReportDetails.jsx"));
const CapsuleEndoscopyScanerTemplateDiagnosisDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CapsuleEndoscopyScanerTemplateAdd/CapsuleEndoscopyScanerTemplateDiagnosisDetails.jsx"));
const CapsuleEndoscopyScanerTemplateRecomendationDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CapsuleEndoscopyScanerTemplateAdd/CapsuleEndoscopyScanerTemplateRecomendationDetails.jsx"));
const CapsuleEndoscopyScanerTemplateRecomendationList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CapsuleEndoscopyScanerTemplateAdd/CapsuleEndoscopyScanerTemplateRecomendationList.jsx"));
const CapsuleEndoscopyScanerTemplateRecomendationEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CapsuleEndoscopyScanerTemplateAdd/CapsuleEndoscopyScanerTemplateRecomendationEdit.jsx"));
const AddAngiographyScanUpload = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/addExaminations/addAngiographyScanUpload.jsx"));
const AngiographyScanerDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/AngiographyScanerTemplateAdd/AngiographyScanerDetails.jsx"));
const AngiographyScanTemplateNameofexam = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/AngiographyScanerTemplateAdd/AngiographyScanerTemplateNameofexam.jsx"));
const AngiographyScanTemplateReport = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/AngiographyScanerTemplateAdd/AngiographyScanerTemplateReport.jsx"));
const AngiographyScanerTemplateDiagnosis = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/AngiographyScanerTemplateAdd/AngiographyScanerTemplateDiagnosis.jsx"));
const AngiographyScanerTemplateRecomendation = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/AngiographyScanerTemplateAdd/AngiographyScanerTemplateRecomendation.jsx"));
const AngiographyScanTemplateNameofexamList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/AngiographyScanerTemplateAdd/AngiographyScanerTemplateNameofexamList.jsx"));
const AngiographyScanerTemplateReportList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/AngiographyScanerTemplateAdd/AngiographyScanerTemplateReportList.jsx"));
const AngiographyRScanerTemplateDiagnosisList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/AngiographyScanerTemplateAdd/AngiographyScanerTemplateDiagnosisList.jsx"));
const AngiographyScanerTemplateRecomendationList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/AngiographyScanerTemplateAdd/AngiographyScanerTemplateRecomendationList.jsx"));
const AngiographyScanTemplateNameofexamEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/AngiographyScanerTemplateAdd/AngiographyScanerTemplateNameofexamEdit.jsx"));
const AngiographyScanerTemplateReportEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/AngiographyScanerTemplateAdd/AngiographyScanerTemplateReportEdit.jsx"));
const AngiographyScanerTemplateDiagnosisEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/AngiographyScanerTemplateAdd/AngiographyScanerTemplateDiagnosisEdit.jsx"));
const AngiographyScanerTemplateRecomendationEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/AngiographyScanerTemplateAdd/AngiographyScanerTemplateRecomendationEdit.jsx"));
const AngiographyScanTemplateNameofexamDetail = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/AngiographyScanerTemplateAdd/AngiographyScanerTemplateNameofexamDetail.jsx"));
const AngiographyScanerTemplateReportDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/AngiographyScanerTemplateAdd/AngiographyScanerTemplateReportDetails.jsx"));
const AngiographyScanerTemplateDiagnosisDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/AngiographyScanerTemplateAdd/AngiographyScanerTemplateDiagnosisDetails.jsx"));
const AngiographyScanerTemplateRecomendationDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/AngiographyScanerTemplateAdd/AngiographyScanerTemplateRecomendationDetails.jsx"));
const AddEKGScanUpload = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/addExaminations/addEKGScanUpload.jsx"));
const EKGScanerDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EKGScanerTemplateAdd/EKGScanerDetails.jsx"));
const EKGScanTemplateNameofexam = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EKGScanerTemplateAdd/EKGScanerTemplateNameofexam.jsx"));
const EKGScanTemplateReport = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EKGScanerTemplateAdd/EKGScanerTemplateReport.jsx"));
const EKGScanerTemplateDiagnosis = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EKGScanerTemplateAdd/EKGScanerTemplateDiagnosis.jsx"));
const EKGScanerTemplateRecomendation = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EKGScanerTemplateAdd/EKGScanerTemplateRecomendation.jsx"));
const EKGScanTemplateNameofexamList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EKGScanerTemplateAdd/EKGScanerTemplateNameofexamList.jsx"));
const EKGScanerTemplateReportList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EKGScanerTemplateAdd/EKGScanerTemplateReportList.jsx"));
const EKGRScanerTemplateDiagnosisList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EKGScanerTemplateAdd/EKGScanerTemplateDiagnosisList.jsx"));
const EKGScanerTemplateRecomendationList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EKGScanerTemplateAdd/EKGScanerTemplateRecomendationList.jsx"));
const EKGScanTemplateNameofexamEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EKGScanerTemplateAdd/EKGScanerTemplateNameofexamEdit.jsx"));
const EKGScanerTemplateReportEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EKGScanerTemplateAdd/EKGScanerTemplateReportEdit.jsx"));
const EKGScanerTemplateDiagnosisEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EKGScanerTemplateAdd/EKGScanerTemplateDiagnosisEdit.jsx"));
const EKGScanerTemplateRecomendationEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EKGScanerTemplateAdd/EKGScanerTemplateRecomendationEdit.jsx"));
const EKGScanTemplateNameofexamDetail = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EKGScanerTemplateAdd/EKGScanerTemplateNameofexamDetail.jsx"));
const EKGScanerTemplateReportDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EKGScanerTemplateAdd/EKGScanerTemplateReportDetails.jsx"));
const EKGScanerTemplateDiagnosisDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EKGScanerTemplateAdd/EKGScanerTemplateDiagnosisDetails.jsx"));
const EKGScanerTemplateRecomendationDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EKGScanerTemplateAdd/EKGScanerTemplateRecomendationDetails.jsx"));
const AddEchoEKGScanUpload = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/addExaminations/addEchoEKGScanUpload.jsx"));
const EchoEKGScanerDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EchoEKGScanerTemplateAdd/EchoEKGScanerDetails.jsx"));
const EchoEKGScanTemplateNameofexam = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EchoEKGScanerTemplateAdd/EchoEKGScanerTemplateNameofexam.jsx"));
const EchoEKGScanTemplateReport = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EchoEKGScanerTemplateAdd/EchoEKGScanerTemplateReport.jsx"));
const EchoEKGScanerTemplateDiagnosis = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EchoEKGScanerTemplateAdd/EchoEKGScanerTemplateDiagnosis.jsx"));
const EchoEKGScanerTemplateRecomendation = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EchoEKGScanerTemplateAdd/EchoEKGScanerTemplateRecomendation.jsx"));
const EchoEKGScanTemplateNameofexamList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EchoEKGScanerTemplateAdd/EchoEKGScanerTemplateNameofexamList.jsx"));
const EchoEKGScanerTemplateReportList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EchoEKGScanerTemplateAdd/EchoEKGScanerTemplateReportList.jsx"));
const EchoEKGRScanerTemplateDiagnosisList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EchoEKGScanerTemplateAdd/EchoEKGScanerTemplateDiagnosisList.jsx"));
const EchoEKGScanerTemplateRecomendationList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EchoEKGScanerTemplateAdd/EchoEKGScanerTemplateRecomendationList.jsx"));
const EchoEKGScanTemplateNameofexamEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EchoEKGScanerTemplateAdd/EchoEKGScanerTemplateNameofexamEdit.jsx"));
const EchoEKGScanerTemplateReportEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EchoEKGScanerTemplateAdd/EchoEKGScanerTemplateReportEdit.jsx"));
const EchoEKGScanerTemplateDiagnosisEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EchoEKGScanerTemplateAdd/EchoEKGScanerTemplateDiagnosisEdit.jsx"));
const EchoEKGScanerTemplateRecomendationEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EchoEKGScanerTemplateAdd/EchoEKGScanerTemplateRecomendationEdit.jsx"));
const EchoEKGScanTemplateNameofexamDetail = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EchoEKGScanerTemplateAdd/EchoEKGScanerTemplateNameofexamDetail.jsx"));
const EchoEKGScanerTemplateReportDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EchoEKGScanerTemplateAdd/EchoEKGScanerTemplateReportDetails.jsx"));
const EchoEKGScanerTemplateDiagnosisDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EchoEKGScanerTemplateAdd/EchoEKGScanerTemplateDiagnosisDetails.jsx"));
const EchoEKGScanerTemplateRecomendationDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/EchoEKGScanerTemplateAdd/EchoEKGScanerTemplateRecomendationDetails.jsx"));
const AddCoronographyScanUpload = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/addExaminations/addCoronographyScanUpload.jsx"));
const CoronographyScanerDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CoronographyScanerTemplateAdd/CoronographyScanerDetails.jsx"));
const CoronographyScanTemplateNameofexam = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CoronographyScanerTemplateAdd/CoronographyScanerTemplateNameofexam.jsx"));
const CoronographyScanTemplateReport = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CoronographyScanerTemplateAdd/CoronographyScanerTemplateReport.jsx"));
const CoronographyScanerTemplateDiagnosis = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CoronographyScanerTemplateAdd/CoronographyScanerTemplateDiagnosis.jsx"));
const CoronographyScanerTemplateRecomendation = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CoronographyScanerTemplateAdd/CoronographyScanerTemplateRecomendation.jsx"));
const CoronographyScanTemplateNameofexamList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CoronographyScanerTemplateAdd/CoronographyScanerTemplateNameofexamList.jsx"));
const CoronographyScanerTemplateReportList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CoronographyScanerTemplateAdd/CoronographyScanerTemplateReportList.jsx"));
const CoronographyRScanerTemplateDiagnosisList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CoronographyScanerTemplateAdd/CoronographyScanerTemplateDiagnosisList.jsx"));
const CoronographyScanerTemplateRecomendationList = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CoronographyScanerTemplateAdd/CoronographyScanerTemplateRecomendationList.jsx"));
const CoronographyScanTemplateNameofexamEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CoronographyScanerTemplateAdd/CoronographyScanerTemplateNameofexamEdit.jsx"));
const CoronographyScanerTemplateReportEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CoronographyScanerTemplateAdd/CoronographyScanerTemplateReportEdit.jsx"));
const CoronographyScanerTemplateDiagnosisEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CoronographyScanerTemplateAdd/CoronographyScanerTemplateDiagnosisEdit.jsx"));
const CoronographyScanerTemplateRecomendationEdit = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CoronographyScanerTemplateAdd/CoronographyScanerTemplateRecomendationEdit.jsx"));
const CoronographyScanTemplateNameofexamDetail = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CoronographyScanerTemplateAdd/CoronographyScanerTemplateNameofexamDetail.jsx"));
const CoronographyScanerTemplateReportDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CoronographyScanerTemplateAdd/CoronographyScanerTemplateReportDetails.jsx"));
const CoronographyScanerTemplateDiagnosisDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CoronographyScanerTemplateAdd/CoronographyScanerTemplateDiagnosisDetails.jsx"));
const CoronographyScanerTemplateRecomendationDetails = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/CoronographyScanerTemplateAdd/CoronographyScanerTemplateRecomendationDetails.jsx"));
const AddLabTest = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/addExaminations/AddLabTest.jsx"));
const DetailsLabTest = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/templateExaminations/LabScanerTemplateAdd/LabtestScanerDetails.jsx"));
const MyDoctors = lazy(() => import("./pages/patientProfilePages/myDoctors/myDoctors.jsx"));
const MyClinics = lazy(() => import("./pages/patientProfilePages/myClinics/MyClinics"));
const LabInsightPage = lazy(() => import("./pages/patientProfilePages/labInsight/LabInsightPage"));
const PrevisitPage = lazy(() => import("./pages/public/PrevisitPage"));
const AccessLogPage = lazy(() => import("./pages/patientProfilePages/accessLog/AccessLogPage"));
const ConsentRequests = lazy(() => import("./pages/patientProfilePages/consentRequests/ConsentRequests"));
const MyFriendsDoctors = lazy(() => import("./pages/doctorProfilePages/shared/doctors/MyFriendsDoctors.jsx"));
const MyMedicalHistories = lazy(() => import("./pages/patientProfilePages/MyMedicalHistories/MyMedicalHistories.jsx"));
const MyMedicalHistoryDetail = lazy(() => import("./pages/patientProfilePages/MyMedicalHistories/MyMedicalHistoryDetail.jsx"));
const PatientFileFilter = lazy(() => import("./pages/patientProfilePages/MyMedicalHistories/getPatientFiles.jsx"));
const PatientFileDetailLab = lazy(() => import("./pages/patientProfilePages/MyMedicalHistories/MyExams/PatientFileDetailLab.jsx"));
const PatientFileDetailCT = lazy(() => import("./pages/patientProfilePages/MyMedicalHistories/MyExams/PatientFileDetailCT.jsx"));
const PatientFileDetailMRI = lazy(() => import("./pages/patientProfilePages/MyMedicalHistories/MyExams/PatientFileDetailMRI.jsx"));
const PatientFileDetailUSM = lazy(() => import("./pages/patientProfilePages/MyMedicalHistories/MyExams/PatientFileDetailUSM.jsx"));
const PatientFileDetailXRAY = lazy(() => import("./pages/patientProfilePages/MyMedicalHistories/MyExams/PatientFileDetailXRAY.jsx"));
const PatientFileDetailPETSCAN = lazy(() => import("./pages/patientProfilePages/MyMedicalHistories/MyExams/PatientFileDetailPETSCAN.jsx"));
const PatientFileDetailSPECTscan = lazy(() => import("./pages/patientProfilePages/MyMedicalHistories/MyExams/PatientFileDetailSPECTscan.jsx"));
const PatientFileDetailEEGscan = lazy(() => import("./pages/patientProfilePages/MyMedicalHistories/MyExams/PatientFileDetailEEGscan.jsx"));
const PatientFileDetailGinekologyScan = lazy(() => import("./pages/patientProfilePages/MyMedicalHistories/MyExams/PatientFileDetailGinecology.jsx"));
const PatientFileDetailHolterScan = lazy(() => import("./pages/patientProfilePages/MyMedicalHistories/MyExams/PatientFileDetailHolter.jsx"));
const PatientFileDetailSpirometry = lazy(() => import("./pages/patientProfilePages/MyMedicalHistories/MyExams/PatientFileDetailSpirometry.jsx"));
const PatientFileDetailDopler = lazy(() => import("./pages/patientProfilePages/MyMedicalHistories/MyExams/PatientFileDetailDopler.jsx"));
const PatientFileDetailGastroscopy = lazy(() => import("./pages/patientProfilePages/MyMedicalHistories/MyExams/PatientFileDetailGastroscopy.jsx"));
const PatientFileDetailCapsuleEndoscopy = lazy(() => import("./pages/patientProfilePages/MyMedicalHistories/MyExams/PatientFileDetailCapsuleEndoscopy.jsx"));
const PatientFileDetailAngiographyScan = lazy(() => import("./pages/patientProfilePages/MyMedicalHistories/MyExams/PatientFileDetailAngiographyScan.jsx"));
const PatientFileDetailEKGScan = lazy(() => import("./pages/patientProfilePages/MyMedicalHistories/MyExams/PatientFileDetailEKGScan.jsx"));
const PatientFileDetailECHOEKGScan = lazy(() => import("./pages/patientProfilePages/MyMedicalHistories/MyExams/PatientFileDetailEchoEKGScan.jsx"));
const PatientFileDetailECoronographyScan = lazy(() => import("./pages/patientProfilePages/MyMedicalHistories/MyExams/PatientFileDetailCoronographyScan.jsx"));
const PricingPage = lazy(() => import("./pages/PricingPage.jsx"));
const DemoPage = lazy(() => import("./pages/demo/DemoPage.jsx"));
const AdminExportDatabase = lazy(() => import("./pages/admin/components/AdminExportDatabase"));
const AdminImportCollection = lazy(() => import("./pages/admin/components/AdminImportCollection.jsx"));
const TermsConsentPage = lazy(() => import("./pages/auth/TermsConsentPage.jsx"));
const AddPrivatePatientPolyclinic = lazy(() => import("./pages/polyclinic/addpatientpolyclinic/addPrivatePatientPolyclinic"));
const PatientClinicalSummary = lazy(() => import("./pages/ai/PatientClinicalSummary.jsx"));
const ChatPage = lazy(() => import("./pages/communication/ChatPage.jsx"));
const CommunicationLayout = lazy(() => import("./layoutes/CommunicationLayout/CommunicationLayout.jsx"));
const EmptyChat = lazy(() => import("./pages/communication/components/EmptyChat.jsx"));
const NewsList = lazy(() => import("./pages/NewsAI/NewsList.jsx"));
const NewsArticle = lazy(() => import("./pages/NewsAI/NewsArticle"));
const SynthesisPage = lazy(() => import("./pages/SynthesisPage/SynthesisPage.jsx"));
const SynthesisArticlePage = lazy(() => import("./pages/SynthesisPage/SynthesisArticlePage.jsx"));
const DoctorDetailsForAll = lazy(() => import("./pages/doctorProfilePages/shared/doctors/doctorDetailForAll.jsx"));
const SingleArticleScientificForAll = lazy(() => import("./pages/doctorProfilePages/shared/articles/singleArticleScientificForAll.jsx"));
const SingleArticleForAll = lazy(() => import("./pages/doctorProfilePages/shared/articles/SingleArticleForAll.jsx"));
const DashboardLayout = lazy(() => import("./layoutes/DashboardLayout/DashboardLayout.jsx"));
const AdminImportDatabase = lazy(() => import("./pages/admin/components/AdminImportDatabase.jsx"));
const ConsultationPage = lazy(() => import("./pages/ai/ConsultationPage.jsx"));
const AboutPage = lazy(() => import("./pages/AboutPage.jsx"));

const SurgeryPage = lazy(() => import("./pages/surgery/SurgeryPage"));
const SurgeryNewCase = lazy(() => import("./pages/surgery/SurgeryNewCase"));
const SurgeryCasePage = lazy(() => import("./pages/surgery/SurgeryCasePage"));
const UserSynthesisPage = lazy(() => import("./pages/UserSynthesis/UserSynthesisPage.jsx"));
const UserSynthesisResultPage = lazy(() => import("./pages/UserSynthesis/UserSynthesisResultPage.jsx"));

// Anthropometry module pages
const CasesListPage = lazy(() => import("./pages/anthropometry/pages/CasesListPage.jsx"));
const CaseDetailPage = lazy(() => import("./pages/anthropometry/pages/CaseDetailPage.jsx"));
const StudyDetailPage = lazy(() => import("./pages/anthropometry/pages/StudyDetailPage.jsx"));
const PhotoAnnotationPage = lazy(() => import("./pages/anthropometry/pages/PhotoAnnotationPage.jsx"));
const ComparePage = lazy(() => import("./pages/anthropometry/pages/ComparePage.jsx"));
const PlanListPage = lazy(() =>
  import("./pages/simulation").then((m) => ({ default: m.PlanListPage })),
);
const PlanEditorPage = lazy(() =>
  import("./pages/simulation").then((m) => ({ default: m.PlanEditorPage })),
);
const HelpPage = lazy(() => import("./pages/simulation/pages/HelpPage.jsx"));
const SimulationHubPage = lazy(() => import("./pages/simulation/pages/SimulationHubPage.jsx"));
const AiPhotoPage = lazy(() => import("./pages/simulation/pages/AiPhotoPage.jsx"));
const SurgicalPlanPage = lazy(() => import("./pages/surgicalPlan/SurgicalPlanPage.jsx"));
const WebinarsPage = lazy(() => import("./pages/webinar/WebinarsPage.jsx"));
const WebinarRoomPage = lazy(() => import("./pages/webinar/WebinarRoomPage.jsx"));
const BreastListPage = lazy(() =>
  import("./pages/simulation").then((m) => ({ default: m.BreastListPage })),
);
const BreastEditorPage = lazy(() =>
  import("./pages/simulation").then((m) => ({ default: m.BreastEditorPage })),
);
const UserSynthesisArticlePage = lazy(() => import("./pages/UserSynthesis/UserSynthesisArticlePage"));
const ClinicLayout = lazy(() => import("./layoutes/clinicLayout/ClinicLayout.jsx"));
const ClinicHubPage = lazy(() => import("./pages/clinic/ClinicHubPage/ClinicHubPage.jsx"));
const CreateClinicPage = lazy(() => import("./pages/clinic/CreateClinicPage/CreateClinicPage.jsx"));
const ClinicDashboardPage = lazy(() => import("./pages/clinic/ClinicDashboardPage/ClinicDashboardPage.jsx"));
const ClinicStaffPage = lazy(() => import("./pages/clinic/ClinicStaffPage/ClinicStaffPage.jsx"));
const InvitationAcceptPage = lazy(() => import("./pages/clinic/InvitationAcceptPage/InvitationAcceptPage"));
const EmployeeLoginPage = lazy(() => import("./pages/clinic/EmployeeLoginPage/EmployeeLoginPage"));
const EmployeeForgotPasswordPage = lazy(() => import("./pages/clinic/EmployeeForgotPasswordPage/EmployeeForgotPasswordPage"));
const EmployeeResetPasswordPage = lazy(() => import("./pages/clinic/EmployeeResetPasswordPage/EmployeeResetPasswordPage"));
const EmployeeDashboardPage = lazy(() => import("./pages/clinic/EmployeeDashboardPage/EmployeeDashboardPage"));
const EmployeeSchedulePage = lazy(() => import("./pages/clinic/EmployeeSchedulePage/EmployeeSchedulePage"));
const EmployeeBookAppointmentPage = lazy(() => import("./pages/clinic/EmployeeBookAppointmentPage/EmployeeBookAppointmentPage"));
const ClinicAnalyticsPage = lazy(() => import("./pages/clinic/ClinicAnalyticsPage/ClinicAnalyticsPage"));
const ClinicReviewsPage = lazy(() => import("./pages/clinic/ClinicReviewsPage/ClinicReviewsPage"));
const ClinicLeadsPage = lazy(() => import("./pages/clinic/ClinicLeadsPage/ClinicLeadsPage"));
const ClinicNotificationsPage = lazy(() => import("./pages/clinic/ClinicNotificationsPage/ClinicNotificationsPage.jsx"));
const ClinicPatientsPage = lazy(() => import("./pages/clinic/ClinicPatientsPage/ClinicPatientsPage.jsx"));
const ClinicPatientDetailPage = lazy(() => import("./pages/clinic/ClinicPatientDetailPage/ClinicPatientDetailPage.jsx"));
const ClinicSchedulePage = lazy(() => import("./pages/clinic/ClinicSchedulePage/ClinicSchedulePage.jsx"));
const ClinicCalendarPage = lazy(() => import("./pages/clinic/ClinicCalendarPage/ClinicCalendarPage.jsx"));
const NewPatientPage = lazy(() => import("./pages/clinic/ClinicPatientsPage/NewPatientPage.jsx"));
const CompleteRegistrationPage = lazy(() => import("./pages/auth/CompleteRegistrationPage/CompleteRegistrationPage"));
const MyLabResults = lazy(() => import("./pages/patientProfilePages/MyMedicalHistories/MyLabResults"));
const MyPrescriptions = lazy(() => import("./pages/patientProfilePages/MyMedicalHistories/MyPrescriptions"));
const PatientFileDetailClinic = lazy(() => import("./pages/patientProfilePages/MyMedicalHistories/PatientFileDetailClinic")); // Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎвЂєР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎвЂєР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎвЂєР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎвЂєР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІР‚С”Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎС™ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎвЂєР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›
const ClinicDepartmentsPage = lazy(() => import("./pages/clinic/ClinicDepartmentsPage/ClinicDepartmentsPage.jsx"));
const ClinicRoomsPage = lazy(() => import("./pages/clinic/ClinicRoomsPage/ClinicRoomsPage.jsx"));
const ClinicEquipmentPage = lazy(() => import("./pages/clinic/ClinicEquipmentPage/ClinicEquipmentPage.jsx"));
const ClinicKnowledgePage = lazy(() => import("./pages/clinic/ClinicKnowledgePage/ClinicKnowledgePage.jsx"));
const ClinicExamTemplatesPage = lazy(() => import("./pages/clinic/ClinicExamTemplatesPage/ClinicExamTemplatesPage.jsx"));
const ClinicKnowledgeArticlePage = lazy(() => import("./pages/clinic/ClinicKnowledgePage/ClinicKnowledgeArticlePage.jsx"));
const ClinicAnnouncementsPage = lazy(() => import("./pages/clinic/ClinicAnnouncementsPage/ClinicAnnouncementsPage.jsx"));
const ClinicConsiliumPage = lazy(() => import("./pages/clinic/ClinicConsiliumPage/ClinicConsiliumPage.jsx"));
const ClinicConsiliumDetailPage = lazy(() => import("./pages/clinic/ClinicConsiliumPage/ClinicConsiliumDetailPage.jsx"));
const ClinicTelemedPage = lazy(() => import("./pages/clinic/ClinicTelemedPage/ClinicTelemedPage.jsx"));
const PatientTelemedPage = lazy(() => import("./pages/patientProfilePages/telemed/PatientTelemedPage.jsx"));
const DoctorMyClinicsPage = lazy(() => import("./pages/doctorProfilePages/myClinics/DoctorMyClinicsPage.jsx"));
const PublicClinicPage = lazy(() => import("./pages/clinic/PublicClinicPage/PublicClinicPage.jsx"));
const ClinicPublicPageSettings = lazy(() => import("./pages/clinic/ClinicPublicPageSettings/ClinicPublicPageSettings.jsx"));
const PublicCustomPage = lazy(() => import("./pages/clinic/PublicClinicPage/PublicCustomPage.jsx"));
const ClinicCustomPagesPage = lazy(() => import("./pages/clinic/ClinicCustomPagesPage/ClinicCustomPagesPage.jsx"));
const PublicArticleDetail = lazy(() => import("./pages/clinic/PublicClinicPage/PublicArticleDetail.jsx"));
const PublicDoctorDetail = lazy(() => import("./pages/clinic/PublicClinicPage/PublicDoctorDetail.jsx"));
const PublicPublicationDetail = lazy(() => import("./pages/clinic/PublicClinicPage/PublicPublicationDetail.jsx"));
const ServicesPage = lazy(() => import("./pages/clinic/ServicesPage/ServicesPage.jsx"));
const MyClinicInvitations = lazy(() => import("./pages/clinic/ClinicStaffPage/MyClinicInvitations.jsx"));
const MembershipInviteAccept = lazy(() => import("./pages/clinic/MembershipInviteAccept/MembershipInviteAccept.jsx"));
const PharmacyCatalogPage = lazy(() => import("./pages/clinic/pharmacy/PharmacyCatalogPage.jsx"));
const PharmacyRequisitionsPage = lazy(() => import("./pages/clinic/pharmacy/PharmacyRequisitionsPage.jsx"));
const PharmacyDispensePage = lazy(() => import("./pages/clinic/pharmacy/PharmacyDispensePage.jsx"));
const PharmacyReportsPage = lazy(() => import("./pages/clinic/pharmacy/PharmacyReportsPage.jsx"));
const PharmacySuppliersPage = lazy(() => import("./pages/clinic/pharmacy/PharmacySuppliersPage.jsx"));
/**
 * Заглушка на время подгрузки чанка маршрута.
 *
 * Каждая страница теперь приезжает отдельным файлом, и между кликом и
 * отрисовкой есть окно в несколько десятков миллисекунд. Пустота на это
 * время читается как «зависло», поэтому показываем спокойный индикатор.
 *
 * minHeight, а не полноэкранный оверлей: подложка не должна прыгать —
 * иначе получаем сдвиг макета, за который Google снижает оценку.
 */
function RouteFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          width: 28,
          height: 28,
          border: "3px solid rgba(15, 118, 110, 0.25)",
          borderTopColor: "#0f766e",
          borderRadius: "50%",
          animation: "dp-route-spin 0.7s linear infinite",
        }}
      />
      <style>{`@keyframes dp-route-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion: reduce){
  [role="status"] span{animation:none}
}`}</style>
    </div>
  );
}

/**
 * Старые адреса публичного контента жили под /public/*, а sitemap и SEO
 * edge-функция всегда указывали на корневые /about, /articles, /news.
 * Канонический адрес теперь корневой; /public/* остаётся рабочим и уводит
 * на него редиректом — чтобы уже проиндексированные ссылки не ломались.
 *
 * Строим цель из pathname, а не из useParams: одному компоненту достаточно
 * снять префикс, вместо шести редиректов с ручной сборкой параметров.
 * search и hash переносим — у новости язык приезжает в ?locale=.
 */
function StripPublicPrefix() {
  const { pathname, search, hash } = useLocation();
  return (
    <Navigate to={pathname.replace(/^\/public/, "") + search + hash} replace />
  );
}

function App() {
  const currentUserId = useCurrentUserId();
  return (
    <>
      {/* Регулятор размера текста. Вне BrowserRouter — он не зависит от
          маршрута и должен быть на любой странице, включая /login. */}
      <FontSizeControl />
      <GlobalCallProvider currentUserId={currentUserId}>
        <BrowserRouter
          future={{
            v7_relativeSplatPath: true,
            v7_startTransition: true,
          }}
        >
          {/* Счётчик просмотров экранов. Ничего не рисует; без ключа
              REACT_APP_POSTHOG_KEY вообще ничего не делает. */}
          <AnalyticsRouteTracker />
          {/* Ближайший приём — полоса поверх любой страницы кабинета за 15
              минут до начала. Вне <Routes> намеренно: врач в этот момент
              смотрит не на расписание, а на карту пациента или статью.
              Eager-импорт обязателен — здесь нет границы Suspense. */}
          <UpcomingAppointmentBanner />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
            {/* Встреча по ссылке. Корневой адрес намеренно: ссылку
                открывают и врачи, и пациенты, и в кабинет её не спрячешь. */}
            <Route path="/webinar/:id" element={<WebinarRoomPage />} />
            <Route path="/consultation" element={<ConsultationPage />} />
            <Route
              path="/user-synthesis/result"
              element={<UserSynthesisResultPage />}
            />
            <Route
              path="/user-synthesis/my/:id"
              element={<UserSynthesisResultPage />}
            />
            {/* ── Публичный контент: корневые адреса ─────────────────────
                /about, /articles, /news лежат в корне, а не под /public.
                Так их видят sitemap (server/common/sitemap) и SEO
                edge-функция (netlify/edge-functions/seo.js) — обе всегда
                строили именно корневые URL. Пока роутов не было, бот с
                /news/<slug> проваливался в catch-all /:slug/:section и
                получал «клиника не найдена».

                Статический сегмент всегда весомее динамического, поэтому
                эти маршруты выигрывают у /:slug и /:slug/:section
                независимо от порядка объявления. Slug'и news/articles/about
                вдобавок зарезервированы в clinic.model.js — клиника такой
                адрес не займёт.

                Layout тот же, что у /public: общий шапка-подвал шелл. */}
            <Route element={<DashboardLayout />}>
              <Route path="/about" element={<AboutPage />} />
              <Route path="/articles" element={<SynthesisPage />} />
              <Route path="/articles/:id" element={<SynthesisArticlePage />} />
              <Route
                path="/articles/:id/:lang"
                element={<SynthesisArticlePage />}
              />
              <Route path="/news" element={<NewsList />} />
              <Route path="/news/:slug" element={<NewsArticle />} />
            </Route>
            <Route path="/public" element={<DashboardLayout />}>
              {/* <Route path="/clinic/accept" element={<InvitationAcceptPage />} />
              <Route
                path="/clinic/staff-login"
                element={<EmployeeLoginPage />}
              /> */}
              <Route path="user-synthesis" element={<UserSynthesisPage />} />
              <Route
                path="user-synthesis/my/:id"
                element={<UserSynthesisArticlePage />}
              />
              {/* Контент переехал в корень (блок роутов выше). Здесь
                  остаются только редиректы для старых ссылок. */}
              <Route path="about" element={<StripPublicPrefix />} />
              <Route path="articles" element={<StripPublicPrefix />} />
              <Route path="articles/:id" element={<StripPublicPrefix />} />
              <Route path="articles/:id/:lang" element={<StripPublicPrefix />} />
              <Route path="news" element={<StripPublicPrefix />} />
              <Route path="news/:slug" element={<StripPublicPrefix />} />

              <Route
                path="doctor-profile/article-detail-for-all/:id"
                element={<SingleArticleForAll />}
              />
              {/* Редактирование обычной статьи — автору И админу (бэкенд
                  проверяет право сохранения: только автор или админ). */}
              <Route
                path="edit-article/:id"
                element={<EditMyArticleDoctor />}
              />
              <Route
                path="doctor/article-scientific-detail-for-all/:id"
                element={<SingleArticleScientificForAll />}
              />
              {/* Редактирование научной статьи — доступно автору И админу
                  (докторский layout выкидывает админа; тут публичный). Бэкенд
                  проверяет право сохранения: только автор или админ. */}
              <Route
                path="edit-article-scientific/:id"
                element={<EditMyArticleScientificDoctor />}
              />
              <Route
                path="doctor-profile/doctor-details/:id"
                element={<DoctorDetailsForAll />}
              />
            </Route>
            {/* Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ CLINIC MODULE Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р РЋРЎв„ў Public routes Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ */}
            {/* Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ CLINIC MODULE Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р РЋРЎв„ў Public routes Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ */}
            <Route path="/clinics/:slug" element={<PublicClinicPage />} />

            <Route
              path="/clinics/:slug/dp/:pageSlug"
              element={<PublicCustomPage />}
            />
            <Route
              path="/clinics/:slug/dp/:pageSlug/articles/:articleSlug"
              element={<PublicArticleDetail />}
            />
            {/* Врач и публикация ВНУТРИ витрины. Раньше эти карточки вели на
                страницы платформы (/public/doctor-profile/...), и посетитель
                уходил с сайта клиники. Три сегмента — с двухсегментным
                /:slug/:section (раздел витрины) не конфликтуют. */}
            <Route
              path="/clinics/:slug/doctors/:doctorId"
              element={<PublicDoctorDetail />}
            />
            <Route
              path="/clinics/:slug/publications/:publicationId"
              element={<PublicPublicationDetail />}
            />
            <Route
              path="/clinics/:slug/:section"
              element={<PublicClinicPage />}
            />
            <Route
              path="/clinic/invitations/accept"
              element={<InvitationAcceptPage />}
            />

            <Route path="/clinic/staff-login" element={<EmployeeLoginPage />} />
            {/* Восстановление пароля сотрудника: шаг 1 — email, шаг 2 — ссылка
                из письма (?token=...) + код из того же письма. */}
            <Route
              path="/clinic/staff-forgot-password"
              element={<EmployeeForgotPasswordPage />}
            />
            <Route
              path="/clinic/staff-reset-password"
              element={<EmployeeResetPasswordPage />}
            />
            <Route
              path="/clinic/membership-invitations/accept"
              element={<MembershipInviteAccept />}
            />
            <Route
              path="/clinic/my-invitations"
              element={<MyClinicInvitations />}
            />
            <Route path="/clinic" element={<ClinicLayout />}>
              <Route index element={<ClinicHubPage />} />
              <Route
                path="public-page"
                element={<ClinicPublicPageSettings />}
              />

              <Route path="services" element={<ServicesPage />} />
              {/* Заявки с витрины. Страница существовала только в зоне
                  сотрудников (/clinic/employee/leads), а уведомление о новой
                  заявке уходит владельцу и управляющему — это пользователи
                  DocPats, а не сотрудники. Переход по уведомлению приводил их
                  в employee-зону, где getEmployeeMe отвечает 401, и layout
                  выбрасывал на /clinic/staff-login: авторизованному человеку
                  показывали форму входа. */}
              <Route path="leads" element={<ClinicLeadsPage />} />
              {/* Все уведомления клиники. В колокольчике помещаются только
                  последние, а посмотреть остальные в зоне клиники было негде. */}
              <Route path="notifications" element={<ClinicNotificationsPage />} />
              <Route path="pages" element={<ClinicCustomPagesPage />} />
              <Route path="create" element={<CreateClinicPage />} />
              <Route path="dashboard" element={<ClinicDashboardPage />} />
              <Route path="staff" element={<ClinicStaffPage />} />
              <Route path="departments" element={<ClinicDepartmentsPage />} />
              <Route path="rooms" element={<ClinicRoomsPage />} />
              <Route path="equipment" element={<ClinicEquipmentPage />} />
              <Route path="knowledge" element={<ClinicKnowledgePage />} />
              {/* Справочник заготовок для протоколов исследований. */}
              <Route
                path="exam-templates"
                element={<ClinicExamTemplatesPage />}
              />
              <Route
                path="announcements"
                element={<ClinicAnnouncementsPage />}
              />
              <Route path="consilia" element={<ClinicConsiliumPage />} />
              <Route path="telemed" element={<ClinicTelemedPage />} />
              <Route
                path="consilia/:id"
                element={<ClinicConsiliumDetailPage />}
              />
              <Route
                path="knowledge/:id"
                element={<ClinicKnowledgeArticlePage />}
              />
              {/* ── PHARMACY (pharmacist) ── */}

              <Route
                path="staff/:doctorId/schedule"
                element={<ClinicSchedulePage />}
              />
              <Route
                path="staff/:doctorId/calendar"
                element={<ClinicCalendarPage />}
              />
              <Route path="patients" element={<ClinicPatientsPage />} />
              <Route path="patients/new" element={<NewPatientPage />} />
              <Route
                path="patients/:id"
                element={<ClinicPatientDetailPage />}
              />
            </Route>
            <Route
              path="/clinic/employee"
              element={<ClinicLayout employeeMode={true} />}
            >
              <Route path="vitrina" element={<ClinicPublicPageSettings />} />
              <Route path="marketing" element={<ClinicCustomPagesPage />} />
              <Route index element={<EmployeeDashboardPage />} />
              <Route path="patients" element={<ClinicPatientsPage />} />
              <Route path="patients/new" element={<NewPatientPage />} />
              <Route
                path="patients/:id"
                element={<ClinicPatientDetailPage />}
              />
              <Route path="pharmacy" element={<PharmacyCatalogPage />} />

              <Route
                path="pharmacy/requisitions"
                element={<PharmacyRequisitionsPage />}
              />
              <Route
                path="pharmacy/dispense"
                element={<PharmacyDispensePage />}
              />
              <Route
                path="pharmacy/reports"
                element={<PharmacyReportsPage />}
              />
              <Route
                path="pharmacy/suppliers"
                element={<PharmacySuppliersPage />}
              />
              <Route path="staff" element={<ClinicStaffPage />} />
              <Route path="departments" element={<ClinicDepartmentsPage />} />
              <Route path="rooms" element={<ClinicRoomsPage />} />
              <Route path="equipment" element={<ClinicEquipmentPage />} />
              <Route
                path="announcements"
                element={<ClinicAnnouncementsPage />}
              />
              <Route path="knowledge" element={<ClinicKnowledgePage />} />
              {/* Справочник заготовок для протоколов исследований. */}
              <Route
                path="exam-templates"
                element={<ClinicExamTemplatesPage />}
              />
              <Route path="schedule" element={<EmployeeSchedulePage />} />
              <Route path="book" element={<EmployeeBookAppointmentPage />} />
              <Route
                path="schedule/:doctorId"
                element={<ClinicSchedulePage />}
              />
              <Route
                path="schedule/:doctorId/calendar"
                element={<ClinicCalendarPage />}
              />
              <Route path="analytics" element={<ClinicAnalyticsPage />} />
              <Route path="reviews" element={<ClinicReviewsPage />} />
              <Route path="leads" element={<ClinicLeadsPage />} />
              <Route path="notifications" element={<ClinicNotificationsPage />} />
              <Route
                path="knowledge/:id"
                element={<ClinicKnowledgeArticlePage />}
              />
            </Route>
            <Route path="/dp" element={<MainPolyclinicLayout />}>
              <Route path="simulation" element={<SimulationHubPage />} />
              <Route path="simulation/help" element={<HelpPage />} />
              {/* Разбор запроса врача в типизированный план операции. */}
              <Route path="simulation/plan" element={<SurgicalPlanPage />} />
              <Route path="simulation/ai" element={<AiPhotoPage />} />
              <Route path="simulation/face" element={<PlanListPage />} />
              <Route
                path="simulation/face/plans/:id"
                element={<PlanEditorPage />}
              />
              <Route path="simulation/plans/:id" element={<PlanEditorPage />} />
              <Route path="simulation/breast" element={<BreastListPage />} />
              <Route
                path="simulation/breast/plans/:id"
                element={<BreastEditorPage />}
              />

              <Route path="surgery" element={<SurgeryPage />} />
              <Route path="surgery/new" element={<SurgeryNewCase />} />
              <Route path="surgery/:id" element={<SurgeryCasePage />} />
              <Route path="polyclinic" element={<Polyclinic />} />
              <Route path="patient-detail/:id" element={<Patientdetail />} />
              <Route
                path="private-patient-detail/:id"
                element={<PrivatePatientDetail />}
              />
              <Route path="add-patient-polyclinic" element={<Addpatient />} />
              <Route
                path="add-private-patient-polyclinic"
                element={<AddPrivatePatientPolyclinic />}
              />
              <Route
                path="search-patient-polyclinic"
                element={<SearchPatient />}
              />
              <Route
                path="add-patient-medical-history/:id"
                element={<AddPatientMedicalHistory />}
              />
              <Route
                path="/dp/private-patient/:id/clinical-summary"
                element={<PatientClinicalSummary />}
              />
              <Route
                path="/dp/patient/:id/clinical-summary"
                element={<PatientClinicalSummary />}
              />
              <Route
                path="add-labtest-results/:patientModel/:patientId"
                element={<AddLabTest />}
              />
              <Route
                path="details-labtest-scan-results/:id"
                element={<DetailsLabTest />}
              />
              <Route
                path="add-coronography-scan-results/:patientModel/:patientId"
                element={<AddCoronographyScanUpload />}
              />
              <Route
                path="details-coronography-scan-results/:id"
                element={<CoronographyScanerDetails />}
              />
              <Route
                path="add-coronography-scan-template-nameofexam"
                element={<CoronographyScanTemplateNameofexam />}
              />
              <Route
                path="add-coronography-scan-template-report"
                element={<CoronographyScanTemplateReport />}
              />
              <Route
                path="add-coronography-scan-template-diagnosis"
                element={<CoronographyScanerTemplateDiagnosis />}
              />
              <Route
                path="add-coronography-scan-template-recomandation"
                element={<CoronographyScanerTemplateRecomendation />}
              />
              <Route
                path="list-coronography-scan-template-nameofexam/:id"
                element={<CoronographyScanTemplateNameofexamList />}
              />
              <Route
                path="list-coronography-scan-template-report/:id"
                element={<CoronographyScanerTemplateReportList />}
              />
              <Route
                path="list-coronography-scan-template-diagnosis/:id"
                element={<CoronographyRScanerTemplateDiagnosisList />}
              />
              <Route
                path="list-coronography-scan-template-recomandation/:id"
                element={<CoronographyScanerTemplateRecomendationList />}
              />
              <Route
                path="update-coronography-scan-template-nameofexam/:id"
                element={<CoronographyScanTemplateNameofexamEdit />}
              />
              <Route
                path="update-coronography-scan-template-report/:id"
                element={<CoronographyScanerTemplateReportEdit />}
              />
              <Route
                path="update-coronography-scan-template-diagnosis/:id"
                element={<CoronographyScanerTemplateDiagnosisEdit />}
              />
              <Route
                path="update-coronography-scan-template-recomandation/:id"
                element={<CoronographyScanerTemplateRecomendationEdit />}
              />
              <Route
                path="detail-coronography-scan-template-nameofexam/:id"
                element={<CoronographyScanTemplateNameofexamDetail />}
              />
              <Route
                path="detail-coronography-scan-template-report/:id"
                element={<CoronographyScanerTemplateReportDetails />}
              />
              <Route
                path="detail-coronography-scan-template-diagnosis/:id"
                element={<CoronographyScanerTemplateDiagnosisDetails />}
              />
              <Route
                path="detail-coronography-scan-template-recomandation/:id"
                element={<CoronographyScanerTemplateRecomendationDetails />}
              />
              {/* Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В° CORONOGRAPHY EKG END */}

              {/* Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В° ECHO EKG START */}
              <Route
                path="add-echo-ekg-scan-results/:patientModel/:patientId"
                element={<AddEchoEKGScanUpload />}
              />
              <Route
                path="details-echo-ekg-scan-results/:id"
                element={<EchoEKGScanerDetails />}
              />
              <Route
                path="add-echo-ekg-scan-template-nameofexam"
                element={<EchoEKGScanTemplateNameofexam />}
              />
              <Route
                path="add-echo-ekg-scan-template-report"
                element={<EchoEKGScanTemplateReport />}
              />
              <Route
                path="add-echo-ekg-scan-template-diagnosis"
                element={<EchoEKGScanerTemplateDiagnosis />}
              />
              <Route
                path="add-echo-ekg-scan-template-recomandation"
                element={<EchoEKGScanerTemplateRecomendation />}
              />
              <Route
                path="list-echo-ekg-scan-template-nameofexam/:id"
                element={<EchoEKGScanTemplateNameofexamList />}
              />
              <Route
                path="list-echo-ekg-scan-template-report/:id"
                element={<EchoEKGScanerTemplateReportList />}
              />
              <Route
                path="list-echo-ekg-scan-template-diagnosis/:id"
                element={<EchoEKGRScanerTemplateDiagnosisList />}
              />
              <Route
                path="list-echo-ekg-scan-template-recomandation/:id"
                element={<EchoEKGScanerTemplateRecomendationList />}
              />
              <Route
                path="update-echo-ekg-scan-template-nameofexam/:id"
                element={<EchoEKGScanTemplateNameofexamEdit />}
              />
              <Route
                path="update-echo-ekg-scan-template-report/:id"
                element={<EchoEKGScanerTemplateReportEdit />}
              />
              <Route
                path="update-echo-ekg-scan-template-diagnosis/:id"
                element={<EchoEKGScanerTemplateDiagnosisEdit />}
              />
              <Route
                path="update-echo-ekg-scan-template-recomandation/:id"
                element={<EchoEKGScanerTemplateRecomendationEdit />}
              />
              <Route
                path="detail-echo-ekg-scan-template-nameofexam/:id"
                element={<EchoEKGScanTemplateNameofexamDetail />}
              />
              <Route
                path="detail-echo-ekg-scan-template-report/:id"
                element={<EchoEKGScanerTemplateReportDetails />}
              />
              <Route
                path="detail-echo-ekg-scan-template-diagnosis/:id"
                element={<EchoEKGScanerTemplateDiagnosisDetails />}
              />
              <Route
                path="detail-echo-ekg-scan-template-recomandation/:id"
                element={<EchoEKGScanerTemplateRecomendationDetails />}
              />
              {/* Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В° ECHO EKG END */}

              {/* Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В° EKG START */}
              <Route
                path="add-ekg-scan-results/:patientModel/:patientId"
                element={<AddEKGScanUpload />}
              />
              <Route
                path="details-ekg-scan-results/:id"
                element={<EKGScanerDetails />}
              />
              <Route
                path="add-ekg-scan-template-nameofexam"
                element={<EKGScanTemplateNameofexam />}
              />
              <Route
                path="add-ekg-scan-template-report"
                element={<EKGScanTemplateReport />}
              />
              <Route
                path="add-ekg-scan-template-diagnosis"
                element={<EKGScanerTemplateDiagnosis />}
              />
              <Route
                path="add-ekg-scan-template-recomandation"
                element={<EKGScanerTemplateRecomendation />}
              />
              <Route
                path="list-ekg-scan-template-nameofexam/:id"
                element={<EKGScanTemplateNameofexamList />}
              />
              <Route
                path="list-ekg-scan-template-report/:id"
                element={<EKGScanerTemplateReportList />}
              />
              <Route
                path="list-ekg-scan-template-diagnosis/:id"
                element={<EKGRScanerTemplateDiagnosisList />}
              />
              <Route
                path="list-ekg-scan-template-recomandation/:id"
                element={<EKGScanerTemplateRecomendationList />}
              />
              <Route
                path="update-ekg-scan-template-nameofexam/:id"
                element={<EKGScanTemplateNameofexamEdit />}
              />
              <Route
                path="update-ekg-scan-template-report/:id"
                element={<EKGScanerTemplateReportEdit />}
              />
              <Route
                path="update-ekg-scan-template-diagnosis/:id"
                element={<EKGScanerTemplateDiagnosisEdit />}
              />
              <Route
                path="update-ekg-scan-template-recomandation/:id"
                element={<EKGScanerTemplateRecomendationEdit />}
              />
              <Route
                path="detail-ekg-scan-template-nameofexam/:id"
                element={<EKGScanTemplateNameofexamDetail />}
              />
              <Route
                path="detail-ekg-scan-template-report/:id"
                element={<EKGScanerTemplateReportDetails />}
              />
              <Route
                path="detail-ekg-scan-template-diagnosis/:id"
                element={<EKGScanerTemplateDiagnosisDetails />}
              />
              <Route
                path="detail-ekg-scan-template-recomandation/:id"
                element={<EKGScanerTemplateRecomendationDetails />}
              />
              {/* Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В° EKG END */}

              {/* Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В° Angography START */}
              <Route
                path="add-angiography-scan-results/:patientModel/:patientId"
                element={<AddAngiographyScanUpload />}
              />
              <Route
                path="details-angiography-scan-results/:id"
                element={<AngiographyScanerDetails />}
              />
              <Route
                path="add-angiography-scan-template-nameofexam"
                element={<AngiographyScanTemplateNameofexam />}
              />
              <Route
                path="add-angiography-scan-template-report"
                element={<AngiographyScanTemplateReport />}
              />
              <Route
                path="add-angiography-scan-template-diagnosis"
                element={<AngiographyScanerTemplateDiagnosis />}
              />
              <Route
                path="add-angiography-scan-template-recomandation"
                element={<AngiographyScanerTemplateRecomendation />}
              />
              <Route
                path="list-angiography-scan-template-nameofexam/:id"
                element={<AngiographyScanTemplateNameofexamList />}
              />
              <Route
                path="list-angiography-scan-template-report/:id"
                element={<AngiographyScanerTemplateReportList />}
              />
              <Route
                path="list-angiography-scan-template-diagnosis/:id"
                element={<AngiographyRScanerTemplateDiagnosisList />}
              />
              <Route
                path="list-angiography-scan-template-recomandation/:id"
                element={<AngiographyScanerTemplateRecomendationList />}
              />
              <Route
                path="update-angiography-scan-template-nameofexam/:id"
                element={<AngiographyScanTemplateNameofexamEdit />}
              />
              <Route
                path="update-angiography-scan-template-report/:id"
                element={<AngiographyScanerTemplateReportEdit />}
              />
              <Route
                path="update-angiography-scan-template-diagnosis/:id"
                element={<AngiographyScanerTemplateDiagnosisEdit />}
              />
              <Route
                path="update-angiography-scan-template-recomandation/:id"
                element={<AngiographyScanerTemplateRecomendationEdit />}
              />
              <Route
                path="detail-angiography-scan-template-nameofexam/:id"
                element={<AngiographyScanTemplateNameofexamDetail />}
              />
              <Route
                path="detail-angiography-scan-template-report/:id"
                element={<AngiographyScanerTemplateReportDetails />}
              />
              <Route
                path="detail-angiography-scan-template-diagnosis/:id"
                element={<AngiographyScanerTemplateDiagnosisDetails />}
              />
              <Route
                path="detail-angiography-scan-template-recomandation/:id"
                element={<AngiographyScanerTemplateRecomendationDetails />}
              />
              {/* Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В° Angography END */}
              {/* Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В° Capsule Endoscopy START */}
              <Route
                path="add-capsule-endoscopy-scan-results/:patientModel/:patientId"
                element={<AddCapsulEndoscopyScanUpload />}
              />
              <Route
                path="details-capsule-endoscopy-scan-results/:id"
                element={<CapsuleEndoscopyScanerDetails />}
              />
              <Route
                path="add-capsule-endoscopy-scan-template-nameofexam"
                element={<CapsuleEndoscopyScanTemplateNameofexam />}
              />
              <Route
                path="add-capsule-endoscopy-scan-template-report"
                element={<CapsuleEndoscopyScanerTemplateReport />}
              />
              <Route
                path="add-capsule-endoscopy-scan-template-diagnosis"
                element={<CapsuleEndoscopyScanerTemplateDiagnosis />}
              />
              <Route
                path="add-capsule-endoscopy-scan-template-recomandation"
                element={<CapsuleEndoscopyScanerTemplateRecomendation />}
              />
              <Route
                path="list-capsule-endoscopy-scan-template-nameofexam/:id"
                element={<CapsuleEndoscopyScanTemplateNameofexamList />}
              />
              <Route
                path="list-capsule-endoscopy-scan-template-report/:id"
                element={<CapsuleEndoscopyScanerTemplateReportList />}
              />
              <Route
                path="list-capsule-endoscopy-scan-template-diagnosis/:id"
                element={<CapsuleEndoscopyScanerTemplateDiagnosisList />}
              />
              <Route
                path="list-capsule-endoscopy-scan-template-recomandation/:id"
                element={<CapsuleEndoscopyScanerTemplateRecomendationList />}
              />
              <Route
                path="update-capsule-endoscopy-scan-template-nameofexam/:id"
                element={<CapsuleEndoscopyScanTemplateNameofexamEdit />}
              />
              <Route
                path="update-capsule-endoscopy-scan-template-report/:id"
                element={<CapsuleEndoscopyScanerTemplateReportEdit />}
              />
              <Route
                path="update-capsule-endoscopy-scan-template-diagnosis/:id"
                element={<CapsuleEndoscopyScanerTemplateDiagnosisEdit />}
              />
              <Route
                path="update-capsule-endoscopy-scan-template-recomandation/:id"
                element={<CapsuleEndoscopyScanerTemplateRecomendationEdit />}
              />
              <Route
                path="detail-capsule-endoscopy-scan-template-nameofexam/:id"
                element={<CapsuleEndoscopyScanTemplateNameofexamDetail />}
              />
              <Route
                path="detail-capsule-endoscopy-scan-template-report/:id"
                element={<CapsuleEndoscopyScanerTemplateReportDetails />}
              />
              <Route
                path="detail-capsule-endoscopy-scan-template-diagnosis/:id"
                element={<CapsuleEndoscopyScanerTemplateDiagnosisDetails />}
              />
              <Route
                path="detail-capsule-endoscopy-scan-template-recomandation/:id"
                element={<CapsuleEndoscopyScanerTemplateRecomendationDetails />}
              />
              {/* Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В° Capsule Endoscopy END */}

              {/* Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В° GASTROSCOPY START */}
              <Route
                path="add-gastroscopy-scan-results/:patientModel/:patientId"
                element={<AddGastroscopyScanUpload />}
              />
              <Route
                path="details-gastroscopy-scan-results/:id"
                element={<GastroscopyScanerDetails />}
              />
              <Route
                path="add-gastroscopy-scan-template-nameofexam"
                element={<GastroscopyScanTemplateNameofexam />}
              />
              <Route
                path="add-gastroscopy-scan-template-report"
                element={<GastroscopyScanerTemplateReport />}
              />
              <Route
                path="add-gastroscopy-scan-template-diagnosis"
                element={<GastroscopyScanerTemplateDiagnosis />}
              />
              <Route
                path="add-gastroscopy-scan-template-recomandation"
                element={<GastroscopyScanerTemplateRecomendation />}
              />
              <Route
                path="list-gastroscopy-scan-template-nameofexam/:id"
                element={<GastroscopyScanTemplateNameofexamList />}
              />
              <Route
                path="list-gastroscopy-scan-template-report/:id"
                element={<GastroscopyScanTemplateNameofexamList />}
              />
              <Route
                path="list-gastroscopy-scan-template-diagnosis/:id"
                element={<GastroscopyScanerTemplateDiagnosisList />}
              />
              <Route
                path="list-gastroscopy-scan-template-recomandation/:id"
                element={<GastroscopyScanerTemplateRecomendationList />}
              />
              <Route
                path="update-gastroscopy-scan-template-nameofexam/:id"
                element={<GastroscopyScanTemplateNameofexamEdit />}
              />
              <Route
                path="update-gastroscopy-scan-template-report/:id"
                element={<GastroscopyScanerTemplateReportEdit />}
              />
              <Route
                path="update-gastroscopy-scan-template-diagnosis/:id"
                element={<GastroscopyScanerTemplateDiagnosisEdit />}
              />
              <Route
                path="update-gastroscopy-scan-template-recomandation/:id"
                element={<GastroscopyScanerTemplateRecomendationEdit />}
              />
              <Route
                path="detail-gastroscopy-scan-template-nameofexam/:id"
                element={<GastroscopyScanTemplateNameofexamDetail />}
              />
              <Route
                path="detail-gastroscopy-scan-template-report/:id"
                element={<GastroscopyScanerTemplateReportDetails />}
              />
              <Route
                path="detail-gastroscopy-scan-template-diagnosis/:id"
                element={<GastroscopyScanerTemplateDiagnosisDetails />}
              />
              <Route
                path="detail-gastroscopy-scan-template-recomandation/:id"
                element={<GastroscopyScanerTemplateRecomendationDetails />}
              />
              {/* Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В° GASTROSCOPY END */}

              {/* Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В° DOPLER START */}
              <Route
                path="add-dopler-scan-results/:patientModel/:patientId"
                element={<AddDoplerScanUpload />}
              />
              <Route
                path="details-dopler-scan-results/:id"
                element={<DopleryScanerDetails />}
              />
              <Route
                path="add-dopler-scan-template-nameofexam"
                element={<DoplerScanTemplateNameofexam />}
              />
              <Route
                path="add-dopler-scan-template-report"
                element={<DoplerScanerTemplateReport />}
              />
              <Route
                path="add-dopler-scan-template-diagnosis"
                element={<DoplerScanerTemplateDiagnosis />}
              />
              <Route
                path="add-dopler-scan-template-recomandation"
                element={<DoplerScanerTemplateRecomendation />}
              />
              <Route
                path="list-dopler-scan-template-nameofexam/:id"
                element={<DoplerScanTemplateNameofexamList />}
              />
              <Route
                path="list-dopler-scan-template-report/:id"
                element={<DoplerScanerTemplateReportList />}
              />
              <Route
                path="list-dopler-scan-template-diagnosis/:id"
                element={<DoplerScanerTemplateDiagnosisList />}
              />
              <Route
                path="list-dopler-scan-template-recomandation/:id"
                element={<DoplerScanerTemplateRecomendationList />}
              />
              <Route
                path="update-dopler-scan-template-nameofexam/:id"
                element={<DoplerScanTemplateNameofexamEdit />}
              />
              <Route
                path="update-dopler-scan-template-report/:id"
                element={<DoplerScanerTemplateReportEdit />}
              />
              <Route
                path="update-dopler-scan-template-diagnosis/:id"
                element={<DoplerScanerTemplateDiagnosisEdit />}
              />
              <Route
                path="update-dopler-scan-template-recomandation/:id"
                element={<DoplerScanerTemplateRecomendationEdit />}
              />
              <Route
                path="detail-dopler-scan-template-nameofexam/:id"
                element={<DoplerScanTemplateNameofexamDetail />}
              />
              <Route
                path="detail-dopler-scan-template-report/:id"
                element={<DoplerScanerTemplateReportDetails />}
              />
              <Route
                path="detail-dopler-scan-template-diagnosis/:id"
                element={<DoplerScanerTemplateDiaqnosisDetails />}
              />
              <Route
                path="detail-dopler-scan-template-recomandation/:id"
                element={<DoplerScanerTemplateRecomendationDetails />}
              />
              {/* Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В° DOPLER END */}
              {/* Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В° SPIROMETR START */}
              <Route
                path="add-spirometry-scan-results/:patientModel/:patientId"
                element={<AddSpirometryScanUpload />}
              />
              <Route
                path="details-spirometry-scan-results/:id"
                element={<SpirometryScanerDetails />}
              />
              <Route
                path="add-spirometry-scan-template-nameofexam"
                element={<SpirometryScanTemplateNameofexam />}
              />
              <Route
                path="add-spirometry-scan-template-report"
                element={<SpirometryScanerTemplateReport />}
              />
              <Route
                path="add-spirometry-scan-template-diagnosis"
                element={<SpirometryScanerTemplateDiagnosis />}
              />
              <Route
                path="add-spirometry-scan-template-recomandation"
                element={<SpirometryScanerTemplateRecomendation />}
              />
              <Route
                path="list-spirometry-scan-template-nameofexam/:id"
                element={<SpirometryScanTemplateNameofexamList />}
              />
              <Route
                path="list-spirometry-scan-template-report/:id"
                element={<SpirometryScanerTemplateReportList />}
              />
              <Route
                path="list-spirometry-scan-template-diagnosis/:id"
                element={<SpirometryScanerTemplateDiagnosisList />}
              />
              <Route
                path="list-spirometry-scan-template-recomandation/:id"
                element={<SpirometryScanerTemplateRecomendationList />}
              />
              <Route
                path="update-spirometry-scan-template-nameofexam/:id"
                element={<SpirometryScanTemplateNameofexamEdit />}
              />
              <Route
                path="update-spirometry-scan-template-report/:id"
                element={<SpirometryScanerTemplateReportEdit />}
              />
              <Route
                path="update-spirometry-scan-template-diagnosis/:id"
                element={<SpirometryScanerTemplateDiagnosisEdit />}
              />
              <Route
                path="update-spirometry-scan-template-recomandation/:id"
                element={<SpirometryScanerTemplateRecomendationEdit />}
              />
              <Route
                path="detail-spirometry-scan-template-nameofexam/:id"
                element={<SpirometryScanTemplateNameofexamDetail />}
              />
              <Route
                path="detail-spirometry-scan-template-report/:id"
                element={<SpirometryScanerTemplateReportDetails />}
              />
              <Route
                path="detail-spirometry-scan-template-diagnosis/:id"
                element={<SpirometryScanerTemplateDiagnosisDetails />}
              />
              <Route
                path="detail-spirometry-scan-template-recomandation/:id"
                element={<SpirometryScanerTemplateRecomendationDetails />}
              />
              {/* Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В° SPIROMETR END */}

              {/* Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В° HOLTER MONITOR START */}
              <Route
                path="add-holter-scan-results/:patientModel/:patientId"
                element={<AddHOLTERScanUpload />}
              />
              <Route
                path="details-holter-scan-results/:id"
                element={<HOLTERScanerDetails />}
              />
              <Route
                path="add-holter-scan-template-nameofexam"
                element={<HOLTERScanTemplateNameofexam />}
              />
              <Route
                path="add-holter-scan-template-report"
                element={<HOLTERScanTemplateReport />}
              />
              <Route
                path="add-holter-scan-template-diagnosis"
                element={<HOLTERScanerTemplateDiagnosis />}
              />
              <Route
                path="add-holter-scan-template-recomandation"
                element={<HOLTERScanerTemplateRecomendation />}
              />
              <Route
                path="list-holter-scan-template-nameofexam/:id"
                element={<HOLTERScanTemplateNameofexamList />}
              />
              <Route
                path="list-holter-scan-template-report/:id"
                element={<HOLTERScanerTemplateReportList />}
              />
              <Route
                path="list-holter-scan-template-diagnosis/:id"
                element={<HOLTERScanerTemplateDiagnosisList />}
              />
              <Route
                path="list-holter-scan-template-recomandation/:id"
                element={<HOLTERScanerTemplateRecomendationList />}
              />
              <Route
                path="update-holter-scan-template-nameofexam/:id"
                element={<HOLTERScanTemplateNameofexamEdit />}
              />
              <Route
                path="update-holter-scan-template-report/:id"
                element={<HOLTERScanerTemplateReportEdit />}
              />
              <Route
                path="update-holter-scan-template-diagnosis/:id"
                element={<HOLTERScanerTemplateDiagnosisEdit />}
              />
              <Route
                path="update-holter-scan-template-recomandation/:id"
                element={<HOLTERScanerTemplateRecomendationEdit />}
              />
              <Route
                path="detail-holter-scan-template-nameofexam/:id"
                element={<HOLTERScanTemplateNameofexamDetail />}
              />
              <Route
                path="detail-holter-scan-template-report/:id"
                element={<HOLTERScanerTemplateReportDetails />}
              />
              <Route
                path="detail-holter-scan-template-diagnosis/:id"
                element={<HOLTERScanerTemplateDiagnosisDetails />}
              />
              <Route
                path="detail-holter-scan-template-recomandation/:id"
                element={<HOLTERScanerTemplateRecomendationDetails />}
              />
              {/* Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В° HOLTER MONITOR END */}

              {/* Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В° Ginecology Test START */}
              <Route
                path="add-ginecology-test-results/:patientModel/:patientId"
                element={<AddGinecologyUpload />}
              />
              <Route
                path="details-ginecology-test-results/:id"
                element={<GinecologyDetails />}
              />
              <Route
                path="add-ginecology-test-template-nameofexam"
                element={<GinecologyTemplateNameofexam />}
              />
              <Route
                path="add-ginecology-test-template-report"
                element={<GinecologyTemplateReport />}
              />
              <Route
                path="add-ginecology-test-template-diagnosis"
                element={<GinecologyTemplateDiagnosis />}
              />
              <Route
                path="add-ginecology-test-template-recomandation"
                element={<GinecologyTemplateRecomendation />}
              />
              <Route
                path="list-ginecology-test-template-nameofexam/:id"
                element={<GinecologyTemplateNameofexamList />}
              />
              <Route
                path="list-ginecology-test-template-report/:id"
                element={<GinecologyTemplateReportList />}
              />
              <Route
                path="list-ginecology-test-template-diagnosis/:id"
                element={<GinecologyTemplateDiagnosisList />}
              />
              <Route
                path="list-ginecology-test-template-recomandation/:id"
                element={<GinecologyTemplateRecomendationList />}
              />
              <Route
                path="update-ginecology-test-template-nameofexam/:id"
                element={<GinecologyTemplateNameofexamEdit />}
              />
              <Route
                path="update-ginecology-test-template-report/:id"
                element={<GinecologyTemplateReportEdit />}
              />
              <Route
                path="update-ginecology-test-template-diagnosis/:id"
                element={<GinecologyTemplateDiagnosisEdit />}
              />
              <Route
                path="update-ginecology-test-template-recomandation/:id"
                element={<GinecologyTemplateRecomendationEdit />}
              />
              <Route
                path="detail-ginecology-test-template-nameofexam/:id"
                element={<GinecologyTemplateNameofexamDetail />}
              />
              <Route
                path="detail-ginecology-test-template-report/:id"
                element={<GinecologyTemplateReportDetails />}
              />
              <Route
                path="detail-ginecology-test-template-diagnosis/:id"
                element={<GinecologyTemplateDiagnosisDetails />}
              />
              <Route
                path="detail-ginecology-test-template-recomandation/:id"
                element={<GinecologyTemplateRecomendationDetails />}
              />
              {/* Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В° Ginecology Test END */}

              {/* Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В° EEG scan START */}
              <Route
                path="add-eeg-scan-results/:patientModel/:patientId"
                element={<AddEEGScanUpload />}
              />
              <Route
                path="details-eeg-scan-results/:id"
                element={<EEGScanerDetails />}
              />
              <Route
                path="add-eeg-scan-template-nameofexam"
                element={<EEGScanTemplateNameofexam />}
              />
              <Route
                path="add-eeg-scan-template-report"
                element={<EEGScanerTemplateReport />}
              />
              <Route
                path="add-eeg-scan-template-diagnosis"
                element={<EEGScanerTemplateDiagnosis />}
              />
              <Route
                path="add-eeg-scan-template-recomandation"
                element={<EEGScanerTemplateRecomendation />}
              />
              <Route
                path="list-eeg-scan-template-nameofexam/:id"
                element={<EEGScanTemplateNameofexamList />}
              />
              <Route
                path="list-eeg-scan-template-report/:id"
                element={<EEGScanerTemplateReportList />}
              />
              <Route
                path="list-eeg-scan-template-diagnosis/:id"
                element={<EEGScanerTemplateDiagnosisList />}
              />
              <Route
                path="list-eeg-scan-template-recomandation/:id"
                element={<EEGScanerTemplateRecomendationList />}
              />
              <Route
                path="update-eeg-scan-template-nameofexam/:id"
                element={<EEGScanTemplateNameofexamEdit />}
              />
              <Route
                path="update-eeg-scan-template-report/:id"
                element={<EEGScanerTemplateReportEdit />}
              />
              <Route
                path="update-eeg-scan-template-diagnosis/:id"
                element={<EEGScanerTemplateDiagnosisEdit />}
              />
              <Route
                path="update-eeg-scan-template-recomandation/:id"
                element={<EEGScanerTemplateRecomendationEdit />}
              />
              <Route
                path="detail-eeg-scan-template-nameofexam/:id"
                element={<EEGScanTemplateNameofexamDetail />}
              />
              <Route
                path="detail-eeg-scan-template-report/:id"
                element={<EEGScanerTemplateReportDetails />}
              />
              <Route
                path="detail-eeg-scan-template-diagnosis/:id"
                element={<EEGScanerTemplateDiagnosisDetails />}
              />
              <Route
                path="detail-eeg-scan-template-recommendation/:id"
                element={<EEGScanerTemplateRecomendationDetails />}
              />
              {/* Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В° EEG scan END */}

              {/* Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В° SPECT scan START */}
              <Route
                path="/dp/add-spect-scan/:patientModel/:patientId"
                element={<AddSPECTScanUpload />}
              />
              <Route
                path="details-spect-scan-results/:id"
                element={<SPECTScanerDetails />}
              />
              <Route
                path="add-spect-scan-template-nameofexam"
                element={<SPECTScanTemplateNameofexam />}
              />
              <Route
                path="add-spect-scan-template-report"
                element={<SPECTScanerTemplateReport />}
              />
              <Route
                path="add-spect-scan-template-diagnosis"
                element={<SPECTScanerTemplateDiagnosis />}
              />
              <Route
                path="add-spect-scan-template-recomandation"
                element={<SPECTScanerTemplateRecomendation />}
              />
              <Route
                path="list-spect-scan-template-nameofexam/:id"
                element={<SPECTScanTemplateNameofexamList />}
              />
              <Route
                path="list-spect-scan-template-report/:id"
                element={<SPECTScanerTemplateReportList />}
              />
              <Route
                path="list-spect-scan-template-diagnosis/:id"
                element={<SPECTScanerTemplateDiagnosisList />}
              />
              <Route
                path="list-spect-scan-template-recomandation/:id"
                element={<SPECTScanerTemplateRecomendationList />}
              />
              <Route
                path="update-spect-scan-template-nameofexam/:id"
                element={<SPECTScanTemplateNameofexamEdit />}
              />
              <Route
                path="update-spect-scan-template-report/:id"
                element={<SPECTScanerTemplateReportEdit />}
              />
              <Route
                path="update-spect-scan-template-diagnosis/:id"
                element={<SPECTScanerTemplateDiagnosisEdit />}
              />
              <Route
                path="update-spect-scan-template-recomandation/:id"
                element={<SPECTScanerTemplateRecomendationEdit />}
              />
              <Route
                path="detail-spect-scan-template-nameofexam/:id"
                element={<SPECTScanTemplateNameofexamDetail />}
              />
              <Route
                path="detail-spect-scan-template-report/:id"
                element={<SPECTScanerTemplateReportDetails />}
              />
              <Route
                path="detail-spect-scan-template-diagnosis/:id"
                element={<SPECTScanerTemplateDiagnosisDetails />}
              />
              <Route
                path="detail-spect-scan-template-recomandation/:id"
                element={<SPECTScanerTemplateRecomendationDetails />}
              />
              {/* Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В° SPECT scan END */}

              {/* Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В° PET scan START */}
              <Route
                path="add-pet-scan-results/:patientId"
                element={<AddPETScanUpload />}
              />
              <Route
                path="details-pet-scan-results/:id"
                element={<PETScanerDetails />}
              />
              <Route
                path="add-pet-scan-template-nameofexam"
                element={<PETScanTemplateNameofexam />}
              />
              <Route
                path="add-pet-scan-template-report"
                element={<PETScanerTemplateReport />}
              />
              <Route
                path="add-pet-scan-template-diagnosis"
                element={<PETScanerTemplateDiagnosis />}
              />
              <Route
                path="add-pet-scan-template-recomandation"
                element={<PETScanerTemplateRecomendation />}
              />
              <Route
                path="list-pet-scan-template-nameofexam/:id"
                element={<PETScanTemplateNameofexamList />}
              />
              <Route
                path="list-pet-scan-template-report/:id"
                element={<PETScanerTemplateReportList />}
              />
              <Route
                path="list-pet-scan-template-diagnosis/:id"
                element={<PETScanerTemplateDiagnosisList />}
              />
              <Route
                path="list-pet-scan-template-recomandation/:id"
                element={<PETScanerTemplateRecomendationList />}
              />
              <Route
                path="update-pet-scan-template-nameofexam/:id"
                element={<PETScanTemplateNameofexamEdit />}
              />
              <Route
                path="update-pet-scan-template-report/:id"
                element={<PETScanerTemplateReportEdit />}
              />
              <Route
                path="update-pet-scan-template-diagnosis/:id"
                element={<PETScanerTemplateDiagnosisEdit />}
              />
              <Route
                path="update-pet-scan-template-recomandation/:id"
                element={<PETScanerTemplateRecomendationEdit />}
              />
              <Route
                path="detail-pet-scan-template-nameofexam/:id"
                element={<PETScanTemplateNameofexamDetail />}
              />
              <Route
                path="detail-pet-scan-template-report/:id"
                element={<PETScanerTemplateReportDetails />}
              />
              <Route
                path="detail-pet-scan-template-diagnosis/:id"
                element={<PETScanerTemplateDiagnosisDetails />}
              />
              <Route
                path="detail-pet-scan-template-recomandation/:id"
                element={<PETScanerTemplateRecomendationDetails />}
              />
              {/* Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В° PET scan END */}

              {/* Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В° XRAY scan START */}
              <Route
                path="add-xray-scan-results/:patientId"
                element={<AddXRAYScanUpload />}
              />
              <Route
                path="details-xray-scan-results/:id"
                element={<XRAYScanerDetails />}
              />
              <Route
                path="add-xray-scan-template-nameofexam"
                element={<XRAYScanTemplateNameofexam />}
              />
              <Route
                path="add-xray-scan-template-report"
                element={<XRAYScanerTemplateReport />}
              />
              <Route
                path="add-xray-scan-template-diagnosis"
                element={<XRAYScanerTemplateDiagnosis />}
              />
              <Route
                path="add-xray-scan-template-recomandation"
                element={<XRAYScanerTemplateRecomendation />}
              />
              <Route
                path="list-xray-scan-template-nameofexam/:id"
                element={<XRAYScanTemplateNameofexamList />}
              />
              <Route
                path="list-xray-scan-template-report/:id"
                element={<XRAYScanerTemplateReportList />}
              />
              <Route
                path="list-xray-scan-template-diagnosis/:id"
                element={<XRAYScanerTemplateDiagnosisList />}
              />
              <Route
                path="list-xray-scan-template-recomandation/:id"
                element={<XRAYScanerTemplateRecomendationList />}
              />
              <Route
                path="update-xray-scan-template-nameofexam/:id"
                element={<XRAYScanTemplateNameofexamEdit />}
              />
              <Route
                path="update-xray-scan-template-report/:id"
                element={<XRAYScanerTemplateReportEdit />}
              />
              <Route
                path="update-xray-scan-template-diagnosis/:id"
                element={<XRAYScanerTemplateDiagnosisEdit />}
              />
              <Route
                path="update-xray-scan-template-recomandation/:id"
                element={<XRAYScanerTemplateRecomendationEdit />}
              />
              <Route
                path="detail-xray-scan-template-nameofexam/:id"
                element={<XRAYScanTemplateNameofexamDetail />}
              />
              <Route
                path="detail-xray-scan-template-report/:id"
                element={<XRAYScanerTemplateReportDetails />}
              />
              <Route
                path="detail-xray-scan-template-diagnosis/:id"
                element={<XRAYScanerTemplateDiagnosisDetails />}
              />
              <Route
                path="detail-xray-scan-template-recomandation/:id"
                element={<XRAYScanerTemplateRecomendationDetails />}
              />
              {/* Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В° XRAY scan END */}

              {/* Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В° USM scan START */}
              <Route
                path="add-usm-scan-results/:patientId"
                element={<AddUSMScanUpload />}
              />
              <Route
                path="details-usm-scan-results/:id"
                element={<USMScanerDetails />}
              />
              <Route
                path="list-usm-scan-template-nameofexam/:id"
                element={<USMScanTemplateNameofexamList />}
              />
              <Route
                path="list-usm-scan-template-report/:id"
                element={<USMScanerTemplateReportList />}
              />
              <Route
                path="list-usm-scan-template-diagnosis/:id"
                element={<USMScanerTemplateDiagnosisList />}
              />
              <Route
                path="list-usm-scan-template-recomendation/:id"
                element={<USMScanerTemplateRecomendationList />}
              />
              <Route
                path="add-usm-scan-template-nameofexam"
                element={<USMScanTemplateNameofexam />}
              />
              <Route
                path="add-usm-scan-template-report"
                element={<USMScanTemplateReport />}
              />
              <Route
                path="add-usm-scan-template-diagnosis"
                element={<USMScanerTemplateDiagnosis />}
              />
              <Route
                path="add-usm-scan-template-recomendation"
                element={<USMScanerTemplateRecomendation />}
              />

              <Route
                path="update-usm-scan-template-nameofexam/:id"
                element={<USMScanTemplateNameofexamEdit />}
              />
              <Route
                path="update-usm-scan-template-report/:id"
                element={<USMScanerTemplateReportEdit />}
              />
              <Route
                path="update-usm-scan-template-diagnosis/:id"
                element={<USMScanerTemplateDiagnosisEdit />}
              />
              <Route
                path="update-usm-scan-template-recomandation/:id"
                element={<USMScanerTemplateRecomendationEdit />}
              />

              <Route
                path="detail-usm-scan-template-nameofexam/:id"
                element={<USMScanerTemplateRecomendationDetails />}
              />
              <Route
                path="detail-usm-scan-template-report/:id"
                element={<USMScanerTemplateReportDetails />}
              />
              <Route
                path="detail-usm-scan-template-diagnosis/:id"
                element={<USMScanerTemplateDiagnosisDetails />}
              />
              <Route
                path="detail-usm-scan-template-recomandation/:id"
                element={<USMScanerTemplateRecomendationDetails />}
              />
              {/* Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В° USM scan END */}

              {/* Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В° CT scan START */}
              <Route
                path="/dp/add-ct-scan-upload/:patientModel/:patientId"
                element={<AddCTScanUpload />}
              />

              <Route
                path="details-ct-scan-results/:id"
                element={<CTScanerDetails />}
              />
              <Route
                path="add-ct-scan-template-nameofexam"
                element={<CTScanTemplateNameofexam />}
              />
              <Route
                path="add-ct-scan-template-report"
                element={<CTScanerTemplateReport />}
              />
              <Route
                path="add-ct-scan-template-diagnosis"
                element={<CTScanerTemplateDiagnosis />}
              />
              <Route
                path="add-ct-scan-template-recomandation"
                element={<CTScanerTemplateRecomendation />}
              />
              <Route
                path="list-ct-scan-template-nameofexam/:id"
                element={<CTScanTemplateNameofexamList />}
              />
              <Route
                path="list-ct-scan-template-report/:id"
                element={<CTScanerTemplateReportList />}
              />
              <Route
                path="list-ct-scan-template-diagnosis/:id"
                element={<CTScanerTemplateDiagnosisList />}
              />
              <Route
                path="list-ct-scan-template-recomandation/:id"
                element={<CTScanerTemplateRecomendationList />}
              />
              <Route
                path="update-ct-scan-template-nameofexam/:id"
                element={<CTScanTemplateNameofexamEdit />}
              />
              <Route
                path="update-ct-scan-template-report/:id"
                element={<CTScanerTemplateReportEdit />}
              />
              <Route
                path="update-ct-scan-template-diagnosis/:id"
                element={<CTScanerTemplateDiagnosisEdit />}
              />
              <Route
                path="update-ct-scan-template-recomandation/:id"
                element={<CTScanerTemplateRecomendationEdit />}
              />
              <Route
                path="detail-ct-scan-template-nameofexam/:id"
                element={<CTScanTemplateNameofexamDetail />}
              />
              <Route
                path="detail-ct-scan-template-report/:id"
                element={<CTScanerTemplateReportDetails />}
              />
              <Route
                path="detail-ct-scan-template-diagnosis/:id"
                element={<CTScanerTemplateDiagnosisDetails />}
              />
              <Route
                path="detail-ct-scan-template-recomandation/:id"
                element={<CTScanerTemplateRecomendationDetails />}
              />

              {/* Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р Р†Р вЂљРЎвЂєР РЋРЎвЂєР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р Р‹Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В§Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР РЋРЎвЂєР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В®Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎвЂќР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћвЂ“Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р В Р вЂ№ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В° CT scan START */}

              {/* Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В° MRI scan START */}
              <Route
                path="/dp/add-mri-scan-upload/:patientModel/:patientId"
                element={<AddMRIScanUpload />}
              />
              <Route
                path="details-mri-scan-results/:id"
                element={<MRIScanerDetails />}
              />
              <Route
                path="add-mri-scan-template-nameofexam"
                element={<MRIScanTemplateNameofexam />}
              />
              <Route
                path="add-mri-scan-template-report"
                element={<MRIScanerTemplateReport />}
              />
              <Route
                path="add-mri-scan-template-diagnosis"
                element={<MRIScanerTemplateDiagnosis />}
              />
              <Route
                path="add-mri-scan-template-recomandation"
                element={<MRIScanerTemplateRecomendation />}
              />
              <Route
                path="list-mri-scan-template-nameofexam/:id"
                element={<MRIScanTemplateNameofexamList />}
              />
              <Route
                path="list-mri-scan-template-report/:id"
                element={<MRIScanerTemplateReportList />}
              />
              <Route
                path="list-mri-scan-template-diagnosis/:id"
                element={<MRIScanerTemplateDiagnosisList />}
              />
              <Route
                path="list-mri-scan-template-recomandation/:id"
                element={<MRIScanerTemplateRecomendationList />}
              />
              <Route
                path="update-mri-scan-template-nameofexam/:id"
                element={<MRIScanTemplateNameofexamEdit />}
              />
              <Route
                path="update-mri-scan-template-report/:id"
                element={<MRIScanerTemplateReportEdit />}
              />
              <Route
                path="update-mri-scan-template-diagnosis/:id"
                element={<MRIScanerTemplateDiagnosisEdit />}
              />
              <Route
                path="update-mri-scan-template-recomandation/:id"
                element={<MRIScanerTemplateRecomendationEdit />}
              />
              <Route
                path="detail-mri-scan-template-nameofexam/:id"
                element={<MRIScanTemplateNameofexamDetail />}
              />
              <Route
                path="detail-mri-scan-template-report/:id"
                element={<MRIScanerTemplateReportDetails />}
              />
              <Route
                path="detail-mri-scan-template-diagnosis/:id"
                element={<MRIScanerTemplateDiagnosisDetails />}
              />
              <Route
                path="detail-mri-scan-template-recomandation/:id"
                element={<MRIScanerTemplateRecomendationDetails />}
              />
              {/* Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р Р†Р вЂљРЎвЂєР РЋРЎвЂєР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р Р‹Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В§Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР РЋРЎвЂєР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В®Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎвЂќР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћвЂ“Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р В Р вЂ№ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В° MRI scan START */}

              <Route
                path="temp-complaints-list"
                element={<TempComplaintsList />}
              />
              <Route
                path="patient-polyclinic-medical-history/:id"
                element={<MedicalHistory />}
              />
              <Route
                path="add-complainte-template"
                element={<TempComplaints />}
              />
              <Route
                path="complaints-detail/:id"
                element={<ComplaintDetail />}
              />
              <Route
                path="add-anamnes-morbi-template"
                element={<TempAnamnesisMorbi />}
              />
              <Route
                path="add-additional-diagnosis-template"
                element={<TempAdditionalDiagnosis />}
              />
              <Route
                path="list-additional-diagnosis-template"
                element={<TempAdditionalDiagnosisList />}
              />
              <Route
                path="detail-additional-diagnosis-template/:id"
                element={<TempAdditionalDiagnosisDetail />}
              />

              <Route
                path="anamnes-morbi-template/:id"
                element={<TempAnamnesisMorbiDetail />}
              />
              <Route
                path="anamnes-morbi-template-list"
                element={<TempAnamnesisMorbiList />}
              />
              <Route
                path="add-anamnes-vitae-template"
                element={<TempAnamnesisVitae />}
              />
              <Route
                path="anamnes-vitae-template-list"
                element={<TempAnamnesisVitaeList />}
              />
              <Route
                path="anamnes-vitae-template/:id"
                element={<TempAnamnesisVitaeDetail />}
              />
              <Route
                path="add-recomendation-template"
                element={<TempRecommendations />}
              />
              <Route
                path="add-status-localis-template"
                element={<TempStatusLocalis />}
              />
              <Route
                path="add-status-preasens-template"
                element={<TempStatusPreasens />}
              />
              <Route
                path="add-mri-results-template"
                element={<TempMriResults />}
              />
              <Route
                path="mri-results-template-list"
                element={<TempMRIResultsList />}
              />
              <Route
                path="mri-results-template-detail/:id"
                element={<TempMriResultsDeltail />}
              />
              <Route
                path="laboratory-tests-template-detail/:id"
                element={<TempLaboratoryResultsDetail />}
              />
              <Route
                path="add-ct-results-template"
                element={<TempCScanerResults />}
              />
              <Route
                path="ct-results-template-list"
                element={<TempCScanerResultsList />}
              />
              <Route
                path="ct-results-template-detail/:id"
                element={<TempCScanerResultsDelail />}
              />
              <Route
                path="ultrasound-tests-template-list"
                element={<TempUltrasoundResultsList />}
              />
              <Route
                path="laboratory-tests-template-list"
                element={<TempLaboratoryResultsList />}
              />
              <Route
                path="recomendation-tests-template-list"
                element={<TempRecommendationsList />}
              />
              <Route
                path="status-preasens-template-list"
                element={<TempStatusPreasensList />}
              />
              <Route
                path="status-preasens-template-detail/:id"
                element={<TempStatusPreasensDetail />}
              />
              <Route
                path="recomendations-template-detail/:id"
                element={<TempRecommendationsDetail />}
              />
              <Route
                path="ultrasound-template-detail/:id"
                element={<TempUltrasoundResultsDetail />}
              />
              <Route
                path="status-localis-template-detail/:id"
                element={<TempStatusLocalisDetail />}
              />
              <Route
                path="status-localis-template-list"
                element={<TempStatusLocalisList />}
              />
              <Route
                path="add-ultrasound-tests-template"
                element={<TempUltrasoundResults />}
              />
              <Route
                path="add-laboratory-tests-template"
                element={<TempLaboratoryTestResults />}
              />
            </Route>
            <Route path="/demo" element={<DemoPage />} />
            <Route path="/terms-consent-page" element={<TermsConsentPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            {/* Публичная SEO-страница «Лучшие врачи» */}
            <Route path="/top-doctors" element={<TopDoctorsPage />} />
            {/* Документация: одна страница на весь корпус, раздел в адресе.
                Например /docs/for-doctors — «почему врачу стоит работать здесь». */}
            <Route path="/docs" element={<DocsIndexPage />} />
            {/* «Я оплатил» — по подписанной ссылке из письма с реквизитами.
                Без авторизации: счёт оплачивает бухгалтер, у которого
                аккаунта здесь нет. */}
            <Route path="/previsit/:token" element={<PrevisitPage />} />
            <Route path="/pay/claim/:token" element={<PaymentClaimPage />} />
            <Route path="/docs/:section" element={<DocsPage />} />
            {/* Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р РЋРІР‚С”Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћвЂ“Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎвЂќР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР РЋРЎвЂєР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎвЂќР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІР‚СњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В */}
            <Route path="/" element={<AuthLayout />}>
              <Route path="registration" element={<Registration />} />
              <Route path="login" element={<Login />} />
              <Route
                path="confirmationregister"
                element={<Confirmationregister />}
              />
              <Route path="resetpassword" element={<Resetpassword />} />
              <Route
                path="resetpasswordchange"
                element={<Resetpasswordchange />}
              />
              <Route
                path="otpresetpasswordchange"
                element={<Otpresetpasswordchange />}
              />
            </Route>
            <Route
              path="/complete-registration"
              element={<CompleteRegistrationPage />}
            />
            {/* Платежи / подписки — доступны врачу и пациенту */}
            <Route path="/pricing/checkout" element={<PricingCheckoutPage />} />
            <Route path="/payment/mock" element={<MockCheckoutPage />} />
            {/* Подготовка к экзаменам — ТОЛЬКО для врачей. Не-врача (пациент,
                гость) гейт заворачивает: гостя на /login, остальных на «/». */}
            <Route
              path="/education"
              element={
                <DoctorOnlyRoute>
                  <ExamCatalogPage />
                </DoctorOnlyRoute>
              }
            />
            <Route
              path="/education/programs/:programId"
              element={
                <DoctorOnlyRoute>
                  <ExamProgramPage />
                </DoctorOnlyRoute>
              }
            />
            <Route
              path="/education/attempts/:attemptId"
              element={
                <DoctorOnlyRoute>
                  <ExamAttemptPage />
                </DoctorOnlyRoute>
              }
            />
            {/* Тренажёр диагностики — только для врачей. Станции: снимки,
                анализы, виртуальный пациент. */}
            <Route
              path="/arena"
              element={
                <DoctorOnlyRoute>
                  <ArenaHubPage />
                </DoctorOnlyRoute>
              }
            />
            <Route
              path="/arena/cases/:caseId"
              element={
                <DoctorOnlyRoute>
                  <RadiologyReaderPage />
                </DoctorOnlyRoute>
              }
            />
            <Route
              path="/arena/labs/cases/:caseId"
              element={
                <DoctorOnlyRoute>
                  <LabReaderPage />
                </DoctorOnlyRoute>
              }
            />
            <Route
              path="/arena/vp/cases/:caseId"
              element={
                <DoctorOnlyRoute>
                  <VirtualPatientReaderPage />
                </DoctorOnlyRoute>
              }
            />
            <Route
              path="/arena/duels"
              element={
                <DoctorOnlyRoute>
                  <ArenaDuelsPage />
                </DoctorOnlyRoute>
              }
            />
            {/* Старые адреса /radiology/* — раздел переехал на /arena.
                Перенаправление с сохранением остатка пути: у врачей остались
                закладки и ссылки в переписке, а «страница не найдена» вместо
                кейса выглядит как поломка продукта, а не как переименование. */}
            <Route path="/radiology/*" element={<RadiologyLegacyRedirect />} />
            {/* Диагностическая помощь: разбор материалов живого пациента.
                Только врачи — на бэкенде тот же список ролей
                (diagnostics/middlewares/diagnosticsAuth.js). Пациентов сюда не
                пускаем сознательно: разбор без врача превращается в
                самодиагностику по интернету, только убедительнее по тону. */}
            <Route
              path="/diagnostics"
              element={
                <DoctorOnlyRoute>
                  <DiagnosticsCasesPage />
                </DoctorOnlyRoute>
              }
            />
            <Route
              path="/diagnostics/cases/:caseId"
              element={
                <DoctorOnlyRoute>
                  <DiagnosticCasePage />
                </DoctorOnlyRoute>
              }
            />
            {/* Прежний адрес справочника кодов. Он вёл на страницу ВНЕ зоны
                /doctor — без бокового меню и шапки, то есть без выхода
                обратно в кабинет. Сама страница переехала в зону врача
                (/doctor/medical-codes), а этот адрес остаётся
                перенаправлением: он уже разошёлся по закладкам. */}
            <Route
              path="/medical-codes"
              element={<Navigate to="/doctor/medical-codes" replace />}
            />
            {/* Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р Р‹Р РЋРЎСџР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІР‚СњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¤Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р Р‹Р РЋРЎСџР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р РЋРІР‚С”Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р Р‹Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎвЂќР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС› */}
            <Route path="/patient" element={<PatientLayout />}>
              <Route
                path="invite"
                element={
                  <div style={{ padding: "24px 16px" }}>
                    <ReferralCard />
                  </div>
                }
              />
              <Route path="news" element={<NewsList />} />
              <Route path="consultation-ai" element={<ConsultationPage />} />
              <Route
                path="articles-ai-for-patients"
                element={<SynthesisPage />}
              />
              <Route
                path="get-patient-file-detail-clinic/:id"
                element={<PatientFileDetailClinic />}
              />
              ;
              <Route path="communication" element={<CommunicationLayout />}>
                <Route index element={<EmptyChat />} />

                <Route path=":dialogId" element={<ChatPage />} />
              </Route>
              <Route
                path="article-detail/:id"
                element={<SingleArticlePage />}
              />
              <Route path="home-page" element={<PatientHomePage />} />
              <Route
                path="get-patients-files"
                element={<PatientFileFilter />}
              />
              <Route path="my-lab-results" element={<MyLabResults />} />
              <Route path="my-prescriptions" element={<MyPrescriptions />} />
              {/* Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В° Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎвЂєР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎвЂєР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІР‚С”Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎС™ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р Р‹Р РЋРЎСџР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р РЋРІР‚С”Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р Р‹Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎвЂќР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС› */}
              <Route
                path="get-patient-file-detail-coronography-scan/:id"
                element={<PatientFileDetailECoronographyScan />}
              />
              <Route
                path="get-patient-file-detail-echo-ekg-scan/:id"
                element={<PatientFileDetailECHOEKGScan />}
              />
              <Route
                path="get-patient-file-detail-angiography-scan/:id"
                element={<PatientFileDetailAngiographyScan />}
              />
              <Route
                path="get-patient-file-detail-ekg-scan/:id"
                element={<PatientFileDetailEKGScan />}
              />
              <Route
                path="get-patient-file-detail-capsule-endoscopy/:id"
                element={<PatientFileDetailCapsuleEndoscopy />}
              />
              <Route
                path="get-patient-file-detail-gastroscopy/:id"
                element={<PatientFileDetailGastroscopy />}
              />
              <Route
                path="get-patient-file-detail-lab/:id"
                element={<PatientFileDetailLab />}
              />
              <Route
                path="get-patient-file-detail-ct/:id"
                element={<PatientFileDetailCT />}
              />
              <Route
                path="get-patient-file-detail-mri/:id"
                element={<PatientFileDetailMRI />}
              />
              <Route
                path="get-patient-file-detail-usm/:id"
                element={<PatientFileDetailUSM />}
              />
              <Route
                path="get-patient-file-detail-xray/:id"
                element={<PatientFileDetailXRAY />}
              />
              <Route
                path="get-patient-file-detail-pet-scan/:id"
                element={<PatientFileDetailPETSCAN />}
              />
              <Route
                path="get-patient-file-detail-spect-scan/:id"
                element={<PatientFileDetailSPECTscan />}
              />
              <Route
                path="get-patient-file-detail-eeg-scan/:id"
                element={<PatientFileDetailEEGscan />}
              />
              <Route
                path="get-patient-file-detail-ginecology/:id"
                element={<PatientFileDetailGinekologyScan />}
              />
              <Route
                path="get-patient-file-detail-holter/:id"
                element={<PatientFileDetailHolterScan />}
              />
              <Route
                path="get-patient-file-detail-spirometry/:id"
                element={<PatientFileDetailSpirometry />}
              />
              <Route
                path="get-patient-file-detail-dopler/:id"
                element={<PatientFileDetailDopler />}
              />
              {/* Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В° Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎвЂєР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎвЂєР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІР‚С”Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎС™ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р Р‹Р РЋРЎСџР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р РЋРІР‚С”Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р Р‹Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎвЂќР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС› */}
              <Route
                path="patient-profile/:id"
                element={<HomePatientMainPage />}
              />
              <Route path="add-patient-to-clinic" element={<AddPatient />} />
              <Route
                path="search-patient-from-patient"
                element={<SearchPatientFromPatient />}
              />
              <Route
                path="delete-patient"
                element={<DeletePatientFromOffice />}
              />
              <Route
                path="notifications-for-patient"
                element={<Notifications />}
              />
              <Route
                path="all-articles"
                element={<ArtislesFromDoctorsForPatient />}
              />
              <Route
                path="article-detail/:id"
                element={<SingleArticleForPatient />}
              />
              <Route
                path="my-medical-histories"
                element={<MyMedicalHistories />}
              />
              <Route
                path="my-medical-history-details/:id"
                element={<MyMedicalHistoryDetail />}
              />
              <Route path="doctors" element={<DoctorsAllForPatient />} />
              <Route path="my-doctors" element={<MyDoctors />} />
              <Route
                path="/patient/consent-requests"
                element={<ConsentRequests />}
              />
              <Route path="/patient/my-clinics" element={<MyClinics />} />
              {/* Расшифровка анализов: фото бланка → объяснение простыми
                  словами. Фотография не сохраняется. */}
              <Route path="lab-insight" element={<LabInsightPage />} />
              {/* Журнал доступа к своим медицинским данным. */}
              <Route path="access-log" element={<AccessLogPage />} />
              <Route
                path="doctors-articles/:id"
                element={<DoctorArticlesForPatient />}
              />
              <Route
                path="appointments-info"
                element={<PatientAppointmentsMain />}
              />
              <Route
                path="notification-for-patient"
                element={<PatientNotificationsMain />}
              />
              <Route path="doctor-details/:id" element={<DoctorDetail />} />
              <Route path="appointment" element={<PatientAppointment />} />
              <Route
                path="my-appointment"
                element={<PatientsMyAppointment />}
              />
              <Route path="telemed" element={<PatientTelemedPage />} />
              <Route
                path="my-appointment-history"
                element={<PatientAppointmentsHistory />}
              />
              <Route
                path="article-scientific-detail/:id"
                element={<SingleArticleScientificPage />}
              />
            </Route>
            <Route
              path="/doctor/anthropometry/photos/:photoId/annotate"
              element={<PhotoAnnotationPage />}
            />
            {/* Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р Р‹Р РЋРЎСџР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІР‚СњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¤Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІР‚СњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р Р†Р вЂљРЎвЂєР РЋРЎвЂєР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎвЂќР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІР‚СњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС› */}
            <Route path="/doctor" element={<DoctorpofileLayout />}>
              {/* Управление встречами по ссылке — в кабинете врача:
                  создавать их может только он. Сам вход во встречу
                  живёт в корне, туда приходят и пациенты. */}
              <Route path="webinars" element={<WebinarsPage />} />
              {/* Справочник кодов МКБ. Живёт в зоне врача, чтобы у страницы
                  были боковое меню и шапка кабинета: раньше она открывалась
                  отдельным адресом без навигации, и вернуться из неё было
                  некуда. Доступ — медперсоналу: на бэкенде тот же список
                  ролей (medicalCodes/middlewares/codesAuth.js). Не публичная
                  сознательно: открытый поиск по кодам болезней на медицинском
                  сайте читается как приглашение поставить себе диагноз. */}
              <Route
                path="medical-codes"
                element={
                  <DoctorOnlyRoute>
                    <MedicalCodesPage />
                  </DoctorOnlyRoute>
                }
              />
              {/* Доказательная медицина: вопрос врача → что есть в PubMed,
                  разложенное по силе дизайна исследования. В зоне врача по той
                  же причине, что и справочник кодов: нужны меню и шапка
                  кабинета. Доступ — медперсоналу, на бэкенде тот же список
                  ролей (ebm/middlewares/ebmAuth.js). Пациентам закрыто
                  сознательно: список исследований читается как приглашение
                  назначить лечение себе самому. */}
              <Route
                path="evidence"
                element={
                  <DoctorOnlyRoute>
                    <EvidencePage />
                  </DoctorOnlyRoute>
                }
              />
              <Route
                path="invite"
                element={
                  <div style={{ padding: "24px 16px" }}>
                    <ReferralCard />
                  </div>
                }
              />
              <Route path="my-clinics" element={<DoctorMyClinicsPage />} />
              <Route
                path="anthropometry/cases/:caseId/compare"
                element={<ComparePage />}
              />
              <Route path="anthropometry/cases" element={<CasesListPage />} />
              <Route
                path="anthropometry/cases/:caseId"
                element={<CaseDetailPage />}
              />
              <Route
                path="anthropometry/studies/:studyId"
                element={<StudyDetailPage />}
              />

              <Route path="news" element={<NewsList />} />
              <Route path="consultation-ai" element={<ConsultationPage />} />
              <Route
                path="articles-ai-for-doctors"
                element={<SynthesisPage />}
              />
              <Route path="communication" element={<CommunicationLayout />}>
                <Route index element={<EmptyChat />} />

                <Route path=":dialogId" element={<ChatPage />} />
              </Route>
              <Route path="home-page" element={<ProfileDoctorHomePage />} />
              <Route
                path="doctor-profile/:id"
                element={<HomeDoctorMainPage />}
              />

              {/* ARTICLES OF DOCTOR START */}
              <Route path="my-articles" element={<MyArticlesDoctor />} />
              <Route
                path="article-detail/:id"
                element={<SingleArticlePage />}
              />
              <Route
                path="create-my-articles"
                element={<CreateMyArticleDoctor />}
              />
              <Route
                path="update-my-article/:id"
                element={<EditMyArticleDoctor />}
              />
              <Route
                path="all-articles-here"
                element={<ArtislesFromDoctors />}
              />
              <Route path="doctors-articles/:id" element={<DoctorArticles />} />
              {/* ARTICLES OF DOCTOR END */}
              {/* SCIENTIFIC ARTICLES OF DOCTOR START */}
              <Route
                path="my-articles-scientific"
                element={<MyArticlesScientificDoctor />}
              />
              <Route
                path="article-scientific-detail/:id"
                element={<SingleArticleScientificPage />}
              />
              <Route
                path="create-my-articles-scientific"
                element={<CreateMyArticleScientificDoctor />}
              />
              <Route
                path="update-my-article-scientific/:id"
                element={<EditMyArticleScientificDoctor />}
              />
              <Route
                path="all-articles-scientific-here"
                element={<ArtislesScientificFromDoctors />}
              />
              <Route
                path="doctors-articles-scientific/:id"
                element={<DoctorArticlesScientific />}
              />
              {/* SCIENTIFIC ARTICLES OF DOCTOR END */}

              <Route path="all-doctors" element={<DoctorsAll />} />
              <Route path="my-friends-doctors" element={<MyFriendsDoctors />} />
              <Route path="doctors-articles/:id" element={<DoctorArticles />} />
              <Route path="doctor-details/:id" element={<DoctorDetails />} />
              <Route path="doctor-schedule" element={<DoctorSchedule />} />
              <Route
                path="doctor-appointment"
                element={<DoctorAppointment />}
              />
              {/* Отдельная страница записи пациента врачом: календарь + слоты
                  того же генератора, что видит пациент. Журнал приёмов на
                  соседнем маршруте остаётся журналом. */}
              <Route path="book-patient" element={<DoctorBookingPage />} />
              {/* Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В° doctorDashboard */}
              <Route
                path="dashboard"
                element={<DoctorAppointmenDashboardt />}
              />
              <Route
                path="notifications"
                element={<DoctorNotificationsPage />}
              />
              <Route path="audit" element={<AuditTimelinesPage />} />
              <Route
                path="appointments/archive"
                element={<DoctorAppointmentsArchivePage />}
              />
              <Route
                path="black-dates"
                element={<DoctorAppointmenBlackDates />}
              />
              <Route path="audit/:id" element={<DoctorAppointmenAuditId />} />
              <Route
                path="doctor-dashboard-main"
                element={<DoctorDashboardMain />}
              />
            </Route>
            {/* Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р Р‹Р РЋРІвЂћСћ */}
            <Route path="admin" element={<AdminLayout />}>
              <Route path="admin-panel" element={<HomeAdminMainPage />} />
              {/* Тесты и экзамены. AdminLayout уже проверяет права админа,
                  бэкенд закрывает те же роуты ролью admin. */}
              <Route
                path="education-import"
                element={<AdminExamImportPage />}
              />
              <Route
                path="education-review"
                element={<AdminExamReviewPage />}
              />
              <Route
                path="education-programs"
                element={<AdminExamProgramsPage />}
              />
              <Route
                path="education-categories"
                element={<AdminExamCategoriesPage />}
              />
              {/* Лучевая диагностика — авторинг и ревью кейсов чтения снимков. */}
              <Route path="docs" element={<AdminDocsPage />} />
              <Route path="radiology" element={<AdminRadiologyCasesPage />} />
              {/* Станция «Анализы» — авторинг лабораторных кейсов. */}
              <Route path="labs" element={<AdminLabCasesPage />} />
              {/* «Виртуальный пациент» — авторинг клинических сценариев. */}
              <Route path="vp" element={<AdminVpCasesPage />} />
              {/* Аналитика арены — сводка по игрокам, кейсам, пропускам. */}
              <Route path="arena-analytics" element={<AdminArenaAnalyticsPage />} />
              {/* Ручная выдача тарифов и лист ожидания запуска оплаты. */}
              <Route path="billing" element={<AdminBillingPage />} />
              <Route path="overview" element={<AdminDashboardPage />} />
              {/* Посещаемость сайта: экраны, аудитория, источники, скорость. */}
              <Route path="analytics" element={<AdminAnalyticsPage />} />
              <Route path="audit-log" element={<AdminAuditPage />} />
              <Route path="clinics" element={<AdminClinicsPage />} />
              <Route path="doctors" element={<AdminDoctorsPage />} />
              {/* Заведение и правка профилей врачей. Соседний маршрут
                  /doctors — это обзор и рассылка, там ничего не создать. */}
              <Route path="doctors-manage" element={<AdminDoctorsManagePage />} />
              <Route path="verification" element={<AdminVerificationPage />} />
              <Route path="security" element={<AdminSecurityPage />} />
              <Route path="reviews" element={<AdminReviewsPage />} />
              <Route path="features" element={<AdminFeaturesPage />} />
              <Route path="system" element={<AdminSystemPage />} />
              <Route path="database" element={<AdminDatabasePage />} />
              <Route path="users-list" element={<UsersListPage />} />
              <Route
                path="user-detail-update/:userId"
                element={<UserDoctorDetailAdmintPage />}
              />
              <Route path="mongodb" element={<AdminExportCollection />} />
              <Route
                path="mongodb-database"
                element={<AdminExportDatabase />}
              />
              <Route
                path="mongodb-database-import"
                element={<AdminImportDatabase />}
              />
              <Route
                path="mongodb-database-collection"
                element={<AdminImportCollection />}
              />
              <Route
                path="user-detail/:userId"
                element={<UserDetailInformGetDoktor />}
              />
              <Route
                path="user-patient-detail/:userId"
                element={<UserDetailInformGetPatient />}
              />
              <Route
                path="users-role-update/:id"
                element={<UsersRoleUpdate />}
              />
              <Route path="block-user/:id" element={<BlockUser />} />
              <Route path="delete-user/:id" element={<DeleteUser />} />
              <Route
                path="create-categories-of-my-articles"
                element={<CreateCategoryPage />}
              />

              <Route
                path="doctor-detail-edit-page/:id"
                element={<DoctorDetailEditPage />}
              />
              <Route
                path="patient-detail-edit-page/:id"
                element={<PatientDetailEditPage />}
              />

              <Route
                path="polyclinic/get-all"
                element={<PolyclinicStatistic />}
              />
              <Route
                path="patient-detail/:id"
                element={<PolyclinicPatientDetail />}
              />
              <Route
                path="patient-delete-from-polyclinic/:id"
                element={<PolyclinicPatientDelete />}
              />
            </Route>
            {/* Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћвЂ“Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎвЂќР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р Р‹Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС› Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р Р‹Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р РЋРІР‚С” Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р Р‹Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІР‚С”Р В Р Р‹Р РЋРІР‚С”Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р РЋРІР‚С”Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р Р‹Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС› */}
            {/* Публичная витрина клиники по КОРНЕВОМУ slug: /nizami-tibb-merkezi.
                Маршруты динамические → React Router ранжирует их НИЖЕ всех
                статических (/login, /pricing, /patient/* и т.д. срабатывают
                первыми). Старый /clinics/:slug сохранён выше для совместимости. */}
            <Route
              path="/:slug/dp/:pageSlug/articles/:articleSlug"
              element={<PublicArticleDetail />}
            />
            <Route path="/:slug/dp/:pageSlug" element={<PublicCustomPage />} />
            <Route
              path="/:slug/doctors/:doctorId"
              element={<PublicDoctorDetail />}
            />
            <Route
              path="/:slug/publications/:publicationId"
              element={<PublicPublicationDetail />}
            />
            <Route path="/:slug/:section" element={<PublicClinicPage />} />
            <Route path="/:slug" element={<PublicClinicPage />} />

            <Route path="*" element={<Pagenotfound />} />
            </Routes>
          </Suspense>
          {/* Помощник по продукту — на всех страницах, кроме экранов-
              редакторов (список в самом компоненте). Внутри BrowserRouter:
              ему нужен текущий адрес, чтобы понять зону и роль. */}
          <GuideWidget />
          <ToastContainer position="bottom-right" autoClose={5000} />
        </BrowserRouter>
      </GlobalCallProvider>
    </>
  );
}

export default App;
