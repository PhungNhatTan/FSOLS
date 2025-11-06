import { jwtDecode } from "jwt-decode";

interface TokenPayload {
  accountId: string;
  username: string;
  role?: string;
  exp: number;
  iat: number;
}

export function getAccountId(): string | null {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const decoded = jwtDecode<TokenPayload>(token);
    return decoded.accountId;
  } catch {
    return null;
  }
}
