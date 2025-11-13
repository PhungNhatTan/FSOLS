import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import lesson from "../../api/lesson";
import type { LessonDetail } from "../../types";

/**
 * Displays the content of a single lesson.
 */
export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const [lessonData, setLessonData] = useState<LessonDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    lesson
      .getById(Number(id))
      .then((data) => {
        setLessonData(data);
        setError("");
      })
      .catch(() => setError("Failed to load lesson"))
      .finally(() => setLoading(false));
  }, [id]);

  if (error) return <p className="text-red-500">{error}</p>;
  if (loading) return <p className="text-gray-500 italic">Loading...</p>;
  if (!lessonData) return null;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link to="/courses" className="text-blue-600 hover:underline mb-4 block">
        ← Back to Courses
      </Link>

      <h1 className="text-2xl font-bold mb-3">{lessonData.Title}</h1>
      <p className="italic text-sm mb-4 text-gray-500">
        Type: {lessonData.LessonType}
      </p>

      <div
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: lessonData.Content }}
      />
    </div>
  );
}
