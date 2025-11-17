import { jwtDecode } from "jwt-decode";

interface TokenPayload {
  userId: string;       // match backend
  username: string;
  roles?: string[];     // array from backend
  exp: number;
  iat: number;
}

export function getAccountId(): string | null {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const decoded = jwtDecode<TokenPayload>(token);
    return decoded.userId;
  } catch {
    return null;
  }
}
