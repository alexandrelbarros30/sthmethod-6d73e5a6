import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { AlertTriangle, FileText, Loader2, Trash2, Upload } from "lucide-react";

export interface AiExamFile {
  id: string;
  file_name: string | null;
  storage_path: string;
  created_at: string;
}

interface Props {
  selected: string[];
  onChange: (ids: string[]) => void;
}

export default function AiExamAttach({ selected, onChange }: Props) {
  const { user } = useAuth();
  const [files, setFiles] = useState<AiExamFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    const { data } = await supabase
      .from("ai_app_files")
      .select("id, file_name, storage_path, created_at")
      .eq("user_id", user.id)
      .eq("kind", "exam")
      .order("created_at", { ascending: false });
    setFiles(((data ?? []) as unknown) as AiExamFile[]);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  async function upload(file: File | null) {
    if (!file || !user?.id) return;
    if (file.size > 15 * 1024 * 1024) { toast.error("Arquivo acima de 15 MB."); return; }
    setUploading(true);
    try {
      const path = `${user.id}/exams/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("sth-ai").upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const { data, error } = await supabase
        .from("ai_app_files")
        .insert({ user_id: user.id, kind: "exam", file_name: file.name, storage_path: path })
        .select("id, file_name, storage_path, created_at")
        .single();
      if (error) throw error;
      setFiles((prev) => [(data as unknown) as AiExamFile, ...prev]);
      onChange([...selected, (data as any).id]);
      toast.success("Exame anexado à análise.");
    } catch (e) {
      toast.error((e as Error)?.message || "Falha no envio.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function openFile(f: AiExamFile) {
    const { data, error } = await supabase.storage.from("sth-ai").createSignedUrl(f.storage_path, 300);
    if (error || !data?.signedUrl) { toast.error("Não foi possível abrir o arquivo."); return; }
    window.open(data.signedUrl, "_blank", "noopener");
  }

  async function removeFile(f: AiExamFile) {
    await supabase.storage.from("sth-ai").remove([f.storage_path]);
    const { error } = await supabase.from("ai_app_files").delete().eq("id", f.id);
    if (error) { toast.error("Não foi possível excluir."); return; }
    setFiles((prev) => prev.filter((x) => x.id !== f.id));
    onChange(selected.filter((id) => id !== f.id));
  }

  function toggle(id: string, on: boolean) {
    onChange(on ? [...selected, id] : selected.filter((x) => x !== id));
  }

  return (
    <Card className="mb-4 space-y-4 p-5">
      <div>
        <p className="text-sm font-medium">Exame laboratorial (opcional, mas recomendado)</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Anexe o exame em PDF ou imagem e selecione quais arquivos a IA deve ler nesta análise.
        </p>
      </div>

      <div className="flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">Envie o exame completo.</span> Peça ao laboratório o laudo
          integral, com todas as páginas e valores de referência. Alguns marcadores levam mais dias para serem
          liberados — aguarde a liberação total antes de gerar a análise. Exames parciais reduzem a precisão da
          leitura e podem exigir uma nova análise no próximo ciclo.
        </p>
      </div>

      <div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/*"
          className="hidden"
          onChange={(e) => upload(e.target.files?.[0] ?? null)}
        />
        <Button variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          Anexar exame
        </Button>
      </div>

      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : files.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhum exame anexado ainda.</p>
      ) : (
        <ul className="space-y-2">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
              <Checkbox
                checked={selected.includes(f.id)}
                onCheckedChange={(v) => toggle(f.id, Boolean(v))}
                aria-label="Usar este exame na análise"
              />
              <button type="button" onClick={() => openFile(f)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-xs">{f.file_name ?? "Exame"}</span>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {new Date(f.created_at).toLocaleDateString("pt-BR")}
                </span>
              </button>
              <Button variant="ghost" size="icon" onClick={() => removeFile(f)} aria-label="Excluir exame">
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
