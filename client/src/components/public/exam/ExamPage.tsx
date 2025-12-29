"use client"

import { useState, type FormEvent, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import * as exam from "../../../api/exam"
import { useFetch } from "../../../hooks/useFetch"
import type { ExamData, StudentAnswer } from "../../../types"
import ExamForm from "./ExamForm"
import ExamHeader from "./ExamHeader"
import QuestionNavigation from "./QuestionNavigation"

export default function ExamPage() {
  const { examId, courseId } = useParams<{ examId?: string; courseId?: string }>()
  const navigate = useNavigate()

  const [answers, setAnswers] = useState<Record<string, StudentAnswer>>({})
  const [message, setMessage] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const {
    data: examData,
    error,
    loading,
  } = useFetch<ExamData>(examId ? () => exam.get(Number(examId)) : null, [examId])

  useEffect(() => {
    if (examData && !timeLeft) {
      setTimeLeft(examData.Duration * 60)
    }
  }, [examData, timeLeft])

  useEffect(() => {
    if (timeLeft === 0 && examData && !submitted) {
      handleSubmit()
    }
  }, [timeLeft, examData, submitted])

  const handleSubmit = async (e?: FormEvent) => {
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
      if (courseId && examId) {
        navigate(`/course/${courseId}/exam/${examId}`, { replace: true })
      }
    } catch {
      setMessage("Submission failed")
      setSubmitted(false)
    }
  }

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

  if (loading) return <p className="text-center py-8">Loading exam...</p>
  if (error) return <p className="text-center py-8 text-red-500">Error: {error}</p>
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
