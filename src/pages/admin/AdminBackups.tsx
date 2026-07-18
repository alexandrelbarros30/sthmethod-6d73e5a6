import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Database, Download, Play, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAdminReauth } from "@/hooks/useAdminReauth";

type FileEntry = { name: string; size: number; path: string };

type BackupProgress = {
  running: boolean;
  day: string | null;
  current: number;
  total: number;
  table: string | null;
  errors: number;
};

async function invokeBackup(action: "run" | "table" | "manifest" | "list" | "download", params: Record<string, string> = {}) {
  const qs = new URLSearchParams({ action, ...params }).toString();
  const { data, error } = await supabase.functions.invoke(`daily-backup?${qs}`, { method: "POST" });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const raw = await error.context.text();
      try {
        const parsed = JSON.parse(raw);
        throw new Error(parsed?.error || parsed?.details || raw);
      } catch (parseError) {
        if (parseError instanceof SyntaxError) throw new Error(raw || error.message);
        throw parseError;
      }
    }
    throw error;
  }
  return data as any;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function AdminBackups() {
  const qc = useQueryClient();
  const { requireReauth } = useAdminReauth();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [progress, setProgress] = useState<BackupProgress>({
    running: false,
    day: null,
    current: 0,
    total: 0,
    table: null,
    errors: 0,
  });

  const listQuery = useQuery({
    queryKey: ["backups-list", selectedDay],
    queryFn: () => invokeBackup("list", selectedDay ? { day: selectedDay } : {}),
  });

  const runMutation = useMutation({
    mutationFn: async () => {
      const ok = await requireReauth({
        reason: "Executar backup manual do banco",
        action: "run_manual_backup",
      });
      if (!ok) throw new Error("Reautenticação necessária");
      const prepared = await invokeBackup("run");
      const tables = Array.isArray(prepared?.tables) ? prepared.tables as string[] : [];
      const day = prepared?.day as string | undefined;
      if (!day || tables.length === 0) throw new Error("Nenhuma tabela disponível para backup.");

      let errors = 0;
      setSelectedDay(day);
      setProgress({ running: true, day, current: 0, total: tables.length, table: null, errors: 0 });

      for (let i = 0; i < tables.length; i += 1) {
        const table = tables[i];
        setProgress({ running: true, day, current: i + 1, total: tables.length, table, errors });
        try {
          await invokeBackup("table", { day, table });
        } catch (e) {
          errors += 1;
          setProgress({ running: true, day, current: i + 1, total: tables.length, table, errors });
          console.error("Falha no backup da tabela", table, e);
        }
      }

      const manifest = await invokeBackup("manifest", { day });
      setProgress({ running: false, day, current: tables.length, total: tables.length, table: null, errors });
      return { ...manifest, day, total: tables.length, errors };
    },
    onSuccess: (data) => {
      const total = data?.total ?? 0;
      const errors = data?.errors ?? 0;
      toast.success(`Backup concluído: ${total - errors}/${total} tabelas salvas${errors ? ` (${errors} falhas)` : ""}`);
      qc.invalidateQueries({ queryKey: ["backups-list"] });
    },
    onError: (e: any) => {
      setProgress((prev) => ({ ...prev, running: false }));
      toast.error(`Falha no backup: ${e.message ?? e}`);
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async (path: string) => {
      const ok = await requireReauth({
        reason: "Baixar arquivo de backup",
        action: "download_backup",
        targetLabel: path,
      });
      if (!ok) throw new Error("Reautenticação necessária");
      const res = await invokeBackup("download", { path });
      const bin = atob(res.content.replace(/\n/g, ""));
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const blob = new Blob([bytes], { type: "application/gzip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = path.split("/").pop() ?? "backup.json.gz";
      a.click();
      URL.revokeObjectURL(url);
    },
    onError: (e: any) => toast.error(`Falha no download: ${e.message ?? e}`),
  });

  const days: string[] = listQuery.data?.days ?? [];
  const files: FileEntry[] = listQuery.data?.files ?? [];

  return (
    <DashboardLayout role="admin" title="Backups do Banco" subtitle="Snapshots diários no GitHub">
      <div className="container mx-auto p-4 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Database className="w-7 h-7" /> Backups do Banco
            </h1>
            <p className="text-muted-foreground mt-1">
              Snapshots diários commitados em <code className="text-xs">alexandrelbarros30/sthmethod-backups</code> (repositório privado no GitHub). Rodam automaticamente às 03:00 BRT.
            </p>
          </div>
          <Button
            onClick={() => runMutation.mutate()}
            disabled={runMutation.isPending || progress.running}
            className="gap-2"
          >
            {runMutation.isPending || progress.running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {progress.running ? "Executando backup..." : "Executar backup agora"}
          </Button>
        </div>

        {(progress.running || progress.total > 0) && (
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">
                  {progress.running ? "Backup em andamento" : "Último backup manual"}
                </span>
                <Badge variant={progress.errors ? "destructive" : "secondary"}>
                  {progress.current}/{progress.total} tabelas
                </Badge>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progress.total ? Math.round((progress.current / progress.total) * 100) : 0}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {progress.running && progress.table
                  ? `Salvando: ${progress.table}`
                  : progress.day
                    ? `Dia: ${progress.day}${progress.errors ? ` · Falhas: ${progress.errors}` : ""}`
                    : "Preparando backup..."}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Dias disponíveis</CardTitle>
              <Button size="icon" variant="ghost" onClick={() => qc.invalidateQueries({ queryKey: ["backups-list"] })}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-1 max-h-[60vh] overflow-y-auto">
              {listQuery.isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
              {!listQuery.isLoading && days.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhum backup ainda. Clique em "Executar backup agora" para gerar o primeiro.
                </p>
              )}
              {days.map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDay(d)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition ${
                    selectedDay === d ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                  }`}
                >
                  {d}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {selectedDay ? `Arquivos de ${selectedDay}` : "Selecione um dia"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedDay && <p className="text-sm text-muted-foreground">Escolha uma data à esquerda.</p>}
              {selectedDay && files.length === 0 && !listQuery.isLoading && (
                <p className="text-sm text-muted-foreground">Nenhum arquivo neste dia.</p>
              )}
              {selectedDay && files.length > 0 && (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {files.map((f) => (
                    <div
                      key={f.path}
                      className="flex items-center justify-between px-3 py-2 rounded-md border hover:bg-muted/50"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{f.name}</p>
                        <Badge variant="secondary" className="text-xs mt-0.5">
                          {formatSize(f.size)}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadMutation.mutate(f.path)}
                        disabled={downloadMutation.isPending}
                        className="gap-1"
                      >
                        <Download className="w-3.5 h-3.5" /> Baixar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}