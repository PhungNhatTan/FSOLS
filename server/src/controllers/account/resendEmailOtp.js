import prisma from "../../prismaClient.js";
import { ensureAuthProviders } from "../../services/providerService.js";
import { createEmailVerificationOtp, getOtpLimits } from "../../services/otpService.js";
import { sendEmailOtp } from "../../services/emailService.js";
import { OtpPurpose } from "../../generated/prisma/index.js";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export default async function resendEmailOtp(req, res) {
  try {
    const { email } = req.body;
    const cleanEmail = normalizeEmail(email);
    if (!cleanEmail) return res.status(400).json({ message: "Missing email" });

    const { emailProvider } = await ensureAuthProviders();

    const emailIdentity = await prisma.accountIdentifier.findUnique({
      where: {
        ProviderId_Identifier: { ProviderId: emailProvider.Id, Identifier: cleanEmail },
      },
    });

    if (!emailIdentity) return res.status(404).json({ message: "Email not found" });
    if (emailIdentity.Verified) return res.status(400).json({ message: "Email already verified" });

    const { resendCooldownSeconds } = getOtpLimits();

    const latest = await prisma.otpToken.findFirst({
      where: { AccountIdentifierId: emailIdentity.Id, Purpose: OtpPurpose.VerifyAccount, ConsumedAt: null },
      orderBy: { CreatedAt: "desc" },
    });

    if (latest) {
      const elapsed = (Date.now() - new Date(latest.CreatedAt).getTime()) / 1000;
      if (elapsed < resendCooldownSeconds) {
        return res.status(429).json({ message: `Wait ${Math.ceil(resendCooldownSeconds - elapsed)}s then retry.` });
      }
    }

    const { code, expiresAt } = await createEmailVerificationOtp({ accountIdentifierId: emailIdentity.Id });
    await sendEmailOtp({ to: cleanEmail, code, purpose: "Email verification" });

    return res.json({ message: "OTP resent", email: cleanEmail, expiresAt });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}
