
"use client"
import type { ExamQuestion } from "../../../types/exam"
import type { StudentAnswer } from "../../../types"

interface QuestionNavigationProps {
  questions: ExamQuestion[]
  answers: Record<string, StudentAnswer>
  currentIndex: number
  onSelectQuestion: (index: number) => void
  isOpen: boolean
  onToggle: () => void
  submitted: boolean
}

export default function QuestionNavigation({
  questions,
  answers,
  currentIndex,
  onSelectQuestion,
  isOpen,
  submitted,
}: QuestionNavigationProps) {
  const getQuestionStatus = (question: ExamQuestion) => {
    const studentAnswer = answers[question.QuestionBankId]

    if (!studentAnswer) return "unanswered"

    // For MCQ and True/False - check if answerId is selected
    if (question.Type === "MCQ" || question.Type === "TF") {
      return studentAnswer.answerId ? "answered" : "unanswered"
    }

    // For Fill and Essay - check if answer text is not empty
    if (question.Type === "Fill" || question.Type === "Essay") {
      return studentAnswer.answer && studentAnswer.answer.trim() ? "answered" : "unanswered"
    }

    return "unanswered"
  }

  return (
    <div
      className={`${
        isOpen ? "w-64" : "w-0"
      } transition-all duration-300 bg-gray-50 border-r border-gray-200 overflow-hidden flex flex-col`}
    >
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-2">
          {questions.map((question, index) => {
            const status = getQuestionStatus(question)
            const isActive = index === currentIndex

            const getBackgroundColor = () => {
              if (isActive) return "bg-blue-600 text-white"
              if (status === "answered") return "bg-green-100 text-green-900 hover:bg-green-200"
              return "bg-yellow-100 text-yellow-900 hover:bg-yellow-200 border border-yellow-300"
            }

            return (
              <button
                key={`q-${question.QuestionBankId}`}
                onClick={() => onSelectQuestion(index)}
                className={`w-full text-left p-3 rounded-lg transition-colors text-sm font-medium ${getBackgroundColor()} ${
                  !isOpen ? "hidden" : ""
                }`}
                disabled={submitted}
              >
                <div className="flex items-center justify-between">
                  <span>Q{index + 1}</span>
                  {status === "answered" && <span className="text-xs bg-white/30 px-2 py-1 rounded">✓</span>}
                </div>
                {isActive && <p className="text-xs mt-1 opacity-90 truncate">{question.QuestionText}</p>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Summary at bottom */}
      <div className={`border-t border-gray-200 p-4 bg-white ${!isOpen ? "hidden" : ""}`}>
        <p className="text-xs text-gray-600 mb-2">Progress</p>
        <div className="flex items-center gap-2 text-sm mb-3">
          <span className="font-semibold text-gray-900">
            {
              Object.keys(answers).filter((qId) => {
                const q = questions.find((q) => q.QuestionBankId === qId)
                return q && getQuestionStatus(q) === "answered"
              }).length
            }
            /{questions.length}
          </span>
          <span className="text-gray-500">answered</span>
        </div>

        <div className="text-xs space-y-1 border-t pt-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
            <span className="text-gray-700">Unanswered</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-100 rounded"></div>
            <span className="text-gray-700">Answered</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded"></div>
            <span className="text-gray-700">Current</span>
          </div>
        </div>
      </div>
    </div>
  )
}
