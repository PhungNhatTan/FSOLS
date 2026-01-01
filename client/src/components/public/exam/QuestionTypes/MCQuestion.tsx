"use client"

import { memo, useCallback } from "react"
import type { QuestionTypeProps, ExamAnswer } from "../../../../types"

const MCQuestion = memo(function MCQuestion({ question, value, onChange }: QuestionTypeProps) {
  const handleChange = useCallback(
    (answerId: string) => {
      onChange(question.QuestionBankId, { answerId })
    },
    [question.QuestionBankId, onChange],
  )

  return (
    <div className="space-y-6">
      <p className="text-lg font-semibold text-gray-900">{question.QuestionText}</p>
      <div className="space-y-3">
        {question.Answers.map((answer: ExamAnswer, index: number) => {
          const answerId = answer.AnswerId ? String(answer.AnswerId) : `answer-${index}`
          const answerText = answer.AnswerText
          const isChecked = !!(value?.answerId && String(value.answerId) === answerId)

          return (
            <label
              key={answerId}
              className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                isChecked ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-blue-50"
              }`}
            >
              <input
                type="radio"
                name={`question-${question.QuestionBankId}`}
                value={answerId}
                checked={isChecked}
                onChange={() => handleChange(answerId)}
                className="mt-1"
              />
              <span className="text-gray-700">{answerText}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
})

export default MCQuestion
