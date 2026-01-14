import client, { isAxiosError } from "../service/client";
import type { AuthResponse, CreateAccountWithRoleData, CreateAccountWithRoleResponse, LoginData, RegisterData, VerifyEmailData } from "../types/auth";
import { setToken } from "../utils/auth";

export async function login(data: LoginData): Promise<AuthResponse> {
  const res = await client.post<AuthResponse>("/account/login", data);
  const auth = res.data;

  if (auth.token) {
    setToken(auth.token);
    if (auth.roles) localStorage.setItem("roles", JSON.stringify(auth.roles));
  }
  return auth;
}

export async function register(data: RegisterData): Promise<AuthResponse> {
  const res = await client.post<AuthResponse>("/account/register", data);
  return res.data;
}

export async function verifyEmail(data: VerifyEmailData): Promise<AuthResponse> {
  const res = await client.post<AuthResponse>("/account/verify-email", data);
  const auth = res.data;

  if (auth.token) {
    setToken(auth.token);
    if (auth.roles) localStorage.setItem("roles", JSON.stringify(auth.roles));
  }

  return auth;
}

export async function resendEmailOtp(email: string): Promise<AuthResponse> {
  const res = await client.post<AuthResponse>("/account/resend-email-otp", { email });
  return res.data;
}

export function getErrorMessage(err: unknown): string {
  if (isAxiosError(err)) return err.response?.data?.message || err.message;
  return "Server error";
}

export async function createAccountWithRole(
  data: CreateAccountWithRoleData
): Promise<CreateAccountWithRoleResponse> {
  const res = await client.post<CreateAccountWithRoleResponse>(
    "/account/create-with-role",
    data
  );
  return res.data;
}
