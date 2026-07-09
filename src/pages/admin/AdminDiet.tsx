import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RichTextEditor from "@/components/shared/RichTextEditor";
import RichContentRenderer from "@/components/shared/RichContentRenderer";
import DietContentRenderer from "@/components/student/DietContentRenderer";
import StudentInfoHeader from "@/components/student/StudentInfoHeader";
import DietPlanningPanel from "@/components/student/DietPlanningPanel";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, FileText, Search, Plus, Clock, Eye, EyeOff, ToggleLeft, ToggleRight, CalendarClock, BookOpen, Save, ClipboardCopy } from "lucide-react";
import DietAIAnalysis from "@/components/admin/DietAIAnalysis";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { normalizeSearch } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { notifyStudentContentUpdate } from "@/lib/notify-student-update";
import ReleaseNotifyButton from "@/components/admin/ReleaseNotifyButton";

import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { syncStudentDietMeals, MealMacros } from "@/lib/diet-meal-sync";
import { validateDietHtml, shouldValidateDiet, formatValidationMessage } from "@/lib/diet-html-validator";
import SignedPdfFrame from "@/components/shared/SignedPdfFrame";
import SignedLink from "@/components/shared/SignedLink";

const AdminDiet = () => {
  const { user, role } = useAuth();
  const displayRole = role === "consultor" ? "consultor" : "admin";
  const isMobile = useIsMobile();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [returnToEdit, setReturnToEdit] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  // New entry form
  const [newTitle, setNewTitle] = useState("Dieta");
  const [newTabLabel, setNewTabLabel] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newPdfFile, setNewPdfFile] = useState<File | null>(null);
  const [newReleaseDate, setNewReleaseDate] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [newEnergyKcal, setNewEnergyKcal] = useState("");
  const [newProteinG, setNewProteinG] = useState("");
  const [newCarbsG, setNewCarbsG] = useState("");
  const [newFatG, setNewFatG] = useState("");
  const [newHydrationL, setNewHydrationL] = useState("");
  const [newMealMacros, setNewMealMacros] = useState<MealMacros[] | null>(null);
  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editTabLabel, setEditTabLabel] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editReleaseDate, setEditReleaseDate] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editEnergyKcal, setEditEnergyKcal] = useState("");
  const [editProteinG, setEditProteinG] = useState("");
  const [editCarbsG, setEditCarbsG] = useState("");
  const [editFatG, setEditFatG] = useState("");
  const [editHydrationL, setEditHydrationL] = useState("");
  const [editMealMacros, setEditMealMacros] = useState<MealMacros[] | null>(null);
  const [editCreatedAt, setEditCreatedAt] = useState<string | null>(null);

  // Validates new diet rules (cutoff 11/05/26). Returns true if save can proceed.
  const confirmDietValidation = (html: string, createdAt?: string | null): boolean => {
    if (!shouldValidateDiet(createdAt)) return true;
    const result = validateDietHtml(html);
    if (result.ok) return true;
    if (result.hasBlocking) {
      // Hard block: cannot save — student would lose the interactive view.
      window.alert(formatValidationMessage(result));
      toast.error("Dieta não salva: corrija os erros do HTML antes de continuar.");
      return false;
    }
    const proceed = window.confirm(formatValidationMessage(result));
    if (!proceed) {
      toast.warning("Salvamento cancelado. Ajuste o HTML conforme as novas regras.");
    }
    return proceed;
  };
  // Preview
  const [previewDiet, setPreviewDiet] = useState<any>(null);

  // Delete
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Library
  const { data: libraryItems } = useQuery({
    queryKey: ["diet-library"],
    queryFn: async () => {
      const { data } = await supabase.from("diet_library" as any).select("*").order("title");
      return (data || []) as any[];
    },
  });

  const saveToLibraryMutation = useMutation({
    mutationFn: async (diet: any) => {
      await (supabase.from("diet_library" as any) as any).insert({
        title: diet.title,
        content: diet.content || "",
        created_by: user!.id,
        energy_kcal: diet.energy_kcal || 0,
        protein_g: diet.protein_g || 0,
        carbs_g: diet.carbs_g || 0,
        fat_g: diet.fat_g || 0,
        hydration_l: diet.hydration_l || 0,
      });
    },
    onSuccess: () => {
      toast.success("Dieta salva na biblioteca com macros!");
      qc.invalidateQueries({ queryKey: ["diet-library"] });
    },
    onError: () => toast.error("Erro ao salvar na biblioteca"),
  });

  const applyFromLibrary = (libId: string) => {
    const item = libraryItems?.find((l: any) => l.id === libId);
    if (item) {
      setNewTitle(item.title);
      setNewContent(item.content || "");
      setNewEnergyKcal(item.energy_kcal != null ? String(item.energy_kcal) : "");
      setNewProteinG(item.protein_g != null ? String(item.protein_g) : "");
      setNewCarbsG(item.carbs_g != null ? String(item.carbs_g) : "");
      setNewFatG(item.fat_g != null ? String(item.fat_g) : "");
      setNewHydrationL(item.hydration_l != null && item.hydration_l > 0 ? String(item.hydration_l) : "");
      toast.success("Dieta carregada da biblioteca com macros e hidratação!");
    }
  };

  const copyDietPrompt = async () => {
    if (!selected) return;
    const nome = selected.full_name || "[Não informado]";
    let idade = "[Não informada]";
    if (selected.birth_date) {
      const b = new Date(selected.birth_date);
      const diff = Date.now() - b.getTime();
      const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
      if (!isNaN(age)) idade = `${age} anos`;
    }
    // try latest weight log
    let pesoAtual = selected.weight ? `${selected.weight} kg` : "[Não informado]";
    try {
      const { data: wl } = await supabase
        .from("weight_logs")
        .select("weight")
        .eq("user_id", selected.user_id)
        .order("logged_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (wl?.weight) pesoAtual = `${wl.weight} kg`;
    } catch {}
    const altura = selected.height ? `${selected.height} cm` : "[Não informada]";
    const objetivo = selected.objective || "[Não informado]";

    const prompt = `Solicito a criação de um novo Cardápio STH Method para o seguinte perfil:

DADOS DO ALUNO

Nome: ${nome}

Idade: ${idade}

Peso: ${pesoAtual}

Altura: ${altura}

Objetivo: ${objetivo}

Cardápio STH Method:
Meta: [Inserir kcal] | [Inserir macros: Prot/Gord/Carbo]

Formato: 6 refeições (ou a quantidade necessária) com 4 opções de substituição em cada refeição, garantindo a precisão das quantidades em gramas/ml.`;

    try {
      await navigator.clipboard.writeText(prompt);
      toast.success("Prompt do cardápio copiado!");
    } catch {
      toast.error("Não foi possível copiar. Tente novamente.");
    }
  };

  const { data: students } = useQuery({
    queryKey: ["admin-students-diets", displayRole, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      let allowedStudentIds: string[] | null = null;

      if (displayRole === "consultor") {
        const { data: links, error: linksError } = await supabase
          .from("consultant_students")
          .select("student_id")
          .eq("consultant_id", user.id);

        if (linksError) throw linksError;

        allowedStudentIds = (links || []).map((l: any) => l.student_id);
        if (allowedStudentIds.length === 0) return [];
      }

      let profilesQuery = supabase
        .from("profiles")
        .select("user_id, full_name, email, birth_date, weight, height, objective");

      if (allowedStudentIds) {
        profilesQuery = profilesQuery.in("user_id", allowedStudentIds);
      }

      const { data: profiles, error: profilesError } = await profilesQuery;
      if (profilesError) throw profilesError;

      let dietsQuery = supabase
        .from("student_diets")
        .select("*")
        .order("created_at", { ascending: false });

      if (allowedStudentIds) {
        dietsQuery = dietsQuery.in("user_id", allowedStudentIds);
      }

      const { data: diets, error: dietsError } = await dietsQuery;
      if (dietsError) throw dietsError;

      return (profiles || []).map((p: any) => {
        const studentDiets = (diets as any[])?.filter((d: any) => d.user_id === p.user_id) || [];
        return {
          ...p,
          diets: studentDiets,
          dietCount: studentDiets.length,
          initials: p.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?",
        };
      });
    },
    enabled: !!user?.id,
  });

  const { data: studentDiets, refetch: refetchDiets } = useQuery({
    queryKey: ["admin-student-diets-detail", selected?.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_diets")
        .select("*")
        .eq("user_id", selected!.user_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!selected?.user_id && dialogOpen,
  });

  // Auto-select student from URL param
  useEffect(() => {
    const uid = searchParams.get("uid");
    if (uid && students?.length && !selected) {
      const found = students.find((s: any) => s.user_id === uid);
      if (found) {
        const returnParam = searchParams.get("return");
        if (returnParam === "edit" || returnParam === "manage") setReturnToEdit(returnParam === "manage" ? `manage:${uid}` : uid);
        setSelected(found);
        setShowNewForm(false);
        setEditingId(null);
        setPreviewDiet(null);
        setNewTitle("Dieta");
        setNewContent("");
        setNewPdfFile(null);
        setDialogOpen(true);
        searchParams.delete("uid");
        searchParams.delete("return");
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [students, searchParams]);

  const openManage = (student: any) => {
    setSelected(student);
    setShowNewForm(false);
    setEditingId(null);
    setPreviewDiet(null);
    resetNewForm();
    setDialogOpen(true);
  };

  const resetNewForm = () => {
    setNewTitle("Dieta");
    setNewTabLabel("");
    setNewContent("");
    setNewPdfFile(null);
    setNewReleaseDate("");
    setNewStartDate("");
    setNewEndDate("");
    setNewEnergyKcal("");
    setNewProteinG("");
    setNewCarbsG("");
    setNewFatG("");
    setNewHydrationL("");
    setNewMealMacros(null);
  };

  const startEdit = async (diet: any) => {
    const d = new Date(diet.created_at);
    setEditingId(diet.id);
    setEditCreatedAt(diet.created_at || null);
    setEditTitle(diet.title || "");
    setEditTabLabel(diet.tab_label || "");
    setEditContent(diet.content || "");
    setEditDate(d.toISOString().slice(0, 10));
    setEditTime(d.toTimeString().slice(0, 5));
    setEditReleaseDate(diet.release_date ? new Date(diet.release_date).toISOString().slice(0, 10) : "");
    setEditStartDate(diet.start_date || "");
    setEditEndDate(diet.end_date || "");
    setEditEnergyKcal(diet.energy_kcal != null ? String(diet.energy_kcal) : "");
    setEditProteinG(diet.protein_g != null ? String(diet.protein_g) : "");
    setEditCarbsG(diet.carbs_g != null ? String(diet.carbs_g) : "");
    setEditFatG(diet.fat_g != null ? String(diet.fat_g) : "");
    setEditHydrationL(diet.hydration_l != null ? String(diet.hydration_l) : "");
    setPreviewDiet(null);

    // Recuperar macros por refeição existentes para não perder na edição
    try {
      const { data: meals } = await supabase
        .from("diet_meals")
        .select("id, sort_order, diet_foods(energy_kcal, protein_g, carbs_g, fat_g)")
        .eq("diet_id", diet.id)
        .order("sort_order");

      if (meals && meals.length > 0) {
        const recoveredMacros = meals.map((m: any, idx) => {
          const foodSums = (m.diet_foods || []).reduce((acc: any, f: any) => ({
            energy_kcal: acc.energy_kcal + (f.energy_kcal || 0),
            protein_g: acc.protein_g + (f.protein_g || 0),
            carbs_g: acc.carbs_g + (f.carbs_g || 0),
            fat_g: acc.fat_g + (f.fat_g || 0),
          }), { energy_kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });

          return {
            meal_number: idx + 1,
            energy_kcal: foodSums.energy_kcal,
            protein_g: foodSums.protein_g,
            carbs_g: foodSums.carbs_g,
            fat_g: foodSums.fat_g,
          };
        });
        setEditMealMacros(recoveredMacros);
      }
    } catch (err) {
      console.error("Erro ao recuperar macros das refeições:", err);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditTabLabel("");
    setEditContent("");
    setEditDate("");
    setEditTime("");
    setEditEnergyKcal("");
    setEditProteinG("");
    setEditCarbsG("");
    setEditFatG("");
    setEditHydrationL("");
    setEditMealMacros(null);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      let pdfUrl = "";
      let pdfStoragePath: string | null = null;
      if (newPdfFile) {
        const path = `${selected.user_id}/diet/${Date.now()}_${newPdfFile.name}`;
        const { error: uploadError } = await supabase.storage.from("documents").upload(path, newPdfFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("documents").getPublicUrl(path);
        pdfUrl = data.publicUrl;
        pdfStoragePath = path;
      }
      const payload: any = {
        user_id: selected.user_id,
        title: newTitle,
        tab_label: newTabLabel || null,
        content: newContent,
        pdf_url: pdfUrl,
        storage_path: pdfStoragePath,
        release_date: newReleaseDate ? new Date(newReleaseDate + "T00:00:00").toISOString() : null,
        start_date: newStartDate || null,
        end_date: newEndDate || null,
        energy_kcal: newEnergyKcal ? parseFloat(newEnergyKcal) : null,
        protein_g: newProteinG ? parseFloat(newProteinG) : null,
        carbs_g: newCarbsG ? parseFloat(newCarbsG) : null,
        fat_g: newFatG ? parseFloat(newFatG) : null,
        hydration_l: newHydrationL ? parseFloat(newHydrationL) : null,
      };

      // Limit 5 abas
      const { count } = await supabase
        .from("student_diets")
        .select("id", { count: "exact", head: true })
        .eq("user_id", selected.user_id);
      if ((count || 0) >= 5) {
        throw new Error("Limite de 5 cardápios por aluno atingido. Exclua um antes de criar outro.");
      }
      const { data: inserted, error: insertError } = await supabase
        .from("student_diets")
        .insert(payload)
        .select("id")
        .single();
      if (insertError) throw insertError;
      // Each diet has its own set of interactive meals
      if (inserted?.id) {
        await syncStudentDietMeals(selected.user_id, newContent, newMealMacros || undefined, inserted.id);
      }
    },
    onSuccess: () => {
      toast.success("Dieta adicionada e vinculada ao aluno!");
      qc.invalidateQueries({ queryKey: ["admin-students-diets"] });
      refetchDiets();
      setShowNewForm(false);
      resetNewForm();
      if (selected?.user_id) notifyStudentContentUpdate(selected.user_id, "diet");
    },
    onError: (error: any) => toast.error(error?.message || "Erro ao salvar dieta"),
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      const newCreatedAt = new Date(`${editDate}T${editTime}:00`).toISOString();
      const { error: updateError } = await supabase
        .from("student_diets")
        .update({
          title: editTitle,
          tab_label: editTabLabel || null,
          content: editContent,
          created_at: newCreatedAt,
          release_date: editReleaseDate ? new Date(editReleaseDate + "T00:00:00").toISOString() : null,
          start_date: editStartDate || null,
          end_date: editEndDate || null,
          energy_kcal: editEnergyKcal ? parseFloat(editEnergyKcal) : null,
          protein_g: editProteinG ? parseFloat(editProteinG) : null,
          carbs_g: editCarbsG ? parseFloat(editCarbsG) : null,
          fat_g: editFatG ? parseFloat(editFatG) : null,
          hydration_l: editHydrationL ? parseFloat(editHydrationL) : null,
          seen_by_student: false,
        } as any)
        .eq("id", editingId!);

      if (updateError) throw updateError;
      // Re-sync this diet's own meals
      await syncStudentDietMeals(selected.user_id, editContent, editMealMacros || undefined, editingId!);
    },
    onSuccess: () => {
      toast.success("Dieta atualizada e sincronizada com o aluno!");
      qc.invalidateQueries({ queryKey: ["admin-students-diets"] });
      refetchDiets();
      cancelEdit();
      if (selected?.user_id) notifyStudentContentUpdate(selected.user_id, "diet");
    },
    onError: (error: any) => toast.error(error?.message || "Erro ao atualizar dieta"),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!deletingId) return;

      // Remove this diet's own meals/foods first (in case FK is not set up)
      const { data: dmeals } = await supabase
        .from("diet_meals")
        .select("id")
        .eq("diet_id", deletingId as any);
      if (dmeals?.length) {
        const ids = dmeals.map((d: any) => d.id);
        await supabase.from("diet_foods").delete().in("meal_id", ids);
        await supabase.from("diet_meals").delete().in("id", ids);
      }
      const { error: deleteError } = await supabase.from("student_diets").delete().eq("id", deletingId);
      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      toast.success("Dieta removida e visão do aluno atualizada!");
      qc.invalidateQueries({ queryKey: ["admin-students-diets"] });
      refetchDiets();
      setConfirmDeleteOpen(false);
      setDeletingId(null);
    },
    onError: (error: any) => toast.error(error?.message || "Erro ao remover dieta"),
  });

  const confirmDelete = (id: string) => {
    setDeletingId(id);
    setConfirmDeleteOpen(true);
  };

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("student_diets")
        .update({ is_active: active, visible: active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-students-diets"] });
      refetchDiets();
    },
    onError: (e: any) => {
      console.error("toggleActive error", e);
      toast.error(e?.message || "Erro ao alterar status do cardápio");
    },
  });

  const filteredStudents = search.trim().length < 2
    ? []
    : (students || []).filter((s: any) => {
        const q = normalizeSearch(search);
        return normalizeSearch(s.full_name).includes(q) || normalizeSearch(s.email).includes(q);
      });

  return (
    <DashboardLayout role={displayRole} title="Gestão de Dietas" subtitle="Gerencie as dietas dos alunos com histórico completo.">
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Alunos</CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou e-mail..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {search.trim().length < 2 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Digite pelo menos 2 caracteres para buscar alunos.</p>
          ) : isMobile ? (
            filteredStudents.length > 0 ? (
              filteredStudents.map((s: any) => (
                <div key={s.user_id} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">{s.initials}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm font-body break-words">{s.full_name || "Sem nome"}</p>
                        <p className="text-xs text-muted-foreground break-words">{s.email || "Sem e-mail"}</p>
                      </div>
                    </div>
                    <Badge variant={s.dietCount > 0 ? "secondary" : "outline"} className="text-[10px] shrink-0">
                      {s.dietCount > 0 ? `${s.dietCount} registro(s)` : "Nenhuma"}
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openManage(s)} className="w-full mt-3">
                    <Pencil className="w-3 h-3 mr-1" /> Gerenciar
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum aluno encontrado.</p>
            )
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-body">Aluno</TableHead>
                  <TableHead className="font-body">Dietas</TableHead>
                  <TableHead className="font-body text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((s: any) => (
                  <TableRow key={s.user_id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">{s.initials}</span>
                        </div>
                        <p className="font-medium text-sm font-body">{s.full_name || "Sem nome"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.dietCount > 0 ? "secondary" : "outline"} className="text-xs">
                        {s.dietCount > 0 ? `${s.dietCount} registro(s)` : "Nenhuma"}
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
          )}
        </CardContent>
      </Card>

      {/* Diet Management Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => {
        setDialogOpen(o);
        if (!o && returnToEdit) {
          if (returnToEdit.startsWith("manage:")) {
            navigate(`/admin/students?manage=${returnToEdit.replace("manage:", "")}`);
          } else {
            navigate(`/admin/students?edit=${returnToEdit}`);
          }
          setReturnToEdit(null);
        }
      }}>
        <DialogContent
          className={isMobile
            ? "!inset-0 !left-0 !top-0 !translate-x-0 !translate-y-0 !w-screen !max-w-none !h-[100dvh] !max-h-none rounded-none border-0 p-2 !flex !flex-col overflow-hidden"
            : "w-[calc(100vw-0.75rem)] max-w-2xl max-h-[94dvh] min-h-0 overflow-hidden !flex !flex-col p-3 sm:p-6"
          }
        >
          <DialogHeader className="pr-8">
            <DialogTitle className="font-display text-base sm:text-lg">Dietas — {selected?.full_name}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">Edite com clareza no mobile e desktop.</DialogDescription>
            {selected?.user_id && (
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <ReleaseNotifyButton userId={selected.user_id} type="diet" />
              </div>
            )}
            {selected?.user_id && (
              <Button
                variant="secondary"
                size="sm"
                className="mt-2 w-full sm:w-auto"
                onClick={() => window.open(`/dashboard/diet?preview_as=${selected.user_id}`, "_blank", "noopener,noreferrer")}
              >
                <Eye className="w-4 h-4 mr-1" /> Visualizar como aluno
              </Button>
            )}
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto pr-1 sm:pr-4">
            <div className="space-y-4">
              {selected?.user_id && (
                <DietPlanningPanel targetUserId={selected.user_id} />
              )}
              {/* Add new diet button */}
              {!showNewForm && !editingId && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={() => setShowNewForm(true)} className="flex-1" variant="outline">
                    <Plus className="w-4 h-4 mr-2" /> Adicionar Nova Dieta
                  </Button>
                  <Button onClick={copyDietPrompt} variant="secondary" className="flex-1">
                    <ClipboardCopy className="w-4 h-4 mr-2" /> Resgatar Dados p/ Cardápio
                  </Button>
                </div>
              )}

              {/* New diet form */}
              {showNewForm && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-display flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Nova Dieta
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Use from library */}
                    {libraryItems && libraryItems.length > 0 && (
                      <div>
                        <Label className="font-body flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> Usar da Biblioteca</Label>
                        <Select onValueChange={applyFromLibrary}>
                          <SelectTrigger><SelectValue placeholder="Selecionar modelo..." /></SelectTrigger>
                          <SelectContent>
                            {libraryItems.map((lib: any) => (
                              <SelectItem key={lib.id} value={lib.id}>
                                {lib.title} {lib.energy_kcal ? `(${lib.energy_kcal} kcal)` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div>
                      <Label className="font-body">Título</Label>
                      <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                      <p className="text-[10px] text-muted-foreground mt-1">Nome interno (também usado ao salvar na biblioteca).</p>
                    </div>
                    <div>
                      <Label className="font-body">Nome da aba (visível ao aluno)</Label>
                      <Input value={newTabLabel} onChange={(e) => setNewTabLabel(e.target.value)} placeholder="Ex.: Dia de treino, Dia OFF" />
                      <p className="text-[10px] text-muted-foreground mt-1">Aparece no botão de escolha do aluno. Se vazio, usa o título.</p>
                    </div>
                    <div>
                      <Label className="font-body">Upload PDF</Label>
                      <Input type="file" accept=".pdf" onChange={(e) => setNewPdfFile(e.target.files?.[0] || null)} />
                    </div>
                    <div>
                      <Label className="font-body flex items-center gap-1"><CalendarClock className="w-3.5 h-3.5" /> Data de liberação (opcional)</Label>
                      <Input type="date" value={newReleaseDate} onChange={(e) => setNewReleaseDate(e.target.value)} />
                      <p className="text-[10px] text-muted-foreground mt-1">Se preenchida, o aluno só verá a dieta a partir desta data.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="font-body text-xs">Início da aba</Label>
                        <Input type="date" value={newStartDate} onChange={(e) => setNewStartDate(e.target.value)} />
                      </div>
                      <div>
                        <Label className="font-body text-xs">Encerramento</Label>
                        <Input type="date" value={newEndDate} onChange={(e) => setNewEndDate(e.target.value)} />
                      </div>
                    </div>
                    {/* Macronutrientes */}
                    <div>
                      <Label className="font-body text-xs font-semibold">Macronutrientes (opcional)</Label>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 mt-1">
                        <div>
                          <Label className="font-body text-[10px] text-muted-foreground">Energia (kcal)</Label>
                          <Input type="number" placeholder="0" value={newEnergyKcal} onChange={(e) => setNewEnergyKcal(e.target.value)} />
                        </div>
                        <div>
                          <Label className="font-body text-[10px] text-muted-foreground">Proteínas (g)</Label>
                          <Input type="number" placeholder="0" value={newProteinG} onChange={(e) => setNewProteinG(e.target.value)} />
                        </div>
                        <div>
                          <Label className="font-body text-[10px] text-muted-foreground">Carboidratos (g)</Label>
                          <Input type="number" placeholder="0" value={newCarbsG} onChange={(e) => setNewCarbsG(e.target.value)} />
                        </div>
                        <div>
                          <Label className="font-body text-[10px] text-muted-foreground">Lipídios (g)</Label>
                          <Input type="number" placeholder="0" value={newFatG} onChange={(e) => setNewFatG(e.target.value)} />
                        </div>
                        <div>
                          <Label className="font-body text-[10px] text-muted-foreground">Hidratação (l)</Label>
                          <Input type="number" step="0.1" placeholder="0" value={newHydrationL} onChange={(e) => setNewHydrationL(e.target.value)} />
                        </div>
                      </div>
                    </div>
                     <div>
                      <Label className="font-body">Conteúdo</Label>
                      <RichTextEditor value={newContent} onChange={setNewContent} placeholder="Escreva o conteúdo da dieta aqui..." />
                    </div>
                    {/* AI Analysis */}
                    <DietAIAnalysis
                      dietContent={newContent}
                      onConfirm={(result) => {
                        setNewEnergyKcal(String(Math.round(result.total.energy_kcal)));
                        setNewProteinG(String(Math.round(result.total.protein_g)));
                        setNewCarbsG(String(Math.round(result.total.carbs_g)));
                        setNewFatG(String(Math.round(result.total.fat_g)));
                        setNewMealMacros(result.meals.map((m) => ({
                          meal_number: m.meal_number,
                          energy_kcal: m.energy_kcal,
                          protein_g: m.protein_g,
                          carbs_g: m.carbs_g,
                          fat_g: m.fat_g,
                        })));
                        toast.success("Valores da IA aplicados nos macronutrientes!");
                      }}
                    />
                    <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                      <Button variant="ghost" size="sm" onClick={() => { setShowNewForm(false); resetNewForm(); }} className="w-full sm:w-auto">
                        Cancelar
                      </Button>
                      <Button size="sm" onClick={() => { if (confirmDietValidation(newContent, null)) saveMutation.mutate(); }} disabled={saveMutation.isPending} className="w-full sm:w-auto">
                        {saveMutation.isPending ? "Salvando..." : "Salvar"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Diet History */}
              {studentDiets && studentDiets.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground font-display flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Histórico de Dietas
                  </h3>
                  {studentDiets.map((diet: any) => (
                    <Card key={diet.id} className={`relative ${diet.end_date && new Date(diet.end_date) < new Date() ? "opacity-50 grayscale" : ""} ${diet.is_active ? "ring-2 ring-primary" : ""}`}>
                      <CardContent className="pt-4 pb-3">
                        {editingId === diet.id ? (
                          /* Edit mode */
                          <div className="space-y-3">
                            <div>
                              <Label className="font-body text-xs">Título</Label>
                              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                              <p className="text-[10px] text-muted-foreground mt-1">Nome interno (também usado ao salvar na biblioteca).</p>
                            </div>
                            <div>
                              <Label className="font-body text-xs">Nome da aba (visível ao aluno)</Label>
                              <Input value={editTabLabel} onChange={(e) => setEditTabLabel(e.target.value)} placeholder="Ex.: Dia de treino, Dia OFF" />
                              <p className="text-[10px] text-muted-foreground mt-1">Aparece no botão de escolha do aluno. Se vazio, usa o título.</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <Label className="font-body text-xs">Data</Label>
                                <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                              </div>
                              <div>
                                <Label className="font-body text-xs">Horário</Label>
                                <Input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} />
                              </div>
                              <div className="sm:col-span-2">
                                <Label className="font-body text-xs flex items-center gap-1"><CalendarClock className="w-3 h-3" /> Data de liberação</Label>
                                <Input type="date" value={editReleaseDate} onChange={(e) => setEditReleaseDate(e.target.value)} />
                                <p className="text-[10px] text-muted-foreground mt-1">Deixe vazio para liberar imediatamente.</p>
                              </div>
                              <div>
                                <Label className="font-body text-xs">Início da aba</Label>
                                <Input type="date" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} />
                              </div>
                              <div>
                                <Label className="font-body text-xs">Encerramento</Label>
                                <Input type="date" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} />
                              </div>
                            </div>
                            {/* Macronutrientes */}
                            <div>
                              <Label className="font-body text-xs font-semibold">Macronutrientes</Label>
                              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 mt-1">
                                <div>
                                  <Label className="font-body text-[10px] text-muted-foreground">Energia (kcal)</Label>
                                  <Input type="number" placeholder="0" value={editEnergyKcal} onChange={(e) => setEditEnergyKcal(e.target.value)} />
                                </div>
                                <div>
                                  <Label className="font-body text-[10px] text-muted-foreground">Proteínas (g)</Label>
                                  <Input type="number" placeholder="0" value={editProteinG} onChange={(e) => setEditProteinG(e.target.value)} />
                                </div>
                                <div>
                                  <Label className="font-body text-[10px] text-muted-foreground">Carboidratos (g)</Label>
                                  <Input type="number" placeholder="0" value={editCarbsG} onChange={(e) => setEditCarbsG(e.target.value)} />
                                </div>
                                <div>
                                  <Label className="font-body text-[10px] text-muted-foreground">Lipídios (g)</Label>
                                  <Input type="number" placeholder="0" value={editFatG} onChange={(e) => setEditFatG(e.target.value)} />
                                </div>
                                <div>
                                  <Label className="font-body text-[10px] text-muted-foreground">Hidratação (l)</Label>
                                  <Input type="number" step="0.1" placeholder="0" value={editHydrationL} onChange={(e) => setEditHydrationL(e.target.value)} />
                                </div>
                              </div>
                            </div>
                            <div>
                              <Label className="font-body text-xs">Conteúdo</Label>
                              <RichTextEditor value={editContent} onChange={setEditContent} />
                            </div>
                            {/* AI Analysis in edit mode */}
                            <DietAIAnalysis
                              dietContent={editContent}
                              onConfirm={(result) => {
                                setEditEnergyKcal(String(Math.round(result.total.energy_kcal)));
                                setEditProteinG(String(Math.round(result.total.protein_g)));
                                setEditCarbsG(String(Math.round(result.total.carbs_g)));
                                setEditFatG(String(Math.round(result.total.fat_g)));
                                setEditMealMacros(result.meals.map((m) => ({
                                  meal_number: m.meal_number,
                                  energy_kcal: m.energy_kcal,
                                  protein_g: m.protein_g,
                                  carbs_g: m.carbs_g,
                                  fat_g: m.fat_g,
                                })));
                                toast.success("Valores da IA aplicados nos macronutrientes!");
                              }}
                            />
                            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                              <Button variant="ghost" size="sm" onClick={cancelEdit} className="w-full sm:w-auto">Cancelar</Button>
                              <Button size="sm" onClick={() => { if (confirmDietValidation(editContent, editCreatedAt)) editMutation.mutate(); }} disabled={editMutation.isPending} className="w-full sm:w-auto">
                                {editMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          /* View mode */
                          <div className="space-y-3">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <p className="font-medium text-sm font-body">{diet.title}</p>
                                  <Badge variant="outline" className="text-[10px] shrink-0">
                                    {new Date(diet.created_at).toLocaleDateString("pt-BR")} às {new Date(diet.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                  </Badge>
                                  {diet.is_active ? (
                                    <Badge className="text-[10px] bg-primary text-primary-foreground">Ativo</Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-[10px] bg-muted text-muted-foreground">Inativo</Badge>
                                  )}
                                  {diet.end_date && new Date(diet.end_date) < new Date() && (
                                    <Badge variant="secondary" className="text-[10px] bg-muted text-muted-foreground">Encerrada</Badge>
                                  )}
                                  {(diet.start_date || diet.end_date) && (
                                    <Badge variant="outline" className="text-[10px]">
                                      {diet.start_date ? new Date(diet.start_date).toLocaleDateString("pt-BR") : "—"} → {diet.end_date ? new Date(diet.end_date).toLocaleDateString("pt-BR") : "—"}
                                    </Badge>
                                  )}
                                  {diet.release_date && new Date(diet.release_date) > new Date() && (
                                    <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-600">
                                      <CalendarClock className="w-2.5 h-2.5 mr-0.5" />
                                      Libera em {new Date(diet.release_date).toLocaleDateString("pt-BR")}
                                    </Badge>
                                  )}
                                  {diet.release_date && new Date(diet.release_date) <= new Date() && (
                                    <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-600">
                                      Liberada
                                    </Badge>
                                  )}
                                </div>

                                {(diet.energy_kcal || diet.protein_g || diet.carbs_g || diet.fat_g || diet.hydration_l) && (
                                  <div className="flex flex-wrap gap-1.5 mb-1">
                                    {diet.energy_kcal && (
                                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-orange-500/10 text-orange-600 border border-orange-500/20">
                                        🔥 {diet.energy_kcal} kcal
                                      </span>
                                    )}
                                    {diet.protein_g && (
                                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                                        💪 {diet.protein_g}g P
                                      </span>
                                    )}
                                    {diet.carbs_g && (
                                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                                        🍞 {diet.carbs_g}g C
                                      </span>
                                    )}
                                    {diet.fat_g && (
                                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-yellow-500/10 text-yellow-700 border border-yellow-500/20">
                                        🥑 {diet.fat_g}g G
                                      </span>
                                    )}
                                    {diet.hydration_l && (
                                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/10 text-cyan-600 border border-cyan-500/20">
                                        💧 {diet.hydration_l}L
                                      </span>
                                    )}
                                  </div>
                                )}

                                {diet.pdf_url && (
                                  <SignedLink
                                    bucket="documents"
                                    storagePath={(diet as any).storage_path}
                                    publicUrl={diet.pdf_url}
                                    className="text-xs text-primary hover:underline flex items-center gap-1 mb-1"
                                  >
                                    <FileText className="w-3 h-3" /> Ver PDF
                                  </SignedLink>
                                )}

                                {diet.content && !previewDiet && (
                                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mt-1">
                                    {diet.content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 120)}…
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-1 sm:flex-col sm:items-center shrink-0 self-end sm:self-auto">
                                <div
                                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${diet.is_active ? "border-primary/40 bg-primary/10" : "border-border bg-muted/40"}`}
                                  title={diet.is_active ? "Ativo — aparece como aba no aluno" : "Inativo — aluno não vê esta aba"}
                                >
                                  <Switch
                                    checked={!!diet.is_active}
                                    onCheckedChange={(checked) => toggleActive.mutate({ id: diet.id, active: checked })}
                                    className="scale-75"
                                  />
                                  <span className="text-[10px] font-semibold uppercase tracking-wide">
                                    {diet.is_active ? "Ativo" : "Inativo"}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground hover:text-primary"
                                  onClick={() => setPreviewDiet(previewDiet === diet.id ? null : diet.id)}
                                  title="Visualizar"
                                >
                                  {previewDiet === diet.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground hover:text-primary"
                                  onClick={() => startEdit(diet)}
                                  title="Editar"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground hover:text-primary"
                                  onClick={() => saveToLibraryMutation.mutate(diet)}
                                  title="Salvar na Biblioteca"
                                >
                                  <Save className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => confirmDelete(diet.id)}
                                  title="Excluir"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            {previewDiet === diet.id && (
                              <div className="p-3 rounded-lg bg-muted/50 border border-border w-full overflow-x-hidden">
                                {(() => {
                                  const age = selected?.birth_date
                                    ? Math.floor((Date.now() - new Date(selected.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                                    : undefined;
                                  return (
                                    <StudentInfoHeader info={{
                                      name: selected?.full_name,
                                      age,
                                      weight: selected?.weight || undefined,
                                      height: selected?.height || undefined,
                                      objective: selected?.objective || undefined,
                                      startDate: new Date(diet.created_at).toLocaleDateString("pt-BR"),
                                      hydration: diet.hydration_l ? `${diet.hydration_l} litros` : undefined,
                                      totalEnergy: diet.energy_kcal || undefined,
                                      protein: diet.protein_g || undefined,
                                      carbs: diet.carbs_g || undefined,
                                      fat: diet.fat_g || undefined,
                                    }} />
                                  );
                                })()}
                                {diet.pdf_url && (
                                  <SignedPdfFrame
                                    bucket="documents"
                                    storagePath={(diet as any).storage_path}
                                    publicUrl={diet.pdf_url}
                                    className="w-full h-[400px] rounded-lg border border-border mb-3"
                                    title="Dieta PDF"
                                  />
                                )}
                                {diet.content && (
                                  /<[a-z][\s\S]*>/i.test(diet.content)
                                    ? <RichContentRenderer content={diet.content} />
                                    : <DietContentRenderer content={diet.content} showHeader={false} />
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhuma dieta cadastrada ainda.</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete */}
      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta dieta? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default AdminDiet;
