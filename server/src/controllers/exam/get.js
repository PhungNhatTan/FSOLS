import exam from "../../models/exam/index.js";
import examSubmission from "../../models/examSubmission/index.js";

export default async function get(req, res, next) {
    try {
        const { id } = req.params;
        const user = req.user;

        if (!id) {
            return res.status(400).json({ message: "Exam ID is required" });
        }

        const examId = Number(id);
        if (isNaN(examId)) {
            return res.status(400).json({ message: "Invalid exam ID" });
        }

        const examData = await exam.get(examId);
        if (!examData) {
            return res.status(404).json({ message: "Exam not found" });
        }

        let result = null;
        if (user?.id) {
            result = await examSubmission.getExamResult(user.id, examId);
        }

        return res.status(200).json({
            exam: examData,
            result: result ?? null,
        });
    } catch (err) {
        console.error("Error fetching exam detail with result:", err);
        next(err);
    }
}
