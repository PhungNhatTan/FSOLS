import prisma from '../../prismaClient.js';
import checkCourseCompletion from './checkCourseCompletion.js';

async function completeCourse(accountId, courseId) {
  const enrollment = await prisma.courseEnroll.findFirst({
    where: { AccountId: accountId, CourseId: courseId, DeletedAt: null }
  });

  if (!enrollment || enrollment.Status === 'Completed') return { alreadyCompleted: true };

  const isFinished = await checkCourseCompletion(accountId, courseId);
  if (!isFinished) return { completed: false };

  return await prisma.$transaction(async (tx) => {
    await tx.courseEnroll.update({
      where: { Id: enrollment.Id },
      data: { Status: 'Completed', CompletedAt: new Date() }
    });

    const certTemplate = await tx.certificate.findUnique({ where: { CourseId: courseId } });
    if (certTemplate) {
      const existing = await tx.userCertificate.findFirst({
        where: { AccountId: accountId, CertificateId: certTemplate.Id }
      });
      if (!existing) {
        await tx.userCertificate.create({
          data: { AccountId: accountId, CertificateId: certTemplate.Id }
        });
      }
    }
    return { completed: true };
  });
}
export default completeCourse;
