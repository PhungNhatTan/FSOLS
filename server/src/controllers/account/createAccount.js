import bcrypt from "bcrypt";
import prisma from "../../prismaClient.js";
import accountModel from "../../models/account/index.js";
import { ensureAuthProviders } from "../../services/providerService.js";
import { createEmailVerificationOtp } from "../../services/otpService.js";
import { sendEmailOtp } from "../../services/emailService.js";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default async function register(req, res) {
  try {
    const { username, password, email } = req.body;
    const cleanUsername = String(username || "").trim();
    const cleanEmail = normalizeEmail(email);

    if (!cleanUsername || !password || !cleanEmail) {
      return res.status(400).json({ message: "Missing username, email, or password" });
    }
    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const { usernameProvider, emailProvider } = await ensureAuthProviders();

    if (await accountModel.getByUsername(cleanUsername)) {
      return res.status(400).json({ message: "Username already taken" });
    }
    if (await accountModel.getByIdentifier(cleanEmail, emailProvider.Id)) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const account = await prisma.account.create({
      data: {
        Username: cleanUsername,
        DisplayName: cleanUsername,
        AccountIdentifier: {
          create: [
            {
              Identifier: cleanUsername,
              Secret: hashedPassword,
              Verified: true,
              ProviderId: usernameProvider.Id,
            },
            {
              Identifier: cleanEmail,
              Secret: hashedPassword,
              Verified: false,
              ProviderId: emailProvider.Id,
            },
          ],
        },
      },
      include: { AccountIdentifier: { include: { Provider: true } } },
    });

    const emailIdentity = account.AccountIdentifier.find((ai) => ai.Provider?.Name === "email");
    const { code, expiresAt } = await createEmailVerificationOtp({ accountIdentifierId: emailIdentity.Id });

    await sendEmailOtp({ to: cleanEmail, code, purpose: "Email verification" });
    console.log("[OTP] sending to:", cleanEmail, "code:", code);
    await sendEmailOtp({ to: cleanEmail, code, purpose: "Email verification" });
    console.log("[OTP] sendEmailOtp done");

    return res.status(201).json({
      message: "Account created. Check email for OTP to activate.",
      email: cleanEmail,
      expiresAt,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}
