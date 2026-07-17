/**
 * Testes de integração: simulam o PostgREST aplicando as políticas
 * definidas no banco (SELECT liberado para consultor; INSERT/UPDATE/DELETE
 * apenas quando created_by = auth.uid()) e verificam que o helper amigável
 * bloqueia + registra a tentativa negada.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ------------------ Fake Supabase com RLS simulada ------------------

type Table = "training_programs" | "exercise_library" | "diet_library" | "protocol_library";

interface Row {
  id: string;
  created_by: string | null;
  [k: string]: unknown;
}

function makeFakeSupabase(currentUserId: string, role: "admin" | "consultor") {
  const tables: Record<Table, Row[]> = {
    training_programs: [
      { id: "prog-admin", created_by: "admin-1", title: "Admin Program" },
      { id: "prog-mine", created_by: currentUserId, title: "Meu Program" },
    ],
    exercise_library: [
      { id: "ex-admin", created_by: "admin-1", name: "Agachamento" },
      { id: "ex-mine", created_by: currentUserId, name: "Meu Ex" },
    ],
    diet_library: [
      { id: "diet-admin", created_by: "admin-1", name: "Dieta Base" },
      { id: "diet-mine", created_by: currentUserId, name: "Minha Dieta" },
    ],
    protocol_library: [
      { id: "proto-admin", created_by: "admin-1", name: "Proto Base" },
      { id: "proto-mine", created_by: currentUserId, name: "Meu Proto" },
    ],
  };

  const canWrite = (row: Row) =>
    role === "admin" || row.created_by === currentUserId;

  const rlsError = {
    code: "42501",
    message: "new row violates row-level security policy",
  };

  const auditLog: any[] = [];

  function from(table: Table) {
    let selectMode = false;
    return {
      select() {
        selectMode = true;
        return {
          eq: (col: string, val: any) => ({
            maybeSingle: async () => ({
              data: tables[table].find((r: any) => r[col] === val) || null,
              error: null,
            }),
          }),
          then: (cb: any) => cb({ data: tables[table], error: null }),
        };
      },
      insert(payload: any) {
        const row = { id: `new-${Math.random()}`, ...payload };
        if (!canWrite(row)) return Promise.resolve({ error: rlsError });
        tables[table].push(row);
        return Promise.resolve({ error: null });
      },
      update(patch: any) {
        return {
          eq: async (col: string, val: any) => {
            const row = tables[table].find((r: any) => r[col] === val);
            if (!row) return { error: { code: "PGRST116", message: "not found" } };
            if (!canWrite(row)) return { error: rlsError };
            Object.assign(row, patch);
            return { error: null };
          },
        };
      },
      delete() {
        return {
          eq: async (col: string, val: any) => {
            const idx = tables[table].findIndex((r: any) => r[col] === val);
            if (idx < 0) return { error: null };
            if (!canWrite(tables[table][idx])) return { error: rlsError };
            tables[table].splice(idx, 1);
            return { error: null };
          },
        };
      },
    };
  }

  async function rpc(name: string, args: any) {
    if (name === "log_library_write_denied") {
      auditLog.push({ actor: currentUserId, role, ...args });
      return { data: "audit-id", error: null };
    }
    return { data: null, error: null };
  }

  return { from, rpc, _tables: tables, _audit: auditLog };
}

// Setup mock antes de importar o helper
const consultorId = "consultor-42";
const fake = makeFakeSupabase(consultorId, "consultor");

vi.mock("@/integrations/supabase/client", () => ({ supabase: fake }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { handleLibraryWriteError } from "./library-write-guard";
import { supabase } from "@/integrations/supabase/client";

const TABLES: Table[] = ["training_programs", "exercise_library", "diet_library", "protocol_library"];

describe("RLS de bibliotecas (integração simulada)", () => {
  beforeEach(() => {
    fake._audit.length = 0;
  });

  it.each(TABLES)("consultor LÊ %s", async (table) => {
    const rows = await new Promise<any>((resolve) => {
      (supabase.from(table) as any).select().then(resolve);
    });
    expect(rows.error).toBeNull();
    expect(rows.data.length).toBeGreaterThan(0);
  });

  it.each(TABLES)("consultor NÃO consegue UPDATE de item alheio em %s + gera friendly + audit", async (table) => {
    const ownerRow = fake._tables[table].find((r) => r.created_by !== consultorId)!;
    const { error } = await (supabase.from(table) as any).update({ name: "hack" }).eq("id", ownerRow.id);
    expect(error?.code).toBe("42501");

    const info = await handleLibraryWriteError(error, {
      table,
      operation: "update",
      recordId: ownerRow.id,
      payload: { name: "hack" },
      showToast: false,
    });
    expect(info.denied).toBe(true);
    expect(info.message).toMatch(/duplique/i);
    expect(fake._audit.at(-1)).toMatchObject({
      _table_name: table,
      _operation: "update",
    });
  });

  it.each(TABLES)("consultor NÃO consegue DELETE de item alheio em %s", async (table) => {
    const ownerRow = fake._tables[table].find((r) => r.created_by !== consultorId)!;
    const { error } = await (supabase.from(table) as any).delete().eq("id", ownerRow.id);
    expect(error?.code).toBe("42501");
    const info = await handleLibraryWriteError(error, {
      table, operation: "delete", recordId: ownerRow.id, showToast: false,
    });
    expect(info.denied).toBe(true);
    expect(info.message).toMatch(/excluir/i);
  });

  it.each(TABLES)("consultor CONSEGUE UPDATE do próprio item em %s", async (table) => {
    const mine = fake._tables[table].find((r) => r.created_by === consultorId)!;
    const { error } = await (supabase.from(table) as any).update({ name: "ok" }).eq("id", mine.id);
    expect(error).toBeNull();
  });

  it.each(TABLES)("consultor CONSEGUE DELETE do próprio item em %s", async (table) => {
    const mine = fake._tables[table].find((r) => r.created_by === consultorId)!;
    const { error } = await (supabase.from(table) as any).delete().eq("id", mine.id);
    expect(error).toBeNull();
  });

  it.each(TABLES)("INSERT com created_by errado é bloqueado em %s", async (table) => {
    const { error } = await (supabase.from(table) as any).insert({
      name: "spoof", created_by: "outro-usuario",
    });
    expect(error?.code).toBe("42501");
  });

  it.each(TABLES)("INSERT com created_by = usuário atual é permitido em %s", async (table) => {
    const { error } = await (supabase.from(table) as any).insert({
      name: "meu novo", created_by: consultorId,
    });
    expect(error).toBeNull();
  });
});