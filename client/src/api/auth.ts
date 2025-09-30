export interface AuthResponse {
  token?: string;
  message?: string;
}

export interface AuthData {
  username: string;
  password: string;
}

export async function register(data: AuthData): Promise<AuthResponse> {
  const res = await fetch("/api/account/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function login(data: AuthData): Promise<AuthResponse> {
  const res = await fetch("/api/account/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}
