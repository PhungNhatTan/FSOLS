import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI;
const getGeminiClient = () => {
  if (!genAI) {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_API_KEY is not defined in environment variables");
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
};

export const generateEmbedding = async (text) => {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(text);
  return result.embedding.values;
};

export const calculateSimilarity = (vecA, vecB) => {
  if (!Array.isArray(vecA) || !Array.isArray(vecB) || !vecA.length || !vecB.length) return 0;

  const len = Math.min(vecA.length, vecB.length);
  let dot = 0, magA = 0, magB = 0;

  for (let i = 0; i < len; i++) {
    const a = Number(vecA[i]) || 0;
    const b = Number(vecB[i]) || 0;
    dot += a * b;
    magA += a * a;
    magB += b * b;
  }

  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
};

const SYSTEM_INSTRUCTION = `
You are FSOLS AI, an in-app assistant for an online learning system.

Rules:
- Always finish complete sentences; never end with trailing commas or unfinished clauses.
- Keep replies concise; use bullets for options.
- Recommend 1–3 courses with a brief reason.
- If missing info, ask 2–4 specific questions in one message, then stop.
- Reply in the user’s language (Vietnamese if the user writes Vietnamese; otherwise English).
`.trim();

const normalizeHistory = (history = []) => {
  const cleaned = (Array.isArray(history) ? history : []).filter(
    (m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim()
  );

  const firstUserIdx = cleaned.findIndex((m) => m.role === "user");
  if (firstUserIdx === -1) return [];

  let capped = cleaned.slice(firstUserIdx);
  if (capped.length > 12) capped = capped.slice(-12);
  while (capped.length && capped[0].role !== "user") capped.shift();

  return capped.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
};

export const generateChatReply = async ({ message, history }) => {
  const client = getGeminiClient();

  const modelName = process.env.GEMINI_CHAT_MODEL || "gemini-2.5-flash";
  const model = client.getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_INSTRUCTION, // ✅ đúng chỗ
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 2048,
    },
  });

  const chat = model.startChat({ history: normalizeHistory(history) });
  const result = await chat.sendMessage(String(message));
  return result.response.text();
};
