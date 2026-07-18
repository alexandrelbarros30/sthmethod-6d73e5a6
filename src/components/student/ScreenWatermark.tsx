import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Diagonal, tiled, low-opacity watermark overlay with the logged-in
 * student's name, masked CPF and current timestamp. Non-interactive.
 * Placed absolutely inside a `relative` parent (or fixed if `fixed`).
 */
export function ScreenWatermark({ fixed = false }: { fixed?: boolean }) {
  const [label, setLabel] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, cpf")
        .eq("user_id", user.id)
        .maybeSingle();
      const name = (profile?.full_name || user.email || "ALUNO").toUpperCase();
      const cpfRaw = (profile as any)?.cpf as string | undefined;
      const cpf = cpfRaw
        ? cpfRaw.replace(/\D/g, "").replace(/^(\d{3})(\d{3})(\d{3})(\d{2}).*/, "$1.***.***-$4")
        : "";
      const stamp = new Date().toLocaleString("pt-BR");
      if (mounted) setLabel([name, cpf, stamp].filter(Boolean).join(" • "));
    })();
    return () => { mounted = false; };
  }, []);

  if (!label) return null;

  const rows = Array.from({ length: 14 });
  const cols = Array.from({ length: 4 });

  return (
    <div
      aria-hidden
      className={`${fixed ? "fixed" : "absolute"} inset-0 pointer-events-none select-none overflow-hidden z-[5]`}
      style={{ mixBlendMode: "overlay" }}
    >
      <div className="w-full h-full" style={{ transform: "rotate(-24deg)", transformOrigin: "center" }}>
        {rows.map((_, r) => (
          <div key={r} className="flex justify-around whitespace-nowrap" style={{ marginTop: r === 0 ? 0 : 60 }}>
            {cols.map((_, c) => (
              <span
                key={c}
                style={{
                  opacity: 0.08,
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: 1,
                  color: "currentColor",
                }}
              >
                {label}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ScreenWatermark;