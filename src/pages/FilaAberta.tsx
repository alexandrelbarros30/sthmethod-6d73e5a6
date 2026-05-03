import { useState } from "react";
import { z } from "zod";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } },
};

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
  const [submittedPhone, setSubmittedPhone] = useState("");

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
      setSubmittedPhone(phoneDigits);
      setDone(true);
    } catch (err: any) {
      toast({ title: "Erro ao entrar na fila", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <header className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-2xl border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6 h-11 flex items-center justify-center">
          <span className="text-[12px] font-semibold tracking-tight">STH METHOD</span>
        </div>
      </header>

      <section className="pt-32 md:pt-40 pb-12 text-center px-6">
        <motion.p initial="hidden" animate="visible" variants={fadeUp} className="text-[12px] font-medium tracking-[0.25em] uppercase text-primary mb-6">
          {done ? "Tudo certo" : "Fila de atendimento"}
        </motion.p>
        <motion.h1 initial="hidden" animate="visible" variants={fadeUp} className="max-w-3xl mx-auto text-4xl sm:text-5xl md:text-7xl font-semibold tracking-[-0.04em] leading-[0.95] text-foreground">
          {done ? <>Você está <br /><span className="text-muted-foreground">na fila, {submittedName}.</span></> : <>Entrar na <br /><span className="text-muted-foreground">fila.</span></>}
        </motion.h1>
      </section>

      <motion.section initial="hidden" animate="visible" variants={fadeUp} className="max-w-md mx-auto px-6 pb-32">
        {done ? (
          <div className="text-center space-y-6">
            <CheckCircle2 className="w-12 h-12 mx-auto text-foreground" />
            <p className="text-base text-foreground leading-relaxed">
              Recebemos seu pedido. Em breve nossa consultoria entra em contato pelo WhatsApp informado.
            </p>
            <p className="text-sm text-muted-foreground">Não é necessário enviar mensagens agora — pode fechar essa tela.</p>
            <a href={`https://wa.me/55${submittedPhone}`} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" className="rounded-full text-[13px]">Voltar ao WhatsApp</Button>
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <p className="text-center text-sm text-muted-foreground font-light mb-6">
              Informe seu nome e WhatsApp. Quando chegar a sua vez, entraremos em contato.
            </p>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[13px] font-medium text-muted-foreground">Nome completo</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" required maxLength={100} className="h-12 rounded-2xl border-border/60 bg-muted/30 px-4 text-base" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-[13px] font-medium text-muted-foreground">WhatsApp (com DDD)</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" required inputMode="tel" maxLength={20} className="h-12 rounded-2xl border-border/60 bg-muted/30 px-4 text-base" />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-12 rounded-full bg-foreground text-background hover:bg-foreground/90 text-[15px] font-medium">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Entrando...</> : "Entrar na fila"}
            </Button>
            <p className="text-[11px] text-muted-foreground/70 text-center leading-relaxed pt-2">
              Ao continuar, você autoriza o contato da consultoria STH METHOD pelo WhatsApp informado.
            </p>
          </form>
        )}
      </motion.section>
    </div>
  );
};

export default FilaAberta;
