import questionBankModel from "../models/questionBank/index.js";

export default async function createQuestionBankEntry(data) {
  const { questionText, type, answer, courseId, lessonId, answers } = data;

  const validTypes = ["MCQ", "Fill", "Essay", "TF"];
  if (!questionText || !type) {
    throw new Error("Missing required fields: questionText or type");
  }
  if (!validTypes.includes(type)) {
    throw new Error(`Invalid question type: ${type}`);
  }

  return questionBankModel.create({
    questionText,
    type,
    answer,
    courseId,
    lessonId,
    answers,
  });
}
