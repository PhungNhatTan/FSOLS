import { type ReactNode, useEffect, useState } from "react";
import { decodeToken, logout as clearAuth } from "../utils/auth";
import { AuthContext, type User } from "./authContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updateAuth = () => {
      const decoded = decodeToken();
      console.log("JWT says:", decoded);
      console.log("LocalStorage accountId:", localStorage.getItem("accountId"));

      if (!decoded) {
        setUser(null);
        setLoading(false);
        return;
      }

      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < now) {
        handleLogout();
      } else {
        setUser({
          accountId: decoded.userId, // Fix mapping
          username: decoded.username,
          role: decoded.roles?.[0] ?? "Student",
        });
      }
      console.log("Decoded token:", decoded);
      setLoading(false);
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
      {!loading ? children : null}
    </AuthContext.Provider>
  );
}
