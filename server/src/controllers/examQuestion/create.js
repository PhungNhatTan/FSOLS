import examQuestionModel from "../../models/examQuestion/index.js";
import examModel from "../../models/exam/index.js";
import serviceUtils from "../../services/index.js";

export default async function createExam(req, res) {
    const { mode, data, examId, courseId } = req.body;

    if (mode === "useQB"){
        const {questionId } = data;
        await examQuestionModel.create(examId, questionId);
        const updatedExam = await examModel.getForExam(examId);
        return res.status(201).json(updatedExam);
    };

    if (mode === "createQB") {
        try {
            const questionData = await serviceUtils.createQuestionBankEntry({
                ...data,
                courseId
            });
            await examQuestionModel.create(examId, questionData.Id);
            const updatedExam = await examModel.getForExam(examId);
            return res.status(201).json(updatedExam);
        } catch (error) {
            console.error("Error creating question bank entry:", error);
            return res.status(500).json({ error: "Failed to create exam question entry" });
        }
    };
}
