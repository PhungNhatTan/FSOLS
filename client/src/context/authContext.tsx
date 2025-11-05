import { createContext } from "react";

export interface User {
  accountId: string;
  username: string;
  role?: string;
}

export interface AuthContextType {
  user: User | null;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  logout: () => {},
});
