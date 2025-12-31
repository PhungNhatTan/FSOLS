"use client"

import { memo } from "react"
import { MCQuestion, FillQuestion, EssayQuestion } from "./QuestionTypes/index"
import type { QuestionProps } from "../../../types"

const Question = memo(function Question({ question, value, onChange }: QuestionProps) {
  switch (question.Type) {
    case "MCQ":
    case "TF":
      return <MCQuestion question={question} value={value} onChange={onChange} />
    case "Fill":
      return <FillQuestion question={question} value={value} onChange={onChange} />
    case "Essay":
      return <EssayQuestion question={question} value={value} onChange={onChange} />
    default:
      return null
  }
})

export default Question
