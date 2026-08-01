import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Sparkles, Loader2, ShieldCheck, Ban } from "lucide-react";

interface Row {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  amount: number | null;
  expires_at: string | null;
  created_at: string;
  provider: string;
  full_name: string | null;
  email: string | null;
}

const PLANS = [
  { value: "free", label: "Free (irrestrito)" },
  { value: "mensal", label: "Mensal (30 dias)" },
  { value: "trimestral", label: "Trimestral (90 dias)" },
  { value: "semestral", label: "Semestral (180 dias)" },
  { value: "anual", label: "Anual (365 dias)" },
];

const invoke = async (payload: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke("ai-app-access", { body: payload });
  if (error) throw new Error(error.message);
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as any;
};

export default function AdminAiAccess() {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("free");
  const [days, setDays] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["ai-app-access"],
    queryFn: async () => (await invoke({ action: "list" })).subscriptions as Row[],
  });

  const grant = useMutation({
    mutationFn: () =>
      invoke({ action: "grant", email, plan, days: days ? Number(days) : undefined }),
    onSuccess: () => {
      toast.success("Acesso liberado no STH METHOD AI");
      setEmail("");
      qc.invalidateQueries({ queryKey: ["ai-app-access"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revoke = useMutation({
    mutationFn: (id: string) => invoke({ action: "revoke", id }),
    onSuccess: () => {
      toast.success("Acesso revogado");
      qc.invalidateQueries({ queryKey: ["ai-app-access"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const fmt = (v: string | null) =>
    !v ? "—" : new Date(v).getFullYear() >= 2099 ? "Vitalício" : new Date(v).toLocaleDateString("pt-BR");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" /> Acessos STH METHOD AI
          </h1>
          <p className="text-sm text-muted-foreground">
            Libere acesso free ou planos do app de IA para alunos já cadastrados na base STH METHOD.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Liberar acesso</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end">
            <div className="space-y-1.5">
              <Label>E-mail do aluno</Label>
              <Input
                type="email"
                placeholder="aluno@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Plano</Label>
              <Select value={plan} onValueChange={setPlan}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLANS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Dias (opcional)</Label>
              <Input
                type="number"
                min={1}
                placeholder="padrão do plano"
                value={days}
                onChange={(e) => setDays(e.target.value)}
              />
            </div>
            <Button onClick={() => grant.mutate()} disabled={!email || grant.isPending}>
              {grant.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              <span className="ml-2">Liberar</span>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assinaturas do app AI</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {isLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Expira</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data ?? []).map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-medium">{r.full_name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{r.email ?? r.user_id.slice(0, 8)}</div>
                      </TableCell>
                      <TableCell className="capitalize">{r.plan}</TableCell>
                      <TableCell>
                        <Badge variant={r.status === "active" ? "default" : "secondary"}>{r.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.provider}</TableCell>
                      <TableCell>{fmt(r.expires_at)}</TableCell>
                      <TableCell className="text-right">
                        {r.status === "active" && (
                          <Button size="sm" variant="ghost" onClick={() => revoke.mutate(r.id)}>
                            <Ban className="h-4 w-4 mr-1" /> Revogar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!data?.length && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Nenhuma assinatura registrada.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
