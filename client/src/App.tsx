// src/App.tsx
import { HashRouter as Router, Routes, Route } from "react-router-dom"
import Navbar from "./components/public/navbar/Navbar"

// Public Pages
import LoginPage from "./pages/public/LoginPage"
import RegisterPage from "./pages/public/RegisterPage"
import LessonPage from "./components/public/lesson/LessonPage"
import ExamPage from "./components/public/exam/ExamPage"

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

// Moderator Pages
import DashboardManager from "./pages/moderator/Dashboard"
import CourseManagePageManager from "./pages/moderator/CoursesManagePage"
import CertificatesPageAdmin from "./pages/moderator/CertificatesPage"

// Auth
import ProtectedRoute from "./components/ProtectedRoute"
import { AuthProvider } from "./context/authProvider"

// Layouts and Helpers
import ModeratorLayout from "./layout/ModeratorLayout"
import ManageLayout from "./layout/ManageLayout"
import RootRedirect from "./components/RootRedirect"
import HomePage from "./pages/public/HomePage"
import CourseDraftPreviewPage from "./pages/moderator/CourseDraftPreviewPage"

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

          {/* Lesson / Exam */}
          <Route path="/lesson/:id" element={<LessonPage />} />
          <Route path="/exam/:examId" element={<ExamPage />} />

          {/* Courses */}
          <Route path="/courses" element={<CoursePage />} />
          <Route path="/my-courses" element={<MyCoursesPage />} />
          <Route path="/course/:id" element={<CourseDetailPage />} />

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
              <ProtectedRoute allowedRoles={["Moderator","Admin"]}>
                <ModeratorLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<DashboardManager />} />
            <Route path="courses" element={<CourseManagePageManager />} />
            <Route path="course/:id/preview" element={<CourseDraftPreviewPage />} />
            <Route path="certificates" element={<CertificatesPageAdmin />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<h1 className="p-6 text-red-500">404 Not Found</h1>} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}
