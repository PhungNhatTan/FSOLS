import { useMemo, useRef, useState } from "react";
import { aiChat, type ChatMessage } from "../../api/ai";
import { isAxiosError } from "../../service/client";

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hi, I’m your FSOLS assistant. How can I help?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  const scrollToBottom = () => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  };

  const send = async () => {
    if (!canSend) return;

    const text = input.trim();
    setInput("");

    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setLoading(true);

    setTimeout(scrollToBottom, 0);

    try {
      // Send history *before* the current user message to avoid duplicating it on the server.
      // Also drop the starter assistant greeting so Gemini history starts with a user message.
      const historyForServer = messages.slice(1);
      const reply = await aiChat(text, historyForServer);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      setTimeout(scrollToBottom, 0);
    } catch (err: unknown) {
      let msg = "Unknown";
      if (isAxiosError(err)) {
        const data = err.response?.data as unknown;
        const serverMsg =
          typeof data === "object" &&
          data !== null &&
          typeof (data as Record<string, unknown>).message === "string"
            ? ((data as Record<string, unknown>).message as string)
            : undefined;
        msg = serverMsg || err.message || msg;
      } else if (err instanceof Error) {
        msg = err.message || msg;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `AI error: ${msg}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="rounded-full px-4 py-3 shadow-lg bg-black text-white"
          aria-label="Open AI chat"
        >
          AI Chat
        </button>
      ) : (
        <div className="w-[360px] h-[520px] rounded-2xl shadow-xl bg-white border flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="font-semibold">FSOLS AI</div>
            <button
              onClick={() => setOpen(false)}
              className="text-sm px-2 py-1 rounded bg-gray-100"
              aria-label="Close AI chat"
            >
              Close
            </button>
          </div>

          <div ref={listRef} className="flex-1 overflow-auto px-4 py-3 space-y-3">
            {messages.map((m, idx) => (
              <div key={idx} className={m.role === "user" ? "text-right" : "text-left"}>
                <div
                  className={
                    "inline-block max-w-[85%] px-3 py-2 rounded-2xl text-sm " +
                    (m.role === "user" ? "bg-black text-white" : "bg-gray-100 text-gray-900")
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-left">
                <div className="inline-block max-w-[85%] px-3 py-2 rounded-2xl text-sm bg-gray-100 text-gray-900">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          <div className="border-t p-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              placeholder="Type a message..."
              className="flex-1 border rounded-xl px-3 py-2 text-sm"
              aria-label="AI chat input"
            />
            <button
              onClick={send}
              disabled={!canSend}
              className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50"
              aria-label="Send message"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
