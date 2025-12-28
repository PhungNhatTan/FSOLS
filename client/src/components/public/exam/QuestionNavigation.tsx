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
  const getQuestionStatus = (questionId: string) => {
    const hasAnswer = answers[questionId]
    return hasAnswer ? "answered" : "unanswered"
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
            const status = getQuestionStatus(question.QuestionBankId)
            const isActive = index === currentIndex

            return (
              <button
                key={question.ExamQuestionId}
                onClick={() => onSelectQuestion(index)}
                className={`w-full text-left p-3 rounded-lg transition-colors text-sm font-medium ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : status === "answered"
                      ? "bg-green-100 text-green-900 hover:bg-green-200"
                      : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                } ${!isOpen ? "hidden" : ""}`}
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
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-gray-900">
            {Object.keys(answers).length}/{questions.length}
          </span>
          <span className="text-gray-500">answered</span>
        </div>
      </div>
    </div>
  )
}
