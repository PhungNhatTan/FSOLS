"use client"

import { useEffect, useState, useCallback } from "react"
import * as examApi from "../../../api/exam"
import type { ExamDetailWithResult } from "../../../types/exam"
import { getAccountId } from "../../../utils/auth"
import { useAuth } from "../../../hooks/useAuth"

const PRESET_DURATION_MINUTES: Record<string, number> = {
  P_10: 10,
  P_15: 15,
  P_30: 30,
  P_60: 60,
  P_90: 90,
  P_120: 120,
}

const getDurationMinutes = (exam: { 
  DurationCustom?: number; 
  DurationPreset?: string; 
  Duration?: number 
}): number => {
  if (exam.DurationCustom) {
    return exam.DurationCustom
  }
  if (exam.DurationPreset) {
    return PRESET_DURATION_MINUTES[exam.DurationPreset] || 0
  }
  if (exam.Duration && exam.Duration > 0) {
    return exam.Duration
  }
  return 0
}

interface ExamDetailViewerProps {
  examId: number
  onStartExam: () => void // Navigate to taking exam
  onComplete?: () => void // Mark as complete and move to next item
}

// This component is ONLY used inside CourseStudyPage, not as a standalone route
export default function ExamDetailViewer({ 
  examId, 
  onStartExam,
  onComplete 
}: ExamDetailViewerProps) {
  const { user } = useAuth()
  const accountId = user?.accountId ?? getAccountId() ?? "anonymous"

  const [data, setData] = useState<ExamDetailWithResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [sessionScore, setSessionScore] = useState<{ score: number; total: number } | null>(null)

  const loadExamDetail = useCallback(() => {
    setLoading(true)
    examApi
      .getWithResult(examId)
      .then((result) => {
        setData(result)
        setError("")
      })
      .catch(() => setError("Failed to load exam"))
      .finally(() => setLoading(false))
  }, [examId, accountId])

  useEffect(() => {
    loadExamDetail()
  }, [loadExamDetail])

  // Check session storage for recent submission
  useEffect(() => {
    const storedResult = sessionStorage.getItem(`exam_${examId}_account_${accountId}_result`)
    if (storedResult) {
      try {
        setSessionScore(JSON.parse(storedResult))
      } catch (e) {
        console.error("Failed to parse stored result:", e)
        setSessionScore(null)
      }
    } else {
      setSessionScore(null)
    }
  }, [examId, accountId])

  // Reload when coming back from taking exam (window regains focus)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadExamDetail()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [loadExamDetail])

  if (loading) {
    return <p className="text-gray-500 italic p-6">Loading exam...</p>
  }

  if (error) {
    return <p className="text-red-500 font-semibold p-6">{error}</p>
  }

  if (!data) {
    return <p className="text-gray-500 italic p-6">Exam not found.</p>
  }

  const { exam, result } = data
  const hasAttempted = (result !== null && result !== undefined) || sessionScore !== null
  const totalQuestions = sessionScore?.total || exam.Questions?.length || 0
  const scoreData = sessionScore || result
  const score = scoreData?.score || 0
  const percentage = totalQuestions > 0 ? ((score / totalQuestions) * 100).toFixed(2) : "0"
  const percentageNum = Number(percentage)
  const isPassed = percentageNum >= 80

  const durationMinutes = getDurationMinutes(exam)
  const durationDisplay = durationMinutes > 0 ? `${durationMinutes} minutes` : "No limit"

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="border rounded-lg shadow p-6 bg-white">
        <h1 className="text-2xl font-bold mb-4">{exam.Title}</h1>
        
        <p className="text-gray-700 mb-2">
          <span className="font-semibold">Duration:</span> {durationDisplay}
        </p>
        
        <p className="text-gray-700 mb-4">
          <span className="font-semibold">Total Questions:</span> {totalQuestions}
        </p>

        {hasAttempted ? (
          <div
            className={`rounded-lg p-4 mb-4 border ${
              isPassed ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
            }`}
          >
            <p className={`font-semibold mb-1 ${isPassed ? "text-green-700" : "text-red-700"}`}>
              {isPassed ? "✓ Exam Passed!" : "Not Passed"}
            </p>
            <p className={`text-lg ${isPassed ? "text-green-600" : "text-red-600"}`}>
              Your Score: {score}/{totalQuestions} ({percentage}%)
            </p>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-yellow-700 font-semibold">Not Started Yet</p>
            <p className="text-yellow-600">Click "Take Exam" to begin.</p>
          </div>
        )}

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={onStartExam}
            className="px-6 py-2 text-white rounded font-medium transition bg-blue-600 hover:bg-blue-700"
          >
            {!hasAttempted ? "Take Exam" : "Retake Exam"}
          </button>

          {/* Mark as complete button (only if passed) */}
          {isPassed && onComplete && (
            <button
              onClick={onComplete}
              className="px-6 py-2 text-white rounded font-medium transition bg-green-600 hover:bg-green-700"
            >
              ✓ Mark Complete & Continue
            </button>
          )}
        </div>
      </div>
    </div>
  )
}