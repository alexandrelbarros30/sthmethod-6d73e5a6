import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Home, ShieldCheck, Loader2, Copy, MessageCircle, Instagram, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

type Sex = "masculino" | "feminino";
type Status = "pretendo" | "usando" | "parei" | "continuo";
type Priority = "Essencial" | "Recomendado" | "Avançado";
type Timing = "Baseline" | "4-8 semanas" | "Monitoramento" | "Pós-ciclo";

type Marker = {
  category: string;
  name: string;
  why: string;
  priority: Priority;
  timing: Timing;
};

const COMPOUNDS = [
  "Testosterona",
  "Nandrolona",
  "Trembolona",
  "Boldenona",
  "Masteron",
  "Primobolan",
  "Oxandrolona",
  "Stanozolol",
  "Dianabol",
  "Hemogenin",
  "Gestrinona",
  "Proviron",
  "Turinabol",
  "GH",
  "Insulina",
  "Clembuterol",
  "T3 / T4",
  "Diuréticos",
  "Inibidor de aromatase",
  "Cabergolina",
];

const PEPTIDES = [
  "Tirzepatide",
  "Semaglutide",
  "Retatrutide",
  "CJC-1295",
  "Ipamorelin",
  "MK-677",
  "BPC-157",
  "TB-500",
  "Epitalon",
  "Selank",
  "Semax",
  "Tesamorelin",
  "HCG",
  "Kisspeptin",
  "GHK-Cu",
  "Glow",
  "Glow Blend",
  "KPV",
  "AOD-9604",
  "MOTS-c",
  "SS-31",
  "IGF-1 LR3",
  "PEG-MGF",
  "Hexarelin",
  "GHRP-2",
  "GHRP-6",
  "DSIP",
  "Thymosin Alpha-1",
  "Melanotan II",
  "PT-141 (Bremelanotide)",
  "FOXO4-DRI",
  "Pinealon",
  "Vesugen",
  "Cardiogen",
  "Cortexin",
  "LL-37",
  "SLU-PP-332",
];

const ORAIS_17AA = new Set([
  "Oxandrolona",
  "Stanozolol",
  "Dianabol",
  "Hemogenin",
  "Turinabol",
]);
const AGRESSIVOS = new Set(["Trembolona", "Nandrolona", "Boldenona"]);
const GH_INSULINA = new Set(["GH", "Insulina"]);
const AI_CABER = new Set(["Inibidor de aromatase", "Cabergolina"]);

const RISK_HISTORY = [
  "Infarto / AVC / trombose (familiar)",
  "Morte súbita na família",
  "Colesterol alto",
  "Diabetes / resistência à insulina",
  "Esteatose hepática",
  "Doença renal",
  "Apneia do sono",
  "Tabagismo",
  "Uso frequente de álcool",
];

const SYMPTOMS = [
  "Falta de ar",
  "Dor no peito",
  "Palpitações",
  "Pressão alta",
  "Edema (inchaço)",
  "Queda de libido",
  "Acne",
  "Queda capilar",
  "Irritabilidade",
  "Insônia",
  "Cansaço extremo",
];

const phoneSchema = z
  .string()
  .trim()
  .min(10, "WhatsApp inválido")
  .max(20, "WhatsApp inválido")
  .regex(/^[\d\s()+\-]+$/, "Use apenas números");

const nameSchema = z.string().trim().min(2, "Informe seu nome").max(120);
const emailSchema = z.string().trim().email("E-mail inválido").max(200).optional().or(z.literal(""));

function buildMarkers(input: {
  sex: Sex;
  status: Status;
  compounds: string[];
  risk: string[];
}): Marker[] {
  const { sex, status, compounds, risk } = input;
  const list: Marker[] = [];
  const add = (m: Marker) => {
    const existing = list.find((x) => x.name === m.name);
    if (!existing) list.push(m);
    else if (
      (m.priority === "Essencial" && existing.priority !== "Essencial") ||
      (m.priority === "Recomendado" && existing.priority === "Avançado")
    ) {
      existing.priority = m.priority;
    }
  };

  const usesOral = compounds.some((c) => ORAIS_17AA.has(c));
  const usesAggressive = compounds.some((c) => AGRESSIVOS.has(c));
  const usesGhIns = compounds.some((c) => GH_INSULINA.has(c));
  const usesTest = compounds.includes("Testosterona");
  const cvRisk = risk.some((r) =>
    /(infarto|avc|trombose|morte|colesterol|diabetes|apneia|tabagismo)/i.test(r),
  );
  const renalRisk = risk.includes("Doença renal");

  add({ category: "Hormonal", name: "Testosterona Total", why: "Avalia eixo androgênico e supressão.", priority: "Essencial", timing: "Baseline" });
  add({ category: "Hormonal", name: "Testosterona Livre", why: "Fração biodisponível, mais correlacionada aos sintomas.", priority: "Essencial", timing: "Baseline" });
  add({ category: "Hormonal", name: "SHBG", why: "Modula T livre — chave em uso de orais e ciclos.", priority: "Essencial", timing: "Baseline" });
  add({ category: "Hormonal", name: "Estradiol ultrasensível", why: "Aromatização, retenção, libido e humor.", priority: "Essencial", timing: "4-8 semanas" });
  add({ category: "Hormonal", name: "LH", why: "Status do eixo HPT — supressão e recuperação.", priority: "Recomendado", timing: "Baseline" });
  add({ category: "Hormonal", name: "FSH", why: "Função gonadal e fertilidade.", priority: "Recomendado", timing: "Baseline" });
  add({ category: "Hormonal", name: "Prolactina", why: "Compostos progestagênicos elevam o risco.", priority: "Recomendado", timing: "4-8 semanas" });
  add({ category: "Hormonal", name: "DHT", why: "Andrógeno potente — queda capilar, próstata, virilização.", priority: "Recomendado", timing: "Baseline" });
  add({ category: "Hormonal", name: "Cortisol", why: "Estresse adrenal, recuperação, libido.", priority: "Recomendado", timing: "Monitoramento" });
  add({ category: "Hormonal", name: "TSH", why: "Tireoide impacta metabolismo e composição.", priority: "Recomendado", timing: "Baseline" });
  add({ category: "Hormonal", name: "T4 Livre", why: "Função tireoidiana periférica.", priority: "Recomendado", timing: "Baseline" });
  add({ category: "Hormonal", name: "T3 Livre", why: "Atividade tireoidiana ativa.", priority: "Recomendado", timing: "Baseline" });

  add({ category: "Hematológico", name: "Hemograma completo", why: "Eritrocitose induzida por andrógenos.", priority: "Essencial", timing: "4-8 semanas" });
  add({ category: "Hematológico", name: "Hemoglobina", why: "Viscosidade sanguínea e risco trombótico.", priority: "Essencial", timing: "4-8 semanas" });
  add({ category: "Hematológico", name: "Hematócrito", why: "Limite de segurança <52%.", priority: "Essencial", timing: "4-8 semanas" });
  add({ category: "Hematológico", name: "Plaquetas", why: "Coagulação e função medular.", priority: "Recomendado", timing: "4-8 semanas" });

  add({ category: "Cardiovascular", name: "Colesterol Total", why: "Perfil lipídico geral.", priority: "Essencial", timing: "Baseline" });
  add({ category: "Cardiovascular", name: "HDL", why: "Andrógenos reduzem HDL agressivamente.", priority: "Essencial", timing: "4-8 semanas" });
  add({ category: "Cardiovascular", name: "LDL", why: "Aterogênese e risco cardiovascular.", priority: "Essencial", timing: "4-8 semanas" });
  add({ category: "Cardiovascular", name: "Não-HDL", why: "Soma de partículas aterogênicas.", priority: "Recomendado", timing: "4-8 semanas" });
  add({ category: "Cardiovascular", name: "Triglicerídeos", why: "Sensibilidade insulínica e dieta.", priority: "Essencial", timing: "Baseline" });
  add({ category: "Cardiovascular", name: "ApoB", why: "Melhor marcador de partículas aterogênicas.", priority: "Recomendado", timing: "Baseline" });
  add({ category: "Cardiovascular", name: "ApoA1", why: "Proteína do HDL — função protetora.", priority: "Avançado", timing: "Baseline" });
  add({ category: "Cardiovascular", name: "Lipoproteína(a)", why: "Risco genético independente.", priority: "Avançado", timing: "Baseline" });
  add({ category: "Cardiovascular", name: "PCR ultrassensível", why: "Inflamação sistêmica subclínica.", priority: "Recomendado", timing: "Monitoramento" });
  add({ category: "Cardiovascular", name: "Homocisteína", why: "Risco vascular e endotelial.", priority: "Avançado", timing: "Baseline" });

  add({ category: "Metabólico", name: "Glicemia de jejum", why: "Triagem básica do metabolismo glicêmico.", priority: "Essencial", timing: "Baseline" });
  add({ category: "Metabólico", name: "Insulina de jejum", why: "Resistência insulínica precoce.", priority: "Recomendado", timing: "Baseline" });
  add({ category: "Metabólico", name: "Hemoglobina glicada (HbA1c)", why: "Média glicêmica de 3 meses.", priority: "Recomendado", timing: "Monitoramento" });

  add({ category: "Hepático", name: "AST/TGO", why: "Pode subir com treino e orais.", priority: "Recomendado", timing: "4-8 semanas" });
  add({ category: "Hepático", name: "ALT/TGP", why: "Mais específico hepático.", priority: "Recomendado", timing: "4-8 semanas" });
  add({ category: "Hepático", name: "GGT", why: "Colestase e estresse hepático.", priority: "Recomendado", timing: "4-8 semanas" });
  add({ category: "Hepático", name: "Fosfatase alcalina", why: "Vias biliares e metabolismo ósseo.", priority: "Recomendado", timing: "4-8 semanas" });
  add({ category: "Hepático", name: "Bilirrubinas", why: "Função hepatobiliar.", priority: "Recomendado", timing: "4-8 semanas" });
  add({ category: "Hepático", name: "Albumina", why: "Síntese hepática e estado nutricional.", priority: "Recomendado", timing: "Baseline" });

  add({ category: "Renal / Filtração", name: "Creatinina", why: "Pode estar elevada por massa magra.", priority: "Essencial", timing: "Baseline" });
  add({ category: "Renal / Filtração", name: "Ureia", why: "Carga proteica e função renal.", priority: "Recomendado", timing: "Baseline" });
  add({ category: "Renal / Filtração", name: "Cistatina C", why: "Filtração glomerular real, independente da massa muscular.", priority: "Recomendado", timing: "Baseline" });
  add({ category: "Renal / Filtração", name: "eGFR / TFG estimada", why: "Função renal global.", priority: "Recomendado", timing: "Baseline" });
  add({ category: "Renal / Filtração", name: "Urina tipo 1", why: "Triagem de proteinúria e infecção.", priority: "Recomendado", timing: "Baseline" });
  add({ category: "Renal / Filtração", name: "Relação albumina/creatinina urinária", why: "Lesão renal precoce.", priority: "Recomendado", timing: "Monitoramento" });

  add({ category: "Eletrólitos", name: "Sódio", why: "Retenção hídrica e pressão arterial.", priority: "Recomendado", timing: "Baseline" });
  add({ category: "Eletrólitos", name: "Potássio", why: "Equilíbrio elétrico cardíaco.", priority: "Recomendado", timing: "Baseline" });
  add({ category: "Eletrólitos", name: "Magnésio", why: "Cofator enzimático e função muscular/cardíaca.", priority: "Recomendado", timing: "Baseline" });

  const bump = (names: string[], to: Priority) => {
    names.forEach((n) => {
      const m = list.find((x) => x.name === n);
      if (m) m.priority = to;
    });
  };

  if (sex === "masculino" && usesTest) {
    bump(["Hemograma completo", "Hematócrito", "Estradiol ultrasensível", "ApoB", "LDL", "Creatinina"], "Essencial");
  }
  if (sex === "feminino") {
    bump(["Testosterona Total", "Testosterona Livre", "SHBG", "DHT", "Estradiol ultrasensível", "LH", "FSH", "Prolactina"], "Essencial");
    add({ category: "Sinais clínicos", name: "Avaliação de virilização", why: "Voz, clitomegalia, hirsutismo — exige avaliação médica.", priority: "Essencial", timing: "Monitoramento" });
  }
  if (usesOral) {
    bump(["AST/TGO", "ALT/TGP", "GGT", "Fosfatase alcalina", "Bilirrubinas", "HDL", "LDL", "ApoB", "Colesterol Total"], "Essencial");
  }
  if (usesAggressive) {
    bump(["Prolactina", "Estradiol ultrasensível", "Hemograma completo", "Hematócrito", "ApoB", "PCR ultrassensível", "Creatinina", "Cistatina C"], "Essencial");
  }
  if (usesGhIns) {
    bump(["Glicemia de jejum", "Insulina de jejum", "Hemoglobina glicada (HbA1c)", "Triglicerídeos"], "Essencial");
    add({ category: "Metabólico", name: "IGF-1", why: "Marcador de exposição a GH.", priority: "Essencial", timing: "4-8 semanas" });
  }
  if (cvRisk) {
    bump(["ApoB", "Lipoproteína(a)", "PCR ultrassensível", "Homocisteína", "Hemograma completo"], "Essencial");
    add({ category: "Cardiovascular", name: "ECG de repouso", why: "Triagem elétrica cardíaca.", priority: "Essencial", timing: "Baseline" });
    add({ category: "Cardiovascular", name: "Ecocardiograma", why: "Estrutura e função cardíaca.", priority: "Essencial", timing: "Baseline" });
  }
  if (renalRisk || status === "continuo") {
    bump(["Cistatina C", "eGFR / TFG estimada", "Urina tipo 1", "Relação albumina/creatinina urinária"], "Essencial");
  }
  if (status === "parei") {
    add({ category: "Hormonal", name: "Reavaliação eixo HPT pós-ciclo", why: "LH, FSH, Testo total/livre, SHBG, E2 entre 4 e 8 semanas após o fim.", priority: "Essencial", timing: "Pós-ciclo" });
  }

  const order: Record<Priority, number> = { Essencial: 0, Recomendado: 1, Avançado: 2 };
  return list.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return order[a.priority] - order[b.priority];
  });
}

const PRIORITY_STYLE: Record<Priority, string> = {
  Essencial: "bg-[hsl(var(--primary))]/15 text-[hsl(var(--primary))] border-[hsl(var(--primary))]/30",
  Recomendado: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  Avançado: "bg-muted text-muted-foreground border-border/60",
};

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase mb-3">{children}</p>
);

const Choice = ({
  selected,
  onClick,
  title,
  desc,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  desc?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`text-left w-full px-5 py-4 rounded-2xl border transition-all ${
      selected
        ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10"
        : "border-border/60 hover:border-border bg-card/40"
    }`}
  >
    <p className="text-foreground font-medium">{title}</p>
    {desc && <p className="text-[13px] text-muted-foreground font-light mt-1">{desc}</p>}
  </button>
);

const Chip = ({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-sm border transition-all ${
      selected
        ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/15 text-foreground"
        : "border-border/60 bg-card/30 text-muted-foreground hover:text-foreground"
    }`}
  >
    {children}
  </button>
);

const StepLead = ({ fullName, setFullName, whatsapp, setWhatsapp, email, setEmail }: {
  fullName: string; setFullName: (v: string) => void;
  whatsapp: string; setWhatsapp: (v: string) => void;
  email: string; setEmail: (v: string) => void;
}) => (
  <div>
    <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">Antes de começar</h2>
    <p className="text-muted-foreground font-light mb-8">
      Precisamos saber como te chamar e como retornar com os próximos passos.
    </p>
    <div className="space-y-5">
      <div>
        <Label htmlFor="name" className="text-sm font-medium">Nome completo</Label>
        <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-2 h-12 rounded-xl" maxLength={120} />
      </div>
      <div>
        <Label htmlFor="wa" className="text-sm font-medium">WhatsApp (com DDD)</Label>
        <Input id="wa" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="mt-2 h-12 rounded-xl" placeholder="(21) 99999-0000" maxLength={20} />
      </div>
      <div>
        <Label htmlFor="em" className="text-sm font-medium">E-mail <span className="text-muted-foreground font-light">(opcional)</span></Label>
        <Input id="em" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 h-12 rounded-xl" type="email" maxLength={200} />
      </div>
    </div>
  </div>
);

const StepSexStatus = ({ sex, setSex, status, setStatus }: {
  sex: Sex | ""; setSex: (s: Sex) => void;
  status: Status | ""; setStatus: (s: Status) => void;
}) => (
  <div>
    <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">Sobre você</h2>
    <p className="text-muted-foreground font-light mb-8">Sexo biológico e situação atual com hormônios.</p>

    <FieldLabel>Sexo biológico</FieldLabel>
    <div className="grid grid-cols-2 gap-3 mb-8">
      <Choice selected={sex === "masculino"} onClick={() => setSex("masculino")} title="Masculino" />
      <Choice selected={sex === "feminino"} onClick={() => setSex("feminino")} title="Feminino" />
    </div>

    <FieldLabel>Situação atual</FieldLabel>
    <div className="grid gap-3">
      <Choice selected={status === "pretendo"} onClick={() => setStatus("pretendo")} title="Nunca usei, mas pretendo usar" />
      <Choice selected={status === "usando"} onClick={() => setStatus("usando")} title="Estou usando atualmente" />
      <Choice selected={status === "parei"} onClick={() => setStatus("parei")} title="Já usei e parei" />
      <Choice selected={status === "continuo"} onClick={() => setStatus("continuo")} title="Uso contínuo / TRT / cruise / blast and cruise" />
    </div>
  </div>
);

const StepCompounds = ({
  status, duration, setDuration, compounds, setCompounds, weeklyDose, setWeeklyDose, followup, setFollowup, toggle,
}: {
  status: Status; duration: string; setDuration: (v: string) => void;
  compounds: string[]; setCompounds: (v: string[]) => void;
  weeklyDose: string; setWeeklyDose: (v: string) => void;
  followup: "sim" | "nao" | ""; setFollowup: (v: "sim" | "nao") => void;
  toggle: (arr: string[], v: string, set: (x: string[]) => void) => void;
}) => {
  const skip = status === "pretendo";
  return (
    <div>
      <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">Compostos e contexto</h2>
      <p className="text-muted-foreground font-light mb-8">
        {skip
          ? "Como você ainda não usa, vamos pular detalhes de ciclo. Marque apenas se houver algo planejado."
          : "Marque tudo que usa ou usou. Quanto mais preciso, melhor a sugestão."}
      </p>

      <FieldLabel>Hormônios / anabolizantes</FieldLabel>
      <div className="flex flex-wrap gap-2 mb-8">
        {COMPOUNDS.map((c) => (
          <Chip key={c} selected={compounds.includes(c)} onClick={() => toggle(compounds, c, setCompounds)}>
            {c}
          </Chip>
        ))}
      </div>

      {!skip && (
        <>
          <div className="grid gap-5 mb-8">
            <div>
              <Label className="text-sm font-medium">Há quanto tempo usa ou usou?</Label>
              <Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Ex.: 6 meses, 3 anos" className="mt-2 h-12 rounded-xl" maxLength={80} />
            </div>
            <div>
              <Label className="text-sm font-medium">Dose semanal aproximada</Label>
              <Input value={weeklyDose} onChange={(e) => setWeeklyDose(e.target.value)} placeholder="Ex.: Testo 250mg + Deca 200mg" className="mt-2 h-12 rounded-xl" maxLength={200} />
            </div>
          </div>

          <FieldLabel>Tem acompanhamento médico?</FieldLabel>
          <div className="grid grid-cols-2 gap-3">
            <Choice selected={followup === "sim"} onClick={() => setFollowup("sim")} title="Sim" />
            <Choice selected={followup === "nao"} onClick={() => setFollowup("nao")} title="Não" />
          </div>
        </>
      )}
    </div>
  );
};

const StepBio = ({
  age, setAge, weight, setWeight, height, setHeight, bf, setBf, pressure, setPressure,
}: {
  age: string; setAge: (v: string) => void;
  weight: string; setWeight: (v: string) => void;
  height: string; setHeight: (v: string) => void;
  bf: string; setBf: (v: string) => void;
  pressure: string; setPressure: (v: string) => void;
}) => (
  <div>
    <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">Dados clínicos</h2>
    <p className="text-muted-foreground font-light mb-8">Tudo opcional, mas ajuda a refinar prioridades.</p>
    <div className="grid sm:grid-cols-2 gap-5">
      <div><Label className="text-sm">Idade</Label><Input value={age} onChange={(e) => setAge(e.target.value)} className="mt-2 h-12 rounded-xl" inputMode="numeric" maxLength={3} /></div>
      <div><Label className="text-sm">Peso (kg)</Label><Input value={weight} onChange={(e) => setWeight(e.target.value)} className="mt-2 h-12 rounded-xl" inputMode="decimal" maxLength={6} /></div>
      <div><Label className="text-sm">Altura (cm)</Label><Input value={height} onChange={(e) => setHeight(e.target.value)} className="mt-2 h-12 rounded-xl" inputMode="numeric" maxLength={3} /></div>
      <div><Label className="text-sm">% Gordura estimada</Label><Input value={bf} onChange={(e) => setBf(e.target.value)} className="mt-2 h-12 rounded-xl" inputMode="decimal" maxLength={5} /></div>
      <div className="sm:col-span-2"><Label className="text-sm">Pressão arterial atual</Label><Input value={pressure} onChange={(e) => setPressure(e.target.value)} className="mt-2 h-12 rounded-xl" placeholder="Ex.: 120/80" maxLength={20} /></div>
    </div>
  </div>
);

const StepRisk = ({
  risk, setRisk, symptoms, setSymptoms, notes, setNotes, toggle,
}: {
  risk: string[]; setRisk: (v: string[]) => void;
  symptoms: string[]; setSymptoms: (v: string[]) => void;
  notes: string; setNotes: (v: string) => void;
  toggle: (arr: string[], v: string, set: (x: string[]) => void) => void;
}) => (
  <div>
    <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">Histórico e sintomas</h2>
    <p className="text-muted-foreground font-light mb-8">Marque tudo que se aplica.</p>

    <FieldLabel>Histórico / fatores de risco</FieldLabel>
    <div className="flex flex-wrap gap-2 mb-8">
      {RISK_HISTORY.map((r) => (
        <Chip key={r} selected={risk.includes(r)} onClick={() => toggle(risk, r, setRisk)}>{r}</Chip>
      ))}
    </div>

    <FieldLabel>Sintomas atuais</FieldLabel>
    <div className="flex flex-wrap gap-2 mb-8">
      {SYMPTOMS.map((s) => (
        <Chip key={s} selected={symptoms.includes(s)} onClick={() => toggle(symptoms, s, setSymptoms)}>{s}</Chip>
      ))}
    </div>

    <Label className="text-sm">Observações adicionais (opcional)</Label>
    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} className="mt-2 rounded-xl min-h-[100px]" placeholder="Algo relevante para o time STH METHOD considerar?" />
  </div>
);

const ReviewRow = ({ k, v }: { k: string; v: string }) => (
  <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 py-3 border-t border-border/40">
    <p className="text-[11px] tracking-[0.18em] uppercase text-muted-foreground sm:w-32 shrink-0">{k}</p>
    <p className="text-foreground font-light">{v}</p>
  </div>
);

const StepReview = ({
  fullName, whatsapp, sex, status, compounds, risk, symptoms, essentialCount, totalMarkers,
}: {
  fullName: string; whatsapp: string;
  sex: string; status: string;
  compounds: string[]; risk: string[]; symptoms: string[];
  essentialCount: number; totalMarkers: number;
}) => (
  <div>
    <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">Revise antes de gerar</h2>
    <p className="text-muted-foreground font-light mb-8">Vamos calcular {totalMarkers} marcadores ({essentialCount} essenciais).</p>
    <div className="grid gap-4 text-sm">
      <ReviewRow k="Nome" v={fullName} />
      <ReviewRow k="WhatsApp" v={whatsapp} />
      <ReviewRow k="Sexo" v={sex || "—"} />
      <ReviewRow k="Situação" v={status || "—"} />
      <ReviewRow k="Compostos" v={compounds.length ? compounds.join(", ") : "Nenhum"} />
      <ReviewRow k="Histórico" v={risk.length ? risk.join(", ") : "Nenhum"} />
      <ReviewRow k="Sintomas" v={symptoms.length ? symptoms.join(", ") : "Nenhum"} />
    </div>
  </div>
);

const StepResult = ({ markers, fullName }: { markers: Marker[]; fullName: string }) => {
  const grouped = markers.reduce<Record<string, Marker[]>>((acc, m) => {
    (acc[m.category] ||= []).push(m);
    return acc;
  }, {});

  const shareText = useMemo(() => {
    const firstName = fullName.split(" ")[0] || "";
    const lines: string[] = [];
    lines.push("━━━━━━━━━━━━━━━━━━━━");
    lines.push("🧬 STH METHOD");
    lines.push("Triagem de Marcadores Laboratoriais");
    lines.push("━━━━━━━━━━━━━━━━━━━━");
    lines.push("");
    lines.push(`${firstName ? firstName + ", s" : "S"}ua tabela personalizada de exames sugeridos`);
    lines.push(`${markers.length} marcadores · foco em segurança e performance`);
    lines.push("");
    lines.push("Legenda:");
    lines.push("🔴 Essencial  ·  🟡 Recomendado  ·  ⚪ Avançado");
    lines.push("");
    Object.entries(grouped).forEach(([cat, items]) => {
      lines.push(`▸ ${cat.toUpperCase()}`);
      items.forEach((m) => {
        const tag =
          m.priority === "Essencial" ? "🔴" : m.priority === "Recomendado" ? "🟡" : "⚪";
        lines.push(`${tag} ${m.name} (${m.timing})`);
      });
      lines.push("");
    });
    lines.push("━━━━━━━━━━━━━━━━━━━━");
    lines.push("⚠️ Esta triagem não substitui consulta médica.");
    lines.push("Leve esta lista ao seu médico para avaliação individualizada.");
    lines.push("");
    lines.push("Gerado em sthmethod.com.br/triagem-marcadores");
    lines.push("STH METHOD · Performance, saúde e estratégia.");
    return lines.join("\n");
  }, [markers, fullName, grouped]);

  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      toast.success("Texto copiado! Cole no WhatsApp, Instagram ou onde quiser.");
    } catch {
      toast.error("Não foi possível copiar. Selecione o texto manualmente.");
    }
  };

  const waHref = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <div>
      <p className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase mb-4">Triagem concluída</p>
      <h2 className="text-3xl md:text-5xl font-semibold tracking-tight leading-[1.05] mb-4">
        {fullName.split(" ")[0]}, sua tabela personalizada
      </h2>
      <p className="text-[17px] leading-[1.6] text-muted-foreground font-light mb-10">
        {markers.length} marcadores sugeridos. Leve essa lista ao seu médico para avaliação individualizada.
      </p>

      <div className="rounded-2xl border border-border/60 bg-card/40 p-5 mb-10">
        <p className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase mb-3">Legenda</p>
        <ul className="grid sm:grid-cols-3 gap-2 text-[14px] text-foreground/90 font-light">
          <li className="flex items-center gap-2"><span className="text-base leading-none">🔴</span> Essencial</li>
          <li className="flex items-center gap-2"><span className="text-base leading-none">🟡</span> Recomendado</li>
          <li className="flex items-center gap-2"><span className="text-base leading-none">⚪</span> Avançado</li>
        </ul>
      </div>

      {Object.entries(grouped).map(([cat, items]) => (
        <section key={cat} className="mb-10">
          <h3 className="text-xs font-medium tracking-[0.2em] uppercase text-[hsl(var(--primary))] mb-4">{cat}</h3>
          <div className="rounded-2xl border border-border/60 overflow-hidden">
            {items.map((m, i) => (
              <div key={m.name} className={`p-5 ${i > 0 ? "border-t border-border/40" : ""}`}>
                <div className="flex items-start justify-between gap-3 mb-1">
                  <p className="font-medium text-foreground flex items-center gap-2">
                    <span className="text-base leading-none" aria-label={m.priority}>
                      {m.priority === "Essencial" ? "🔴" : m.priority === "Recomendado" ? "🟡" : "⚪"}
                    </span>
                    {m.name}
                  </p>
                </div>
                <p className="text-[14px] text-muted-foreground font-light leading-[1.55]">{m.why}</p>
                <p className="text-[11px] tracking-[0.15em] uppercase text-muted-foreground/70 mt-2">Momento: {m.timing}</p>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="mt-12 print:hidden">
        <p className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase mb-4">
          Compartilhar
        </p>
        <h3 className="text-2xl font-semibold tracking-tight mb-2">
          Leve sua tabela para qualquer lugar
        </h3>
        <p className="text-[15px] text-muted-foreground font-light mb-6 leading-[1.6]">
          Copie o texto formatado abaixo e cole no WhatsApp do seu médico, no Instagram ou em qualquer rede.
        </p>

        <div className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 bg-background/40">
            <span className="text-[11px] tracking-[0.18em] uppercase text-muted-foreground">
              Texto pronto para colar
            </span>
            <Button size="sm" variant="ghost" onClick={copyShare} className="h-8 rounded-full text-xs">
              <Copy className="w-3.5 h-3.5 mr-1.5" /> Copiar
            </Button>
          </div>
          <pre className="px-5 py-4 text-[12px] leading-[1.55] text-foreground/90 font-mono whitespace-pre-wrap max-h-80 overflow-auto">
{shareText}
          </pre>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-5">
          <Button onClick={copyShare} className="rounded-full px-6">
            <Copy className="w-4 h-4 mr-2" /> Copiar texto
          </Button>
          <Button asChild variant="outline" className="rounded-full px-6" style={{ borderColor: "#25D366", color: "#25D366" }}>
            <a href={waHref} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="w-4 h-4 mr-2" /> Enviar no WhatsApp
            </a>
          </Button>
          <Button asChild variant="outline" className="rounded-full px-6">
            <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" onClick={copyShare}>
              <Instagram className="w-4 h-4 mr-2" /> Abrir Instagram
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
};

const TriagemMarcadores = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [sex, setSex] = useState<Sex | "">("");
  const [status, setStatus] = useState<Status | "">("");
  const [duration, setDuration] = useState("");
  const [compounds, setCompounds] = useState<string[]>([]);
  const [weeklyDose, setWeeklyDose] = useState("");
  const [followup, setFollowup] = useState<"sim" | "nao" | "">("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [bf, setBf] = useState("");
  const [pressure, setPressure] = useState("");
  const [risk, setRisk] = useState<string[]>([]);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const markers = useMemo(
    () => (sex && status ? buildMarkers({ sex: sex as Sex, status: status as Status, compounds, risk }) : []),
    [sex, status, compounds, risk],
  );
  const essentials = markers.filter((m) => m.priority === "Essencial");

  const toggle = (arr: string[], v: string, set: (x: string[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const validateLead = () => {
    const n = nameSchema.safeParse(fullName);
    const p = phoneSchema.safeParse(whatsapp);
    const e = emailSchema.safeParse(email);
    if (!n.success) return n.error.issues[0].message;
    if (!p.success) return p.error.issues[0].message;
    if (!e.success) return e.error.issues[0].message;
    return null;
  };

  const next = () => {
    if (step === 0) {
      const err = validateLead();
      if (err) { toast.error(err); return; }
    }
    if (step === 1 && (!sex || !status)) {
      toast.error("Selecione sexo e situação");
      return;
    }
    setStep((s) => Math.min(6, s + 1) as Step);
  };
  const back = () => setStep((s) => Math.max(0, s - 1) as Step);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const usesOral = compounds.some((c) => ORAIS_17AA.has(c));
      const usesAggressive = compounds.some((c) => AGRESSIVOS.has(c));
      const usesGhIns = compounds.some((c) => GH_INSULINA.has(c));
      const usesAiCaber = compounds.some((c) => AI_CABER.has(c));
      const usesTest = compounds.includes("Testosterona");

      const summary = {
        essentialCount: essentials.length,
        totalMarkers: markers.length,
        topRisks: [
          usesOral ? "Hepatotoxicidade (orais 17-aa)" : null,
          usesAggressive ? "Cardiovascular e prolactina (compostos agressivos)" : null,
          usesGhIns ? "Glicêmico (GH/insulina)" : null,
          risk.length > 0 ? "Histórico/fatores clínicos relevantes" : null,
        ].filter(Boolean),
      };

      const { error } = await supabase.from("lab_screenings").insert([{
        full_name: fullName.trim(),
        whatsapp: whatsapp.trim(),
        email: email.trim() || null,
        biological_sex: sex,
        usage_status: status,
        usage_duration: duration || null,
        compounds,
        weekly_dose: weeklyDose || null,
        uses_oral_17aa: usesOral,
        uses_testosterone: usesTest,
        uses_aggressive: usesAggressive,
        uses_gh_insulin: usesGhIns,
        uses_ai_caber: usesAiCaber,
        has_medical_followup: followup === "sim",
        age: age ? Number(age) : null,
        weight_kg: weight ? Number(weight) : null,
        height_cm: height ? Number(height) : null,
        body_fat_pct: bf ? Number(bf) : null,
        blood_pressure: pressure || null,
        risk_history: risk,
        symptoms,
        notes: notes || null,
        markers: markers as unknown as import("@/integrations/supabase/types").Json,
        summary: summary as unknown as import("@/integrations/supabase/types").Json,
      }]);
      if (error) throw error;
      setDone(true);
      setStep(6);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const progress = ((step + 1) / 7) * 100;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Triagem de Marcadores Laboratoriais | STH METHOD</title>
        <meta
          name="description"
          content="Ferramenta gratuita da STH METHOD que sugere marcadores laboratoriais personalizados para usuários, ex-usuários ou interessados em hormônios e anabolizantes."
        />
        <link rel="canonical" href="https://sthmethod.com.br/triagem-marcadores" />
      </Helmet>

      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/70 border-b border-border/40">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/tendencias/marcadores-laboratoriais" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
          <Link to="/" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-2">
            <Home className="w-4 h-4" /> STH METHOD
          </Link>
        </div>
        <div className="h-[2px] bg-border/40">
          <div className="h-full bg-[hsl(var(--primary))] transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 pt-12 pb-32">
        {step === 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
            <p className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase mb-4">
              Ferramenta gratuita
            </p>
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05] mb-6">
              Triagem de marcadores laboratoriais
            </h1>
            <p className="text-[17px] leading-[1.6] text-muted-foreground font-light max-w-xl mx-auto">
              Responda algumas perguntas e receba uma tabela personalizada de exames sugeridos.
              Foco em segurança, eixo hormonal, cardiovascular, hepático, renal e metabólico.
            </p>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {step === 0 && <StepLead {...{ fullName, setFullName, whatsapp, setWhatsapp, email, setEmail }} />}
            {step === 1 && <StepSexStatus {...{ sex, setSex, status, setStatus }} />}
            {step === 2 && (
              <StepCompounds
                status={status as Status}
                duration={duration} setDuration={setDuration}
                compounds={compounds} setCompounds={setCompounds}
                weeklyDose={weeklyDose} setWeeklyDose={setWeeklyDose}
                followup={followup} setFollowup={setFollowup}
                toggle={toggle}
              />
            )}
            {step === 3 && <StepBio {...{ age, setAge, weight, setWeight, height, setHeight, bf, setBf, pressure, setPressure }} />}
            {step === 4 && <StepRisk {...{ risk, setRisk, symptoms, setSymptoms, notes, setNotes, toggle }} />}
            {step === 5 && (
              <StepReview
                fullName={fullName} whatsapp={whatsapp}
                sex={sex} status={status}
                compounds={compounds} risk={risk} symptoms={symptoms}
                essentialCount={essentials.length} totalMarkers={markers.length}
              />
            )}
            {step === 6 && done && <StepResult markers={markers} fullName={fullName} />}
          </motion.div>
        </AnimatePresence>

        {step < 6 && (
          <div className="flex items-center justify-between mt-12 pt-8 border-t border-border/40">
            <Button variant="ghost" onClick={back} disabled={step === 0} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
            {step < 5 ? (
              <Button onClick={next} className="rounded-full px-6">
                Continuar <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting} className="rounded-full px-6">
                {submitting ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando</>) : (<>Gerar minha tabela <Check className="w-4 h-4 ml-2" /></>)}
              </Button>
            )}
          </div>
        )}

        {step === 6 && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-12">
            <Button onClick={() => window.print()} variant="outline" className="rounded-full px-6">
              Imprimir / Salvar PDF
            </Button>
            <Button onClick={() => navigate("/")} className="rounded-full px-6">
              Conhecer a STH METHOD
            </Button>
          </div>
        )}

        <p className="text-[12px] text-muted-foreground/70 mt-16 leading-relaxed text-center max-w-xl mx-auto">
          <ShieldCheck className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
          Essa triagem não substitui consulta médica. Os exames devem ser avaliados por profissional de saúde habilitado,
          considerando histórico clínico, sintomas, pressão arterial, medicamentos em uso e objetivos individuais.
          A STH METHOD utiliza essas informações para melhorar o acompanhamento estratégico, sempre com foco em saúde,
          performance e segurança.
        </p>
      </main>
    </div>
  );
};

export default TriagemMarcadores;
