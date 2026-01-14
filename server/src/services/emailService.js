import nodemailer from "nodemailer";

function mustGetEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function getBoolEnv(name, defaultValue = false) {
  const v = process.env[name];
  if (v == null) return defaultValue;
  return String(v).toLowerCase() === "true";
}

function getIntEnv(name, defaultValue) {
  const v = process.env[name];
  if (v == null || v === "") return defaultValue;
  const n = Number(v);
  return Number.isFinite(n) ? n : defaultValue;
}

let cachedTransporter = null;

export function getMailer() {
  if (cachedTransporter) return cachedTransporter;

  const host = mustGetEnv("SMTP_HOST");
  const port = getIntEnv("SMTP_PORT", 465);
  const secure = getBoolEnv("SMTP_SECURE", true);
  const user = mustGetEnv("SMTP_USER");
  const pass = mustGetEnv("SMTP_PASS");

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  cachedTransporter = transporter;
  return transporter;
}

export async function sendEmailOtp({ to, code, purpose = "Email verification" }) {
  const transporter = getMailer();
  const from = mustGetEnv("SMTP_FROM");
  const appName = process.env.APP_NAME || "FSOLS";
  const ttlMinutes = getIntEnv("OTP_TTL_MINUTES", 10);

  const subject = `${appName} - ${purpose}`;
  const text = `Your verification code is: ${code}\n\nExpires in ${ttlMinutes} minutes.`;
  const html = `<p>${purpose} code:</p><h2>${code}</h2><p>Expires in ${ttlMinutes} minutes.</p>`;

  await transporter.sendMail({ from, to, subject, text, html });
}
