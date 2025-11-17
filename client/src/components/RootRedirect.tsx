// src/components/RootRedirect.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function RootRedirect() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/home" replace />;      // guest

  if (user.role === "Mentor") return <Navigate to="/dashboard" replace />;

  return <Navigate to="/home" replace />;                 // student or other
}
