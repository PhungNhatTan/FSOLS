import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import Timer from "../components/Timer";
import Question from "../components/Question";
import examApi, { type ExamData, type StudentAnswer } from "../api/exam";

export default function ExamPage() {
  const { examId } = useParams<{ examId: string }>();
  const [exam, setExam] = useState<ExamData | null>(null);
  const [answers, setAnswers] = useState<Record<string, StudentAnswer>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!examId) return;
    examApi
      .get(Number(examId))
      .then((data) => {
        setExam(data);
        setTimeLeft(data.Duration * 60);
      })
      .catch((err) => setMessage(`Error: ${err.message}`));
  }, [examId]);

  const submitNow = async () => {
    if (!exam || submitted) return;
    setSubmitted(true);
    try {
      const result = await examApi.submit({
        examId: exam.Id,
        answers: Object.values(answers),
      });
      setMessage(`✅ Submitted! Score: ${result.score}/${result.total}`);
    } catch {
      setMessage("❌ Submission failed");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await submitNow();
  };

  const handleAutoSubmit = async () => {
    setMessage("⏰ Time is up! Auto-submitting...");
    await submitNow();
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {exam ? (
        <>
          <h1 className="text-2xl font-bold mb-4">{exam.Title}</h1>
          <Timer
            timeLeft={timeLeft}
            setTimeLeft={setTimeLeft}
            onExpire={handleAutoSubmit}
            submitted={submitted}
          />

          <form onSubmit={handleSubmit} className="space-y-6">
            {exam.Questions.map((q) => (
              <Question
                key={q.ExamQuestionId}
                question={q}
                value={answers[q.QuestionBankId]}
                onChange={(questionId, data) =>
                  setAnswers((prev) => ({
                    ...prev,
                    [questionId]: { questionId, ...data },
                  }))
                }
              />
            ))}

            {!submitted && (
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                Submit Exam
              </button>
            )}
          </form>

          {message && <p className="mt-4 font-semibold">{message}</p>}
        </>
      ) : (
        <p>Loading exam...</p>
      )}
    </div>
  );
}
