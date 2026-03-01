import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Pencil, Upload, Trash2, FileText } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminDiet = () => {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [title, setTitle] = useState("Dieta");
  const [content, setContent] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [existingPdf, setExistingPdf] = useState("");
  const [dietId, setDietId] = useState<string | null>(null);

  const { data: students } = useQuery({
    queryKey: ["admin-students-diets"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("*");
      const { data: diets } = await supabase.from("student_diets" as any).select("*");
      return (profiles || []).map((p: any) => {
        const diet = (diets as any[])?.find((d: any) => d.user_id === p.user_id);
        return { ...p, diet, initials: p.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?" };
      });
    },
  });

  const openManage = (student: any) => {
    setSelected(student);
    const diet = student.diet;
    setDietId(diet?.id || null);
    setTitle(diet?.title || "Dieta");
    setContent(diet?.content || "");
    setExistingPdf(diet?.pdf_url || "");
    setPdfFile(null);
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      let pdfUrl = existingPdf;
      if (pdfFile) {
        const path = `${selected.user_id}/diet/${pdfFile.name}`;
        await supabase.storage.from("documents").upload(path, pdfFile, { upsert: true });
        const { data } = supabase.storage.from("documents").getPublicUrl(path);
        pdfUrl = data.publicUrl;
      }
      const payload = { user_id: selected.user_id, title, content, pdf_url: pdfUrl };
      if (dietId) {
        await supabase.from("student_diets" as any).update(payload).eq("id", dietId);
      } else {
        await supabase.from("student_diets" as any).insert(payload);
      }
    },
    onSuccess: () => {
      toast.success("Dieta salva!");
      qc.invalidateQueries({ queryKey: ["admin-students-diets"] });
      setDialogOpen(false);
    },
    onError: () => toast.error("Erro ao salvar dieta"),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (dietId) await supabase.from("student_diets" as any).delete().eq("id", dietId);
    },
    onSuccess: () => {
      toast.success("Dieta removida!");
      qc.invalidateQueries({ queryKey: ["admin-students-diets"] });
      setDialogOpen(false);
    },
  });

  return (
    <DashboardLayout role="admin" title="Gestão de Dietas" subtitle="Gerencie as dietas dos alunos com PDF e texto.">
      <Card>
        <CardHeader><CardTitle className="font-display">Alunos</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-body">Aluno</TableHead>
                <TableHead className="font-body">Status da Dieta</TableHead>
                <TableHead className="font-body text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students?.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{s.initials}</span>
                      </div>
                      <p className="font-medium text-sm font-body">{s.full_name || "Sem nome"}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.diet ? "secondary" : "outline"} className="text-xs">
                      {s.diet ? "Configurada" : "Pendente"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openManage(s)}>
                      <Pencil className="w-3 h-3 mr-1" /> Gerenciar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">Dieta — {selected?.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="font-body">Título</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div>
              <Label className="font-body">Upload PDF</Label>
              <Input type="file" accept=".pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} />
              {existingPdf && (
                <a href={existingPdf} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                  <FileText className="w-3 h-3" /> Ver PDF atual
                </a>
              )}
            </div>
            <div>
              <Label className="font-body">Conteúdo (texto)</Label>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={10} placeholder="Escreva o conteúdo da dieta aqui..." />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            {dietId && (
              <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate()}>
                <Trash2 className="w-3 h-3 mr-1" /> Excluir
              </Button>
            )}
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminDiet;
