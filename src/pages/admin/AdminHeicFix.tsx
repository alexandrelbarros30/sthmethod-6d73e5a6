import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TARGETS = [
  { type: "front",   path: "8e8d7425-c81f-4647-acc8-6949d621c216/front_1778150317107.jpg" },
  { type: "back",    path: "8e8d7425-c81f-4647-acc8-6949d621c216/back_1778150322231.jpg" },
  { type: "profile", path: "8e8d7425-c81f-4647-acc8-6949d621c216/profile_1778150327034.jpg" },
];
const USER_ID = "8e8d7425-c81f-4647-acc8-6949d621c216";
// Original upload date (07/05/2026 ~10:38 UTC)
const UPLOADED_AT = "2026-05-07T10:38:51.156Z";

const AdminHeicFix = () => {
  const [log, setLog] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const append = (s: string) => setLog((l) => [...l, s]);

  const run = async () => {
    setRunning(true);
    setLog([]);
    try {
      append("Carregando heic2any…");
      const { default: heic2any } = await import("heic2any");

      for (const { type, path } of TARGETS) {
        append(`\n=== ${type} ===`);
        append(`1) Signed URL para ${path}`);
        const { data: signed, error: sErr } = await supabase.storage
          .from("body-images")
          .createSignedUrl(path, 600);
        if (sErr || !signed?.signedUrl) throw new Error(`Signed URL: ${sErr?.message}`);

        append(`2) Baixando bytes…`);
        const heicBlob = await (await fetch(signed.signedUrl)).blob();
        append(`   ${(heicBlob.size / 1024).toFixed(0)}KB`);

        append(`3) Convertendo HEIC → JPEG…`);
        const result = await heic2any({ blob: heicBlob, toType: "image/jpeg", quality: 0.9 });
        const jpegBlob = (Array.isArray(result) ? result[0] : result) as Blob;
        append(`   JPEG: ${(jpegBlob.size / 1024).toFixed(0)}KB`);

        const newPath = `${USER_ID}/${type}_${Date.now()}_recovered.jpg`;
        append(`4) Upload → ${newPath}`);
        const { error: upErr } = await supabase.storage
          .from("body-images")
          .upload(newPath, jpegBlob, { contentType: "image/jpeg", upsert: false });
        if (upErr) throw new Error(`Upload: ${upErr.message}`);

        append(`5) Marcando antigos como não-atuais (${type})`);
        await supabase.from("body_images").update({ is_current: false })
          .eq("user_id", USER_ID).eq("type", type).eq("is_current", true);

        const { data: pub } = supabase.storage.from("body-images").getPublicUrl(newPath);
        append(`6) Inserindo registro DB`);
        const { error: insErr } = await supabase.from("body_images").insert({
          user_id: USER_ID,
          type,
          image_url: pub.publicUrl,
          storage_path: newPath,
          is_current: true,
          uploaded_at: UPLOADED_AT,
        });
        if (insErr) throw new Error(`Insert: ${insErr.message}`);

        append(`✅ ${type} OK`);
      }
      append("\n🎉 Concluído! As 3 fotos de 07/05 foram recuperadas.");
      toast.success("Fotos recuperadas com sucesso!");
    } catch (err: any) {
      append(`\n❌ ERRO: ${err.message}`);
      toast.error(err.message);
    }
    setRunning(false);
  };

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Recuperar fotos HEIC — Bruno (07/05/2026)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Baixa os 3 arquivos HEIC originais do storage, converte para JPEG no navegador
            via <code>heic2any</code> e cria novos registros em <code>body_images</code>.
          </p>
          <Button onClick={run} disabled={running}>
            {running ? "Processando…" : "Executar recuperação"}
          </Button>
          {log.length > 0 && (
            <pre className="text-xs bg-muted p-3 rounded whitespace-pre-wrap max-h-[60vh] overflow-auto">
              {log.join("\n")}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminHeicFix;
