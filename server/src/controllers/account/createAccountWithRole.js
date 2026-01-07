import bcrypt from "bcrypt"
import accountModel from "../../models/account/index.js"
import prisma from "../../prismaClient.js"

export default async function createAccountWithRole(req, res) {
  try {
    const { username, displayName, password, role, email, phone } = req.body

    // Validation
    if (!username || !displayName || !password || !role) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    // Check if username already exists
    if (await accountModel.getByUsername(username)) {
      return res.status(400).json({ message: "Username already taken" })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create account with role
    const account = await prisma.account.create({
      data: {
        Username: username,
        DisplayName: displayName,
        AccountIdentifier: {
          create: {
            Identifier: username,
            Secret: hashedPassword,
            Provider: { connect: { Id: 1 } }, // 1 = username provider
          },
        },
        AccountRole: {
          create: {
            Role: role, // "Mentor", "Moderator", or "Admin"
          },
        },
        ...(role === "Mentor" && {
          Mentor: {
            create: {
              Name: displayName,
              Email: email || null,
              Phone: phone || null,
            },
          },
        }),
        ...(role === "Admin" && {
          Admin: {
            create: {},
          },
        }),
      },
      include: {
        AccountIdentifier: true,
        AccountRole: true,
        Mentor: true,
        Admin: true,
      },
    })

    const roles = account.AccountRole.length > 0 ? account.AccountRole.map((r) => r.Role) : ["Student"]

    res.status(201).json({
      message: "Account created successfully with role",
      account: {
        id: account.Id,
        username: account.Username,
        displayName: account.DisplayName,
        roles,
        email: email || null,
        phone: phone || null,
        createdAt: account.CreatedAt,
      },
    })
  } catch (err) {
    console.error("Create account with role error:", err)
    res.status(500).json({ message: "Server error", error: err.message })
  }
}
