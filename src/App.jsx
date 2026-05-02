import { Routes, Route, BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { GlobalCallProvider } from "./pages/communication/context/GlobalCallProvider";
import { useCurrentUserId } from "./pages/communication/hooks/useCurrentUserId";
import DoctorsAll from "./pages/doctorProfilePages/shared/doctors/doctors";

import DoctorArticlesForPatient from "./pages/patientProfilePages/shared/doctors/doctorsArticles";
import ArtislesFromDoctorsForPatient from "./pages/patientProfilePages/shared/articles/ArticlesFromDoctorsForPatient.jsx";
import DoctorDetails from "./pages/doctorProfilePages/shared/doctors/doctorDetails";
import DoctorDetail from "./pages/patientProfilePages/shared/doctors/doctorDetails";
import TempComplaintsList from "./pages/polyclinic/addpatientpolyclinic/templates/tempComplaintsList.jsx";
import TempAnamnesisMorbiList from "./pages/polyclinic/addpatientpolyclinic/templates/tempAnamnesisMorbiList.jsx";
import TempAnamnesisMorbiDetail from "./pages/polyclinic/addpatientpolyclinic/templates/tempAnamnesisMorbiDetail.jsx";
import TempAnamnesisVitaeList from "./pages/polyclinic/addpatientpolyclinic/templates/tempAnamnesisVitaeList.jsx";
import TempAnamnesisVitaeDetail from "./pages/polyclinic/addpatientpolyclinic/templates/TempAnamnesisVitaeDetail.jsx";
import TempCScanerResultsList from "./pages/polyclinic/addpatientpolyclinic/templates/tempCScanerResultsList.jsx";
import TempCScanerResultsDelail from "./pages/polyclinic/addpatientpolyclinic/templates/tempCScanerResultsDelail.jsx";
import TempMRIResultsList from "./pages/polyclinic/addpatientpolyclinic/templates/tempMRIResultsList.jsx";
import TempMriResultsDeltail from "./pages/polyclinic/addpatientpolyclinic/templates/tempMriResultsDeltail.jsx";
import SearchPatient from "./pages/polyclinic/addpatientpolyclinic/searchPatient.jsx";
import AddPatient from "./pages/patientProfilePages/addPatient/addPatient.jsx";
import SearchPatientFromPatient from "./pages/patientProfilePages/addPatient/searchPatientFromPatient.jsx";
import DeletePatientFromOffice from "./pages/polyclinic/deletePatientFromOffice.jsx";
import Notifications from "./pages/patientProfilePages/Notifications.jsx";

// Импорт страниц авторизации
import Registration from "./pages/auth/register/registration";
import AuthLayout from "./layoutes/authLayout/authLayout";
import Login from "./pages/auth/login/login";
import Confirmationregister from "./pages/auth/confirmationregister/confirmationregister";
import Resetpassword from "./pages/auth/resetpassword/resetpassword";
import Resetpasswordchange from "./pages/auth/resetpassword/resetpasswordchange";
import Otpresetpasswordchange from "./pages/auth/resetpassword/otpresetpasswordchange";
import Pagenotfound from "./pages/pagenotfound/pagenotfound";

// Импорт страниц профиля доктора

import DoctorpofileLayout from "./layoutes/doctorprofileLayout/doctorprofileLayout";
import HomeDoctorMainPage from "./pages/doctorProfilePages/home/homeMainPage";

import ProfileDoctorHomePage from "./pages/doctorProfilePages/home/profileDoctorHomePage.jsx";
import DoctorSchedule from "./pages/doctorProfilePages/schedule/DoctorSchedule.jsx";
import DoctorAppointment from "./pages/doctorProfilePages/appointments/DoctorAppointmentsPage.jsx";
import DoctorAppointmenDashboardt from "./pages/doctorProfilePages/appointments/DoctorAppointmenDashboardt.jsx";
import DoctorAppointmenBlackDates from "./pages/doctorProfilePages/appointments/DoctorAppointmenBlackDates.jsx";
import DoctorAppointmenAuditId from "./pages/doctorProfilePages/appointments/DoctorAppointmenAuditId.jsx";
import DoctorDashboardMain from "./pages/doctorProfilePages/appointments/DoctorDashboardMain.jsx";
import DoctorNotificationsPage from "./pages/doctorProfilePages/notifications/DoctorNotificationsPage.jsx";
import DoctorAppointmentsArchivePage from "./pages/doctorProfilePages/appointments/DoctorAppointmentsArchivePage.jsx";
import AuditTimelinesPage from "./pages/doctorProfilePages/appointments/AuditTimelinesPage.jsx";

import MyArticlesDoctor from "./pages/doctorProfilePages/articles/myArticles";
import SingleArticlePage from "./pages/doctorProfilePages/shared/articles/singleArticle";
import CreateMyArticleDoctor from "./pages/doctorProfilePages/articles/createArticle";
import EditMyArticleDoctor from "./pages/doctorProfilePages/articles/editMyArticleDoctor";
import ArtislesFromDoctors from "./pages/doctorProfilePages/shared/articles/artislesFromDoctors";
import DoctorArticles from "./pages/doctorProfilePages/shared/doctors/doctorsArticles";

import MyArticlesScientificDoctor from "./pages/doctorProfilePages/articles/myArticlesScientific.jsx";
import SingleArticleScientificPage from "./pages/doctorProfilePages/shared/articles/singleArticleScientific.jsx";
import CreateMyArticleScientificDoctor from "./pages/doctorProfilePages/articles/createArticleScientific.jsx";
import EditMyArticleScientificDoctor from "./pages/doctorProfilePages/articles/editMyArticleScientificDoctor.jsx";
import ArtislesScientificFromDoctors from "./pages/doctorProfilePages/shared/articles/artislesScientificFromDoctors.jsx";
import DoctorArticlesScientific from "./pages/doctorProfilePages/shared/doctors/doctorsArticlesScientific";

// Импорт страниц администратора
import AdminLayout from "./layoutes/adminLayout/adminLyout";
import HomeAdminMainPage from "./pages/admin/homePageAdmin";
import UsersListPage from "./pages/admin/user/usersList.jsx";
import UsersRoleUpdate from "./pages/admin/user/UpdateUserRole.jsx";
import BlockUser from "./pages/admin/BlockUser";
import DeleteUser from "./pages/admin/handleDeleteUser";
import UserDoctorDetailAdmintPage from "./pages/admin/user/userDoctorDetailEditAdmin.jsx";
import UserDetailInformGetDoktor from "./pages/admin/user/userDetailInformGetDoktor.jsx";
import CreateCategoryPage from "./pages/admin/doctor/createCategories";
import DoctorDetailEditPage from "./pages/admin/doctor/DoctorDetailEditPage";
import PatientDetailEditPage from "./pages/admin/patient/PatientDetailEditPage";
import UserDetailInformGetPatient from "./pages/admin/patient/UserDetailInformGetPatient";
import PolyclinicStatistic from "./pages/admin/polyclinic/PolyclinicStatistic";
import PolyclinicPatientDetail from "./pages/admin/patient/PolyclinicPatientDetail";
import PolyclinicPatientDelete from "./pages/admin/patient/PolyclinicPatientDelete";
import AdminExportCollection from "./pages/admin/components/AdminExportCollection";

// Импорт страниц поликлиники
import MainPolyclinicLayout from "./layoutes/polyclinic/MainPolyclinicLayout";
import Polyclinic from "./pages/polyclinic/polyclinic";
import Patientdetail from "./pages/polyclinic/patientdetail";
import PrivatePatientDetail from "./pages/polyclinic/privatePatientDetail.jsx";

import Addpatient from "./pages/polyclinic/addpatientpolyclinic/addpatientpolyclinic";
import AddPatientMedicalHistory from "./pages/polyclinic/addpatientpolyclinic/addPatientMedicalHistory";
import MedicalHistory from "./pages/polyclinic/medicalHistory";

// Импорт шаблонов медицинских записей
import TempComplaints from "./pages/polyclinic/addpatientpolyclinic/templates/tempComplaints";
import ComplaintDetail from "./pages/polyclinic/addpatientpolyclinic/templates/ComplaintDetail";
import TempAnamnesisMorbi from "./pages/polyclinic/addpatientpolyclinic/templates/tempAnamnesisMorbi";
import TempAnamnesisVitae from "./pages/polyclinic/addpatientpolyclinic/templates/tempAnamnesisVitae";
import TempRecommendations from "./pages/polyclinic/addpatientpolyclinic/templates/tempRecommendations";
import TempStatusLocalis from "./pages/polyclinic/addpatientpolyclinic/templates/tempStatusLocalis";
import TempStatusPreasens from "./pages/polyclinic/addpatientpolyclinic/templates/tempStatusPreasens";
import TempMriResults from "./pages/polyclinic/addpatientpolyclinic/templates/tempMriResults";
import TempCScanerResults from "./pages/polyclinic/addpatientpolyclinic/templates/tempCScanerResults";
import TempUltrasoundResults from "./pages/polyclinic/addpatientpolyclinic/templates/tempUltrasoundResults";
import TempLaboratoryTestResults from "./pages/polyclinic/addpatientpolyclinic/templates/tempLaboratoryTestResults";

// Импорт страниц профиля пациента
import PatientNotificationsMain from "./pages/patientProfilePages/notifications/PatientNotificationsPage.jsx";
import PatientAppointmentsMain from "./pages/patientProfilePages/appointments/PatientAppointmentsMain.jsx";
import PatientAppointmentsHistory from "./pages/patientProfilePages/appointments/PatientAppointmentsHistory.jsx";
import PatientsMyAppointment from "./pages/patientProfilePages/appointments/PatientMyAppointmentsPage.jsx";
import PatientAppointment from "./pages/patientProfilePages/appointments/PatientAppointmentsPage.jsx";
import PatientLayout from "./layoutes/patientLayout/patientLayout";
import HomePatientMainPage from "./pages/patientProfilePages/home/HomePatientMainPage";
import PatientHomePage from "./pages/patientProfilePages/home/PatientHomePage.jsx";
import SingleArticleForPatient from "./pages/patientProfilePages/shared/articles/singleArticle";
import DoctorsAllForPatient from "./pages/patientProfilePages/shared/doctors/doctors";
import AddEEGScanUpload from "./pages/polyclinic/addpatientpolyclinic/addExaminations/addEEGScanUpload.jsx";
import EEGScanerDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EEGScanerTemplateAdd/EEGScanerDetails.jsx";
import EEGScanTemplateNameofexam from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EEGScanerTemplateAdd/EEGScanTemplateNameofexam.jsx";
import EEGScanerTemplateReport from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EEGScanerTemplateAdd/EEGScanerTemplateReport.jsx";
import EEGScanerTemplateDiagnosis from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EEGScanerTemplateAdd/EEGScanerTemplateDiagnosis.jsx";
import EEGScanerTemplateRecomendation from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EEGScanerTemplateAdd/EEGScanerTemplateRecomendation.jsx";
import EEGScanTemplateNameofexamList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EEGScanerTemplateAdd/EEGScanTemplateNameofexamList.jsx";
import EEGScanerTemplateReportList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EEGScanerTemplateAdd/EEGScanerTemplateReportList.jsx";
import SPECTScanerTemplateDiagnosisList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/SPECTcanerTemplateAdd/SPECTScanerTemplateDiagnosisList.jsx";
import EEGScanerTemplateDiagnosisList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EEGScanerTemplateAdd/EEGScanerTemplateDiagnosisList.jsx";
import EEGScanTemplateNameofexamEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EEGScanerTemplateAdd/EEGScanTemplateNameofexamEdit.jsx";
import EEGScanerTemplateReportEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EEGScanerTemplateAdd/EEGScanerTemplateReportEdit.jsx";
import EEGScanerTemplateDiagnosisEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EEGScanerTemplateAdd/EEGScanerTemplateDiagnosisEdit.jsx";
import EEGScanerTemplateRecomendationEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EEGScanerTemplateAdd/EEGScanerTemplateRecomendationEdit.jsx";
import EEGScanTemplateNameofexamDetail from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EEGScanerTemplateAdd/EEGScanTemplateNameofexamDetail.jsx";
import EEGScanerTemplateReportDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EEGScanerTemplateAdd/EEGScanerTemplateReportDetails.jsx";
import EEGScanerTemplateDiagnosisDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EEGScanerTemplateAdd/EEGScanerTemplateDiagnosisDetails.jsx";
import EEGScanerTemplateRecomendationDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EEGScanerTemplateAdd/EEGScanerTemplateRecomendationDetails.jsx";
import AddSPECTScanUpload from "./pages/polyclinic/addpatientpolyclinic/addExaminations/addSPECTScanUpload.jsx";
import SPECTScanerDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/SPECTcanerTemplateAdd/SPECTScanerDetails.jsx";
import SPECTScanTemplateNameofexam from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/SPECTcanerTemplateAdd/SPECTScanTemplateNameofexam.jsx";
import SPECTScanerTemplateReport from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/SPECTcanerTemplateAdd/SPECTScanerTemplateReport.jsx";
import SPECTScanerTemplateDiagnosis from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/SPECTcanerTemplateAdd/SPECTScanerTemplateDiagnosis.jsx";
import SPECTScanerTemplateRecomendation from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/SPECTcanerTemplateAdd/SPECTScanerTemplateRecomendation.jsx";
import SPECTScanTemplateNameofexamList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/SPECTcanerTemplateAdd/SPECTScanTemplateNameofexamList.jsx";
import SPECTScanerTemplateReportList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/SPECTcanerTemplateAdd/SPECTScanerTemplateReportList.jsx";
import SPECTScanerTemplateRecomendationList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/SPECTcanerTemplateAdd/SPECTScanerTemplateRecomendationList.jsx";
import SPECTScanTemplateNameofexamEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/SPECTcanerTemplateAdd/SPECTScanTemplateNameofexamEdit.jsx";
import SPECTScanerTemplateReportEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/SPECTcanerTemplateAdd/SPECTScanerTemplateReportEdit.jsx";
import SPECTScanerTemplateDiagnosisEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/SPECTcanerTemplateAdd/SPECTScanerTemplateDiagnosisEdit.jsx";
import SPECTScanerTemplateRecomendationEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/SPECTcanerTemplateAdd/SPECTScanerTemplateRecomendationEdit.jsx";
import SPECTScanTemplateNameofexamDetail from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/SPECTcanerTemplateAdd/SPECTScanTemplateNameofexamDetail.jsx";
import SPECTScanerTemplateReportDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/SPECTcanerTemplateAdd/SPECTScanerTemplateReportDetails.jsx";
import SPECTScanerTemplateDiagnosisDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/SPECTcanerTemplateAdd/SPECTScanerTemplateDiagnosisDetails.jsx";
import SPECTScanerTemplateRecomendationDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/SPECTcanerTemplateAdd/SPECTScanerTemplateRecomendationDetails.jsx";
import AddPETScanUpload from "./pages/polyclinic/addpatientpolyclinic/addExaminations/addPETScanUpload.jsx";
import PETScanerDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/PETScanerTemplateAdd/PETScanerDetails.jsx";
import PETScanTemplateNameofexam from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/PETScanerTemplateAdd/PETScanTemplateNameofexam.jsx";
import PETScanerTemplateReport from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/PETScanerTemplateAdd/PETScanerTemplateReport.jsx";
import PETScanerTemplateDiagnosis from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/PETScanerTemplateAdd/PETScanerTemplateDiagnosis.jsx";
import PETScanerTemplateRecomendation from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/PETScanerTemplateAdd/PETScanerTemplateRecomendation.jsx";
import PETScanTemplateNameofexamList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/PETScanerTemplateAdd/PETScanTemplateNameofexamList.jsx";
import PETScanerTemplateReportList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/PETScanerTemplateAdd/PETScanerTemplateReportList.jsx";
import PETScanerTemplateDiagnosisList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/PETScanerTemplateAdd/PETScanerTemplateDiagnosisList.jsx";
import PETScanerTemplateRecomendationList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/PETScanerTemplateAdd/PETScanerTemplateRecomendationList.jsx";
import PETScanTemplateNameofexamEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/PETScanerTemplateAdd/PETScanTemplateNameofexamEdit.jsx";
import PETScanerTemplateReportEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/PETScanerTemplateAdd/PETScanerTemplateReportEdit.jsx";
import PETScanerTemplateDiagnosisEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/PETScanerTemplateAdd/PETScanerTemplateDiagnosisEdit.jsx";
import PETScanerTemplateRecomendationEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/PETScanerTemplateAdd/PETScanerTemplateRecomendationEdit.jsx";
import PETScanTemplateNameofexamDetail from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/PETScanerTemplateAdd/PETScanTemplateNameofexamDetail.jsx";
import PETScanerTemplateReportDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/PETScanerTemplateAdd/PETScanerTemplateReportDetails.jsx";
import PETScanerTemplateDiagnosisDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/PETScanerTemplateAdd/PETScanerTemplateDiagnosisDetails.jsx";
import PETScanerTemplateRecomendationDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/PETScanerTemplateAdd/PETScanerTemplateRecomendationDetails.jsx";
import AddXRAYScanUpload from "./pages/polyclinic/addpatientpolyclinic/addExaminations/addXRAYScanUpload.jsx";
import XRAYScanerDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/XRAYScanerTemplateAdd/XRAYScanerDetails.jsx";
import XRAYScanTemplateNameofexam from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/XRAYScanerTemplateAdd/XRAYScanTemplateNameofexam.jsx";
import XRAYScanerTemplateReport from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/XRAYScanerTemplateAdd/XRAYScanerTemplateReport.jsx";
import XRAYScanerTemplateDiagnosis from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/XRAYScanerTemplateAdd/XRAYScanerTemplateDiagnosis.jsx";
import XRAYScanerTemplateRecomendation from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/XRAYScanerTemplateAdd/XRAYScanerTemplateRecomendation.jsx";
import XRAYScanTemplateNameofexamList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/XRAYScanerTemplateAdd/XRAYScanTemplateNameofexamList.jsx";
import XRAYScanerTemplateReportList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/XRAYScanerTemplateAdd/XRAYScanerTemplateReportList.jsx";
import XRAYScanerTemplateDiagnosisList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/XRAYScanerTemplateAdd/XRAYScanerTemplateDiagnosisList.jsx";
import XRAYScanerTemplateRecomendationList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/XRAYScanerTemplateAdd/XRAYScanerTemplateRecomendationList.jsx";
import XRAYScanTemplateNameofexamEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/XRAYScanerTemplateAdd/XRAYScanTemplateNameofexamEdit.jsx";
import XRAYScanerTemplateReportEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/XRAYScanerTemplateAdd/XRAYScanerTemplateReportEdit.jsx";
import XRAYScanerTemplateDiagnosisEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/XRAYScanerTemplateAdd/XRAYScanerTemplateDiagnosisEdit.jsx";
import XRAYScanerTemplateRecomendationEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/XRAYScanerTemplateAdd/XRAYScanerTemplateRecomendationEdit.jsx";
import XRAYScanTemplateNameofexamDetail from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/XRAYScanerTemplateAdd/XRAYScanTemplateNameofexamDetail.jsx";
import XRAYScanerTemplateReportDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/XRAYScanerTemplateAdd/XRAYScanerTemplateReportDetails.jsx";
import XRAYScanerTemplateDiagnosisDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/XRAYScanerTemplateAdd/XRAYScanerTemplateDiagnosisDetails.jsx";
import XRAYScanerTemplateRecomendationDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/XRAYScanerTemplateAdd/XRAYScanerTemplateRecomendationDetails.jsx";
import AddUSMScanUpload from "./pages/polyclinic/addpatientpolyclinic/addExaminations/addUSMScanUpload.jsx";
import USMScanerDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/USMScanerTemplateAdd/USMScanerDetails.jsx";
import USMScanTemplateNameofexamList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/USMScanerTemplateAdd/USMScanerTemplateNameofexamList.jsx";
import USMScanerTemplateReportList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/USMScanerTemplateAdd/USMScanerTemplateReportList.jsx";
import USMScanerTemplateDiagnosisList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/USMScanerTemplateAdd/USMScanerTemplateDiagnosisList.jsx";
import USMScanerTemplateRecomendationList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/USMScanerTemplateAdd/USMScanerTemplateRecomendationList.jsx";
import USMScanTemplateNameofexam from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/USMScanerTemplateAdd/USMScanerTemplateNameofexam.jsx";
import USMScanTemplateReport from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/USMScanerTemplateAdd/USMScanerTemplateReport.jsx";
import USMScanerTemplateDiagnosis from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/USMScanerTemplateAdd/USMScanerTemplateDiagnosis.jsx";
import USMScanerTemplateRecomendation from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/USMScanerTemplateAdd/USMScanerTemplateRecomendation.jsx";
import USMScanTemplateNameofexamEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/USMScanerTemplateAdd/USMScanerTemplateNameofexamEdit.jsx";
import USMScanerTemplateReportEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/USMScanerTemplateAdd/USMScanerTemplateReportEdit.jsx";
import USMScanerTemplateDiagnosisEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/USMScanerTemplateAdd/USMScanerTemplateDiagnosisEdit.jsx";
import USMScanerTemplateRecomendationEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/USMScanerTemplateAdd/USMScanerTemplateRecomendationEdit.jsx";
import USMScanerTemplateRecomendationDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/USMScanerTemplateAdd/USMScanerTemplateRecomendationDetails.jsx";
import USMScanerTemplateReportDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/USMScanerTemplateAdd/USMScanerTemplateReportDetails.jsx";
import USMScanerTemplateDiagnosisDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/USMScanerTemplateAdd/USMScanerTemplateDiagnosisDetails.jsx";
import AddCTScanUpload from "./pages/polyclinic/addpatientpolyclinic/addExaminations/addCTScanUpload.jsx";
import CTScanerDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CTScanerTemplateAdd/CTScanerDetails.jsx";
import CTScanTemplateNameofexam from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CTScanerTemplateAdd/CTScanTemplateNameofexam.jsx";
import CTScanerTemplateReport from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CTScanerTemplateAdd/CTScanerTemplateReport.jsx";
import CTScanerTemplateDiagnosis from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CTScanerTemplateAdd/CTScanerTemplateDiagnosis.jsx";
import CTScanerTemplateRecomendation from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CTScanerTemplateAdd/CTScanerTemplateRecomendation.jsx";
import CTScanTemplateNameofexamList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CTScanerTemplateAdd/CTScanTemplateNameofexamList.jsx";
import CTScanerTemplateReportList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CTScanerTemplateAdd/CTScanerTemplateReportList.jsx";
import CTScanerTemplateDiagnosisList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CTScanerTemplateAdd/CTScanerTemplateDiagnosisList.jsx";
import CTScanerTemplateRecomendationList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CTScanerTemplateAdd/CTScanerTemplateRecomendationList.jsx";
import CTScanTemplateNameofexamEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CTScanerTemplateAdd/CTScanTemplateNameofexamEdit.jsx";
import CTScanerTemplateReportEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CTScanerTemplateAdd/CTScanerTemplateReportEdit.jsx";
import CTScanerTemplateDiagnosisEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CTScanerTemplateAdd/CTScanerTemplateDiagnosisEdit.jsx";
import CTScanerTemplateRecomendationEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CTScanerTemplateAdd/CTScanerTemplateRecomendationEdit.jsx";
import CTScanTemplateNameofexamDetail from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CTScanerTemplateAdd/CTScanTemplateNameofexamDetail.jsx";
import CTScanerTemplateReportDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CTScanerTemplateAdd/CTScanerTemplateReportDetails.jsx";
import CTScanerTemplateDiagnosisDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CTScanerTemplateAdd/CTScanerTemplateDiagnosisDetails.jsx";
import CTScanerTemplateRecomendationDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CTScanerTemplateAdd/CTScanerTemplateRecomendationDetails.jsx";
import AddMRIScanUpload from "./pages/polyclinic/addpatientpolyclinic/addExaminations/addMRIScanUpload.jsx";
import MRIScanerDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/MRIScanerTemplateAdd/MRIScanerDetails.jsx";
import MRIScanTemplateNameofexam from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/MRIScanerTemplateAdd/MRIScanTemplateNameofexam.jsx";
import MRIScanerTemplateReport from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/MRIScanerTemplateAdd/MRIScanerTemplateReport.jsx";
import MRIScanerTemplateDiagnosis from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/MRIScanerTemplateAdd/MRIScanerTemplateDiagnosis.jsx";
import MRIScanerTemplateRecomendation from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/MRIScanerTemplateAdd/MRIScanerTemplateRecomendation.jsx";
import MRIScanTemplateNameofexamList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/MRIScanerTemplateAdd/MRIScanTemplateNameofexamList.jsx";
import MRIScanerTemplateReportList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/MRIScanerTemplateAdd/MRIScanerTemplateReportList.jsx";
import MRIScanerTemplateDiagnosisList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/MRIScanerTemplateAdd/MRIScanerTemplateDiagnosisList.jsx";
import MRIScanerTemplateRecomendationList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/MRIScanerTemplateAdd/MRIScanerTemplateRecomendationList.jsx";
import MRIScanTemplateNameofexamEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/MRIScanerTemplateAdd/MRIScanTemplateNameofexamEdit.jsx";
import MRIScanerTemplateReportEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/MRIScanerTemplateAdd/MRIScanerTemplateReportEdit.jsx";
import MRIScanerTemplateDiagnosisEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/MRIScanerTemplateAdd/MRIScanerTemplateDiagnosisEdit.jsx";
import MRIScanerTemplateRecomendationEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/MRIScanerTemplateAdd/MRIScanerTemplateRecomendationEdit.jsx";
import MRIScanTemplateNameofexamDetail from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/MRIScanerTemplateAdd/MRIScanTemplateNameofexamDetail.jsx";
import MRIScanerTemplateReportDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/MRIScanerTemplateAdd/MRIScanerTemplateReportDetails.jsx";
import MRIScanerTemplateDiagnosisDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/MRIScanerTemplateAdd/MRIScanerTemplateDiagnosisDetails.jsx";
import MRIScanerTemplateRecomendationDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/MRIScanerTemplateAdd/MRIScanerTemplateRecomendationDetails.jsx";
import TempAdditionalDiagnosis from "./pages/polyclinic/addpatientpolyclinic/templates/tempAdditionalDiagnosis.jsx";
import TempAdditionalDiagnosisList from "./pages/polyclinic/addpatientpolyclinic/templates/tempAdditionalDiagnosisList.jsx";
import TempAdditionalDiagnosisDetail from "./pages/polyclinic/addpatientpolyclinic/templates/tempAdditionalDiagnosisDetail.jsx";
import TempLaboratoryResultsDetail from "./pages/polyclinic/addpatientpolyclinic/templates/tempLaboratoryResultsDetail.jsx";
import TempUltrasoundResultsList from "./pages/polyclinic/addpatientpolyclinic/templates/tempUltrasoundResultsList.jsx";
import TempLaboratoryResultsList from "./pages/polyclinic/addpatientpolyclinic/templates/tempLaboratoryResultsList.jsx";
import TempRecommendationsList from "./pages/polyclinic/addpatientpolyclinic/templates/tempRecommendationsList.jsx";
import TempStatusPreasensList from "./pages/polyclinic/addpatientpolyclinic/templates/tempStatusPreasensList.jsx";
import TempStatusPreasensDetail from "./pages/polyclinic/addpatientpolyclinic/templates/tempStatusPreasensDetail.jsx";
import TempRecommendationsDetail from "./pages/polyclinic/addpatientpolyclinic/templates/tempRecommendationsDetail.jsx";
import TempUltrasoundResultsDetail from "./pages/polyclinic/addpatientpolyclinic/templates/tempUltrasoundResultsDetail.jsx";
import TempStatusLocalisDetail from "./pages/polyclinic/addpatientpolyclinic/templates/tempStatusLocalisDetail.jsx";
import TempStatusLocalisList from "./pages/polyclinic/addpatientpolyclinic/templates/tempStatusLocalisList.jsx";
import AddGinecologyUpload from "./pages/polyclinic/addpatientpolyclinic/addExaminations/addGinecologyUpload.jsx";
import GinecologyDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/GinecologyTemplateAdd/GinecologyDetails.jsx";
import GinecologyTemplateNameofexam from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/GinecologyTemplateAdd/GinecologyTemplateNameofexam.jsx";
import GinecologyTemplateReport from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/GinecologyTemplateAdd/GinecologyTemplateReport.jsx";
import GinecologyTemplateDiagnosis from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/GinecologyTemplateAdd/GinecologyTemplateDiagnosis.jsx";
import GinecologyTemplateRecomendation from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/GinecologyTemplateAdd/GinecologyTemplateRecomendation.jsx";
import GinecologyTemplateNameofexamList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/GinecologyTemplateAdd/GinecologyTemplateNameofexamList.jsx";
import GinecologyTemplateReportList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/GinecologyTemplateAdd/GinecologyTemplateReportList.jsx";
import GinecologyTemplateDiagnosisList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/GinecologyTemplateAdd/GinecologyTemplateDiagnosisList.jsx";
import GinecologyTemplateRecomendationList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/GinecologyTemplateAdd/GinecologyTemplateRecomendationList.jsx";
import GinecologyTemplateNameofexamEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/GinecologyTemplateAdd/GinecologyTemplateNameofexamEdit.jsx";
import GinecologyTemplateDiagnosisEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/GinecologyTemplateAdd/GinecologyTemplateDiagnosisEdit.jsx";
import GinecologyTemplateReportEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/GinecologyTemplateAdd/GinecologyTemplateReportEdit.jsx";
import GinecologyTemplateRecomendationEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/GinecologyTemplateAdd/GinecologyTemplateRecomendationEdit.jsx";
import GinecologyTemplateNameofexamDetail from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/GinecologyTemplateAdd/GinecologyTemplateNameofexamDetail.jsx";
import GinecologyTemplateReportDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/GinecologyTemplateAdd/GinecologyTemplateReportDetails.jsx";
import GinecologyTemplateDiagnosisDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/GinecologyTemplateAdd/GinecologyTemplateDiagnosisDetails.jsx";
import GinecologyTemplateRecomendationDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/GinecologyTemplateAdd/GinecologyTemplateRecomendationDetails.jsx";
import AddHOLTERScanUpload from "./pages/polyclinic/addpatientpolyclinic/addExaminations/addHOLTERScanUpload.jsx";
import HOLTERScanerDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/HOLTERScanerTemplateAdd/HOLTERScanerDetails.jsx";
import HOLTERScanTemplateNameofexam from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/HOLTERScanerTemplateAdd/HOLTERScanerTemplateNameofexam.jsx";
import HOLTERScanTemplateReport from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/HOLTERScanerTemplateAdd/HOLTERScanerTemplateReport.jsx";
import HOLTERScanerTemplateDiagnosis from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/HOLTERScanerTemplateAdd/HOLTERScanerTemplateDiagnosis.jsx";
import HOLTERScanerTemplateRecomendation from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/HOLTERScanerTemplateAdd/HOLTERScanerTemplateRecomendation.jsx";
import HOLTERScanTemplateNameofexamList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/HOLTERScanerTemplateAdd/HOLTERScanerTemplateNameofexamList.jsx";
import HOLTERScanerTemplateReportList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/HOLTERScanerTemplateAdd/HOLTERScanerTemplateReportList.jsx";
import HOLTERScanerTemplateDiagnosisList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/HOLTERScanerTemplateAdd/HOLTERScanerTemplateDiagnosisList.jsx";
import EEGScanerTemplateRecomendationList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EEGScanerTemplateAdd/EEGScanerTemplateRecomendationList.jsx";
import HOLTERScanerTemplateRecomendationList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/HOLTERScanerTemplateAdd/HOLTERScanerTemplateRecomendationList.jsx";
import HOLTERScanTemplateNameofexamEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/HOLTERScanerTemplateAdd/HOLTERScanerTemplateNameofexamEdit.jsx";
import HOLTERScanerTemplateReportEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/HOLTERScanerTemplateAdd/HOLTERScanerTemplateReportEdit.jsx";
import HOLTERScanerTemplateDiagnosisEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/HOLTERScanerTemplateAdd/HOLTERScanerTemplateDiagnosisEdit.jsx";
import HOLTERScanerTemplateRecomendationEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/HOLTERScanerTemplateAdd/HOLTERScanerTemplateRecomendationEdit.jsx";
import HOLTERScanTemplateNameofexamDetail from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/HOLTERScanerTemplateAdd/HOLTERScanerTemplateNameofexamDetail.jsx";
import HOLTERScanerTemplateReportDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/HOLTERScanerTemplateAdd/HOLTERScanerTemplateReportDetails.jsx";
import HOLTERScanerTemplateDiagnosisDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/HOLTERScanerTemplateAdd/HOLTERScanerTemplateDiagnosisDetails.jsx";
import HOLTERScanerTemplateRecomendationDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/HOLTERScanerTemplateAdd/HOLTERScanerTemplateRecomendationDetails.jsx";
import AddSpirometryScanUpload from "./pages/polyclinic/addpatientpolyclinic/addExaminations/addSpirometryScanUpload.jsx";
import SpirometryScanerDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/SpirometryScanerTemplateAdd/SpirometryScanerDetails.jsx";
import SpirometryScanTemplateNameofexam from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/SpirometryScanerTemplateAdd/SpirometryScanTemplateNameofexam.jsx";
import SpirometryScanerTemplateReport from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/SpirometryScanerTemplateAdd/SpirometryScanerTemplateReport.jsx";
import SpirometryScanerTemplateDiagnosis from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/SpirometryScanerTemplateAdd/SpirometryScanerTemplateDiagnosis.jsx";
import SpirometryScanerTemplateRecomendation from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/SpirometryScanerTemplateAdd/SpirometryScanerTemplateRecomendation.jsx";
import SpirometryScanTemplateNameofexamList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/SpirometryScanerTemplateAdd/SpirometryScanTemplateNameofexamList.jsx";
import SpirometryScanerTemplateReportList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/SpirometryScanerTemplateAdd/SpirometryScanerTemplateReportList.jsx";
import SpirometryScanerTemplateDiagnosisList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/SpirometryScanerTemplateAdd/SpirometryScanerTemplateDiagnosisList.jsx";
import SpirometryScanerTemplateRecomendationList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/SpirometryScanerTemplateAdd/SpirometryScanerTemplateRecomendationList.jsx";
import SpirometryScanTemplateNameofexamEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/SpirometryScanerTemplateAdd/SpirometryScanTemplateNameofexamEdit.jsx";
import SpirometryScanerTemplateReportEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/SpirometryScanerTemplateAdd/SpirometryScanerTemplateReportEdit.jsx";
import SpirometryScanerTemplateDiagnosisEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/SpirometryScanerTemplateAdd/SpirometryScanerTemplateDiagnosisEdit.jsx";
import SpirometryScanerTemplateRecomendationEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/SpirometryScanerTemplateAdd/SpirometryScanerTemplateRecomendationEdit.jsx";
import SpirometryScanTemplateNameofexamDetail from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/SpirometryScanerTemplateAdd/SpirometryScanTemplateNameofexamDetail.jsx";
import SpirometryScanerTemplateReportDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/SpirometryScanerTemplateAdd/SpirometryScanerTemplateReportDetails.jsx";
import SpirometryScanerTemplateDiagnosisDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/SpirometryScanerTemplateAdd/SpirometryScanerTemplateDiagnosisDetails.jsx";
import SpirometryScanerTemplateRecomendationDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/SpirometryScanerTemplateAdd/SpirometryScanerTemplateRecomendationDetails.jsx";
import AddDoplerScanUpload from "./pages/polyclinic/addpatientpolyclinic/addExaminations/addDoplerScanUpload.jsx";
import DopleryScanerDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/DoplerScanerTemplateAdd/DoplerScanerDetails.jsx";
import DoplerScanTemplateNameofexam from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/DoplerScanerTemplateAdd/DoplerScanTemplateNameofexam.jsx";
import DoplerScanerTemplateReport from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/DoplerScanerTemplateAdd/DoplerScanerTemplateReport.jsx";
import DoplerScanerTemplateDiagnosis from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/DoplerScanerTemplateAdd/DoplerScanerTemplateDiagnosis.jsx";
import DoplerScanerTemplateRecomendation from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/DoplerScanerTemplateAdd/DoplerScanerTemplateRecomendation.jsx";
import DoplerScanTemplateNameofexamList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/DoplerScanerTemplateAdd/DoplerScanTemplateNameofexamList.jsx";
import DoplerScanerTemplateReportList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/DoplerScanerTemplateAdd/DoplerScanerTemplateReportList.jsx";
import DoplerScanerTemplateDiagnosisList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/DoplerScanerTemplateAdd/DoplerScanerTemplateDiagnosisList.jsx";
import DoplerScanerTemplateRecomendationList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/DoplerScanerTemplateAdd/DoplerScanerTemplateRecomendationList.jsx";
import DoplerScanTemplateNameofexamEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/DoplerScanerTemplateAdd/DoplerScanTemplateNameofexamEdit.jsx";
import DoplerScanerTemplateReportEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/DoplerScanerTemplateAdd/DoplerScanerTemplateReportEdit.jsx";
import DoplerScanerTemplateDiagnosisEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/DoplerScanerTemplateAdd/DoplerScanerTemplateDiagnosisEdit.jsx";
import DoplerScanerTemplateRecomendationEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/DoplerScanerTemplateAdd/DoplerScanerTemplateRecomendationEdit.jsx";
import DoplerScanTemplateNameofexamDetail from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/DoplerScanerTemplateAdd/DoplerScanTemplateNameofexamDetail.jsx";
import DoplerScanerTemplateReportDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/DoplerScanerTemplateAdd/DoplerScanerTemplateReportDetails.jsx";
import DoplerScanerTemplateRecomendationDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/DoplerScanerTemplateAdd/DoplerScanerTemplateRecomendationDetails.jsx";
import DoplerScanerTemplateDiaqnosisDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/DoplerScanerTemplateAdd/DoplerScanerTemplateDiagnosisDetails.jsx";
import AddGastroscopyScanUpload from "./pages/polyclinic/addpatientpolyclinic/addExaminations/addGastroscopyScanUpload.jsx";
import GastroscopyScanerDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/GastroscopyScanerTemplateAdd/GastroscopyScanerDetails.jsx";
import GastroscopyScanTemplateNameofexam from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/GastroscopyScanerTemplateAdd/GastroscopyScanTemplateNameofexam.jsx";
import GastroscopyScanerTemplateReport from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/GastroscopyScanerTemplateAdd/GastroscopyScanerTemplateReport.jsx";
import GastroscopyScanerTemplateDiagnosis from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/GastroscopyScanerTemplateAdd/GastroscopyScanerTemplateDiagnosis.jsx";
import GastroscopyScanerTemplateRecomendation from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/GastroscopyScanerTemplateAdd/GastroscopyScanerTemplateRecomendation.jsx";
import GastroscopyScanTemplateNameofexamList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/GastroscopyScanerTemplateAdd/GastroscopyScanTemplateNameofexamList.jsx";
import GastroscopyScanerTemplateDiagnosisList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/GastroscopyScanerTemplateAdd/GastroscopyScanerTemplateDiagnosisList.jsx";
import GastroscopyScanerTemplateRecomendationList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/GastroscopyScanerTemplateAdd/GastroscopyScanerTemplateRecomendationList.jsx";
import GastroscopyScanTemplateNameofexamEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/GastroscopyScanerTemplateAdd/GastroscopyScanTemplateNameofexamEdit.jsx";
import GastroscopyScanerTemplateReportEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/GastroscopyScanerTemplateAdd/GastroscopyScanerTemplateReportEdit.jsx";
import GastroscopyScanerTemplateDiagnosisEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/GastroscopyScanerTemplateAdd/GastroscopyScanerTemplateDiagnosisEdit.jsx";
import GastroscopyScanerTemplateRecomendationEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/GastroscopyScanerTemplateAdd/GastroscopyScanerTemplateRecomendationEdit.jsx";
import GastroscopyScanTemplateNameofexamDetail from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/GastroscopyScanerTemplateAdd/GastroscopyScanTemplateNameofexamDetail.jsx";
import GastroscopyScanerTemplateReportDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/GastroscopyScanerTemplateAdd/GastroscopyScanerTemplateReportDetails.jsx";
import GastroscopyScanerTemplateDiagnosisDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/GastroscopyScanerTemplateAdd/GastroscopyScanerTemplateDiagnosisDetails.jsx";
import GastroscopyScanerTemplateRecomendationDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/GastroscopyScanerTemplateAdd/GastroscopyScanerTemplateRecomendationDetails.jsx";
import AddCapsulEndoscopyScanUpload from "./pages/polyclinic/addpatientpolyclinic/addExaminations/addCapsulEndoscopyScanUpload.jsx";
import CapsuleEndoscopyScanerDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CapsuleEndoscopyScanerTemplateAdd/CapsuleEndoscopyScanerDetails.jsx";
import CapsuleEndoscopyScanTemplateNameofexam from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CapsuleEndoscopyScanerTemplateAdd/CapsuleEndoscopyScanTemplateNameofexam.jsx";
import CapsuleEndoscopyScanerTemplateReport from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CapsuleEndoscopyScanerTemplateAdd/CapsuleEndoscopyScanerTemplateReport.jsx";
import CapsuleEndoscopyScanerTemplateDiagnosis from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CapsuleEndoscopyScanerTemplateAdd/CapsuleEndoscopyScanerTemplateDiagnosis.jsx";
import CapsuleEndoscopyScanerTemplateRecomendation from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CapsuleEndoscopyScanerTemplateAdd/CapsuleEndoscopyScanerTemplateRecomendation.jsx";
import CapsuleEndoscopyScanTemplateNameofexamList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CapsuleEndoscopyScanerTemplateAdd/CapsuleEndoscopyScanTemplateNameofexamList.jsx";
import CapsuleEndoscopyScanerTemplateReportList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CapsuleEndoscopyScanerTemplateAdd/CapsuleEndoscopyScanerTemplateReportList.jsx";
import CapsuleEndoscopyScanerTemplateDiagnosisList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CapsuleEndoscopyScanerTemplateAdd/CapsuleEndoscopyScanerTemplateDiagnosisList.jsx";
import CapsuleEndoscopyScanTemplateNameofexamEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CapsuleEndoscopyScanerTemplateAdd/CapsuleEndoscopyScanTemplateNameofexamEdit.jsx";
import CapsuleEndoscopyScanerTemplateReportEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CapsuleEndoscopyScanerTemplateAdd/CapsuleEndoscopyScanerTemplateReportEdit.jsx";
import CapsuleEndoscopyScanerTemplateDiagnosisEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CapsuleEndoscopyScanerTemplateAdd/CapsuleEndoscopyScanerTemplateDiagnosisEdit.jsx";
import CapsuleEndoscopyScanTemplateNameofexamDetail from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CapsuleEndoscopyScanerTemplateAdd/CapsuleEndoscopyScanTemplateNameofexamDetail.jsx";
import CapsuleEndoscopyScanerTemplateReportDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CapsuleEndoscopyScanerTemplateAdd/CapsuleEndoscopyScanerTemplateReportDetails.jsx";
import CapsuleEndoscopyScanerTemplateDiagnosisDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CapsuleEndoscopyScanerTemplateAdd/CapsuleEndoscopyScanerTemplateDiagnosisDetails.jsx";
import CapsuleEndoscopyScanerTemplateRecomendationDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CapsuleEndoscopyScanerTemplateAdd/CapsuleEndoscopyScanerTemplateRecomendationDetails.jsx";
import CapsuleEndoscopyScanerTemplateRecomendationList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CapsuleEndoscopyScanerTemplateAdd/CapsuleEndoscopyScanerTemplateRecomendationList.jsx";
import CapsuleEndoscopyScanerTemplateRecomendationEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CapsuleEndoscopyScanerTemplateAdd/CapsuleEndoscopyScanerTemplateRecomendationEdit.jsx";
import AddAngiographyScanUpload from "./pages/polyclinic/addpatientpolyclinic/addExaminations/addAngiographyScanUpload.jsx";
import AngiographyScanerDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/AngiographyScanerTemplateAdd/AngiographyScanerDetails.jsx";
import AngiographyScanTemplateNameofexam from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/AngiographyScanerTemplateAdd/AngiographyScanerTemplateNameofexam.jsx";
import AngiographyScanTemplateReport from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/AngiographyScanerTemplateAdd/AngiographyScanerTemplateReport.jsx";
import AngiographyScanerTemplateDiagnosis from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/AngiographyScanerTemplateAdd/AngiographyScanerTemplateDiagnosis.jsx";
import AngiographyScanerTemplateRecomendation from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/AngiographyScanerTemplateAdd/AngiographyScanerTemplateRecomendation.jsx";
import AngiographyScanTemplateNameofexamList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/AngiographyScanerTemplateAdd/AngiographyScanerTemplateNameofexamList.jsx";
import AngiographyScanerTemplateReportList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/AngiographyScanerTemplateAdd/AngiographyScanerTemplateReportList.jsx";
import AngiographyRScanerTemplateDiagnosisList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/AngiographyScanerTemplateAdd/AngiographyScanerTemplateDiagnosisList.jsx";
import AngiographyScanerTemplateRecomendationList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/AngiographyScanerTemplateAdd/AngiographyScanerTemplateRecomendationList.jsx";
import AngiographyScanTemplateNameofexamEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/AngiographyScanerTemplateAdd/AngiographyScanerTemplateNameofexamEdit.jsx";
import AngiographyScanerTemplateReportEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/AngiographyScanerTemplateAdd/AngiographyScanerTemplateReportEdit.jsx";
import AngiographyScanerTemplateDiagnosisEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/AngiographyScanerTemplateAdd/AngiographyScanerTemplateDiagnosisEdit.jsx";
import AngiographyScanerTemplateRecomendationEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/AngiographyScanerTemplateAdd/AngiographyScanerTemplateRecomendationEdit.jsx";
import AngiographyScanTemplateNameofexamDetail from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/AngiographyScanerTemplateAdd/AngiographyScanerTemplateNameofexamDetail.jsx";
import AngiographyScanerTemplateReportDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/AngiographyScanerTemplateAdd/AngiographyScanerTemplateReportDetails.jsx";
import AngiographyScanerTemplateDiagnosisDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/AngiographyScanerTemplateAdd/AngiographyScanerTemplateDiagnosisDetails.jsx";
import AngiographyScanerTemplateRecomendationDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/AngiographyScanerTemplateAdd/AngiographyScanerTemplateRecomendationDetails.jsx";
import AddEKGScanUpload from "./pages/polyclinic/addpatientpolyclinic/addExaminations/addEKGScanUpload.jsx";
import EKGScanerDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EKGScanerTemplateAdd/EKGScanerDetails.jsx";
import EKGScanTemplateNameofexam from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EKGScanerTemplateAdd/EKGScanerTemplateNameofexam.jsx";
import EKGScanTemplateReport from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EKGScanerTemplateAdd/EKGScanerTemplateReport.jsx";
import EKGScanerTemplateDiagnosis from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EKGScanerTemplateAdd/EKGScanerTemplateDiagnosis.jsx";
import EKGScanerTemplateRecomendation from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EKGScanerTemplateAdd/EKGScanerTemplateRecomendation.jsx";
import EKGScanTemplateNameofexamList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EKGScanerTemplateAdd/EKGScanerTemplateNameofexamList.jsx";
import EKGScanerTemplateReportList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EKGScanerTemplateAdd/EKGScanerTemplateReportList.jsx";
import EKGRScanerTemplateDiagnosisList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EKGScanerTemplateAdd/EKGScanerTemplateDiagnosisList.jsx";
import EKGScanerTemplateRecomendationList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EKGScanerTemplateAdd/EKGScanerTemplateRecomendationList.jsx";
import EKGScanTemplateNameofexamEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EKGScanerTemplateAdd/EKGScanerTemplateNameofexamEdit.jsx";
import EKGScanerTemplateReportEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EKGScanerTemplateAdd/EKGScanerTemplateReportEdit.jsx";
import EKGScanerTemplateDiagnosisEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EKGScanerTemplateAdd/EKGScanerTemplateDiagnosisEdit.jsx";
import EKGScanerTemplateRecomendationEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EKGScanerTemplateAdd/EKGScanerTemplateRecomendationEdit.jsx";
import EKGScanTemplateNameofexamDetail from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EKGScanerTemplateAdd/EKGScanerTemplateNameofexamDetail.jsx";
import EKGScanerTemplateReportDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EKGScanerTemplateAdd/EKGScanerTemplateReportDetails.jsx";
import EKGScanerTemplateDiagnosisDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EKGScanerTemplateAdd/EKGScanerTemplateDiagnosisDetails.jsx";
import EKGScanerTemplateRecomendationDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EKGScanerTemplateAdd/EKGScanerTemplateRecomendationDetails.jsx";
import AddEchoEKGScanUpload from "./pages/polyclinic/addpatientpolyclinic/addExaminations/addEchoEKGScanUpload.jsx";
import EchoEKGScanerDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EchoEKGScanerTemplateAdd/EchoEKGScanerDetails.jsx";
import EchoEKGScanTemplateNameofexam from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EchoEKGScanerTemplateAdd/EchoEKGScanerTemplateNameofexam.jsx";
import EchoEKGScanTemplateReport from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EchoEKGScanerTemplateAdd/EchoEKGScanerTemplateReport.jsx";
import EchoEKGScanerTemplateDiagnosis from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EchoEKGScanerTemplateAdd/EchoEKGScanerTemplateDiagnosis.jsx";
import EchoEKGScanerTemplateRecomendation from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EchoEKGScanerTemplateAdd/EchoEKGScanerTemplateRecomendation.jsx";
import EchoEKGScanTemplateNameofexamList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EchoEKGScanerTemplateAdd/EchoEKGScanerTemplateNameofexamList.jsx";
import EchoEKGScanerTemplateReportList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EchoEKGScanerTemplateAdd/EchoEKGScanerTemplateReportList.jsx";
import EchoEKGRScanerTemplateDiagnosisList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EchoEKGScanerTemplateAdd/EchoEKGScanerTemplateDiagnosisList.jsx";
import EchoEKGScanerTemplateRecomendationList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EchoEKGScanerTemplateAdd/EchoEKGScanerTemplateRecomendationList.jsx";
import EchoEKGScanTemplateNameofexamEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EchoEKGScanerTemplateAdd/EchoEKGScanerTemplateNameofexamEdit.jsx";
import EchoEKGScanerTemplateReportEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EchoEKGScanerTemplateAdd/EchoEKGScanerTemplateReportEdit.jsx";
import EchoEKGScanerTemplateDiagnosisEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EchoEKGScanerTemplateAdd/EchoEKGScanerTemplateDiagnosisEdit.jsx";
import EchoEKGScanerTemplateRecomendationEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EchoEKGScanerTemplateAdd/EchoEKGScanerTemplateRecomendationEdit.jsx";
import EchoEKGScanTemplateNameofexamDetail from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EchoEKGScanerTemplateAdd/EchoEKGScanerTemplateNameofexamDetail.jsx";
import EchoEKGScanerTemplateReportDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EchoEKGScanerTemplateAdd/EchoEKGScanerTemplateReportDetails.jsx";
import EchoEKGScanerTemplateDiagnosisDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EchoEKGScanerTemplateAdd/EchoEKGScanerTemplateDiagnosisDetails.jsx";
import EchoEKGScanerTemplateRecomendationDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/EchoEKGScanerTemplateAdd/EchoEKGScanerTemplateRecomendationDetails.jsx";
import AddCoronographyScanUpload from "./pages/polyclinic/addpatientpolyclinic/addExaminations/addCoronographyScanUpload.jsx";
import CoronographyScanerDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CoronographyScanerTemplateAdd/CoronographyScanerDetails.jsx";
import CoronographyScanTemplateNameofexam from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CoronographyScanerTemplateAdd/CoronographyScanerTemplateNameofexam.jsx";
import CoronographyScanTemplateReport from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CoronographyScanerTemplateAdd/CoronographyScanerTemplateReport.jsx";
import CoronographyScanerTemplateDiagnosis from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CoronographyScanerTemplateAdd/CoronographyScanerTemplateDiagnosis.jsx";
import CoronographyScanerTemplateRecomendation from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CoronographyScanerTemplateAdd/CoronographyScanerTemplateRecomendation.jsx";
import CoronographyScanTemplateNameofexamList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CoronographyScanerTemplateAdd/CoronographyScanerTemplateNameofexamList.jsx";
import CoronographyScanerTemplateReportList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CoronographyScanerTemplateAdd/CoronographyScanerTemplateReportList.jsx";
import CoronographyRScanerTemplateDiagnosisList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CoronographyScanerTemplateAdd/CoronographyScanerTemplateDiagnosisList.jsx";
import CoronographyScanerTemplateRecomendationList from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CoronographyScanerTemplateAdd/CoronographyScanerTemplateRecomendationList.jsx";
import CoronographyScanTemplateNameofexamEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CoronographyScanerTemplateAdd/CoronographyScanerTemplateNameofexamEdit.jsx";
import CoronographyScanerTemplateReportEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CoronographyScanerTemplateAdd/CoronographyScanerTemplateReportEdit.jsx";
import CoronographyScanerTemplateDiagnosisEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CoronographyScanerTemplateAdd/CoronographyScanerTemplateDiagnosisEdit.jsx";
import CoronographyScanerTemplateRecomendationEdit from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CoronographyScanerTemplateAdd/CoronographyScanerTemplateRecomendationEdit.jsx";
import CoronographyScanTemplateNameofexamDetail from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CoronographyScanerTemplateAdd/CoronographyScanerTemplateNameofexamDetail.jsx";
import CoronographyScanerTemplateReportDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CoronographyScanerTemplateAdd/CoronographyScanerTemplateReportDetails.jsx";
import CoronographyScanerTemplateDiagnosisDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CoronographyScanerTemplateAdd/CoronographyScanerTemplateDiagnosisDetails.jsx";
import CoronographyScanerTemplateRecomendationDetails from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/CoronographyScanerTemplateAdd/CoronographyScanerTemplateRecomendationDetails.jsx";
import AddLabTest from "./pages/polyclinic/addpatientpolyclinic/addExaminations/AddLabTest.jsx";
import DetailsLabTest from "./pages/polyclinic/addpatientpolyclinic/templateExaminations/LabScanerTemplateAdd/LabtestScanerDetails.jsx";
import MyDoctors from "./pages/patientProfilePages/myDoctors/myDoctors.jsx";
import MyFriendsDoctors from "./pages/doctorProfilePages/shared/doctors/MyFriendsDoctors.jsx";
import MyMedicalHistories from "./pages/patientProfilePages/MyMedicalHistories/MyMedicalHistories.jsx";
import MyMedicalHistoryDetail from "./pages/patientProfilePages/MyMedicalHistories/MyMedicalHistoryDetail.jsx";
import PatientFileFilter from "./pages/patientProfilePages/MyMedicalHistories/getPatientFiles.jsx";
import PatientFileDetailLab from "./pages/patientProfilePages/MyMedicalHistories/MyExams/PatientFileDetailLab.jsx";
import PatientFileDetailCT from "./pages/patientProfilePages/MyMedicalHistories/MyExams/PatientFileDetailCT.jsx";
import PatientFileDetailMRI from "./pages/patientProfilePages/MyMedicalHistories/MyExams/PatientFileDetailMRI.jsx";
import PatientFileDetailUSM from "./pages/patientProfilePages/MyMedicalHistories/MyExams/PatientFileDetailUSM.jsx";
import PatientFileDetailXRAY from "./pages/patientProfilePages/MyMedicalHistories/MyExams/PatientFileDetailXRAY.jsx";
import PatientFileDetailPETSCAN from "./pages/patientProfilePages/MyMedicalHistories/MyExams/PatientFileDetailPETSCAN.jsx";
import PatientFileDetailSPECTscan from "./pages/patientProfilePages/MyMedicalHistories/MyExams/PatientFileDetailSPECTscan.jsx";
import PatientFileDetailEEGscan from "./pages/patientProfilePages/MyMedicalHistories/MyExams/PatientFileDetailEEGscan.jsx";
import PatientFileDetailGinekologyScan from "./pages/patientProfilePages/MyMedicalHistories/MyExams/PatientFileDetailGinecology.jsx";
import PatientFileDetailHolterScan from "./pages/patientProfilePages/MyMedicalHistories/MyExams/PatientFileDetailHolter.jsx";
import PatientFileDetailSpirometry from "./pages/patientProfilePages/MyMedicalHistories/MyExams/PatientFileDetailSpirometry.jsx";
import PatientFileDetailDopler from "./pages/patientProfilePages/MyMedicalHistories/MyExams/PatientFileDetailDopler.jsx";
import PatientFileDetailGastroscopy from "./pages/patientProfilePages/MyMedicalHistories/MyExams/PatientFileDetailGastroscopy.jsx";
import PatientFileDetailCapsuleEndoscopy from "./pages/patientProfilePages/MyMedicalHistories/MyExams/PatientFileDetailCapsuleEndoscopy.jsx";
import PatientFileDetailAngiographyScan from "./pages/patientProfilePages/MyMedicalHistories/MyExams/PatientFileDetailAngiographyScan.jsx";
import PatientFileDetailEKGScan from "./pages/patientProfilePages/MyMedicalHistories/MyExams/PatientFileDetailEKGScan.jsx";
import PatientFileDetailECHOEKGScan from "./pages/patientProfilePages/MyMedicalHistories/MyExams/PatientFileDetailEchoEKGScan.jsx";
import PatientFileDetailECoronographyScan from "./pages/patientProfilePages/MyMedicalHistories/MyExams/PatientFileDetailCoronographyScan.jsx";
import PricingPage from "./pages/PricingPage.jsx";
import DemoPage from "./pages/demo/DemoPage.jsx";
import AdminExportDatabase from "./pages/admin/components/AdminExportDatabase";
import AdminImportCollection from "./pages/admin/components/AdminImportCollection.jsx";
import TermsConsentPage from "./pages/auth/TermsConsentPage.jsx";
import AddPrivatePatientPolyclinic from "./pages/polyclinic/addpatientpolyclinic/addPrivatePatientPolyclinic";
import PatientClinicalSummary from "./pages/ai/PatientClinicalSummary.jsx";
import ChatPage from "./pages/communication/ChatPage.jsx";
import CommunicationLayout from "./layoutes/CommunicationLayout/CommunicationLayout.jsx";
import EmptyChat from "./pages/communication/components/EmptyChat.jsx";
import NewsList from "./pages/NewsAI/NewsList.jsx";
import NewsArticle from "./pages/NewsAI/NewsArticle";
import SynthesisPage from "./pages/SynthesisPage/SynthesisPage.jsx";
import SynthesisArticlePage from "./pages/SynthesisPage/SynthesisArticlePage.jsx";
import DoctorDetailsForAll from "./pages/doctorProfilePages/shared/doctors/doctorDetailForAll.jsx";
import SingleArticleScientificForAll from "./pages/doctorProfilePages/shared/articles/singleArticleScientificForAll.jsx";
import SingleArticleForAll from "./pages/doctorProfilePages/shared/articles/SingleArticleForAll.jsx";
import DashboardLayout from "./layoutes/DashboardLayout/DashboardLayout.jsx";
import AdminImportDatabase from "./pages/admin/components/AdminImportDatabase.jsx";
import ConsultationPage from "./pages/ai/ConsultationPage.jsx";
import AboutPage from "./pages/AboutPage.jsx";

import SurgeryPage from "./pages/surgery/SurgeryPage";
import SurgeryNewCase from "./pages/surgery/SurgeryNewCase";
import SurgeryCasePage from "./pages/surgery/SurgeryCasePage";
import UserSynthesisPage from "./pages/UserSynthesis/UserSynthesisPage.jsx";
import UserSynthesisResultPage from "./pages/UserSynthesis/UserSynthesisResultPage.jsx";

// Anthropometry module pages
import CasesListPage from "./pages/anthropometry/pages/CasesListPage.jsx";
import CaseDetailPage from "./pages/anthropometry/pages/CaseDetailPage.jsx";
import StudyDetailPage from "./pages/anthropometry/pages/StudyDetailPage.jsx";
import PhotoAnnotationPage from "./pages/anthropometry/pages/PhotoAnnotationPage.jsx";
import ComparePage from "./pages/anthropometry/pages/ComparePage.jsx";
import { PlanListPage, PlanEditorPage } from "./pages/simulation";
import HelpPage from "./pages/simulation/pages/HelpPage.jsx";
import SimulationHubPage from "./pages/simulation/pages/SimulationHubPage.jsx";
import { BreastListPage, BreastEditorPage } from "./pages/simulation";
function App() {
  const currentUserId = useCurrentUserId();
  return (
    <>
      <GlobalCallProvider currentUserId={currentUserId}>
        <BrowserRouter
          future={{
            v7_relativeSplatPath: true,
            v7_startTransition: true,
          }}
        >
          <Routes>
            <Route path="/consultation" element={<ConsultationPage />} />
            <Route path="/user-synthesis" element={<UserSynthesisPage />} />
            <Route
              path="/user-synthesis/result"
              element={<UserSynthesisResultPage />}
            />
            <Route
              path="/user-synthesis/my/:id"
              element={<UserSynthesisResultPage />}
            />
            <Route path="/public" element={<DashboardLayout />}>
              <Route path="about" element={<AboutPage />} />
              <Route path="articles" element={<SynthesisPage />} />
              <Route path="news/:slug" element={<NewsArticle />} />
              <Route path="articles/:id" element={<SynthesisArticlePage />} />
              <Route
                path="articles/:id/:lang"
                element={<SynthesisArticlePage />}
              />
              <Route path="news" element={<NewsList />} />

              <Route
                path="doctor-profile/article-detail-for-all/:id"
                element={<SingleArticleForAll />}
              />
              <Route
                path="doctor/article-scientific-detail-for-all/:id"
                element={<SingleArticleScientificForAll />}
              />
              <Route
                path="doctor-profile/doctor-details/:id"
                element={<DoctorDetailsForAll />}
              />
            </Route>
            {/* Здесь перечислены все маршруты для раздела ПОЛИКЛИНИКА */}
            <Route path="/dp" element={<MainPolyclinicLayout />}>
              <Route path="simulation" element={<SimulationHubPage />} />
              <Route path="simulation/help" element={<HelpPage />} />
              {/* Face — старый список и editor под /face */}
              <Route path="simulation/face" element={<PlanListPage />} />
              <Route
                path="simulation/face/plans/:id"
                element={<PlanEditorPage />}
              />
              {/* Backwards compat — старый URL /simulation/plans/:id */}
              <Route path="simulation/plans/:id" element={<PlanEditorPage />} />
              {/* Breast — placeholder, реализуем в Phase 3B */}
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
              {/* Здесь перечислены все маршруты для раздела CORONOGRAPHY EKG END */}

              {/* Здесь перечислены все маршруты для раздела ECHO EKG START */}
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
              {/* Здесь перечислены все маршруты для раздела ECHO EKG END */}

              {/* Здесь перечислены все маршруты для раздела EKG START */}
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
              {/* Здесь перечислены все маршруты для раздела EKG END */}

              {/* Здесь перечислены все маршруты для раздела Angography START */}
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
              {/* Здесь перечислены все маршруты для раздела Angography END */}
              {/* Здесь перечислены все маршруты для раздела Capsule Endoscopy START */}
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
              {/* Здесь перечислены все маршруты для раздела Capsule Endoscopy END */}

              {/* Здесь перечислены все маршруты для раздела GASTROSCOPY START */}
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
              {/* Здесь перечислены все маршруты для раздела GASTROSCOPY END */}

              {/* Здесь перечислены все маршруты для раздела DOPLER START */}
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
              {/* Здесь перечислены все маршруты для раздела DOPLER END */}
              {/* Здесь перечислены все маршруты для раздела SPIROMETR START */}
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
              {/* Здесь перечислены все маршруты для раздела SPIROMETR END */}

              {/* Здесь перечислены все маршруты для раздела HOLTER MONITOR START */}
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
              {/* Здесь перечислены все маршруты для раздела HOLTER MONITOR END */}

              {/* Здесь перечислены все маршруты для раздела Ginecology Test START */}
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
              {/* Здесь перечислены все маршруты для раздела Ginecology Test END */}

              {/* Здесь перечислены все маршруты для раздела EEG scan START */}
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
              {/* Здесь перечислены все маршруты для раздела EEG scan END */}

              {/* Здесь перечислены все маршруты для раздела SPECT scan START */}
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
              {/* Здесь перечислены все маршруты для раздела SPECT scan END */}

              {/* Здесь перечислены все маршруты для раздела PET scan START */}
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
              {/* Здесь перечислены все маршруты для раздела PET scan END */}

              {/* Здесь перечислены все маршруты для раздела XRAY scan START */}
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
              {/* Здесь перечислены все маршруты для раздела XRAY scan END */}

              {/* Здесь перечислены все маршруты для раздела USM scan START */}
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
              {/* Здесь перечислены все маршруты для раздела USM scan END */}

              {/* Здесь перечислены все маршруты для раздела CT scan START */}
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

              {/* Здесь ЗАКАНЧИВАЮТСЯ все маршруты для раздела CT scan START */}

              {/* Здесь перечислены все маршруты для раздела MRI scan START */}
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
              {/* Здесь ЗАКАНЧИВАЮТСЯ все маршруты для раздела MRI scan START */}

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
            {/* Здесь перечислены все маршруты для раздела РЕГИСТРАЦИИ И АВТОРИЗАЦИИ */}
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

            {/* Здесь перечислены все маршруты для раздела ПРОФИЛЬ ПАЦИЕНТА */}
            <Route path="/patient" element={<PatientLayout />}>
              <Route path="news" element={<NewsList />} />
              <Route
                path="articles-ai-for-patients"
                element={<SynthesisPage />}
              />

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
              {/* Здесь перечислены все маршруты для раздела шаблоны исследований ПАЦИЕНТА */}
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
              {/* Здесь перечислены все маршруты для раздела шаблоны исследований ПАЦИЕНТА */}
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
            {/* Здесь перечислены все маршруты для раздела ПРОФИЛЬ ДОКТОРА */}
            <Route path="/doctor" element={<DoctorpofileLayout />}>
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
              {/* Здесь перечислены все маршруты для раздела doctorDashboard */}
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
            {/* Здесь перечислены все маршруты для раздела АДМИН */}
            <Route path="admin" element={<AdminLayout />}>
              <Route path="admin-panel" element={<HomeAdminMainPage />} />
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
            {/* Здесь перечислены все маршруты для раздела СТРАНИЦА НЕ НАЙДЕНА */}
            <Route path="*" element={<Pagenotfound />} />
          </Routes>
          <ToastContainer position="bottom-right" autoClose={5000} />
        </BrowserRouter>
      </GlobalCallProvider>
    </>
  );
}

export default App;
