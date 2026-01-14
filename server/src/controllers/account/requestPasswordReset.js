import prisma from "../../prismaClient.js";
import { ensureAuthProviders } from "../../services/providerService.js";
import { createResetPasswordOtp, getOtpLimits } from "../../services/otpService.js";
import { sendEmailOtp } from "../../services/emailService.js";
import { OtpPurpose } from "../../generated/prisma/index.js";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

/**
 * POST /api/account/forgot-password
 * Body: { email }
 * Security note: returns a generic success response even if email does not exist.
 */
export default async function requestPasswordReset(req, res) {
  try {
    const cleanEmail = normalizeEmail(req.body.email);
    if (!cleanEmail) {
      return res.status(400).json({ message: "Missing email" });
    }

    const { emailProvider } = await ensureAuthProviders();

    const emailIdentity = await prisma.accountIdentifier.findUnique({
      where: {
        ProviderId_Identifier: { ProviderId: emailProvider.Id, Identifier: cleanEmail },
      },
    });

    // Always respond generically to avoid account enumeration.
    if (!emailIdentity) {
      return res.json({
        message: "If the email exists, a reset code has been sent. Please check your inbox.",
      });
    }

    const { resendCooldownSeconds } = getOtpLimits();
    const latest = await prisma.otpToken.findFirst({
      where: {
        AccountIdentifierId: emailIdentity.Id,
        Purpose: OtpPurpose.ResetPassword,
        ConsumedAt: null,
      },
      orderBy: { CreatedAt: "desc" },
    });

    if (latest) {
      const elapsed = (Date.now() - new Date(latest.CreatedAt).getTime()) / 1000;
      if (elapsed < resendCooldownSeconds) {
        return res.json({
          message: "If you recently requested a code, please wait a bit before requesting again.",
        });
      }
    }

    const { code, expiresAt } = await createResetPasswordOtp({ accountIdentifierId: emailIdentity.Id });

    await sendEmailOtp({
      to: cleanEmail,
      code,
      purpose: "Password reset",
    });

    return res.json({
      message: "If the email exists, a reset code has been sent. Please check your inbox.",
      expiresAt,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}
