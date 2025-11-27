// src/components/public/exam/ExamDetailDisplay.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useFetch } from "../../../hooks/useFetch";
import * as examApi from "../../../api/exam";

export default function ExamDetailDisplay() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();

  const { data, loading, error } = useFetch(
    examId ? () => examApi.getWithResult(Number(examId)) : null,
    [examId]
  );

  if (loading) return <p className="text-gray-500 italic">Loading exam...</p>;
  if (error) return <p className="text-red-500 font-semibold">{error}</p>;
  if (!data) return <p className="text-gray-500 italic">Exam not found.</p>;

  const { exam, result } = data;

  return (
    <div className="p-6 max-w-3xl mx-auto border rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">{exam.Title}</h1>

      <p className="text-gray-700 mb-2">Duration: {exam.Duration} minutes</p>

      {result ? (
        <p className="text-green-600 font-semibold mb-4">
          Your Score: {result.score}
        </p>
      ) : (
        <p className="text-gray-500 mb-4">You haven't taken this exam yet.</p>
      )}

      <button
        onClick={() => navigate(`/course/${examId}/takingExam/${exam.Id}`)}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Take Exam
      </button>
    </div>
  );
}
