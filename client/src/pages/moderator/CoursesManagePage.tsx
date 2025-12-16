"use client"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import courseApi from "../../api/course"
import type { VerificationRequest } from "../../types/course"

type FilterStatus = "all" | "approved" | "rejected" | "pending"

export default function CoursesManagePage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [verifyingIds, setVerifyingIds] = useState<number[]>([])
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null)
  const [rejectModalRequest, setRejectModalRequest] = useState<VerificationRequest | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [rejectingIds, setRejectingIds] = useState<number[]>([])

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      setError("")
      const data = await courseApi.getVerificationRequests()
      setRequests(data || [])
    } catch (err) {
      setError("Failed to load verification requests: " + String(err))
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (id: number) => {
    if (verifyingIds.includes(id)) return
    setVerifyingIds((prev) => [...prev, id])
    setError("")
    try {
      await courseApi.verify(id)
      await fetchRequests()
      setSelectedRequest(null)
    } catch (err) {
      setError("Failed to verify course: " + String(err))
    } finally {
      setVerifyingIds((prev) => prev.filter((x) => x !== id))
    }
  }

  const handleReject = async (requestId: string, reason?: string) => {
    if (!rejectModalRequest || !rejectModalRequest.Course) return
    const courseId = rejectModalRequest.Course.Id
    
    if (rejectingIds.includes(courseId)) return
    setRejectingIds((prev) => [...prev, courseId])
    setError("")

    try {
      await courseApi.reject(courseId, reason || "")
      await fetchRequests()
      setRejectModalRequest(null)
      setRejectionReason("")
    } catch (err) {
      setError("Failed to reject course: " + String(err))
    } finally {
      setRejectingIds((prev) => prev.filter((x) => x !== courseId))
    }
  }

  const getRequestStatus = (request: VerificationRequest): "approved" | "rejected" | "pending" => {
    if (request.ApprovalStatus === "Approved") return "approved"
    if (request.ApprovalStatus === "Rejected") return "rejected"
    return "pending"
  }

  const filteredRequests = requests.filter((request) => {
    const course = request.Course
    if (!course) return false
    
    const matchesSearch =
      course.Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.Description.toLowerCase().includes(searchQuery.toLowerCase())

    const status = getRequestStatus(request)
    const matchesFilter = filterStatus === "all" || filterStatus === status

    return matchesSearch && matchesFilter
  })

  const approvedCount = requests.filter((r) => getRequestStatus(r) === "approved").length
  const rejectedCount = requests.filter((r) => getRequestStatus(r) === "rejected").length
  const pendingCount = requests.filter((r) => getRequestStatus(r) === "pending").length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading requests...</p>
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
            <div className="space-y-1">
              <div className="text-2xl font-bold">{requests.length}</div>
              <div className="text-sm text-muted-foreground">Total Requests</div>
              <div className="text-xs text-muted-foreground mt-2">
                {approvedCount} approved · {rejectedCount} rejected · {pendingCount} pending
              </div>
            </div>
          </div>
          <div className="bg-card border rounded-lg px-4 py-3">
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
            <div className="text-sm text-muted-foreground">Approved</div>
          </div>
          <div className="bg-card border rounded-lg px-4 py-3">
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
            <div className="text-sm text-muted-foreground">Rejected</div>
          </div>
          <div className="bg-card border rounded-lg px-4 py-3">
            <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
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
              onClick={() => setFilterStatus("approved")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === "approved"
                  ? "bg-green-600 text-white"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setFilterStatus("rejected")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === "rejected"
                  ? "bg-red-600 text-white"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              Rejected
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

      {filteredRequests.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredRequests.map((request) => {
            const course = request.Course
            if (!course) return null
            
            const isVerifying = verifyingIds.includes(course.Id)
            const isRejecting = rejectingIds.includes(course.Id)
            const status = getRequestStatus(request)

            return (
              <div key={request.Id} className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-1">{course.Name}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-muted-foreground">ID: {course.Id}</span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          status === "approved"
                            ? "bg-green-100 text-green-800"
                            : status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {status === "approved" ? "Approved" : status === "rejected" ? "Rejected" : "Pending"}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {course.Description || "No description available"}
                </p>

                <div className="flex gap-2">
                  <Link
                    to={`/moderator/course/${course.Id}/preview`}
                    className="flex-1 px-4 py-2 text-center bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => setSelectedRequest(request)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Review
                  </button>
                  {status === "pending" && (
                    <>
                      <button
                        onClick={() => handleVerify(course.Id)}
                        disabled={isVerifying}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {isVerifying ? "Approving..." : "Approve"}
                      </button>
                      <button
                        onClick={() => setRejectModalRequest(request)}
                        disabled={isRejecting}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {isRejecting ? "Rejecting..." : "Reject"}
                      </button>
                    </>
                  )}
                  {status === "rejected" && request.Reason && (
                    <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
                      <strong>Reason:</strong> {request.Reason}
                    </div>
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
          <p className="text-lg font-medium text-muted-foreground mb-1">No requests found</p>
          <p className="text-sm text-muted-foreground">
            {searchQuery || filterStatus !== "all"
              ? "Try adjusting your search or filter"
              : "No requests available for review"}
          </p>
        </div>
      )}

      {selectedRequest && selectedRequest.Course && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedRequest(null)}
        >
          <div
            className="bg-card rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b sticky top-0 bg-card">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">{selectedRequest.Course.Name}</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Course ID: {selectedRequest.Course.Id}</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        getRequestStatus(selectedRequest) === "approved"
                          ? "bg-green-100 text-green-800"
                          : getRequestStatus(selectedRequest) === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {getRequestStatus(selectedRequest) === "approved"
                        ? "Approved"
                        : getRequestStatus(selectedRequest) === "rejected"
                          ? "Rejected"
                          : "Pending"}
                    </span>
                  </div>
                </div>
                <button onClick={() => setSelectedRequest(null)} className="text-muted-foreground hover:text-foreground">
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
                  {selectedRequest.Course.Description || "No description provided"}
                </p>
              </div>

              <div className="flex gap-3">
                <Link
                  to={`/moderator/course/${selectedRequest.Course.Id}/preview`}
                  className="flex-1 px-4 py-2 text-center bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium"
                  onClick={() => setSelectedRequest(null)}
                >
                  View Full Course
                </Link>
                {getRequestStatus(selectedRequest) === "pending" && (
                  <>
                    <button
                      onClick={() => handleVerify(selectedRequest.Course!.Id)}
                      disabled={verifyingIds.includes(selectedRequest.Course.Id)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {verifyingIds.includes(selectedRequest.Course.Id) ? "Approving..." : "Approve Course"}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRequest(null)
                        setRejectModalRequest(selectedRequest)
                        setRejectionReason("")
                      }}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {rejectModalRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Reject Course</h3>
            <p className="text-muted-foreground mb-4">
              Please provide a reason for rejecting this course. This will be sent to the mentor.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full h-32 px-3 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Enter rejection reason..."
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setRejectModalRequest(null)
                  setRejectionReason("")
                }}
                className="px-4 py-2 text-muted-foreground hover:text-foreground font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(rejectModalRequest.Id, rejectionReason)}
                disabled={!rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Reject Course
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
