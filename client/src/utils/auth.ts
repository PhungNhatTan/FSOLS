// src/utils/auth.ts
import { jwtDecode } from "jwt-decode"

interface TokenPayload {
  userId: string
  accountId: string
  username: string
  roles?: string[]
  exp: number
  iat: number
}

export function decodeToken() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    return jwtDecode<TokenPayload>(token);
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  localStorage.setItem("token", token)

  const decoded = jwtDecode<TokenPayload>(token)
  localStorage.setItem("accountId", decoded.accountId)
  localStorage.setItem("username", decoded.username)
  if (decoded.roles) {
    localStorage.setItem("roles", JSON.stringify(decoded.roles))
  }

  window.dispatchEvent(new Event("tokenChanged"))
}

export function logout() {
  localStorage.removeItem("token")
  localStorage.removeItem("accountId")
  localStorage.removeItem("username")
  localStorage.removeItem("roles")
  localStorage.clear()

  // Session-scoped UI caches (e.g. exam attempt results) must not leak across accounts.
  try {
    sessionStorage.clear()
  } catch {
    // ignore
  }

  Object.keys(localStorage)
    .filter(k => k.startsWith("course_"))
    .forEach(k => localStorage.removeItem(k))

  // Notify listeners (same-tab) that auth state has changed.
  window.dispatchEvent(new Event("tokenChanged"))
}

export function getAccountId(): string | null {
  return localStorage.getItem("accountId")
}
