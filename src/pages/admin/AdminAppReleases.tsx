import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Upload, Download, CheckCircle2, Trash2, Copy, Package } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Release = {
  id: string;
  version: string;
  file_path: string;
  size_bytes: number | null;
  notes: string | null;
  is_current: boolean;
  released_at: string;
};

const DOWNLOAD_URL = `${window.location.origin}/baixar-apk`;

const humanSize = (b?: number | null) =>
  !b ? "—" : b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${(b / 1024).toFixed(0)} KB`;

export default function AdminAppReleases() {
  const isMobile = useIsMobile();
  const qc = useQueryClient();
  const [version, setVersion] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const { data: releases = [] } = useQuery({
    queryKey: ["app_releases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_releases")
        .select("*")
        .order("released_at", { ascending: false });
      if (error) throw error;
      return data as Release[];
    },
  });

  const upload = async () => {
    if (!file || !version.trim()) {
      toast({ title: "Preencha versão e selecione o APK", variant: "destructive" });
      return;
    }
    setUploading(true);
    setProgress(10);
    try {
      const safeVersion = version.trim().replace(/[^0-9a-zA-Z.\-_]/g, "");
      const path = `sthmethod-${safeVersion}-${Date.now()}.apk`;
      setProgress(30);
      const { error: upErr } = await supabase.storage
        .from("app-releases")
        .upload(path, file, { contentType: "application/vnd.android.package-archive", upsert: false });
      if (upErr) throw upErr;
      setProgress(75);

      await supabase.from("app_releases").update({ is_current: false }).eq("is_current", true);

      const { data: userData } = await supabase.auth.getUser();
      const { error: insErr } = await supabase.from("app_releases").insert({
        version: safeVersion,
        file_path: path,
        size_bytes: file.size,
        notes: notes.trim() || null,
        is_current: true,
        created_by: userData.user?.id,
      });
      if (insErr) throw insErr;

      setProgress(100);
      toast({ title: "APK publicado", description: `Versão ${safeVersion} agora é a atual.` });
      setVersion("");
      setNotes("");
      setFile(null);
      qc.invalidateQueries({ queryKey: ["app_releases"] });
    } catch (e: any) {
      toast({ title: "Falha no upload", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 800);
    }
  };

  const setCurrent = async (r: Release) => {
    await supabase.from("app_releases").update({ is_current: false }).eq("is_current", true);
    const { error } = await supabase.from("app_releases").update({ is_current: true }).eq("id", r.id);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: `v${r.version} agora é a versão atual` });
    qc.invalidateQueries({ queryKey: ["app_releases"] });
  };

  const remove = async (r: Release) => {
    if (!confirm(`Excluir a versão ${r.version}? O arquivo APK também será removido.`)) return;
    await supabase.storage.from("app-releases").remove([r.file_path]);
    const { error } = await supabase.from("app_releases").delete().eq("id", r.id);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: "Versão removida" });
    qc.invalidateQueries({ queryKey: ["app_releases"] });
  };

  const testDownload = async (r: Release) => {
    const { data, error } = await supabase.storage
      .from("app-releases")
      .createSignedUrl(r.file_path, 300, { download: `sthmethod-${r.version}.apk` });
    if (error || !data) return toast({ title: "Erro ao gerar link", variant: "destructive" });
    window.open(data.signedUrl, "_blank");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(DOWNLOAD_URL);
    toast({ title: "Link copiado", description: DOWNLOAD_URL });
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar role="admin" />
      <div className={`${isMobile ? "pt-12" : "ml-60"} p-6 max-w-4xl mx-auto space-y-6`}>
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Package className="w-6 h-6" /> Releases do App (APK)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hospede o APK direto no servidor STH METHOD. A versão marcada como atual é a que
            os alunos baixam em <code className="text-xs">/baixar-app</code>.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Download className="w-4 h-4" /> Link público de download
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Input readOnly value={DOWNLOAD_URL} className="font-mono text-xs" />
            <Button variant="outline" size="icon" onClick={copyLink}>
              <Copy className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="w-4 h-4" /> Publicar novo APK
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Versão (ex: 1.0.5)</Label>
                <Input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.0.5" />
              </div>
              <div className="space-y-1.5">
                <Label>Arquivo .apk</Label>
                <Input
                  type="file"
                  accept=".apk,application/vnd.android.package-archive"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notas da versão (opcional)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
            {progress > 0 && (
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
            <Button onClick={upload} disabled={uploading || !file || !version.trim()} className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? "Enviando…" : "Publicar como versão atual"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Histórico de versões</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {releases.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum APK publicado ainda.</p>
            )}
            {releases.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center gap-3 p-3 rounded-lg border bg-card"
              >
                <div className="flex-1 min-w-[180px]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold">v{r.version}</span>
                    {r.is_current && (
                      <Badge className="bg-green-500/15 text-green-600 border-green-500/30">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Atual
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(r.released_at), "dd/MM/yyyy HH:mm", { locale: ptBR })} ·{" "}
                    {humanSize(r.size_bytes)}
                  </p>
                  {r.notes && <p className="text-xs mt-1">{r.notes}</p>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => testDownload(r)}>
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                  {!r.is_current && (
                    <Button size="sm" variant="outline" onClick={() => setCurrent(r)}>
                      Tornar atual
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => remove(r)}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}