// src/App.tsx
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar/Navbar";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CoursePage from "./pages/CoursePage";
import CourseDetailPage from "./pages/CourseDetailPage";
import LessonPage from "./components/lesson/LessonPage";
import ExamPage from "./components/exam/ExamPage";

import Dashboard from "./pages/mentor/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/authProvider";

import ManageLayout from "./layout/ManageLayout";
import RootRedirect from "./components/RootRedirect";

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <Routes>
          ...
        </Routes>
      </AuthProvider>

      <Routes>
        {/* Public */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Lesson / Exam */}
        <Route path="/lesson/:id" element={<LessonPage />} />
        <Route path="/exam/:examId" element={<ExamPage />} />

        {/* Courses */}
        <Route path="/courses" element={<CoursePage />} />
        <Route path="/courses/:id" element={<CourseDetailPage />} />

        {/* Mentor Dashboard */}
        <Route path="/manage" element={
          <ProtectedRoute allowedRoles={["Mentor"]}>
            <ManageLayout />
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<Dashboard />} />
        </Route>

        {/* 404 */}
        <Route
          path="*"
          element={<h1 className="p-6 text-red-500">404 Not Found</h1>}
        />
      </Routes>
    </Router>
  );
}
