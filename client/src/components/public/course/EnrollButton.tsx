"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import enrollmentApi from "../../../api/enrollment"
import { useAuth } from "../../../hooks/useAuth"

interface EnrollButtonProps {
  courseId: number
  onEnrollmentChange?: (isEnrolled: boolean) => void
}

export default function EnrollButton({ courseId, onEnrollmentChange }: EnrollButtonProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (user) {
      checkEnrollmentStatus()
    } else {
      setIsCheckingStatus(false)
    }
  }, [user, courseId])

  const checkEnrollmentStatus = async () => {
    try {
      setIsCheckingStatus(true)
      const response = await enrollmentApi.getStatus(courseId)
      setIsEnrolled(response.isEnrolled)
    } catch (err) {
      console.error("Failed to check enrollment status:", err)
    } finally {
      setIsCheckingStatus(false)
    }
  }

  const handleEnroll = async () => {
    if (!user) {
      navigate("/login", { state: { from: `/courses/${courseId}` } })
      return
    }

    try {
      setIsLoading(true)
      setError("")
      await enrollmentApi.enroll(courseId)
      setIsEnrolled(true)
      onEnrollmentChange?.(true)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to enroll"
      if (typeof err === "object" && err !== null && "response" in err) {
        const axiosError = err as { response?: { data?: { message?: string } } }
        setError(axiosError.response?.data?.message || errorMessage)
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnenroll = async () => {
    try {
      setIsLoading(true)
      setError("")
      await enrollmentApi.unenroll(courseId)
      setIsEnrolled(false)
      onEnrollmentChange?.(false)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to unenroll"
      if (typeof err === "object" && err !== null && "response" in err) {
        const axiosError = err as { response?: { data?: { message?: string } } }
        setError(axiosError.response?.data?.message || errorMessage)
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingStatus) {
    return (
      <button
        disabled
        className="w-full px-6 py-3 bg-gray-300 text-gray-500 font-semibold rounded-lg cursor-not-allowed"
      >
        Loading...
      </button>
    )
  }

  return (
    <div className="space-y-2">
      {error && <div className="p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded">{error}</div>}

      {isEnrolled ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-700 font-medium">Enrolled</span>
          </div>
          <button
            onClick={handleUnenroll}
            disabled={isLoading}
            className="w-full px-6 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Processing..." : "Unenroll from Course"}
          </button>
        </div>
      ) : (
        <button
          onClick={handleEnroll}
          disabled={isLoading}
          className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Enrolling..." : user ? "Enroll in Course" : "Sign in to Enroll"}
        </button>
      )}
    </div>
  )
}
