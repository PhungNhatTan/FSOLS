"use client"

import { useState, type FormEvent, useEffect, useCallback, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import * as exam from "../../../api/exam"
import { useFetch } from "../../../hooks/useFetch"
import type { ExamData, StudentAnswer } from "../../../types"
import ExamForm from "./ExamForm"
import ExamHeader from "./ExamHeader"
import QuestionNavigation from "./QuestionNavigation"

const PRESET_DURATION_MINUTES: Record<string, number> = {
  P_10: 10,
  P_15: 15,
  P_30: 30,
  P_60: 60,
}

const getDurationMinutes = (examData: ExamData): number => {
  // First try DurationCustom
  if (examData.DurationCustom) {
    const customDuration = Number(examData.DurationCustom)
    if (!isNaN(customDuration) && customDuration > 0) {
      return customDuration
    }
  }

  // Then try DurationPreset
  if (examData.DurationPreset) {
    const presetKey = String(examData.DurationPreset).trim()
    const presetDuration = PRESET_DURATION_MINUTES[presetKey]
    if (presetDuration && presetDuration > 0) {
      return presetDuration
    }
  }

  if (examData.Duration) {
    const durationStr = String(examData.Duration).trim()
    // Try parsing as preset key (e.g., "P_15", "P_30")
    const presetDuration = PRESET_DURATION_MINUTES[durationStr]
    if (presetDuration && presetDuration > 0) {
      return presetDuration
    }
    // Try parsing as plain number
    const numDuration = Number(durationStr)
    if (!isNaN(numDuration) && numDuration > 0) {
      return numDuration
    }
  }

  return 0
}

export default function ExamPage() {
  const params = useParams<{ examId: string }>()
  const examId = params?.examId ?? null

  const navigate = useNavigate()

  const [answers, setAnswers] = useState<Record<string, StudentAnswer>>({})
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error" | "">("")
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const initializedExamId = useRef<string | null>(null)

  const fetchExam = useCallback(() => {
    if (!examId) return Promise.reject(new Error("No exam ID"))
    const numExamId = Number.parseInt(examId, 10)
    if (isNaN(numExamId)) return Promise.reject(new Error("Invalid exam ID"))
    return exam.get(numExamId)
  }, [examId])

  const { data: examData, error, loading, refetch } = useFetch<ExamData>(fetchExam, [fetchExam])

  useEffect(() => {
    if (examId && examId !== initializedExamId.current) {
      setAnswers({})
      setCurrentQuestionIndex(0)
      setTimeLeft(0)
      setSubmitted(false)
      setMessage("")
      setMessageType("")
      initializedExamId.current = examId
    }
  }, [examId])

  useEffect(() => {
    if (examData && !submitted) {
      const durationInSeconds = getDurationMinutes(examData) * 60
      setTimeLeft(durationInSeconds > 0 ? durationInSeconds : 0)
    }
  }, [examData, submitted])

  const handleSubmit = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault()
      if (!examData || submitted || isSubmitting) return

      setIsSubmitting(true)
      setMessage("")

      try {
        const result = await exam.submit({
          examId: examData.ExamId || examData.Id,
          answers: Object.values(answers),
        })

        const totalQuestions = examData.Questions.length
        const percentage = totalQuestions > 0 ? ((result.score / totalQuestions) * 100).toFixed(1) : 0

        setMessageType("success")
        setMessage(`Submitted! Score: ${result.score}/${totalQuestions} (${percentage}%)`)
        setSubmitted(true)

        sessionStorage.setItem(
          `exam_${examData.ExamId || examData.Id}_result`,
          JSON.stringify({
            score: result.score,
            total: totalQuestions,
          }),
        )

        setTimeout(() => {
          if (examId) {
            navigate(`/exam-detail/${examId}`, { replace: true })
          }
        }, 1500)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to submit exam"
        console.error("[v0] Submit error:", errorMessage)
        setMessageType("error")
        setMessage(`${errorMessage}. Please check your connection and try again.`)
        setIsSubmitting(false)
      }
    },
    [examData, answers, submitted, isSubmitting, examId, navigate],
  )

  const handleNextQuestion = () => {
    if (examData && currentQuestionIndex < examData.Questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleJumpToQuestion = (index: number) => {
    setCurrentQuestionIndex(index)
  }

  const handleRetry = () => {
    refetch()
  }

  if (loading) return <p className="text-center py-8">Loading exam...</p>

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="max-w-md mx-auto p-6 bg-red-50 border border-red-200 rounded-lg text-center">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Failed to Load Exam</h2>
          <p className="text-red-600 mb-4">
            {error.includes("500") ? "Server error. Please try again in a moment." : error}
          </p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate("/my-courses")}
            className="ml-2 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-medium transition"
          >
            Back to Courses
          </button>
        </div>
      </div>
    )
  }

  if (!examData) return null

  return (
    <div className="flex h-screen bg-background">
      <QuestionNavigation
        questions={examData.Questions}
        answers={answers}
        currentIndex={currentQuestionIndex}
        onSelectQuestion={handleJumpToQuestion}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        submitted={submitted}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ExamHeader
          examTitle={examData.Title}
          timeLeft={timeLeft}
          setTimeLeft={setTimeLeft}
          submitted={submitted}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
          onTimeExpired={handleSubmit}
        />

        {/* Content area */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-6 md:p-8">
            <ExamForm
              exam={examData}
              answers={answers}
              setAnswers={setAnswers}
              onSubmit={handleSubmit}
              submitted={submitted}
              isSubmitting={isSubmitting}
              currentQuestionIndex={currentQuestionIndex}
              onNext={handleNextQuestion}
              onPrevious={handlePreviousQuestion}
            />

            {message && (
              <div
                className={`mt-6 p-4 rounded-lg font-medium flex items-start justify-between gap-4 ${
                  messageType === "success"
                    ? "bg-green-50 border border-green-200 text-green-700"
                    : messageType === "error"
                      ? "bg-red-50 border border-red-200 text-red-700"
                      : "bg-blue-50 border border-blue-200 text-blue-700"
                }`}
              >
                <span>{message}</span>
                {messageType === "error" && !submitted && (
                  <button
                    onClick={handleSubmit}
                    className="ml-auto px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm whitespace-nowrap transition"
                  >
                    Retry
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
