import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import courseApi from "../../api/course";
import type { Course } from "../../types/course";

export default function CoursesManagePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [verifyingIds, setVerifyingIds] = useState<number[]>([]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await courseApi.getAll();
      setCourses(data || []);
    } catch (err) {
      setError("Failed to load courses: " + String(err));
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleVerify = async (id: number) => {
    if (verifyingIds.includes(id)) return;
    setVerifyingIds(prev => [...prev, id]);
    setError("");
    try {
      await courseApi.verify(id);
      // refresh list after successful verify
      await fetchCourses();
    } catch (err) {
      setError("Failed to verify course: " + String(err));
    } finally {
      setVerifyingIds(prev => prev.filter(x => x !== id));
    }
  };

  if (loading) return <p className="p-6">Loading courses...</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Manage Courses</h1>

      {courses.length > 0 ? (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-left">ID</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
              <th className="border border-gray-300 px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map(course => {
              const isVerifying = verifyingIds.includes(course.Id);
              return (
                <tr key={course.Id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">{course.Id}</td>
                  <td className="border border-gray-300 px-4 py-2">{course.Name}</td>
                  <td className="border border-gray-300 px-4 py-2">{course.Description}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    <Link
                      to={`/courses/${course.Id}`}
                      className="text-blue-600 hover:underline mr-4"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleVerify(course.Id)}
                      disabled={isVerifying}
                      className="text-green-600 hover:underline disabled:opacity-50"
                    >
                      {isVerifying ? "Verifying..." : "Verify"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500">No courses available.</p>
      )}
    </div>
  );
}