import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import courseApi from "../api/course";
import { type CourseDetail } from "../types/course";

type CourseListItem = Pick<CourseDetail, "Id" | "Name" | "Description">;

export default function CoursePage() {
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setError("");
    setLoading(true);

    courseApi
      .getAll()
      .then((data: CourseListItem[]) => {
        if (!mounted) return;
        setCourses(data);
      })
      .catch(() => mounted && setError("Failed to load courses"))
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="flex">
      <div className="p-6 max-w-3xl mx-auto flex-1">
        {error && <p className="text-red-500">{error}</p>}
        {!error && loading && <p>Loading courses...</p>}
        {!loading && !error && (
          <>
            <h1 className="text-2xl font-bold mb-4">Courses</h1>
            {courses.length === 0 ? (
              <p>No courses found.</p>
            ) : (
              <ul className="space-y-2">
                {courses.map((c) => (
                  <li key={c.Id} className="border rounded p-3 hover:bg-gray-50">
                    <Link
                      to={`/courses/${c.Id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {c.Name}
                    </Link>
                    <p className="text-gray-600 text-sm">{c.Description}</p>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
