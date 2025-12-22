// src/components/RootRedirect.tsx
import { Navigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"

export default function RootRedirect() {
  const { user } = useAuth()

  if (!user) return <Navigate to="/home" replace />

  if (user.role === "Mentor") return <Navigate to="/manage/dashboard" replace />

  if (user.role === "Moderator") return <Navigate to="/moderator/dashboard" replace />

  return <Navigate to="/home" replace />
}
