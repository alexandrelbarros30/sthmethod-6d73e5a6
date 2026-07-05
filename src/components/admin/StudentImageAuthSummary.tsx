import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, ImageIcon, UserCheck, UserX, Loader2 } from "lucide-react";

type Consent = {
  id: string;
  authorized: boolean | null;
  allow_tagging: boolean | null;
  social_handle: string | null;
  signature_name: string | null;
  responded_at: string | null;
  created_at: string;
};

export default function StudentImageAuthSummary({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(true);
  const [consent, setConsent] = useState<Consent | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      // Prioriza o último respondido; se não houver, pega o mais recente criado.
      const { data } = await supabase
        .from("image_consents")
        .select("id, authorized, allow_tagging, social_handle, signature_name, responded_at, created_at")
        .eq("user_id", userId)
        .order("responded_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(1);
      if (!mounted) return;
      setConsent(((data as any) || [])[0] || null);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="w-3 h-3 animate-spin" /> Carregando autorização...
      </div>
    );
  }

  if (!consent) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary" className="gap-1"><ImageIcon className="w-3 h-3" /> Sem registro</Badge>
        <span className="text-[11px] text-muted-foreground">Nenhum termo de imagem foi enviado a este aluno.</span>
      </div>
    );
  }

  const status = consent.authorized;
  const withId = !!consent.allow_tagging;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {status === true && (
        <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 gap-1">
          <CheckCircle2 className="w-3 h-3" /> Autoriza uso de imagem
        </Badge>
      )}
      {status === false && (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="w-3 h-3" /> Não autoriza
        </Badge>
      )}
      {status === null && (
        <Badge variant="secondary" className="gap-1">
          <Clock className="w-3 h-3" /> Pendente de resposta
        </Badge>
      )}

      {status === true && (
        withId ? (
          <Badge variant="outline" className="gap-1 border-primary/40 text-primary">
            <UserCheck className="w-3 h-3" /> Com identificação
            {consent.social_handle ? ` · @${consent.social_handle.replace(/^@/, "")}` : ""}
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1">
            <UserX className="w-3 h-3" /> Sem identificação
          </Badge>
        )
      )}

      <span className="text-[11px] text-muted-foreground">
        {consent.responded_at
          ? `Respondido em ${new Date(consent.responded_at).toLocaleDateString("pt-BR")}`
          : `Enviado em ${new Date(consent.created_at).toLocaleDateString("pt-BR")}`}
        {consent.signature_name ? ` · Assinatura: ${consent.signature_name}` : ""}
      </span>
    </div>
  );
}