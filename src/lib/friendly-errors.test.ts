import { describe, it, expect } from "vitest";
import { toFriendlyError, friendlyMessage } from "./friendly-errors";

const LEAKS = [
  /supabase/i, /postgres/i, /postgrest/i, /pgrst\d+/i, /jwt/i,
  /lovable/i, /vite/i, /react/i, /typescript/i, /stack/i,
  /at \S+:\d+:\d+/i, /gemini/i, /openai/i, /deno/i, /edge function/i,
];

function assertNoLeak(text: string) {
  for (const p of LEAKS) {
    expect(text, `vazou termo técnico "${p}" em: ${text}`).not.toMatch(p);
  }
}

describe("friendly-errors: mapeamento de erros técnicos → STH-XXX", () => {
  const cases: Array<{ name: string; err: unknown; code: string }> = [
    { name: "rede: Failed to fetch",       err: new Error("TypeError: Failed to fetch supabase.co"), code: "STH-100" },
    { name: "rede: NetworkError",          err: new Error("NetworkError when attempting to fetch"),   code: "STH-100" },
    { name: "rede: timeout",               err: new Error("Request timed out from edge function"),    code: "STH-100" },
    { name: "auth: 401 invalid login",     err: { status: 401, message: "Invalid login credentials" }, code: "STH-401" },
    { name: "auth: email not confirmed",   err: { message: "Email not confirmed" },                    code: "STH-402" },
    { name: "auth: sessão expirada",       err: { message: "JWT session expired" },                    code: "STH-403" },
    { name: "perm: 403",                   err: { status: 403, message: "permission denied for table" }, code: "STH-405" },
    { name: "perm: RLS 42501",             err: { code: "42501", message: "new row violates policy" },   code: "STH-405" },
    { name: "not found: 404",              err: { status: 404, message: "Not found" },                  code: "STH-404" },
    { name: "not found: PGRST116",         err: { code: "PGRST116", message: "no rows" },               code: "STH-404" },
    { name: "duplicidade: 23505",          err: { code: "23505", message: "duplicate key" },            code: "STH-409" },
    { name: "validacao: 422",              err: { status: 422, message: "invalid payload" },            code: "STH-422" },
    { name: "upload muito grande",         err: { message: "Payload too large" },                       code: "STH-413" },
    { name: "rate limit 429",              err: { status: 429, message: "too many requests" },          code: "STH-429" },
    { name: "servidor 500",                err: { status: 500, message: "Internal server error at Deno" }, code: "STH-500" },
    { name: "pagamento",                   err: new Error("Mercado Pago card declined"),               code: "STH-602" },
    { name: "fallback string vazia",       err: "",                                                    code: "STH-000" },
    { name: "fallback objeto estranho",    err: { foo: "bar" },                                        code: "STH-000" },
  ];

  for (const c of cases) {
    it(`converte "${c.name}" → ${c.code} sem vazar linguagem técnica`, () => {
      const f = toFriendlyError(c.err);
      expect(f.code).toBe(c.code);
      expect(f.title.length).toBeGreaterThan(0);
      expect(f.message.length).toBeGreaterThan(0);
      assertNoLeak(f.title);
      assertNoLeak(f.message);
      // friendlyMessage adiciona ref (correlation id) mas nunca vaza termos técnicos
      const msg = friendlyMessage(c.err);
      assertNoLeak(msg);
      expect(msg).toContain(c.code);
      expect(msg.toLowerCase()).toContain("ref:");
    });
  }

  it("nunca inclui o texto bruto do erro na saída", () => {
    const raw = "Supabase RLS PGRST301 at /supabase.co/rest/v1/foo — react stack";
    const f = toFriendlyError(new Error(raw));
    assertNoLeak(`${f.title} ${f.message}`);
    assertNoLeak(friendlyMessage(new Error(raw)));
  });
});