import { useState, useCallback } from "react";
import client from "../service/client";
import type { ExamData } from "../types/exam";

interface CreateQuestionPayload {
  type: "MCQ" | "Fill" | "Essay" | "TF";
  text: string;
  options?: string[];
  correctIndex?: number;
}

export function useCreateExamQuestion() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const createAndAttach = useCallback(
    async (examId: number, payload: CreateQuestionPayload): Promise<ExamData | null> => {
      setLoading(true);
      setError("");
      try {
        const res = await client.post<{ "Question created and added successfully": ExamData }>(
          "/manage/examQuestion",
          {
            examId,
            mode: "createQB",
            data: {
              QuestionText: payload.text,
              Type: payload.type,
              Answers:
                payload.options?.map((opt, idx) => ({
                  AnswerText: opt,
                  IsCorrect: idx === payload.correctIndex,
                })) || [],
            },
          }
        );
        return res.data["Question created and added successfully"];
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to create question";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { createAndAttach, loading, error };
}
