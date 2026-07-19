import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RefreshCw, Sparkles, Zap, Rocket, Trash2, Pencil } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  bumpVersion,
  IMPACT_LABEL,
  IMPACT_DESCRIPTION,
  type UpdateImpact,
  compareVersions,
} from "@/lib/version-bump";

interface PlatformUpdate {
  id: string;
  version: string;
  impact: UpdateImpact;
  title: string;
  description: string;
  published: boolean;
  released_at: string;
}

const IMPACT_ICON: Record<UpdateImpact, typeof Sparkles> = {
  patch: Sparkles,
  minor: Zap,
  major: Rocket,
};

const IMPACT_COLOR: Record<UpdateImpact, string> = {
  patch: "hsl(200 80% 55%)",
  minor: "hsl(45 95% 55%)",
  major: "hsl(280 80% 60%)",
};

const AdminUpdates = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PlatformUpdate | null>(null);
  const [impact, setImpact] = useState<UpdateImpact>("patch");
  const [version, setVersion] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [published, setPublished] = useState(true);

  const { data: updates = [], isLoading } = useQuery({
    queryKey: ["platform_updates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_updates")
        .select("*")
        .order("released_at", { ascending: false });
      if (error) throw error;
      return (data || []) as PlatformUpdate[];
    },
  });

  const latestVersion = useMemo(() => {
    if (!updates.length) return "1.0.0";
    return [...updates].sort((a, b) => compareVersions(b.version, a.version))[0].version;
  }, [updates]);

  const openNew = (imp: UpdateImpact) => {
    setEditing(null);
    setImpact(imp);
    setVersion(bumpVersion(latestVersion, imp));
    setTitle("");
    setDescription("");
    setPublished(true);
    setOpen(true);
  };

  const openEdit = (u: PlatformUpdate) => {
    setEditing(u);
    setImpact(u.impact);
    setVersion(u.version);
    setTitle(u.title);
    setDescription(u.description);
    setPublished(u.published);
    setOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!version.trim() || !title.trim()) {
        throw new Error("Versão e título são obrigatórios");
      }
      const userRes = await supabase.auth.getUser();
      const uid = userRes.data.user?.id ?? null;
      if (editing) {
        const { error } = await supabase
          .from("platform_updates")
          .update({ version, impact, title, description, published })
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("platform_updates").insert({
          version,
          impact,
          title,
          description,
          published,
          created_by: uid,
          released_at: new Date().toISOString(),
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Atualização salva" : "Atualização publicada");
      qc.invalidateQueries({ queryKey: ["platform_updates"] });
      qc.invalidateQueries({ queryKey: ["latest_platform_update"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("platform_updates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Atualização removida");
      qc.invalidateQueries({ queryKey: ["platform_updates"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DashboardLayout role="admin" title="Atualizações" subtitle="Registre novas versões e mantenha o histórico da plataforma.">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Atualizações da Plataforma</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Versão atual:{" "}
              <span className="font-semibold text-foreground">Beta {latestVersion}</span>
            </p>
          </div>
          <Badge variant="outline" className="gap-1.5">
            <RefreshCw className="w-3 h-3" />
            {updates.length} {updates.length === 1 ? "registro" : "registros"}
          </Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {(["patch", "minor", "major"] as UpdateImpact[]).map((imp) => {
            const Icon = IMPACT_ICON[imp];
            const next = bumpVersion(latestVersion, imp);
            return (
              <Card
                key={imp}
                className="cursor-pointer transition-transform active:scale-[0.98] hover:border-primary/50"
                onClick={() => openNew(imp)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${IMPACT_COLOR[imp]}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: IMPACT_COLOR[imp] }} />
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono"
                      style={{ borderColor: `${IMPACT_COLOR[imp]}60`, color: IMPACT_COLOR[imp] }}
                    >
                      Beta {next}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-base">{IMPACT_LABEL[imp]} impacto</h3>
                  <p className="text-xs text-muted-foreground mt-1">{IMPACT_DESCRIPTION[imp]}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Histórico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading && (
              <p className="text-sm text-muted-foreground">Carregando…</p>
            )}
            {!isLoading && updates.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma atualização registrada.</p>
            )}
            {updates.map((u) => {
              const Icon = IMPACT_ICON[u.impact];
              return (
                <div
                  key={u.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${IMPACT_COLOR[u.impact]}20` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: IMPACT_COLOR[u.impact] }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold">Beta {u.version}</span>
                      <Badge
                        variant="outline"
                        className="text-[10px]"
                        style={{ borderColor: `${IMPACT_COLOR[u.impact]}60`, color: IMPACT_COLOR[u.impact] }}
                      >
                        {IMPACT_LABEL[u.impact]}
                      </Badge>
                      {!u.published && (
                        <Badge variant="secondary" className="text-[10px]">
                          Rascunho
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {format(new Date(u.released_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <p className="font-medium text-sm mt-1">{u.title}</p>
                    {u.description && (
                      <p className="text-xs text-muted-foreground whitespace-pre-line mt-1">
                        {u.description}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(u)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Remover Beta ${u.version}?`)) deleteMutation.mutate(u.id);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar atualização" : `Nova atualização — ${IMPACT_LABEL[impact]}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Versão</Label>
              <Input
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="font-mono"
                placeholder="1.0.1"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Sugerida automaticamente. Será exibida como{" "}
                <span className="font-mono">Beta {version || "?"}</span>
              </p>
            </div>
            <div>
              <Label className="text-xs">Título (curto)</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Card de Medicamentos"
              />
            </div>
            <div>
              <Label className="text-xs">Descrição / Changelog</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="O que foi atualizado nesta versão…"
                rows={5}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="pub" className="text-sm">
                Publicar para alunos
              </Label>
              <Switch id="pub" checked={published} onCheckedChange={setPublished} />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? "Salvando…" : editing ? "Salvar" : "Publicar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminUpdates;