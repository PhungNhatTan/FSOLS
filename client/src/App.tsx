import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CourseStudyPage, LessonPage, ExamPage, ExamDetailDisplay } from "./pages";

// change
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CoursePage from "./pages/CoursePage";
import Navbar from "./components/navbar/Navbar";

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

        {/* Course */}
        <Route path="/courses" element={<CoursePage />} />
        <Route path="/course/:id" element={<CourseStudyPage />}>
          <Route path="lesson/:lessonId" element={<LessonPage />} />
          <Route path="exam/:examId" element={<ExamDetailDisplay />} />
          <Route path="takingExam/:examId" element={<ExamPage />} />
        </Route>

        {/* Catch-all (404) */}
        <Route path="*" element={<h1 className="p-6 text-red-500">404 Not Found</h1>} />
      </Routes>
    </BrowserRouter>
  );
}
