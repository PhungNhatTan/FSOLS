import prisma from "../../prismaClient.js"

export default async function getAllAccounts(role = null) {
  try {
    if (role && role !== "Student") {
      // Get accounts with specific role from AccountRole table
      const accounts = await prisma.account.findMany({
        where: {
          AccountRole: {
            some: {
              Role: role,
            },
          },
          DeletedAt: null,
        },
        select: {
          Id: true,
          Username: true,
          DisplayName: true,
          AvatarUrl: true,
          Bio: true,
          CreatedAt: true,
          AccountRole: {
            select: {
              Role: true,
            },
          },
          Mentor: {
            select: {
              Email: true,
              Phone: true,
            },
          },
          Admin: true,
        },
        orderBy: {
          CreatedAt: "desc",
        },
      })
      return accounts
    } else if (role === "Student") {
      // Get accounts WITHOUT any role (students have no AccountRole entry)
      const accounts = await prisma.account.findMany({
        where: {
          AccountRole: {
            none: {},
          },
          DeletedAt: null,
        },
        select: {
          Id: true,
          Username: true,
          DisplayName: true,
          AvatarUrl: true,
          Bio: true,
          CreatedAt: true,
          AccountRole: {
            select: {
              Role: true,
            },
          },
        },
        orderBy: {
          CreatedAt: "desc",
        },
      })
      return accounts
    } else {
      // Get all accounts
      const accounts = await prisma.account.findMany({
        where: {
          DeletedAt: null,
        },
        select: {
          Id: true,
          Username: true,
          DisplayName: true,
          AvatarUrl: true,
          Bio: true,
          CreatedAt: true,
          AccountRole: {
            select: {
              Role: true,
            },
          },
          Mentor: {
            select: {
              Email: true,
              Phone: true,
            },
          },
        },
        orderBy: {
          CreatedAt: "desc",
        },
      })
      return accounts
    }
  } catch (error) {
    console.error("Error getting accounts:", error)
    throw error
  }
}
