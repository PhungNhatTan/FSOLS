import questionBankModel from "../../models/questionBank";

export default async function create(req, res, next) {
    try {
        const { questionText, type, answer, courseId, lessonId, answers } = req.body;

        if (!questionText || !type) {
            return res
                .status(400)
                .json({ error: "Missing required fields: questionText or type" });
        }

        const validTypes = ["MCQ", "Fill", "Essay", "TF"];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ error: `Invalid question type: ${type}` });
        }

        const question = await questionBankModel.create({
            questionText,
            type,
            answer,
            courseId,
            lessonId,
            answers,
        });

        res.status(201).json(question);
    } catch (error) {
        console.error("❌ Error creating question bank entry:", error);
        res.status(500).json({ error: "Failed to create question bank entry" });
        next(error);
    }
}
