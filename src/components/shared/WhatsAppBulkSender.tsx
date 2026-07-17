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
import { MessageCircle, Send, ChevronDown, AlertCircle, Search, Users, Filter } from "lucide-react";
import { normalizeSearch } from "@/lib/utils";
import { toast } from "sonner";

const BUILTIN_TEMPLATES = [
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

const getPrimarySubscriptionByUser = (subscriptions: any[]) => {
  const map = new Map<string, any>();

  subscriptions.forEach((subscription: any) => {
    const current = map.get(subscription.user_id);
    if (!current) {
      map.set(subscription.user_id, subscription);
      return;
    }

    const currentEnd = new Date(current.end_date || 0).getTime();
    const nextEnd = new Date(subscription.end_date || 0).getTime();
    if (nextEnd > currentEnd) {
      map.set(subscription.user_id, subscription);
    }
  });

  return map;
};

export default function WhatsAppBulkSender({ linkedStudentIds }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [templateId, setTemplateId] = useState("renovacao");
  const [customMessage, setCustomMessage] = useState("");
  const [tab, setTab] = useState("expiring");
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");

  // Plans query
  const { data: plans = [] } = useQuery({
    queryKey: ["wa-plans"],
    queryFn: async () => {
      const { data } = await supabase
        .from("plans")
        .select("id, name")
        .eq("active", true)
        .order("name");
      return data || [];
    },
    enabled: open,
  });

  // Active subscriptions for plan filtering
  const { data: activeSubscriptions = [] } = useQuery({
    queryKey: ["wa-active-subs", linkedStudentIds],
    queryFn: async () => {
      let query = supabase
        .from("subscriptions")
        .select("user_id, plan_id, plans(name)")
        .eq("status", "active");

      if (linkedStudentIds?.length) {
        query = query.in("user_id", linkedStudentIds);
      }

      const { data } = await query;
      return data || [];
    },
    enabled: open,
  });

  const primaryActiveSubscriptionMap = useMemo(
    () => getPrimarySubscriptionByUser(activeSubscriptions),
    [activeSubscriptions]
  );

  // DB templates query
  const { data: dbTemplates = [] } = useQuery({
    queryKey: ["wa-db-templates"],
    queryFn: async () => {
      const { data } = await supabase
        .from("message_templates")
        .select("id, title, content, message_categories(name)")
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: open,
  });

  // Merge builtin + DB templates
  const allTemplateOptions = useMemo(() => {
    const builtinOptions = BUILTIN_TEMPLATES.map((t) => ({
      id: t.id,
      label: t.label,
      type: "builtin" as const,
    }));
    const dbOptions = dbTemplates.map((t: any) => ({
      id: `db_${t.id}`,
      label: `📝 ${t.title}`,
      type: "db" as const,
      content: t.content,
      dbId: t.id,
    }));
    return [...builtinOptions, ...dbOptions];
  }, [dbTemplates]);

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

      const primarySubs = Array.from(getPrimarySubscriptionByUser(subs).values());

      const userIds = primarySubs.map((s: any) => s.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      const now2 = new Date();

      return primarySubs
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
    let list = allStudents;

    // Filter by plan
    if (planFilter !== "all") {
        const userIdsInPlan = new Set(
          Array.from(primaryActiveSubscriptionMap.values())
          .filter((s: any) => s.plan_id === planFilter)
          .map((s: any) => s.user_id)
      );
      list = list.filter((s) => userIdsInPlan.has(s.user_id));
    }

    // Filter by search
    if (search.trim()) {
      const q = normalizeSearch(search);
      list = list.filter(
        (s) => normalizeSearch(s.full_name).includes(q) || s.phone.includes(q) || normalizeSearch((s as any).email || "").includes(q)
      );
    }

    return list;
  }, [allStudents, search, planFilter, activeSubscriptions]);

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
    if (templateId === "custom") return customMessage.replace("{nome}", student.full_name).replace("{link}", renewLink);
    if (templateId.startsWith("db_")) {
      const opt = allTemplateOptions.find((t) => t.id === templateId);
      const content = (opt as any)?.content || "";
      return content.replace(/\{nome\}/gi, student.full_name).replace(/\{link\}/gi, renewLink);
    }
    const tpl = BUILTIN_TEMPLATES.find((t) => t.id === templateId);
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
                  {allTemplateOptions.map((t) => (
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

            {templateId.startsWith("db_") && (
              <div className="rounded-md border border-border/50 bg-muted/30 p-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Pré-visualização</p>
                <p className="text-xs whitespace-pre-wrap text-foreground/80">
                  {(() => {
                    const opt = allTemplateOptions.find((t) => t.id === templateId);
                    return ((opt as any)?.content || "").replace(/\{nome\}/gi, "Nome do Aluno").replace(/\{link\}/gi, "https://...");
                  })()}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">Variáveis suportadas: {"{nome}"}, {"{link}"}</p>
              </div>
            )}

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
                              onClick={(e) => {
                                e.preventDefault();
                                toggleStudent(student.user_id);
                              }}
                            >
                              <Checkbox
                                checked={selected.has(student.user_id)}
                                onCheckedChange={() => toggleStudent(student.user_id)}
                                onClick={(e) => e.stopPropagation()}
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
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Buscar nome, e-mail ou telefone..."
                      className="h-8 text-xs pl-8"
                    />
                  </div>
                  <Select value={planFilter} onValueChange={(val) => {
                    setPlanFilter(val);
                    if (val !== "all") {
                      const idsInPlan = allStudents
                        .filter((s) => {
                          const sub = primaryActiveSubscriptionMap.get(s.user_id);
                          const matchesPlan = sub?.plan_id === val;
                          return matchesPlan && s.phone && s.phone.trim() !== "";
                        })
                        .slice(0, 10)
                        .map((s) => s.user_id);
                      setSelected(new Set(idsInPlan));
                    } else {
                      setSelected(new Set());
                    }
                  }}>
                    <SelectTrigger className="h-8 text-xs w-[140px] shrink-0">
                      <Filter className="w-3 h-3 mr-1" />
                      <SelectValue placeholder="Plano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">Todos os planos</SelectItem>
                      {plans.map((p: any) => (
                        <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    {filteredAllStudents.map((student) => {
                      const hasPhone = student.phone && student.phone.trim() !== "";
                      return (
                        <div
                          key={student.user_id}
                          className={`flex items-center gap-3 py-2 px-2 rounded-md transition-colors ${hasPhone ? "hover:bg-muted/50 cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
                          onClick={(e) => {
                            e.preventDefault();
                            if (hasPhone) toggleStudent(student.user_id);
                          }}
                        >
                          <Checkbox
                            checked={selected.has(student.user_id)}
                            onCheckedChange={(e) => {
                              if (typeof e === "boolean" && hasPhone) toggleStudent(student.user_id);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            disabled={!hasPhone}
                            className="shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{student.full_name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {hasPhone ? student.phone : "Sem telefone cadastrado"}
                              {(() => {
                                const sub = primaryActiveSubscriptionMap.get(student.user_id);
                                const planName = (sub as any)?.plans?.name;
                                return planName ? ` • ${planName}` : "";
                              })()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {filteredAllStudents.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-3">Nenhum aluno encontrado.</p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>

            {/* Selected students summary */}
            {selected.size > 0 && (
              <div className="rounded-md border border-border/50 bg-muted/30 p-2 space-y-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Selecionados ({selected.size})</p>
                <div className="flex flex-wrap gap-1">
                  {(() => {
                    const allEntries = [...expiringStudents, ...allStudents];
                    const entryMap = new Map(allEntries.map((s) => [s.user_id, s]));
                    return Array.from(selected).map((id) => {
                      const s = entryMap.get(id);
                      return (
                        <Badge
                          key={id}
                          variant="secondary"
                          className="text-[10px] gap-1 cursor-pointer hover:bg-destructive/20 transition-colors"
                          onClick={() => toggleStudent(id)}
                        >
                          {s?.full_name || "Aluno"}
                          <span className="text-muted-foreground">✕</span>
                        </Badge>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

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
