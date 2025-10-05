import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ExamPage from "./pages/ExamPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home (placeholder) */}
        <Route path="/" element={<h1 className="p-6 text-xl">Home Page</h1>} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/exam/:examId" element={<ExamPage />} />
        {/* <Route path="/register" element={<RegisterPage />} /> */}

        {/* Catch-all (404) */}
        <Route path="*" element={<h1 className="p-6 text-red-500">404 Not Found</h1>} />
      </Routes>
    </BrowserRouter>
  );
}
