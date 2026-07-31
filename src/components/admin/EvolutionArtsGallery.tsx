import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Database, Download, Loader2, Trash2, RefreshCw, ImageOff, Send } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ArtRow {
  id: string;
  user_id: string;
  student_name: string;
  art_type: string;
  storage_path: string;
  before_date: string | null;
  after_date: string | null;
  created_at: string;
}

const TYPE_LABELS: Record<string, string> = { front: "Frente", back: "Costas", profile: "Perfil" };

function fmtDate(d?: string | null) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}
function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default function EvolutionArtsGallery({
  userId,
  studentName,
}: {
  userId: string;
  studentName?: string;
}) {
  const [rows, setRows] = useState<ArtRow[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sendTarget, setSendTarget] = useState<ArtRow | null>(null);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("evolution_arts")
        .select("id,user_id,student_name,art_type,storage_path,before_date,after_date,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const list = (data || []) as ArtRow[];
      setRows(list);
      if (list.length) {
        const { data: signed } = await supabase.storage
          .from("evolution-arts")
          .createSignedUrls(list.map((r) => r.storage_path), 60 * 60);
        const map: Record<string, string> = {};
        (signed || []).forEach((s: any) => {
          if (s?.signedUrl && s?.path) map[s.path] = s.signedUrl;
        });
        setUrls(map);
      } else {
        setUrls({});
      }
    } catch (err: any) {
      console.warn("[EvolutionArtsGallery] load", err);
      toast.error("Não foi possível carregar o banco de evoluções.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const handler = (e: any) => {
      if (!e?.detail?.userId || e.detail.userId === userId) load();
    };
    window.addEventListener("evolution-arts:changed", handler);
    return () => window.removeEventListener("evolution-arts:changed", handler);
  }, [load, userId]);

  const grouped = useMemo(() => {
    const map = new Map<string, ArtRow[]>();
    rows.forEach((r) => {
      const key = r.created_at.slice(0, 19); // group by upload moment (per-batch)
      const bucket = map.get(key) || [];
      bucket.push(r);
      map.set(key, bucket);
    });
    return Array.from(map.entries()).map(([k, v]) => ({
      key: k,
      items: v.sort((a, b) => a.art_type.localeCompare(b.art_type)),
    }));
  }, [rows]);

  const handleDelete = async (row: ArtRow) => {
    if (!confirm("Remover esta arte do banco?")) return;
    setDeletingId(row.id);
    try {
      await supabase.storage.from("evolution-arts").remove([row.storage_path]);
      const { error } = await supabase.from("evolution_arts").delete().eq("id", row.id);
      if (error) throw error;
      toast.success("Arte removida.");
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (err: any) {
      toast.error("Falha ao remover: " + (err.message || ""));
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (row: ArtRow) => {
    const url = urls[row.storage_path];
    if (!url) return;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const safeName = (studentName || row.student_name || "aluno").replace(/\s+/g, "_");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `evolucao_${safeName}_${row.art_type}_${row.created_at.slice(0, 10)}.jpg`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    } catch {
      window.open(url, "_blank");
    }
  };

  // Libera a arte de evolução no WhatsApp pelo canal "Fale com o Nutri" (W-API).
  const handleReleaseToNutri = async () => {
    const row = sendTarget;
    if (!row) return;
    setSending(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("user_id", row.user_id)
        .maybeSingle();
      const phone = (profile as any)?.phone;
      if (!phone) {
        toast.error("Aluno sem telefone cadastrado.");
        return;
      }

      // Link assinado longo (7 dias) para o WhatsApp conseguir baixar a imagem.
      const { data: signed, error: signErr } = await supabase.storage
        .from("evolution-arts")
        .createSignedUrl(row.storage_path, 60 * 60 * 24 * 7);
      if (signErr || !signed?.signedUrl) throw signErr || new Error("Falha ao gerar link da imagem");

      const firstName = String((profile as any)?.full_name || studentName || row.student_name || "")
        .trim()
        .split(/\s+/)[0];
      const caption = `${firstName ? `${firstName}, s` : "S"}ua evolução (${TYPE_LABELS[row.art_type] || row.art_type}) — ${fmtDate(row.before_date)} → ${fmtDate(row.after_date)}.\n\nSTH METHOD`;

      const { data, error } = await supabase.functions.invoke("send-wapi", {
        body: { phone, message: caption, image_url: signed.signedUrl },
      });
      if (error) throw error;
      if ((data as any)?.ok === false) {
        toast.error((data as any)?.error || "Falha ao enviar pelo canal Nutri.");
        return;
      }
      toast.success("Foto liberada no WhatsApp (Fale com o Nutri).");
      setSendTarget(null);
    } catch (err: any) {
      console.warn("[EvolutionArtsGallery] release", err);
      toast.error("Erro ao liberar a foto no WhatsApp.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-display flex items-center gap-2">
          <Database className="w-4 h-4" /> Banco de Evoluções
          {rows.length > 0 && (
            <Badge variant="secondary" className="ml-1">{rows.length}</Badge>
          )}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {!loading && rows.length === 0 && (
          <div className="text-xs text-muted-foreground flex items-center gap-2 py-2">
            <ImageOff className="w-3.5 h-3.5" />
            Nenhuma arte arquivada. Gere uma evolução acima e clique em <span className="font-medium">Salvar no banco</span>.
          </div>
        )}
        {grouped.map((g) => {
          const sample = g.items[0];
          return (
            <div key={g.key} className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="font-semibold text-muted-foreground">
                  Arquivada em {fmtDateTime(sample.created_at)}
                </div>
                <div className="text-muted-foreground">
                  {fmtDate(sample.before_date)} → {fmtDate(sample.after_date)}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {g.items.map((row) => {
                  const url = urls[row.storage_path];
                  return (
                    <div key={row.id} className="relative group rounded-lg overflow-hidden border border-border bg-muted/30">
                      {url ? (
                        <img src={url} alt={TYPE_LABELS[row.art_type] || row.art_type} className="w-full aspect-[4/5] object-cover" />
                      ) : (
                        <div className="w-full aspect-[4/5] flex items-center justify-center text-xs text-muted-foreground">carregando…</div>
                      )}
                      <div className="absolute top-2 left-2">
                        <Badge className="text-[10px]">{TYPE_LABELS[row.art_type] || row.art_type}</Badge>
                      </div>
                      <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSendTarget(row)}
                          title="Liberar no WhatsApp (Fale com o Nutri)"
                        >
                          <Send className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => handleDownload(row)} title="Baixar">
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(row)}
                          disabled={deletingId === row.id}
                          title="Remover"
                        >
                          {deletingId === row.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>

      <AlertDialog open={!!sendTarget} onOpenChange={(open) => !open && !sending && setSendTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Liberar foto no WhatsApp?</AlertDialogTitle>
            <AlertDialogDescription>
              A arte de evolução ({sendTarget ? TYPE_LABELS[sendTarget.art_type] || sendTarget.art_type : ""}) será
              enviada ao aluno pelo canal <strong>Fale com o Nutri</strong>. Exceção autorizada à política de bloqueio
              de imagens no WhatsApp.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleReleaseToNutri(); }}
              disabled={sending}
            >
              {sending ? "Enviando..." : "Liberar e enviar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}