import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Clock, ImageIcon, Copy, Eye, MessageCircle, Plus, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

type Consent = {
  id: string;
  token: string;
  user_id: string | null;
  payer_name: string;
  payer_phone: string | null;
  authorized: boolean | null;
  allow_tagging: boolean | null;
  social_handle: string | null;
  signature_name: string | null;
  responded_at: string | null;
  created_at: string;
};

const onlyDigits = (s: string) => s.replace(/\D/g, "");

export default function StudentImageConsentCard({ userId, studentName, studentPhone }: { userId: string; studentName?: string | null; studentPhone?: string | null }) {
  const [items, setItems] = useState<Consent[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("image_consents").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    setItems((data as any) || []);
    setLoading(false);
  }
  useEffect(() => { if (userId) load(); }, [userId]);

  const url = (token: string) => `${window.location.origin}/autorizacao-imagem/${token}`;

  async function createNew() {
    setCreating(true);
    const { data, error } = await supabase.from("profiles").select("full_name, email, phone").eq("user_id", userId).single();
    if (error) { toast({ title: "Erro", description: error.message }); setCreating(false); return; }
    const ins = await supabase.from("image_consents").insert({
      user_id: userId,
      payer_name: data?.full_name || studentName || "",
      payer_email: data?.email || null,
      payer_phone: data?.phone || studentPhone || null,
    }).select().single();
    setCreating(false);
    if (ins.error) { toast({ title: "Erro", description: ins.error.message }); return; }
    toast({ title: "Link de autorização criado" });
    if (ins.data?.token) {
      try { await navigator.clipboard.writeText(url(ins.data.token)); } catch {}
    }
    load();
  }

  function copyLink(token: string) {
    navigator.clipboard.writeText(url(token));
    toast({ title: "Link copiado" });
  }

  function preview(token: string) {
    window.open(url(token), "_blank", "noopener,noreferrer");
  }

  function sendWa(c: Consent) {
    const phone = onlyDigits(c.payer_phone || studentPhone || "");
    if (!phone) { toast({ title: "Sem telefone cadastrado" }); return; }
    const fullPhone = phone.startsWith("55") ? phone : `55${phone}`;
    const firstName = (c.payer_name || studentName || "").split(" ")[0];
    const msg =
      `Olá${firstName ? " " + firstName : ""}! Aqui é a STH METHOD.\n\n` +
      `Estamos solicitando sua autorização para uso de imagens (fotos de evolução) em nossas redes sociais e materiais institucionais.\n\n` +
      `Por padrão, as imagens são publicadas SEM identificação pessoal e SEM marcação do seu perfil. Você pode autorizar (ou não) e, se quiser, permitir a marcação.\n\n` +
      `Acesse e responda em 1 minuto:\n${url(c.token)}\n\n` +
      `Conte comigo. Bora pra cima 🚀`;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  function statusBadge(c: Consent) {
    if (c.authorized === true) return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30"><CheckCircle2 className="w-3 h-3 mr-1" />Autorizado</Badge>;
    if (c.authorized === false) return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Não autoriza</Badge>;
    return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
  }

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ImageIcon className="w-4 h-4" /> Autorização de uso de imagem
        </div>
        <div className="flex gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin/image-consents"><ExternalLink className="w-3.5 h-3.5 mr-1" />Gerenciar</Link>
          </Button>
          <Button size="sm" onClick={createNew} disabled={creating}>
            <Plus className="w-3.5 h-3.5 mr-1" />Novo link
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Carregando...</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhuma autorização registrada para este aluno.</p>
      ) : (
        <div className="space-y-2">
          {items.map((c) => (
            <div key={c.id} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {statusBadge(c)}
                  {c.authorized === true && (
                    <Badge variant="outline" className="text-[10px]">
                      {c.allow_tagging ? `Permite marcação${c.social_handle ? " · @" + c.social_handle.replace(/^@/, "") : ""}` : "Sem marcação"}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => copyLink(c.token)} title="Copiar"><Copy className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => preview(c.token)} title="Pré-visualizar"><Eye className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="outline" onClick={() => sendWa(c)}>
                    <MessageCircle className="w-3.5 h-3.5 mr-1" />WhatsApp
                  </Button>
                </div>
              </div>
              <div className="text-[11px] text-muted-foreground">
                Criado em {new Date(c.created_at).toLocaleString("pt-BR")}
                {c.responded_at && ` · Respondido em ${new Date(c.responded_at).toLocaleString("pt-BR")}`}
                {c.signature_name && ` · Assinatura: ${c.signature_name}`}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}