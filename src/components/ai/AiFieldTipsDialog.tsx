import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { HelpCircle, Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";
import type { AiKind } from "@/hooks/useAiApp";

type Tips = {
  title: string;
  intro: string;
  items: string[];
  example: string;
  warn: string;
};

const TIPS: Record<AiKind, Tips> = {
  diet: {
    title: "Como descrever para o seu cardápio",
    intro:
      "Quanto mais detalhes você informar aqui, mais preciso e realista fica o cardápio. A IA usa o seu cadastro, mas só você sabe da sua rotina real.",
    items: [
      "Alimentos que você NÃO gosta ou não tolera (lactose, glúten, ovo, peixe...)",
      "Horários reais das refeições e onde você come (casa, trabalho, rua)",
      "Quem cozinha, tempo de preparo disponível e se leva marmita",
      "Orçamento e alimentos que você já tem em casa",
      "Suplementos que já utiliza e horários",
      "Dias diferentes (treino x descanso, fim de semana, plantão)",
    ],
    example:
      "Ex.: \"Não como peixe, treino 19h, jantar depois das 21h. Levo marmita para o trabalho. Tenho whey e creatina. Domingo é refeição livre em família.\"",
    warn: "Não peça dose ou alteração de medicamento aqui — isso é tratado no acompanhamento clínico.",
  },
  workout: {
    title: "Como descrever para o seu treino",
    intro:
      "Detalhe o seu contexto de treino. Isso define volume, escolha de exercícios e progressão adequados a você.",
    items: [
      "Onde treina (academia completa, condomínio, casa) e equipamentos disponíveis",
      "Quantos dias por semana e tempo por sessão",
      "Lesões, dores, limitações articulares ou cirurgias",
      "Exercícios que você ama e os que quer evitar",
      "Nível de experiência e cargas atuais nos principais movimentos",
      "Prioridade estética/performance (ex.: glúteo, dorsal, condicionamento)",
    ],
    example:
      "Ex.: \"Academia completa, 5x por semana, 60 min. Dor no ombro direito no supino reto. Prioridade em costas e glúteo. Agachamento livre 80kg.\"",
    warn: "Descreva dores/lesões com honestidade — a IA adapta os padrões de movimento com base nisso.",
  },
  analysis: {
    title: "Como descrever para a sua análise",
    intro:
      "A análise fica muito mais assertiva quando você contextualiza os exames anexados com o seu momento atual.",
    items: [
      "Data da coleta e se estava em jejum",
      "Sintomas atuais (sono, libido, energia, digestão, humor)",
      "Comorbidades e medicamentos/suplementos em uso",
      "Protocolo ou fase em que se encontra",
      "Histórico familiar relevante e exames anteriores",
      "Dúvidas específicas que quer ver respondidas no parecer",
    ],
    example:
      "Ex.: \"Coleta em jejum de 12h no dia 20/07. Sono ruim e cansaço à tarde. Uso losartana. Quero entender ferritina e vitamina D.\"",
    warn: "A leitura é educativa e não substitui a avaliação do seu médico.",
  },
};

export default function AiFieldTipsDialog({ kind, autoKey }: { kind: AiKind; autoKey?: string }) {
  const [open, setOpen] = useState(false);
  const tips = TIPS[kind];
  const storageKey = `sthai_tips_seen_${autoKey ?? kind}`;

  useEffect(() => {
    try {
      if (!localStorage.getItem(storageKey)) setOpen(true);
    } catch {
      /* noop */
    }
  }, [storageKey]);

  function close() {
    setOpen(false);
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      /* noop */
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 gap-1.5 px-2 text-xs text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <HelpCircle className="h-4 w-4" /> Como escrever aqui?
      </Button>

      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : close())}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-left">
              <Sparkles className="h-5 w-5 text-primary" />
              {tips.title}
            </DialogTitle>
            <DialogDescription className="text-left">{tips.intro}</DialogDescription>
          </DialogHeader>

          <ul className="space-y-2">
            {tips.items.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs italic text-muted-foreground">
            {tips.example}
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{tips.warn}</span>
          </div>

          <DialogFooter>
            <Button className="w-full" onClick={close}>
              Entendi, vou detalhar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
