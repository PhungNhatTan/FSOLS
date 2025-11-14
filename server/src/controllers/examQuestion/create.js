import examQuestionModel from "../../models/examQuestion/index.js";
import serviceUtils from "../../services/index.js";

export default async function createExam(req, res) {
    const { mode, data, examId } = req.body;

    if (mode === "useQB"){
        const {questionId } = data;
        const examQuestion = await create.create(examId, questionId);
        return res.status(201).json({ "Question added successfully": examQuestion });
    };

    if (mode === "createQB") {
        try {
            const questionData = await serviceUtils.createQuestionBankEntry(data);
            const examQuestion = await examQuestionModel.create(examId, questionData.id);
            return res.status(201).json({ "Question created and added successfully": examQuestion });
        } catch (error) {
            console.error("Error creating question bank entry:", error);
            return res.status(500).json({ error: "Failed to create exam question entry" });
        }
    };
}