// src/components/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[]; // optional
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role ?? "")) {
    return (
      <div className="p-8 text-center text-red-500 font-semibold text-lg">
        Access Denied — insufficient permissions.
      </div>
    );
  }

  return <>{children}</>;
}
