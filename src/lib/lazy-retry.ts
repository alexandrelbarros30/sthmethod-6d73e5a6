import { lazy, type ComponentType } from "react";

/**
 * lazyWithRetry: protege rotas com code-splitting contra chunks obsoletos
 * após um novo deploy (o index.html novo aponta para arquivos que o cache
 * antigo não conhece → "Failed to fetch dynamically imported module").
 *
 * Em vez de quebrar a tela, recarrega uma única vez com cache-bust.
 */
const RETRY_KEY = "sth:chunk-retry";

const isChunkError = (err: unknown) => {
  const msg = String((err as any)?.message ?? err ?? "").toLowerCase();
  return (
    msg.includes("dynamically imported module") ||
    msg.includes("importing a module script failed") ||
    msg.includes("failed to fetch dynamically") ||
    msg.includes("chunkloaderror") ||
    msg.includes("loading chunk")
  );
};

export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      const mod = await factory();
      sessionStorage.removeItem(RETRY_KEY);
      return mod;
    } catch (err) {
      if (isChunkError(err) && sessionStorage.getItem(RETRY_KEY) !== "1") {
        sessionStorage.setItem(RETRY_KEY, "1");
        const url = new URL(window.location.href);
        url.searchParams.set("_v", Date.now().toString());
        window.location.replace(url.toString());
        // Mantém a promise pendente enquanto a página recarrega.
        return new Promise<{ default: T }>(() => {});
      }
      throw err;
    }
  });
}
