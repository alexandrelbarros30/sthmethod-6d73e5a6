import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useCoachContext } from "@/hooks/useCoachTenant";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  children: ReactNode;
  audience: "professional" | "student";
}

const LoadingShell = () => (
  <div className="min-h-screen bg-background p-8">
    <div className="max-w-5xl mx-auto space-y-4">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-32 w-full rounded-2xl" />
    </div>
  </div>
);

const CoachRoute = ({ children, audience }: Props) => {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { loading, member, student } = useCoachContext();

  if (authLoading || (user && loading)) return <LoadingShell />;

  if (!user) {
    return <Navigate to={`/coach/entrar?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (audience === "professional") {
    if (!member) {
      return <Navigate to={student ? "/coach/aluno" : "/coach/comecar"} replace />;
    }
    return <>{children}</>;
  }

  if (!student) {
    return <Navigate to={member ? "/coach" : "/coach/comecar"} replace />;
  }
  return <>{children}</>;
};

export default CoachRoute;