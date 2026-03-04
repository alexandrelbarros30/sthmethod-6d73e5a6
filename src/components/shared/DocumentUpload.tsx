import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Upload, Trash2, Loader2, ExternalLink } from "lucide-react";

interface DocumentUploadProps {
  userId: string;
  labExamUrl?: string | null;
  prescriptionUrl?: string | null;
  onUploaded: () => void;
}

export default function DocumentUpload({ userId, labExamUrl, prescriptionUrl, onUploaded }: DocumentUploadProps) {
  const [uploadingExam, setUploadingExam] = useState(false);
  const [uploadingPrescription, setUploadingPrescription] = useState(false);
  const examRef = useRef<HTMLInputElement>(null);
  const prescriptionRef = useRef<HTMLInputElement>(null);

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
      const ext = "pdf";
      const path = `${userId}/${type}_${Date.now()}.${ext}`;
      const { error: storageError } = await supabase.storage
        .from("documents")
        .upload(path, file, { upsert: true });
      if (storageError) throw storageError;

      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);
      const field = type === "lab_exam" ? "lab_exam_url" : "medical_prescription_url";
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ [field]: urlData.publicUrl })
        .eq("user_id", userId);
      if (updateError) throw updateError;

      toast.success(type === "lab_exam" ? "Exame enviado!" : "Receita enviada!");
      onUploaded();
    } catch (e: any) {
      toast.error(e.message || "Erro ao enviar arquivo");
    } finally {
      setter(false);
    }
  };

  const removeFile = async (type: "lab_exam" | "medical_prescription") => {
    const field = type === "lab_exam" ? "lab_exam_url" : "medical_prescription_url";
    try {
      await supabase.from("profiles").update({ [field]: "" }).eq("user_id", userId);
      toast.success("Documento removido");
      onUploaded();
    } catch (e: any) {
      toast.error("Erro ao remover");
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Documentos clínicos (PDF)
      </p>

      {/* Lab Exam */}
      <div className="border rounded-lg p-3 bg-muted/30 space-y-2">
        <Label className="font-body text-sm flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" /> Exames laboratoriais
        </Label>
        {labExamUrl ? (
          <div className="flex items-center gap-2">
            <a href={labExamUrl} target="_blank" rel="noopener noreferrer"
              className="text-sm text-primary underline flex items-center gap-1 truncate flex-1">
              <ExternalLink className="w-3 h-3 shrink-0" /> Ver exame
            </a>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFile("lab_exam")}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) : (
          <>
            <input ref={examRef} type="file" accept=".pdf" className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "lab_exam")} />
            <Button variant="outline" size="sm" className="w-full" disabled={uploadingExam}
              onClick={() => examRef.current?.click()}>
              {uploadingExam ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>
                : <><Upload className="w-4 h-4 mr-2" /> Enviar exame (PDF)</>}
            </Button>
          </>
        )}
      </div>

      {/* Medical Prescription */}
      <div className="border rounded-lg p-3 bg-muted/30 space-y-2">
        <Label className="font-body text-sm flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" /> Receita médica
        </Label>
        {prescriptionUrl ? (
          <div className="flex items-center gap-2">
            <a href={prescriptionUrl} target="_blank" rel="noopener noreferrer"
              className="text-sm text-primary underline flex items-center gap-1 truncate flex-1">
              <ExternalLink className="w-3 h-3 shrink-0" /> Ver receita
            </a>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFile("medical_prescription")}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) : (
          <>
            <input ref={prescriptionRef} type="file" accept=".pdf" className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "medical_prescription")} />
            <Button variant="outline" size="sm" className="w-full" disabled={uploadingPrescription}
              onClick={() => prescriptionRef.current?.click()}>
              {uploadingPrescription ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>
                : <><Upload className="w-4 h-4 mr-2" /> Enviar receita (PDF)</>}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
