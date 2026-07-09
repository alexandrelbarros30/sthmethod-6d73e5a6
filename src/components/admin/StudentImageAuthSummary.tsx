import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, ImageIcon, UserCheck, UserX, Loader2, FileText, ShieldCheck, Megaphone, BookOpen } from "lucide-react";

type Consent = {
  id: string;
  authorized: boolean | null;
  allow_tagging: boolean | null;
  social_handle: string | null;
  signature_name: string | null;
  responded_at: string | null;
  created_at: string;
};

type Acceptance = {
  document_type: string;
  document_version: string | null;
  accepted: boolean | null;
  option_value: string | null;
  accepted_at: string | null;
};

const DOC_META: Record<string, { label: string; Icon: any }> = {
  terms: { label: "Termo", Icon: FileText },
  privacy: { label: "Privacidade", Icon: ShieldCheck },
  program_nature: { label: "Ciência programa", Icon: BookOpen },
  marketing: { label: "Marketing", Icon: Megaphone },
};

function StatusBadge({ ok, label, Icon, version, when }: { ok: boolean | null; label: string; Icon: any; version?: string | null; when?: string | null }) {
  const cls =
    ok === true
      ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
      : ok === false
      ? "bg-destructive/15 text-destructive border-destructive/30"
      : "bg-muted text-muted-foreground border-border";
  const status = ok === true ? "Sim" : ok === false ? "Não" : "Sem registro";
  return (
    <div className="flex flex-col gap-0.5">
      <Badge variant="outline" className={`gap-1 justify-start ${cls}`}>
        <Icon className="w-3 h-3" /> {label}: {status}
      </Badge>
      {(version || when) && (
        <span className="text-[10px] text-muted-foreground pl-1">
          {version ? `v${version}` : ""}
          {version && when ? " · " : ""}
          {when ? new Date(when).toLocaleDateString("pt-BR") : ""}
        </span>
      )}
    </div>
  );
}

export default function StudentImageAuthSummary({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(true);
  const [consent, setConsent] = useState<Consent | null>(null);
  const [acceptances, setAcceptances] = useState<Record<string, Acceptance>>({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const [{ data: c }, { data: la }] = await Promise.all([
        supabase
          .from("image_consents")
          .select("id, authorized, allow_tagging, social_handle, signature_name, responded_at, created_at")
          .eq("user_id", userId)
          .order("responded_at", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("legal_acceptances")
          .select("document_type, document_version, accepted, option_value, accepted_at")
          .eq("user_id", userId)
          .order("accepted_at", { ascending: false }),
      ]);
      if (!mounted) return;
      setConsent(((c as any) || [])[0] || null);
      // Mantém o mais recente por document_type
      const latest: Record<string, Acceptance> = {};
      for (const row of ((la as any) || []) as Acceptance[]) {
        const cur = latest[row.document_type];
        const rowAt = row.accepted_at ? new Date(row.accepted_at).getTime() : 0;
        const curAt = cur?.accepted_at ? new Date(cur.accepted_at).getTime() : -1;
        if (!cur || rowAt > curAt) latest[row.document_type] = row;
      }
      setAcceptances(latest);
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

  const status = consent?.authorized ?? null;
  const withId = !!consent?.allow_tagging;
  const imageUseAcc = acceptances["image_use"]; // aceite no cadastro/checkout
  // Efetivo do uso de imagem: image_consents (link) > legal_acceptances.image_use
  const effectiveImage: "com" | "sem" | "nao" | "pendente" =
    status === true ? (withId ? "com" : "sem")
    : status === false ? "nao"
    : imageUseAcc?.option_value === "com_identificacao" ? "com"
    : imageUseAcc?.option_value === "sem_identificacao" ? "sem"
    : imageUseAcc?.option_value === "nao_autorizo" ? "nao"
    : "pendente";

  return (
    <div className="space-y-3">
      {/* Grade de termos legais (aceites feitos no cadastro/checkout) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(["terms", "privacy", "program_nature", "marketing"] as const).map((k) => {
          const a = acceptances[k];
          const meta = DOC_META[k];
          return (
            <StatusBadge
              key={k}
              ok={a ? !!a.accepted : null}
              label={meta.label}
              Icon={meta.Icon}
              version={a?.document_version || null}
              when={a?.accepted_at || null}
            />
          );
        })}
      </div>

      {/* Uso de imagem consolidado */}
      <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-border/40">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mr-1">
          Uso de imagem:
        </span>
        {effectiveImage === "com" && (
          <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 gap-1">
            <UserCheck className="w-3 h-3" /> Com identificação
            {consent?.social_handle ? ` · @${consent.social_handle.replace(/^@/, "")}` : ""}
          </Badge>
        )}
        {effectiveImage === "sem" && (
          <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 gap-1">
            <UserX className="w-3 h-3" /> Sem identificação
          </Badge>
        )}
        {effectiveImage === "nao" && (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="w-3 h-3" /> Não autoriza
          </Badge>
        )}
        {effectiveImage === "pendente" && (
          <Badge variant="secondary" className="gap-1">
            <ImageIcon className="w-3 h-3" /> Sem registro
          </Badge>
        )}

        <span className="text-[11px] text-muted-foreground">
          {consent?.responded_at
            ? `Link respondido em ${new Date(consent.responded_at).toLocaleDateString("pt-BR")}`
            : consent?.created_at
            ? `Link enviado em ${new Date(consent.created_at).toLocaleDateString("pt-BR")}`
            : imageUseAcc?.accepted_at
            ? `Aceito no cadastro em ${new Date(imageUseAcc.accepted_at).toLocaleDateString("pt-BR")}`
            : ""}
          {consent?.signature_name ? ` · Assinatura: ${consent.signature_name}` : ""}
        </span>
      </div>
    </div>
  );
}