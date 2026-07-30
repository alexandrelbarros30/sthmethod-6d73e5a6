/**
 * Valida se o arquivo é realmente um PDF (assinatura %PDF-).
 * Portais de laboratório frequentemente entregam uma página HTML salva com
 * extensão .pdf — o arquivo sobe, mas o visualizador falha ao abrir.
 */
export const INVALID_PDF_MESSAGE =
  "Este arquivo não é um PDF válido (parece ser uma página do site do laboratório). Abra o laudo no portal e use 'Baixar PDF' ou 'Imprimir → Salvar como PDF' antes de enviar.";

export async function isRealPdf(file: Blob): Promise<boolean> {
  const head = new TextDecoder().decode(new Uint8Array(await file.slice(0, 1024).arrayBuffer()));
  return head.trimStart().startsWith("%PDF-");
}

export async function assertRealPdf(file: Blob): Promise<void> {
  if (!(await isRealPdf(file))) throw new Error(INVALID_PDF_MESSAGE);
}
