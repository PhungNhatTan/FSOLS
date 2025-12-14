"use client"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import courseApi from "../../api/course"
import type { Course } from "../../types/course"

export default function CoursePage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadCourses = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await courseApi.getEnrolled();
      setCourses(data || []);
    } catch (err) {
      console.log("[v0] Error loading courses:", err)
      setError(`Failed to load courses: ${err instanceof Error ? err.message : "Unknown error"}`)
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCourses()
  }, [])

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Explore Courses</h1>
          <p className="text-gray-600">Browse all available courses and start learning</p>
        </div>
        <button onClick={loadCourses} className="px-3 py-2 rounded-lg border hover:bg-slate-50" disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

      {loading && <p className="text-gray-600">Loading courses...</p>}

      {!loading && courses.length === 0 && (
        <div className="text-center py-10 bg-gray-50 rounded-xl">
          <p className="text-gray-600 mb-2">No courses available at the moment.</p>
          <p className="text-gray-500 text-sm">Check back later for new courses.</p>
        </div>
      )}

      {!loading && courses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div key={course.Id} className="border rounded-xl p-5 shadow hover:shadow-lg transition bg-white">
              <div className="mb-3">
                {course.Category && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{course.Category.Name}</span>
                )}
              </div>
              <h2 className="text-lg font-semibold mb-2">{course.Name}</h2>
              <p className="text-gray-600 mb-4 line-clamp-3">{course.Description}</p>
              {course.CreatedBy && <p className="text-sm text-gray-500 mb-4">By {course.CreatedBy.Name}</p>}
              <Link
                to={`/course/${course.Id}`}
                className="inline-block w-full text-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                View Course
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
