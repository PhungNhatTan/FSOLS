"use client"

import { useCallback, memo, useMemo } from "react"
import Question from "./Question"
import type { ExamFormProps, StudentAnswer, QuestionValue } from "../../../types"

const ExamForm = memo(function ExamForm({
  exam,
  answers,
  setAnswers,
  onSubmit,
  submitted,
  isSubmitting,
  currentQuestionIndex,
  onNext,
  onPrevious,
}: ExamFormProps) {
  const currentQuestion = exam.Questions[currentQuestionIndex]
  const totalQuestions = exam.Questions.length
  const isFirstQuestion = currentQuestionIndex === 0
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1

  const handleAnswerChange = useCallback(
    (questionBankId: string, data: Partial<QuestionValue>) => {
      setAnswers((prev) => {
        const newAnswer: StudentAnswer = {
          questionId: questionBankId,
          answerId: data.answerId,
          answer: data.answer,
        }

        return {
          ...prev,
          [questionBankId]: newAnswer,
        }
      })
    },
    [setAnswers],
  )

  const currentValue: QuestionValue | null = useMemo(() => {
    if (!currentQuestion) return null
    const currentAnswer = answers[currentQuestion.QuestionBankId]
    return currentAnswer
      ? { answerId: currentAnswer.answerId, answerIds: currentAnswer.answerIds, answer: currentAnswer.answer }
      : null
  }, [answers, currentQuestion])

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Question counter and progress */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-600">
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </span>
        <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Current question only */}
      {currentQuestion && (
        <Question
          key={currentQuestion.QuestionBankId}
          question={currentQuestion}
          value={currentValue}
          onChange={handleAnswerChange}
        />
      )}

      {/* Navigation and submit buttons */}
      <div className="flex gap-3 pt-6 border-t">
        <button
          type="button"
          onClick={onPrevious}
          disabled={isFirstQuestion || submitted || isSubmitting}
          className="px-4 py-2 bg-gray-300 hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 rounded transition"
        >
          Previous
        </button>

        <div className="flex-1" />

        {!isLastQuestion ? (
          <button
            type="button"
            onClick={onNext}
            disabled={submitted || isSubmitting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded transition"
          >
            Next
          </button>
        ) : (
          <button
            type="submit"
            disabled={submitted || isSubmitting}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded transition flex items-center gap-2"
          >
            {isSubmitting && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {isSubmitting ? "Submitting..." : submitted ? "Submitted" : "Submit Exam"}
          </button>
        )}
      </div>
    </form>
  )
})

export default ExamForm
