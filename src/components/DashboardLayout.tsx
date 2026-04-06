import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardSidebar from "./DashboardSidebar";
import FloatingDock from "./student/FloatingDock";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { usePaymentNotifications } from "@/hooks/usePaymentNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Microscope } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
  role: "student" | "admin" | "consultor" | "assistente" | "financeiro";
  title: string;
  subtitle?: string;
}

const DashboardLayout = ({ children, role, title, subtitle }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isStudent = role === "student";
  const showDock = isStudent && isMobile;
  usePaymentNotifications();

  const { user } = useAuth();
  const [metabolicPopup, setMetabolicPopup] = useState(false);
  const [pendingPanelId, setPendingPanelId] = useState<string | null>(null);

  useEffect(() => {
    if (!isStudent || !user?.id) return;
    const checkMetabolic = async () => {
      const { data } = await supabase
        .from("metabolic_panels")
        .select("id")
        .eq("user_id", user.id)
        .eq("visible", true)
        .eq("seen_by_student", false)
        .order("created_at", { ascending: false })
        .limit(1);
      if (data && data.length > 0) {
        setPendingPanelId(data[0].id);
        setMetabolicPopup(true);
      }
    };
    checkMetabolic();
  }, [isStudent, user?.id]);

  const markAsSeen = async () => {
    if (pendingPanelId) {
      await supabase
        .from("metabolic_panels")
        .update({ seen_by_student: true })
        .eq("id", pendingPanelId);
      setPendingPanelId(null);
    }
  };

  const handleClosePopup = async () => {
    setMetabolicPopup(false);
    await markAsSeen();
  };

  const handleGoToPanel = async () => {
    setMetabolicPopup(false);
    await markAsSeen();
    navigate("/dashboard/metabolic");
  };

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

      <Dialog open={metabolicPopup} onOpenChange={(open) => { if (!open) handleClosePopup(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Microscope className="w-5 h-5" />
              Nova Análise Metabólica
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Seu painel metabólico foi atualizado com novas informações. Confira agora!
          </p>
          <div className="flex gap-2 mt-2">
            <Button onClick={handleGoToPanel} className="flex-1">
              Ver Painel
            </Button>
            <Button variant="outline" onClick={handleClosePopup} className="flex-1">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardLayout;
