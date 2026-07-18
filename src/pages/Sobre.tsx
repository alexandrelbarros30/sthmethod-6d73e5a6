import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Download, RefreshCw, CheckCircle2, Smartphone, Info, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_RELEASE_VERSION, APP_BUILD_ID } from "@/lib/app-version";
import { compareVersions } from "@/lib/version-bump";

const APK_URL =
  "https://github.com/alexandrelbarros30/sthmethod-6d73e5a6/releases/latest/download/sthmethod.apk";

const isNativeApp = () => {
  if (typeof window === "undefined") return false;
  const w = window as any;
  return !!w.Capacitor?.isNativePlatform?.();
};

const getReleaseVersion = (v: string) => v.split("+")[0] || v;

type Status = "checking" | "up-to-date" | "update-available" | "error";

export default function Sobre() {
  const [remote, setRemote] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("checking");
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  const localRelease = getReleaseVersion(APP_RELEASE_VERSION);

  const check = async () => {
    setStatus("checking");
    try {
      const res = await fetch(`https://sthmethod.com/version.json?t=${Date.now()}`, {
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

  const openDownload = () => {
    const w = window as any;
    try {
      if (w.Capacitor?.Plugins?.Browser?.open) {
        w.Capacitor.Plugins.Browser.open({ url: APK_URL });
        return;
      }
    } catch {}
    window.open(APK_URL, "_system") || (window.location.href = APK_URL);
  };

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30">
            <Info className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Sobre o App</h1>
          <p className="text-sm text-white/60">
            Verifique a versão instalada e mantenha o STH METHOD sempre atualizado.
          </p>
        </div>

        {/* Versão atual */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-2">
          <p className="text-xs uppercase tracking-wider text-white/40">Versão instalada</p>
          <p className="text-3xl font-semibold">v{localRelease}</p>
          <p className="text-[11px] text-white/40">Build {APP_BUILD_ID}</p>
        </div>

        {/* Status */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-white/40">Status</p>
            <button
              onClick={check}
              className="text-xs text-white/60 hover:text-white flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${status === "checking" ? "animate-spin" : ""}`} />
              Verificar
            </button>
          </div>

          {status === "checking" && (
            <p className="text-sm text-white/60">Consultando servidor…</p>
          )}

          {status === "up-to-date" && (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Você está na versão mais recente</p>
                <p className="text-xs text-white/50">Nada a atualizar no momento.</p>
              </div>
            </div>
          )}

          {status === "update-available" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Download className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">Nova versão disponível: v{remote}</p>
                  <p className="text-xs text-white/50">
                    Baixe o APK atualizado para receber as melhorias mais recentes.
                  </p>
                </div>
              </div>
              <Button onClick={openDownload} size="lg" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Atualizar agora (v{remote})
              </Button>
              {isNativeApp() && (
                <ol className="text-xs text-white/50 space-y-1 list-decimal list-inside pt-2 border-t border-white/5">
                  <li>Toque em "Atualizar agora" acima.</li>
                  <li>Abra o APK baixado quando o download terminar.</li>
                  <li>Autorize a instalação se solicitado.</li>
                  <li>Reabra o STH METHOD normalmente — seus dados são preservados.</li>
                </ol>
              )}
            </div>
          )}

          {status === "error" && (
            <p className="text-sm text-white/60">
              Não foi possível consultar a versão remota. Tente novamente em instantes.
            </p>
          )}

          {checkedAt && (
            <p className="text-[10px] text-white/30">
              Última verificação: {checkedAt.toLocaleTimeString("pt-BR")}
            </p>
          )}
        </div>

        {/* Segurança */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-white/60">
            As atualizações são hospedadas no repositório oficial da STH METHOD no GitHub e
            assinadas com o mesmo certificado do app instalado.
          </p>
        </div>

        <div className="flex items-center justify-between text-sm">
          <Link to="/baixar-app" className="text-white/60 hover:text-white flex items-center gap-1">
            <Smartphone className="w-4 h-4" />
            Como instalar
          </Link>
          <Link to="/" className="text-white/50 hover:text-white">
            ← Voltar
          </Link>
        </div>
      </div>
    </div>
  );
}