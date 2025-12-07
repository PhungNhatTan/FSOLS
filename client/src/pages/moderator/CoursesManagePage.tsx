"use client"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import courseApi from "../../api/course"
import type { Course } from "../../types/course"

type FilterStatus = "all" | "verified" | "pending"

export default function CoursesManagePage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [verifyingIds, setVerifyingIds] = useState<number[]>([])
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  const fetchCourses = async () => {
    try {
      setLoading(true)
      setError("")
      const data = await courseApi.getAll()
      setCourses(data || [])
    } catch (err) {
      setError("Failed to load courses: " + String(err))
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  const handleVerify = async (id: number) => {
    if (verifyingIds.includes(id)) return
    setVerifyingIds((prev) => [...prev, id])
    setError("")
    try {
      await courseApi.verify(id)
      await fetchCourses()
      setSelectedCourse(null)
    } catch (err) {
      setError("Failed to verify course: " + String(err))
    } finally {
      setVerifyingIds((prev) => prev.filter((x) => x !== id))
    }
  }

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.Description.toLowerCase().includes(searchQuery.toLowerCase())

    // Assume courses without DeletedAt are verified, with DeletedAt are pending
    const isVerified = !course.DeletedAt
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "verified" && isVerified) ||
      (filterStatus === "pending" && !isVerified)

    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading courses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Course Verification</h1>
        <p className="text-muted-foreground">Review and verify courses submitted by mentors</p>
        <div className="flex gap-4 mt-4">
          <div className="bg-card border rounded-lg px-4 py-3">
            <div className="text-2xl font-bold">{courses.length}</div>
            <div className="text-sm text-muted-foreground">Total Courses</div>
          </div>
          <div className="bg-card border rounded-lg px-4 py-3">
            <div className="text-2xl font-bold text-green-600">{courses.filter((c) => !c.DeletedAt).length}</div>
            <div className="text-sm text-muted-foreground">Verified</div>
          </div>
          <div className="bg-card border rounded-lg px-4 py-3">
            <div className="text-2xl font-bold text-orange-600">{courses.filter((c) => c.DeletedAt).length}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
          {error}
        </div>
      )}

      <div className="bg-card border rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search courses by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus("verified")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === "verified"
                  ? "bg-green-600 text-white"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              Verified
            </button>
            <button
              onClick={() => setFilterStatus("pending")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === "pending"
                  ? "bg-orange-600 text-white"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              Pending
            </button>
          </div>
        </div>
      </div>

      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCourses.map((course) => {
            const isVerifying = verifyingIds.includes(course.Id)
            const isVerified = !course.DeletedAt

            return (
              <div key={course.Id} className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-1">{course.Name}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-muted-foreground">ID: {course.Id}</span>
                      {isVerified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Pending Review
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {course.Description || "No description available"}
                </p>

                <div className="flex gap-2">
                  <Link
                    to={`/courses/${course.Id}`}
                    className="flex-1 px-4 py-2 text-center bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => setSelectedCourse(course)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Review
                  </button>
                  {!isVerified && (
                    <button
                      onClick={() => handleVerify(course.Id)}
                      disabled={isVerifying}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isVerifying ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Verifying...</span>
                        </div>
                      ) : (
                        "Verify"
                      )}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-card border rounded-lg">
          <svg
            className="w-16 h-16 mx-auto text-muted-foreground mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-lg font-medium text-muted-foreground mb-1">No courses found</p>
          <p className="text-sm text-muted-foreground">
            {searchQuery || filterStatus !== "all"
              ? "Try adjusting your search or filter"
              : "No courses available for review"}
          </p>
        </div>
      )}

      {selectedCourse && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedCourse(null)}
        >
          <div
            className="bg-card rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b sticky top-0 bg-card">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">{selectedCourse.Name}</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Course ID: {selectedCourse.Id}</span>
                    {!selectedCourse.DeletedAt ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Pending Review
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => setSelectedCourse(null)} className="text-muted-foreground hover:text-foreground">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Description</h3>
                <p className="text-foreground leading-relaxed">
                  {selectedCourse.Description || "No description provided"}
                </p>
              </div>

              <div className="flex gap-3">
                <Link
                  to={`/courses/${selectedCourse.Id}`}
                  className="flex-1 px-4 py-2 text-center bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium"
                  onClick={() => setSelectedCourse(null)}
                >
                  View Full Course
                </Link>
                {selectedCourse.DeletedAt && (
                  <button
                    onClick={() => handleVerify(selectedCourse.Id)}
                    disabled={verifyingIds.includes(selectedCourse.Id)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {verifyingIds.includes(selectedCourse.Id) ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Verifying...</span>
                      </div>
                    ) : (
                      "Verify Course"
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
