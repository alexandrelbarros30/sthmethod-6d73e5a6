import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Megaphone,
  Users,
  LayoutTemplate,
  Image as ImageIcon,
  Filter,
  History,
  Clock,
  Send,
  Sparkles,
  TrendingUp,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import CRMContacts from "@/components/admin/crm/CRMContacts";
import CRMSegments from "@/components/admin/crm/CRMSegments";
import CRMTemplates from "@/components/admin/crm/CRMTemplates";
import CRMMedia from "@/components/admin/crm/CRMMedia";
import CRMCampaigns from "@/components/admin/crm/CRMCampaigns";
import CRMHistory from "@/components/admin/crm/CRMHistory";
import CRMAutomations from "@/components/admin/crm/CRMAutomations";
import MotorRespostaLink from "@/components/admin/MotorRespostaLink";

type RoleArea = "admin" | "consultor";
interface Props { area?: RoleArea }

const SUB_TABS = [
  { id: "dashboard", label: "Dashboard", icon: TrendingUp },
  { id: "campanhas", label: "Campanhas", icon: Megaphone },
  { id: "templates", label: "Templates", icon: LayoutTemplate },
  { id: "contatos", label: "Contatos", icon: Users },
  { id: "segmentos", label: "Segmentações", icon: Filter },
  { id: "midias", label: "Mídias", icon: ImageIcon },
  { id: "historico", label: "Histórico", icon: History },
  { id: "automacao", label: "Automação", icon: Clock },
] as const;

type TabId = (typeof SUB_TABS)[number]["id"];

const ComingSoon = ({ title, description }: { title: string; description: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card className="border-emerald-500/10 bg-gradient-to-br from-background to-emerald-500/5">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="rounded-2xl bg-emerald-500/10 p-4">
          <Sparkles className="h-7 w-7 text-emerald-400" />
        </div>
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
        <Badge variant="outline" className="mt-2 border-emerald-500/30 text-emerald-400">
          Fase seguinte
        </Badge>
      </CardContent>
    </Card>
  </motion.div>
);

const StatCard = ({
  label,
  value,
  hint,
  icon: Icon,
  accent = "emerald",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: any;
  accent?: "emerald" | "amber" | "sky" | "violet";
}) => {
  const accentMap: Record<string, string> = {
    emerald: "from-emerald-500/20 to-emerald-500/0 text-emerald-400",
    amber: "from-amber-500/20 to-amber-500/0 text-amber-400",
    sky: "from-sky-500/20 to-sky-500/0 text-sky-400",
    violet: "from-violet-500/20 to-violet-500/0 text-violet-400",
  };
  return (
    <Card className="overflow-hidden border-border/40">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
            {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
          </div>
          <div className={`rounded-xl bg-gradient-to-br p-2.5 ${accentMap[accent]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const CRMDashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ["crm-dashboard-stats"],
    queryFn: async () => {
      const [campaigns, templates, media, runs] = await Promise.all([
        supabase.from("crm_campaigns").select("id,status", { count: "exact" }),
        supabase.from("crm_templates").select("id", { count: "exact", head: true }),
        supabase.from("crm_media").select("id", { count: "exact", head: true }),
        supabase.from("crm_campaign_runs").select("sent_count,failed_count").limit(500),
      ]);
      const totalSent = (runs.data || []).reduce((acc, r: any) => acc + (r.sent_count || 0), 0);
      const totalFailed = (runs.data || []).reduce((acc, r: any) => acc + (r.failed_count || 0), 0);
      const active = (campaigns.data || []).filter((c: any) => c.status === "sending" || c.status === "scheduled").length;
      return {
        totalCampaigns: campaigns.count || 0,
        activeCampaigns: active,
        templates: templates.count || 0,
        media: media.count || 0,
        totalSent,
        totalFailed,
      };
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Campanhas ativas" value={stats?.activeCampaigns ?? 0} hint="agendadas ou enviando" icon={Activity} accent="emerald" />
        <StatCard label="Total enviadas" value={stats?.totalSent ?? 0} hint="todas as execuções" icon={Send} accent="sky" />
        <StatCard label="Templates" value={stats?.templates ?? 0} hint="biblioteca editorial" icon={LayoutTemplate} accent="violet" />
        <StatCard label="Mídias STH" value={stats?.media ?? 0} hint="artes, vídeos, PDFs" icon={ImageIcon} accent="amber" />
      </div>

      <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-background to-background">
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span className="text-xs uppercase tracking-wider text-emerald-400">Central de Campanhas</span>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Relacionamento estratégico, automatizado e premium.
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Crie campanhas inteligentes para alunos ativos, inativos, leads, renovações e novidades —
              tudo a partir de uma única central. Estilo Apple, fluxo limpo, escalável.
            </p>
          </div>
          <Button disabled className="gap-2 bg-emerald-500 text-black hover:bg-emerald-400">
            Nova campanha
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {SUB_TABS.filter((t) => t.id !== "dashboard").map((t) => (
          <Card key={t.id} className="border-border/40 transition hover:border-emerald-500/30">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
                <t.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{t.label}</p>
                <p className="text-xs text-muted-foreground">Disponível nas próximas fases.</p>
              </div>
              <Badge variant="outline" className="border-border/60 text-xs">
                em breve
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
};

export default function AdminCRM({ area = "admin" }: Props) {
  const [tab, setTab] = useState<TabId>("dashboard");

  const content = useMemo(() => {
    switch (tab) {
      case "dashboard":
        return <CRMDashboard />;
      case "campanhas":
        return <CRMCampaigns />;
      case "templates":
        return <CRMTemplates />;
      case "contatos":
        return <CRMContacts />;
      case "segmentos":
        return <CRMSegments />;
      case "midias":
        return <CRMMedia />;
      case "historico":
        return <CRMHistory />;
      case "automacao":
        return <CRMAutomations />;
      default:
        return null;
    }
  }, [tab]);

  return (
    <DashboardLayout role={area} title="Campanhas & Ofertas" subtitle="Central premium de relacionamento STH METHOD">
      <div className="space-y-6">
        {area === "admin" && <MotorRespostaLink context="Motor de Disparo de campanhas e automações" />}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-emerald-400" />
            <span className="text-xs uppercase tracking-[0.18em] text-emerald-400">CRM STH METHOD</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Campanhas & Ofertas</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Central premium de relacionamento — alunos, pacientes, leads e renovações em um único ecossistema inteligente.
          </p>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as TabId)}>
          <div className="-mx-2 overflow-x-auto px-2">
            <TabsList className="inline-flex h-auto flex-nowrap gap-1 bg-muted/40 p-1">
              {SUB_TABS.map((t) => (
                <TabsTrigger key={t.id} value={t.id} className="gap-2 whitespace-nowrap data-[state=active]:bg-background">
                  <t.icon className="h-3.5 w-3.5" />
                  <span className="text-xs">{t.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value={tab} className="mt-6">
            {content}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}