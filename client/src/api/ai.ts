import client from "../service/client";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function aiChat(message: string, history: ChatMessage[]) {
  const res = await client.post("ai/chat", { message, history });
  return res.data?.data?.reply as string;
}
