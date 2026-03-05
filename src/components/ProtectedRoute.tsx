import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: Array<"admin" | "consultor" | "assistente" | "financeiro" | "student">;
  /** @deprecated use allowedRoles */
  requiredRole?: "admin" | "student";
}

const roleHomeMap: Record<string, string> = {
  admin: "/admin",
  consultor: "/consultor",
  assistente: "/assistente",
  financeiro: "/financeiro",
  student: "/dashboard",
};

const ProtectedRoute = ({ children, allowedRoles, requiredRole }: ProtectedRouteProps) => {
  const { session, role, loading } = useAuth();

  // Backwards compat: convert requiredRole to allowedRoles
  const roles = allowedRoles ?? (requiredRole ? [requiredRole] : undefined);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center animate-pulse">
            <span className="text-primary-foreground font-bold text-sm">ST</span>
          </div>
          <p className="text-muted-foreground text-sm font-body">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    const currentPath = window.location.pathname + window.location.search;
    const loginUrl = currentPath !== "/dashboard" && currentPath !== "/admin"
      ? `/login?redirect=${encodeURIComponent(currentPath)}`
      : "/login";
    return <Navigate to={loginUrl} replace />;
  }

  if (roles && role && !roles.includes(role)) {
    return <Navigate to={roleHomeMap[role] || "/dashboard"} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
