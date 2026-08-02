import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, CheckCircle2, Smartphone, Info, Sparkles, ArrowLeft, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_RELEASE_VERSION, APP_BUILD_ID, VERSION_URL } from "@/lib/app-version";
import { compareVersions } from "@/lib/version-bump";
import { useSthAiTheme } from "@/hooks/useSthAiTheme";

const getReleaseVersion = (v: string) => v.split("+")[0] || v;

type Status = "checking" | "up-to-date" | "update-available" | "error";

export default function AiSobre() {
  const navigate = useNavigate();
  useSthAiTheme();
  const [remote, setRemote] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("checking");
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  const localRelease = getReleaseVersion(APP_RELEASE_VERSION);

  const check = async () => {
    setStatus("checking");
    try {
      const res = await fetch(`${VERSION_URL}?t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      });
      if (!res.ok) throw new Error("no version");
      const data = await res.json();
      const rv = typeof data?.version === "string" ? getReleaseVersion(data.version) : null;
      if (!rv) throw new Error("bad version");
      setRemote(rv);
      setStatus(compareVersions(rv, localRelease) > 0 ? "update-available" : "up-to-date");
      setCheckedAt(new Date());
    } catch {
      setStatus("error");
      setCheckedAt(new Date());
    }
  };

  useEffect(() => {
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-xl space-y-8">
        <button
          type="button"
          onClick={() => navigate("/ai/app")}
          className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para o STH AI
        </button>

        <div className="space-y-3 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Sobre o STH AI</h1>
          <p className="text-sm text-muted-foreground">
            Versão beta do app inteligente do ecossistema STH METHOD.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Versão instalada</p>
          <p className="text-3xl font-semibold">v{localRelease}</p>
          <p className="text-[11px] text-muted-foreground">Build {APP_BUILD_ID}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Status</p>
            <button
              onClick={check}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <RefreshCw className={`h-3 w-3 ${status === "checking" ? "animate-spin" : ""}`} />
              Verificar
            </button>
          </div>

          {status === "checking" && (
            <p className="text-sm text-muted-foreground">Consultando servidor…</p>
          )}

          {status === "up-to-date" && (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold">Você está na versão mais recente</p>
                <p className="text-xs text-muted-foreground">Nada a atualizar no momento.</p>
              </div>
            </div>
          )}

          {status === "update-available" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Nova versão disponível: v{remote}</p>
                  <p className="text-xs text-muted-foreground">
                    Atualize o app para receber as melhorias mais recentes.
                  </p>
                </div>
              </div>
              <Button onClick={() => navigate("/baixar-apk")} size="lg" className="w-full">
                <Smartphone className="mr-2 h-4 w-4" />
                Atualizar agora (v{remote})
              </Button>
            </div>
          )}

          {status === "error" && (
            <p className="text-sm text-muted-foreground">
              Não foi possível consultar a versão remota. Tente novamente em instantes.
            </p>
          )}

          {checkedAt && (
            <p className="text-[10px] text-muted-foreground/60">
              Última verificação: {checkedAt.toLocaleTimeString("pt-BR")}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">O que é o STH AI?</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            O <strong className="text-foreground">STH AI</strong> é o aplicativo inteligente do ecossistema
            STH METHOD. Ele oferece treino guiado, cardápio inteligente, análise de exames, diário alimentar
            com Food AI e acompanhamento de saúde — tudo com a mesma metodologia da plataforma principal,
            mas em uma experiência autônoma e em constante evolução.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Esta versão está em <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">beta</span>.
            Novas funcionalidades e ajustes são liberados continuamente com base no seu feedback.
          </p>
        </div>

        <Button variant="outline" className="w-full" onClick={() => navigate("/ai/app")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para o app STH AI
        </Button>
      </div>
    </div>
  );
}
