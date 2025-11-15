import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import courseApi from "../api/course";

/** Kiểu dữ liệu rút gọn cho list */
type CourseListItem = { Id: number; Name: string; Description?: string };

/** Fallback demo khi API lỗi */
const MOCK_COURSES: CourseListItem[] = [
  { Id: 1001, Name: "React + TS A-Z", Description: "Khoá học thực chiến" },
  { Id: 1002, Name: "Python Data", Description: "Phân tích dữ liệu cơ bản" },
];

export default function CoursePage() {
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      // BE của bạn: courseApi.getAll() -> GET /course
      const data = await courseApi.getAll();
      // Nếu BE trả kiểu khác, map về {Id,Name,Description} tại đây
      setCourses((data as any[]).map((x) => ({
        Id: x.Id ?? x.id,
        Name: x.Name ?? x.name ?? x.Title ?? "Untitled",
        Description: x.Description ?? x.description ?? "",
      })));
    } catch (e) {
      setError("Failed to load courses");
      setCourses([]); // clear để thấy banner lỗi + nút demo
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Courses</h1>

        {/* Thanh action luôn hiện (kể cả khi lỗi) */}
        <div className="flex gap-2">
          <button
            onClick={load}
            className="px-3 py-2 rounded-lg border hover:bg-slate-50"
          >
            Thử lại
          </button>
          <button
            onClick={() => { setCourses(MOCK_COURSES); setError(""); setLoading(false); }}
            className="px-3 py-2 rounded-lg bg-indigo-600 text-white hover:opacity-90"
          >
            Dùng dữ liệu demo
          </button>
        </div>
      </div>

      {loading && <p>Loading courses...</p>}

      {!loading && error && (
        <div className="mb-4 text-red-500">{error}</div>
      )}

      {!loading && courses.length === 0 && !error && (
        <p>Không có khóa học.</p>
      )}

      {!loading && courses.length > 0 && (
        <ul className="space-y-3">
          {courses.map((c) => (
            <li
              key={c.Id}
              className="flex items-start justify-between gap-3 border rounded-xl p-4 hover:bg-slate-50"
            >
              <div>
                <Link
                  to={`/courses/${c.Id}`}
                  className="text-indigo-600 font-medium hover:underline"
                >
                  {c.Name}
                </Link>
                {c.Description && (
                  <p className="text-slate-600 text-sm">{c.Description}</p>
                )}
              </div>

              {/* Nút Manage — luôn hiện để bạn demo */}
              <div className="shrink-0">
                <Link
                  to={`/courses/${c.Id}/manage`}
                  className="px-3 py-2 rounded-lg border hover:bg-slate-100 text-sm"
                >
                  Manage
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
