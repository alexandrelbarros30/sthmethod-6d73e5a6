import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const USER_BRUNO = "8f2f580a-f703-46bb-bb6d-59e91a2a2260"; // profile=Bruno, deve ter login nalobr0602@gmail.com
const USER_NATASHA = "7d0d035b-c149-44c6-8b58-4c08b8cf89a6"; // profile=Natasha, deve ter login financeiro.supdedicado@gmail.com

export default function AdminFixCurty() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");

  const runSwap = async () => {
    setLoading(true);
    setResult("");
    try {
      const { data, error } = await supabase.functions.invoke("admin-manage-students", {
        body: { action: "swap_emails", user_a: USER_BRUNO, user_b: USER_NATASHA },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(JSON.stringify(data, null, 2));
      toast.success("Emails trocados com sucesso!");
    } catch (e: any) {
      setResult(`ERRO: ${e.message}`);
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Correção: Bruno × Natasha Curty</h1>
        <p className="text-sm text-muted-foreground">
          Vai trocar os emails de login no auth entre os dois usuários para ficar:
        </p>
        <ul className="text-sm space-y-1">
          <li>• Bruno Curty → <code>nalobr0602@gmail.com</code></li>
          <li>• Natasha Curty → <code>financeiro.supdedicado@gmail.com</code></li>
        </ul>
        <Button onClick={runSwap} disabled={loading}>
          {loading ? "Trocando..." : "Executar troca de emails"}
        </Button>
        {result && (
          <pre className="text-xs bg-muted p-3 rounded whitespace-pre-wrap">{result}</pre>
        )}
      </Card>
    </div>
  );
}