import { useEffect } from "react";
import pdfAsset from "@/assets/apostilas-provas-cas.pdf.asset.json";

export default function Cas() {
  useEffect(() => {
    document.title = "CAS — Apostilas e Provas";
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h1 className="text-sm font-medium text-foreground">
          CAS — Apostilas e Provas
        </h1>
        <a
          href={pdfAsset.url}
          download="apostilas-provas-cas.pdf"
          className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition"
        >
          Baixar PDF
        </a>
      </header>
      <main className="flex-1">
        <object
          data={pdfAsset.url}
          type="application/pdf"
          className="w-full h-[calc(100vh-49px)]"
        >
          <iframe
            src={pdfAsset.url}
            title="CAS — Apostilas e Provas"
            className="w-full h-[calc(100vh-49px)] border-0"
          />
        </object>
      </main>
    </div>
  );
}