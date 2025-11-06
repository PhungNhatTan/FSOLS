import { useParams, Link } from "react-router-dom";
import course from "../api/course";
import type { CourseDetail } from "../types";
import { useFetch } from "../hooks/useFetch";
import CourseSidebar from "../components/courseSidebar/CourseSidebar";
import { LoadingMessage, ErrorMessage } from "../components/common/StatusMessages";

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: courseData, error, loading } = useFetch<CourseDetail>(
    () => course.getById(Number(id)),
    [id]
  );

  if (error) return <ErrorMessage message={error} />;
  if (loading || !courseData) return <LoadingMessage text="Loading course..." />;

  return (
    <div className="flex">
      <CourseSidebar />

      <main className="p-6 max-w-3xl mx-auto flex-1">
        <h1 className="text-2xl font-bold mb-3">{courseData.Title}</h1>
        <p className="mb-4 text-gray-700">{courseData.Description}</p>

        <section>
          <h2 className="text-lg font-semibold mb-2">Lessons</h2>
          <ul className="list-disc list-inside space-y-1">
            {courseData.Lessons.map((l) => (
              <li key={l.Id}>{l.Title}</li>
            ))}
          </ul>
        </section>

        <Link
          to="/courses"
          className="block mt-6 text-blue-600 hover:underline"
        >
          ← Back to Courses
        </Link>
      </main>
    </div>
  );
}
