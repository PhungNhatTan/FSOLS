// scripts/seed.js
// Dev seed script (idempotent) - NO ACCOUNT SEEDING, NO CATEGORY SEEDING
import prisma from "../src/prismaClient.js"

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
const NORMALIZE_MODULE_ORDER_TO_1_2 = true

// These accounts MUST already exist in your DB (this script does not create accounts)
const SEED_MENTOR_USERNAME = "mentor"
const SEED_STUDENT_USERNAME = "student"

// Courses to seed (categories MUST already exist in DB; we only connect by slug)
// NOTE: Node.js course removed as requested
const COURSES = [
  {
    Name: "Introduction to JavaScript",
    Description:
      "Learn the basics of JavaScript programming. This course covers variables, functions, objects, arrays, and more.",
    CategorySlug: "development",
  },
  {
    Name: "Python for Beginners",
    Description: "Start your programming journey with Python. Learn syntax, data structures, and basic algorithms.",
    CategorySlug: "development",
  },
  {
    Name: "React Fundamentals",
    Description: "Build modern web applications with React. Learn components, hooks, state management, and best practices.",
    CategorySlug: "development",
  },
]

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

async function resolveMentorAccountId() {
  const byUsername = await prisma.account.findUnique({
    where: { Username: SEED_MENTOR_USERNAME },
    select: { Id: true },
  })
  if (byUsername?.Id) return byUsername.Id

  const byRole = await prisma.accountRole.findFirst({
    where: { Role: "Mentor" },
    select: { AccountId: true },
  })
  if (byRole?.AccountId) return byRole.AccountId

  throw new Error(
    `[Seed] Mentor account not found. Create a mentor account first (e.g., Username="${SEED_MENTOR_USERNAME}") then re-run.`
  )
}

async function resolveStudentAccountIdOrNull() {
  const byUsername = await prisma.account.findUnique({
    where: { Username: SEED_STUDENT_USERNAME },
    select: { Id: true },
  })
  return byUsername?.Id ?? null
}

async function resolveCategoryIdBySlug(slug) {
  const cat = await prisma.category.findUnique({
    where: { Slug: slug },
    select: { Id: true },
  })
  if (!cat?.Id) {
    throw new Error(
      `[Seed] Category slug "${slug}" not found. Create the category first (or change CategorySlug in seed config).`
    )
  }
  return cat.Id
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

  if (!mentorAccountId) throw new Error(`[Seed] mentorAccountId is required to create course "${Name}".`)
  if (!CategoryId) throw new Error(`[Seed] CategoryId is required to create course "${Name}".`)

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
 */
async function seedCompletedCourseForStudent({ studentAccountId, courseName }) {
  const course = await prisma.course.findFirst({
    where: { Name: courseName, DeletedAt: null },
  })

  if (!course) {
    log(`[Demo] Course not found: ${courseName}`)
    return
  }

  const cert = await ensureCertificate(course.Id)

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
  const byTitle = await prisma.courseModule.findFirst({
    where: { CourseId: courseId, Title: title, DeletedAt: null },
  })

  if (byTitle) {
    const data = {}
    if (byTitle.OrderNo !== orderNo) data.OrderNo = orderNo
    if (Object.keys(data).length) {
      return prisma.courseModule.update({ where: { Id: byTitle.Id }, data })
    }
    return byTitle
  }

  const byOrder = await prisma.courseModule.findFirst({
    where: { CourseId: courseId, OrderNo: orderNo, DeletedAt: null },
  })

  if (byOrder) {
    if (byOrder.Title !== title) {
      return prisma.courseModule.update({ where: { Id: byOrder.Id }, data: { Title: title } })
    }
    return byOrder
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
 * QUIZ / FINAL EXAM helpers (idempotent)
 * =========================
 */
async function createExamAtEndOfModule({ courseModuleId, mentorAccountId, title, description, durationCustom }) {
  const existed = await prisma.exam.findFirst({
    where: {
      Title: title,
      DeletedAt: null,
      ModuleItem: { is: { CourseModuleId: courseModuleId } },
    },
  })
  if (existed) return existed

  const maxOrder = await prisma.moduleItem.aggregate({
    where: { CourseModuleId: courseModuleId },
    _max: { OrderNo: true },
  })
  const lastOrderNo = (maxOrder._max.OrderNo ?? 0) + 10

  const moduleItem = await prisma.moduleItem.create({
    data: {
      OrderNo: lastOrderNo,
      CourseModule: { connect: { Id: courseModuleId } },
    },
  })

  const created = await prisma.exam.create({
    data: {
      Title: title,
      Description: description,
      ModuleItem: { connect: { Id: moduleItem.Id } },
      CreatedBy: { connect: { AccountId: mentorAccountId } },
      DurationCustom: durationCustom,
    },
  })

  log(`[Exam] Created "${title}" (CourseModuleId=${courseModuleId}, ModuleItem.OrderNo=${lastOrderNo})`)
  return created
}

async function ensureModuleQuiz({
  courseModuleId,
  moduleIndex,
  mentorAccountId,
  description = "Quick quiz for this module.",
  durationCustom = DEFAULT_QUIZ_MINUTES,
}) {
  const existingQuiz = await prisma.exam.findFirst({
    where: {
      DeletedAt: null,
      ModuleItem: { is: { CourseModuleId: courseModuleId } },
      Title: { contains: "Quiz" },
    },
  })
  if (existingQuiz) {
    log(`[Quiz] Already exists -> skip: ${existingQuiz.Title}`)
    return existingQuiz
  }

  const title = `Module ${moduleIndex} Quiz`
  return createExamAtEndOfModule({
    courseModuleId,
    mentorAccountId,
    title,
    description,
    durationCustom,
  })
}

async function ensureFinalExam({
  courseModuleId,
  mentorAccountId,
  title = "Final Exam",
  description = "Complete all lessons and module quizzes, then take the final exam to receive your certificate.",
  durationCustom = DEFAULT_FINAL_MINUTES,
}) {
  const existingFinal = await prisma.exam.findFirst({
    where: {
      DeletedAt: null,
      ModuleItem: { is: { CourseModuleId: courseModuleId } },
      OR: [{ Title: title }, { Title: { contains: "Final" } }],
    },
  })
  if (existingFinal) {
    log(`[Final] Already exists -> skip: ${existingFinal.Title}`)
    return existingFinal
  }

  return createExamAtEndOfModule({
    courseModuleId,
    mentorAccountId,
    title,
    description,
    durationCustom,
  })
}

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

  for (let i = 0; i < modules.length; i++) {
    await prisma.courseModule.update({
      where: { Id: modules[i].Id },
      data: { OrderNo: 1000 + i },
    })
  }

  for (let i = 0; i < modules.length; i++) {
    await prisma.courseModule.update({
      where: { Id: modules[i].Id },
      data: { OrderNo: i + 1 },
    })
  }

  log(`[Normalize] ${courseName}: modules now 1..${modules.length}`)
}

async function ensureCourseTimeline(courseName, mentorAccountId) {
  const course = await prisma.course.findFirst({
    where: { Name: courseName, DeletedAt: null },
  })
  if (!course) {
    log(`[Timeline] Course not found: ${courseName}`)
    return
  }

  log(`\n[Timeline] Ensure timeline for: ${courseName} (CourseId=${course.Id})`)

  const ensuredModules = []
  for (const m of MODULES) {
    const mod = await getOrCreateCourseModule(course.Id, m.orderNo, m.title)
    ensuredModules.push(mod)

    for (const l of m.lessons) {
      const item = await getOrCreateModuleItem(mod.Id, l.orderNo)
      await getOrCreateLesson(item.Id, l.title, mentorAccountId, l.type)
    }
  }

  await ensureCertificate(course.Id)

  for (let i = 0; i < ensuredModules.length; i++) {
    await ensureModuleQuiz({
      courseModuleId: ensuredModules[i].Id,
      moduleIndex: i + 1,
      mentorAccountId,
      durationCustom: DEFAULT_QUIZ_MINUTES,
    })
  }

  if (ensuredModules.length) {
    await ensureFinalExam({
      courseModuleId: ensuredModules[ensuredModules.length - 1].Id,
      mentorAccountId,
      durationCustom: DEFAULT_FINAL_MINUTES,
    })
  }

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

  const exams = await prisma.exam.findMany({
    where: {
      DeletedAt: null,
      ModuleItem: {
        is: {
          CourseModule: { is: { CourseId: course.Id } },
        },
      },
    },
    include: { ExamQuestion: true },
  })

  if (exams.length === 0) {
    log("[Questions] No exams found for course")
    return
  }

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

  for (const e of exams) {
    if (e.ExamQuestion.length > 0) {
      log(`[Questions] Exam "${e.Title}" already has questions, skipping...`)
      continue
    }

    const numQuestions = e.Title.includes("Quiz") ? 3 : 5
    const quesToAdd = sampleQuestions.slice(0, numQuestions)

    for (let idx = 0; idx < quesToAdd.length; idx++) {
      const q = quesToAdd[idx]

      const questionBank = await prisma.questionBank.create({
        data: {
          QuestionText: q.QuestionText,
          Type: q.Type,
          courseId: course.Id,
        },
      })

      for (const ans of q.answers) {
        await prisma.examAnswer.create({
          data: {
            AnswerText: ans.text,
            IsCorrect: ans.isCorrect,
            QuestionId: questionBank.Id,
          },
        })
      }

      await prisma.examQuestion.create({
        data: { ExamId: e.Id, QuestionId: questionBank.Id },
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
  log("Starting seed (no accounts, no categories, no Node.js course create)...")

  // Optional: keep providers in sync (does not create accounts)
  const providers = await ensureAuthProviders()
  log("Providers ensured:", providers.usernameProvider.Name, "/", providers.emailProvider.Name)

  const mentorAccountId = await resolveMentorAccountId()
  const studentAccountId = await resolveStudentAccountIdOrNull()

  // Create / sync ONLY non-Node courses
  for (const c of COURSES) {
    const categoryId = await resolveCategoryIdBySlug(c.CategorySlug)
    await ensureCourse({
      Name: c.Name,
      Description: c.Description,
      CategoryId: categoryId,
      mentorAccountId,
    })
  }

  // Ensure timeline + quizzes + final exam for Node.js course (already exists)
  await ensureCourseTimeline(TARGET_COURSE_NAME, mentorAccountId)

  // Ensure questions for exams (for Node.js course)
  await seedQuestionsForExams()

  // Demo completion + certificate (only if student exists)
  if (studentAccountId) {
    await seedCompletedCourseForStudent({
      studentAccountId,
      courseName: TARGET_COURSE_NAME,
    })
  } else {
    log(`[Demo][WARN] Student account "${SEED_STUDENT_USERNAME}" not found -> skip demo completion/certificate.`)
  }

  const allCourses = await prisma.course.findMany({
    where: { PublishedAt: { not: null }, DeletedAt: null },
  })
  log("\nTotal published courses in database:", allCourses.length)

  log("\nSeed completed!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
