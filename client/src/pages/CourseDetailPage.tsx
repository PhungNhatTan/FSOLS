import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import courseApi from "../api/course";
import type { CourseDetail, CourseModule, RawModuleItem } from "../types/course";

// Define UpdateCourseData locally if not exported from types
type UpdateCourseData = {
  Name: string;
  Description: string;
};

import CourseSidebar from "../components/courseSidebar/CourseSidebar";

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (!id) return;
    loadCourse();
  }, [id]);

  const loadCourse = async () => {
    try {
      const courseData = await courseApi.getById(Number(id));
      setCourse(courseData);
      setEditForm({
        name: courseData.Name || "",
        description: courseData.Description || "",
      });
      setError("");
    } catch (err) {
      setError("Failed to load course");
      console.error(err);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (course) {
      setEditForm({
        name: course.Name || "",
        description: course.Description || "",
      });
    }
  };

  const handleSave = async () => {
    if (!id) return;
    
    setIsSaving(true);
    setError("");
    
    try {
      const updateData: UpdateCourseData = {
        Name: editForm.name.trim(),
        Description: editForm.description.trim(),
      };

      const updatedCourse = await courseApi.update(Number(id), updateData);
      // Ensure Lessons and Exams are preserved or defaulted
      const updated = updatedCourse as CourseDetail;
      setCourse(prev => ({
        ...(prev ?? ({} as CourseDetail)),
        ...updated,
        Lessons: updated.Lessons ?? (prev as CourseDetail)?.Lessons ?? [],
        Exams: updated.Exams ?? (prev as CourseDetail)?.Exams ?? [],
      }));
      setIsEditing(false);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const error = err as { response?: { data?: { message?: string } } };
        setError(error.response?.data?.message || "Failed to update course");
      } else {
        setError("Failed to update course");
      }
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  if (!course && !error) {
    return (
      <div className="flex">
        <CourseSidebar />
        <div className="p-6 max-w-3xl mx-auto flex-1">
          <p>Loading course...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <CourseSidebar />
      <div className="p-6 max-w-4xl mx-auto flex-1">
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {course && (
          <div className="bg-white rounded-lg shadow-md p-6">
            {/* Header with Edit Button */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleInputChange}
                    className="text-2xl font-bold w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Course Name"
                  />
                ) : (
                  <h1 className="text-2xl font-bold mb-3">{course.Name}</h1>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={isSaving || !editForm.name.trim()}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEdit}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Edit Course
                  </button>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              {isEditing ? (
                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Course Description"
                />
              ) : (
                <p className="text-gray-700 whitespace-pre-wrap">
                  {course.Description}
                </p>
              )}
            </div>

            {/* Course Modules and Lessons */}
            {!isEditing && 'CourseModule' in course && Array.isArray((course as { CourseModule?: CourseModule[] }).CourseModule) && ((course as { CourseModule?: CourseModule[] }).CourseModule?.length ?? 0) > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Course Modules</h2>
                <div className="space-y-4">
                  {(course as { CourseModule?: CourseModule[] }).CourseModule?.map((module: CourseModule) => (
                    <div
                      key={module.Id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <h3 className="font-semibold mb-2">
                        Module {module.OrderNo}
                      </h3>
                      {module.ModuleItems && module.ModuleItems.length > 0 && (
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          {module.ModuleItems.map((item: RawModuleItem) => (
                            <li key={item.Id}>
                              {item.CourseLesson && (
                                <span className="text-blue-600">
                                  📹 Lesson: {item.CourseLesson.Title}
                                </span>
                              )}
                              {item.Exam && (
                                <span className="text-green-600 ml-2">
                                  📝 Exam: {item.Exam.Title}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Legacy Lessons Display (for backward compatibility) */}
            {!isEditing && course.Lessons && course.Lessons.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Lessons</h2>
                <ul className="list-disc list-inside space-y-1">
                  {course.Lessons.map((lessonGroup, groupIndex) =>
                    lessonGroup.map((lesson, lessonIndex) => (
                      <li key={`${groupIndex}-${lessonIndex}`}>{lesson.Title}</li>
                    ))
                  )}
                </ul>
              </div>
            )}

            {/* Back Button */}
            <div className="mt-6 pt-4 border-t">
              <Link
                to="/courses"
                className="text-blue-600 hover:underline font-medium"
              >
                ← Back to courses
              </Link>
            </div>
          </div>
        )}

        {/* Exams Section */}
        {course && (
          <section className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Exams</h2>
            {course.Exams && Array.isArray(course.Exams) && course.Exams.some((group) => Array.isArray(group) && group.length > 0) ? (
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
        )}
      </div>
    </div>
  );
}