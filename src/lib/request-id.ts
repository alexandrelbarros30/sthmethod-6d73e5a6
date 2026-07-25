// Correlation ID interno para rastrear erros no backend sem expor
// detalhes técnicos ao aluno. Um ID por sessão + um ID por evento de erro.

const SESSION_KEY = "sth-session-id";

function rand(): string {
  // 12 chars base36 — suficiente para correlação
  return (
    Math.random().toString(36).slice(2, 8) +
    Math.random().toString(36).slice(2, 8)
  ).toUpperCase();
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "SSR";
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = rand();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return rand();
  }
}

/** Gera um X-Request-Id novo para cada requisição. */
export function newRequestId(): string {
  return `${getSessionId()}-${rand()}`;
}

/** Guarda o último request-id observado (usado como correlação em erros). */
let lastRequestId: string | null = null;
export function setLastRequestId(id: string) {
  lastRequestId = id;
}
export function getLastRequestId(): string {
  return lastRequestId || getSessionId();
}

/**
 * Injeta um X-Request-Id em toda chamada fetch para nosso backend/edge,
 * permitindo rastrear no log sem que o aluno veja nada técnico.
 * Não altera respostas nem lê corpo — apenas adiciona header.
 */
export function installRequestIdInterceptor() {
  if (typeof window === "undefined") return;
  const w = window as any;
  if (w.__sthReqIdInstalled) return;
  w.__sthReqIdInstalled = true;

  const origFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
          ? input.toString()
          : (input as Request).url;

      // Só injeta em chamadas para nosso backend (Supabase/edge functions).
      const isOurBackend =
        /supabase\.co\//i.test(url) ||
        /\/functions\/v1\//i.test(url) ||
        url.startsWith("/api/");

      if (isOurBackend) {
        const rid = newRequestId();
        setLastRequestId(rid);
        const headers = new Headers(init?.headers || (input as Request).headers);
        if (!headers.has("X-Request-Id")) headers.set("X-Request-Id", rid);
        if (!headers.has("X-Client-Session")) headers.set("X-Client-Session", getSessionId());
        init = { ...(init || {}), headers };
      }
    } catch {
      // nunca quebra a chamada por causa do header
    }
    return origFetch(input as any, init);
  };
}