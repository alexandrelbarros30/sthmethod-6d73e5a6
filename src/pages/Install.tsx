import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Share, MoreVertical, PlusSquare, Download, ArrowLeft, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const Install = () => {
  const navigate = useNavigate();
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
    setIsInstalled(window.matchMedia("(display-mode: standalone)").matches);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
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
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="w-16 h-16 rounded-2xl gradient-bg mx-auto flex items-center justify-center">
              <Smartphone className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">App já instalado!</h1>
            <p className="text-muted-foreground">Você já está usando o app instalado no seu dispositivo.</p>
            <Button onClick={() => navigate("/")} className="w-full">Ir para o início</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-bg py-8 px-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="text-primary-foreground/80 hover:text-primary-foreground mb-4 flex items-center gap-1 text-sm">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary-foreground/10 backdrop-blur flex items-center justify-center border border-primary-foreground/20">
              <Smartphone className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary-foreground">Instalar App</h1>
              <p className="text-primary-foreground/70 text-sm">Acesse direto da tela inicial</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-6 space-y-6 -mt-2">
        {/* Install button (Android/Desktop) */}
        {deferredPrompt && (
          <Card className="border-primary/30 glow-border">
            <CardContent className="pt-6 pb-6 text-center space-y-4">
              <Download className="w-10 h-10 text-primary mx-auto" />
              <h2 className="text-lg font-semibold text-foreground">Instalação rápida</h2>
              <p className="text-sm text-muted-foreground">Clique no botão abaixo para instalar o app diretamente.</p>
              <Button onClick={handleInstall} size="lg" className="w-full">
                <Download className="w-4 h-4 mr-2" /> Instalar agora
              </Button>
            </CardContent>
          </Card>
        )}

        {/* iOS Instructions */}
        {isIOS && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Como instalar no iPhone / iPad</h2>
            <div className="space-y-3">
              <Step number={1} icon={<Share className="w-5 h-5" />} title="Toque em Compartilhar" description='Toque no ícone de compartilhar na barra inferior do Safari.' />
              <Step number={2} icon={<PlusSquare className="w-5 h-5" />} title='Toque em "Adicionar à Tela de Início"' description="Role as opções e selecione esta opção." />
              <Step number={3} icon={<Download className="w-5 h-5" />} title='Confirme tocando em "Adicionar"' description="O app será adicionado à sua tela inicial como um ícone." />
            </div>
          </div>
        )}

        {/* Android Instructions */}
        {!isIOS && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Como instalar no Android</h2>
            <div className="space-y-3">
              <Step number={1} icon={<MoreVertical className="w-5 h-5" />} title="Toque no menu do navegador" description="Toque nos 3 pontinhos no canto superior direito do Chrome." />
              <Step number={2} icon={<PlusSquare className="w-5 h-5" />} title='Selecione "Instalar app" ou "Adicionar à tela inicial"' description="Essa opção aparece no menu do navegador." />
              <Step number={3} icon={<Download className="w-5 h-5" />} title="Confirme a instalação" description="O app será instalado e aparecerá na sua tela inicial." />
            </div>
          </div>
        )}

        {/* Benefits */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <h3 className="font-semibold text-foreground">Vantagens do app</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {["Acesso rápido pela tela inicial", "Funciona em tela cheia, sem barra do navegador", "Carregamento mais rápido", "Atualizações automáticas"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full gradient-bg shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Button variant="outline" onClick={() => navigate("/")} className="w-full">
          Voltar ao site
        </Button>
      </div>
    </div>
  );
};

const Step = ({ number, icon, title, description }: { number: number; icon: React.ReactNode; title: string; description: string }) => (
  <Card>
    <CardContent className="flex items-start gap-4 py-4 px-4">
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground text-sm">
          <span className="text-primary font-bold mr-1">{number}.</span>{title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </CardContent>
  </Card>
);

export default Install;
