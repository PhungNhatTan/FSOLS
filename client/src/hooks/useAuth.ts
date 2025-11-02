// src/hooks/useAuth.ts
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { getToken, logout } from "../api/auth";

interface TokenPayload {
  accountId: string;
  username: string;
  role?: string;
  exp: number;
}

export interface User {
  accountId: string;
  username: string;
  role?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const token = getToken();
      if (!token) {
        setUser(null);
        return;
      }

      try {
        const decoded = jwtDecode<TokenPayload>(token);
        const now = Math.floor(Date.now() / 1000);

        if (decoded.exp && decoded.exp < now) {
          logout();
          setUser(null);
        } else {
          setUser({
            accountId: decoded.accountId,
            username: decoded.username,
            role: decoded.role,
          });
        }
      } catch {
        logout();
        setUser(null);
      }
    };

    checkAuth();

    // Watch for token changes
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "token") checkAuth();
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return { user, logout };
}
