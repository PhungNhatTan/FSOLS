import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";

interface Course {
  Id: number;
  Title: string;
  Description: string;
  Instructor: string;
  LessonCount: number;
}

export default function CoursePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    client
      .get("/course")
      .then((res) => setCourses(res.data))
      .catch((err) => setMessage(`Error loading courses: ${err.message}`));
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Available Courses</h1>

      {message && <p className="text-red-600 mb-4">{message}</p>}

      {courses.length === 0 ? (
        <p>No courses found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((course) => (
            <div
              key={course.Id}
              className="border rounded-xl p-4 shadow hover:shadow-md transition"
            >
              <h2 className="text-lg font-semibold mb-2">{course.Title}</h2>
              <p className="text-sm text-gray-600 mb-2">
                Instructor: {course.Instructor}
              </p>
              <p className="text-sm text-gray-700 mb-3">
                Lessons: {course.LessonCount}
              </p>
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
