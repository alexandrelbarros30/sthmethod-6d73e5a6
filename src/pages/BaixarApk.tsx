import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function BaixarApk() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("download-apk", {
          method: "GET" as any,
          body: { format: "json" } as any,
        });
        // Fallback: use fetch to the JSON endpoint (invoke may not pass query params on GET)
        let url: string | undefined = (data as any)?.url;
        if (!url) {
          const base = (supabase as any).functionsUrl || `${(supabase as any).supabaseUrl}/functions/v1`;
          const key = (supabase as any).supabaseKey;
          const res = await fetch(`${base}/download-apk?format=json`, {
            headers: { apikey: key, Authorization: `Bearer ${key}` },
          });
          const json = await res.json();
          url = json.url;
          if (!res.ok || !url) throw new Error(json.error || "Nenhum APK disponível");
        }
        window.location.replace(url);
      } catch (e: any) {
        setError(e.message || "Falha ao obter o APK");
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 gap-4">
      {error ? (
        <>
          <p className="text-red-400 text-center">{error}</p>
          <a href="/baixar-app" className="underline text-white/70">Voltar</a>
        </>
      ) : (
        <>
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-white/70 text-sm">Preparando download do APK…</p>
        </>
      )}
    </div>
  );
}