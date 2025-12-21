// scripts/seed.js
import prisma from "../src/prismaClient.js"
import bcrypt from "bcrypt"

async function main() {
  console.log("Starting seed...")

  // Create Provider for username login
  const provider = await prisma.provider.upsert({
    where: { Name: "username" },
    update: {},
    create: {
      Name: "username",
      Enabled: true,
    },
  })
  console.log("Provider created:", provider.Name)

  // Create test accounts
  const testAccounts = [
    {
      username: "admin",
      displayName: "Admin User",
      password: "admin123",
      role: "Admin",
    },
    {
      username: "mentor",
      displayName: "Test Mentor",
      password: "mentor123",
      role: "Mentor",
    },
    {
      username: "student",
      displayName: "Test Student",
      password: "student123",
      role: null,
    },
  ]

  for (const acc of testAccounts) {
    const hashedPassword = await bcrypt.hash(acc.password, 10)

    // Get or create account
    let account = await prisma.account.findFirst({
      where: { Username: acc.username },
    })

    if (!account) {
      account = await prisma.account.create({
        data: {
          Username: acc.username,
          DisplayName: acc.displayName,
          AccountIdentifier: {
            create: {
              Identifier: acc.username,
              Secret: hashedPassword,
              Provider: { connect: { Id: provider.Id } },
            },
          },
        },
      })
      console.log(`Created account: ${acc.username} (${acc.role || "Student"})`)
    } else {
      console.log(`Account "${acc.username}" already exists, using existing...`)
    }

    // Add role if specified
    if (acc.role) {
      // AccountRole has AccountId as @id -> only 1 role per account in your schema
      const existingRole = await prisma.accountRole.findFirst({
        where: { AccountId: account.Id },
      })

      if (!existingRole) {
        await prisma.accountRole.create({
          data: {
            AccountId: account.Id,
            Role: acc.role,
          },
        })
      }

      // Create Mentor/Admin record if missing
      if (acc.role === "Mentor") {
        const existingMentor = await prisma.mentor.findFirst({
          where: { AccountId: account.Id },
        })
        if (!existingMentor) {
          await prisma.mentor.create({
            data: {
              AccountId: account.Id,
              Name: acc.displayName,
            },
          })
        }
      } else if (acc.role === "Admin") {
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
  }

  // Categories
  const categories = [
    {
      Name: "Programming",
      Slug: "programming",
      Description: "Learn programming languages and development",
    },
    {
      Name: "Web Development",
      Slug: "web-development",
      Description: "Build websites and web applications",
    },
    {
      Name: "Data Science",
      Slug: "data-science",
      Description: "Analyze data and machine learning",
    },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { Slug: cat.Slug },
      update: {},
      create: cat,
    })
    console.log("Category created:", cat.Name)
  }

  // Get mentor account + mentor record (Mentor PK = AccountId)
  const mentorAccount = await prisma.account.findFirst({
    where: { Username: "mentor" },
  })

  const mentor = mentorAccount
    ? await prisma.mentor.findFirst({
        where: { AccountId: mentorAccount.Id },
      })
    : null

  const programmingCategory = await prisma.category.findFirst({
    where: { Slug: "programming" },
  })

  const webDevCategory = await prisma.category.findFirst({
    where: { Slug: "web-development" },
  })

  console.log("Mentor account:", mentorAccount?.Id)
  console.log("Mentor record AccountId:", mentor?.AccountId)
  console.log("Programming category:", programmingCategory?.Id)

  // Create courses
  if (mentorAccount && mentor && programmingCategory) {
    const courses = [
      {
        Name: "Introduction to JavaScript",
        Description:
          "Learn the basics of JavaScript programming. This course covers variables, functions, objects, arrays, and more.",
        CategoryId: programmingCategory.Id,
      },
      {
        Name: "Python for Beginners",
        Description:
          "Start your programming journey with Python. Learn syntax, data structures, and basic algorithms.",
        CategoryId: programmingCategory.Id,
      },
      {
        Name: "React Fundamentals",
        Description:
          "Build modern web applications with React. Learn components, hooks, state management, and best practices.",
        CategoryId: webDevCategory?.Id ?? programmingCategory.Id,
      },
      {
        Name: "Node.js Backend Development",
        Description:
          "Create powerful backend applications with Node.js. Learn Express, APIs, databases, and authentication.",
        CategoryId: webDevCategory?.Id ?? programmingCategory.Id,
      },
    ]

    for (const courseData of courses) {
      const existingCourse = await prisma.course.findFirst({
        where: { Name: courseData.Name },
      })

      if (!existingCourse) {
        const course = await prisma.course.create({
          data: {
            Name: courseData.Name,
            Description: courseData.Description,

            // ✅ IMPORTANT: Use relation connect (Prisma CreateInput doesn't accept CreatedById/CategoryId)
            // CreatedBy references Mentor by Mentor.AccountId
            CreatedBy: { connect: { AccountId: mentorAccount.Id } },

            Category: { connect: { Id: courseData.CategoryId } },

            PublishedAt: new Date(),
          },
        })

        console.log("Course created:", course.Name, "with ID:", course.Id)
      } else {
        console.log("Course already exists:", courseData.Name)
      }
    }
  } else {
    console.log("ERROR: Could not find mentor account/mentor record/category!")
  }

  const allCourses = await prisma.course.findMany({
    where: { PublishedAt: { not: null }, DeletedAt: null },
  })
  console.log("\nTotal published courses in database:", allCourses.length)

  console.log("\nSeed completed!")
  console.log("\n=== TEST ACCOUNTS ===")
  console.log("Admin:   username: admin   | password: admin123")
  console.log("Mentor:  username: mentor  | password: mentor123")
  console.log("Student: username: student | password: student123")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
