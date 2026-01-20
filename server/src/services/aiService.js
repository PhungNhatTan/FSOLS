import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI;
const getGeminiClient = () => {
  if (!genAI) {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY is not defined in environment variables");
    }
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
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magA * magB);
};

const normalizeHistory = (history = []) => {
  // FE format: [{ role: "user" | "assistant", content: string }]
  // Gemini format: [{ role: "user" | "model", parts: [{ text }] }]
  const cleaned = (Array.isArray(history) ? history : []).filter(
    (m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim().length > 0
  );

  // Gemini's chat history validation requires the first item to be role "user".
  // If the UI includes a starter assistant message, drop it (and any other leading assistant messages).
  const firstUserIdx = cleaned.findIndex((m) => m.role === "user");
  if (firstUserIdx === -1) return [];

  let capped = cleaned.slice(firstUserIdx);

  // Cap history size, then re-strip any leading assistant messages in case we cut mid-conversation.
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
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 2048,
    },
  });

  const chat = model.startChat({
    history: normalizeHistory(history),
  });

  const result = await chat.sendMessage(String(message));
  return result.response.text();
};
