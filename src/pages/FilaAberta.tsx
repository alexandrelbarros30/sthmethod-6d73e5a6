import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ListOrdered, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";

const schema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(100),
  phone: z.string().trim().min(10, "Informe um WhatsApp válido").max(20),
});

const FilaAberta = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [submittedName, setSubmittedName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneDigits = phone.replace(/\D/g, "");
    const parsed = schema.safeParse({ name, phone: phoneDigits });
    if (!parsed.success) {
      toast({ title: "Verifique os dados", description: parsed.error.errors[0].message, variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("queue_join_requests").insert({
        visitor_name: parsed.data.name,
        visitor_phone: phoneDigits,
        student_name: parsed.data.name,
        status: "waiting",
        source: "public_link",
      });
      if (error) throw error;
      setSubmittedName(parsed.data.name.split(" ")[0]);
      setDone(true);
    } catch (err: any) {
      toast({ title: "Erro ao entrar na fila", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-primary/30 shadow-xl overflow-hidden">
          <CardHeader className="text-center pb-3 bg-gradient-to-b from-primary/10 to-transparent">
            <div className="flex justify-center mb-2">
              {done ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center"
                >
                  <Sparkles className="w-8 h-8 text-emerald-500" />
                </motion.div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
                  <ListOrdered className="w-8 h-8 text-primary" />
                </div>
              )}
            </div>
            <CardTitle className="text-xl font-display">
              {done ? `Você está na fila, ${submittedName}! 🎉` : "Entrar na fila de atendimento"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {done ? (
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary border border-primary/30 text-sm px-3 py-1">
                  <Clock className="w-3.5 h-3.5" /> Aguardando atendimento
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  Recebemos seu pedido. Em breve nossa consultoria entrará em contato pelo WhatsApp informado.
                </p>
                <p className="text-xs text-muted-foreground">
                  <strong>Não é necessário enviar mensagens agora</strong> — pode fechar essa tela tranquilamente.
                </p>
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <Link to="/">
                  <Button variant="ghost" size="sm" className="text-xs">Voltar ao site</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Informe seu nome e WhatsApp. Quando chegar a sua vez, entraremos em contato com você.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    required
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">WhatsApp (com DDD)</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    required
                    inputMode="tel"
                    maxLength={20}
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Entrando...</> : "Entrar na fila"}
                </Button>
                <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                  Ao continuar, você autoriza o contato da consultoria STH METHOD pelo WhatsApp informado.
                </p>
              </form>
            )}
          </CardContent>
        </Card>
        <p className="text-center text-[10px] text-muted-foreground mt-3">
          STH METHOD · Consultoria
        </p>
      </motion.div>
    </div>
  );
};

export default FilaAberta;
