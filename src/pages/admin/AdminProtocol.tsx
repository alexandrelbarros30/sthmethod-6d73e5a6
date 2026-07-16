import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
// ProtocolItemsManager removed - editing is now inline in ProtocolInfoPanel
import ProtocolExtraCategoriesManager from "@/components/admin/ProtocolExtraCategoriesManager";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RichTextEditor from "@/components/shared/RichTextEditor";
import RichContentRenderer from "@/components/shared/RichContentRenderer";
import StudentInfoHeader from "@/components/student/StudentInfoHeader";
import ProtocolInfoPanel from "@/components/student/ProtocolInfoPanel";
import GamifiedProtocolPanel from "@/components/student/GamifiedProtocolPanel";
import ProtocolContinuityCard from "@/components/admin/ProtocolContinuityCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { normalizeSearch } from "@/lib/utils";
import { Pencil, Trash2, FileText, Search, Plus, Clock, Eye, EyeOff, BookOpen, Save, Download, ClipboardCopy, Copy, ClipboardPaste, FileText as FileTextIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { notifyStudentContentUpdate } from "@/lib/notify-student-update";
import ReleaseNotifyButton from "@/components/admin/ReleaseNotifyButton";
import { useAuth } from "@/contexts/AuthContext";
import SignedPdfFrame from "@/components/shared/SignedPdfFrame";
import { hasSmartProtocolStructure, isSmartProtocolEra } from "@/lib/protocol-phase-parser";

const AdminProtocol = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [returnToEdit, setReturnToEdit] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  // New entry form
  const [newTitle, setNewTitle] = useState("Protocolo");
  const [newContent, setNewContent] = useState("");
  const [newPdfFile, setNewPdfFile] = useState<File | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newReleaseDate, setNewReleaseDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");

  // Preview
  const [previewProtocol, setPreviewProtocol] = useState<any>(null);

  // Delete
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Library
  const [libraryDialogOpen, setLibraryDialogOpen] = useState(false);
  const [librarySearch, setLibrarySearch] = useState("");

  const { data: students } = useQuery({
    queryKey: ["admin-students-protocols"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, email");
      const { data: protocols } = await supabase.from("student_protocols").select("*").order("created_at", { ascending: false });
      return (profiles || []).map((p: any) => {
        const studentProtocols = (protocols as any[])?.filter((d: any) => d.user_id === p.user_id) || [];
        return {
          ...p,
          protocols: studentProtocols,
          protocolCount: studentProtocols.length,
          initials: p.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?",
        };
      });
    },
  });

  const { data: studentProtocols, refetch: refetchProtocols } = useQuery({
    queryKey: ["admin-student-protocols-detail", selected?.user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("student_protocols")
        .select("*")
        .eq("user_id", selected!.user_id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!selected?.user_id && dialogOpen,
  });

  const { data: selectedProfile } = useQuery({
    queryKey: ["admin-student-profile-protocol", selected?.user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", selected!.user_id)
        .single();
      return data;
    },
    enabled: !!selected?.user_id && dialogOpen,
  });

  const { data: protocolItems = [] } = useQuery({
    queryKey: ["admin-protocol-items", selected?.user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("protocols")
        .select("*")
        .eq("user_id", selected!.user_id)
        .order("category")
        .order("sort_order");
      return data || [];
    },
    enabled: !!selected?.user_id && dialogOpen,
  });

  // Protocol Library
  const { data: libraryItems = [] } = useQuery({
    queryKey: ["protocol-library"],
    queryFn: async () => {
      const { data } = await supabase.from("protocol_library" as any).select("*").order("created_at", { ascending: false });
      return (data || []) as any[];
    },
  });

  const saveToLibraryMutation = useMutation({
    mutationFn: async () => {
      if (!selected?.user_id) return;
      // Gather current protocol items
      const { data: items } = await supabase.from("protocols").select("*").eq("user_id", selected.user_id);
      const { data: extraCats } = await supabase.from("protocol_extra_categories" as any).select("*").eq("user_id", selected.user_id);
      const { data: catContents } = await supabase.from("protocol_category_content").select("*").eq("user_id", selected.user_id);
      // Get the latest student_protocols content + pdf
      const { data: latestProtocol } = await supabase
        .from("student_protocols")
        .select("content, pdf_url")
        .eq("user_id", selected.user_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const itemsArr = (items || []).map((i: any) => ({
        name: i.name, dosage: i.dosage, frequency: i.frequency, category: i.category, notes: i.notes,
      }));
      const extraArr = (extraCats || []).map((c: any) => ({
        name: c.name, content: c.content,
      }));
      const catObj: Record<string, string> = {};
      (catContents || []).forEach((c: any) => { catObj[c.category] = c.content; });

      await supabase.from("protocol_library" as any).insert({
        title: `Protocolo de ${selected.full_name || "Aluno"}`,
        content: latestProtocol?.content || "",
        pdf_url: latestProtocol?.pdf_url || "",
        items_json: itemsArr,
        extra_categories_json: extraArr,
        category_contents_json: catObj,
        created_by: user!.id,
      } as any);
    },
    onSuccess: () => {
      toast.success("Protocolo salvo na biblioteca!");
      qc.invalidateQueries({ queryKey: ["protocol-library"] });
    },
    onError: () => toast.error("Erro ao salvar na biblioteca"),
  });

  const loadFromLibraryMutation = useMutation({
    mutationFn: async (libItem: any) => {
      if (!selected?.user_id) return;
      const uid = selected.user_id;

      // Clear existing items
      await supabase.from("protocols").delete().eq("user_id", uid);
      await supabase.from("protocol_extra_categories" as any).delete().eq("user_id", uid);
      await supabase.from("protocol_category_content").delete().eq("user_id", uid);

      // Insert items from library
      const items = (libItem.items_json || []) as any[];
      if (items.length > 0) {
        await supabase.from("protocols").insert(
          items.map((item: any, idx: number) => ({
            user_id: uid, name: item.name, dosage: item.dosage || "", frequency: item.frequency || "",
            category: item.category, notes: item.notes || "", sort_order: idx,
          }))
        );
      }

      // Insert extra categories
      const extras = (libItem.extra_categories_json || []) as any[];
      if (extras.length > 0) {
        for (let i = 0; i < extras.length; i++) {
          await supabase.from("protocol_extra_categories" as any).insert({
            user_id: uid, name: extras[i].name, content: extras[i].content || "", sort_order: i,
          } as any);
        }
      }

      // Insert category contents
      const catContents = (libItem.category_contents_json || {}) as Record<string, string>;
      for (const [cat, content] of Object.entries(catContents)) {
        if (content) {
          await supabase.from("protocol_category_content").insert({
            user_id: uid, category: cat, content,
          });
        }
      }

      // Insert protocol content (rich text + pdf) as a new student_protocols entry
      const libContent = libItem.content || "";
      const libPdf = libItem.pdf_url || "";
      const hasContent = libContent.replace(/<[^>]*>/g, "").trim().length > 0;
      if (hasContent || libPdf) {
        await supabase.from("student_protocols").insert({
          user_id: uid,
          title: libItem.title || "Protocolo",
          content: libContent,
          pdf_url: libPdf,
          seen_by_student: false,
        } as any);
      }

      return libItem;
    },
    onSuccess: (libItem) => {
      toast.success("Protocolo carregado da biblioteca!");
      qc.invalidateQueries({ queryKey: ["admin-protocol-items", selected?.user_id] });
      qc.invalidateQueries({ queryKey: ["protocol-extra-categories", selected?.user_id] });
      qc.invalidateQueries({ queryKey: ["protocol-category-content", selected?.user_id] });
      qc.invalidateQueries({ queryKey: ["admin-student-protocols-detail", selected?.user_id] });
      qc.invalidateQueries({ queryKey: ["admin-students-protocols"] });
      // Pre-fill the editor with the library content
      const libContent = libItem?.content || "";
      if (libContent.replace(/<[^>]*>/g, "").trim().length > 0 || libItem?.pdf_url) {
        setNewContent(libContent);
        setNewTitle(libItem?.title || "Protocolo");
        setShowNewForm(false); // Entry already created, just show in history
      }
      setLibraryDialogOpen(false);
    },
    onError: () => toast.error("Erro ao carregar da biblioteca"),
  });

  // ===== Copy / Paste protocol between students =====
  const CLIPBOARD_KEY = "sth:protocol-clipboard";
  const [clipboardMeta, setClipboardMeta] = useState<{ studentName: string; copiedAt: string } | null>(() => {
    try {
      const raw = localStorage.getItem(CLIPBOARD_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return { studentName: parsed.studentName || "Aluno", copiedAt: parsed.copiedAt || "" };
    } catch { return null; }
  });

  const copyProtocolMutation = useMutation({
    mutationFn: async () => {
      if (!selected?.user_id) throw new Error("Sem aluno");
      const uid = selected.user_id;
      const [items, extraCats, catContents, latest] = await Promise.all([
        supabase.from("protocols").select("*").eq("user_id", uid),
        supabase.from("protocol_extra_categories" as any).select("*").eq("user_id", uid),
        supabase.from("protocol_category_content").select("*").eq("user_id", uid),
        supabase.from("student_protocols").select("title, content, pdf_url").eq("user_id", uid).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      const itemsArr = (items.data || []).map((i: any) => ({
        name: i.name, dosage: i.dosage, frequency: i.frequency, category: i.category, notes: i.notes,
      }));
      const extraArr = ((extraCats.data || []) as any[]).map((c: any) => ({
        name: c.name, content: c.content,
      }));
      const catObj: Record<string, string> = {};
      ((catContents.data || []) as any[]).forEach((c: any) => { catObj[c.category] = c.content; });
      const payload = {
        studentName: selected.full_name || "Aluno",
        copiedAt: new Date().toISOString(),
        title: (latest.data as any)?.title || "Protocolo",
        content: (latest.data as any)?.content || "",
        pdf_url: (latest.data as any)?.pdf_url || "",
        items_json: itemsArr,
        extra_categories_json: extraArr,
        category_contents_json: catObj,
      };
      localStorage.setItem(CLIPBOARD_KEY, JSON.stringify(payload));
      setClipboardMeta({ studentName: payload.studentName, copiedAt: payload.copiedAt });
    },
    onSuccess: () => toast.success("Protocolo copiado! Selecione outro aluno e cole."),
    onError: () => toast.error("Erro ao copiar protocolo"),
  });

  const pasteProtocolMutation = useMutation({
    mutationFn: async () => {
      if (!selected?.user_id) throw new Error("Sem aluno");
      const raw = localStorage.getItem(CLIPBOARD_KEY);
      if (!raw) throw new Error("Clipboard vazio");
      const data = JSON.parse(raw);
      // Reuse the same logic as loadFromLibrary
      await loadFromLibraryMutation.mutateAsync(data);
    },
    onError: (e: any) => {
      if (e?.message === "Clipboard vazio") toast.error("Nenhum protocolo copiado ainda.");
      else toast.error("Erro ao colar protocolo");
    },
  });

  const latestStudentProtocol = studentProtocols?.[0];
  const draftSmartProtocol = (showNewForm && hasSmartProtocolStructure(newContent)) || (!!editingId && hasSmartProtocolStructure(editContent));
  const latestSmartProtocol = hasSmartProtocolStructure(latestStudentProtocol?.content || "") || isSmartProtocolEra(latestStudentProtocol?.created_at);
  const smartProtocolPreviewContent = editingId && hasSmartProtocolStructure(editContent)
    ? editContent
    : showNewForm && hasSmartProtocolStructure(newContent)
      ? newContent
      : latestStudentProtocol?.content || "";
  const showLegacyProtocolEditor = !!selected?.user_id && !latestSmartProtocol && !draftSmartProtocol;
  const showSmartProtocolPreview = !!selected?.user_id && (latestSmartProtocol || draftSmartProtocol);
  const isEditingMode = showNewForm || !!editingId;

  // Copy protocol as plain text to system clipboard
  const copyAsTextMutation = useMutation({
    mutationFn: async () => {
      if (!selected?.user_id) throw new Error("Sem aluno");
      const uid = selected.user_id;
      const [items, extraCats, catContents, latest] = await Promise.all([
        supabase.from("protocols").select("*").eq("user_id", uid).order("category").order("sort_order"),
        supabase.from("protocol_extra_categories" as any).select("*").eq("user_id", uid).order("sort_order"),
        supabase.from("protocol_category_content").select("*").eq("user_id", uid),
        supabase.from("student_protocols").select("title, content").eq("user_id", uid).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);

      const stripHtml = (html: string) => {
        if (!html) return "";
        const tmp = document.createElement("div");
        tmp.innerHTML = html;
        return (tmp.textContent || tmp.innerText || "").trim();
      };

      const CAT_LABELS: Record<string, string> = {
        endocrino: "Suporte Endócrino Hormonal",
        cardiovascular: "Suporte Cardiovascular | Hepático | Renal",
        metabolico: "Suporte Metabólico e Performance",
        pre_pos_treino: "Sistema Pré e Pós-Treino",
      };

      let out = `PROTOCOLO — ${selected.full_name || "Aluno"}\n`;
      out += `${(latest.data as any)?.title || ""}\n`;
      out += "=".repeat(40) + "\n\n";

      // Group items by category
      const itemsByCat: Record<string, any[]> = {};
      (items.data || []).forEach((it: any) => {
        const k = it.category || "outros";
        if (!itemsByCat[k]) itemsByCat[k] = [];
        itemsByCat[k].push(it);
      });

      for (const [cat, list] of Object.entries(itemsByCat)) {
        out += `## ${CAT_LABELS[cat] || cat.toUpperCase()}\n`;
        list.forEach((it: any) => {
          out += `• ${it.name}`;
          if (it.dosage) out += ` — ${it.dosage}`;
          if (it.frequency) out += ` (${it.frequency})`;
          out += "\n";
          if (it.notes) out += `  Obs: ${it.notes}\n`;
        });
        const catText = stripHtml(((catContents.data || []) as any[]).find((c: any) => c.category === cat)?.content || "");
        if (catText) out += `${catText}\n`;
        out += "\n";
      }

      // Extra categories
      ((extraCats.data || []) as any[]).forEach((ec: any) => {
        out += `## ${ec.name}\n`;
        const t = stripHtml(ec.content || "");
        if (t) out += `${t}\n`;
        out += "\n";
      });

      // Latest rich content
      const richText = stripHtml((latest.data as any)?.content || "");
      if (richText) {
        out += `## CONTEÚDO ADICIONAL\n${richText}\n`;
      }

      await navigator.clipboard.writeText(out.trim());
    },
    onSuccess: () => toast.success("Protocolo copiado como texto!"),
    onError: () => toast.error("Erro ao copiar como texto"),
  });


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
        setPreviewProtocol(null);
        setNewTitle("Protocolo");
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
    setPreviewProtocol(null);
    resetNewForm();
    setDialogOpen(true);
  };

  const resetNewForm = () => {
    setNewTitle("Protocolo");
    setNewContent("");
    setNewPdfFile(null);
    setNewReleaseDate("");
    setNewEndDate("");
  };

  const startEdit = (protocol: any) => {
    const d = new Date(protocol.created_at);
    setEditingId(protocol.id);
    setEditTitle(protocol.title || "");
    setEditContent(protocol.content || "");
    setEditDate(d.toISOString().slice(0, 10));
    setEditTime(d.toTimeString().slice(0, 5));
    setPreviewProtocol(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
    setEditDate("");
    setEditTime("");
  };

  const parseAndSaveCategoryContent = async (htmlContent: string, userId: string) => {
    if (hasSmartProtocolStructure(htmlContent)) {
      return;
    }

    // Keywords ordered by specificity (longer/more specific first)
    const sectionKeywords: { keywords: string[]; catKey: string }[] = [
      { keywords: ["suporte endocrino", "endocrino hormonal", "suporte endócrino", "endócrino hormonal"], catKey: "endocrino" },
      { keywords: ["suporte cardiovascular", "cardiovascular", "hepatico", "hepático", "renal"], catKey: "cardiovascular" },
      { keywords: ["suporte metabolico", "suporte metabólico", "metabolico e performance", "metabólico e performance"], catKey: "metabolico" },
      { keywords: ["pre pos treino", "pré pós treino", "pré/pós treino", "pre treino", "pré treino", "pos treino", "pós treino", "sistema pre", "sistema pré"], catKey: "pre_pos_treino" },
    ];

    const normalize = (s: string) =>
      s.toLowerCase().trim()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[-–—]+/g, " ").replace(/[\/\\]/g, " ").replace(/\s+/g, " ");

    const matchCategory = (text: string): string | null => {
      const norm = normalize(text);
      for (const entry of sectionKeywords) {
        for (const kw of entry.keywords) {
          if (norm.includes(normalize(kw))) return entry.catKey;
        }
      }
      return null;
    };

    // Parse HTML to extract sections
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    const elements = Array.from(doc.body.children);

    const sections: Record<string, string[]> = {};
    let currentKey: string | null = null;

    for (const el of elements) {
      const text = (el.textContent || "").trim();
      // Skip empty elements
      if (!text) {
        if (currentKey) sections[currentKey].push(el.outerHTML);
        continue;
      }

      // Check ALL elements for section markers (headings, strong, or plain text with keywords)
      const matched = matchCategory(text);
      if (matched) {
        // Only treat as section header if text is short enough (likely a title, not content)
        const cleanText = text.replace(/[-–—*•·.,:;]/g, "").trim();
        if (cleanText.length < 80) {
          currentKey = matched;
          if (!sections[currentKey]) sections[currentKey] = [];
          continue;
        }
      }

      if (currentKey) {
        sections[currentKey].push(el.outerHTML);
      }
    }

    // Save parsed sections to protocol_category_content
    for (const [catKey, htmlParts] of Object.entries(sections)) {
      const content = htmlParts.join("");
      if (!content.replace(/<[^>]*>/g, "").trim()) continue;

      // Upsert: delete existing then insert
      await supabase.from("protocol_category_content").delete().eq("user_id", userId).eq("category", catKey);
      await supabase.from("protocol_category_content").insert({
        user_id: userId,
        category: catKey,
        content,
      });
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      let pdfUrl = "";
      let pdfStoragePath: string | null = null;
      if (newPdfFile) {
        const path = `${selected.user_id}/protocol/${Date.now()}_${newPdfFile.name}`;
        await supabase.storage.from("documents").upload(path, newPdfFile, { upsert: true });
        const { data } = supabase.storage.from("documents").getPublicUrl(path);
        pdfUrl = data.publicUrl;
        pdfStoragePath = path;
      }
      const payload: any = {
        user_id: selected.user_id,
        title: newTitle,
        content: newContent,
        pdf_url: pdfUrl,
        storage_path: pdfStoragePath,
        visible: !newReleaseDate,
        seen_by_student: false,
      };
      if (newReleaseDate) payload.release_date = newReleaseDate;
      if (newEndDate) payload.end_date = newEndDate;
      await supabase.from("student_protocols").insert(payload);

      // Auto-parse content into legacy category cards only for legacy protocols
      if (newContent && !hasSmartProtocolStructure(newContent)) {
        await parseAndSaveCategoryContent(newContent, selected.user_id);
      }
    },
    onSuccess: () => {
      toast.success("Protocolo adicionado!");
      qc.invalidateQueries({ queryKey: ["admin-students-protocols"] });
      qc.invalidateQueries({ queryKey: ["protocol-category-content", selected?.user_id] });
      refetchProtocols();
      setShowNewForm(false);
      resetNewForm();
      if (selected?.user_id) notifyStudentContentUpdate(selected.user_id, "protocol");
    },
    onError: () => toast.error("Erro ao salvar protocolo"),
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      const newCreatedAt = new Date(`${editDate}T${editTime}:00`).toISOString();
      await supabase
        .from("student_protocols")
        .update({
          title: editTitle,
          content: editContent,
          created_at: newCreatedAt,
          seen_by_student: false,
        } as any)
        .eq("id", editingId!);

      // Re-parse content into legacy category cards only for legacy protocols
      if (editContent && selected?.user_id && !hasSmartProtocolStructure(editContent)) {
        await parseAndSaveCategoryContent(editContent, selected.user_id);
      }
    },
    onSuccess: () => {
      toast.success("Protocolo atualizado!");
      qc.invalidateQueries({ queryKey: ["admin-students-protocols"] });
      qc.invalidateQueries({ queryKey: ["protocol-category-content", selected?.user_id] });
      refetchProtocols();
      cancelEdit();
      if (selected?.user_id) notifyStudentContentUpdate(selected.user_id, "protocol");
    },
    onError: () => toast.error("Erro ao atualizar protocolo"),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (deletingId) await supabase.from("student_protocols").delete().eq("id", deletingId);
    },
    onSuccess: () => {
      toast.success("Protocolo removido!");
      qc.invalidateQueries({ queryKey: ["admin-students-protocols"] });
      refetchProtocols();
      setConfirmDeleteOpen(false);
      setDeletingId(null);
    },
  });

  const confirmDelete = (id: string) => {
    setDeletingId(id);
    setConfirmDeleteOpen(true);
  };

  const filteredStudents = search.trim().length < 2
    ? []
    : (students || []).filter((s: any) => {
        const q = normalizeSearch(search);
        return normalizeSearch(s.full_name).includes(q) || normalizeSearch(s.email).includes(q);
      });

  return (
    <DashboardLayout role="admin" title="Gestão de Protocolos" subtitle="Gerencie os protocolos dos alunos com histórico completo.">
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
                    <Badge variant={s.protocolCount > 0 ? "secondary" : "outline"} className="text-[10px] shrink-0">
                      {s.protocolCount > 0 ? `${s.protocolCount} registro(s)` : "Nenhum"}
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
                  <TableHead className="font-body">Protocolos</TableHead>
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
                      <Badge variant={s.protocolCount > 0 ? "secondary" : "outline"} className="text-xs">
                        {s.protocolCount > 0 ? `${s.protocolCount} registro(s)` : "Nenhum"}
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

      {/* Protocol Management Dialog */}
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
            <DialogTitle className="font-display text-base sm:text-lg">Protocolos — {selected?.full_name}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">Edite com clareza no mobile e desktop.</DialogDescription>
            {selected?.user_id && (
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <ReleaseNotifyButton userId={selected.user_id} type="protocol" />
              </div>
            )}
            {selected?.user_id && (
              <Button
                variant="secondary"
                size="sm"
                className="mt-2 w-full sm:w-auto"
                onClick={() => window.open(`/dashboard/protocol?preview_as=${selected.user_id}`, "_blank", "noopener,noreferrer")}
              >
                <Eye className="w-4 h-4 mr-1" /> Visualizar como aluno
              </Button>
            )}
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto pr-1 sm:pr-4">
            <div className="space-y-6">
              {/* Student Info Header - like student view */}
              {!isEditingMode && selectedProfile && (
                <Card className="border-border bg-muted/50">
                  <CardContent className="py-4">
                    <StudentInfoHeader info={{
                      name: selectedProfile.full_name || undefined,
                      age: selectedProfile.birth_date
                        ? Math.floor((Date.now() - new Date(selectedProfile.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                        : undefined,
                      weight: selectedProfile.weight || undefined,
                      height: selectedProfile.height || undefined,
                      objective: selectedProfile.objective || undefined,
                    }} />
                  </CardContent>
                </Card>
              )}

              {!isEditingMode && selected?.user_id && (
                <ProtocolContinuityCard studentUserId={selected.user_id} />
              )}

              {/* Library Buttons */}
              {!isEditingMode && selected?.user_id && (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => setLibraryDialogOpen(true)}>
                    <Download className="w-3.5 h-3.5 mr-1" /> Carregar da Biblioteca
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => saveToLibraryMutation.mutate()} disabled={saveToLibraryMutation.isPending}>
                    <Save className="w-3.5 h-3.5 mr-1" /> {saveToLibraryMutation.isPending ? "Salvando..." : "Salvar na Biblioteca"}
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => copyProtocolMutation.mutate()} disabled={copyProtocolMutation.isPending}>
                    <Copy className="w-3.5 h-3.5 mr-1" /> {copyProtocolMutation.isPending ? "Copiando..." : "Copiar Protocolo"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => pasteProtocolMutation.mutate()}
                    disabled={pasteProtocolMutation.isPending || !clipboardMeta}
                    title={clipboardMeta ? `Colar protocolo de ${clipboardMeta.studentName}` : "Nenhum protocolo copiado"}
                  >
                    <ClipboardPaste className="w-3.5 h-3.5 mr-1" />
                    {pasteProtocolMutation.isPending ? "Colando..." : clipboardMeta ? `Colar (de ${clipboardMeta.studentName.split(" ")[0]})` : "Colar Protocolo"}
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => copyAsTextMutation.mutate()} disabled={copyAsTextMutation.isPending}>
                    <FileTextIcon className="w-3.5 h-3.5 mr-1" /> {copyAsTextMutation.isPending ? "Copiando..." : "Copiar como Texto"}
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="text-xs"
                    onClick={async () => {
                      try {
                        const p: any = selectedProfile || {};
                        const uid = selected?.user_id;
                        const idade = p.birth_date
                          ? Math.floor((Date.now() - new Date(p.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) + " anos"
                          : "[não informado]";
                        const peso = p.weight ? `${p.weight} kg` : "[não informado]";
                        const altura = p.height ? `${p.height} cm` : "[não informado]";
                        const objetivo = p.objective || "[não informado]";
                        const protocoloAtual = p.current_protocol?.trim() || "Nenhum protocolo registrado";
                        const nome = p.full_name || selected?.full_name || "[não informado]";

                        // 1) Macros: prioriza o cardápio atual/último salvo em dietas; fallback macros do perfil
                        let kcal = 0, prot = 0, carb = 0, fat = 0;
                        let macrosFonte = "macros do perfil";
                        let dietaAtualInfo = "Nenhum cardápio encontrado";
                        let dataReferenciaAtual = (p.updated_at as string | undefined) || new Date().toISOString();
                        let dataUltimoProtocolo: string | null = null;
                        let resumoUltimoProtocolo = "Nenhum protocolo salvo";

                        const formatDateTime = (value?: string | null) => {
                          if (!value) return "[não informado]";
                          return new Date(value).toLocaleString("pt-BR", {
                            timeZone: "America/Sao_Paulo",
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          });
                        };

                        if (uid) {
                          const [dietsRes, latestProtocolRes] = await Promise.all([
                            supabase
                              .from("student_diets")
                              .select("id, title, created_at, release_date, start_date, end_date, energy_kcal, protein_g, carbs_g, fat_g, is_active")
                              .eq("user_id", uid)
                              .order("created_at", { ascending: false }),
                            supabase
                              .from("student_protocols")
                              .select("title, created_at")
                              .eq("user_id", uid)
                              .order("created_at", { ascending: false })
                              .limit(1)
                              .maybeSingle(),
                          ]);

                          const nowTs = Date.now();
                          const diets = dietsRes.data || [];
                          const getDietRefTs = (diet: any) => {
                            const ref = diet.release_date || diet.start_date || diet.created_at;
                            return ref ? new Date(ref).getTime() : 0;
                          };
                          const isReleased = (diet: any) => !diet.release_date || new Date(diet.release_date).getTime() <= nowTs;
                          const isCurrentWindow = (diet: any) => !diet.end_date || new Date(diet.end_date).getTime() >= nowTs;

                          const dietsSorted = [...diets].sort((a: any, b: any) => getDietRefTs(b) - getDietRefTs(a));
                          const currentDiet = dietsSorted.find((diet: any) => diet.is_active && isReleased(diet) && isCurrentWindow(diet))
                            || dietsSorted.find((diet: any) => isReleased(diet) && isCurrentWindow(diet))
                            || dietsSorted[0];

                          if (currentDiet) {
                            const dietRefDate = currentDiet.release_date || currentDiet.start_date || currentDiet.created_at;
                            dataReferenciaAtual = dietRefDate || dataReferenciaAtual;
                            dietaAtualInfo = `${currentDiet.title || "Cardápio"} — referência ${formatDateTime(dietRefDate)}`;

                            const { data: meals } = await supabase
                              .from("diet_meals")
                              .select("id")
                              .eq("diet_id", currentDiet.id)
                              .order("sort_order", { ascending: true });

                            const mealIds = (meals || []).map((m: any) => m.id);
                            if (mealIds.length > 0) {
                              const { data: foods } = await supabase
                                .from("diet_foods")
                                .select("energy_kcal, protein_g, carbs_g, fat_g")
                                .in("meal_id", mealIds);

                              (foods || []).forEach((f: any) => {
                                kcal += Number(f.energy_kcal) || 0;
                                prot += Number(f.protein_g) || 0;
                                carb += Number(f.carbs_g) || 0;
                                fat += Number(f.fat_g) || 0;
                              });

                              if (kcal > 0 || prot > 0 || carb > 0 || fat > 0) {
                                macrosFonte = "cardápio atual em dietas (itens da rotina)";
                              }
                            }

                            if (kcal === 0 && (currentDiet.energy_kcal || currentDiet.protein_g || currentDiet.carbs_g || currentDiet.fat_g)) {
                              kcal = Number(currentDiet.energy_kcal) || 0;
                              prot = Number(currentDiet.protein_g) || 0;
                              carb = Number(currentDiet.carbs_g) || 0;
                              fat = Number(currentDiet.fat_g) || 0;
                              macrosFonte = "cardápio atual em dietas (totais salvos)";
                            }
                          }

                          if (latestProtocolRes.data) {
                            dataUltimoProtocolo = latestProtocolRes.data.created_at;
                            resumoUltimoProtocolo = `${latestProtocolRes.data.title || "Protocolo"} — ${formatDateTime(latestProtocolRes.data.created_at)}`;
                          }
                        }

                        if (kcal === 0) {
                          kcal = Number(p.daily_calories) || 0;
                          prot = Number(p.protein_g) || 0;
                          carb = Number(p.carbs_g) || 0;
                          fat = Number(p.fat_g) || 0;
                        }

                        const macrosLinha = kcal > 0
                          ? `${Math.round(kcal)} kcal • P ${Math.round(prot)}g • C ${Math.round(carb)}g • G ${Math.round(fat)}g (fonte: ${macrosFonte})`
                          : "[não informado]";

                        const distanciaTemporalDias = dataUltimoProtocolo
                          ? Math.max(
                              0,
                              Math.round(
                                (new Date(dataReferenciaAtual).getTime() - new Date(dataUltimoProtocolo).getTime()) /
                                (1000 * 60 * 60 * 24)
                              )
                            )
                          : null;

                        // 2) Plano ativo → semanas
                        let semanas = 0;
                        let planoNome = "[sem plano ativo]";
                        if (uid) {
                          const { data: sub } = await supabase
                            .from("subscriptions")
                            .select("end_date, start_date, status, plans(name, duration_days, duration)")
                            .eq("user_id", uid)
                            .order("end_date", { ascending: false })
                            .limit(1)
                            .maybeSingle();
                          const plano: any = (sub as any)?.plans;
                          if (plano) {
                            planoNome = plano.name || planoNome;
                            const days = Number(plano.duration_days) || 0;
                            if (days > 0) semanas = Math.round(days / 7);
                          }
                        }
                        const semanasLimite = Math.min(semanas || 24, 24);
                        const semanasLinha = semanas > 0
                          ? `${planoNome} — ${semanas} semanas (limite MEDICAMENTOS: ${semanasLimite})`
                          : `${planoNome} — duração não definida (usar até 24 semanas)`;

                        const prompt = `Solicito a criação de um novo protocolo STH METHOD para o perfil abaixo. Gemini, você é o médico especialista, mestre e doutor renomado do esporte de alto rendimento como fisiculturimo, futebol, vôlei e corrida maratonista deixando o paciente pronto para tenha maior energia, libido, performance, rendimento, resitencia, força.

DADOS ATUAIS DO ALUNO (usar como base principal)
Nome: ${nome}
Idade: ${idade}
Peso: ${peso}
Altura: ${altura}
Objetivo: ${objetivo}
Data de referência dos dados atuais: ${formatDateTime(dataReferenciaAtual)}
Cardápio atual/último em dietas: ${dietaAtualInfo}
Macros diários: ${macrosLinha}
Plano vigente: ${semanasLinha}
Registro hormonal atual no perfil (se houver): ${protocoloAtual}

DADOS HISTÓRICOS DO PROTOCOLO (usar apenas como referência)
Último protocolo salvo: ${resumoUltimoProtocolo}
Distância temporal entre dados atuais e último protocolo: ${distanciaTemporalDias !== null ? `${distanciaTemporalDias} dias` : "[não foi possível calcular]"}

REGRAS DE MONTAGEM
Diretriz temporal obrigatória:
- "Dados básicos do aluno" significam dados atuais e mais recentes.
- "Dados do protocolo" significam dados passados/históricos.
- Trabalhe com os dados atuais como base principal, usando o passado apenas como amparo estratégico para entender evolução, resposta anterior e distância temporal entre os contextos.
1. Ordem cronológica do dia: MEDICAMENTOS → manhã → almoço → lanche da tarde → jantar → ceia. PRÉ-TREINO e PÓS-TREINO sempre no final.
2. Cada bloco começa com o emoji-âncora correspondente combinando com o título (💊 MEDICAMENTOS · ☀️ MANHÃ · 🍽️ ALMOÇO · ☕ LANCHE DA TARDE · 🌙 JANTAR/CEIA · 🏋️ PRÉ-TREINO · 🧊 PÓS-TREINO).
3. Aspas duplas envolvem o GRUPO de itens de cada bloco: abrem ANTES do primeiro item e fecham DEPOIS do último item — nunca uma aspa por item. Cada item fica em sua própria linha dentro das aspas.
4. Cada bloco contém: o grupo entre aspas, "Ação:", "Horário:", "Foco:".
5. O campo "Horário:" NÃO usa hora fixa (ex.: 07:00). Descreva o momento em relação à rotina: "ao acordar", "antes do café", "junto à refeição", "30 min antes do treino", "logo após o treino", "antes de dormir", etc.
 6. Bloco MEDICAMENTOS organizado por fases de semanas respeitando o limite do plano (${semanasLimite} semanas), com sensibilidade para aumento/redução de dose. Inclui hormônios, peptídeos, inibidores de aromatase, estimulantes e diuréticos quando aplicável. Cada fase abre suas aspas no primeiro medicamento e fecha no último. TÍTULO de cada fase no formato EXATO "Sem 1-4: (...)", "Sem 5-8: (...)" etc. — NUNCA use "Fase 1: Semana 1-4" ou variações; sempre "Sem X-Y: (descrição curta)".
7. Pilares técnicos a cobrir: Suporte Endócrino-Hormonal, Suporte Cardiovascular/Hepático/Renal, Suporte Metabólico/Performance, Sistema Pré e Pós-Treino.
8. Posologia individualizada: calcule doses, frequência e janela de uso de TODOS os medicamentos e suplementos (em Stack ou isolados) considerando peso (${peso}), altura (${altura}), idade (${idade}) e objetivo (${objetivo}). Ajuste sempre que houver hormônios, peptídeos, IA, estimulantes ou diuréticos para garantir suporte cardiovascular, hepático e renal, suporte metabólico e suporte pré e pós-treino — incluindo nos blocos as moléculas de proteção/recuperação necessárias (ex.: TUDCA, NAC, CoQ10, ômega-3, taurina, citrulina, eletrólitos) conforme o stack montado.
 9. Sempre que houver Stack, metilados e/ou complexos metilados, informe explicitamente QUAIS suplementos e/ou medicamentos estão envolvidos, com posologia detalhada incluindo unidade de medida (ex.: ...mg, ...mcg, ...ml, ...UI), frequência, duração e horário relativo. EXCEÇÃO: multivitamínico não precisa ser listado nessa observação.
`;

                        await navigator.clipboard.writeText(prompt);
                        toast.success("Prompt do protocolo copiado!");
                      } catch (e) {
                        console.error(e);
                        toast.error("Não foi possível gerar/copiar o prompt.");
                      }
                    }}
                    disabled={!selectedProfile}
                  >
                    <ClipboardCopy className="w-3.5 h-3.5 mr-1" /> Resgatar Dados p/ Protocolo
                  </Button>
                </div>
              )}

              {/* Legacy cards only stay available for legacy protocols */}
              {showLegacyProtocolEditor && (
                <>
                  <ProtocolInfoPanel protocols={protocolItems} userId={selected.user_id} editable />
                  <ProtocolExtraCategoriesManager userId={selected.user_id} />
                </>
              )}

              {/* New protocols preview only in the smart card */}
              {showSmartProtocolPreview && smartProtocolPreviewContent && (
                <Card className="border-border/40 bg-muted/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-display">Protocolo Inteligente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <GamifiedProtocolPanel
                      content={smartProtocolPreviewContent}
                      userId={selected.user_id}
                      readOnly
                    />
                  </CardContent>
                </Card>
              )}

              <hr className="border-border" />

              {/* Add new protocol button */}
              {!showNewForm && !editingId && (
                <Button onClick={() => setShowNewForm(true)} className="w-full" variant="outline">
                  <Plus className="w-4 h-4 mr-2" /> Adicionar Novo Protocolo (Texto/PDF)
                </Button>
              )}

              {/* New protocol form */}
              {showNewForm && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-display flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Novo Protocolo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="font-body">Título</Label>
                      <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                    </div>
                    <div>
                      <Label className="font-body">Upload PDF</Label>
                      <Input type="file" accept=".pdf" onChange={(e) => setNewPdfFile(e.target.files?.[0] || null)} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="font-body">Data de Liberação</Label>
                        <Input type="date" value={newReleaseDate} onChange={(e) => setNewReleaseDate(e.target.value)} />
                        <p className="text-[10px] text-muted-foreground mt-0.5">Deixe vazio para liberar imediatamente</p>
                      </div>
                      <div>
                        <Label className="font-body">Data de Encerramento</Label>
                        <Input type="date" value={newEndDate} onChange={(e) => setNewEndDate(e.target.value)} />
                        <p className="text-[10px] text-muted-foreground mt-0.5">Deixe vazio para sem encerramento</p>
                      </div>
                    </div>
                     <div>
                      <Label className="font-body">Conteúdo</Label>
                      <RichTextEditor value={newContent} onChange={setNewContent} placeholder="Escreva o conteúdo do protocolo aqui..." />
                      <details className="mt-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2">
                        <summary className="cursor-pointer text-[11px] font-medium tracking-wide uppercase text-muted-foreground">
                          ✨ Como ativar a Estratégia Premium gamificada
                        </summary>
                        <div className="mt-2 text-[12px] text-foreground/80 leading-relaxed space-y-2">
                          <p>O painel premium do aluno é gerado automaticamente quando o conteúdo possui blocos iniciados por emojis-âncora. Modelo sugerido:</p>
                          <pre className="bg-background/60 rounded-md p-2.5 text-[11px] whitespace-pre-wrap font-mono leading-snug">{`☀️ MANHÃ ✅
"NAC 600mg + Testo Gel 5% + Hematínico Stack"
Ação: Aplicar 1 pump do Gel + Suplementação oral.
Stack: B6 50mg, B9 400mcg, B12 1000mcg, Ferro 30mg.
⏱ Em jejum / Pós-banho
📌 Foco: Ativação hormonal e oxigenação.

🍽 ALMOÇO ⏳
"Ômega-3 2g + Vit. D3 5.000 UI + Vit. K2"
Ação: Após a maior refeição do dia.
⏱ Junto à refeição
📌 Foco: Blindagem cardiovascular.

🏋️ PRÉ-TREINO 🔓
"Citrulina 6g + Beta-Alanina 3g"
⏱ 30-45min antes do treino
📌 Foco: Volemia muscular.

🌙 CEIA 🔒
"Magnésio 400mg + Inositol 200mg"
⏱ 30-60min antes de dormir
📌 Foco: Recuperação tecidual.`}</pre>
                          <p className="text-muted-foreground">Status (✅ feito · ⏳ em curso · 🔓 liberado · 🔒 bloqueado) é opcional. O aluno marca a conclusão do dia tocando no card. Aceita também <strong>NOITE</strong> ou <strong>ANTES DE DORMIR</strong> no lugar de <strong>CEIA</strong>.</p>
                        </div>
                      </details>
                    </div>
                    <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                      <Button variant="ghost" size="sm" onClick={() => { setShowNewForm(false); resetNewForm(); }} className="w-full sm:w-auto">
                        Cancelar
                      </Button>
                      <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full sm:w-auto">
                        {saveMutation.isPending ? "Salvando..." : "Salvar"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Protocol History - Accordion style like student view */}
              {studentProtocols && studentProtocols.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground font-display flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Histórico de Protocolos ({studentProtocols.length})
                  </h3>

                  {/* Edit form - shown above accordion when editing */}
                  {editingId && (
                    <Card className="border-primary/30 bg-primary/5">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-display flex items-center gap-2">
                          <Pencil className="w-4 h-4" /> Editando Protocolo
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="font-body text-xs">Título</Label>
                          <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
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
                        </div>
                        <div>
                          <Label className="font-body text-xs">Conteúdo</Label>
                          <RichTextEditor value={editContent} onChange={setEditContent} />
                        </div>
                        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                          <Button variant="ghost" size="sm" onClick={cancelEdit} className="w-full sm:w-auto">Cancelar</Button>
                          <Button size="sm" onClick={() => editMutation.mutate()} disabled={editMutation.isPending} className="w-full sm:w-auto">
                            {editMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Accordion type="single" collapsible className="space-y-2">
                    {studentProtocols.map((protocol: any) => (
                      <AccordionItem key={protocol.id} value={protocol.id} className="border rounded-xl overflow-hidden bg-card">
                        <AccordionTrigger className="px-4 py-3 hover:no-underline">
                          <div className="flex items-center gap-2 flex-wrap text-left">
                            {protocol.visible ? (
                              <Eye className="w-4 h-4 text-green-500 shrink-0" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-muted-foreground shrink-0" />
                            )}
                            <span className="text-base font-display font-semibold">{protocol.title}</span>
                            <Badge variant="outline" className="text-[10px]">
                              {new Date(protocol.created_at).toLocaleDateString("pt-BR")} às{" "}
                              {new Date(protocol.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </Badge>
                            {protocol.release_date && (
                              <Badge variant="secondary" className="text-[10px]">
                                Liberação: {new Date(protocol.release_date + "T12:00:00").toLocaleDateString("pt-BR")}
                              </Badge>
                            )}
                            {protocol.end_date && (
                              <Badge variant="secondary" className="text-[10px]">
                                Encerra: {new Date(protocol.end_date + "T12:00:00").toLocaleDateString("pt-BR")}
                              </Badge>
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="space-y-3">
                            {/* Admin action buttons */}
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={async () => {
                                  await supabase.from("student_protocols").update({ visible: !protocol.visible }).eq("id", protocol.id);
                                  refetchProtocols();
                                  qc.invalidateQueries({ queryKey: ["admin-students-protocols"] });
                                  toast.success(protocol.visible ? "Protocolo ocultado" : "Protocolo visível");
                                }}
                              >
                                {protocol.visible ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                                {protocol.visible ? "Ocultar" : "Tornar Visível"}
                              </Button>
                              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => startEdit(protocol)}>
                                <Pencil className="w-3 h-3 mr-1" /> Editar
                              </Button>
                              <Button variant="outline" size="sm" className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => confirmDelete(protocol.id)}>
                                <Trash2 className="w-3 h-3 mr-1" /> Excluir
                              </Button>
                            </div>

                            {protocol.pdf_url && (
                              <div>
                                <p className="text-xs text-primary flex items-center gap-1 mb-2">
                                  <FileText className="w-3 h-3" /> Documento PDF
                                </p>
                                <SignedPdfFrame
                                  bucket="documents"
                                  storagePath={(protocol as any).storage_path}
                                  publicUrl={protocol.pdf_url}
                                  className="w-full h-[500px] rounded-lg border border-border"
                                  title="Protocolo PDF"
                                />
                              </div>
                            )}
                            {protocol.content && (
                              (hasSmartProtocolStructure(protocol.content) || isSmartProtocolEra(protocol.created_at) ? (
                                <GamifiedProtocolPanel
                                  content={protocol.content}
                                  userId={selected.user_id}
                                  readOnly
                                />
                              ) : (
                                <RichContentRenderer content={protocol.content} />
                              ))
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum protocolo cadastrado ainda.</p>
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
              Tem certeza que deseja excluir este protocolo? Esta ação não pode ser desfeita.
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

      {/* Library Selection Dialog */}
      <Dialog open={libraryDialogOpen} onOpenChange={setLibraryDialogOpen}>
        <DialogContent className="max-w-md max-h-[80dvh] overflow-hidden !flex !flex-col">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <BookOpen className="w-5 h-5" /> Biblioteca de Protocolos
            </DialogTitle>
            <DialogDescription>Selecione um modelo para aplicar neste aluno. Os dados atuais serão substituídos.</DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar modelo..." value={librarySearch} onChange={(e) => setLibrarySearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
            {libraryItems
              .filter((i: any) => !librarySearch.trim() || i.title?.toLowerCase().includes(librarySearch.toLowerCase()))
              .map((item: any) => (
                <div key={item.id} className="rounded-lg border border-border p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => loadFromLibraryMutation.mutate(item)}
                >
                  <p className="font-medium text-sm font-display">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {(item.items_json || []).length} itens • {new Date(item.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              ))}
            {libraryItems.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum modelo na biblioteca. Salve um protocolo primeiro.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminProtocol;
