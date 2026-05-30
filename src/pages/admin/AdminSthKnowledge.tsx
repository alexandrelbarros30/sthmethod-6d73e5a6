import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { BookOpen, Plus, Search, Tag, Pencil, Trash2, CheckCircle2, FileText, History } from "lucide-react";

const CATEGORIES = [
  "Consultoria","Planos","Plataforma","Nutrição","Treinamento",
  "Exames","Comercial","Financeiro","Renovação","FAQ",
];

interface Article {
  id: string;
  title: string;
  category: string;
  content: string;
  summary: string | null;
  tags: string[];
  status: "rascunho" | "aprovado" | "arquivado";
  version: number;
  author_name: string | null;
  uses_count: number;
  updated_at: string;
}

interface Version {
  id: string;
  version: number;
  title: string;
  category: string;
  content: string;
  tags: string[];
  status: string;
  edited_by_name: string | null;
  change_note: string | null;
  created_at: string;
}

const emptyDraft = (): Partial<Article> & { tagsText?: string; change_note?: string } => ({
  title: "", category: "Consultoria", content: "", summary: "", tags: [], status: "rascunho",
});

export default function AdminSthKnowledge({ area = "admin" }: { area?: "admin" | "consultor" }) {
  const { user, profile } = useAuth() as any;
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("todas");
  const [status, setStatus] = useState<string>("todos");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<any>(emptyDraft());
  const [editing, setEditing] = useState<Article | null>(null);
  const [historyOpen, setHistoryOpen] = useState<Article | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sth_kb_articles" as any)
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) toast({ title: "Erro ao carregar", description: error.message, variant: "destructive" });
    setArticles((data as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      if (cat !== "todas" && a.category !== cat) return false;
      if (status !== "todos" && a.status !== status) return false;
      if (!q.trim()) return true;
      const term = q.toLowerCase();
      return a.title.toLowerCase().includes(term)
        || (a.summary || "").toLowerCase().includes(term)
        || a.content.toLowerCase().includes(term)
        || a.tags.some((t) => t.toLowerCase().includes(term));
    });
  }, [articles, q, cat, status]);

  const counts = useMemo(() => ({
    total: articles.length,
    aprovados: articles.filter(a => a.status === "aprovado").length,
    rascunhos: articles.filter(a => a.status === "rascunho").length,
    categorias: new Set(articles.map(a => a.category)).size,
  }), [articles]);

  const openCreate = () => { setEditing(null); setDraft(emptyDraft()); setOpen(true); };
  const openEdit = (a: Article) => {
    setEditing(a);
    setDraft({ ...a, tagsText: (a.tags || []).join(", "), change_note: "" });
    setOpen(true);
  };

  const save = async () => {
    if (!draft.title?.trim() || !draft.content?.trim()) {
      toast({ title: "Preencha título e conteúdo", variant: "destructive" }); return;
    }
    const tags = String(draft.tagsText || "").split(",").map((t: string) => t.trim()).filter(Boolean);
    const payload: any = {
      title: draft.title.trim(),
      category: draft.category,
      content: draft.content,
      summary: draft.summary || null,
      tags,
      status: draft.status || "rascunho",
      author_id: user?.id || null,
      author_name: profile?.full_name || user?.email || null,
    };
    if (editing) {
      // snapshot da versão atual antes de atualizar
      await supabase.from("sth_kb_versions" as any).insert({
        article_id: editing.id, version: editing.version,
        title: editing.title, category: editing.category, content: editing.content,
        tags: editing.tags, status: editing.status,
        edited_by: user?.id || null,
        edited_by_name: profile?.full_name || user?.email || null,
        change_note: draft.change_note || null,
      });
      payload.version = (editing.version || 1) + 1;
      if (payload.status === "aprovado") {
        payload.approved_by = user?.id || null;
        payload.approved_at = new Date().toISOString();
      }
      const { error } = await supabase.from("sth_kb_articles" as any).update(payload).eq("id", editing.id);
      if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
      toast({ title: "Artigo atualizado" });
    } else {
      if (payload.status === "aprovado") {
        payload.approved_by = user?.id || null;
        payload.approved_at = new Date().toISOString();
      }
      const { error } = await supabase.from("sth_kb_articles" as any).insert(payload);
      if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
      toast({ title: "Artigo criado" });
    }
    setOpen(false); setEditing(null); setDraft(emptyDraft()); load();
  };

  const approve = async (a: Article) => {
    const { error } = await supabase.from("sth_kb_articles" as any).update({
      status: "aprovado", approved_by: user?.id || null, approved_at: new Date().toISOString(),
    }).eq("id", a.id);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: "Aprovado" }); load();
  };

  const remove = async (a: Article) => {
    if (!confirm(`Excluir "${a.title}"?`)) return;
    const { error } = await supabase.from("sth_kb_articles" as any).delete().eq("id", a.id);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: "Excluído" }); load();
  };

  const openHistory = async (a: Article) => {
    setHistoryOpen(a);
    const { data } = await supabase.from("sth_kb_versions" as any)
      .select("*").eq("article_id", a.id).order("version", { ascending: false });
    setVersions((data as any) || []);
  };

  return (
    <DashboardLayout role={area} title="STH Knowledge Hub">
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-emerald-400/80 text-xs uppercase tracking-widest">
                <BookOpen className="w-3.5 h-3.5" /> STH Knowledge Hub
              </div>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-1">Base de Conhecimento</h1>
              <p className="text-white/50 text-sm mt-1">Fonte oficial da metodologia STH METHOD consultada pela IA antes de responder.</p>
            </div>
            <Button onClick={openCreate} className="bg-emerald-500 hover:bg-emerald-400 text-black font-medium">
              <Plus className="w-4 h-4 mr-1" /> Novo artigo
            </Button>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { l: "Total", v: counts.total, i: FileText },
              { l: "Aprovados", v: counts.aprovados, i: CheckCircle2 },
              { l: "Rascunhos", v: counts.rascunhos, i: Pencil },
              { l: "Categorias", v: counts.categorias, i: Tag },
            ].map((k) => (
              <Card key={k.l} className="bg-white/[0.03] border-white/10 p-4 rounded-2xl">
                <div className="flex items-center justify-between text-white/50 text-xs uppercase tracking-wider">
                  <span>{k.l}</span><k.i className="w-3.5 h-3.5" />
                </div>
                <div className="text-3xl font-semibold mt-2">{k.v}</div>
              </Card>
            ))}
          </div>

          {/* Filtros */}
          <Card className="bg-white/[0.03] border-white/10 p-3 rounded-2xl">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por título, tag, conteúdo..." className="bg-black/50 border-white/10 pl-9 text-white" />
              </div>
              <Select value={cat} onValueChange={setCat}>
                <SelectTrigger className="w-full sm:w-48 bg-black/50 border-white/10 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-950 text-white border-white/10">
                  <SelectItem value="todas">Todas categorias</SelectItem>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full sm:w-40 bg-black/50 border-white/10 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-950 text-white border-white/10">
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="aprovado">Aprovados</SelectItem>
                  <SelectItem value="rascunho">Rascunhos</SelectItem>
                  <SelectItem value="arquivado">Arquivados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Lista */}
          {loading ? (
            <div className="text-white/50 text-sm">Carregando...</div>
          ) : filtered.length === 0 ? (
            <Card className="bg-white/[0.03] border-white/10 p-10 rounded-2xl text-center text-white/50">
              Nenhum artigo encontrado.
            </Card>
          ) : (
            <div className="grid gap-3">
              {filtered.map((a) => (
                <Card key={a.id} className="bg-white/[0.03] border-white/10 p-4 rounded-2xl">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[10px]">{a.category}</Badge>
                        <Badge variant="outline" className={
                          a.status === "aprovado"
                            ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[10px]"
                            : a.status === "rascunho"
                            ? "border-amber-500/30 text-amber-300 bg-amber-500/10 text-[10px]"
                            : "border-white/20 text-white/60 text-[10px]"
                        }>{a.status}</Badge>
                        <span className="text-white/40 text-[11px]">v{a.version} · {a.uses_count} usos</span>
                      </div>
                      <div className="text-lg font-medium mt-1 truncate">{a.title}</div>
                      {a.summary && <div className="text-sm text-white/60 mt-1 line-clamp-2">{a.summary}</div>}
                      {a.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-2">
                          {a.tags.map(t => <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/60">#{t}</span>)}
                        </div>
                      )}
                      <div className="text-[11px] text-white/40 mt-2">
                        {a.author_name || "—"} · atualizado em {new Date(a.updated_at).toLocaleString("pt-BR")}
                      </div>
                    </div>
                    <div className="flex sm:flex-col gap-2 shrink-0">
                      {a.status !== "aprovado" && (
                        <Button size="sm" onClick={() => approve(a)} className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Aprovar
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => openEdit(a)} className="border-white/10 bg-white/5 text-white hover:bg-white/10">
                        <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openHistory(a)} className="border-white/10 bg-white/5 text-white hover:bg-white/10">
                        <History className="w-3.5 h-3.5 mr-1" /> Histórico
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => remove(a)} className="border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Dialog editor */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="bg-zinc-950 border-white/10 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar artigo" : "Novo artigo"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-white/60">Título</label>
                <Input value={draft.title || ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="bg-black/50 border-white/10 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/60">Categoria</label>
                  <Select value={draft.category} onValueChange={(v) => setDraft({ ...draft, category: v })}>
                    <SelectTrigger className="bg-black/50 border-white/10 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-950 text-white border-white/10">
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-white/60">Status</label>
                  <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v })}>
                    <SelectTrigger className="bg-black/50 border-white/10 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-950 text-white border-white/10">
                      <SelectItem value="rascunho">Rascunho</SelectItem>
                      <SelectItem value="aprovado">Aprovado</SelectItem>
                      <SelectItem value="arquivado">Arquivado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-xs text-white/60">Resumo (1-2 linhas — usado pela IA)</label>
                <Textarea value={draft.summary || ""} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} className="bg-black/50 border-white/10 text-white min-h-[60px]" />
              </div>
              <div>
                <label className="text-xs text-white/60">Conteúdo</label>
                <Textarea value={draft.content || ""} onChange={(e) => setDraft({ ...draft, content: e.target.value })} className="bg-black/50 border-white/10 text-white min-h-[260px] font-mono text-sm" />
              </div>
              <div>
                <label className="text-xs text-white/60">Tags (separadas por vírgula)</label>
                <Input value={draft.tagsText ?? (draft.tags || []).join(", ")} onChange={(e) => setDraft({ ...draft, tagsText: e.target.value })} className="bg-black/50 border-white/10 text-white" />
              </div>
              {editing && (
                <div>
                  <label className="text-xs text-white/60">Nota da alteração (opcional)</label>
                  <Input value={draft.change_note || ""} onChange={(e) => setDraft({ ...draft, change_note: e.target.value })} className="bg-black/50 border-white/10 text-white" />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} className="border-white/10 bg-white/5 text-white hover:bg-white/10">Cancelar</Button>
              <Button onClick={save} className="bg-emerald-500 hover:bg-emerald-400 text-black">Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Histórico */}
        <Dialog open={!!historyOpen} onOpenChange={(o) => { if (!o) { setHistoryOpen(null); setVersions([]); } }}>
          <DialogContent className="bg-zinc-950 border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Histórico — {historyOpen?.title}</DialogTitle>
            </DialogHeader>
            {versions.length === 0 ? (
              <div className="text-white/50 text-sm">Sem versões anteriores.</div>
            ) : (
              <div className="space-y-3">
                {versions.map(v => (
                  <Card key={v.id} className="bg-white/[0.03] border-white/10 p-3 rounded-xl">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-400">v{v.version} · {v.status}</span>
                      <span className="text-white/40">{new Date(v.created_at).toLocaleString("pt-BR")}</span>
                    </div>
                    <div className="text-sm font-medium mt-1">{v.title}</div>
                    <div className="text-[11px] text-white/40">{v.edited_by_name || "—"}{v.change_note ? ` · ${v.change_note}` : ""}</div>
                    <details className="mt-2">
                      <summary className="text-xs text-white/60 cursor-pointer">Ver conteúdo</summary>
                      <pre className="text-xs text-white/70 whitespace-pre-wrap mt-2 max-h-60 overflow-auto">{v.content}</pre>
                    </details>
                  </Card>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}