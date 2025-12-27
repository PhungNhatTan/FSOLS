// scripts/seed.js
import prisma from "../src/prismaClient.js"
import bcrypt from "bcrypt"

/**
 * =========================
 * CONFIG
 * =========================
 */
const TARGET_COURSE_NAME = "Node.js Backend Development"

// ✅ Module OrderNo hiện đang là 10 / 20 (đúng như UI bạn chụp)
const MODULES = [
  {
    orderNo: 10,
    title: "Module 1: Fundamentals",
    lessons: [
      { orderNo: 10, title: "Lesson 1: Overview & Setup", type: "Video" },
      { orderNo: 20, title: "Lesson 2: Core Concepts", type: "Video" },
      { orderNo: 30, title: "Lesson 3: Basics Recap", type: "Video" },
    ],
  },
  {
    orderNo: 20,
    title: "Module 2: Building Features",
    lessons: [
      { orderNo: 10, title: "Lesson 1: Routing & Controllers", type: "Video" },
      { orderNo: 20, title: "Lesson 2: Database Integration", type: "Video" },
      { orderNo: 30, title: "Lesson 3: Auth & Security Basics", type: "Video" },
      { orderNo: 40, title: "Lesson 4: Validation & Errors", type: "Video" },
      { orderNo: 50, title: "Lesson 5: Deployment Intro", type: "Video" },
    ],
  },
]

const DEFAULT_QUIZ_MINUTES = 10
const DEFAULT_FINAL_MINUTES = 30

// Nếu bạn muốn đổi Module 10/20 -> 1/2 trong DB thì bật true (không khuyến nghị nếu bạn đang rely 10/20)
const NORMALIZE_MODULE_ORDER_TO_1_2 = false

/**
 * =========================
 * SMALL HELPERS
 * =========================
 */
const log = (...args) => console.log(...args)

async function upsertUsernameProvider() {
  return prisma.provider.upsert({
    where: { Name: "username" },
    update: {},
    create: { Name: "username", Enabled: true },
  })
}

async function ensureAccount({ username, displayName, password, role, providerId }) {
  const hashedPassword = await bcrypt.hash(password, 10)

  let account = await prisma.account.findFirst({
    where: { Username: username },
  })

  if (!account) {
    account = await prisma.account.create({
      data: {
        Username: username,
        DisplayName: displayName,
        AccountIdentifier: {
          create: {
            Identifier: username,
            Secret: hashedPassword,
            Provider: { connect: { Id: providerId } },
          },
        },
      },
    })
    log(`Created account: ${username} (${role || "Student"})`)
  } else {
    log(`Account "${username}" already exists, using existing...`)
  }

  if (role) {
    const existingRole = await prisma.accountRole.findFirst({
      where: { AccountId: account.Id },
    })

    if (!existingRole) {
      await prisma.accountRole.create({
        data: { AccountId: account.Id, Role: role },
      })
    }

    if (role === "Mentor") {
      const existingMentor = await prisma.mentor.findFirst({
        where: { AccountId: account.Id },
      })
      if (!existingMentor) {
        await prisma.mentor.create({
          data: { AccountId: account.Id, Name: displayName },
        })
      }
    }

    if (role === "Admin") {
      const existingAdmin = await prisma.admin.findFirst({
        where: { AccountId: account.Id },
      })
      if (!existingAdmin) {
        await prisma.admin.create({
          data: { AccountId: account.Id },
        })
      }
    }
  }

  return account
}

async function upsertCategory({ Name, Slug, Description }) {
  return prisma.category.upsert({
    where: { Slug },
    update: {},
    create: { Name, Slug, Description },
  })
}

async function ensureCourse({ Name, Description, CategoryId, mentorAccountId }) {
  const existing = await prisma.course.findFirst({
    where: { Name, DeletedAt: null },
  })

  if (existing) {
    log("Course already exists:", Name)
    return existing
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
 * MAIN
 * =========================
 */
async function main() {
  log("Starting seed...")

  const provider = await upsertUsernameProvider()
  log("Provider created:", provider.Name)

  // Accounts
  const admin = await ensureAccount({
    username: "admin",
    displayName: "Admin User",
    password: "admin123",
    role: "Admin",
    providerId: provider.Id,
  })

  const mentorAccount = await ensureAccount({
    username: "mentor",
    displayName: "Test Mentor",
    password: "mentor123",
    role: "Mentor",
    providerId: provider.Id,
  })

  await ensureAccount({
    username: "student",
    displayName: "Test Student",
    password: "student123",
    role: null,
    providerId: provider.Id,
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
      Description: "Build modern web applications with React. Learn components, hooks, state management, and best practices.",
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

  const allCourses = await prisma.course.findMany({
    where: { PublishedAt: { not: null }, DeletedAt: null },
  })
  log("\nTotal published courses in database:", allCourses.length)

  log("\nSeed completed!")
  log("\n=== TEST ACCOUNTS ===")
  log("Admin:   username: admin   | password: admin123")
  log("Mentor:  username: mentor  | password: mentor123")
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
