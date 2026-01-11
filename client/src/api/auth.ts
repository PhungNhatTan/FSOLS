// src/api/auth.ts
import client from "../service/client"
import type { AuthData, AuthResponse } from "../types/auth"
import { setToken } from "../utils/auth"
import { Account } from "./account"

export async function login(data: AuthData): Promise<AuthResponse> {
  const res = await client.post<AuthResponse>("/account/login", data)
  const auth = res.data

  if (auth.token) {
    setToken(auth.token)
    if (auth.roles) localStorage.setItem("roles", JSON.stringify(auth.roles))
  }

  return auth
}

export async function register(data: AuthData): Promise<AuthResponse> {
  const res = await client.post<AuthResponse>("/account/register", data)
  const auth = res.data

  if (auth.token) {
    setToken(auth.token)
    if (auth.roles) localStorage.setItem("roles", JSON.stringify(auth.roles))
  }

  return auth
}

export async function createAccountWithRole(data: {
  username: string
  displayName: string
  password: string
  role: "Mentor" | "Moderator" | "Admin"
  email?: string
  phone?: string
}): Promise<Account> {
  const res = await client.post("/account/create-with-role", data)
  return res.data
}
