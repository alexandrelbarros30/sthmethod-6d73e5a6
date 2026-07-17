import { describe, it, expect, vi, beforeEach } from "vitest";

const rpcMock = vi.fn().mockResolvedValue({ data: null, error: null });
const toastError = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc: (...args: any[]) => rpcMock(...args) },
}));
vi.mock("sonner", () => ({
  toast: { error: (...args: any[]) => toastError(...args) },
}));

import { handleLibraryWriteError, RLS_DENIED_CODE } from "./library-write-guard";

describe("handleLibraryWriteError", () => {
  beforeEach(() => {
    rpcMock.mockClear();
    toastError.mockClear();
  });

  it("marca erro RLS 42501 como denied e mostra mensagem amigável", async () => {
    const res = await handleLibraryWriteError(
      { code: RLS_DENIED_CODE, message: "new row violates row-level security policy" },
      { table: "exercise_library", operation: "update", recordId: "abc" },
    );
    expect(res.denied).toBe(true);
    expect(res.message).toMatch(/não é o autor/i);
    expect(res.message).toMatch(/duplique/i);
    expect(toastError).toHaveBeenCalledTimes(1);
  });

  it("detecta 'permission denied' sem code como RLS", async () => {
    const res = await handleLibraryWriteError(
      { message: "permission denied for table diet_library" },
      { table: "diet_library", operation: "delete", recordId: "id-1" },
    );
    expect(res.denied).toBe(true);
    expect(res.message).toMatch(/excluir/i);
  });

  it("registra tentativa negada em library_write_audit via RPC", async () => {
    await handleLibraryWriteError(
      { code: RLS_DENIED_CODE, message: "denied" },
      {
        table: "training_programs",
        operation: "insert",
        payload: { title: "X" } as any,
      },
    );
    expect(rpcMock).toHaveBeenCalledWith(
      "log_library_write_denied",
      expect.objectContaining({
        _table_name: "training_programs",
        _operation: "insert",
        _attempted_payload: { title: "X" },
      }),
    );
  });

  it("não classifica erros comuns (não-RLS) como denied", async () => {
    const res = await handleLibraryWriteError(
      { code: "23505", message: "duplicate key value violates unique constraint" },
      { table: "protocol_library", operation: "insert" },
    );
    expect(res.denied).toBe(false);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("respeita showToast=false (silencioso)", async () => {
    await handleLibraryWriteError(
      { code: RLS_DENIED_CODE, message: "denied" },
      { table: "protocol_library", operation: "update", recordId: "x", showToast: false },
    );
    expect(toastError).not.toHaveBeenCalled();
  });

  it("mensagem varia entre update e delete", async () => {
    const upd = await handleLibraryWriteError(
      { code: RLS_DENIED_CODE, message: "denied" },
      { table: "diet_library", operation: "update", recordId: "1", showToast: false },
    );
    const del = await handleLibraryWriteError(
      { code: RLS_DENIED_CODE, message: "denied" },
      { table: "diet_library", operation: "delete", recordId: "1", showToast: false },
    );
    expect(upd.message).toMatch(/alterar/i);
    expect(del.message).toMatch(/excluir/i);
  });
});