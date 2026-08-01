import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AiShell from "@/components/ai/AiShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  AiCoach,
  AiCoachMessage,
  REQUEST_LABEL,
  fetchCoachMessages,
  sendCoachMessage,
  useAiCoaches,
} from "@/hooks/useAiCoaches";
import { Loader2, MapPin, MessageSquare, Send, Star, UserRound } from "lucide-react";

export default function AiCoaches() {
  const { user, coaches, requests, loading, requestCoach, cancelRequest } = useAiCoaches();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<AiCoach | null>(null);
  const [form, setForm] = useState({ goal: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiCoachMessage[]>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate("/ai/login?next=/ai/app/coaches");
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!chatId) return;
    fetchCoachMessages(chatId).then(setMessages);
  }, [chatId]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    if (!form.goal.trim()) {
      toast.error("Descreva seu objetivo.");
      return;
    }
    setBusy(true);
    try {
      await requestCoach(selected.id, form.goal.trim(), form.message.trim());
      setSelected(null);
      setForm({ goal: "", message: "" });
      toast.success("Solicitação enviada ao coach.");
    } catch {
      toast.error("Não foi possível enviar a solicitação.");
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    if (!chatId || !user?.id || !draft.trim()) return;
    setBusy(true);
    try {
      await sendCoachMessage(chatId, user.id, draft.trim());
      setDraft("");
      setMessages(await fetchCoachMessages(chatId));
    } catch {
      toast.error("Falha ao enviar a mensagem.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AiShell title="Coaches humanos" subtitle="Some a inteligência da STHIA ao acompanhamento de um profissional real.">
      {requests.length > 0 && (
        <Card className="mb-4 p-5">
          <h2 className="text-sm font-semibold">Minhas solicitações</h2>
          <div className="mt-3 space-y-2">
            {requests.map((r) => {
              const coach = coaches.find((c) => c.id === r.coach_id);
              return (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/40 bg-card/40 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{coach?.display_name ?? "Coach"}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{r.goal ?? "—"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={r.status === "accepted" ? "default" : "secondary"}>{REQUEST_LABEL[r.status] ?? r.status}</Badge>
                    <Button size="sm" variant="outline" onClick={() => setChatId(r.id)}>
                      <MessageSquare className="mr-2 h-4 w-4" /> Conversa
                    </Button>
                    {r.status === "pending" && (
                      <Button size="sm" variant="ghost" onClick={() => cancelRequest(r.id).catch(() => toast.error("Falha ao cancelar."))}>
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {coaches.length === 0 ? (
        <Card className="p-8 text-center">
          <UserRound className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">Nenhum coach disponível no momento</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Estamos aprovando os primeiros profissionais do marketplace. Volte em breve.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {coaches.map((c) => (
            <Card key={c.id} className="flex flex-col justify-between gap-4 p-5">
              <div>
                <div className="flex items-start gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-primary/15 text-primary">
                    {c.avatar_url ? (
                      <img src={c.avatar_url} alt={`Foto de ${c.display_name}`} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <UserRound className="h-5 w-5" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold">{c.display_name}</p>
                    <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{c.headline ?? "Coach STH METHOD"}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {c.city && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {c.city}
                        </span>
                      )}
                      {c.rating != null && (
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 text-amber-500" /> {Number(c.rating).toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {c.specialties.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {c.specialties.slice(0, 4).map((s) => (
                      <Badge key={s} variant="outline">{s}</Badge>
                    ))}
                  </div>
                )}
                {c.bio && <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{c.bio}</p>}
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">
                  {c.price_month != null
                    ? `R$ ${Number(c.price_month).toFixed(2).replace(".", ",")}/mês`
                    : "Sob consulta"}
                </p>
                <Button onClick={() => setSelected(c)}>Solicitar acompanhamento</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar {selected?.display_name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitRequest} className="space-y-3">
            <div>
              <Label htmlFor="goal">Seu objetivo</Label>
              <Input id="goal" value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} placeholder="Ex.: recomposição corporal em 12 semanas" />
            </div>
            <div>
              <Label htmlFor="msg">Mensagem (opcional)</Label>
              <Textarea id="msg" rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Enviar solicitação
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!chatId} onOpenChange={(o) => !o && setChatId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Conversa com o coach</DialogTitle>
          </DialogHeader>
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {messages.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda.</p>}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                  m.sender_id === user?.id ? "ml-auto bg-primary/15 text-foreground" : "bg-muted"
                }`}
              >
                {m.body}
                <span className="mt-1 block text-[10px] text-muted-foreground">
                  {new Date(m.created_at).toLocaleString("pt-BR")}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-end gap-2">
            <Textarea rows={2} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Escreva sua mensagem" />
            <Button onClick={send} disabled={busy || !draft.trim()} size="icon" aria-label="Enviar">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AiShell>
  );
}
