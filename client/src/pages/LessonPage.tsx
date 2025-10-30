import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getLesson, type Lesson } from "../service/lesson";

export default function LessonPage() {
  const { id } = useParams();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    getLesson(Number(id))
      .then(setLesson)
      .catch(() => setError("Failed to load lesson"));
  }, [id]);

  if (error) return <p className="text-red-500">{error}</p>;
  if (!lesson) return <p>Loading...</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link to="/courses" className="text-blue-600 underline mb-4 block">
        ← Back to Courses
      </Link>
      <h1 className="text-2xl font-bold mb-3">{lesson.Title}</h1>
      <p className="italic text-sm mb-4 text-gray-500">
        Type: {lesson.LessonType}
      </p>
      <div
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: lesson.Content }}
      />
    </div>
  );
}
