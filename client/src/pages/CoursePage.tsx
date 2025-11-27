import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import courseApi from "../api/course";
import type { Course } from "../types/course";

export default function CoursePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCourses = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await courseApi.getAll();
      setCourses(data || []);
    } catch (err) {
      setError(`Failed to load courses: ${err instanceof Error ? err.message : "Unknown error"}`);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Available Courses</h1>
        <button
          onClick={loadCourses}
          className="px-3 py-2 rounded-lg border hover:bg-slate-50"
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {loading && <p className="text-gray-600">Loading courses...</p>}

      {!loading && courses.length === 0 && (
        <p className="text-gray-600">No courses found.</p>
      )}

      {!loading && courses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((course) => (
            <div
              key={course.Id}
              className="border rounded-xl p-4 shadow hover:shadow-md transition"
            >
              <h2 className="text-lg font-semibold mb-2">{course.Name}</h2>
              <p className="text-gray-800 mb-4">{course.Description}</p>
              <Link
                to={`/courses/${course.Id}`}
                className="text-blue-600 hover:underline font-medium"
              >
                View Details →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
