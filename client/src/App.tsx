import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ExamPage from "./pages/ExamPage";
import RegisterPage from "./pages/RegisterPage";
import CoursePage from "./pages/CoursePage";
import CourseDetailPage from "./pages/CourseDetailPage";
import LessonPage from "./pages/LessonPage";
import UploadLessonPage from "./pages/UploadLessonPage";
import Navbar from "./components/Navbar";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* Home (placeholder) */}
        <Route path="/" element={<h1 className="p-6 text-xl">Home Page</h1>} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        {<Route path="/register" element={<RegisterPage />} />}

        {/* Exam */}
        <Route path="/exam/:examId" element={<ExamPage />} />

        {/* Course */}
        <Route path="/courses" element={<CoursePage />} />
        <Route path="/course/:id" element={<CourseDetailPage />} />
        <Route path="/lesson/:id" element={<LessonPage />} />
        <Route path="/lesson/upload" element={<UploadLessonPage />} />

        {/* Catch-all (404) */}
        <Route path="*" element={<h1 className="p-6 text-red-500">404 Not Found</h1>} />
      </Routes>
    </BrowserRouter>
  );
}
