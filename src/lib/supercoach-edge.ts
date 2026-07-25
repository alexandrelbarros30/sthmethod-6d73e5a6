import { supabase } from "@/integrations/supabase/client";

const asErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error || "erro desconhecido");

export async function invokeSuperCoachEdge<T = any>(
  functionName: string,
  payload: Record<string, unknown>,
): Promise<T> {
  const errors: string[] = [];
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  try {
    const { data, error } = await supabase.functions.invoke(functionName, { body: payload });
    if (error) {
      errors.push(error.message);
    } else {
      if ((data as any)?.ok === false) throw new Error((data as any)?.error || "Falha na sincronização");
      return data as T;
    }
  } catch (error) {
    errors.push(asErrorMessage(error));
  }

  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (baseUrl && anonKey) {
    try {
      const response = await fetch(`${baseUrl}/functions/v1/${functionName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: anonKey,
          Authorization: `Bearer ${token || anonKey}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        if ((data as any)?.ok === false) throw new Error((data as any)?.error || "Falha na sincronização");
        return data as T;
      }
      errors.push((data as any)?.error || `HTTP ${response.status}`);
    } catch (error) {
      errors.push(asErrorMessage(error));
    }
  }

  if (!token) throw new Error("Sessão administrativa expirada. Entre novamente antes de sincronizar.");
  if (!baseUrl) throw new Error("URL da função indisponível para sincronização.");

  const response = await fetch(`${baseUrl}/functions/v1/${functionName}`, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=UTF-8" },
    body: JSON.stringify({ ...payload, accessToken: token }),
  });
  const text = await response.text();
  let data: any = {};
  try {
    data = JSON.parse(text);
  } catch {
    data = { error: text };
  }
  if (!response.ok || data?.ok === false) {
    const details = errors.filter(Boolean).slice(0, 2).join(" | ");
    throw new Error(data?.error || details || `Falha HTTP ${response.status}`);
  }
  return data as T;
}