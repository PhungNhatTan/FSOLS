import { type ReactNode, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { getToken, logout } from "../api/auth";
import { AuthContext, type User } from "./authContext";

interface TokenPayload {
  accountId: string;
  username: string;
  role?: string;
  exp: number;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const token = getToken();
      if (!token) return setUser(null);

      try {
        const decoded = jwtDecode<TokenPayload>(token);
        const now = Math.floor(Date.now() / 1000);

        if (decoded.exp && decoded.exp < now) {
          handleLogout();
        } else {
          setUser({
            accountId: decoded.accountId,
            username: decoded.username,
            role: decoded.role ?? "Student",
          });
        }
      } catch {
        handleLogout();
      }
    };

    const handleChange = () => checkAuth();
    window.addEventListener("tokenChanged", handleChange);
    window.addEventListener("storage", handleChange);
    checkAuth();

    return () => {
      window.removeEventListener("tokenChanged", handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}
