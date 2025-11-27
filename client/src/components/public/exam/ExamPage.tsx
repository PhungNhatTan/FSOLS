import { useState, type FormEvent, useEffect } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import * as exam from "../../../api/exam";
import { useFetch } from "../../../hooks/useFetch";
import { type ExamData, type StudentAnswer, type CourseStudyContext } from "../../../types";
import Timer from "./Timer";
import ExamForm from "./ExamForm";

export default function ExamPage() {
  const { examId } = useParams<{ examId: string }>();
  const { courseId } = useOutletContext<CourseStudyContext>();
  const navigate = useNavigate();

  const [answers, setAnswers] = useState<Record<string, StudentAnswer>>({});
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const { data: examData, error, loading } = useFetch<ExamData>(
    examId ? () => exam.get(Number(examId)) : null,
    [examId]
  );

  useEffect(() => {
    if (examData && !timeLeft) {
      setTimeLeft(examData.Duration * 60);
    }
  }, [examData, timeLeft]);

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!examData || submitted) return;

    setSubmitted(true);

    try {
      const result = await exam.submit({
        examId: examData.Id,
        answers: Object.values(answers),
      });

      setMessage(`Submitted! Score: ${result.score}/${result.total}`);

      // Navigate back to ExamDetailDisplay immediately
      if (courseId && examId) {
        navigate(`/course/${courseId}/exam/${examId}`, { replace: true });
      }
    } catch {
      setMessage("Submission failed");
      setSubmitted(false);
    }
  };

  if (loading) return <p>Loading exam...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;
  if (!examData) return null;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{examData.Title}</h1>

      <Timer
        timeLeft={timeLeft}
        setTimeLeft={setTimeLeft}
        onExpire={handleSubmit}
        submitted={submitted}
      />

      <ExamForm
        exam={examData}
        answers={answers}
        setAnswers={setAnswers}
        onSubmit={handleSubmit}
        submitted={submitted}
      />

      {message && <p className="mt-4 font-semibold">{message}</p>}
    </div>
  );
}
