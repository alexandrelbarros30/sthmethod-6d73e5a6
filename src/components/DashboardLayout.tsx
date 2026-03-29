import { ReactNode } from "react";
import DashboardSidebar from "./DashboardSidebar";
import FloatingDock from "./student/FloatingDock";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
  role: "student" | "admin" | "consultor" | "assistente" | "financeiro";
  title: string;
  subtitle?: string;
}

const DashboardLayout = ({ children, role, title, subtitle }: DashboardLayoutProps) => {
  const isMobile = useIsMobile();
  const isStudent = role === "student";
  const showDock = isStudent && isMobile;

  return (
    <div className="min-h-screen w-full max-w-full bg-background overflow-x-hidden">
      {!(isStudent && isMobile) && <DashboardSidebar role={role} />}
      <main className={cn(
        "min-w-0 overflow-x-hidden",
        isStudent && isMobile
          ? "w-full px-4 pt-4 pb-4"
          : isMobile
            ? "w-full pt-14 px-4 pb-4"
            : "ml-60 w-[calc(100%-15rem)] px-6 py-6 lg:px-8 lg:py-8"
      )}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 md:mb-8">
            <h1 className="text-xl md:text-2xl font-semibold text-foreground font-display tracking-tight">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground mt-1 font-body">{subtitle}</p>}
          </div>
          <div className="w-full min-w-0">{children}</div>
        </div>
      </main>
      {showDock && <FloatingDock />}
    </div>
  );
};

export default DashboardLayout;
