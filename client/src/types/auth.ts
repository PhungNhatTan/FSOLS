export interface AuthResponse {
  token?: string;
  roles?: string[];
  message?: string;
}

export interface AuthData {
  username: string;
  password: string;
}
