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
    setToken(res.data.token); // ✅ dispatches tokenChanged
  }
  return res.data;
}

export async function login(data: AuthData): Promise<AuthResponse> {
  const res = await http.post<AuthResponse>("/account/login", data);
  if (res.data.token) {
    setToken(res.data.token); // ✅ dispatches tokenChanged
  }
  return res.data;
}

export function setToken(token: string) {
  localStorage.setItem("token", token);
  window.dispatchEvent(new Event("tokenChanged")); // ✅ triggers re-render
}

export function getToken() {
  return localStorage.getItem("token");
}

export function logout() {
  localStorage.removeItem("token");
  window.dispatchEvent(new Event("tokenChanged")); // ✅ triggers logout update
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
