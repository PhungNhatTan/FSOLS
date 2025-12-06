import questionBankModel from "../../models/questionBank";

export default async function update(req, res, next) {
    try {
        const { id } = req.params;
        const data = req.body;
        const updatedQuestionBank = await questionBankModel.update(id, data);
        res.json(updatedQuestionBank);
    }
    catch (err) {
        next(err);
    }
}