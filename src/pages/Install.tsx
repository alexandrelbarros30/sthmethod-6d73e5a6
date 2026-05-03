import { Button } from "@/components/ui/button";
import { Share, MoreVertical, PlusSquare, Download, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } },
};

const Step = ({ number, icon, title, description }: { number: number; icon: React.ReactNode; title: string; description: string }) => (
  <div className="py-6 border-t border-border/40 flex items-start gap-5">
    <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-2xl bg-muted text-foreground">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-muted-foreground mb-1">Passo {number}</p>
      <p className="text-base font-semibold text-foreground tracking-tight">{title}</p>
      <p className="text-[14px] text-muted-foreground font-light mt-1 leading-relaxed">{description}</p>
    </div>
  </div>
);

const Install = () => {
  const navigate = useNavigate();
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
    setIsInstalled(window.matchMedia("(display-mode: standalone)").matches);
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 antialiased">
        <div className="text-center max-w-md">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-[-0.03em] text-foreground mb-4">App já instalado.</h1>
          <p className="text-lg text-muted-foreground font-light mb-8">Você já está usando o app no seu dispositivo.</p>
          <Button onClick={() => navigate("/")} className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-8 h-12 text-[15px] font-medium">
            Ir para o início
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground antialiased" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <header className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-2xl border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6 h-11 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Início</span>
          </Link>
          <span className="text-[12px] font-semibold tracking-tight">STH METHOD</span>
          <span className="w-12" />
        </div>
      </header>

      <section className="pt-32 md:pt-40 pb-12 text-center px-6">
        <motion.p initial="hidden" animate="visible" variants={fadeUp} className="text-[12px] font-medium tracking-[0.25em] uppercase text-primary mb-6">
          App
        </motion.p>
        <motion.h1 initial="hidden" animate="visible" variants={fadeUp} className="max-w-3xl mx-auto text-5xl md:text-7xl lg:text-8xl font-semibold tracking-[-0.04em] leading-[0.95] text-foreground">
          Direto na sua <br /><span className="text-muted-foreground">tela inicial.</span>
        </motion.h1>
        <motion.p initial="hidden" animate="visible" variants={fadeUp} className="max-w-md mx-auto mt-6 text-lg text-muted-foreground font-light">
          Tela cheia. Mais rápido. Sem barras.
        </motion.p>
      </section>

      <section className="max-w-xl mx-auto px-6 pb-24">
        {deferredPrompt && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mb-12 text-center">
            <Button onClick={handleInstall} size="lg" className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-8 h-12 text-[15px] font-medium">
              <Download className="w-4 h-4 mr-2" /> Instalar agora
            </Button>
          </motion.div>
        )}

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-muted-foreground mb-6 text-center">
            {isIOS ? "iPhone · iPad" : "Android"}
          </p>
          {isIOS ? (
            <>
              <Step number={1} icon={<Share className="w-5 h-5" />} title="Toque em Compartilhar" description="Ícone na barra inferior do Safari." />
              <Step number={2} icon={<PlusSquare className="w-5 h-5" />} title='"Adicionar à Tela de Início"' description="Role as opções e selecione." />
              <Step number={3} icon={<Download className="w-5 h-5" />} title='Confirme em "Adicionar"' description="Pronto — o app fica na tela inicial." />
            </>
          ) : (
            <>
              <Step number={1} icon={<MoreVertical className="w-5 h-5" />} title="Toque no menu" description="3 pontinhos no canto superior direito do Chrome." />
              <Step number={2} icon={<PlusSquare className="w-5 h-5" />} title='"Instalar app"' description="Selecione no menu do navegador." />
              <Step number={3} icon={<Download className="w-5 h-5" />} title="Confirme" description="O app aparece na sua tela inicial." />
            </>
          )}
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mt-16 pt-12 border-t border-border/40">
          <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-muted-foreground mb-6 text-center">Vantagens</p>
          <div className="grid gap-px bg-border/40 rounded-3xl overflow-hidden">
            {["Acesso rápido pela tela inicial", "Tela cheia, sem barras", "Carregamento mais rápido", "Atualizações automáticas"].map((t) => (
              <p key={t} className="bg-background px-6 py-5 text-[15px] text-foreground font-light">{t}</p>
            ))}
          </div>
        </motion.div>

        <div className="mt-16 text-center">
          <Button variant="ghost" onClick={() => navigate("/")} className="text-[13px] text-muted-foreground hover:text-foreground rounded-full">
            Voltar ao site
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Install;
