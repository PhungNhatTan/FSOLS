import { useState, useEffect, useCallback, useRef, type FormEvent } from "react";
import * as exam from "../../../api/exam";
import type { ExamData, StudentAnswer } from "../../../types/exam";
import ExamForm from "./ExamForm";
import ExamHeader from "./ExamHeader";
import QuestionNavigation from "./QuestionNavigation";
import { getAccountId } from "../../../utils/auth";

const PRESET_DURATION_MINUTES: Record<string, number> = {
  P_10: 10,
  P_15: 15,
  P_30: 30,
  P_60: 60,
  P_90: 90,
  P_120: 120,
};

const getDurationMinutes = (examData: ExamData): number => {
  if (examData.DurationCustom) {
    const customDuration = Number(examData.DurationCustom);
    if (!isNaN(customDuration) && customDuration > 0) {
      return customDuration;
    }
  }

  if (examData.DurationPreset) {
    const presetKey = String(examData.DurationPreset).trim();
    const presetDuration = PRESET_DURATION_MINUTES[presetKey];
    if (presetDuration && presetDuration > 0) {
      return presetDuration;
    }
  }

  if (examData.Duration) {
    const durationStr = String(examData.Duration).trim();
    const presetDuration = PRESET_DURATION_MINUTES[durationStr];
    if (presetDuration && presetDuration > 0) {
      return presetDuration;
    }
    const numDuration = Number(durationStr);
    if (!isNaN(numDuration) && numDuration > 0) {
      return numDuration;
    }
  }

  return 0;
};

interface ExamViewerProps {
  examId: number;
  onComplete?: () => void; // NEW: Callback when exam is completed
  onBlocked?: (notice: string) => void; // NEW: Time-limit / enrollment lock
}

export default function ExamViewer({ examId, onComplete, onBlocked }: ExamViewerProps) {
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [answers, setAnswers] = useState<Record<string, StudentAnswer>>({});
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const initializedExamId = useRef<number | null>(null);

  // Reset state when exam changes
  useEffect(() => {
    if (examId && examId !== initializedExamId.current) {
      setAnswers({});
      setCurrentQuestionIndex(0);
      setTimeLeft(0);
      setSubmitted(false);
      setMessage("");
      setMessageType("");
      initializedExamId.current = examId;
    }
  }, [examId]);

  // Load exam data
  useEffect(() => {
    if (!examId) {
      setError("Exam not found");
      setLoading(false);
      return;
    }

    setLoading(true);
    exam
      .get(examId)
      .then((data) => {
        setExamData(data);
        const durationInSeconds = getDurationMinutes(data) * 60;
        setTimeLeft(durationInSeconds > 0 ? durationInSeconds : 0);
        setError("");
      })
      .catch(() => setError("Failed to load exam"))
      .finally(() => setLoading(false));
  }, [examId]);

  const handleSubmit = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault();
      if (!examData || submitted || isSubmitting) return;

      setIsSubmitting(true);
      setMessage("");

      try {
        const result = await exam.submit({
          examId: examData.ExamId || examData.Id,
          answers: Object.values(answers),
        });

        const totalQuestions = examData.Questions.length;
        const percentage = totalQuestions > 0 
          ? ((result.score / totalQuestions) * 100).toFixed(1) 
          : 0;

        setMessageType("success");
        setMessage(`Submitted! Score: ${result.score}/${totalQuestions} (${percentage}%)`);
        setSubmitted(true);

        // Save to session storage
        const accountId = getAccountId() ?? "anonymous";
        const examKey = examData.ExamId || examData.Id;
        sessionStorage.setItem(
          `exam_${examKey}_account_${accountId}_result`,
          JSON.stringify({
            score: result.score,
            total: totalQuestions,
          })
        );

        // NEW: Call onComplete callback after a delay
        if (onComplete) {
          setTimeout(() => {
            onComplete();
          }, 2000);
        }
      } catch (err) {
        const anyErr = err as any
        const errorMessage = err instanceof Error ? err.message : "Failed to submit exam";

        // If the course time-limit expired while taking the exam, kick back to the course page.
        if (anyErr?.code === "COURSE_TIME_EXPIRED" && onBlocked) {
          setIsSubmitting(false)
          onBlocked(errorMessage)
          return
        }
        console.error("Submit error:", errorMessage);
        setMessageType("error");
        setMessage(`${errorMessage}. Please check your connection and try again.`);
        setIsSubmitting(false);
      }
    },
    [examData, answers, submitted, isSubmitting, onComplete, onBlocked]
  );

  const handleNextQuestion = () => {
    if (examData && currentQuestionIndex < examData.Questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleJumpToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  if (loading) {
    return <p className="text-center py-8">Loading exam...</p>;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="max-w-md mx-auto p-6 bg-red-50 border border-red-200 rounded-lg text-center">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Failed to Load Exam</h2>
          <p className="text-red-600 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  if (!examData) return null;

  return (
    <div className="flex h-screen bg-background">
      {/* Reuse your existing QuestionNavigation component */}
      <QuestionNavigation
        questions={examData.Questions}
        answers={answers}
        currentIndex={currentQuestionIndex}
        onSelectQuestion={handleJumpToQuestion}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        submitted={submitted}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Reuse your existing ExamHeader component */}
        <ExamHeader
          examTitle={examData.Title}
          timeLeft={timeLeft}
          setTimeLeft={setTimeLeft}
          submitted={submitted}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
          onTimeExpired={handleSubmit}
        />

        {/* Content area */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-6 md:p-8">
            {/* Reuse your existing ExamForm component */}
            <ExamForm
              exam={examData}
              answers={answers}
              setAnswers={setAnswers}
              onSubmit={handleSubmit}
              submitted={submitted}
              isSubmitting={isSubmitting}
              currentQuestionIndex={currentQuestionIndex}
              onNext={handleNextQuestion}
              onPrevious={handlePreviousQuestion}
            />

            {/* Success/Error message */}
            {message && (
              <div
                className={`mt-6 p-4 rounded-lg font-medium flex items-start justify-between gap-4 ${
                  messageType === "success"
                    ? "bg-green-50 border border-green-200 text-green-700"
                    : messageType === "error"
                    ? "bg-red-50 border border-red-200 text-red-700"
                    : "bg-blue-50 border border-blue-200 text-blue-700"
                }`}
              >
                <div>
                  <span>{message}</span>
                  {onComplete && messageType === "success" && (
                    <p className="text-sm mt-2 text-gray-600">
                      Moving to next item...
                    </p>
                  )}
                </div>
                {messageType === "error" && !submitted && (
                  <button
                    onClick={() => handleSubmit()}
                    className="ml-auto px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm whitespace-nowrap transition"
                  >
                    Retry
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}