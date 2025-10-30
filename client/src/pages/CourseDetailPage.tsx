import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import client from "../api/client";

interface CourseDetail {
  Id: number;
  Title: string;
  Description: string;
  Lessons: { Id: number; Title: string }[];
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!id) return;
    client
      .get(`/course/${id}`)
      .then((res) => setCourse(res.data))
      .catch((err) => setMessage(`Error loading course: ${err.message}`));
  }, [id]);

  return (
    <div className="p-6 max-w-3xl mx-auto">
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
        <p>{message || "Loading course..."}</p>
      )}
    </div>
  );
}
