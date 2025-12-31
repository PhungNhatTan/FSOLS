"use client"

import { useParams, useNavigate } from "react-router-dom"
import { useFetch } from "../../../hooks/useFetch"
import * as examApi from "../../../api/exam"
import { useCallback } from "react"

export default function ExamDetailDisplay() {
  const { examId } = useParams<{ examId: string }>()
  const navigate = useNavigate()

  const fetchExamData = useCallback(() => {
    if (!examId) return Promise.resolve(null)
    return examApi.getWithResult(Number(examId))
  }, [examId])

  const { data, loading, error } = useFetch(fetchExamData, [examId])

  if (loading) return <p className="text-gray-500 italic">Loading exam...</p>
  if (error) return <p className="text-red-500 font-semibold">{error}</p>
  if (!data) return <p className="text-gray-500 italic">Exam not found.</p>

  const { exam, result } = data
  const hasAttempted = result !== null

  const handleTakeExam = () => {
    navigate(`/exam/${exam.Id}`)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto border rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">{exam.Title}</h1>

      <p className="text-gray-700 mb-2">Duration: {exam.Duration} minutes</p>

      {hasAttempted && result ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-green-700 font-semibold mb-1">Exam Completed!</p>
          <p className="text-green-600 text-lg">Your Score: {result.score}</p>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-yellow-700 font-semibold">Not Started Yet</p>
          <p className="text-yellow-600">Start taking this exam to see your score.</p>
        </div>
      )}

      <button
        onClick={handleTakeExam}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium transition"
      >
        {hasAttempted ? "Retake Exam" : "Take Exam"}
      </button>
    </div>
  )
}
