import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import courseApi from "../api/course";
import type { CourseDetail } from "../types/course";

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCourse(null);
    setError("");
    setLoading(true);

    const numericId = Number(id);
    if (!id || !Number.isFinite(numericId) || numericId <= 0) {
      setError("Invalid course id");
      setLoading(false);
      return;
    }

    let mounted = true;
    courseApi
      .getById(numericId)
      .then((data) => mounted && setCourse(data))
      .catch(() => mounted && setError("Failed to load course"))
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [id]);

  return (
    <div className="flex">
      <div className="p-6 max-w-3xl mx-auto flex-1">
        {error && <p className="text-red-500">{error}</p>}
        {!error && loading && <p>Loading course...</p>}
        {!loading && !error && course && (
          <>
            <h1 className="text-2xl font-bold mb-3">{course.Name}</h1>
            <p className="mb-4 text-gray-700">{course.Description}</p>

            <h2 className="text-lg font-semibold mb-2">Lessons</h2>
            {course.Lessons?.length ? (
              <ul className="list-disc list-inside space-y-1">
                {course.Lessons.map((l) => (
                  <li key={l.Id}>{l.Title}</li>
                ))}
              </ul>
            ) : (
              <p>No lessons.</p>
            )}

            <Link
              to="/courses"
              className="block mt-6 text-blue-600 hover:underline"
            >
              ← Back to courses
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
