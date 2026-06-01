import { useStudentDossier } from "@/hooks/useStudentDossier";
import { formatPhoneBR } from "@/lib/phone";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Phone, Target, CreditCard, Activity, FileText, Image as ImageIcon, Scale } from "lucide-react";

function fmtDate(s: string | null | undefined): string {
  if (!s) return "—";
  try { return new Date(s).toLocaleDateString("pt-BR"); } catch { return "—"; }
}

export default function StudentDossier({ phone }: { phone: string | null }) {
  const { data, isLoading } = useStudentDossier(phone);

  if (!phone) {
    return (
      <div className="p-4 text-xs text-muted-foreground">
        Selecione uma conversa para ver o dossiê.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Carregando dossiê...
      </div>
    );
  }

  if (!data?.matched) {
    return (
      <div className="p-4 space-y-2">
        <p className="text-xs text-muted-foreground">Nenhum aluno encontrado com este telefone.</p>
        <Card className="p-3 text-xs">
          <div className="flex items-center gap-2"><Phone className="w-3 h-3" /> {formatPhoneBR(phone)}</div>
        </Card>
      </div>
    );
  }

  const p = data.profile!;
  const sub = data.subscription;
  const pay = data.payment;
  const subStatus = sub
    ? sub.days_remaining < 0 ? "Vencido"
      : sub.days_remaining <= 7 ? `Vence em ${sub.days_remaining}d`
      : `Ativo (${sub.days_remaining}d)`
    : "Sem assinatura";
  const subColor = sub
    ? sub.days_remaining < 0 ? "bg-rose-500/15 text-rose-400"
      : sub.days_remaining <= 7 ? "bg-amber-500/15 text-amber-400"
      : "bg-emerald-500/15 text-emerald-400"
    : "bg-zinc-500/15 text-zinc-400";

  return (
    <div className="p-4 space-y-3 overflow-y-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center overflow-hidden">
          {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-5 h-5" />}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{p.full_name || "Sem nome"}</p>
          <p className="text-[11px] text-muted-foreground truncate">{formatPhoneBR(p.phone)}</p>
        </div>
      </div>

      <Card className="p-3 space-y-2 text-xs">
        <div className="flex items-center gap-2"><Target className="w-3 h-3 text-muted-foreground" /> <span className="text-muted-foreground">Objetivo:</span> <span className="font-medium">{p.objective || "—"}</span></div>
        <div className="flex items-center gap-2"><Scale className="w-3 h-3 text-muted-foreground" /> <span className="text-muted-foreground">Peso atual:</span> <span className="font-medium">{p.weight ? `${p.weight} kg` : "—"}</span></div>
        {data.lastWeight && (
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground pl-5">
            Último log: {data.lastWeight.weight} kg em {fmtDate(data.lastWeight.logged_at)}
          </div>
        )}
      </Card>

      <Card className="p-3 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><CreditCard className="w-3 h-3 text-muted-foreground" /> <span className="font-medium">Assinatura</span></div>
          <Badge variant="outline" className={`text-[10px] border-0 ${subColor}`}>{subStatus}</Badge>
        </div>
        {sub ? (
          <>
            <div className="text-[11px]"><span className="text-muted-foreground">Plano:</span> {sub.plan_name || "—"}</div>
            <div className="text-[11px]"><span className="text-muted-foreground">Início:</span> {fmtDate(sub.start_date)}</div>
            <div className="text-[11px]"><span className="text-muted-foreground">Vencimento:</span> {fmtDate(sub.end_date)}</div>
          </>
        ) : (
          <div className="text-[11px] text-muted-foreground">Nenhuma assinatura registrada.</div>
        )}
      </Card>

      <Card className="p-3 space-y-2 text-xs">
        <div className="flex items-center gap-2"><Activity className="w-3 h-3 text-muted-foreground" /> <span className="font-medium">Último pagamento</span></div>
        {pay ? (
          <>
            <div className="text-[11px]"><span className="text-muted-foreground">Status:</span> <span className={pay.status === "approved" ? "text-emerald-400" : pay.status === "pending" ? "text-amber-400" : "text-rose-400"}>{pay.status}</span></div>
            <div className="text-[11px]"><span className="text-muted-foreground">Valor:</span> R$ {Number(pay.amount).toFixed(2)}</div>
            <div className="text-[11px]"><span className="text-muted-foreground">Método:</span> {pay.method || "—"} · {pay.action_type || ""}</div>
            <div className="text-[11px]"><span className="text-muted-foreground">Em:</span> {fmtDate(pay.created_at)}</div>
          </>
        ) : (
          <div className="text-[11px] text-muted-foreground">Sem pagamentos.</div>
        )}
      </Card>

      <Card className="p-3 space-y-1.5 text-xs">
        <div className="font-medium mb-1">Últimas atualizações</div>
        <div className="text-[11px] flex justify-between"><span className="text-muted-foreground">Dieta</span><span>{fmtDate(data.lastUpdates.diet_at)}</span></div>
        <div className="text-[11px] flex justify-between"><span className="text-muted-foreground">Treino</span><span>{fmtDate(data.lastUpdates.training_at)}</span></div>
        <div className="text-[11px] flex justify-between"><span className="text-muted-foreground">Protocolo</span><span>{fmtDate(data.lastUpdates.protocol_at)}</span></div>
      </Card>

      <Card className="p-3 grid grid-cols-3 gap-2 text-center text-xs">
        <div><FileText className="w-3.5 h-3.5 mx-auto mb-1 text-muted-foreground" /><div className="font-semibold">{data.counts.documents}</div><div className="text-[10px] text-muted-foreground">Exames</div></div>
        <div><ImageIcon className="w-3.5 h-3.5 mx-auto mb-1 text-muted-foreground" /><div className="font-semibold">{data.counts.body_images}</div><div className="text-[10px] text-muted-foreground">Fotos</div></div>
        <div><Scale className="w-3.5 h-3.5 mx-auto mb-1 text-muted-foreground" /><div className="font-semibold">{data.counts.weight_logs}</div><div className="text-[10px] text-muted-foreground">Pesos</div></div>
      </Card>
    </div>
  );
}