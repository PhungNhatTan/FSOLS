import { generateChatReply } from "../../services/aiService.js";

export default async function chat(req, res) {
  try {
    const { message, history } = req.body || {};

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ message: "message is required" });
    }

    // Basic payload guard
    if (message.length > 4000) {
      return res.status(413).json({ message: "message too long" });
    }

    const reply = await generateChatReply({ message, history });
    return res.json({ data: { reply } });
  } catch (err) {
    console.error("[AI CHAT ERROR]", err);
    return res.status(500).json({ message: "AI chat failed", error: err?.message });
  }
}
