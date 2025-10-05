import MCQuestion from "./QuestionTypes/MCQuestion";
import FillQuestion from "./QuestionTypes/FillQuestion";
import EssayQuestion from "./QuestionTypes/EssayQuestion";
import type { QuestionData, QuestionValue, Answer } from "./QuestionTypes/types";

interface QuestionProps {
    question: QuestionData;
    value: QuestionValue | null;
    onChange: (questionId: string, data: Partial<QuestionValue>) => void;
}

export default function Question({ question, value, onChange }: QuestionProps) {
    switch (question.Type) {
        case "MCQ":
        case "TF":
            return (
                <MCQuestion
                    question={question as QuestionData & { Answers: Answer[] }}
                    value={value}
                    onChange={(qid, data) => onChange(qid, data)}
                />
            );

        case "Fill":
            return (
                <FillQuestion
                    question={question}
                    value={value}
                    onChange={(qid, data) => onChange(qid, data)}
                />
            );

        case "Essay":
            return (
                <EssayQuestion
                    question={question}
                    value={value}
                    onChange={(qid, data) => onChange(qid, data)}
                />
            );

        default:
            return null;
    }
}
