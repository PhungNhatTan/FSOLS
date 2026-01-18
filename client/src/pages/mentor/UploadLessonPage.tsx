import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function UploadLessonPage() {
  const { user } = useAuth();

  const isAuthorized = user && (user.role === "Mentor" || user.role === "Admin");

  const location = useLocation();
  const courseIdParam = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const raw = params.get("courseId");
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [location.search]);

  if (!isAuthorized) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Access Denied</p>
          <p>You must be a Mentor or Admin to manage lesson resources.</p>
        </div>
      </div>
    );
  }

  const target = courseIdParam != null ? `/manage/course/${courseIdParam}` : "/manage/courses";

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Upload Lesson</h1>

      <div className="p-4 rounded border border-yellow-300 bg-yellow-50 text-yellow-900">
        <p className="font-semibold">This page is deprecated.</p>
        <p className="mt-2 text-sm">
          FSOLS no longer supports uploading lesson files via legacy CourseLesson fields (LessonType/VideoUrl/DocUrl).
          All lesson file links must be managed through <span className="font-medium">LessonResource</span> in the
          course draft editor.
        </p>

        <div className="mt-4">
          <Link
            to={target}
            className="inline-flex items-center px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Go to Course Draft Editor
          </Link>
        </div>
      </div>
    </div>
  );
}
