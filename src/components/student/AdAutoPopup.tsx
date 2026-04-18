import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, ExternalLink, ImageIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "ads_seen_this_session";

const AdAutoPopup = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [open, setOpen] = useState(false);

  const { data: ads } = useQuery({
    queryKey: ["student-ads-popup"],
    queryFn: async () => {
      const now = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("ads")
        .select("*")
        .eq("active", true)
        .lte("start_date", now)
        .order("sort_order", { ascending: true });
      return (data || []).filter((a: any) => !a.end_date || a.end_date >= now);
    },
  });

  // Filter out ads already seen this session
  const unseenAds = (ads || []).filter((a: any) => {
    const seen = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "[]");
    return !seen.includes(a.id);
  });

  useEffect(() => {
    if (unseenAds.length > 0 && !open) {
      const timer = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, [unseenAds.length]);

  const currentAd = unseenAds[currentIndex];

  const handleClose = () => {
    if (currentAd) {
      const seen = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "[]");
      sessionStorage.setItem(SESSION_KEY, JSON.stringify([...seen, currentAd.id]));
    }
    if (currentIndex < unseenAds.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setOpen(false);
    }
  };

  if (!currentAd) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden gap-0">
        {/* Image section — fills 50% of viewport height */}
        {currentAd.image_url ? (
          <div className="w-full bg-muted" style={{ height: "50vh" }}>
            <img
              src={currentAd.image_url}
              alt={currentAd.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-full bg-muted flex items-center justify-center" style={{ height: "50vh" }}>
            <ImageIcon className="w-16 h-16 text-muted-foreground/30" />
          </div>
        )}

        <div className="p-5 space-y-3">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">{currentAd.title}</DialogTitle>
          </DialogHeader>

          {currentAd.popup_content ? (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{currentAd.popup_content}</p>
          ) : currentAd.description ? (
            <p className="text-sm text-muted-foreground">{currentAd.description}</p>
          ) : null}

          <div className="flex gap-2 pt-1">
            {currentAd.whatsapp_number && (
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-1.5"
                onClick={() => window.open(`https://wa.me/${currentAd.whatsapp_number.replace(/\D/g, "")}`, "_blank")}
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </Button>
            )}
            {currentAd.external_link && (
              <Button
                variant="outline"
                className="flex-1 gap-1.5"
                onClick={() => window.open(currentAd.external_link, "_blank")}
              >
                <ExternalLink className="w-4 h-4" /> Saiba mais
              </Button>
            )}
          </div>

          {unseenAds.length > 1 && (
            <p className="text-[10px] text-muted-foreground text-center pt-1">
              {currentIndex + 1} de {unseenAds.length}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdAutoPopup;
