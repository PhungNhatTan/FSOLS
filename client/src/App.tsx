// App.tsx
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar/Navbar";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CoursePage from "./pages/CoursePage";
import CourseDetailPage from "./pages/CourseDetailPage";
import CourseManagePage from "./pages/CourseManagePage";

export default function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />

        {/* Courses */}
        <Route path="/courses" element={<CoursePage />} />
        <Route path="/courses/:id" element={<CourseDetailPage />} />
        <Route path="/courses/:id/manage" element={<CourseManagePage />} /> {/* ✅ */}

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="*" element={<h1 className="p-6 text-red-500">404 Not Found</h1>} />
      </Routes>
    </Router>
  );
}
