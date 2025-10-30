import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ExamPage from "./pages/ExamPage";
import RegisterPage from "./pages/RegisterPage";
import CoursePage from "./pages/CoursePage";
import LessonPage from "./pages/LessonPage";

export default function App() {
  return (
    <BrowserRouter>
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
        <Route path="/lesson/:id" element={<LessonPage />} />

        {/* Catch-all (404) */}
        <Route path="*" element={<h1 className="p-6 text-red-500">404 Not Found</h1>} />
      </Routes>
    </BrowserRouter>
  );
}
