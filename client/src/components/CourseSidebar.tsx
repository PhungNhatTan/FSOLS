import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import http from "../service/http";

interface Lesson {
  Id: number;
  Title: string;
}
interface Exam {
  Id: number;
  Title: string;
}
interface ModuleItem {
  Id: number;
  OrderNo: number;
  CourseLesson?: Lesson | null;
  Exam?: Exam | null;
}
interface CourseModule {
  Id: number;
  OrderNo: number;
  ModuleItems: ModuleItem[];
}
interface CourseNavData {
  CourseModule: CourseModule[];
}

export default function CourseSidebar() {
  const { id } = useParams(); // course id
  const location = useLocation();
  const [data, setData] = useState<CourseNavData | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  // Hide sidebar on taking exam routes
  const hideSidebar = location.pathname.includes("/takingExam");

  useEffect(() => {
    if (!id) return;
    http
      .get(`/course/${id}`)
      .then((res) => setData(res.data))
      .catch((err) => console.error("Failed to load course nav:", err));
  }, [id]);

  if (hideSidebar) return null;

  return (
    <aside className="w-64 bg-gray-100 border-r border-gray-300 h-screen p-4 overflow-y-auto">
      <h2 className="text-xl font-bold mb-4 text-gray-700">Course Navigation</h2>

      {data?.CourseModule?.map((module) => (
        <div key={module.Id} className="mb-3">
          <button
            onClick={() => setExpanded(expanded === module.Id ? null : module.Id)}
            className="w-full text-left font-semibold text-gray-800 hover:text-green-600 mb-1"
          >
            Module {module.OrderNo}
          </button>

          {expanded === module.Id && (
            <ul className="ml-3 border-l border-gray-300 pl-2 space-y-1">
              {module.ModuleItems.map((item) => {
                if (item.CourseLesson) {
                  const path = `/lesson/${item.CourseLesson.Id}`;
                  const active = location.pathname === path;
                  return (
                    <li key={`lesson-${item.CourseLesson.Id}`}>
                      <Link
                        to={path}
                        className={`block text-sm ${
                          active ? "text-green-600 font-medium" : "text-gray-700 hover:text-green-500"
                        }`}
                      >
                        📘 {item.CourseLesson.Title}
                      </Link>
                    </li>
                  );
                }
                if (item.Exam) {
                  const path = `/exam/${item.Exam.Id}`;
                  const active = location.pathname === path;
                  return (
                    <li key={`exam-${item.Exam.Id}`}>
                      <Link
                        to={path}
                        className={`block text-sm ${
                          active ? "text-green-600 font-medium" : "text-gray-700 hover:text-green-500"
                        }`}
                      >
                        📝 {item.Exam.Title}
                      </Link>
                    </li>
                  );
                }
                return null;
              })}
            </ul>
          )}
        </div>
      ))}
    </aside>
  );
}
