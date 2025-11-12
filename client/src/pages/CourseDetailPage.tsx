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
      .then(data => {
        if (!mounted) return;
        if(!data){
          setError("Course not found");
          setCourse(null);
        } else {
          setCourse(data);
        }
      })
      .catch(() => mounted && setError("Failed to load course"))
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) return <p className="p-6">Loading course...</p>;
  if (error) return (
    <div className="p-6">
      <p className="text-red-500">{error}</p>
      <Link to="/courses" className="text-blue-600 hover:underline">← Back to courses</Link>
    </div>
  );
  if (!course) return null;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-3">{course.Name}</h1>
      <p className="mb-4 text-gray-700">{course.Description}</p>

      {/* Lessons Section */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Lessons</h2>
        {Array.isArray(course.Lessons) && course.Lessons.some(group => Array.isArray(group) && group.length > 0) ? (
          <ul className="list-disc list-inside space-y-1">
            {course.Lessons.map((lessonGroup, groupIndex) =>
              (Array.isArray(lessonGroup) ? lessonGroup : []).map((l, lessonIndex) => (
                <li key={`${groupIndex}-${lessonIndex}`} className="flex justify-between">
                  <span>{l?.Title ?? "Untitled"}</span>
                  <Link
                    to={l?.Id ? `/lessons/${l.Id}` : "#"}
                    className="text-blue-600 hover:underline"
                  >
                    View
                  </Link>
                </li>
              ))
            )}
          </ul>
        ) : (
          <p>No lessons available.</p>
        )}
      </section>

      {/* Exams Section */}
      <section>
        <h2 className="text-lg font-semibold mb-2">Exams</h2>
        {Array.isArray(course.Exams) && course.Exams.some(group => Array.isArray(group) && group.length > 0) ? (
          <ul className="list-disc list-inside space-y-1">
            {course.Exams.map((examGroup, groupIndex) =>
              (Array.isArray(examGroup) ? examGroup : []).map((e, examIndex) => (
                <li key={`${groupIndex}-${examIndex}`} className="flex justify-between">
                  <span>{e?.Title ?? "Untitled"}</span>
                  <Link
                    to={e?.Id ? `/exams/${e.Id}` : "#"}
                    className="text-blue-600 hover:underline"
                  >
                    Take Exam
                  </Link>
                </li>
              ))
            )}
          </ul>
        ) : (
          <p>No exams available.</p>
        )}
      </section>


      <Link to="/courses" className="block mt-6 text-blue-600 hover:underline">← Back to courses</Link>
    </div>
  );
}
