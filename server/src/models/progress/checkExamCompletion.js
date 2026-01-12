import prisma from '../../prismaClient.js';

async function checkExamCompletion(accountId, examId) {
  const exam = await prisma.exam.findUnique({
    where: { Id: examId },
    include: { _count: { select: { ExamQuestion: true } } }
  });
  if (!exam) return false;

  const passingScore = Math.ceil(exam._count.ExamQuestion * 0.8);
  const submission = await prisma.examSubmission.findFirst({
    where: { AccountId: accountId, ExamId: examId, Score: { gte: passingScore } }
  });
  return submission !== null;
}
export default checkExamCompletion;