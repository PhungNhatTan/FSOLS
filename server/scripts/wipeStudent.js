import prisma from "../src/prismaClient.js";

/**
 * Dev-only script.
 *
 * Purpose
 * - Delete ALL accounts that have **no special role** (i.e., no rows in AccountRole)
 *   and wipe their related "student" data.
 * - Preserve privileged users (Mentor/Admin) even if the role table is inconsistent.
 *
 * Usage
 *   node scripts/wipeNoRoleAccounts.js
 *   node scripts/wipeNoRoleAccounts.js --dry-run
 */

function assertSafeToRun() {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Refusing to run wipeNoRoleAccounts.js with NODE_ENV=production. This script is intended for local development only."
    );
  }
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

async function collectTargets() {
  // "No role" = no rows in AccountRole.
  // Extra safety: also require Mentor/Admin relations to be null so we don't delete privileged records
  // if AccountRole is out of sync.
  const accounts = await prisma.account.findMany({
    where: {
      AccountRole: { none: {} },
      Mentor: { is: null },
      Admin: { is: null },
    },
    select: {
      Id: true,
      Username: true,
      DisplayName: true,
      CreatedAt: true,
      DeletedAt: true,
    },
    orderBy: { CreatedAt: "desc" },
  });

  const accountIds = accounts.map((a) => a.Id);
  return { accounts, accountIds };
}

async function countsForTargets(accountIds) {
  if (accountIds.length === 0) {
    return {
      messages: 0,
      posts: 0,
      postRemovals: 0,
      reports: 0,
      suspensions: 0,
      reviews: 0,
      userCertificates: 0,
      enrolls: 0,
      lessonProgress: 0,
      submissions: 0,
      answers: 0,
      identifiers: 0,
      otpTokens: 0,
    };
  }

  const [
    messages,
    posts,
    reports,
    suspensions,
    reviews,
    userCertificates,
    enrolls,
    submissions,
    identifiers,
  ] = await Promise.all([
    prisma.message.count({
      where: {
        OR: [
          { SenderId: { in: accountIds } },
          { ReceiverId: { in: accountIds } },
        ],
      },
    }),
    prisma.post.count({ where: { AccountId: { in: accountIds } } }),
    prisma.report.count({ where: { AccountId: { in: accountIds } } }),
    prisma.accountSuspension.count({ where: { AccountId: { in: accountIds } } }),
    prisma.courseReview.count({ where: { AccountId: { in: accountIds } } }),
    prisma.userCertificate.count({ where: { AccountId: { in: accountIds } } }),
    prisma.courseEnroll.count({ where: { AccountId: { in: accountIds } } }),
    prisma.examSubmission.count({ where: { AccountId: { in: accountIds } } }),
    prisma.accountIdentifier.count({ where: { AccountId: { in: accountIds } } }),
  ]);

  // Some historical bugs can produce LessonProgress rows whose CourseEnrollId belongs
  // to a different account. Count by BOTH AccountId and CourseEnrollId to be safe.
  const enrollIds = await prisma.courseEnroll.findMany({
    where: { AccountId: { in: accountIds } },
    select: { Id: true },
  });
  const enrollIdList = enrollIds.map((e) => e.Id);
  const lessonProgress = await prisma.lessonProgress.count({
    where: enrollIdList.length
      ? {
          OR: [
            { AccountId: { in: accountIds } },
            { CourseEnrollId: { in: enrollIdList } },
          ],
        }
      : { AccountId: { in: accountIds } },
  });

  // For StudentAnswer and PostRemoval we need IDs to filter reliably.
  const [submissionIds, postIds, identifierIds] = await Promise.all([
    prisma.examSubmission.findMany({
      where: { AccountId: { in: accountIds } },
      select: { Id: true },
    }),
    prisma.post.findMany({
      where: { AccountId: { in: accountIds } },
      select: { Id: true },
    }),
    prisma.accountIdentifier.findMany({
      where: { AccountId: { in: accountIds } },
      select: { Id: true },
    }),
  ]);

  const submissionIdList = submissionIds.map((s) => s.Id);
  const postIdList = postIds.map((p) => p.Id);
  const identifierIdList = identifierIds.map((i) => i.Id);

  const [answers, postRemovals, otpTokens] = await Promise.all([
    submissionIdList.length
      ? prisma.studentAnswer.count({
          where: { SubmissionId: { in: submissionIdList } },
        })
      : 0,
    postIdList.length
      ? prisma.postRemoval.count({ where: { PostId: { in: postIdList } } })
      : 0,
    identifierIdList.length
      ? prisma.otpToken.count({
          where: { AccountIdentifierId: { in: identifierIdList } },
        })
      : 0,
  ]);

  return {
    messages,
    posts,
    postRemovals,
    reports,
    suspensions,
    reviews,
    userCertificates,
    enrolls,
    lessonProgress,
    submissions,
    answers,
    identifiers,
    otpTokens,
  };
}

async function main() {
  assertSafeToRun();
  const dryRun = hasFlag("--dry-run");

  const { accounts, accountIds } = await collectTargets();

  if (accountIds.length === 0) {
    console.log("✅ No accounts with no role found. Nothing to wipe.");
    return;
  }

  const stats = await countsForTargets(accountIds);

  console.log("⚠️  Target accounts (no special role):");
  for (const a of accounts) {
    console.log(
      ` - ${a.Username} (${a.DisplayName}) [Id=${a.Id}] Created=${a.CreatedAt.toISOString()} DeletedAt=${a.DeletedAt ? a.DeletedAt.toISOString() : "null"}`
    );
  }

  console.log("\nPlanned deletions:");
  for (const [k, v] of Object.entries(stats)) {
    console.log(` - ${k}: ${v}`);
  }

  if (dryRun) {
    console.log("\n🟡 Dry run only. No changes were made.");
    return;
  }

  console.log("\n🧨 Executing wipe...");

  // Prevent FK issues where other users' posts reference posts we are about to delete.
  const postIds = await prisma.post.findMany({
    where: { AccountId: { in: accountIds } },
    select: { Id: true },
  });
  const postIdList = postIds.map((p) => p.Id);
  if (postIdList.length) {
    await prisma.post.updateMany({
      where: { ParentId: { in: postIdList } },
      data: { ParentId: null },
    });
    await prisma.post.updateMany({
      where: { ReplyId: { in: postIdList } },
      data: { ReplyId: null },
    });
  }

  // Avoid any edge-case FK constraints if these accounts were set as reviewers.
  await prisma.verificationRequest.updateMany({
    where: { ReviewedById: { in: accountIds } },
    data: { ReviewedById: null },
  });

  // Delete in dependency order.
  const steps = [];

  // Messages reference Sender/Receiver.
  steps.push([
    "Message",
    () =>
      prisma.message.deleteMany({
        where: {
          OR: [
            { SenderId: { in: accountIds } },
            { ReceiverId: { in: accountIds } },
          ],
        },
      }),
  ]);

  // Reports / suspensions / reviews / certificates.
  steps.push(["Report", () => prisma.report.deleteMany({ where: { AccountId: { in: accountIds } } })]);
  steps.push([
    "AccountSuspension",
    () => prisma.accountSuspension.deleteMany({ where: { AccountId: { in: accountIds } } }),
  ]);
  steps.push([
    "CourseReview",
    () => prisma.courseReview.deleteMany({ where: { AccountId: { in: accountIds } } }),
  ]);
  steps.push([
    "UserCertificate",
    () => prisma.userCertificate.deleteMany({ where: { AccountId: { in: accountIds } } }),
  ]);

  // Enrollment & progress.
  const enrollIds = await prisma.courseEnroll.findMany({
    where: { AccountId: { in: accountIds } },
    select: { Id: true },
  });
  const enrollIdList = enrollIds.map((e) => e.Id);

  steps.push([
    "LessonProgress",
    () =>
      prisma.lessonProgress.deleteMany({
        where: enrollIdList.length
          ? {
              OR: [
                { AccountId: { in: accountIds } },
                { CourseEnrollId: { in: enrollIdList } },
              ],
            }
          : { AccountId: { in: accountIds } },
      }),
  ]);
  steps.push([
    "CourseEnroll",
    () => prisma.courseEnroll.deleteMany({ where: { AccountId: { in: accountIds } } }),
  ]);

  // Exams.
  const submissionIds = await prisma.examSubmission.findMany({
    where: { AccountId: { in: accountIds } },
    select: { Id: true },
  });
  const submissionIdList = submissionIds.map((s) => s.Id);
  if (submissionIdList.length) {
    steps.push([
      "StudentAnswer",
      () => prisma.studentAnswer.deleteMany({ where: { SubmissionId: { in: submissionIdList } } }),
    ]);
  }
  steps.push([
    "ExamSubmission",
    () => prisma.examSubmission.deleteMany({ where: { AccountId: { in: accountIds } } }),
  ]);

  // Forum posts.
  if (postIdList.length) {
    steps.push([
      "PostRemoval",
      () => prisma.postRemoval.deleteMany({ where: { PostId: { in: postIdList } } }),
    ]);
  }
  steps.push(["Post", () => prisma.post.deleteMany({ where: { AccountId: { in: accountIds } } })]);

  // Auth identifiers / OTP.
  const identifierIds = await prisma.accountIdentifier.findMany({
    where: { AccountId: { in: accountIds } },
    select: { Id: true },
  });
  const identifierIdList = identifierIds.map((i) => i.Id);
  if (identifierIdList.length) {
    steps.push([
      "OtpToken",
      () => prisma.otpToken.deleteMany({ where: { AccountIdentifierId: { in: identifierIdList } } }),
    ]);
  }
  steps.push([
    "AccountIdentifier",
    () => prisma.accountIdentifier.deleteMany({ where: { AccountId: { in: accountIds } } }),
  ]);

  // Finally, delete the Accounts.
  steps.push(["Account", () => prisma.account.deleteMany({ where: { Id: { in: accountIds } } })]);

  for (const [label, fn] of steps) {
    console.log(`🧹 Deleting ${label}...`);
    await fn();
  }

  console.log("✅ Wipe completed: removed all accounts with no role and their student-related data.");
}

main()
  .catch((err) => {
    console.error("❌ wipeNoRoleAccounts failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
