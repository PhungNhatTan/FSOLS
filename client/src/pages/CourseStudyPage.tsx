// src/pages/CourseStudyPage.tsx
import { Outlet, useParams } from "react-router-dom";
import CourseSidebar from "../components/public/courseSidebar/CourseSidebar";

export default function CourseStudyPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <CourseSidebar />

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto bg-white p-6">
        <Outlet context={{ courseId: id }} />
      </main>
    </div>
  );
}
