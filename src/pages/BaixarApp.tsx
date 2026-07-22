import { Download, Smartphone, ShieldCheck, Apple } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import marketingHero from "@/assets/marketing-launch-hero.png";

const APK_URL =
  "https://drive.google.com/uc?export=download&id=1Dll24Nhli7bS-xR4hm8faXXCUDxsfmFu";

export default function BaixarApp() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-xl w-full space-y-8 text-center">
        <img
          src={marketingHero}
          alt="STH METHOD — Dieta, Protocolo e Treino em um só app"
          width={1280}
          height={720}
          className="w-full rounded-2xl border border-white/10 shadow-[0_0_60px_-20px_rgba(57,255,20,0.4)]"
        />
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30">
          <Smartphone className="w-10 h-10 text-primary" />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Baixar o App STH METHOD</h1>
          <p className="text-white/60">
            Instale o aplicativo no seu celular para acesso rápido, treino guiado e cronômetro.
          </p>
        </div>

        {/* Android */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4 text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Download className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="font-semibold">Android (APK)</h2>
              <p className="text-sm text-white/50">Instalação direta — sempre a versão mais recente</p>
            </div>
          </div>
          <Button asChild size="lg" className="w-full">
            <a href={APK_URL} rel="noopener" target="_blank">
              <Download className="w-4 h-4 mr-2" />
              Baixar APK
            </a>
          </Button>
          <ol className="text-sm text-white/60 space-y-1 list-decimal list-inside">
            <li>Toque em "Baixar APK" acima.</li>
            <li>Abra o arquivo baixado.</li>
            <li>Permita "instalar de fontes desconhecidas" se solicitado.</li>
            <li>Conclua a instalação e abra o STH METHOD.</li>
          </ol>
          <div className="flex items-start gap-2 text-xs text-white/40 pt-2 border-t border-white/5">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Arquivo oficial hospedado no repositório GitHub da STH METHOD.</span>
          </div>
        </div>

        {/* iOS */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-3 text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
              <Apple className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold">iPhone / iPad</h2>
              <p className="text-sm text-white/50">Instale como App via Safari</p>
            </div>
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link to="/install">Ver instruções para iPhone</Link>
          </Button>
        </div>

        <Link to="/" className="inline-block text-sm text-white/50 hover:text-white">
          ← Voltar
        </Link>
      </div>
    </div>
  );
}
