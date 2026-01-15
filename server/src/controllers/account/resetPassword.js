import bcrypt from "bcrypt";
import prisma from "../../prismaClient.js";
import { ensureAuthProviders } from "../../services/providerService.js";
import { getOtpLimits } from "../../services/otpService.js";
import { OtpPurpose } from "../../generated/prisma/index.js";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isStrongEnoughPassword(password) {
  return typeof password === "string" && password.trim().length >= 6;
}

/**
 * POST /api/account/reset-password
 * Body: { email, code, newPassword }
 */
export default async function resetPassword(req, res) {
  try {
    const cleanEmail = normalizeEmail(req.body.email);

    // Accept common input variations and protect against numeric coercion.
    const digits = String(req.body.code || "").replace(/\D/g, "");
    const cleanCode = digits.length > 0 && digits.length <= 6 ? digits.padStart(6, "0") : "";

    const newPassword = String(req.body.newPassword || "");

    if (!cleanEmail || !cleanCode || !newPassword) {
      return res.status(400).json({ message: "Missing email, code, or new password" });
    }
    if (!isStrongEnoughPassword(newPassword)) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const { emailProvider } = await ensureAuthProviders();

    const emailIdentity = await prisma.accountIdentifier.findUnique({
      where: {
        ProviderId_Identifier: { ProviderId: emailProvider.Id, Identifier: cleanEmail },
      },
      include: { Account: { include: { AccountIdentifier: true } } },
    });

    if (!emailIdentity) {
      return res.status(404).json({ message: "Email not found" });
    }

    // Robustness: accept any unexpired + unconsumed ResetPassword OTP
    // (emails can arrive out of order if user requests multiple).
    const candidates = await prisma.otpToken.findMany({
      where: {
        AccountIdentifierId: emailIdentity.Id,
        Purpose: OtpPurpose.ResetPassword,
        ConsumedAt: null,
        ExpiresAt: { gt: new Date() },
      },
      orderBy: { CreatedAt: "desc" },
      take: 5,
    });

    if (!candidates.length) {
      return res.status(400).json({ message: "OTP expired or not found. Please request a new code." });
    }

    const { maxAttempts } = getOtpLimits();
    const allLocked = candidates.every((c) => c.Attempts >= maxAttempts);
    if (allLocked) {
      return res.status(429).json({ message: "Too many attempts. Please request a new code." });
    }

    let matched = null;
    for (const c of candidates) {
      if (c.Attempts >= maxAttempts) continue;
      const ok = await bcrypt.compare(cleanCode, c.CodeHash);
      if (ok) {
        matched = c;
        break;
      }
    }

    if (!matched) {
      await prisma.otpToken.update({ where: { Id: candidates[0].Id }, data: { Attempts: { increment: 1 } } });
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.otpToken.updateMany({
        where: {
          AccountIdentifierId: emailIdentity.Id,
          Purpose: OtpPurpose.ResetPassword,
          ConsumedAt: null,
        },
        data: { ConsumedAt: new Date() },
      }),
      prisma.accountIdentifier.updateMany({
        where: {
          AccountId: emailIdentity.AccountId,
          Secret: { not: null },
        },
        data: { Secret: hashed },
      }),
      // Treat email ownership as verified (useful for admin-created accounts too)
      prisma.accountIdentifier.update({
        where: { Id: emailIdentity.Id },
        data: { Verified: true },
      }),
    ]);

    return res.json({ message: "Password reset successful. Please login." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}
