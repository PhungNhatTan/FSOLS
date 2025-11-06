import { Link } from "react-router-dom";
import course from "../api/course";
import type { Course } from "../types";
import { useFetch } from "../hooks/useFetch";
import { LoadingMessage, ErrorMessage, EmptyState } from "../components/common/StatusMessages";

function CourseCard({ course }: { course: Course }) {
  return (
    <div className="border rounded-xl p-4 shadow hover:shadow-md transition bg-white">
      <h2 className="text-lg font-semibold mb-2">{course.Title}</h2>
      <p className="text-sm text-gray-600 mb-1">Instructor: {course.Instructor}</p>
      <p className="text-sm text-gray-700 mb-2">Lessons: {course.LessonCount}</p>
      <p className="text-gray-800 mb-4 line-clamp-3">{course.Description}</p>
      <Link
        to={`/course/${course.Id}`}
        className="text-blue-600 hover:underline font-medium"
      >
        View Details →
      </Link>
    </div>
  );
}

export default function CoursePage() {
  const { data: courses, error, loading } = useFetch(course.getAll, []);

  if (error) return <ErrorMessage message={error} />;
  if (loading) return <LoadingMessage text="Loading courses..." />;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Available Courses</h1>

      {courses && courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((c) => (
            <CourseCard key={c.Id} course={c} />
          ))}
        </div>
      ) : (
        <EmptyState text="No courses found. Please check back later." />
      )}
    </div>
  );
}
