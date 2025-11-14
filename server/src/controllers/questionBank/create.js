import helperServices from "../../services/index.js";

export default async function create(req, res, next) {
    try {
        const data = req.body;
        const questionBankData = await helperServices.createQuestionBankEntry(data);

        res.status(201).json(questionBankData);
    } catch (error) {
        console.error("Error creating question bank entry:", error);
        res.status(500).json({ error: "Failed to create question bank entry" });
        next(error);
    }
}
