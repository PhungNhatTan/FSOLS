// scripts/seed.js
// Dev seed script (idempotent)
import prisma from "../src/prismaClient.js"
import bcrypt from "bcrypt"

/**
 * =========================
 * CONFIG
 * =========================
 */
const TARGET_COURSE_NAME = "Node.js Backend Development"

// ✅ Module OrderNo
const MODULES = [
  {
    orderNo: 1,
    title: "Module 1: Fundamentals",
    lessons: [
      { orderNo: 1, title: "Lesson 1: Overview & Setup", type: "Video" },
      { orderNo: 2, title: "Lesson 2: Core Concepts", type: "Video" },
      { orderNo: 3, title: "Lesson 3: Basics Recap", type: "Video" },
    ],
  },
  {
    orderNo: 2,
    title: "Module 2: Building Features",
    lessons: [
      { orderNo: 1, title: "Lesson 1: Routing & Controllers", type: "Video" },
      { orderNo: 2, title: "Lesson 2: Database Integration", type: "Video" },
      { orderNo: 3, title: "Lesson 3: Auth & Security Basics", type: "Video" },
      { orderNo: 4, title: "Lesson 4: Validation & Errors", type: "Video" },
      { orderNo: 5, title: "Lesson 5: Deployment Intro", type: "Video" },
    ],
  },
]

const DEFAULT_QUIZ_MINUTES = 10
const DEFAULT_FINAL_MINUTES = 30

// Nếu bạn muốn đổi Module 10/20 -> 1/2 trong DB thì bật true (không khuyến nghị nếu bạn đang rely 10/20)
const NORMALIZE_MODULE_ORDER_TO_1_2 = true

/**
 * =========================
 * SMALL HELPERS
 * =========================
 */
const log = (...args) => console.log(...args)

async function ensureAuthProviders() {
  const usernameProvider = await prisma.provider.upsert({
    where: { Name: "username" },
    update: {},
    create: { Name: "username", Enabled: true },
  })

  const emailProvider = await prisma.provider.upsert({
    where: { Name: "email" },
    update: {},
    create: { Name: "email", Enabled: true },
  })

  return { usernameProvider, emailProvider }
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase()
}

function buildSyntheticEmail(username) {
  const base = String(username || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9._+-]/g, "")
  return `${base}@fsols.local`
}

async function ensureAccount({ username, displayName, password, role, email, providers }) {
  const { usernameProvider, emailProvider } = providers
  const hashedPassword = await bcrypt.hash(password, 10)
  const cleanUsername = String(username || "").trim()
  const cleanDisplayName = String(displayName || cleanUsername).trim()
  const cleanEmail = normalizeEmail(email) || buildSyntheticEmail(cleanUsername)

  let account = await prisma.account.findUnique({ where: { Username: cleanUsername } })

  if (!account) {
    account = await prisma.account.create({
      data: {
        Username: cleanUsername,
        DisplayName: cleanDisplayName,
      },
    })
    log(`Created account: ${cleanUsername} (${role || "Student"})`)
  } else {
    // keep display name in sync for dev
    if (account.DisplayName !== cleanDisplayName) {
      account = await prisma.account.update({
        where: { Id: account.Id },
        data: { DisplayName: cleanDisplayName },
      })
    }
    log(`Account "${cleanUsername}" already exists, using existing...`)
  }

  // Ensure username identity (Verified so login works immediately in dev)
  const usernameIdentity = await prisma.accountIdentifier.findUnique({
    where: {
      ProviderId_Identifier: {
        ProviderId: usernameProvider.Id,
        Identifier: cleanUsername,
      },
    },
  })
  if (!usernameIdentity) {
    await prisma.accountIdentifier.create({
      data: {
        AccountId: account.Id,
        ProviderId: usernameProvider.Id,
        Identifier: cleanUsername,
        Secret: hashedPassword,
        Verified: true,
      },
    })
  } else if (usernameIdentity.AccountId === account.Id) {
    await prisma.accountIdentifier.update({
      where: { Id: usernameIdentity.Id },
      data: { Secret: hashedPassword, Verified: true },
    })
  } else {
    log(`[WARN] Username identity "${cleanUsername}" is linked to another account. Skipping.`)
  }

  // Ensure email identity (Verified so login works immediately in dev)
  const emailIdentity = await prisma.accountIdentifier.findUnique({
    where: {
      ProviderId_Identifier: {
        ProviderId: emailProvider.Id,
        Identifier: cleanEmail,
      },
    },
  })
  if (!emailIdentity) {
    await prisma.accountIdentifier.create({
      data: {
        AccountId: account.Id,
        ProviderId: emailProvider.Id,
        Identifier: cleanEmail,
        Secret: hashedPassword,
        Verified: true,
      },
    })
  } else if (emailIdentity.AccountId === account.Id) {
    await prisma.accountIdentifier.update({
      where: { Id: emailIdentity.Id },
      data: { Secret: hashedPassword, Verified: true },
    })
  } else {
    log(`[WARN] Email identity "${cleanEmail}" is linked to another account. Skipping.`)
  }

  if (role) {
    // AccountRole has AccountId as PK => 1 role per account
    await prisma.accountRole.upsert({
      where: { AccountId: account.Id },
      update: { Role: role },
      create: { AccountId: account.Id, Role: role },
    })

    if (role === "Mentor") {
      await prisma.mentor.upsert({
        where: { AccountId: account.Id },
        update: { Name: cleanDisplayName, Email: email ? cleanEmail : null },
        create: { AccountId: account.Id, Name: cleanDisplayName, Email: email ? cleanEmail : null },
      })
    }

    if (role === "Admin") {
      await prisma.admin.upsert({
        where: { AccountId: account.Id },
        update: {},
        create: { AccountId: account.Id },
      })
    }
  }

  return account
}

async function upsertCategory({ Name, Slug, Description }) {
  return prisma.category.upsert({
    where: { Slug },
    update: { Name, Description },
    create: { Name, Slug, Description },
  })
}

async function ensureCourse({ Name, Description, CategoryId, mentorAccountId }) {
  const existing = await prisma.course.findFirst({
    where: { Name, DeletedAt: null },
  })

  if (existing) {
    const updated = await prisma.course.update({
      where: { Id: existing.Id },
      data: {
        Description,
        LastUpdated: new Date(),
        PublishedAt: existing.PublishedAt ?? new Date(),
        ...(mentorAccountId ? { CreatedBy: { connect: { AccountId: mentorAccountId } } } : {}),
        ...(CategoryId ? { Category: { connect: { Id: CategoryId } } } : {}),
      },
    })
    log("Course already exists (synced):", Name)
    return updated
  }

  const created = await prisma.course.create({
    data: {
      Name,
      Description,
      CreatedBy: { connect: { AccountId: mentorAccountId } },
      Category: { connect: { Id: CategoryId } },
      PublishedAt: new Date(),
    },
  })

  log("Course created:", created.Name, "with ID:", created.Id)
  return created
}

/**
 * =========================
 * DEMO ENROLLMENT + CERTIFICATE (idempotent)
 * =========================
 * This helps you test:
 * - Profile certificate list
 * - Completed course state in UI
 */
async function seedCompletedCourseForStudent({ studentAccountId, courseName }) {
  const course = await prisma.course.findFirst({
    where: { Name: courseName, DeletedAt: null },
  })

  if (!course) {
    log(`[Demo] Course not found: ${courseName}`)
    return
  }

  // Ensure certificate template exists
  const cert = await ensureCertificate(course.Id)

  // Ensure enrollment exists
  let enroll = await prisma.courseEnroll.findFirst({
    where: { AccountId: studentAccountId, CourseId: course.Id, DeletedAt: null },
    orderBy: { CreatedAt: "desc" },
  })

  if (!enroll) {
    const enrolledAt = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const completedAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    enroll = await prisma.courseEnroll.create({
      data: {
        AccountId: studentAccountId,
        CourseId: course.Id,
        Status: "Completed",
        EnrolledAt: enrolledAt,
        CompletedAt: completedAt,
      },
    })
  } else if (enroll.Status !== "Completed") {
    enroll = await prisma.courseEnroll.update({
      where: { Id: enroll.Id },
      data: { Status: "Completed", CompletedAt: new Date() },
    })
  }

  // Mark all lessons completed for this enrollment
  const lessons = await prisma.courseLesson.findMany({
    where: {
      DeletedAt: null,
      ModuleItem: { is: { CourseModule: { is: { CourseId: course.Id } } } },
    },
    select: { Id: true },
  })

  if (lessons.length) {
    await prisma.lessonProgress.createMany({
      data: lessons.map((l) => ({
        AccountId: studentAccountId,
        CourseEnrollId: enroll.Id,
        LessonId: l.Id,
        IsCompleted: true,
        CompletedAt: new Date(),
      })),
      skipDuplicates: true,
    })
  }

  // Ensure user certificate exists
  const existingUserCert = await prisma.userCertificate.findFirst({
    where: { AccountId: studentAccountId, CertificateId: cert.Id },
  })
  if (!existingUserCert) {
    await prisma.userCertificate.create({
      data: { AccountId: studentAccountId, CertificateId: cert.Id },
    })
  }

  log(`[Demo] Student completed "${courseName}" and received a certificate.`)
}

/**
 * =========================
 * TIMELINE HELPERS (idempotent)
 * =========================
 */
async function getOrCreateCourseModule(courseId, orderNo, title) {
  const existing = await prisma.courseModule.findFirst({
    where: { CourseId: courseId, OrderNo: orderNo, DeletedAt: null },
  })
  if (existing) {
    // optional: keep title synced
    if (existing.Title !== title) {
      await prisma.courseModule.update({
        where: { Id: existing.Id },
        data: { Title: title },
      })
    }
    return existing
  }

  return prisma.courseModule.create({
    data: {
      Title: title,
      OrderNo: orderNo,
      Course: { connect: { Id: courseId } },
    },
  })
}

async function getOrCreateModuleItem(courseModuleId, orderNo) {
  const existing = await prisma.moduleItem.findFirst({
    where: { CourseModuleId: courseModuleId, OrderNo: orderNo },
  })
  if (existing) return existing

  return prisma.moduleItem.create({
    data: {
      OrderNo: orderNo,
      CourseModule: { connect: { Id: courseModuleId } },
    },
  })
}

async function getOrCreateLesson(moduleItemId, title, mentorAccountId, lessonType = "Video") {
  const existing = await prisma.courseLesson.findFirst({
    where: { ModuleItemId: moduleItemId, Title: title, DeletedAt: null },
  })
  if (existing) return existing

  return prisma.courseLesson.create({
    data: {
      Title: title,
      LessonType: lessonType,
      VideoUrl: lessonType === "Video" ? "https://example.com/video" : null,
      DocUrl: lessonType === "Document" ? "https://example.com/doc" : null,
      ModuleItem: { connect: { Id: moduleItemId } },
      CreatedBy: { connect: { AccountId: mentorAccountId } },
    },
  })
}

async function ensureCertificate(courseId) {
  const existing = await prisma.certificate.findFirst({
    where: { CourseId: courseId, DeletedAt: null },
  })
  if (existing) return existing

  const cert = await prisma.certificate.create({
    data: {
      CertificateType: "Course",
      Course: { connect: { Id: courseId } },
    },
  })
  log(`[Certificate] created for CourseId=${courseId}`)
  return cert
}

/**
 * =========================
 * QUIZ / FINAL EXAM on module (put at END)
 * =========================
 */
async function addQuizToModule({
  courseName,
  moduleOrderNo, // 10 / 20
  mentorAccountId,
  quizTitle = null,
  description = "Quick quiz for this module.",
  durationCustom = DEFAULT_QUIZ_MINUTES,
}) {
  const course = await prisma.course.findFirst({
    where: { Name: courseName, DeletedAt: null },
  })
  if (!course) {
    log(`[Quiz] Course not found: ${courseName}`)
    return
  }

  const module = await prisma.courseModule.findFirst({
    where: { CourseId: course.Id, OrderNo: moduleOrderNo, DeletedAt: null },
  })
  if (!module) {
    log(`[Quiz] Module not found: Course=${courseName}, OrderNo=${moduleOrderNo}`)
    return
  }

  const title = quizTitle ?? `Module ${moduleOrderNo} Quiz`

  // avoid duplicates: same title in same module
  const existed = await prisma.exam.findFirst({
    where: {
      Title: title,
      DeletedAt: null,
      ModuleItem: { is: { CourseModuleId: module.Id } },
    },
  })
  if (existed) {
    log(`[Quiz] Already exists -> skip: ${title}`)
    return
  }

  // put at end: max ModuleItem.OrderNo + 10
  const maxOrder = await prisma.moduleItem.aggregate({
    where: { CourseModuleId: module.Id },
    _max: { OrderNo: true },
  })
  const lastOrderNo = (maxOrder._max.OrderNo ?? 0) + 10

  const moduleItem = await prisma.moduleItem.create({
    data: {
      OrderNo: lastOrderNo,
      CourseModule: { connect: { Id: module.Id } },
    },
  })

  await prisma.exam.create({
    data: {
      Title: title,
      Description: description,
      ModuleItem: { connect: { Id: moduleItem.Id } },
      CreatedBy: { connect: { AccountId: mentorAccountId } },
      DurationCustom: durationCustom,
    },
  })

  log(`[Quiz] Created "${title}" in Module ${moduleOrderNo} (ModuleItem.OrderNo=${lastOrderNo})`)
}

async function addFinalExamToModule({
  courseName,
  moduleOrderNo, // usually module cuối: 20
  mentorAccountId,
  title = "Final Exam",
  description = "Complete all lessons and module quizzes, then take the final exam to receive your certificate.",
  durationCustom = DEFAULT_FINAL_MINUTES,
}) {
  const course = await prisma.course.findFirst({
    where: { Name: courseName, DeletedAt: null },
  })
  if (!course) {
    log(`[Final] Course not found: ${courseName}`)
    return
  }

  const module = await prisma.courseModule.findFirst({
    where: { CourseId: course.Id, OrderNo: moduleOrderNo, DeletedAt: null },
  })
  if (!module) {
    log(`[Final] Module not found: Course=${courseName}, OrderNo=${moduleOrderNo}`)
    return
  }

  const existed = await prisma.exam.findFirst({
    where: {
      Title: title,
      DeletedAt: null,
      ModuleItem: { is: { CourseModuleId: module.Id } },
    },
  })
  if (existed) {
    log(`[Final] Already exists -> skip: ${title}`)
    return
  }

  const maxOrder = await prisma.moduleItem.aggregate({
    where: { CourseModuleId: module.Id },
    _max: { OrderNo: true },
  })
  const lastOrderNo = (maxOrder._max.OrderNo ?? 0) + 10

  const moduleItem = await prisma.moduleItem.create({
    data: {
      OrderNo: lastOrderNo,
      CourseModule: { connect: { Id: module.Id } },
    },
  })

  await prisma.exam.create({
    data: {
      Title: title,
      Description: description,
      ModuleItem: { connect: { Id: moduleItem.Id } },
      CreatedBy: { connect: { AccountId: mentorAccountId } },
      DurationCustom: durationCustom,
    },
  })

  log(`[Final] Created "${title}" in Module ${moduleOrderNo} (ModuleItem.OrderNo=${lastOrderNo})`)
}

/**
 * (optional) normalize OrderNo modules to 1..n
 */
async function normalizeCourseModulesOrderTo1_2(courseName) {
  const course = await prisma.course.findFirst({
    where: { Name: courseName, DeletedAt: null },
  })
  if (!course) {
    log(`[Normalize] Course not found: ${courseName}`)
    return
  }

  const modules = await prisma.courseModule.findMany({
    where: { CourseId: course.Id, DeletedAt: null },
    orderBy: { OrderNo: "asc" },
  })
  if (modules.length === 0) return

  // temp
  for (let i = 0; i < modules.length; i++) {
    await prisma.courseModule.update({
      where: { Id: modules[i].Id },
      data: { OrderNo: 1000 + i },
    })
  }
  // 1..n
  for (let i = 0; i < modules.length; i++) {
    await prisma.courseModule.update({
      where: { Id: modules[i].Id },
      data: { OrderNo: i + 1 },
    })
  }

  log(`[Normalize] ${courseName}: modules now 1..${modules.length}`)
}

/**
 * =========================
 * MAIN timeline seed
 * =========================
 */
async function ensureCourseTimeline(courseName, mentorAccountId) {
  const course = await prisma.course.findFirst({
    where: { Name: courseName, DeletedAt: null },
  })
  if (!course) {
    log(`[Timeline] Course not found: ${courseName}`)
    return
  }

  log(`\n[Timeline] Ensure timeline for: ${courseName} (CourseId=${course.Id})`)

  // ensure modules + lessons
  for (const m of MODULES) {
    const mod = await getOrCreateCourseModule(course.Id, m.orderNo, m.title)

    for (const l of m.lessons) {
      const item = await getOrCreateModuleItem(mod.Id, l.orderNo)
      await getOrCreateLesson(item.Id, l.title, mentorAccountId, l.type)
    }
  }

  // ensure certificate
  await ensureCertificate(course.Id)

  // ensure quizzes (đặt ở cuối module)
  await addQuizToModule({
    courseName,
    moduleOrderNo: 10,
    mentorAccountId,
    durationCustom: DEFAULT_QUIZ_MINUTES,
  })

  await addQuizToModule({
    courseName,
    moduleOrderNo: 20,
    mentorAccountId,
    durationCustom: DEFAULT_QUIZ_MINUTES,
  })

  // ensure final exam (đặt ở cuối module 20)
  await addFinalExamToModule({
    courseName,
    moduleOrderNo: 20,
    mentorAccountId,
    durationCustom: DEFAULT_FINAL_MINUTES,
  })

  if (NORMALIZE_MODULE_ORDER_TO_1_2) {
    await normalizeCourseModulesOrderTo1_2(courseName)
  }

  log(`[Timeline] Done.`)
}

/**
 * =========================
 * SEED QUESTIONS FOR EXAMS
 * =========================
 */
async function seedQuestionsForExams() {
  log("\n[Questions] Seeding questions for exams...\n")

  const course = await prisma.course.findFirst({
    where: { Name: TARGET_COURSE_NAME, DeletedAt: null },
  })

  if (!course) {
    log("[Questions] Target course not found")
    return
  }

  // Get all exams for this course
  const exams = await prisma.exam.findMany({
    where: {
      DeletedAt: null,
      ModuleItem: {
        is: {
          CourseModule: { is: { CourseId: course.Id } },
        },
      },
    },
    include: {
      ExamQuestion: true,
    },
  })

  if (exams.length === 0) {
    log("[Questions] No exams found for course")
    return
  }

  // Sample questions bank to distribute
  const sampleQuestions = [
    {
      QuestionText: "What is Node.js?",
      Type: "MCQ",
      answers: [
        { text: "A JavaScript runtime for server-side development", isCorrect: true },
        { text: "A database management system", isCorrect: false },
        { text: "A frontend framework", isCorrect: false },
        { text: "A CSS preprocessor", isCorrect: false },
      ],
    },
    {
      QuestionText: "Express.js is a backend framework for Node.js.",
      Type: "TF",
      answers: [
        { text: "True", isCorrect: true },
        { text: "False", isCorrect: false },
      ],
    },
    {
      QuestionText: "What HTTP status code means 'Not Found'?",
      Type: "MCQ",
      answers: [
        { text: "200", isCorrect: false },
        { text: "404", isCorrect: true },
        { text: "500", isCorrect: false },
        { text: "301", isCorrect: false },
      ],
    },
    {
      QuestionText: "npm stands for ___________",
      Type: "Fill",
      answers: [
        { text: "Node Package Manager", isCorrect: true },
        { text: "Node Process Manager", isCorrect: false },
      ],
    },
    {
      QuestionText: "Explain the purpose of middleware in Express.js.",
      Type: "Essay",
      answers: [{ text: "Middleware functions process requests and responses", isCorrect: true }],
    },
  ]

  // Add questions to each exam
  for (const e of exams) {
    // Skip if exam already has questions
    if (e.ExamQuestion.length > 0) {
      log(`[Questions] Exam "${e.Title}" already has questions, skipping...`)
      continue
    }

    // Determine how many questions based on exam type
    const numQuestions = e.Title.includes("Quiz") ? 3 : 5
    const quesToAdd = sampleQuestions.slice(0, numQuestions)

    for (let idx = 0; idx < quesToAdd.length; idx++) {
      const q = quesToAdd[idx]

      // Create question bank entry
      const questionBank = await prisma.questionBank.create({
        data: {
          QuestionText: q.QuestionText,
          Type: q.Type,
          courseId: course.Id,
        },
      })

      // Create exam answers
      for (const ans of q.answers) {
        await prisma.examAnswer.create({
          data: {
            AnswerText: ans.text,
            IsCorrect: ans.isCorrect,
            QuestionId: questionBank.Id,
          },
        })
      }

      // Create exam question link
      await prisma.examQuestion.create({
        data: {
          ExamId: e.Id,
          QuestionId: questionBank.Id,
        },
      })

      log(`  [Q${idx + 1}] Added: "${q.QuestionText.substring(0, 50)}..."`)
    }

    log(`[Questions] Exam "${e.Title}": ${quesToAdd.length} questions added\n`)
  }
}

/**
 * =========================
 * MAIN
 * =========================
 */
async function main() {
  log("Starting seed...")

  const providers = await ensureAuthProviders()
  log("Providers ensured:", providers.usernameProvider.Name, "/", providers.emailProvider.Name)

  // Accounts
  await ensureAccount({
    username: "admin",
    displayName: "Admin User",
    password: "admin123",
    role: "Admin",
    email: "admin@fsols.local",
    providers,
  })

  const mentorAccount = await ensureAccount({
    username: "mentor",
    displayName: "Test Mentor",
    password: "mentor123",
    role: "Mentor",
    email: "mentor@fsols.local",
    providers,
  })

  await ensureAccount({
    username: "moderator",
    displayName: "Test Moderator",
    password: "moderator123",
    role: "Moderator",
    email: "moderator@fsols.local",
    providers,
  })

  const studentAccount = await ensureAccount({
    username: "student",
    displayName: "Test Student",
    password: "student123",
    role: null,
    email: "student@fsols.local",
    providers,
  })

  // Categories
  const programmingCategory = await upsertCategory({
    Name: "Programming",
    Slug: "programming",
    Description: "Learn programming languages and development",
  })

  const webDevCategory = await upsertCategory({
    Name: "Web Development",
    Slug: "web-development",
    Description: "Build websites and web applications",
  })

  await upsertCategory({
    Name: "Data Science",
    Slug: "data-science",
    Description: "Analyze data and machine learning",
  })

  // Create courses
  const courses = [
    {
      Name: "Introduction to JavaScript",
      Description:
        "Learn the basics of JavaScript programming. This course covers variables, functions, objects, arrays, and more.",
      CategoryId: programmingCategory.Id,
    },
    {
      Name: "Python for Beginners",
      Description: "Start your programming journey with Python. Learn syntax, data structures, and basic algorithms.",
      CategoryId: programmingCategory.Id,
    },
    {
      Name: "React Fundamentals",
      Description:
        "Build modern web applications with React. Learn components, hooks, state management, and best practices.",
      CategoryId: webDevCategory.Id,
    },
    {
      Name: "Node.js Backend Development",
      Description:
        "Create powerful backend applications with Node.js. Learn Express, APIs, databases, and authentication.",
      CategoryId: webDevCategory.Id,
    },
  ]

  for (const c of courses) {
    await ensureCourse({
      Name: c.Name,
      Description: c.Description,
      CategoryId: c.CategoryId,
      mentorAccountId: mentorAccount.Id,
    })
  }

  // Ensure timeline + quizzes + final exam for the target course
  await ensureCourseTimeline(TARGET_COURSE_NAME, mentorAccount.Id)

  // Ensure questions for exams
  await seedQuestionsForExams()

  // Demo: mark student as completed the target course + issue certificate
  await seedCompletedCourseForStudent({
    studentAccountId: studentAccount.Id,
    courseName: TARGET_COURSE_NAME,
  })

  const allCourses = await prisma.course.findMany({
    where: { PublishedAt: { not: null }, DeletedAt: null },
  })
  log("\nTotal published courses in database:", allCourses.length)

  log("\nSeed completed!")
  log("\n=== TEST ACCOUNTS ===")
  log("Admin:   username: admin   | password: admin123")
  log("Mentor:  username: mentor  | password: mentor123")
  log("Mod:     username: moderator | password: moderator123")
  log("Student: username: student | password: student123")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
