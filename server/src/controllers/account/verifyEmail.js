import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../../prismaClient.js";
import { ensureAuthProviders } from "../../services/providerService.js";
import { getOtpLimits } from "../../services/otpService.js";
import { OtpPurpose } from "../../generated/prisma/index.js";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export default async function verifyEmail(req, res) {
  try {
    const { email, code } = req.body;
    const cleanEmail = normalizeEmail(email);

    // Accept common user input variations (spaces, dashes). Also protect against
    // client-side numeric coercion that can drop leading zeros.
    const digits = String(code || "").replace(/\D/g, "");
    const cleanCode = digits.length > 0 && digits.length <= 6 ? digits.padStart(6, "0") : "";

    if (!cleanEmail || !cleanCode) return res.status(400).json({ message: "Missing email or code" });

    const { emailProvider } = await ensureAuthProviders();

    const emailIdentity = await prisma.accountIdentifier.findUnique({
      where: {
        ProviderId_Identifier: { ProviderId: emailProvider.Id, Identifier: cleanEmail },
      },
      include: { Account: { include: { AccountRole: true } } },
    });

    if (!emailIdentity) return res.status(404).json({ message: "Email not found" });
    if (emailIdentity.Verified) return res.json({ message: "Email already verified" });

    // IMPORTANT: users often resend OTP and email delivery can arrive out of order.
    // Instead of checking only the latest OTP, accept ANY unconsumed + unexpired OTP
    // for this identifier (bounded by take=5) that matches the submitted code.
    const candidates = await prisma.otpToken.findMany({
      where: {
        AccountIdentifierId: emailIdentity.Id,
        Purpose: OtpPurpose.VerifyAccount,
        ConsumedAt: null,
        ExpiresAt: { gt: new Date() },
      },
      orderBy: { CreatedAt: "desc" },
      take: 5,
    });

    if (!candidates.length) {
      return res.status(400).json({ message: "OTP expired or not found. Resend OTP." });
    }

    const { maxAttempts } = getOtpLimits();
    const allLocked = candidates.every((c) => c.Attempts >= maxAttempts);
    if (allLocked) return res.status(429).json({ message: "Too many attempts. Resend OTP." });

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
      // Increment attempts on the newest OTP to preserve a sensible rate-limit signal.
      await prisma.otpToken.update({ where: { Id: candidates[0].Id }, data: { Attempts: { increment: 1 } } });
      return res.status(400).json({ message: "Invalid OTP" });
    }

    await prisma.$transaction([
      // Consume all VerifyAccount OTPs for this identifier to avoid future confusion.
      prisma.otpToken.updateMany({
        where: {
          AccountIdentifierId: emailIdentity.Id,
          Purpose: OtpPurpose.VerifyAccount,
          ConsumedAt: null,
        },
        data: { ConsumedAt: new Date() },
      }),
      prisma.accountIdentifier.update({ where: { Id: emailIdentity.Id }, data: { Verified: true } }),
    ]);

    const roles = emailIdentity.Account.AccountRole.length
      ? emailIdentity.Account.AccountRole.map((r) => r.Role)
      : ["Student"];

    const token = jwt.sign(
      { userId: emailIdentity.Account.Id, accountId: emailIdentity.Account.Id, username: emailIdentity.Account.Username, roles },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({ message: "Email verified", token, roles });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}
