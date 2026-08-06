import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Save, Globe, ShieldCheck, Zap, MessageSquare } from "lucide-react";
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
      const { data, error } = await supabase
        .from("platform_settings")
        .select("*")
        .eq("key", "sth_ai_config")
        .single();

      if (error && error.code !== "PGRST116") throw error;
      if (data) setSettings(data.value);
    } catch (error: any) {
      toast.error("Erro ao carregar configurações: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("platform_settings")
        .upsert({
          key: "sth_ai_config",
          value: settings,
          updated_at: new Date().toISOString()
        });

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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" /> Configurações STH AI
          </h1>
          <p className="text-muted-foreground">
            Gerencie como a inteligência artificial se comporta e como ela é exibida no site oficial.
          </p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? "Salvando..." : <><Save className="mr-2 h-4 w-4" /> Salvar Alterações</>}
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="appearance">Aparência</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
        </TabsList>

        <Card className="mt-6 p-6">
          <TabsContent value="general" className="space-y-6 mt-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Módulo STH AI Ativo</Label>
                  <p className="text-sm text-muted-foreground">Habilita ou desabilita globalmente o acesso à IA.</p>
                </div>
                <Switch 
                  checked={settings.is_active} 
                  onCheckedChange={(v) => setSettings({...settings, is_active: v})} 
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="model">Modelo de Linguagem (Engine)</Label>
                <Input 
                  id="model" 
                  value={settings.model_version} 
                  onChange={(e) => setSettings({...settings, model_version: e.target.value})} 
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="domain">URL de Propagação (Landing)</Label>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="domain" 
                    value={settings.exclusive_domain} 
                    onChange={(e) => setSettings({...settings, exclusive_domain: e.target.value})} 
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6 mt-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Exibir na Landing Page</Label>
                  <p className="text-sm text-muted-foreground">Mostrar link para o STH AI no site principal.</p>
                </div>
                <Switch 
                  checked={settings.show_on_landing} 
                  onCheckedChange={(v) => setSettings({...settings, show_on_landing: v})} 
                />
              </div>
              
              <div className="grid gap-2">
                <Label>Prompt Customizado (Doutrina)</Label>
                <textarea 
                  className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Instruções específicas para o comportamento da IA..."
                  value={settings.custom_prompt_rules}
                  onChange={(e) => setSettings({...settings, custom_prompt_rules: e.target.value})}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6 mt-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Exigir Assinatura Ativa</Label>
                  <p className="text-sm text-muted-foreground">Apenas alunos pagantes podem usar a STH AI.</p>
                </div>
                <Switch 
                  checked={settings.require_subscription} 
                  onCheckedChange={(v) => setSettings({...settings, require_subscription: v})} 
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Modo Manutenção</Label>
                  <p className="text-sm text-muted-foreground">Bloqueia o uso temporariamente para ajustes.</p>
                </div>
                <Switch 
                  checked={settings.maintenance_mode} 
                  onCheckedChange={(v) => setSettings({...settings, maintenance_mode: v})} 
                />
              </div>
            </div>
          </TabsContent>
        </Card>
      </Tabs>
    </div>
  );
}
