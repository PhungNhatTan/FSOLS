"use client"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import enrollmentApi, { type Enrollment } from "../../api/enrollment"

export default function MyCoursesPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadEnrolledCourses = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await enrollmentApi.getEnrolled()
      setEnrollments(data || [])
    } catch (err) {
      setError(`Failed to load enrolled courses: ${err instanceof Error ? err.message : "Unknown error"}`)
      setEnrollments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEnrolledCourses()
  }, [])

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Enrolled Courses</h1>
        <button
          onClick={loadEnrolledCourses}
          className="px-3 py-2 rounded-lg border hover:bg-slate-50"
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

      {loading && <p className="text-gray-600">Loading your courses...</p>}

      {!loading && enrollments.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gray-600 mb-4">You haven't enrolled in any courses yet.</p>
          <Link to="/courses" className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
            Browse Courses
          </Link>
        </div>
      )}

      {!loading && enrollments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {enrollments.map((enrollment) => (
            <div key={enrollment.Id} className="border rounded-xl p-4 shadow hover:shadow-md transition">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold">{enrollment.Course?.Name || "Unknown Course"}</h2>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    enrollment.Status === "Completed"
                      ? "bg-green-100 text-green-700"
                      : enrollment.Status === "InProgress"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {enrollment.Status}
                </span>
              </div>
              <p className="text-gray-600 mb-4 line-clamp-2">{enrollment.Course?.Description || ""}</p>
              <Link
                to={`/course/${enrollment.CourseId}`}
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Continue Learning
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
