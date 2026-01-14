import bcrypt from "bcrypt";
import crypto from "crypto";
import prisma from "../prismaClient.js";
import { OtpPurpose } from "../generated/prisma/index.js";

function getIntEnv(name, defaultValue) {
  const v = process.env[name];
  if (v == null || v === "") return defaultValue;
  const n = Number(v);
  return Number.isFinite(n) ? n : defaultValue;
}

export function generateSixDigitCode() {
  const n = crypto.randomInt(0, 1000000);
  return String(n).padStart(6, "0");
}

export function getOtpLimits() {
  return {
    maxAttempts: getIntEnv("OTP_MAX_ATTEMPTS", 5),
    resendCooldownSeconds: getIntEnv("OTP_RESEND_COOLDOWN_SECONDS", 60),
  };
}

export async function createEmailVerificationOtp({ accountIdentifierId }) {
  const ttlMinutes = getIntEnv("OTP_TTL_MINUTES", 10);
  const code = generateSixDigitCode();
  const codeHash = await bcrypt.hash(code, 10);

  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  await prisma.otpToken.create({
    data: {
      Purpose: OtpPurpose.VerifyAccount,
      CodeHash: codeHash,
      ExpiresAt: expiresAt,
      AccountIdentifierId: accountIdentifierId,
    },
  });

  return { code, expiresAt };
}

export async function getLatestValidOtp({ accountIdentifierId }) {
  return prisma.otpToken.findFirst({
    where: {
      AccountIdentifierId: accountIdentifierId,
      Purpose: OtpPurpose.VerifyAccount,
      ConsumedAt: null,
      ExpiresAt: { gt: new Date() },
    },
    orderBy: { CreatedAt: "desc" },
  });
}
