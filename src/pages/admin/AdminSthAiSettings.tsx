import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Save, Globe, ShieldCheck, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminSthAiSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>({
    is_active: true,
    public_url_enabled: true,
    exclusive_domain: "sthmethod.com.br/ai",
    model_version: "gemini-2.5-flash",
    maintenance_mode: false,
    require_subscription: true,
    show_on_landing: true,
    custom_prompt_rules: "",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      // Usando query dinâmica para evitar erros de tipo até que a tabela seja reconhecida pelo linter
      const { data, error } = await (supabase as any)
        .from("platform_settings")
        .select("*")
        .eq("key", "sth_ai_config")
        .maybeSingle();

      if (error) throw error;
      if (data && data.value) {
        setSettings(data.value);
      }
    } catch (error: any) {
      console.error("Erro ao carregar configurações:", error);
      // Silenciar erro de tabela não existente se ainda estiver rodando migração
      if (!error.message?.includes('does not exist')) {
        toast.error("Erro ao carregar configurações: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("platform_settings")
        .upsert({
          key: "sth_ai_config",
          value: settings,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

      if (error) throw error;
      toast.success("Configurações salvas com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8 text-center">Carregando...</div>;

  return (
    <DashboardLayout role="admin" title="Configurações STH AI" subtitle="Gerencie as regras e propagação do ecossistema de Inteligência Artificial">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <Settings className="h-5 w-5" />
            <span className="font-semibold uppercase tracking-wider text-xs">Painel de Controle</span>
          </div>
          <Button onClick={saveSettings} disabled={saving} className="gap-2">
            {saving ? "Salvando..." : <><Save className="h-4 w-4" /> Salvar Alterações</>}
          </Button>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="general" className="rounded-lg">Configurações Gerais</TabsTrigger>
            <TabsTrigger value="appearance" className="rounded-lg">Aparência & Landing</TabsTrigger>
            <TabsTrigger value="security" className="rounded-lg">Segurança & Acesso</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4">
            <Card className="p-6 space-y-6 bg-card/50 backdrop-blur-sm border-border/40">
              <div className="flex items-center justify-between border-b border-border/40 pb-4">
                <div className="space-y-0.5">
                  <Label className="text-base font-semibold">Status do Módulo STH AI</Label>
                  <p className="text-sm text-muted-foreground">Habilita ou desabilita globalmente o acesso à inteligência artificial.</p>
                </div>
                <Switch 
                  checked={settings.is_active} 
                  onCheckedChange={(v) => setSettings({...settings, is_active: v})} 
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="model" className="text-xs font-bold uppercase text-muted-foreground">Engine IA (Modelo)</Label>
                  <Input 
                    id="model" 
                    value={settings.model_version} 
                    onChange={(e) => setSettings({...settings, model_version: e.target.value})} 
                    className="bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="domain" className="text-xs font-bold uppercase text-muted-foreground">Domínio de Propagação</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="domain" 
                      value={settings.exclusive_domain} 
                      onChange={(e) => setSettings({...settings, exclusive_domain: e.target.value})} 
                      className="pl-9 bg-background/50"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="mt-4">
            <Card className="p-6 space-y-6 bg-card/50 backdrop-blur-sm border-border/40">
              <div className="flex items-center justify-between border-b border-border/40 pb-4">
                <div className="space-y-0.5">
                  <Label className="text-base font-semibold">Visibilidade no Site Principal</Label>
                  <p className="text-sm text-muted-foreground">Exibir botões e links para o STH AI na landing page sthmethod.com.br.</p>
                </div>
                <Switch 
                  checked={settings.show_on_landing} 
                  onCheckedChange={(v) => setSettings({...settings, show_on_landing: v})} 
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-bold uppercase text-muted-foreground">Doutrina & Regras de Comportamento</Label>
                </div>
                <textarea 
                  className="min-h-[250px] w-full rounded-xl border border-border/40 bg-background/50 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="Defina as diretrizes que a IA deve seguir para todos os usuários..."
                  value={settings.custom_prompt_rules}
                  onChange={(e) => setSettings({...settings, custom_prompt_rules: e.target.value})}
                />
                <p className="text-[11px] text-muted-foreground italic">
                  * Estas regras são propagadas para o site oficial e para o módulo interno.
                </p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-4">
            <Card className="p-6 space-y-6 bg-card/50 backdrop-blur-sm border-border/40">
              <div className="flex items-center justify-between border-b border-border/40 pb-4">
                <div className="space-y-0.5 flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                  <div>
                    <Label className="text-base font-semibold">Paywall de Assinatura</Label>
                    <p className="text-sm text-muted-foreground">Exigir assinatura ativa para liberar recursos avançados da STH AI.</p>
                  </div>
                </div>
                <Switch 
                  checked={settings.require_subscription} 
                  onCheckedChange={(v) => setSettings({...settings, require_subscription: v})} 
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex items-center gap-3">
                  <Zap className="h-5 w-5 text-amber-500" />
                  <div>
                    <Label className="text-base font-semibold">Modo Manutenção</Label>
                    <p className="text-sm text-muted-foreground">Bloqueia o uso público da STH AI para atualizações técnicas.</p>
                  </div>
                </div>
                <Switch 
                  checked={settings.maintenance_mode} 
                  onCheckedChange={(v) => setSettings({...settings, maintenance_mode: v})} 
                />
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
