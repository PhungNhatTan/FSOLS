// src/App.tsx
import { HashRouter as Router, Routes, Route } from "react-router-dom"
import Navbar from "./components/public/navbar/Navbar"

// Public Pages
import LoginPage from "./pages/public/LoginPage"
import RegisterPage from "./pages/public/RegisterPage"
import LessonPage from "./components/public/lesson/LessonPage"
import ExamPage from "./components/public/exam/ExamPage"
import ExamDetailDisplay from "./components/public/exam/ExamDetailDisplay"
import CertificatePage from "./pages/public/CertificatePage"
import VerifyEmailPage from "./pages/public/VerifyEmailPage";

// Mentor Pages
import Dashboard from "./pages/mentor/Dashboard"
import CourseManagePageMentor from "./pages/mentor/CourseManagePage"
import CoursesPageMentor from "./pages/mentor/CoursesPage"
import CourseDetailPage from "./pages/public/CourseDetailPage"
import QuestionBankPage from "./pages/QuestionBankPage"
import UploadLessonPage from "./pages/mentor/UploadLessonPage"

// Public Pages
import CoursePage from "./pages/public/CoursePage"
import MyCoursesPage from "./pages/public/MyCoursesPage"
import ProfilePage from "./pages/public/ProfilePage"
import EditProfilePage from "./pages/public/EditProfilePage"

// Moderator Pages
import DashboardManager from "./pages/moderator/Dashboard"
import CourseManagePageManager from "./pages/moderator/CoursesManagePage"
import CertificatesPageAdmin from "./pages/moderator/CertificatesPage"
import CourseDraftPreviewPage from "./pages/moderator/CourseDraftPreviewPage"

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard"
import AccountsPage from "./pages/admin/AccountsPage"

// Auth
import ProtectedRoute from "./components/ProtectedRoute"
import { AuthProvider } from "./context/authProvider"

// Layouts and Helpers
import ModeratorLayout from "./layout/ModeratorLayout"
import ManageLayout from "./layout/ManageLayout"
import AdminLayout from "./layout/AdminLayout"
import RootRedirect from "./components/RootRedirect"
import HomePage from "./pages/public/HomePage"
import { CourseStudyPage } from "./pages"

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <Routes>
          {/* Public */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* Lesson / Exam */}
          <Route path="/lesson/:id" element={<LessonPage />} />
          <Route path="/exam-detail/:examId" element={<ExamDetailDisplay />} />
          <Route path="/exam/:examId" element={<ExamPage />} />

          {/* Courses */}
          <Route path="/courses" element={<CoursePage />} />
          <Route path="/my-courses" element={<MyCoursesPage />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={["Student"]}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/edit"
            element={
              <ProtectedRoute allowedRoles={["Student"]}>
                <EditProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="/course/:id" element={<CourseDetailPage />} />
          <Route path="/course/:courseId/takingExam/:examId" element={<ExamPage />} />
          <Route path="/course-study/:id" element={<CourseStudyPage />} />

          {/* Mentor Dashboard */}
          <Route
            path="/manage"
            element={
              <ProtectedRoute allowedRoles={["Mentor"]}>
                <ManageLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="courses" element={<CoursesPageMentor />} />
            <Route path="course/:id" element={<CourseManagePageMentor />} />
            <Route path="lesson/upload" element={<UploadLessonPage />} />
            <Route path="questions" element={<QuestionBankPage />} />
          </Route>

          {/* Moderator Dashboard */}
          <Route
            path="/moderator"
            element={
              <ProtectedRoute allowedRoles={["Moderator"]}>
                <ModeratorLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<DashboardManager />} />
            <Route path="courses" element={<CourseManagePageManager />} />
            <Route path="course/:id/preview" element={<CourseDraftPreviewPage />} />
            <Route path="certificates" element={<CertificatesPageAdmin />} />
          </Route>

          {/* Admin Dashboard */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="accounts" element={<AccountsPage />} />
            <Route path="courses" element={<CourseManagePageManager />} />
            <Route path="certificates" element={<CertificatesPageAdmin />} />
          </Route>

          {/* Certificate */}
          <Route path="/certificate/:accountId/:certificateId" element={<CertificatePage />} />

          {/* 404 */}
          <Route path="*" element={<h1 className="p-6 text-red-500">404 Not Found</h1>} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}
