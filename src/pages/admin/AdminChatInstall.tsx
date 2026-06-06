import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Smartphone, ExternalLink, Download } from "lucide-react";
import { Link } from "react-router-dom";

const CHANNELS = [
  { slug: "comercial", label: "Comercial",         color: "#25D366", icon: "/pwa-comercial-512.png", phone: "+55 21 99849-6289" },
  { slug: "nutri",     label: "Fale com o Nutri",  color: "#10b981", icon: "/pwa-nutri-512.png",     phone: "+55 21 99898-4153" },
  { slug: "sucesso",   label: "Sucesso do Aluno",  color: "#a78bfa", icon: "/pwa-sucesso-512.png",   phone: "Sucesso do Aluno" },
];

export default function AdminChatInstall() {
  const isMobile = useIsMobile();
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar role="admin" />
      <div className={`${isMobile ? "pt-12" : "ml-60"} p-6 max-w-4xl mx-auto`}>
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold">Instalar chats como apps</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cada canal vira um app independente na tela inicial do celular, com ícone, nome e notificação próprios — sem precisar do WhatsApp nativo.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {CHANNELS.map((c) => (
            <Card key={c.slug} className="p-4 flex flex-col items-center text-center gap-3 border-2"
              style={{ borderColor: c.color + "40" }}>
              <img src={c.icon} alt={c.label} className="w-20 h-20 rounded-2xl shadow-lg" loading="lazy" width={80} height={80} />
              <div>
                <p className="font-semibold text-sm">{c.label}</p>
                <p className="text-[10px] text-muted-foreground">{c.phone}</p>
              </div>
              <Button asChild className="w-full gap-1.5 text-xs" style={{ background: c.color }}>
                <Link to={`/chat/${c.slug}`}>
                  <ExternalLink className="w-3.5 h-3.5" /> Abrir chat
                </Link>
              </Button>
            </Card>
          ))}
        </div>

        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-500" />
            <h2 className="font-semibold">Como instalar na tela do celular</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p className="font-medium flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-black text-white text-[10px] font-bold"></span>
                iPhone (Safari)
              </p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal pl-4">
                <li>Abra o link do canal acima no <b>Safari</b></li>
                <li>Toque no botão <b>Compartilhar</b> (□↑)</li>
                <li>Toque em <b>"Adicionar à Tela de Início"</b></li>
                <li>Confirme — o app aparece com ícone próprio</li>
              </ol>
            </div>
            <div className="space-y-2">
              <p className="font-medium flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-emerald-500 text-white text-[10px] font-bold">A</span>
                Android (Chrome)
              </p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal pl-4">
                <li>Abra o link do canal acima no <b>Chrome</b></li>
                <li>Toque no menu <b>⋮</b> no canto superior direito</li>
                <li>Toque em <b>"Instalar app"</b> ou <b>"Adicionar à tela inicial"</b></li>
                <li>Confirme — o app aparece com ícone próprio</li>
              </ol>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs flex gap-2">
            <Download className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <p>
              Cada canal pode ser instalado <b>separadamente</b> — você terá 3 ícones na tela do celular,
              um para cada linha de atendimento. Conversar pelo chat instalado é independente do WhatsApp do celular.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}