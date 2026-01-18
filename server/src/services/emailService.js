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

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  return cachedTransporter;
}

async function sendViaSmtp({ to, subject, text, html }) {
  const transporter = getMailer();
  const from = mustGetEnv("SMTP_FROM");
  await transporter.sendMail({ from, to, subject, text, html });
}

async function sendViaEmailJs({ to, subject, text, html, code, purpose, ttlMinutes, appName }) {
  const serviceId = mustGetEnv("EMAILJS_SERVICE_ID");
  const templateId = mustGetEnv("EMAILJS_TEMPLATE_ID");
  const publicKey = mustGetEnv("EMAILJS_PUBLIC_KEY"); // user_id
  const privateKey = process.env.EMAILJS_PRIVATE_KEY; // accessToken (optional but recommended)

  const payload = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    ...(privateKey ? { accessToken: privateKey } : {}),
    template_params: {
      to_email: to,
      subject,
      otp_code: code,
      purpose,
      ttl_minutes: ttlMinutes,
      app_name: appName,
      text_content: text,
      html_content: html,
    },
  };

  // 15s timeout to avoid hanging requests
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const body = await res.text(); // EmailJS returns text like "OK" on success
    if (!res.ok) throw new Error(`EmailJS send failed: ${res.status} ${body}`);
  } finally {
    clearTimeout(timer);
  }
}

export async function sendEmailOtp({ to, code, purpose = "Email verification" }) {
  const provider = (process.env.MAIL_PROVIDER || "smtp").toLowerCase();

  const appName = process.env.APP_NAME || "FSOLS";
  const ttlMinutes = getIntEnv("OTP_TTL_MINUTES", 10);

  const subject = `${appName} - ${purpose}`;
  const text = `Your verification code is: ${code}\n\nExpires in ${ttlMinutes} minutes.`;
  const html = `<p>${purpose} code:</p><h2>${code}</h2><p>Expires in ${ttlMinutes} minutes.</p>`;

  if (provider === "emailjs") {
    return sendViaEmailJs({ to, subject, text, html, code, purpose, ttlMinutes, appName });
  }

  return sendViaSmtp({ to, subject, text, html });
}
