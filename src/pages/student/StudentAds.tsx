import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, ExternalLink, ImageIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const StudentAds = () => {
  const [selectedAd, setSelectedAd] = useState<any>(null);

  const { data: ads, isLoading } = useQuery({
    queryKey: ["student-ads"],
    queryFn: async () => {
      const now = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("ads")
        .select("*")
        .eq("active", true)
        .lte("start_date", now)
        .order("sort_order", { ascending: true });
      // Filter out expired ads client-side (end_date nullable)
      return (data || []).filter((a: any) => !a.end_date || a.end_date >= now);
    },
  });

  return (
    <DashboardLayout role="student" title="Propagandas" subtitle="Ofertas e promoções exclusivas">
      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
      ) : !ads?.length ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhuma promoção disponível no momento.</p>
      ) : (
        <div className="space-y-4">
          {ads.map((ad: any) => (
            <Card key={ad.id} className="overflow-hidden border-border/50">
              <CardContent className="p-0">
                <div className="flex items-center gap-4 p-4">
                  {ad.image_url ? (
                    <img src={ad.image_url} alt={ad.title} className="w-16 h-16 rounded-xl object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <ImageIcon className="w-6 h-6 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-foreground">{ad.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{ad.description}</p>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs shrink-0" onClick={() => setSelectedAd(ad)}>
                    Ver
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Global action buttons for first ad with whatsapp/link */}
          {ads.some((a: any) => a.whatsapp_number || a.external_link) && (
            <div className="pt-2 flex gap-2">
              {ads[0]?.whatsapp_number && (
                <Button
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs gap-1.5"
                  onClick={() => window.open(`https://wa.me/${ads[0].whatsapp_number}`, "_blank")}
                >
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </Button>
              )}
              {ads[0]?.external_link && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs gap-1.5"
                  onClick={() => window.open(ads[0].external_link, "_blank")}
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Site
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Dynamic Ad Popup */}
      <Dialog open={!!selectedAd} onOpenChange={(open) => !open && setSelectedAd(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedAd?.title}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-4">
              {selectedAd?.image_url && (
                <img src={selectedAd.image_url} alt={selectedAd.title} className="w-full rounded-xl object-contain max-h-64" />
              )}
              {selectedAd?.popup_content && (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedAd.popup_content}</p>
              )}
              {!selectedAd?.popup_content && selectedAd?.description && (
                <p className="text-sm text-muted-foreground">{selectedAd.description}</p>
              )}
              <div className="flex gap-2">
                {selectedAd?.whatsapp_number && (
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-1.5"
                    onClick={() => window.open(`https://wa.me/${selectedAd.whatsapp_number}`, "_blank")}
                  >
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </Button>
                )}
                {selectedAd?.external_link && (
                  <Button
                    variant="outline"
                    className="flex-1 gap-1.5"
                    onClick={() => window.open(selectedAd.external_link, "_blank")}
                  >
                    <ExternalLink className="w-4 h-4" /> Site
                  </Button>
                )}
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default StudentAds;
