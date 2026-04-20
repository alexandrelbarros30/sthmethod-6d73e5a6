import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { QrCode, CreditCard, Save, Loader2, Flame, Copy, Check, MessageCircle, UserPlus } from "lucide-react";
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
      title: string;
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
            title: payload.title,
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
    <div className="space-y-6">
      <PromoLinksSection />
      <PersonalizedPromoLinkSection />

      <div>
        <h3 className="text-sm font-display font-semibold text-foreground mb-3">
          Links manuais por plano (PIX / Cartão)
        </h3>
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
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Personalized promo link per student
// ─────────────────────────────────────────────────────────────
const PersonalizedPromoLinkSection = () => {
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedSlug, setSelectedSlug] = useState<string>("turbo-30d");
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const { data: students } = useQuery({
    queryKey: ["promo-students-search", search],
    queryFn: async () => {
      let q = supabase
        .from("profiles")
        .select("user_id, full_name, email, phone")
        .order("full_name")
        .limit(20);
      if (search.trim()) {
        const term = `%${search.trim()}%`;
        q = q.or(`full_name.ilike.${term},email.ilike.${term},phone.ilike.${term}`);
      }
      const { data } = await q;
      return data || [];
    },
  });

  const buildUrl = () => {
    if (!selectedStudent) return "";
    const params = new URLSearchParams();
    if (selectedStudent.email) params.set("email", selectedStudent.email);
    if (selectedStudent.full_name) params.set("name", selectedStudent.full_name);
    if (selectedStudent.phone) params.set("phone", String(selectedStudent.phone).replace(/\D/g, ""));
    params.set("redirect", `/promo/${selectedSlug}`);
    return `${origin}/cadastro?${params.toString()}`;
  };

  const planMeta = PROMO_LINKS.find((p) => p.slug === selectedSlug)!;

  const copy = () => {
    const url = buildUrl();
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link personalizado copiado!");
    setTimeout(() => setCopied(false), 2500);
  };

  const sendWhatsApp = () => {
    if (!selectedStudent) return;
    const url = buildUrl();
    const firstName = (selectedStudent.full_name || "").split(" ")[0] || "aluno(a)";
    const msg = encodeURIComponent(
      `Olá *${firstName}*! 🔥\n\nSeparei um link exclusivo seu para a *Promoção STH METHOD* (válida até 24/04):\n\n*${planMeta.label}* — *${planMeta.price}* (PIX)\n\n${url}\n\nBasta clicar, finalizar o cadastro (já vem com seus dados) e o pagamento abre direto no PIX.`
    );
    const phoneDigits = String(selectedStudent.phone || "").replace(/\D/g, "");
    const waUrl = phoneDigits
      ? `https://wa.me/55${phoneDigits.replace(/^55/, "")}?text=${msg}`
      : `https://wa.me/?text=${msg}`;
    window.open(waUrl, "_blank");
  };

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-card border-primary/40">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm font-display">Link personalizado por aluno</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Selecione um aluno e gere um link exclusivo já com os dados dele preenchidos no cadastro da promoção.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Buscar aluno (nome, email ou telefone)</Label>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Digite para filtrar..."
            className="h-9 text-sm"
          />
          {students && students.length > 0 && (
            <div className="max-h-48 overflow-y-auto rounded-lg border border-border bg-background/50 divide-y divide-border">
              {students.map((s: any) => {
                const active = selectedStudent?.user_id === s.user_id;
                return (
                  <button
                    key={s.user_id}
                    type="button"
                    onClick={() => setSelectedStudent(s)}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                      active ? "bg-primary/15 text-foreground" : "hover:bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    <div className="font-medium text-foreground truncate">{s.full_name || "Sem nome"}</div>
                    <div className="text-[10px] truncate">{s.email} {s.phone ? `• ${s.phone}` : ""}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Plano da promoção</Label>
          <div className="grid grid-cols-3 gap-2">
            {PROMO_LINKS.map((p) => (
              <button
                key={p.slug}
                type="button"
                onClick={() => setSelectedSlug(p.slug)}
                className={`rounded-lg border p-2 text-left transition-all ${
                  selectedSlug === p.slug
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background/50 hover:border-primary/50"
                }`}
              >
                <div className="text-[11px] font-semibold text-foreground">{p.label}</div>
                <div className="text-[10px] text-muted-foreground">{p.price}</div>
              </button>
            ))}
          </div>
        </div>

        {selectedStudent && (
          <div className="rounded-lg border border-border bg-background/50 p-2.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Link gerado</p>
            <p className="text-[11px] text-foreground break-all font-mono">{buildUrl()}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={copy}
            disabled={!selectedStudent}
            className="flex-1 h-9"
          >
            {copied ? (
              <><Check className="w-3.5 h-3.5 mr-1" />Copiado</>
            ) : (
              <><Copy className="w-3.5 h-3.5 mr-1" />Copiar link</>
            )}
          </Button>
          <Button
            size="sm"
            onClick={sendWhatsApp}
            disabled={!selectedStudent}
            className="flex-1 h-9 bg-[#25D366] hover:bg-[#20BD5C] text-white"
          >
            <MessageCircle className="w-3.5 h-3.5 mr-1" />Enviar WhatsApp
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────
// Promo Abril direct-link section
// ─────────────────────────────────────────────────────────────
const PROMO_LINKS = [
  { slug: "turbo-30d", label: "Turbo 30D", price: "R$ 85,90", duration: "30 dias" },
  { slug: "impulso-90d", label: "Impulso 90D", price: "R$ 209,90", duration: "90 dias" },
  { slug: "premium-6m", label: "Premium 6M", price: "R$ 449,90", duration: "6 meses" },
];

const PromoLinksSection = () => {
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const copyLink = (slug: string) => {
    const url = `${origin}/promo/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    toast.success("Link copiado!");
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  const sendWhatsApp = (slug: string, label: string, price: string) => {
    const url = `${origin}/promo/${slug}`;
    const msg = encodeURIComponent(
      `🔥 *Promoção STH METHOD — válida até 24/04*\n\nPlano *${label}* por *${price}* (exclusivo PIX).\n\nClique para garantir agora:\n${url}`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-card border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm font-display">Promoção Abril — Links diretos PIX</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Compartilhe estes links com alunos. Cada link abre direto no checkout PIX do plano correspondente.
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {PROMO_LINKS.map((p) => {
          const url = `${origin}/promo/${p.slug}`;
          return (
            <div
              key={p.slug}
              className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg border border-border bg-background/50"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{p.label}</span>
                  <Badge variant="outline" className="text-[10px]">{p.price}</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">{url}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyLink(p.slug)}
                  className="h-8 px-3"
                >
                  {copiedSlug === p.slug ? (
                    <><Check className="w-3.5 h-3.5 mr-1" />Copiado</>
                  ) : (
                    <><Copy className="w-3.5 h-3.5 mr-1" />Copiar</>
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={() => sendWhatsApp(p.slug, p.label, p.price)}
                  className="h-8 px-3 bg-[#25D366] hover:bg-[#20BD5C] text-white"
                >
                  <MessageCircle className="w-3.5 h-3.5 mr-1" />WhatsApp
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
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
  onSave: (data: { title: string; pix_code: string; pix_enabled: boolean; card_link: string; card_enabled: boolean }) => void;
  saving: boolean;
}) => {
  const [title, setTitle] = useState(link?.title || plan.name);
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
