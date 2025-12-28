"use client"

import type { QuestionTypeProps } from "../../../../types"

export default function MCQuestion({ question, value, onChange }: QuestionTypeProps) {
  return (
    <div className="space-y-6">
      <p className="text-lg font-semibold text-gray-900">{question.QuestionText}</p>
      <div className="space-y-3">
        {question.Answers.map((a) => (
          <label
            key={a.Id}
            className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
          >
            <input
              type="radio"
              name={question.ExamQuestionId}
              value={a.Id}
              checked={value?.answerId === a.Id}
              onChange={() => onChange(question.QuestionBankId, { answerId: a.Id })}
              className="mt-1"
            />
            <span className="text-gray-700">{a.AnswerText}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
