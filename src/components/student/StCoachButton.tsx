import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Smartphone, Play } from "lucide-react";

const openStCoach = () => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  // Always try to open the app directly first via custom URI scheme
  window.location.href = "stcoach://";

  // Only fall back to store if the app didn't open (longer delay = more time for app to launch)
  const storeUrl = isIOS
    ? "https://apps.apple.com/us/app/st-coach/id1537125272"
    : "https://play.google.com/store/apps/details?id=com.appsupercoach.app";

  const start = Date.now();
  setTimeout(() => {
    // If less than 2s passed and page is still visible, the app likely didn't open
    if (document.visibilityState === "visible" && Date.now() - start < 3000) {
      window.open(storeUrl, "_blank");
    }
  }, 2500);
};

const StCoachButton = () => (
  <Card className="border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
    <CardContent className="py-4 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
        <Smartphone className="w-6 h-6 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-foreground font-display text-sm">Abrir no ST Coach</p>
        <p className="text-xs text-muted-foreground">Execute seu treino pelo app com cronômetro e guia</p>
      </div>
      <Button size="sm" className="shrink-0 gap-1.5" onClick={openStCoach}>
        <Play className="w-3.5 h-3.5" /> Abrir App
      </Button>
    </CardContent>
  </Card>
);

export default StCoachButton;
