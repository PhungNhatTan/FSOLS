import { useEffect, useState, type SetStateAction } from "react";
import { useParams, useLocation } from "react-router-dom";
import http from "../../service/http";
import type { CourseNavData } from "../../types/course";
import ModuleList from "./ModuleList";

export default function CourseSidebar() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [data, setData] = useState<CourseNavData | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const hideSidebar = location.pathname.includes("/takingExam");

  useEffect(() => {
    if (!id) return;
    http
      .get<CourseNavData>(`/course/${id}`)
      .then((res) => setData(res.data))
      .catch((err) => console.error("Failed to load course nav:", err));
  }, [id]);

  if (hideSidebar) return null;

  return (
    <aside className="w-64 bg-gray-100 border-r border-gray-300 h-screen p-4 overflow-y-auto">
      <h2 className="text-xl font-bold mb-4 text-gray-700">Course Navigation</h2>

      {data?.CourseModule && (
        <ModuleList
          modules={data.CourseModule}
          expanded={expanded}
          onToggle={(id: SetStateAction<number | null>) => setExpanded(expanded === id ? null : id)}
        />
      )}
    </aside>
  );
}
