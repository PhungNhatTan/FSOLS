import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import courseApi, { type CourseDetail } from "../api/course";
import CourseSidebar from "../components/CourseSidebar";

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    courseApi
      .getById(Number(id))
      .then(setCourse)
      .catch(() => setError("Failed to load course"));
  }, [id]);

  return (
    <div className="flex">
      <CourseSidebar/>
      <div className="p-6 max-w-3xl mx-auto flex-1">
        {error && <p className="text-red-500">{error}</p>}
        {course ? (
          <>
            <h1 className="text-2xl font-bold mb-3">{course.Title}</h1>
            <p className="mb-4 text-gray-700">{course.Description}</p>
            <h2 className="text-lg font-semibold mb-2">Lessons</h2>
            <ul className="list-disc list-inside space-y-1">
              {course.Lessons.map((l) => (
                <li key={l.Id}>{l.Title}</li>
              ))}
            </ul>
            <Link
              to="/courses"
              className="block mt-6 text-blue-600 hover:underline"
            >
              ← Back to courses
            </Link>
          </>
        ) : (
          <p>Loading course...</p>
        )}
      </div>
    </div>
  );
}
