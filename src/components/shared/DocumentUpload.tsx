import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileText, Upload, Loader2, ExternalLink } from "lucide-react";
import SignedLink from "@/components/shared/SignedLink";

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

  const uploadFile = async (file: File, type: "lab_exam" | "medical_prescription") => {
    if (file.type !== "application/pdf") {
      toast.error("Apenas arquivos PDF são aceitos");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máx. 10MB)");
      return;
    }

    const setter = type === "lab_exam" ? setUploadingExam : setUploadingPrescription;
    setter(true);

    try {
      const path = `${userId}/${type}_${Date.now()}.pdf`;
      const { error: storageError } = await supabase.storage
        .from("documents")
        .upload(path, file, { upsert: true });
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
        <FileText className="w-4 h-4 text-primary" /> {label}
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
                className="text-sm text-primary underline flex items-center gap-1 truncate flex-1"
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
        accept=".pdf"
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
