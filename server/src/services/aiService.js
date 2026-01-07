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
