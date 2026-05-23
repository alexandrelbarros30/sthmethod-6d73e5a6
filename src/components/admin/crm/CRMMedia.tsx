import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Upload, Trash2, Star, Copy, Image as ImageIcon, FileText, Video } from "lucide-react";

const TYPE_TABS = [
  { id: "all", label: "Todas" },
  { id: "image", label: "Imagens" },
  { id: "video", label: "Vídeos" },
  { id: "pdf", label: "PDFs" },
];

interface Media {
  id: string;
  title: string | null;
  url: string;
  file_path: string | null;
  type: string;
  mime_type: string | null;
  category: string | null;
  favorite: boolean;
  size_bytes: number | null;
  created_at: string;
}

const detectType = (file: File): string => {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type === "application/pdf") return "pdf";
  return "other";
};

export default function CRMMedia() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");

  const { data: media = [], isLoading } = useQuery({
    queryKey: ["crm-media"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_media")
        .select("*")
        .order("favorite", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Media[];
    },
  });

  const filtered = media.filter((m) => {
    if (tab !== "all" && m.type !== tab) return false;
    if (search && !(m.title || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !user?.id) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("crm-media").upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("crm-media").getPublicUrl(path);
        const { error: insErr } = await supabase.from("crm_media").insert({
          title: file.name,
          url: pub.publicUrl,
          file_path: path,
          type: detectType(file),
          mime_type: file.type,
          size_bytes: file.size,
          uploaded_by: user.id,
        });
        if (insErr) throw insErr;
      }
      toast.success("Mídia(s) enviada(s)");
      qc.invalidateQueries({ queryKey: ["crm-media"] });
    } catch (e: any) {
      toast.error(e.message || "Erro no upload");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const toggleFav = async (m: Media) => {
    const { error } = await supabase.from("crm_media").update({ favorite: !m.favorite }).eq("id", m.id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["crm-media"] });
  };

  const remove = async (m: Media) => {
    if (!confirm("Excluir esta mídia?")) return;
    if (m.file_path) await supabase.storage.from("crm-media").remove([m.file_path]);
    const { error } = await supabase.from("crm_media").delete().eq("id", m.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Removida");
    qc.invalidateQueries({ queryKey: ["crm-media"] });
  };

  const copyUrl = (m: Media) => {
    navigator.clipboard.writeText(m.url);
    toast.success("URL copiada");
  };

  const renderThumb = (m: Media) => {
    if (m.type === "image") return <img src={m.url} alt={m.title || ""} className="h-full w-full object-cover" loading="lazy" />;
    if (m.type === "video") return <div className="flex h-full items-center justify-center bg-zinc-900"><Video className="h-8 w-8 text-zinc-500" /></div>;
    if (m.type === "pdf") return <div className="flex h-full items-center justify-center bg-zinc-900"><FileText className="h-8 w-8 text-rose-400" /></div>;
    return <div className="flex h-full items-center justify-center bg-zinc-900"><ImageIcon className="h-8 w-8 text-zinc-500" /></div>;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <Card className="border-border/40">
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              {TYPE_TABS.map((t) => <TabsTrigger key={t.id} value={t.id} className="text-xs">{t.label}</TabsTrigger>)}
            </TabsList>
          </Tabs>
          <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="md:max-w-xs" />
          <div className="md:ml-auto">
            <input ref={fileInputRef} type="file" multiple className="hidden"
              accept="image/*,video/*,application/pdf"
              onChange={(e) => upload(e.target.files)} />
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="gap-2 bg-emerald-500 text-black hover:bg-emerald-400">
              <Upload className="h-4 w-4" /> {uploading ? "Enviando..." : "Upload"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Carregando...</CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhuma mídia ainda. Faça o primeiro upload.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((m) => (
            <Card key={m.id} className="overflow-hidden border-border/40 transition hover:border-emerald-500/30">
              <div className="aspect-video overflow-hidden bg-muted/30">{renderThumb(m)}</div>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <p className="flex-1 truncate text-xs font-medium" title={m.title || ""}>{m.title}</p>
                  <Badge variant="outline" className="text-[9px] uppercase">{m.type}</Badge>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleFav(m)}>
                    <Star className={`h-3.5 w-3.5 ${m.favorite ? "fill-amber-400 text-amber-400" : ""}`} />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyUrl(m)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-400 ml-auto" onClick={() => remove(m)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}