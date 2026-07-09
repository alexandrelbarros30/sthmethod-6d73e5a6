import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Trash2, Eye, Send, FileText, Pill, Copy, Download, Pencil } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { normalizeSearch } from "@/lib/utils";

interface BudgetItem {
  name: string;
  dosage: string;
  quantity: string;
  unit_price: number;
  subtotal: number;
  category: string;
  origin?: string;
}

const categoryLabels: Record<string, string> = {
  endocrino: "Endócrino Hormonal / Peptídeos",
  cardiovascular: "Cardiovascular / Hepático / Renal",
  metabolico: "Metabólico e Performance",
  pre_pos_treino: "Pré / Pós Treino",
  extra: "Outros",
};

const categoryColors: Record<string, string> = {
  endocrino: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  cardiovascular: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  metabolico: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  pre_pos_treino: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  extra: "bg-muted text-muted-foreground",
};

const AdminBudgets = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewBudget, setPreviewBudget] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Budget form
  const [budgetTitle, setBudgetTitle] = useState("Orçamento de Suplementos");
  const [budgetNotes, setBudgetNotes] = useState("");
  const [budgetDuration, setBudgetDuration] = useState("");
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);

  // Fetch students
  const { data: students } = useQuery({
    queryKey: ["budget-students"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, email, phone");
      return profiles || [];
    },
  });

  // Fetch budgets
  const { data: budgets } = useQuery({
    queryKey: ["supplement-budgets"],
    queryFn: async () => {
      const { data } = await supabase.from("supplement_budgets").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  // Fetch protocol data for selected student
  const { data: protocolData } = useQuery({
    queryKey: ["budget-protocol", selectedStudent?.user_id],
    enabled: !!selectedStudent?.user_id,
    queryFn: async () => {
      const userId = selectedStudent.user_id;
      const [categoryContentRes, extraCatsRes, studentProtocolsRes] = await Promise.all([
        supabase.from("protocol_category_content" as any).select("*").eq("user_id", userId),
        supabase.from("protocol_extra_categories" as any).select("*").eq("user_id", userId).order("sort_order"),
        supabase.from("student_protocols" as any).select("*").eq("user_id", userId).eq("visible", true).order("updated_at", { ascending: false }),
      ]);
      return { 
        categoryContent: categoryContentRes.data || [], 
        extraCats: extraCatsRes.data || [], 
        studentProtocols: studentProtocolsRes.data || [] 
      };
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { id?: string; userId: string; title: string; items: BudgetItem[]; total: number; notes: string; status: string; duration?: string }) => {
      const payload = {
        user_id: data.userId,
        title: data.title,
        items: data.items as any,
        total: data.total,
        notes: data.notes,
        status: data.status,
        duration: data.duration,
      };

      const { data: budget, error } = data.id 
        ? await supabase.from("supplement_budgets").update(payload).eq("id", data.id).select().single()
        : await supabase.from("supplement_budgets").insert(payload).select().single();

      if (error) throw error;

      // Se foi gerado um orçamento (não apenas rascunho), notifica o canal Nutri
      if (data.status === "sent") {
        try {
          const targetPhone = "5521975194237";
          let { data: conv } = await supabase
            .from("crm_conversations")
            .select("id")
            .eq("phone", targetPhone)
            .eq("queue_type", "nutri")
            .maybeSingle();

          if (!conv) {
            const { data: newConv } = await supabase
              .from("crm_conversations")
              .insert({
                phone: targetPhone,
                display_name: "Farmácia / Notificação Nutri",
                queue_type: "nutri",
                provider: "wapi",
                status: "open",
                identified_as: "other"
              })
              .select()
              .single();
            conv = newConv;
          }

          if (conv) {
            const groups = new Map<string, BudgetItem[]>();
            data.items.forEach((item) => {
              const key = item.origin || categoryLabels[item.category] || "Outros";
              if (!groups.has(key)) groups.set(key, []);
              groups.get(key)!.push(item);
            });

            let itemsText = "";
            let formulaCounter = 1;
            groups.forEach((groupItems, origin) => {
              itemsText += `\n*Fórmula ${formulaCounter} (${origin})*\n`;
              groupItems.forEach((item) => {
                itemsText += `• ${item.name}${item.dosage ? ` — ${item.dosage}` : ""}\n`;
              });
              const groupSubtotal = groupItems.reduce((s, i) => s + (i.subtotal || 0), 0);
              if (groupSubtotal > 0) itemsText += `_Subtotal: R$ ${groupSubtotal.toFixed(2)}_\n`;
              formulaCounter++;
            });

            const body = `🚨 *NOVO ORÇAMENTO GERADO*\n\n📝 *Título:* ${data.title}${data.duration ? `\n⏳ *Plano/Duração:* ${data.duration}` : ""}\n\n*ITENS DO ORÇAMENTO:*${itemsText}\n\n💰 *TOTAL:* R$ ${data.total.toFixed(2)}${data.notes ? `\n\n📝 *OBS:* ${data.notes}` : ""}`;

            await supabase.functions.invoke("crm-send-whatsapp", {
              body: {
                conversation_id: conv.id,
                phone: targetPhone,
                body,
                provider: "wapi"
              }
            });
          }
        } catch (err) {
          console.error("Falha ao enviar notificação de orçamento:", err);
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supplement-budgets"] });
      toast.success("Orçamento salvo!");
      setDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      console.error(err);
      toast.error("Erro ao salvar orçamento");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("supplement_budgets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supplement-budgets"] });
      toast.success("Orçamento removido");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data: budget, error } = await supabase.from("supplement_budgets").update({ status }).eq("id", id).select().single();
      if (error) throw error;

      if (status === "sent") {
        try {
          const targetPhone = "5521975194237";
          let { data: conv } = await supabase
            .from("crm_conversations")
            .select("id")
            .eq("phone", targetPhone)
            .eq("queue_type", "nutri")
            .maybeSingle();

          if (!conv) {
            const { data: newConv } = await supabase
              .from("crm_conversations")
              .insert({
                phone: targetPhone,
                display_name: "Farmácia / Notificação Nutri",
                queue_type: "nutri",
                provider: "wapi",
                status: "open",
                identified_as: "other"
              })
              .select()
              .single();
            conv = newConv;
          }

          if (conv) {
            const items = (budget.items as unknown as BudgetItem[]) || [];
            const groups = new Map<string, BudgetItem[]>();
            items.forEach((item) => {
              const key = item.origin || categoryLabels[item.category] || "Outros";
              if (!groups.has(key)) groups.set(key, []);
              groups.get(key)!.push(item);
            });

            let itemsText = "";
            let formulaCounter = 1;
            groups.forEach((groupItems, origin) => {
              itemsText += `\n*Fórmula ${formulaCounter} (${origin})*\n`;
              groupItems.forEach((item) => {
                itemsText += `• ${item.name}${item.dosage ? ` — ${item.dosage}` : ""}\n`;
              });
              const groupSubtotal = groupItems.reduce((s, i) => s + (i.subtotal || 0), 0);
              if (groupSubtotal > 0) itemsText += `_Subtotal: R$ ${groupSubtotal.toFixed(2)}_\n`;
              formulaCounter++;
            });

            const body = `🚨 *ORÇAMENTO ENVIADO*\n\n📝 *Título:* ${budget.title}${budget.duration ? `\n⏳ *Plano/Duração:* ${budget.duration}` : ""}\n\n*ITENS DO ORÇAMENTO:*${itemsText}\n\n💰 *TOTAL:* R$ ${Number(budget.total).toFixed(2)}${budget.notes ? `\n\n📝 *OBS:* ${budget.notes}` : ""}`;
            
            await supabase.functions.invoke("crm-send-whatsapp", {
              body: {
                conversation_id: conv.id,
                phone: targetPhone,
                body,
                provider: "wapi"
              }
            });
          }
        } catch (err) {
          console.error("Falha ao enviar notificação de orçamento:", err);
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supplement-budgets"] });
      toast.success("Status atualizado");
    },
  });

  const resetForm = () => {
    setBudgetTitle("Orçamento de Suplementos");
    setBudgetNotes("");
    setBudgetDuration("");
    setBudgetItems([]);
    setSelectedStudent(null);
    setEditingId(null);
  };

  const startEdit = (budget: any) => {
    const student = students?.find((s: any) => s.user_id === budget.user_id);
    setSelectedStudent(student || { user_id: budget.user_id, full_name: "Aluno" });
    setEditingId(budget.id);
    setBudgetTitle(budget.title);
    setBudgetNotes(budget.notes || "");
    setBudgetDuration(budget.duration || "");
    setBudgetItems(budget.items as BudgetItem[] || []);
    setDialogOpen(true);
  };

  // Parse protocol items into budget items
  const importFromProtocol = () => {
    if (!protocolData) return;
    const items: BudgetItem[] = [];
    const targetCategories = ["endocrino", "cardiovascular", "metabolico", "pre_pos_treino"];

    // Items are now imported ONLY from student_protocols (visible rich-text content)
    // to avoid bringing in old/hidden data from protocols or protocol_category_content tables.

    // Helper: convert HTML to plain text lines
    const htmlToLines = (html: string): string[] => {
      const withBreaks = html
        .replace(/<\s*br\s*\/?>/gi, "\n")
        .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
        .replace(/<li[^>]*>/gi, "• ");
      const stripped = withBreaks
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
      return stripped
        .split("\n")
        .map((l) => l.replace(/^[•\-\*\u2022\s]+/, "").trim())
        .filter((l) => l.length > 2);
    };

    const splitNameDosage = (line: string): { name: string; dosage: string } => {
      const colonIdx = line.search(/\s*[:–—]\s+/);
      if (colonIdx > 0) {
        const name = line.slice(0, colonIdx).trim();
        const dosage = line.slice(colonIdx).replace(/^\s*[:–—]\s+/, "").trim();
        if (name.length > 1 && dosage.length > 0) return { name, dosage };
      }
      const m = line.match(/^(.+?)\s+(\d[\d.,]*\s?(?:mg|mcg|µg|g|ui|iu|ml|l|%|kcal|cps|caps|comp|gotas|puffs?)\b.*)$/i);
      if (m) return { name: m[1].trim().replace(/[:\-–—]\s*$/, ""), dosage: m[2].trim() };
      return { name: line, dosage: "" };
    };

    // From student_protocols rich-text content (numbered lists per section)
    const sectionToCategory = (header: string): string => {
      const h = header.toLowerCase();
      if (/medicament|horm|pept[ií]de|endócrin|endocrin/.test(h)) return "endocrino";
      if (/cardio|hep[áa]tic|renal/.test(h)) return "cardiovascular";
      if (/pr[ée]\s*-?\s*treino|p[óo]s\s*-?\s*treino|treino/.test(h)) return "pre_pos_treino";
      return "metabolico";
    };
    // Only import from the MOST RECENT visible protocol
    const latestProtocol = (protocolData.studentProtocols as any[])?.[0];
    if (latestProtocol && latestProtocol.content) {
      const sp = latestProtocol;
      const lines = htmlToLines(sp.content);
      
      // Try to extract duration (e.g., Sem 1-4, 30 dias)
      const durationMatch = sp.content.match(/(?:Sem|Semanas?|Dias?)\s*(\d+(?:[-–—]\d+)?)/i);
      if (durationMatch) {
        setBudgetDuration(durationMatch[0].trim());
      }

      let currentCategory = "metabolico";
      let currentOrigin = "Protocolo";
      lines.forEach((raw: string) => {
        // Detect section header (line starts with emoji or is short uppercase title)
        const isHeader =
          /^[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u.test(raw) ||
          /^(MANHÃ|ALMOÇO|LANCHE|JANTAR|CEIA|PRÉ[- ]?TREINO|PÓS[- ]?TREINO|MEDICAMENTOS|SUPLEMENTOS|PEPTÍDEOS)/i.test(raw);
        if (isHeader) {
          currentCategory = sectionToCategory(raw);
          // Clean header: remove emojis & extra punctuation, keep readable title
          currentOrigin = raw
            .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}\u2600-\u27BF]/gu, "")
            .replace(/[:•\-–—]+/g, " ")
            .replace(/\s+/g, " ")
            .trim() || "Protocolo";
          return;
        }
        // Skip Ação/Horário/Foco descriptive lines
        if (/^(ação|acao|horário|horario|foco|📌)/i.test(raw)) return;
        // Match numbered list "1. Item ..." or "1) Item ..."
        const m = raw.match(/^"?\s*\d+[\.\)]\s+(.+?)"?\s*$/);
        if (!m) return;
        const cleaned = m[1].replace(/^"+|"+$/g, "").trim();
        const { name, dosage } = splitNameDosage(cleaned);
        if (!name || name.length < 2) return;
        const existing = items.find((i) => i.name.toLowerCase() === name.toLowerCase());
        if (existing) return;
        items.push({
          name,
          dosage: dosage || (cleaned !== name ? cleaned.replace(name, "").replace(/^[\s:–—-]+/, "").trim() : ""),
          quantity: "1",
          unit_price: 0,
          subtotal: 0,
          category: currentCategory,
          origin: currentOrigin,
        });
      });
    }

    setBudgetItems(items);
    if (items.length === 0) {
      toast.info("Nenhum item encontrado nas categorias do protocolo");
    } else {
      toast.success(`${items.length} itens importados do protocolo`);
    }
  };

  const updateItem = (idx: number, field: keyof BudgetItem, value: any) => {
    setBudgetItems((prev) => {
      const next = [...prev];
      (next[idx] as any)[field] = value;
      if (field === "unit_price" || field === "quantity") {
        next[idx].subtotal = Number(next[idx].quantity || 0) * Number(next[idx].unit_price || 0);
      }
      return next;
    });

    if (field === "unit_price" && selectedStudent && budgetTitle === "Orçamento de Suplementos") {
      const name = selectedStudent.full_name || "Aluno";
      const phone = selectedStudent.phone || "";
      setBudgetTitle(`${name}${phone ? ` — ${phone}` : ""}`);
    }
  };

  const removeItem = (idx: number) => {
    setBudgetItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const addManualItem = () => {
    setBudgetItems((prev) => [...prev, { name: "", dosage: "", quantity: "1", unit_price: 0, subtotal: 0, category: "extra" }]);
  };

  const totalBudget = budgetItems.reduce((s, i) => s + (i.subtotal || 0), 0);

  const getStudentName = (userId: string) => {
    return students?.find((s: any) => s.user_id === userId)?.full_name || "Aluno";
  };

  const copyBudgetText = (budget: any) => {
    const items = (budget.items as BudgetItem[]) || [];
    let text = `📋 ${budget.title}\n`;
    if (budget.duration) text += `⏳ Plano: ${budget.duration}\n`;
    text += "\n";
    // Group by origin (section): MANHÃ, ALMOÇO, PRÉ-TREINO, etc.
    const groups = new Map<string, BudgetItem[]>();
    items.forEach((item) => {
      const key = item.origin || categoryLabels[item.category] || "Outros";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    });
    let formulaCounter = 1;
    let subtotalSum = 0;
    groups.forEach((groupItems, origin) => {
      const groupSubtotal = groupItems.reduce((s, i) => s + (i.subtotal || 0), 0);
      subtotalSum += groupSubtotal;
      text += `Fórmula ${formulaCounter} (${origin})\n`;
      groupItems.forEach((item) => {
        text += `  • ${item.name}`;
        if (item.dosage) text += ` — ${item.dosage}`;
        text += "\n";
      });
      if (groupSubtotal > 0) text += `  Subtotal: R$ ${groupSubtotal.toFixed(2)}\n`;
      text += "\n";
      formulaCounter++;
    });
    text += `\n💰 Total: R$ ${Number(budget.total).toFixed(2)}`;
    if (budget.notes) text += `\n\n📝 ${budget.notes}`;
    navigator.clipboard.writeText(text);
    toast.success("Orçamento copiado!");
  };

  const filtered = students?.filter((s: any) => {
    const q = normalizeSearch(search);
    return normalizeSearch(s.full_name).includes(q) || normalizeSearch(s.email).includes(q);
  });

  const filteredBudgets = budgets || [];

  return (
    <DashboardLayout role="admin" title="Orçamentos">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Orçamentos de Suplementos</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Gere orçamentos a partir do protocolo do aluno
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Novo Orçamento
          </Button>
        </div>

        {/* Budgets list */}
        {filteredBudgets.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>Nenhum orçamento criado ainda</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredBudgets.map((b: any) => {
              const items = (b.items as BudgetItem[]) || [];
              return (
                <Card key={b.id} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground truncate">{b.title}</h3>
                          <Badge variant={b.status === "sent" ? "default" : "secondary"} className="text-[10px]">
                            {b.status === "sent" ? "Enviado" : "Rascunho"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {getStudentName(b.user_id)} · {items.length} itens · R$ {Number(b.total).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(b.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <Button size="sm" variant="ghost" onClick={() => startEdit(b)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setPreviewBudget(b); setPreviewOpen(true); }}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => copyBudgetText(b)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                        {b.status === "draft" && (
                          <Button size="sm" variant="ghost" onClick={() => updateStatusMutation.mutate({ id: b.id, status: "sent" })}>
                            <Send className="w-4 h-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate(b.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* New Budget Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) resetForm(); setDialogOpen(o); }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pill className="w-5 h-5" /> {editingId ? "Editar Orçamento" : "Novo Orçamento"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Student selection */}
              <div>
                <Label>Aluno</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar aluno..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {search && !selectedStudent && (
                  <div className="border border-border rounded-lg mt-1 max-h-40 overflow-y-auto bg-popover">
                    {filtered?.slice(0, 8).map((s: any) => (
                      <button
                        key={s.user_id}
                        className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
                        onClick={() => { 
                          setSelectedStudent(s); 
                          setSearch(s.full_name);
                          setBudgetTitle(`${s.full_name} - ${s.phone || ""}`);
                        }}
                      >
                        <span className="font-medium">{s.full_name}</span>
                        <span className="text-muted-foreground ml-2 text-xs">{s.email}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedStudent && (
                <>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge className="bg-primary/10 text-primary">{selectedStudent.full_name}</Badge>
                    <Button size="sm" variant="outline" onClick={importFromProtocol} className="gap-1.5 text-xs">
                      <Download className="w-3.5 h-3.5" /> Importar do Protocolo
                    </Button>
                    <Button size="sm" variant="outline" onClick={addManualItem} className="gap-1.5 text-xs">
                      <Plus className="w-3.5 h-3.5" /> Adicionar Item
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <Label className="text-xs mb-1 block text-muted-foreground">Título do Orçamento</Label>
                      <Input value={budgetTitle} onChange={(e) => setBudgetTitle(e.target.value)} placeholder="Título do orçamento" />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block text-muted-foreground">Duração/Plano (Ex: 30 dias)</Label>
                      <Input value={budgetDuration} onChange={(e) => setBudgetDuration(e.target.value)} placeholder="Ex: 30 dias" />
                    </div>
                  </div>

                  {budgetItems.length > 0 && (
                    <div className="border border-border rounded-xl overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs min-w-[200px]">Item</TableHead>
                            <TableHead className="text-xs w-32">Dosagem</TableHead>
                            <TableHead className="text-xs w-16">Qtd</TableHead>
                            <TableHead className="text-xs w-24">Preço (R$)</TableHead>
                            <TableHead className="text-xs w-24">Subtotal</TableHead>
                            <TableHead className="w-10" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {budgetItems.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="py-1.5 min-w-[200px]">
                                <Input
                                  value={item.name}
                                  onChange={(e) => updateItem(idx, "name", e.target.value)}
                                  className="h-9 text-sm w-full"
                                  placeholder="Nome do suplemento"
                                />
                                <span className={`text-[10px] px-1.5 py-0.5 rounded mt-0.5 inline-block ${categoryColors[item.category] || categoryColors.extra}`}>
                                  {categoryLabels[item.category] || "Outros"}
                                </span>
                              </TableCell>
                              <TableCell className="py-1.5">
                                <Input
                                  value={item.dosage}
                                  onChange={(e) => updateItem(idx, "dosage", e.target.value)}
                                  className="h-8 text-xs"
                                  placeholder="Ex: 500mg"
                                />
                              </TableCell>
                              <TableCell className="py-1.5">
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                                  className="h-8 text-xs"
                                  min={1}
                                />
                              </TableCell>
                              <TableCell className="py-1.5">
                                <Input
                                  type="number"
                                  value={item.unit_price || ""}
                                  onChange={(e) => updateItem(idx, "unit_price", Number(e.target.value))}
                                  className="h-8 text-xs"
                                  step={0.01}
                                  min={0}
                                />
                              </TableCell>
                              <TableCell className="py-1.5 text-xs font-medium text-foreground">
                                R$ {(item.subtotal || 0).toFixed(2)}
                              </TableCell>
                              <TableCell className="py-1.5">
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => removeItem(idx)}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      <div className="px-4 py-3 border-t border-border flex items-center justify-between bg-muted/30">
                        <span className="text-sm font-semibold text-foreground">Total</span>
                        <span className="text-lg font-bold text-primary">R$ {totalBudget.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  <Textarea
                    value={budgetNotes}
                    onChange={(e) => setBudgetNotes(e.target.value)}
                    placeholder="Observações do orçamento..."
                    rows={2}
                  />

                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => saveMutation.mutate({
                        id: editingId || undefined,
                        userId: selectedStudent.user_id,
                        title: budgetTitle,
                        items: budgetItems,
                        total: totalBudget,
                        notes: budgetNotes,
                        duration: budgetDuration,
                        status: "draft",
                      })}
                      disabled={budgetItems.length === 0}
                    >
                      {editingId ? "Atualizar Rascunho" : "Salvar Rascunho"}
                    </Button>
                    <Button
                      onClick={() => saveMutation.mutate({
                        id: editingId || undefined,
                        userId: selectedStudent.user_id,
                        title: budgetTitle,
                        items: budgetItems,
                        total: totalBudget,
                        notes: budgetNotes,
                        duration: budgetDuration,
                        status: "sent",
                      })}
                      disabled={budgetItems.length === 0}
                    >
                      <Send className="w-4 h-4 mr-1.5" /> {editingId ? "Atualizar e Enviar" : "Salvar e Enviar"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{previewBudget?.title}</DialogTitle>
            </DialogHeader>
            {previewBudget && (
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <p className="text-sm text-muted-foreground">
                    Aluno: <span className="font-medium text-foreground">{getStudentName(previewBudget.user_id)}</span>
                  </p>
                  {previewBudget.duration && (
                    <Badge variant="outline" className="text-primary border-primary/20">
                      {previewBudget.duration}
                    </Badge>
                  )}
                </div>
                <div className="space-y-2">
                  {(() => {
                    const items = (previewBudget.items as BudgetItem[]) || [];
                    const groups = new Map<string, BudgetItem[]>();
                    items.forEach((item) => {
                      const key = item.origin || categoryLabels[item.category] || "Outros";
                      if (!groups.has(key)) groups.set(key, []);
                      groups.get(key)!.push(item);
                    });
                    let counter = 1;
                    const blocks: JSX.Element[] = [];
                    groups.forEach((groupItems, origin) => {
                      const n = counter++;
                      const groupSubtotal = groupItems.reduce((s, i) => s + (i.subtotal || 0), 0);
                      blocks.push(
                        <div key={`g-${origin}`} className="rounded-lg border border-border/60 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-primary">
                              Fórmula {n} <span className="text-xs font-normal text-muted-foreground">({origin})</span>
                            </h4>
                            {groupSubtotal > 0 && (
                              <span className="text-sm font-medium text-foreground">R$ {groupSubtotal.toFixed(2)}</span>
                            )}
                          </div>
                          <ul className="space-y-1 pl-1">
                            {groupItems.map((item, i) => (
                              <li key={`${origin}-${i}`} className="text-sm text-foreground/90 flex items-start gap-2">
                                <span className="text-muted-foreground">•</span>
                                <span>
                                  <span className="font-medium">{item.name}</span>
                                  {item.dosage && <span className="text-muted-foreground"> — {item.dosage}</span>}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    });
                    return blocks;
                  })()}
                </div>
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="font-semibold">Total</span>
                  <span className="text-lg font-bold text-primary">R$ {Number(previewBudget.total).toFixed(2)}</span>
                </div>
                {previewBudget.notes && (
                  <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">{previewBudget.notes}</p>
                )}
                <Button className="w-full gap-2" variant="outline" onClick={() => copyBudgetText(previewBudget)}>
                  <Copy className="w-4 h-4" /> Copiar Orçamento
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminBudgets;
