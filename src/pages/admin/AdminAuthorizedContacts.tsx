import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Check, X, ShieldCheck, Loader2, Phone, User, Clock } from "lucide-react";
import { formatPhoneBR } from "@/lib/phone";

type Row = {
  id: string;
  user_id: string;
  holder_name: string;
  phone: string;
  relationship: string;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  review_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
};

const relLabels: Record<string, string> = {
  marido: "Marido",
  esposa: "Esposa",
  parceiro: "Parceiro(a)",
  pai_mae: "Pai / Mãe",
  filho_filha: "Filho(a)",
  responsavel: "Responsável legal",
  outro: "Outro",
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  approved: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  rejected: "bg-rose-500/15 text-rose-600 border-rose-500/30",
};

const AdminAuthorizedContacts = () => {
  const qc = useQueryClient();
  const [notes, setNotes] = useState<Record<string, string>>({});

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-authorized-contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("authorized_contacts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Row[];
    },
  });

  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-authorized-contacts-profiles", userIds],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone, email")
        .in("user_id", userIds);
      return data || [];
    },
  });
  const profileById = new Map(profiles.map((p: any) => [p.user_id, p]));

  const decide = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      const { data: session } = await supabase.auth.getSession();
      const { error } = await supabase
        .from("authorized_contacts")
        .update({
          status,
          review_notes: notes[id]?.trim() || null,
          reviewed_by: session.session?.user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      toast.success(vars.status === "approved" ? "Autorizado" : "Rejeitado");
      qc.invalidateQueries({ queryKey: ["admin-authorized-contacts"] });
    },
    onError: (e: any) => toast.error(e.message || "Falha ao atualizar"),
  });

  const pending = rows.filter((r) => r.status === "pending");
  const reviewed = rows.filter((r) => r.status !== "pending");

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-xl font-display font-bold">Telefones autorizados</h1>
          <p className="text-xs text-muted-foreground font-body">
            Solicitações de alunos para que outro telefone (marido, esposa, responsável) possa tratar do
            acompanhamento.
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Pendentes ({pending.length})
        </h2>
        {pending.length === 0 && !isLoading && (
          <p className="text-sm text-muted-foreground font-body">Nenhuma solicitação pendente.</p>
        )}
        {pending.map((r) => {
          const p = profileById.get(r.user_id) as any;
          return (
            <Card key={r.id} className="border-amber-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-display flex items-center gap-2 flex-wrap">
                  <User className="w-4 h-4 text-primary" />
                  {p?.full_name || "Aluno"}
                  <Badge variant="outline" className="text-[10px]">{p?.email || "—"}</Badge>
                  <Badge className={statusColors[r.status]}>Pendente</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm font-body">
                <div className="grid sm:grid-cols-2 gap-2 text-xs">
                  <div><span className="text-muted-foreground">Titular:</span> <strong>{r.holder_name}</strong></div>
                  <div><span className="text-muted-foreground">Relação:</span> {relLabels[r.relationship] || r.relationship}</div>
                  <div className="flex items-center gap-1"><Phone className="w-3 h-3 text-muted-foreground" /> {formatPhoneBR(r.phone)}</div>
                  <div className="text-muted-foreground">Tel. do aluno: {p?.phone ? formatPhoneBR(p.phone) : "—"}</div>
                </div>
                {r.reason && (
                  <div className="text-xs bg-muted/40 rounded p-2 border border-border">
                    <span className="text-muted-foreground">Motivo:</span> {r.reason}
                  </div>
                )}
                <Textarea
                  placeholder="Observações da revisão (opcional)"
                  value={notes[r.id] || ""}
                  onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })}
                  rows={2}
                  className="text-xs"
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-rose-600 border-rose-500/40 hover:bg-rose-500/10"
                    onClick={() => decide.mutate({ id: r.id, status: "rejected" })}
                    disabled={decide.isPending}
                  >
                    <X className="w-3.5 h-3.5 mr-1" /> Rejeitar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => decide.mutate({ id: r.id, status: "approved" })}
                    disabled={decide.isPending}
                  >
                    <Check className="w-3.5 h-3.5 mr-1" /> Autorizar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Histórico ({reviewed.length})
        </h2>
        {reviewed.map((r) => {
          const p = profileById.get(r.user_id) as any;
          return (
            <Card key={r.id}>
              <CardContent className="py-3 flex flex-wrap items-center gap-2 text-xs font-body">
                <Badge className={statusColors[r.status]}>
                  {r.status === "approved" ? "Autorizado" : "Rejeitado"}
                </Badge>
                <span className="font-semibold">{p?.full_name || "Aluno"}</span>
                <span className="text-muted-foreground">→ {r.holder_name} ({relLabels[r.relationship]}) · {formatPhoneBR(r.phone)}</span>
                <span className="ml-auto text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {r.reviewed_at ? new Date(r.reviewed_at).toLocaleString("pt-BR") : "—"}
                </span>
                {r.review_notes && (
                  <p className="w-full text-muted-foreground italic mt-1">"{r.review_notes}"</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
};

export default AdminAuthorizedContacts;