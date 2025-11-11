// src/api/auth.ts
import client from "../service/client";
import type { AuthData, AuthResponse } from "../types/auth";
import { setToken } from "../utils/auth";

export async function register(data: AuthData): Promise<AuthResponse> {
  const res = await client.post<AuthResponse>("/account/register", data);
  if (res.data.token) setToken(res.data.token);
  return res.data;
}

export async function login(data: AuthData): Promise<AuthResponse> {
  const res = await client.post<AuthResponse>("/account/login", data);
  if (res.data.token) setToken(res.data.token);
  return res.data;
}
