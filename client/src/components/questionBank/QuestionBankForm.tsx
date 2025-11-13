import { useState, type FormEvent } from "react";
import * as questionBankApi from "../../api/questionBank";
import type {
  QuestionType,
  AnswerInput,
  CreateQuestionBankPayload,
  QuestionBank,
} from "../../types/questionBank";
import { ErrorMessage, LoadingMessage } from "../common/StatusMessages";
import QuestionBankFields from "./QuestionBankFields";
import QuestionBankAnswers from "./QuestionBankAnswers";

export default function QuestionBankForm() {
  const [form, setForm] = useState({
    questionText: "",
    type: "MCQ" as QuestionType,
    answer: "",
    courseId: "",
    lessonId: "",
    answers: [{ text: "", isCorrect: false }] as AnswerInput[],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAnswerChange = <K extends keyof AnswerInput>(
    index: number,
    field: K,
    value: AnswerInput[K]
  ) => {
    setForm((prev) => {
      const updated = [...prev.answers];
      updated[index][field] = value;
      return { ...prev, answers: updated };
    });
  };

  const addAnswer = () =>
    setForm((prev) => ({
      ...prev,
      answers: [...prev.answers, { text: "", isCorrect: false }],
    }));

  const removeAnswer = (index: number) =>
    setForm((prev) => ({
      ...prev,
      answers: prev.answers.filter((_, i) => i !== index),
    }));

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const payload: CreateQuestionBankPayload = {
      questionText: form.questionText,
      type: form.type,
      answer: form.type === "Essay" ? form.answer : undefined,
      courseId: form.courseId ? Number(form.courseId) : undefined,
      lessonId: form.lessonId || undefined,
      answers: form.type !== "Essay" ? form.answers : undefined,
    };

    try {
      const created: QuestionBank = await questionBankApi.create(payload);
      console.info("Created question:", created);

      setSuccess("Question created successfully!");
      setForm({
        questionText: "",
        type: "MCQ",
        answer: "",
        courseId: "",
        lessonId: "",
        answers: [{ text: "", isCorrect: false }],
      });
    } catch (err) {
      // Safely infer AxiosError or network error types
      if (err instanceof Error) {
        setError((err as { response?: { data?: { error?: string } } }).response?.data?.error || err.message);
      } else {
        setError("Failed to create question");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-4">Create Question Bank Entry</h1>

      {loading && <LoadingMessage text="Creating question..." />}
      {error && <ErrorMessage message={error} />}
      {success && <p className="text-green-600 font-semibold">{success}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <QuestionBankFields form={form} onChange={handleChange} />

        {form.type === "Essay" ? (
          <div>
            <label className="block font-medium mb-1">Correct Answer</label>
            <textarea
              value={form.answer}
              onChange={(e) => handleChange("answer", e.target.value)}
              className="w-full border rounded p-2"
            />
          </div>
        ) : (
          <QuestionBankAnswers
            answers={form.answers}
            onChange={handleAnswerChange}
            onAdd={addAnswer}
            onRemove={removeAnswer}
          />
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create Question
        </button>
      </form>
    </div>
  );
}
