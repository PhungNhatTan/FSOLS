// components/common/StatusMessages.tsx
export function LoadingMessage({ text = "Loading..." }: { text?: string }) {
  return <p className="text-gray-500 italic">{text}</p>;
}

export function ErrorMessage({ message }: { message: string }) {
  return <p className="text-red-500 font-medium">{message}</p>;
}

export function EmptyState({ text }: { text: string }) {
  return <p className="text-gray-500 italic">{text}</p>;
}
