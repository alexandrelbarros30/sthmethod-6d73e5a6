// Mapeamento de erros técnicos → mensagens amigáveis com códigos STH-XXX.
// Objetivo: nunca expor Supabase / Postgres / Lovable / stack traces ao aluno.

import { getLastRequestId } from "./request-id";

export type FriendlyError = {
  code: string;      // ex: "STH-401"
  title: string;     // curto, humano
  message: string;   // orientação prática
  ref?: string;      // ID de correlação (X-Request-Id / sessão)
};

const GENERIC: FriendlyError = {
  code: "STH-000",
  title: "Algo não saiu como esperado",
  message:
    "Tivemos um contratempo momentâneo. Tente novamente em instantes. Se persistir, fale com a equipe informando o código acima.",
};

// Palavras-chave técnicas que jamais devem vazar para o público.
const LEAK_PATTERNS = [
  /supabase/i, /postgres/i, /postgrest/i, /pgrst\d+/i, /jwt/i, /rls/i,
  /lovable/i, /vite/i, /react/i, /typescript/i, /stack/i, /trace/i,
  /fetch failed/i, /networkerror/i, /axios/i, /cors/i, /edge function/i,
  /gemini/i, /openai/i, /anthropic/i, /deno/i, /node_modules/i,
  /at \S+:\d+:\d+/i, /\bhttps?:\/\/\S+supabase\S+/i,
];

function scrub(text: string | undefined | null): string {
  if (!text) return "";
  let out = String(text);
  for (const p of LEAK_PATTERNS) out = out.replace(p, "");
  return out.replace(/\s+/g, " ").trim();
}

// Extrai um "raw" string de qualquer forma de erro (Error, PostgrestError, string, obj).
function rawOf(err: unknown): { raw: string; status?: number; code?: string } {
  if (!err) return { raw: "" };
  if (typeof err === "string") return { raw: err };
  const anyErr = err as any;
  const raw = [
    anyErr?.message,
    anyErr?.error_description,
    anyErr?.error,
    anyErr?.hint,
    anyErr?.details,
    anyErr?.statusText,
  ]
    .filter(Boolean)
    .join(" | ");
  return {
    raw: raw || String(err),
    status: anyErr?.status ?? anyErr?.statusCode,
    code: anyErr?.code,
  };
}

/**
 * Converte qualquer erro em uma mensagem amigável com código STH-XXX.
 * Use SEMPRE antes de exibir erro a alunos / público externo.
 */
export function toFriendlyError(err: unknown): FriendlyError {
  const { raw, status, code } = rawOf(err);
  const r = raw.toLowerCase();

  // --- Versão nova publicada (chunk antigo em cache) ---
  if (
    r.includes("dynamically imported module") ||
    r.includes("importing a module script failed") ||
    r.includes("chunkloaderror") ||
    r.includes("loading chunk")
  ) {
    return {
      code: "STH-101",
      title: "Nova versão disponível",
      message:
        "Publicamos uma atualização enquanto você navegava. Toque em Recarregar tela para continuar com a versão mais recente.",
    };
  }

  // --- Rede / conexão ---
  if (
    r.includes("failed to fetch") ||
    r.includes("network") ||
    r.includes("offline") ||
    r.includes("timeout") ||
    r.includes("timed out") ||
    r.includes("aborted")
  ) {
    return {
      code: "STH-100",
      title: "Sem conexão estável",
      message:
        "Verifique sua internet e tente novamente. Se estiver em rede pública, alterne para Wi-Fi ou dados móveis.",
    };
  }

  // --- Autenticação / sessão ---
  if (status === 401 || r.includes("invalid login") || r.includes("invalid credentials")) {
    return {
      code: "STH-401",
      title: "E-mail ou senha inválidos",
      message: "Confira seus dados de acesso e tente novamente. Se esqueceu a senha, use a opção de recuperação.",
    };
  }
  if (r.includes("email not confirmed")) {
    return {
      code: "STH-402",
      title: "E-mail ainda não confirmado",
      message: "Abra o link de confirmação enviado ao seu e-mail para liberar o acesso.",
    };
  }
  if (r.includes("session") && (r.includes("expired") || r.includes("missing"))) {
    return {
      code: "STH-403",
      title: "Sua sessão expirou",
      message: "Por segurança, entre novamente para continuar.",
    };
  }

  // --- Permissão ---
  if (status === 403 || r.includes("permission") || r.includes("not allowed") || code === "42501") {
    return {
      code: "STH-405",
      title: "Acesso restrito",
      message: "Este conteúdo não está disponível para o seu perfil no momento.",
    };
  }

  // --- Não encontrado ---
  if (status === 404 || r.includes("not found") || code === "PGRST116") {
    return {
      code: "STH-404",
      title: "Conteúdo não encontrado",
      message: "O item que você tentou abrir não está mais disponível ou foi movido.",
    };
  }

  // --- Duplicidade ---
  if (code === "23505" || r.includes("duplicate") || r.includes("already exists")) {
    return {
      code: "STH-409",
      title: "Registro já existente",
      message: "Já existe um cadastro com esses dados. Verifique e tente novamente.",
    };
  }

  // --- Validação ---
  if (status === 400 || status === 422 || r.includes("invalid") || r.includes("required")) {
    return {
      code: "STH-422",
      title: "Dados incompletos ou inválidos",
      message: "Revise os campos preenchidos e tente novamente.",
    };
  }

  // --- Arquivo / upload ---
  if (r.includes("payload") || r.includes("too large") || r.includes("file size")) {
    return {
      code: "STH-413",
      title: "Arquivo muito grande",
      message: "Reduza o tamanho do arquivo e tente enviar novamente (máx. 55 MB para PDFs).",
    };
  }

  // --- Limite / abuso ---
  if (status === 429 || r.includes("rate limit") || r.includes("too many")) {
    return {
      code: "STH-429",
      title: "Muitas tentativas seguidas",
      message: "Aguarde alguns segundos antes de tentar novamente.",
    };
  }

  // --- Servidor ---
  if ((status && status >= 500) || r.includes("internal") || r.includes("server error")) {
    return {
      code: "STH-500",
      title: "Serviço temporariamente indisponível",
      message: "Estamos normalizando o serviço. Tente novamente em instantes.",
    };
  }

  // --- Pagamento ---
  if (r.includes("payment") || r.includes("mercado pago") || r.includes("card") || r.includes("cupom")) {
    return {
      code: "STH-602",
      title: "Não foi possível concluir o pagamento",
      message: "Confira os dados de pagamento ou tente outro método. Se persistir, fale com a equipe.",
    };
  }

  // --- Fallback: nunca vazar detalhes técnicos ---
  const _unused = scrub(raw); // scrub só para garantir que não usamos raw acidentalmente
  return GENERIC;
}

/** Formata como string única para toast/alert. */
export function friendlyMessage(err: unknown): string {
  const f = withRef(toFriendlyError(err));
  return `[${f.code}] ${f.title} — ${f.message} · Ref: ${f.ref}`;
}

/** Uso rápido com sonner. */
export function reportFriendlyError(err: unknown, toastFn: (msg: string) => void) {
  toastFn(friendlyMessage(err));
}

/** Anexa o ref (correlation id) ao friendly error. */
export function withRef(f: FriendlyError): FriendlyError {
  return { ...f, ref: f.ref || getLastRequestId() };
}