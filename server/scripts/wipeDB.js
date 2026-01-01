import prisma from "../src/prismaClient.js";

/**
 * Wipe ALL tables except:
 * - Account
 * - Provider
 * - AccountIdentifier
 */
async function main() {
  console.log("⚠️  Wiping database (except Account, Provider, AccountIdentifier)...");

  // Disable FK checks (MySQL)
  await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 0`);

  const tablesToTruncate = [
    // ===== Messaging & Posts =====
    "Message",
    "PostRemoval",
    "Post",

    // ===== Reports & Moderation =====
    "Report",
    "AccountSuspension",

    // ===== Reviews & Certificates =====
    "CourseReview",
    "UserCertificate",
    "Certificate",

    // ===== Enrollment & Progress =====
    "LessonProgress",
    "CourseEnroll",

    // ===== Exams =====
    "StudentAnswer",
    "ExamSubmission",
    "ExamAnswer",
    "ExamQuestion",
    "Exam",

    // ===== Question Bank =====
    "QuestionBank",

    // ===== Course Structure =====
    "LessonResource",
    "CourseLesson",
    "ModuleItem",
    "CourseModule",
    "CourseSkill",

    // ===== Courses & Specs =====
    "SpecializationCourse",
    "VerificationRequest",
    "Course",
    "Specialization",
  ];

  for (const table of tablesToTruncate) {
    console.log(`🧹 Truncating ${table}`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${table}\``);
  }

  // Re-enable FK checks
  await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1`);

  console.log("✅ Wipe completed successfully");
}

main()
  .catch((err) => {
    console.error("❌ Wipe failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
