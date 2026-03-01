import { ReactNode } from "react";
import DashboardSidebar from "./DashboardSidebar";

interface DashboardLayoutProps {
  children: ReactNode;
  role: "student" | "admin";
  title: string;
  subtitle?: string;
}

const DashboardLayout = ({ children, role, title, subtitle }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar role={role} />
      <main className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground font-display">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-1 font-body">{subtitle}</p>}
        </div>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
