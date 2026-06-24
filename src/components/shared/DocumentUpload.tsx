import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileText, Upload, Loader2, ExternalLink } from "lucide-react";
import SignedLink from "@/components/shared/SignedLink";
import { notifyStudentSelfUpdate } from "@/lib/notify-student-self-update";

interface DocumentUploadProps {
  userId: string;
  onUploaded?: () => void;
}

export default function DocumentUpload({ userId, onUploaded }: DocumentUploadProps) {
  const [uploadingExam, setUploadingExam] = useState(false);
  const [uploadingPrescription, setUploadingPrescription] = useState(false);
  const examRef = useRef<HTMLInputElement>(null);
  const prescriptionRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const { data: documents = [] } = useQuery({
    queryKey: ["clinical-documents", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinical_documents")
        .select("id, type, file_url, storage_path, uploaded_at")
        .eq("user_id", userId)
        .order("uploaded_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  const examDocs = documents.filter((d) => d.type === "lab_exam");
  const prescriptionDocs = documents.filter((d) => d.type === "medical_prescription");

  const isPdfFile = (file: File) => {
    const mime = file.type?.toLowerCase();
    const name = file.name?.toLowerCase() || "";
    return mime === "application/pdf" || name.endsWith(".pdf");
  };

  const normalizePdfForUpload = async (file: File) => {
    const buffer = await file.arrayBuffer();

    if (!buffer.byteLength) {
      throw new Error("Não foi possível ler o arquivo selecionado. Tente baixar o PDF no aparelho e enviar novamente.");
    }

    return new Blob([buffer], { type: "application/pdf" });
  };

  const uploadFile = async (file: File, type: "lab_exam" | "medical_prescription") => {
    if (!isPdfFile(file)) {
      toast.error("Apenas arquivos PDF são aceitos");
      return;
    }
    if (file.size > 55 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máx. 55MB)");
      return;
    }

    const setter = type === "lab_exam" ? setUploadingExam : setUploadingPrescription;
    setter(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Sessão expirada. Faça login novamente.");

      const normalizedFile = await normalizePdfForUpload(file);
      const path = `${userId}/${type}_${Date.now()}.pdf`;
      const { error: storageError } = await supabase.storage
        .from("documents")
        .upload(path, normalizedFile, {
          contentType: "application/pdf",
          upsert: false,
        });
      if (storageError) throw storageError;

      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);

      const { error: insertError } = await supabase
        .from("clinical_documents")
        .insert({
          user_id: userId,
          type,
          file_url: urlData.publicUrl,
          storage_path: path,
        });
      if (insertError) throw insertError;

      toast.success(type === "lab_exam" ? "Exame enviado!" : "Receita enviada!");
      qc.invalidateQueries({ queryKey: ["clinical-documents", userId] });
      void notifyStudentSelfUpdate(userId, "documents");
      onUploaded?.();
    } catch (e: any) {
      toast.error(e.message || "Erro ao enviar arquivo");
    } finally {
      setter(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString("pt-BR")} às ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  };

  const renderSection = (
    label: string,
    docs: typeof documents,
    type: "lab_exam" | "medical_prescription",
    inputRef: React.RefObject<HTMLInputElement | null>,
    uploading: boolean,
    setterKey: "exam" | "prescription"
  ) => (
    <div className="border rounded-lg p-3 bg-muted/30 space-y-2">
      <Label className="font-body text-sm flex items-center gap-2">
        <FileText className="w-4 h-4 text-foreground" /> {label}
      </Label>

      {/* History */}
      {docs.length > 0 && (
        <div className="space-y-1.5">
          {docs.map((doc, idx) => (
            <div key={doc.id} className="flex items-center gap-2">
              <SignedLink
                bucket="documents"
                storagePath={(doc as any).storage_path}
                publicUrl={doc.file_url}
                className="text-sm text-foreground underline flex items-center gap-1 truncate flex-1"
              >
                <ExternalLink className="w-3 h-3 shrink-0" />
                {formatDate(doc.uploaded_at)}
              </SignedLink>
              {idx === 0 && (
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  Atual
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) uploadFile(e.target.files[0], type);
          e.target.value = "";
        }}
      />
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" /> {docs.length > 0 ? "Adicionar novo" : `Enviar ${label.toLowerCase()} (PDF)`}
          </>
        )}
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Documentos clínicos (PDF)
      </p>
      {renderSection("Exames laboratoriais", examDocs, "lab_exam", examRef, uploadingExam, "exam")}
      {renderSection("Receita médica", prescriptionDocs, "medical_prescription", prescriptionRef, uploadingPrescription, "prescription")}
    </div>
  );
}
