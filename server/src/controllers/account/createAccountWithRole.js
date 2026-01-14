import bcrypt from "bcrypt"
import accountModel from "../../models/account/index.js"
import prisma from "../../prismaClient.js"
import { ensureAuthProviders } from "../../services/providerService.js"

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase()
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function buildSyntheticEmail(username) {
  const base = String(username || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9._+-]/g, "")
  // Syntactically valid email; not used for delivery.
  return `${base}@fsols.local`
}

export default async function createAccountWithRole(req, res) {
  try {
    const { username, displayName, password, role, email, phone } = req.body

    const cleanUsername = String(username || "").trim()
    const cleanDisplayName = String(displayName || "").trim()
    const providedEmail = normalizeEmail(email)

    // Validation (email is NOT required)
    if (!cleanUsername || !cleanDisplayName || !password || !role) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    // Username uniqueness
    if (await accountModel.getByUsername(cleanUsername)) {
      return res.status(400).json({ message: "Username already taken" })
    }

    // Ensure providers exist (no hard-coded provider IDs)
    const { usernameProvider, emailProvider } = await ensureAuthProviders()

    // If caller provides email, validate and check uniqueness
    if (providedEmail) {
      if (!isValidEmail(providedEmail)) {
        return res.status(400).json({ message: "Invalid email format" })
      }
      if (await accountModel.getByIdentifier(providedEmail, emailProvider.Id)) {
        return res.status(400).json({ message: "Email already registered" })
      }
    }

    // Role-created accounts do NOT require email activation.
    // If no email is provided, create a synthetic VERIFIED email identity.
    const emailIdentifier = providedEmail || buildSyntheticEmail(cleanUsername)

    const hashedPassword = await bcrypt.hash(password, 10)

    const account = await prisma.account.create({
      data: {
        Username: cleanUsername,
        DisplayName: cleanDisplayName,
        AccountIdentifier: {
          create: [
            {
              Identifier: cleanUsername,
              Secret: hashedPassword,
              Verified: true,
              ProviderId: usernameProvider.Id,
            },
            {
              Identifier: emailIdentifier,
              Secret: hashedPassword,
              Verified: true,
              ProviderId: emailProvider.Id,
            },
          ],
        },
        AccountRole: {
          create: { Role: role },
        },
        ...(role === "Mentor" && {
          Mentor: {
            create: {
              Name: cleanDisplayName,
              // Do NOT store synthetic email into Mentor profile
              Email: providedEmail || null,
              Phone: phone || null,
            },
          },
        }),
        ...(role === "Admin" && {
          Admin: { create: {} },
        }),
      },
      include: {
        AccountIdentifier: { include: { Provider: true } },
        AccountRole: true,
        Mentor: true,
        Admin: true,
      },
    })

    const roles = account.AccountRole.length ? account.AccountRole.map((r) => r.Role) : ["Student"]

    return res.status(201).json({
      message: "Account created successfully with role",
      account: {
        id: account.Id,
        username: account.Username,
        displayName: account.DisplayName,
        roles,
        // Return only real email provided by admin (avoid confusion)
        email: providedEmail || null,
        phone: phone || null,
        createdAt: account.CreatedAt,
      },
    })
  } catch (err) {
    console.error("Create account with role error:", err)
    return res.status(500).json({ message: "Server error", error: err.message })
  }
}
