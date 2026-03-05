import { ReactNode } from "react";
import DashboardSidebar from "./DashboardSidebar";
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

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar role={role} />
      <main className={cn(isMobile ? "pt-14 p-4" : "ml-64 p-8")}>
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl font-bold text-foreground font-display">{title}</h1>
          {subtitle && <p className="text-sm md:text-base text-muted-foreground mt-1 font-body">{subtitle}</p>}
        </div>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
