// src/context/authProvider.tsx
import { type ReactNode, useEffect, useState } from "react";
import { decodeToken, logout as clearAuth } from "../utils/auth";
import { AuthContext, type User } from "./authContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const updateAuth = () => {
      const decoded = decodeToken();
      if (!decoded) return setUser(null);

      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < now) {
        handleLogout();
      } else {
        setUser({
          accountId: decoded.accountId,
          username: decoded.username,
          role: decoded.roles?.[0] ?? "Student",
        });
      }
    };

    window.addEventListener("tokenChanged", updateAuth);
    window.addEventListener("storage", updateAuth);
    updateAuth();

    return () => {
      window.removeEventListener("tokenChanged", updateAuth);
      window.removeEventListener("storage", updateAuth);
    };
  }, []);

  const handleLogout = () => {
    clearAuth();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}
