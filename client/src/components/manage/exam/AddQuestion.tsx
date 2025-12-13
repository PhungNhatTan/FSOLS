import { useState } from "react";
import type { ExamLocal as Exam } from "../../../types/manage";
import { BankPicker } from "./BankPicker";
import { NewQuestion } from "./NewQuestion";

export function AddQuestion({ courseId, exam, onExamChange, onClose }: { courseId: number; exam: Exam; onExamChange: (ex: Exam) => void; onClose: () => void }) {
    const [tab, setTab] = useState<"bank" | "new">("bank");
    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <button className={`px-3 py-1.5 rounded-full border ${tab === "bank" ? "bg-indigo-50 border-indigo-200" : ""}`} onClick={() => setTab("bank")}>From QuestionBank</button>
                <button className={`px-3 py-1.5 rounded-full border ${tab === "new" ? "bg-indigo-50 border-indigo-200" : ""}`} onClick={() => setTab("new")}>Create new</button>
            </div>
            {tab === "bank" ? <BankPicker courseId={courseId} exam={exam} onExamChange={onExamChange} onClose={onClose} /> : <NewQuestion courseId={courseId} exam={exam} onExamChange={onExamChange} onClose={onClose} />}
        </div>
    );
}