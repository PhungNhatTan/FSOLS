"use client"

import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import courseApi from "../../api/course"
import type { Course } from "../../types/course"

export default function CoursePage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")

  const loadCourses = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await courseApi.getEnrolled()
      setCourses(data || [])
    } catch (err) {
      console.log("[CoursePage] Error loading courses:", err)
      setError(`Failed to load courses: ${err instanceof Error ? err.message : "Unknown error"}`)
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCourses()
  }, [])

  const filteredCourses = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return courses

    return courses.filter((c) => {
      const hay = [
        c.Name,
        
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return hay.includes(q)
    })
  }, [courses, query])

  const isSearching = query.trim().length > 0

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Explore Courses</h1>
          <p className="text-gray-600">Browse all available courses and start learning</p>

          {!loading && courses.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              Showing {filteredCourses.length} / {courses.length}
              {isSearching ? ` for “${query.trim()}”` : ""}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Search bar (FE filter only) */}
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search courses..."
              className="w-72 max-w-[70vw] px-10 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-slate-200"
            />
            {/* left icon */}
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 21l-4.3-4.3m1.8-5.2a7 7 0 11-14 0 7 7 0 0114 0z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>

            {/* clear button */}
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 px-2"
                aria-label="Clear search"
                type="button"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={loadCourses}
            className="px-3 py-2 rounded-lg border hover:bg-slate-50"
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {loading && <p className="text-gray-600">Loading courses...</p>}

      {!loading && courses.length === 0 && (
        <div className="text-center py-10 bg-gray-50 rounded-xl">
          <p className="text-gray-600 mb-2">No courses available at the moment.</p>
          <p className="text-gray-500 text-sm">Check back later for new courses.</p>
        </div>
      )}

      {!loading && courses.length > 0 && filteredCourses.length === 0 && (
        <div className="text-center py-10 bg-gray-50 rounded-xl">
          <p className="text-gray-600 mb-2">No courses match “{query.trim()}”.</p>
          <p className="text-gray-500 text-sm">Try a different keyword.</p>
        </div>
      )}

      {!loading && filteredCourses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div key={course.Id} className="border rounded-xl p-5 shadow hover:shadow-lg transition bg-white">
              <div className="mb-3">
                {course.Category && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {course.Category.Name}
                  </span>
                )}
              </div>
              <h2 className="text-lg font-semibold mb-2">{course.Name}</h2>
              <p className="text-gray-600 mb-4 line-clamp-3">{course.Description}</p>
              {course.CreatedBy && (
                <p className="text-sm text-gray-500 mb-4">By {course.CreatedBy.Name}</p>
              )}
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
