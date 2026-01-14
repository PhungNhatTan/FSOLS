export interface AuthResponse {
  token?: string;
  roles?: string[];
  message?: string;
  requiresEmailVerification?: boolean;
  email?: string;
}

export interface LoginData {
  identifier: string; // username OR email
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface VerifyEmailData {
  email: string;
  code: string;
}

export interface CreateAccountWithRoleData {
  username: string;
  displayName: string;
  password: string;
  role: "Admin" | "Mentor" | "Moderator" | "Student";
  email?: string; // OPTIONAL per your request
  phone?: string;
}

export interface CreateAccountWithRoleResponse {
  message?: string;
  account?: {
    id: string;
    username: string;
    displayName: string;
    roles: string[];
    email: string | null;
    phone: string | null;
    createdAt: string;
  };
}
