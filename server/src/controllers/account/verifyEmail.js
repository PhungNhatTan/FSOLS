import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../../prismaClient.js";
import { ensureAuthProviders } from "../../services/providerService.js";
import { getLatestValidOtp, getOtpLimits } from "../../services/otpService.js";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export default async function verifyEmail(req, res) {
  try {
    const { email, code } = req.body;
    const cleanEmail = normalizeEmail(email);
    const cleanCode = String(code || "").trim();

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

    const otp = await getLatestValidOtp({ accountIdentifierId: emailIdentity.Id });
    if (!otp) return res.status(400).json({ message: "OTP expired or not found. Resend OTP." });

    const { maxAttempts } = getOtpLimits();
    if (otp.Attempts >= maxAttempts) return res.status(429).json({ message: "Too many attempts. Resend OTP." });

    const ok = await bcrypt.compare(cleanCode, otp.CodeHash);
    if (!ok) {
      await prisma.otpToken.update({ where: { Id: otp.Id }, data: { Attempts: { increment: 1 } } });
      return res.status(400).json({ message: "Invalid OTP" });
    }

    await prisma.$transaction([
      prisma.otpToken.update({ where: { Id: otp.Id }, data: { ConsumedAt: new Date() } }),
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
