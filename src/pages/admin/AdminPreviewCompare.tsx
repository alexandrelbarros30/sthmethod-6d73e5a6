import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import LazyVideoEmbed from "@/components/student/LazyVideoEmbed";
import { Search, Info } from "lucide-react";

type LibExercise = {
  id: string;
  name: string;
  muscle_group: string | null;
  video_url: string | null;
  image_url: string | null;
};

const stripAccents = (v: string) =>
  v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Mesma heurística do preview do aluno: sobe a resolução das thumbs do Vimeo. */
const upscaleThumbUrl = (raw?: string | null) => {
  if (!raw) return "";
  let out = raw.replace(/_(\d{2,4})x(\d{2,4})(?=\.(jpg|jpeg|png|webp)(\?|$))/i, "_1280");
  try {
    const u = new URL(out);
    if (/vimeocdn\.com/i.test(u.hostname)) {
      for (const [k, v] of Array.from(u.searchParams.entries())) {
        if (/^(mw|w)$/i.test(k) && Number(v) < 1280) u.searchParams.set(k, "1280");
        if (/^(mh|h)$/i.test(k)) u.searchParams.delete(k);
      }
      out = u.toString();
    }
  } catch {
    /* noop */
  }
  return out;
};

const ResolutionProbe = ({ src, label }: { src: string; label: string }) => {
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [failed, setFailed] = useState(false);

  const ratio = dims ? (dims.w / dims.h).toFixed(2) : null;
  const lowRes = dims ? dims.w < 640 : false;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {dims && (
          <Badge variant={lowRes ? "destructive" : "secondary"} className="text-[10px]">
            {dims.w}×{dims.h} · {ratio}:1
          </Badge>
        )}
        {failed && <Badge variant="outline" className="text-[10px]">sem mídia</Badge>}
      </div>
      <div className="overflow-hidden rounded-lg bg-muted/40 ring-1 ring-border/50">
        {/* Proporção nativa: sem forçar 16:9, sem recorte */}
        <img
          src={src}
          alt={label}
          className="h-auto w-full object-contain"
          referrerPolicy="no-referrer"
          onLoad={(e) =>
            setDims({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })
          }
          onError={() => setFailed(true)}
        />
      </div>
    </div>
  );
};

const AdminPreviewCompare = () => {
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(6);

  const { data: exercises, isLoading } = useQuery({
    queryKey: ["preview-compare-exercises"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exercise_library")
        .select("id,name,muscle_group,video_url,image_url")
        .not("image_url", "is", null)
        .order("name")
        .limit(300);
      if (error) throw error;
      return (data || []) as LibExercise[];
    },
  });

  const filtered = useMemo(() => {
    const q = stripAccents(search.trim());
    const list = (exercises || []).filter((ex) =>
      q ? stripAccents(`${ex.name} ${ex.muscle_group || ""}`).includes(q) : true,
    );
    return list.slice(0, limit);
  }, [exercises, search, limit]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Comparação de Preview — ST Coach × STH METHOD</h1>
          <p className="text-sm text-muted-foreground">
            Validação lado a lado de enquadramento (proporção nativa, sem recorte) e nitidez
            (resolução real da thumbnail entregue).
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar exercício (ignora acentos)"
                className="pl-9"
              />
            </div>
            <Button variant="outline" onClick={() => setLimit((l) => l + 6)}>
              Carregar mais
            </Button>
          </CardContent>
        </Card>

        <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Coluna <strong>Antes</strong>: thumbnail original como vem do ST Coach (baixa
            resolução, ex.: 295×166). Coluna <strong>Depois</strong>: thumbnail elevada para 1280px
            e o componente real do aluno com <code>object-contain</code>, preservando a proporção
            nativa. Badge vermelho indica largura abaixo de 640px (risco de granulação).
          </p>
        </div>

        {isLoading && <p className="text-sm text-muted-foreground">Carregando exercícios…</p>}

        <div className="space-y-6">
          {filtered.map((ex) => {
            const original = ex.image_url || "";
            const upgraded = upscaleThumbUrl(original) || original;

            return (
              <Card key={ex.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                    {ex.name}
                    {ex.muscle_group && (
                      <Badge variant="outline" className="text-[10px]">{ex.muscle_group}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-3">
                  <ResolutionProbe src={original} label="Antes · thumbnail ST Coach" />
                  <ResolutionProbe src={upgraded} label="Depois · thumbnail alta resolução" />
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Depois · componente do aluno
                    </span>
                    <div className="overflow-hidden rounded-lg ring-1 ring-border/50">
                      <LazyVideoEmbed
                        url={ex.video_url || ""}
                        title={ex.name}
                        posterUrl={ex.image_url}
                        kind={/\.(mp4|webm|mov)(\?|$)/i.test(ex.video_url || "") ? "file" : "embed"}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {!isLoading && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum exercício com mídia encontrado.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminPreviewCompare;