import { useState, useCallback } from "react";
import client from "../service/client";
import type { ExamData } from "../types/exam";

export function useAddExamQuestion() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const addQuestion = useCallback(
    async (examId: number, questionBankId: string): Promise<ExamData | null> => {
      setLoading(true);
      setError("");
      try {
        const res = await client.post<{ "Question added successfully": ExamData }>(
          "/manage/examQuestion",
          {
            examId,
            mode: "useQB",
            data: {
              questionId: questionBankId,
            },
          }
        );
        return res.data["Question added successfully"];
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to add question";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { addQuestion, loading, error };
}
