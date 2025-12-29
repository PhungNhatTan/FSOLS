"use client"

import { useState, type FormEvent, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import * as exam from "../../../api/exam"
import { useFetch } from "../../../hooks/useFetch"
import type { ExamData, StudentAnswer } from "../../../types"
import ExamForm from "./ExamForm"
import ExamHeader from "./ExamHeader"
import QuestionNavigation from "./QuestionNavigation"

export default function ExamPage() {
  const { examId } = useParams<{ examId: string }>()
  const navigate = useNavigate()

  const [answers, setAnswers] = useState<Record<string, StudentAnswer>>({})
  const [message, setMessage] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [retryCount, setRetryCount] = useState(0) // add retry counter

  const fetchExam = useCallback(() => {
    if (!examId) return Promise.reject(new Error("No exam ID"))
    return exam.get(Number(examId))
  }, [examId])

  const { data: examData, error, loading } = useFetch<ExamData>(fetchExam, [retryCount])

  useEffect(() => {
    if (examData && timeLeft === 0) {
      setTimeLeft(examData.Duration * 60) // Fixed: Duration (capital D) from backend, not duration
    }
  }, [examData])

  // This was causing flickering by triggering repeatedly
  // useEffect(() => {
  //   if (timeLeft === 0 && examData && !submitted) {
  //     handleSubmit()
  //   }
  // }, [timeLeft, examData, submitted])

  const handleSubmit = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault()
      if (!examData || submitted) return

      setSubmitted(true)

      try {
        const result = await exam.submit({
          examId: examData.Id,
          answers: Object.values(answers),
        })

        setMessage(`Submitted! Score: ${result.score}/${result.total}`)

        // Navigate back to ExamDetailDisplay immediately
        if (examId) {
          navigate(`/exam/${examId}`, { replace: true })
        }
      } catch {
        setMessage("Submission failed")
        setSubmitted(false)
      }
    },
    [examData, answers, submitted, examId, navigate],
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
    setRetryCount(retryCount + 1)
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
              currentQuestionIndex={currentQuestionIndex}
              onNext={handleNextQuestion}
              onPrevious={handlePreviousQuestion}
            />

            {message && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 font-medium">
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
