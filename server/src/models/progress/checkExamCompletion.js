import prisma from '../../prismaClient.js';

async function checkExamCompletion(accountId, examId) {
  const submission = await prisma.examSubmission.findFirst({
    where: {
      AccountId: accountId,
      ExamId: examId,
    },
  });

  return submission !== null;
}

export default checkExamCompletion;