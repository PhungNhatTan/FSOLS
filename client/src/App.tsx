import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CoursePage from "./pages/CoursePage";
import CourseDetailPage from "./pages/CourseDetailPage";
import Navbar from "./components/navbar/Navbar";
import HomePage from "./pages/HomePage";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* Home (placeholder) */}
        <Route path="/" element={<HomePage/>} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        {<Route path="/register" element={<RegisterPage />} />}

        {/* Exam */}

        {/* Course */}
        <Route path="/courses" element={<CoursePage />} />
        <Route path="/courses/:id" element={<CourseDetailPage />} />

        {/* Catch-all (404) */}
        <Route path="*" element={<h1 className="p-6 text-red-500">404 Not Found</h1>} />
      </Routes>
    </BrowserRouter>
  );
}
