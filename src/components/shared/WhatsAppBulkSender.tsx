import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Send, ChevronDown, AlertCircle, Search, Users } from "lucide-react";
import { toast } from "sonner";

const MESSAGE_TEMPLATES = [
  {
    id: "custom",
    label: "✏️ Personalizada",
    build: (_name: string, _link: string) => "",
  },
  {
    id: "cobranca",
    label: "💰 Cobrança",
    build: (name: string, link: string) =>
      `Olá ${name}! Tudo bem?\n\nIdentificamos que seu pagamento está pendente. Para manter seu acesso ativo, por favor regularize o quanto antes.${link ? `\n\nSegue seu link de pagamento:\n${link}` : ""}\n\nQualquer dúvida, estou à disposição! 😊`,
  },
  {
    id: "boas-vindas",
    label: "👋 Boas-vindas",
    build: (name: string, _link: string) =>
      `Olá ${name}! Seja muito bem-vindo(a)! 🎉\n\nEstamos felizes em ter você com a gente. Qualquer dúvida sobre seu plano, treinos ou dieta, é só me chamar aqui!\n\nVamos juntos nessa jornada! 💪`,
  },
  {
    id: "renovacao",
    label: "🔄 Renovação",
    build: (name: string, link: string) =>
      `Olá ${name}! Tudo bem?\n\nSeu plano está próximo do vencimento. Renove agora para continuar evoluindo sem interrupção!${link ? `\n\nSegue seu link de renovação:\n${link}` : ""}\n\nConte comigo! 🚀`,
  },
  {
    id: "lembrete",
    label: "📋 Lembrete geral",
    build: (name: string, _link: string) =>
      `Olá ${name}! Tudo bem?\n\nPassando para lembrar que estou acompanhando sua evolução. Se tiver alguma dúvida ou precisar de ajuste no treino/dieta, me avise!\n\nBora manter o foco! 💪`,
  },
  {
    id: "aniversario",
    label: "🎂 Aniversário",
    build: (name: string, _link: string) =>
      `Parabéns, ${name}! 🎉🎂\n\nDesejo um dia incrível pra você! Que esse novo ciclo seja repleto de conquistas — dentro e fora da academia!\n\nConte sempre comigo! 🥳`,
  },
];

interface StudentEntry {
  user_id: string;
  full_name: string;
  phone: string;
  end_date?: string;
  days_left?: number;
  plan_name?: string;
}

interface Props {
  linkedStudentIds?: string[];
}

export default function WhatsAppBulkSender({ linkedStudentIds }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [templateId, setTemplateId] = useState("renovacao");
  const [customMessage, setCustomMessage] = useState("");
  const [tab, setTab] = useState("expiring");
  const [search, setSearch] = useState("");

  // Expiring students query
  const { data: expiringStudents = [] } = useQuery({
    queryKey: ["expiring-students-wa", linkedStudentIds],
    queryFn: async () => {
      const now = new Date();
      const in3Days = new Date(now.getTime() + 3 * 86400000);

      let query = supabase
        .from("subscriptions")
        .select("user_id, end_date, status, plans(name)")
        .eq("status", "active")
        .lte("end_date", in3Days.toISOString().split("T")[0])
        .gte("end_date", now.toISOString().split("T")[0]);

      if (linkedStudentIds?.length) {
        query = query.in("user_id", linkedStudentIds);
      }

      const { data: subs } = await query;
      if (!subs?.length) return [];

      const userIds = subs.map((s: any) => s.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      const now2 = new Date();

      return subs
        .map((s: any) => {
          const profile = profileMap.get(s.user_id);
          if (!profile?.phone) return null;
          const endDate = new Date(s.end_date);
          const daysLeft = Math.ceil((endDate.getTime() - now2.getTime()) / 86400000);
          return {
            user_id: s.user_id,
            full_name: profile.full_name || "Aluno",
            phone: profile.phone,
            end_date: s.end_date,
            days_left: daysLeft,
            plan_name: (s as any).plans?.name || "Plano",
          } as StudentEntry;
        })
        .filter(Boolean) as StudentEntry[];
    },
  });

  // All students with phone query
  const { data: allStudents = [] } = useQuery({
    queryKey: ["all-students-wa", linkedStudentIds],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("user_id, full_name, phone, email")
        .order("full_name", { ascending: true });

      if (linkedStudentIds?.length) {
        query = query.in("user_id", linkedStudentIds);
      }

      const { data } = await query;
      return (data || []).map((p: any) => ({
        user_id: p.user_id,
        full_name: p.full_name || "Aluno",
        phone: p.phone || "",
        email: p.email || "",
      })) as (StudentEntry & { email?: string })[];
    },
    enabled: open,
  });

  const filteredAllStudents = useMemo(() => {
    if (!search.trim()) return allStudents.slice(0, 50);
    const q = search.toLowerCase();
    return allStudents.filter(
      (s) => s.full_name.toLowerCase().includes(q) || s.phone.includes(q)
    ).slice(0, 50);
  }, [allStudents, search]);

  const currentList = tab === "expiring" ? expiringStudents : filteredAllStudents;

  const toggleStudent = (userId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else if (next.size < 10) {
        next.add(userId);
      } else {
        toast.error("Máximo de 10 alunos por vez");
      }
      return next;
    });
  };

  const selectAll = () => {
    const slice = currentList.slice(0, 10);
    setSelected(new Set(slice.map((s) => s.user_id)));
  };

  const buildMessage = (student: StudentEntry) => {
    const renewLink = `${window.location.origin}/dashboard/renew?uid=${student.user_id}`;
    const tpl = MESSAGE_TEMPLATES.find((t) => t.id === templateId);
    if (templateId === "custom") return customMessage.replace("{nome}", student.full_name).replace("{link}", renewLink);
    return tpl?.build(student.full_name, renewLink) || "";
  };

  const sendAll = () => {
    const allEntries = [...expiringStudents, ...allStudents];
    const entryMap = new Map(allEntries.map((s) => [s.user_id, s]));
    const students = Array.from(selected).map((id) => entryMap.get(id)).filter(Boolean) as StudentEntry[];

    if (students.length === 0) {
      toast.error("Selecione ao menos um aluno");
      return;
    }

    students.forEach((student, index) => {
      const rawPhone = student.phone.replace(/\D/g, "");
      const phone = rawPhone.startsWith("55") ? rawPhone : `55${rawPhone}`;
      const message = buildMessage(student);
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

      setTimeout(() => {
        window.open(url, "_blank");
      }, index * 800);
    });

    toast.success(`Abrindo ${students.length} conversa(s) no WhatsApp`);
  };

  const getDayBadge = (days: number) => {
    if (days <= 0) return { className: "bg-destructive/10 text-destructive border-destructive/30", label: "Hoje" };
    if (days === 1) return { className: "bg-destructive/10 text-destructive border-destructive/30", label: "1 dia" };
    if (days === 2) return { className: "bg-warning/10 text-warning border-warning/30", label: "2 dias" };
    return { className: "bg-warning/10 text-warning border-warning/30", label: `${days} dias` };
  };

  const totalBadge = expiringStudents.length + (selected.size > 0 ? 0 : 0);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="border-[#25D366]/20 bg-[#25D366]/5">
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              WhatsApp em Massa
              {expiringStudents.length > 0 && (
                <Badge variant="default" className="ml-2 bg-warning text-warning-foreground">
                  {expiringStudents.length} vencendo
                </Badge>
              )}
              <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${open ? "rotate-180" : ""}`} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            {/* Template selector - always visible */}
            <div>
              <Label className="text-xs">Template da mensagem</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MESSAGE_TEMPLATES.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="text-xs">
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {templateId === "custom" && (
              <div>
                <Label className="text-xs">Mensagem personalizada</Label>
                <Textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={3}
                  className="text-xs resize-none"
                  placeholder="Use {nome} e {link} como variáveis"
                />
                <p className="text-[10px] text-muted-foreground mt-0.5">Variáveis: {"{nome}"}, {"{link}"}</p>
              </div>
            )}

            {/* Tabs: Expiring vs All */}
            <Tabs value={tab} onValueChange={setTab} className="w-full">
              <TabsList className="w-full h-8">
                <TabsTrigger value="expiring" className="flex-1 text-xs gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Vencendo
                  {expiringStudents.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{expiringStudents.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="all" className="flex-1 text-xs gap-1">
                  <Users className="w-3 h-3" />
                  Todos os alunos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="expiring" className="mt-3 space-y-3">
                {expiringStudents.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2 text-center">Nenhum aluno com plano vencendo em 3 dias.</p>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {selected.size} selecionados (máx 10)
                      </p>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={selectAll}>
                          Selecionar todos
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => setSelected(new Set())}>
                          Limpar
                        </Button>
                      </div>
                    </div>
                    <ScrollArea className="max-h-[250px]">
                      <div className="space-y-1">
                        {expiringStudents.map((student) => {
                          const dayBadge = getDayBadge(student.days_left ?? 0);
                          return (
                            <div
                              key={student.user_id}
                              className="flex items-center gap-3 py-2 px-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                              onClick={() => toggleStudent(student.user_id)}
                            >
                              <Checkbox
                                checked={selected.has(student.user_id)}
                                onCheckedChange={() => toggleStudent(student.user_id)}
                                className="shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{student.full_name}</p>
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {student.plan_name} • Vence: {new Date(student.end_date!).toLocaleDateString("pt-BR")}
                                </p>
                              </div>
                              <Badge variant="outline" className={`text-[10px] shrink-0 ${dayBadge.className}`}>
                                <AlertCircle className="w-3 h-3 mr-1" />
                                {dayBadge.label}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </>
                )}
              </TabsContent>

              <TabsContent value="all" className="mt-3 space-y-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nome ou telefone..."
                    className="h-8 text-xs pl-8"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {selected.size} selecionados (máx 10)
                  </p>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={selectAll}>
                      Selecionar todos
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => setSelected(new Set())}>
                      Limpar
                    </Button>
                  </div>
                </div>
                <ScrollArea className="max-h-[250px]">
                  <div className="space-y-1">
                    {filteredAllStudents.map((student) => (
                      <div
                        key={student.user_id}
                        className="flex items-center gap-3 py-2 px-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => toggleStudent(student.user_id)}
                      >
                        <Checkbox
                          checked={selected.has(student.user_id)}
                          onCheckedChange={() => toggleStudent(student.user_id)}
                          className="shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{student.full_name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{student.phone}</p>
                        </div>
                      </div>
                    ))}
                    {filteredAllStudents.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-3">Nenhum aluno encontrado.</p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>

            {/* Send button */}
            <Button
              size="sm"
              className="w-full gap-1.5 bg-[#25D366] hover:bg-[#25D366]/90 text-white"
              onClick={sendAll}
              disabled={selected.size === 0}
            >
              <Send className="w-3.5 h-3.5" />
              Enviar para {selected.size} aluno{selected.size !== 1 ? "s" : ""}
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
