"use client"

import type { ChangeEvent } from "react"
import type { QuestionTypeProps } from "../../../../types"

export default function EssayQuestion({ question, value, onChange }: QuestionTypeProps) {
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(question.QuestionBankId, { answer: e.target.value })
  }

  return (
    <div className="space-y-6">
      <p className="text-lg font-semibold text-gray-900">{question.QuestionText}</p>
      <textarea
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-none"
        placeholder="Type your essay here..."
        rows={6}
        value={value?.answer || ""}
        onChange={handleChange}
      />
      <p className="text-sm text-gray-500">{(value?.answer || "").length} characters</p>
    </div>
  )
}
