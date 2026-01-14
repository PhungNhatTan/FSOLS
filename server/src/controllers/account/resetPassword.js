import bcrypt from "bcrypt";
import prisma from "../../prismaClient.js";
import { ensureAuthProviders } from "../../services/providerService.js";
import { getLatestValidResetPasswordOtp, getOtpLimits } from "../../services/otpService.js";
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
    const cleanCode = String(req.body.code || "").trim();
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

    const otp = await getLatestValidResetPasswordOtp({ accountIdentifierId: emailIdentity.Id });
    if (!otp) {
      return res.status(400).json({ message: "OTP expired or not found. Please request a new code." });
    }

    const { maxAttempts } = getOtpLimits();
    if (otp.Attempts >= maxAttempts) {
      return res.status(429).json({ message: "Too many attempts. Please request a new code." });
    }

    const ok = await bcrypt.compare(cleanCode, otp.CodeHash);
    if (!ok) {
      await prisma.otpToken.update({ where: { Id: otp.Id }, data: { Attempts: { increment: 1 } } });
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
      // OTP xác minh email ownership -> coi như Verified luôn (hữu ích cho account admin tạo)
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
