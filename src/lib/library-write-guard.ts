import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type LibraryTable =
  | "training_programs"
  | "exercise_library"
  | "diet_library"
  | "protocol_library";

const LABEL: Record<LibraryTable, string> = {
  training_programs: "programa de treino",
  exercise_library: "exercício",
  diet_library: "modelo de dieta",
  protocol_library: "modelo de protocolo",
};

/** Postgres RLS violation code returned by PostgREST. */
export const RLS_DENIED_CODE = "42501";

export interface LibraryWriteErrorInfo {
  denied: boolean;
  message: string;
}

/**
 * Detecta erro de RLS (42501) e devolve mensagem amigável, orientando
 * o consultor a duplicar o item para gerenciar como próprio.
 * Também registra a tentativa negada em `library_write_audit`.
 */
export async function handleLibraryWriteError(
  err: unknown,
  ctx: {
    table: LibraryTable;
    operation: "insert" | "update" | "delete";
    recordId?: string | null;
    payload?: Record<string, unknown> | null;
    showToast?: boolean;
  },
): Promise<LibraryWriteErrorInfo> {
  const anyErr = err as { code?: string; message?: string } | null;
  const code = anyErr?.code;
  const raw = anyErr?.message || "Erro ao salvar.";
  const isDenied =
    code === RLS_DENIED_CODE ||
    /row-level security|permission denied/i.test(raw);

  if (!isDenied) {
    if (ctx.showToast !== false) toast.error(raw);
    return { denied: false, message: raw };
  }

  const label = LABEL[ctx.table];
  const friendly =
    ctx.operation === "delete"
      ? `Você não pode excluir este ${label} porque não é o autor. Duplique para os seus alunos e gerencie sua própria cópia.`
      : `Você não pode alterar este ${label} porque não é o autor. Duplique para os seus alunos e edite sua própria cópia.`;

  // Fire-and-forget: registra a tentativa negada (RPC SECURITY DEFINER)
  try {
    await supabase.rpc("log_library_write_denied", {
      _table_name: ctx.table,
      _record_id: ctx.recordId ?? null,
      _operation: ctx.operation,
      _attempted_payload: (ctx.payload as any) ?? null,
      _reason: raw,
    } as any);
  } catch {
    // swallow — auditoria é best-effort
  }

  if (ctx.showToast !== false) {
    toast.error(friendly, {
      description: "Somente o autor original ou um administrador pode editar.",
    });
  }
  return { denied: true, message: friendly };
}