import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import courseApi, { type Course } from "../api/course";

export default function CoursePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    courseApi
      .getAll()
      .then(setCourses)
      .catch((err) => setError(`Failed to load courses: ${err.message}`));
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Available Courses</h1>
      {error && <p className="text-red-500">{error}</p>}

      {courses.length === 0 ? (
        <p>No courses found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((course) => (
            <div
              key={course.Id}
              className="border rounded-xl p-4 shadow hover:shadow-md transition"
            >
              <h2 className="text-lg font-semibold mb-2">
                {course.Name || course.Title || "Untitled Course"}
              </h2>
              {course.Instructor && (
                <p className="text-sm text-gray-600 mb-1">
                  Instructor: {course.Instructor}
                </p>
              )}
              {course.LessonCount !== undefined && (
                <p className="text-sm text-gray-700 mb-2">
                  Lessons: {course.LessonCount}
                </p>
              )}
              <p className="text-gray-800 mb-4">{course.Description}</p>
              <Link
                to={`/course/${course.Id}`}
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
