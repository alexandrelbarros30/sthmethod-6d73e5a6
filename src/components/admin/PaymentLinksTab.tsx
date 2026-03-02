import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { QrCode, CreditCard, Save, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PaymentLinksTab = () => {
  const qc = useQueryClient();

  const { data: plans } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: async () => {
      const { data } = await supabase.from("plans").select("*").eq("active", true).order("duration_days");
      return data || [];
    },
  });

  const { data: links } = useQuery({
    queryKey: ["plan-payment-links"],
    queryFn: async () => {
      const { data } = await supabase.from("plan_payment_links").select("*");
      return data || [];
    },
  });

  const getLink = (planId: string) =>
    links?.find((l: any) => l.plan_id === planId);

  const upsertMutation = useMutation({
    mutationFn: async (payload: {
      plan_id: string;
      pix_code: string;
      pix_enabled: boolean;
      card_link: string;
      card_enabled: boolean;
    }) => {
      const existing = getLink(payload.plan_id);
      if (existing) {
        const { error } = await supabase
          .from("plan_payment_links")
          .update({
            pix_code: payload.pix_code,
            pix_enabled: payload.pix_enabled,
            card_link: payload.card_link,
            card_enabled: payload.card_enabled,
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("plan_payment_links").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Links de pagamento salvos!");
      qc.invalidateQueries({ queryKey: ["plan-payment-links"] });
    },
    onError: () => toast.error("Erro ao salvar links"),
  });

  return (
    <div className="space-y-4">
      {plans?.map((plan: any) => (
        <PlanLinkCard
          key={plan.id}
          plan={plan}
          link={getLink(plan.id)}
          onSave={(data) => upsertMutation.mutate({ plan_id: plan.id, ...data })}
          saving={upsertMutation.isPending}
        />
      ))}
      {(!plans || plans.length === 0) && (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum plano ativo encontrado.</p>
      )}
    </div>
  );
};

const PlanLinkCard = ({
  plan,
  link,
  onSave,
  saving,
}: {
  plan: any;
  link: any;
  onSave: (data: { pix_code: string; pix_enabled: boolean; card_link: string; card_enabled: boolean }) => void;
  saving: boolean;
}) => {
  const [pixCode, setPixCode] = useState(link?.pix_code || "");
  const [pixEnabled, setPixEnabled] = useState(link?.pix_enabled ?? false);
  const [cardLink, setCardLink] = useState(link?.card_link || "");
  const [cardEnabled, setCardEnabled] = useState(link?.card_enabled ?? false);

  // Sync when data loads
  const linkId = link?.id;
  useState(() => {
    if (link) {
      setPixCode(link.pix_code || "");
      setPixEnabled(link.pix_enabled ?? false);
      setCardLink(link.card_link || "");
      setCardEnabled(link.card_enabled ?? false);
    }
  });

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-display">{plan.name}</CardTitle>
          <Badge variant="outline" className="text-xs">{plan.duration}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* PIX */}
        <div className="space-y-2 p-3 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">PIX</span>
            </div>
            <Switch checked={pixEnabled} onCheckedChange={setPixEnabled} />
          </div>
          {pixEnabled && (
            <div>
              <Label className="text-xs text-muted-foreground">Código PIX (copia e cola)</Label>
              <Textarea
                value={pixCode}
                onChange={(e) => setPixCode(e.target.value)}
                placeholder="Cole o código PIX aqui..."
                rows={3}
                className="mt-1 text-xs"
              />
            </div>
          )}
        </div>

        {/* Card */}
        <div className="space-y-2 p-3 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Cartão (Crédito / Débito)</span>
            </div>
            <Switch checked={cardEnabled} onCheckedChange={setCardEnabled} />
          </div>
          {cardEnabled && (
            <div>
              <Label className="text-xs text-muted-foreground">Link de pagamento (Mercado Pago)</Label>
              <Input
                value={cardLink}
                onChange={(e) => setCardLink(e.target.value)}
                placeholder="https://mpago.la/..."
                className="mt-1 text-xs"
              />
            </div>
          )}
        </div>

        <Button
          size="sm"
          className="w-full"
          disabled={saving}
          onClick={() => onSave({ pix_code: pixCode, pix_enabled: pixEnabled, card_link: cardLink, card_enabled: cardEnabled })}
        >
          {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
          Salvar Links
        </Button>
      </CardContent>
    </Card>
  );
};

export default PaymentLinksTab;
