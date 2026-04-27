import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ListOrdered, CheckCircle2, Clock, AlertCircle, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface TokenInfo {
  id: string;
  token: string;
  student_user_id: string;
}

interface Profile {
  full_name: string;
}

interface JoinRequest {
  id: string;
  student_user_id: string;
  status: string;
  joined_at: string;
}

const FilaPublica = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [myRequest, setMyRequest] = useState<JoinRequest | null>(null);
  const [allWaiting, setAllWaiting] = useState<JoinRequest[]>([]);
  const [tick, setTick] = useState(0);

  // 1) Validate token + register if needed
  useEffect(() => {
    if (!token) {
      setError("Link inválido.");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const { data: tk, error: tkErr } = await supabase
          .from("queue_link_tokens")
          .select("id, token, student_user_id")
          .eq("token", token)
          .maybeSingle();

        if (tkErr) throw tkErr;
        if (!tk) {
          setError("Link inválido ou expirado. Entre em contato com a consultoria.");
          setLoading(false);
          return;
        }
        setTokenInfo(tk);

        const { data: prof } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", tk.student_user_id)
          .maybeSingle();
        setProfile(prof || { full_name: "Aluno" });

        // Check if there's already an active (waiting/called) request for this user today
        const sinceISO = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
        const { data: existing } = await supabase
          .from("queue_join_requests")
          .select("id, student_user_id, status, joined_at")
          .eq("student_user_id", tk.student_user_id)
          .in("status", ["waiting", "called"])
          .gte("joined_at", sinceISO)
          .order("joined_at", { ascending: false })
          .limit(1);

        if (existing && existing.length > 0) {
          setMyRequest(existing[0] as JoinRequest);
        } else {
          // Create a new request
          const { data: created, error: insErr } = await supabase
            .from("queue_join_requests")
            .insert({
              student_user_id: tk.student_user_id,
              student_name: prof?.full_name || "Aluno",
              status: "waiting",
              source: "whatsapp_link",
            })
            .select("id, student_user_id, status, joined_at")
            .single();
          if (insErr) throw insErr;
          setMyRequest(created as JoinRequest);
        }
        setLoading(false);
      } catch (e: any) {
        console.error(e);
        setError(e.message || "Erro ao entrar na fila.");
        setLoading(false);
      }
    })();
  }, [token]);

  // 2) Subscribe to all waiting requests to compute position
  useEffect(() => {
    if (!myRequest) return;

    const fetchWaiting = async () => {
      const { data } = await supabase
        .from("queue_join_requests")
        .select("id, student_user_id, status, joined_at")
        .in("status", ["waiting", "called"])
        .order("joined_at", { ascending: true });
      setAllWaiting((data || []) as JoinRequest[]);
    };

    fetchWaiting();

    const channel = supabase
      .channel("public-fila-status")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "queue_join_requests" },
        () => fetchWaiting(),
      )
      .subscribe();

    // Also poll every 30s as fallback and to refresh "self" status
    const poll = setInterval(async () => {
      setTick((t) => t + 1);
      const { data: mine } = await supabase
        .from("queue_join_requests")
        .select("id, student_user_id, status, joined_at")
        .eq("id", myRequest.id)
        .maybeSingle();
      if (mine) setMyRequest(mine as JoinRequest);
      fetchWaiting();
    }, 30_000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [myRequest?.id]);

  // Refresh self status when realtime fires
  useEffect(() => {
    if (!myRequest) return;
    const updated = allWaiting.find((r) => r.id === myRequest.id);
    if (updated && updated.status !== myRequest.status) {
      setMyRequest(updated);
    }
  }, [allWaiting, myRequest]);

  const isCalled = myRequest?.status === "called";

  const firstName = useMemo(() => {
    return (profile?.full_name || "Aluno").split(" ")[0];
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          Entrando na fila...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" /> Não foi possível entrar na fila
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{error}</p>
            <Link to="/">
              <Button variant="outline" className="w-full">Voltar para o início</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              {isCalled ? (
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
              {isCalled ? `É a sua vez, ${firstName}! 🎉` : `Olá, ${firstName}!`}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-center">
            {isCalled ? (
              <>
                <div className="space-y-2">
                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-sm px-3 py-1">
                    Atendimento liberado
                  </Badge>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Nossa consultoria está pronta para iniciar seu atendimento.
                    <br />
                    Aguarde o contato no WhatsApp em instantes.
                  </p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-sm px-3 py-1">
                    <Clock className="w-3.5 h-3.5 mr-1.5" /> Aguardando atendimento
                  </Badge>
                  <p className="text-sm text-foreground leading-relaxed">
                    Você está na nossa fila de atendimento.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Assim que chegar a sua vez, você receberá nosso contato no WhatsApp para seguir com o atendimento. <strong>Não é necessário enviar mensagens agora</strong> — pode fechar essa tela tranquilamente.
                  </p>
                </div>
                <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-xs text-muted-foreground">
                  Você entrou na fila em{" "}
                  <strong className="text-foreground">
                    {new Date(myRequest!.joined_at).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </strong>
                </div>
              </>
            )}
            <div className="pt-2">
              <Link to="/">
                <Button variant="ghost" size="sm" className="text-xs">
                  Voltar ao site
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        <p className="text-center text-[10px] text-muted-foreground mt-3">
          STH METHOD · Consultoria
        </p>
      </motion.div>
    </div>
  );
};

export default FilaPublica;
