import { ReactNode, useEffect, useState, useMemo } from "react";
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
import { Microscope, UtensilsCrossed, PartyPopper, Megaphone } from "lucide-react";
import PerformethLabsPopup from "./student/PerformethLabsPopup";

const BIRTHDAY_MESSAGES = [
  "🎉 Feliz Aniversário! Que este novo ciclo traga muita saúde, energia e conquistas. Você merece!",
  "🎂 Parabéns pelo seu dia! Continue firme na sua jornada — cada passo conta. Feliz Aniversário!",
  "🥳 Hoje é seu dia especial! Que a dedicação que você tem com sua saúde se reflita em um ano incrível!",
  "🎈 Feliz Aniversário! Celebre com alegria e orgulho de todo o progresso que já alcançou!",
  "🌟 Parabéns! Mais um ano de vida, mais um ano de evolução. Continue brilhando!",
  "🎁 Feliz Aniversário! Que este novo ano seja repleto de resultados surpreendentes e muita motivação!",
  "💪 Hoje é dia de comemorar! Feliz Aniversário — você é inspiração com sua disciplina e foco!",
  "🎊 Parabéns pelo seu aniversário! Que cada treino e cada refeição te levem ainda mais longe este ano!",
];

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

  // Metabolic popup state
  const [metabolicPopup, setMetabolicPopup] = useState(false);
  const [pendingPanelId, setPendingPanelId] = useState<string | null>(null);

  // Diet popup state
  const [dietPopup, setDietPopup] = useState(false);
  const [pendingDietId, setPendingDietId] = useState<string | null>(null);
  const [pendingDietTitle, setPendingDietTitle] = useState("");

  // Birthday popup state
  const [birthdayPopup, setBirthdayPopup] = useState(false);

  // Custom popup state
  const [customPopup, setCustomPopup] = useState<any>(null);
  const [customPopupOpen, setCustomPopupOpen] = useState(false);

  const birthdayMessage = useMemo(() => {
    const idx = Math.floor(Math.random() * BIRTHDAY_MESSAGES.length);
    return BIRTHDAY_MESSAGES[idx];
  }, []);

  useEffect(() => {
    if (!isStudent || !user?.id) return;

    const checkAll = async () => {
      // 1) Check metabolic panels
      const { data: metaData } = await supabase
        .from("metabolic_panels")
        .select("id")
        .eq("user_id", user.id)
        .eq("visible", true)
        .eq("seen_by_student", false)
        .order("created_at", { ascending: false })
        .limit(1);
      if (metaData && metaData.length > 0) {
        setPendingPanelId(metaData[0].id);
        setMetabolicPopup(true);
      }

      // 2) Check new diets released
      const today = new Date().toISOString().split("T")[0];
      const { data: dietData } = await supabase
        .from("student_diets")
        .select("id, title, release_date")
        .eq("user_id", user.id)
        .eq("visible", true)
        .eq("seen_by_student", false)
        .lte("release_date", today)
        .order("created_at", { ascending: false })
        .limit(1);
      if (dietData && dietData.length > 0) {
        setPendingDietId(dietData[0].id);
        setPendingDietTitle(dietData[0].title || "Nova Dieta");
        setDietPopup(true);
      }

      // 3) Check birthday
      const { data: profile } = await supabase
        .from("profiles")
        .select("birth_date")
        .eq("user_id", user.id)
        .single();
      if (profile?.birth_date) {
        const bd = new Date(profile.birth_date + "T12:00:00");
        const now = new Date();
        if (bd.getMonth() === now.getMonth() && bd.getDate() === now.getDate()) {
          const seenKey = `birthday_seen_${user.id}_${now.getFullYear()}`;
          if (!localStorage.getItem(seenKey)) {
            setBirthdayPopup(true);
          }
        }
      }

      // 4) Check custom popups
      const { data: dismissed } = await supabase
        .from("popup_dismissals")
        .select("popup_id")
        .eq("user_id", user.id);
      const dismissedIds = new Set((dismissed || []).map((d: any) => d.popup_id));

      const { data: allPopups } = await supabase
        .from("custom_popups")
        .select("*")
        .eq("active", true)
        .lte("start_date", today)
        .order("created_at", { ascending: false });

      if (allPopups) {
        // Check subscription status for targeting
        const { data: subs } = await supabase
          .from("subscriptions")
          .select("status, end_date")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);
        const hasActiveSub = subs && subs.length > 0 && subs[0].status === "active" && new Date(subs[0].end_date) > new Date();

        for (const popup of allPopups) {
          if (dismissedIds.has(popup.id)) continue;
          if (popup.end_date && popup.end_date < today) continue;

          const tt = popup.target_type;
          if (tt === "specific" && popup.target_user_id !== user.id) continue;
          if (tt === "all_active" && !hasActiveSub) continue;
          if (tt === "all_inactive" && hasActiveSub) continue;
          // "all" matches everyone

          setCustomPopup(popup);
          setCustomPopupOpen(true);
          break; // show first matching
        }
      }
    };

    checkAll();
  }, [isStudent, user?.id]);

  // ---- Metabolic handlers ----
  const markMetabolicSeen = async () => {
    if (pendingPanelId) {
      await supabase.from("metabolic_panels").update({ seen_by_student: true }).eq("id", pendingPanelId);
      setPendingPanelId(null);
    }
  };
  const handleCloseMetabolic = async () => { setMetabolicPopup(false); await markMetabolicSeen(); };
  const handleGoToMetabolic = async () => { setMetabolicPopup(false); await markMetabolicSeen(); navigate("/dashboard/metabolic"); };

  // ---- Diet handlers ----
  const markDietSeen = async () => {
    if (pendingDietId) {
      await supabase.from("student_diets").update({ seen_by_student: true } as any).eq("id", pendingDietId);
      setPendingDietId(null);
    }
  };
  const handleGoToDiet = async () => { setDietPopup(false); await markDietSeen(); navigate("/dashboard/diet"); };

  // ---- Birthday handlers ----
  const handleCloseBirthday = () => {
    setBirthdayPopup(false);
    if (user?.id) {
      const seenKey = `birthday_seen_${user.id}_${new Date().getFullYear()}`;
      localStorage.setItem(seenKey, "1");
    }
  };

  // ---- Custom popup handlers ----
  const handleDismissCustomPopup = async () => {
    if (customPopup && user?.id) {
      await supabase.from("popup_dismissals").insert({ popup_id: customPopup.id, user_id: user.id });
    }
    setCustomPopupOpen(false);
    setCustomPopup(null);
  };
  const handleCustomPopupAction = async () => {
    const route = customPopup?.button_route;
    await handleDismissCustomPopup();
    if (route && route !== "none") navigate(route);
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

      {/* Metabolic Popup */}
      <Dialog open={metabolicPopup} onOpenChange={(open) => { if (!open) handleCloseMetabolic(); }}>
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
            <Button onClick={handleGoToMetabolic} className="flex-1">Ver Painel</Button>
            <Button variant="outline" onClick={handleCloseMetabolic} className="flex-1">Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diet Released Popup */}
      <Dialog open={dietPopup} onOpenChange={() => {}}>
        <DialogContent className="max-w-sm" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <UtensilsCrossed className="w-5 h-5" />
              Nova Dieta Liberada! 🎉
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Sua nova dieta <span className="font-semibold text-foreground">"{pendingDietTitle}"</span> foi liberada e está disponível para consulta. Confira agora seu novo plano alimentar!
          </p>
          <Button onClick={handleGoToDiet} className="w-full mt-2">
            Ver Minha Dieta
          </Button>
        </DialogContent>
      </Dialog>

      {/* Birthday Popup */}
      <Dialog open={birthdayPopup} onOpenChange={(open) => { if (!open) handleCloseBirthday(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <PartyPopper className="w-5 h-5" />
              Feliz Aniversário! 🎂
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {birthdayMessage}
          </p>
          <Button onClick={handleCloseBirthday} className="w-full mt-2">
            Obrigado! 🥰
          </Button>
        </DialogContent>
      </Dialog>

      {/* Custom Popup */}
      <Dialog open={customPopupOpen} onOpenChange={(open) => { if (!open) handleDismissCustomPopup(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Megaphone className="w-5 h-5" />
              {customPopup?.title || "Aviso"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {customPopup?.message}
          </p>
          <div className="flex gap-2 mt-2">
            {customPopup?.button_text && customPopup?.button_route && customPopup.button_route !== "none" ? (
              <>
                <Button onClick={handleCustomPopupAction} className="flex-1">
                  {customPopup.button_text}
                </Button>
                <Button variant="outline" onClick={handleDismissCustomPopup} className="flex-1">
                  Fechar
                </Button>
              </>
            ) : (
              <Button onClick={handleDismissCustomPopup} className="w-full">
                Fechar
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardLayout;
