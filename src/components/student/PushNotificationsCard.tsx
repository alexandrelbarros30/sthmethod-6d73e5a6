import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Smartphone } from "lucide-react";
import { toast } from "sonner";
import {
  isPushSupported,
  getCurrentSubscription,
  subscribeCurrentUser,
  unsubscribeCurrentUser,
} from "@/lib/push-notifications";
import { supabase } from "@/integrations/supabase/client";

interface Props { userId: string; }

const PushNotificationsCard = ({ userId }: Props) => {
  const [supported, setSupported] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    (async () => {
      if (!isPushSupported()) { setSupported(false); setLoading(false); return; }
      setPermission(Notification.permission);
      const sub = await getCurrentSubscription();
      setEnabled(!!sub && Notification.permission === "granted");
      setLoading(false);
    })();
  }, []);

  const handleToggle = async (next: boolean) => {
    setLoading(true);
    try {
      if (next) {
        await subscribeCurrentUser(userId);
        setEnabled(true);
        setPermission("granted");
        toast.success("Notificações ativadas neste dispositivo.");
      } else {
        await unsubscribeCurrentUser(userId);
        setEnabled(false);
        toast.success("Notificações desativadas neste dispositivo.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível alterar as notificações.");
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    const { error } = await supabase.functions.invoke("send-push", {
      body: {
        user_id: userId,
        payload: {
          title: "STH METHOD",
          body: "Notificações ativas! Você receberá avisos de dieta, treino, protocolo e mensagens da equipe.",
          url: "/dashboard",
          tag: "sth-test",
        },
      },
    });
    if (error) toast.error("Falha ao enviar teste.");
    else toast.success("Enviado! Verifique a notificação no seu dispositivo.");
  };

  if (!supported) {
    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-display flex items-center gap-2">
            <BellOff className="w-4 h-4 text-muted-foreground" /> Notificações no dispositivo
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          Este navegador/dispositivo não suporta notificações push. No iPhone, adicione o STH METHOD à Tela de Início (Compartilhar → Adicionar à Tela de Início) e abra pelo ícone instalado.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-display flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" /> Notificações no dispositivo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-muted/30 p-3">
          <div className="min-w-0">
            <p className="text-sm font-medium">Receber avisos fora do app</p>
            <p className="text-[11px] text-muted-foreground break-words">
              Dieta, treino, protocolo e mensagens da equipe chegam na tela de bloqueio, mesmo com o app fechado.
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={handleToggle} disabled={loading} />
        </div>

        {permission === "denied" && (
          <p className="text-[11px] text-destructive">
            Permissão bloqueada. Ative nas configurações do navegador/celular e recarregue a página.
          </p>
        )}

        {enabled && (
          <Button type="button" variant="outline" size="sm" className="w-full gap-2" onClick={handleTest}>
            <Smartphone className="w-4 h-4" /> Enviar notificação de teste
          </Button>
        )}

        <p className="text-[11px] text-muted-foreground">
          <b className="text-foreground">iPhone:</b> só funciona com o app adicionado à Tela de Início (PWA).
          <br />
          <b className="text-foreground">Android:</b> funciona no Chrome/Edge ou no app instalado.
        </p>
      </CardContent>
    </Card>
  );
};

export default PushNotificationsCard;