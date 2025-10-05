import client from "../api/client";

export interface Answer {
    Id: string;
    AnswerText: string;
}

export type QuestionType = "MCQ" | "TF" | "Fill" | "Essay";

export interface Question {
    ExamQuestionId: string;
    QuestionBankId: string;
    QuestionText: string;
    Type: QuestionType;
    Answers?: Answer[];
}

export interface ExamData {
    Id: number;
    Title: string;
    Duration: number; // in minutes
    Questions: Question[];
}

export interface StudentAnswer {
    questionId: string;
    answerId?: string; // MCQ / TF
    answer?: string;   // Essay / Fill
}

export async function getExam(examId: number): Promise<ExamData> {
    const res = await client.get(`/exam/${examId}`);
    const data = res.data;

    // fallback
    data.Questions = data.Questions.map((q: Question) => ({
        ...q,
        Answers: q.Answers ?? [],
    }));

    return data;
}

export async function submitExam(data: {
    examId: number;
    accountId: string;
    answers: StudentAnswer[];
}): Promise<{ score: number; total: number }> {
    const res = await client.post(`/exam/submit`, data);
    return res.data;
}
