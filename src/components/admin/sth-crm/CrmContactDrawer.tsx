import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MessageCircle, Mail, Phone, Calendar, FileText, Activity, Send } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  contactId: string | null;
  onClose: () => void;
}

interface TimelineEvent {
  id: string;
  ts: string;
  type: "message" | "note" | "weight" | "payment" | "subscription";
  title: string;
  body?: string;
  meta?: string;
}

export default function CrmContactDrawer({ contactId, onClose }: Props) {
  const open = !!contactId;
  const qc = useQueryClient();
  const { user, profile } = useAuth();
  const [noteText, setNoteText] = useState("");

  const { data: contact } = useQuery({
    queryKey: ["sth-crm-contact", contactId],
    enabled: !!contactId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_contacts")
        .select("*")
        .eq("id", contactId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: timeline } = useQuery({
    queryKey: ["sth-crm-timeline", contactId, contact?.user_id],
    enabled: !!contactId,
    queryFn: async (): Promise<TimelineEvent[]> => {
      const events: TimelineEvent[] = [];

      // notes
      const { data: notes } = await supabase
        .from("crm_notes").select("id,body,author_name,created_at")
        .eq("contact_id", contactId!).order("created_at", { ascending: false }).limit(50);
      (notes || []).forEach((n: any) => events.push({
        id: `n-${n.id}`, ts: n.created_at, type: "note",
        title: `Anotação · ${n.author_name || "—"}`, body: n.body,
      }));

      // ticket messages
      const { data: tickets } = await supabase
        .from("crm_tickets").select("id").eq("contact_id", contactId!);
      const ticketIds = (tickets || []).map((t: any) => t.id);
      if (ticketIds.length) {
        const { data: msgs } = await supabase
          .from("crm_ticket_messages").select("id,body,direction,created_at,ticket_id")
          .in("ticket_id", ticketIds).order("created_at", { ascending: false }).limit(80);
        (msgs || []).forEach((m: any) => events.push({
          id: `m-${m.id}`, ts: m.created_at, type: "message",
          title: m.direction === "in" ? "Mensagem recebida" : "Mensagem enviada",
          body: m.body,
        }));
      }

      if (contact?.user_id) {
        const uid = contact.user_id;
        const [{ data: weights }, { data: pays }, { data: subs }] = await Promise.all([
          supabase.from("weight_logs").select("id,weight,notes,logged_at").eq("user_id", uid).order("logged_at", { ascending: false }).limit(20),
          supabase.from("payments").select("id,amount,status,method,created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(20),
          supabase.from("subscriptions").select("id,plan_id,status,start_date,end_date,created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(10),
        ]);
        (weights || []).forEach((w: any) => events.push({
          id: `w-${w.id}`, ts: w.logged_at, type: "weight",
          title: `Atualização de peso · ${Number(w.weight).toFixed(1)} kg`, body: w.notes || undefined,
        }));
        (pays || []).forEach((p: any) => events.push({
          id: `p-${p.id}`, ts: p.created_at, type: "payment",
          title: `Pagamento ${p.status} · ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(p.amount)}`,
          meta: p.method,
        }));
        (subs || []).forEach((s: any) => events.push({
          id: `s-${s.id}`, ts: s.created_at, type: "subscription",
          title: `Assinatura ${s.status}`,
          meta: `${s.start_date} → ${s.end_date}`,
        }));
      }

      events.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
      return events;
    },
  });

  const addNote = useMutation({
    mutationFn: async () => {
      if (!noteText.trim() || !contactId) return;
      const { error } = await supabase.from("crm_notes").insert({
        contact_id: contactId,
        author_id: user?.id,
        author_name: profile?.full_name || user?.email || "Admin",
        body: noteText.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNoteText("");
      toast.success("Anotação registrada");
      qc.invalidateQueries({ queryKey: ["sth-crm-timeline", contactId] });
    },
    onError: (e: any) => toast.error(e.message || "Falha ao salvar"),
  });

  const waLink = contact?.phone ? `https://wa.me/${String(contact.phone).replace(/\D/g, "")}` : null;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-xl">
            {contact?.full_name || "Contato"}
            {contact?.kind && (
              <Badge variant="outline" className={
                contact.kind === "student" ? "border-emerald-500/40 text-emerald-400" :
                contact.kind === "lead" ? "border-amber-500/40 text-amber-400" :
                "border-border/60 text-muted-foreground"
              }>
                {contact.kind === "student" ? "Aluno" : contact.kind === "lead" ? "Lead" : "—"}
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        {contact && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-2 rounded-xl border border-border/40 bg-card/40 p-3 text-xs">
              {contact.phone && (
                <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /><span className="font-mono">{contact.phone}</span></div>
              )}
              {contact.email && (
                <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" /><span>{contact.email}</span></div>
              )}
              {contact.plan_name && (
                <div className="flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-muted-foreground" />{contact.plan_name} · {contact.plan_status || "—"}</div>
              )}
              {contact.plan_end && (
                <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-muted-foreground" />Termina em {contact.plan_end}</div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {waLink && (
                <Button asChild size="sm" className="gap-2 bg-emerald-500 text-black hover:bg-emerald-400">
                  <a href={waLink} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" />WhatsApp</a>
                </Button>
              )}
              {(contact.tags || []).map((t: string) => (
                <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
              ))}
            </div>

            <Tabs defaultValue="timeline">
              <TabsList className="bg-muted/40">
                <TabsTrigger value="timeline" className="gap-1.5 text-xs"><Activity className="h-3 w-3" />Linha do tempo</TabsTrigger>
                <TabsTrigger value="note" className="gap-1.5 text-xs"><FileText className="h-3 w-3" />Anotação</TabsTrigger>
              </TabsList>

              <TabsContent value="timeline" className="mt-4 space-y-2">
                {(timeline || []).length === 0 && (
                  <p className="text-xs text-muted-foreground">Sem eventos ainda.</p>
                )}
                {(timeline || []).map((e) => (
                  <div key={e.id} className="rounded-lg border border-border/40 bg-card/40 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium">{e.title}</p>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(e.ts).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                      </span>
                    </div>
                    {e.body && <p className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">{e.body}</p>}
                    {e.meta && <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{e.meta}</p>}
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="note" className="mt-4 space-y-2">
                <Textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={5}
                  placeholder="Escreva uma anotação interna…"
                  className="bg-background/60"
                />
                <Button
                  onClick={() => addNote.mutate()}
                  disabled={!noteText.trim() || addNote.isPending}
                  className="gap-2 bg-emerald-500 text-black hover:bg-emerald-400"
                >
                  <Send className="h-4 w-4" />Salvar anotação
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}