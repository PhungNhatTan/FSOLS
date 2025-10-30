import http from "../service/http";
import { jwtDecode } from "jwt-decode";

export interface AuthResponse {
  token?: string;
  message?: string;
}

export interface AuthData {
  username: string;
  password: string;
}

interface TokenPayload {
  accountId: string;
  username: string;
  role?: string;
  exp: number;
  iat: number;
}

export async function register(data: AuthData): Promise<AuthResponse> {
  const res = await http.post<AuthResponse>("/account/register", data);
  if (res.data.token) {
    localStorage.setItem("token", res.data.token);
  }
  return res.data;
}

export async function login(data: AuthData): Promise<AuthResponse> {
  const res = await http.post<AuthResponse>("/account/login", data);
  if (res.data.token) {
    localStorage.setItem("token", res.data.token);
  }
  return res.data;
}

export function logout() {
  localStorage.removeItem("token");
}

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function getAccountId(): string | null {
  const token = getToken();
  if (!token) return null;

  try {
    const decoded = jwtDecode<TokenPayload>(token);
    return decoded.accountId;
  } catch {
    return null;
  }
}
