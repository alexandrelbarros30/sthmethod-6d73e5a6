import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useSthAiTheme } from "@/hooks/useSthAiTheme";
import { Button } from "@/components/ui/button";
import AiLogoMark from "@/components/ai/AiLogoMark";
import { Smartphone, Download, Share, PlusSquare, ShieldCheck, ArrowLeft } from "lucide-react";

import apkAsset from "@/assets/sthai.apk.asset.json";

const APK_URL = apkAsset.url;
const APK_SIZE_MB = Math.round(apkAsset.size / 1024 / 1024);

export default function AiInstalar() {
  useSthAiTheme();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Instalar o app STH AI | Android e iPhone</title>
        <meta
          name="description"
          content="Baixe o app STH AI para Android (APK) ou instale no iPhone pela tela de início. Nutrição, treino e leitura preditiva em um app próprio."
        />
        <link rel="canonical" href="https://sthmethod.com/ai/instalar" />
      </Helmet>

      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5">
        <Link to="/ai" className="flex items-center gap-2">
          <AiLogoMark className="h-8 w-8" />
          <span className="text-sm font-semibold tracking-tight">STH METHOD AI</span>
        </Link>
        <Button asChild variant="ghost" size="sm">
          <Link to="/ai"><ArrowLeft className="mr-1 h-4 w-4" /> Voltar</Link>
        </Button>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-16">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Instalar o app STH AI</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          O STH AI é um aplicativo próprio, separado do app STH METHOD: ícone, login e telas exclusivas.
        </p>

        <section className="mt-8 rounded-3xl border border-border/50 bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Smartphone className="h-4 w-4 text-primary" /> Android
          </div>
          <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>1. Toque em <strong className="text-foreground">Baixar APK</strong> abaixo.</li>
            <li>2. Autorize a instalação de “fontes desconhecidas” quando o celular pedir.</li>
            <li>3. Abra o app STH AI pelo ícone criado na tela inicial.</li>
          </ol>
          <Button asChild className="mt-4 w-full sm:w-auto">
            <a href={APK_URL} rel="noopener noreferrer" target="_blank" download="sthai.apk">
              <Download className="mr-2 h-4 w-4" /> Baixar APK do STH AI ({APK_SIZE_MB} MB)
            </a>
          </Button>
          <div className="mt-4 p-4 border border-dashed border-primary/30 rounded-2xl bg-primary/5">
            <p className="text-xs text-primary font-medium mb-2">Instalação Direta (Experimental)</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
              Versão 1.1.154 | Após a geração do build da STHia, baixe o arquivo APK atualizado abaixo.
            </p>
              <Button asChild variant="outline" size="sm" className="w-full sm:w-auto text-[11px] h-8 rounded-xl border-primary/20 hover:bg-primary/10">
                <a href={APK_URL} rel="noopener noreferrer" target="_blank">
                  <Download className="mr-1.5 h-3 w-3" /> Link Direto (Build Atualizado)
                </a>
              </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Preferir sem instalar? Abra <Link to="/ai/app" className="underline">o app pelo navegador</Link> e use “Instalar app” no menu do Chrome.
          </p>
        </section>

        <section className="mt-5 rounded-3xl border border-border/50 bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Share className="h-4 w-4 text-primary" /> iPhone / iPad
          </div>
          <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>1. Abra <Link to="/ai/app" className="underline">sthmethod.com/ai/app</Link> no <strong className="text-foreground">Safari</strong>.</li>
            <li>2. Toque no botão <strong className="text-foreground">Compartilhar</strong> na barra inferior.</li>
            <li>3. Escolha <strong className="text-foreground">Adicionar à Tela de Início</strong> <PlusSquare className="inline h-3.5 w-3.5" /> e confirme.</li>
            <li>4. O ícone do STH AI aparece separado do app STH METHOD.</li>
          </ol>
        </section>

        <section className="mt-5 flex items-start gap-3 rounded-3xl border border-border/50 bg-muted/40 p-5 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>
            As atualizações chegam automaticamente ao abrir o app. Seu login e seus dados do STH AI são
            independentes do painel do STH METHOD.
          </p>
        </section>
      </main>
    </div>
  );
}
