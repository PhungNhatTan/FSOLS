// src/utils/auth.ts
import { jwtDecode } from "jwt-decode";

interface TokenPayload {
  accountId: string;
  username: string;
  role?: string;
  exp: number;
  iat: number;
}

export function setToken(token: string) {
  localStorage.setItem("token", token);
  window.dispatchEvent(new Event("tokenChanged"));
}

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function logout() {
  localStorage.removeItem("token");
  window.dispatchEvent(new Event("tokenChanged"));
}

export function decodeToken(): TokenPayload | null {
  const token = getToken();
  if (!token) return null;

  try {
    return jwtDecode<TokenPayload>(token);
  } catch {
    return null;
  }
}

export function getAccountId(): string | null {
  const decoded = decodeToken();
  return decoded?.accountId ?? null;
}
