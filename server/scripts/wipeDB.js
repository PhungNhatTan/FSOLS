import prisma from "../src/prismaClient.js";

/**
 * Dev-only wipe script.
 *
 * Purpose
 * - Wipe course / forum / progress / moderation data for local development.
 * - Preserve core auth + role data so you can still log in after wiping.
 *
 * Preserved models ("important" data)
 * - Account
 * - Provider
 * - AccountIdentifier
 * - AccountRole
 * - Mentor
 * - Admin
 * - Category
 */
function assertSafeToRun() {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Refusing to run wipeDB.js with NODE_ENV=production. This script is intended for local development only."
    );
  }
}

async function main() {
  assertSafeToRun();

  console.log(
    "⚠️  Wiping dev data (preserving Account/Provider/AccountIdentifier/roles/categories)..."
  );

  /**
   * IMPORTANT
   * - Do NOT use TRUNCATE here.
   *   In MySQL, TRUNCATE fails when a table is referenced by a foreign key
   *   (e.g. Course <- CourseEmbedding), even if FOREIGN_KEY_CHECKS=0.
   * - Use ordered deleteMany() calls to satisfy FK constraints and keep DB consistent.
   */

  // Break self-references so Post.deleteMany() never gets blocked by RESTRICT constraints.
  await prisma.post.updateMany({
    data: {
      ParentId: null,
      ReplyId: null,
    },
  });

  // Delete in dependency order (children first).
  const steps = [
    ["OtpToken", () => prisma.otpToken.deleteMany()],
    ["Message", () => prisma.message.deleteMany()],
    ["PostRemoval", () => prisma.postRemoval.deleteMany()],
    ["Post", () => prisma.post.deleteMany()],
    ["Report", () => prisma.report.deleteMany()],
    ["AccountSuspension", () => prisma.accountSuspension.deleteMany()],
    ["CourseReview", () => prisma.courseReview.deleteMany()],
    ["UserCertificate", () => prisma.userCertificate.deleteMany()],
    ["Certificate", () => prisma.certificate.deleteMany()],

    // Enrollment & progress
    ["LessonProgress", () => prisma.lessonProgress.deleteMany()],
    ["CourseEnroll", () => prisma.courseEnroll.deleteMany()],

    // Exams
    ["StudentAnswer", () => prisma.studentAnswer.deleteMany()],
    ["ExamSubmission", () => prisma.examSubmission.deleteMany()],
    ["ExamQuestion", () => prisma.examQuestion.deleteMany()],
    ["ExamAnswer", () => prisma.examAnswer.deleteMany()],
    ["Exam", () => prisma.exam.deleteMany()],

    // Question bank & lessons
    ["QuestionBank", () => prisma.questionBank.deleteMany()],
    ["LessonResource", () => prisma.lessonResource.deleteMany()],
    ["CourseLesson", () => prisma.courseLesson.deleteMany()],

    // Course structure
    ["ModuleItem", () => prisma.moduleItem.deleteMany()],
    ["CourseModule", () => prisma.courseModule.deleteMany()],
    ["CourseSkill", () => prisma.courseSkill.deleteMany()],
    ["CourseEmbedding", () => prisma.courseEmbedding.deleteMany()],

    // Courses & specializations
    ["SpecializationCourse", () => prisma.specializationCourse.deleteMany()],
    ["VerificationRequest", () => prisma.verificationRequest.deleteMany()],
    ["Course", () => prisma.course.deleteMany()],
    ["Specialization", () => prisma.specialization.deleteMany()],
  ];

  for (const [label, fn] of steps) {
    console.log(`🧹 Deleting ${label}...`);
    await fn();
  }

  console.log("✅ Wipe completed successfully (auth + roles preserved)");
}

main()
  .catch((err) => {
    console.error("❌ Wipe failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
