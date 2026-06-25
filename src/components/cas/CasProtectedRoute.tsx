import { Navigate, useLocation } from "react-router-dom";
import { useCasAuth } from "@/contexts/CasAuthContext";
import { Loader2 } from "lucide-react";

export default function CasProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useCasAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] text-[#1d1d1f]">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to={`/cas/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }
  return <>{children}</>;
}