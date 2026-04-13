import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface StudentProfile {
  full_name?: string;
  email?: string;
  phone?: string;
  weight?: number | null;
  height?: number | null;
  objective?: string | null;
  birth_date?: string | null;
}

interface Props {
  phone: string;
  name?: string;
  size?: "sm" | "default";
  userId?: string;
  studentProfile?: StudentProfile;
}

const FIXED_TEMPLATES = [
  {
    id: "custom",
    label: "✏️ Personalizada",
    build: (_name: string, _link: string) => "",
  },
  {
    id: "cobranca",
    label: "💰 Cobrança",
    build: (name: string, link: string) =>
      `Olá ${name}! Tudo bem?\n\nIdentificamos que seu pagamento está pendente. Para manter seu acesso ativo, por favor regularize o quanto antes.${link ? `\n\nSegue seu link de pagamento:\n${link}` : ""}\n\nQualquer dúvida, estou à disposição! 😊`,
  },
  {
    id: "boas-vindas",
    label: "👋 Boas-vindas",
    build: (name: string, _link: string) =>
      `Olá ${name}! Seja muito bem-vindo(a)! 🎉\n\nEstamos felizes em ter você com a gente. Qualquer dúvida sobre seu plano, treinos ou dieta, é só me chamar aqui!\n\nVamos juntos nessa jornada! 💪`,
  },
  {
    id: "renovacao",
    label: "🔄 Renovação",
    build: (name: string, link: string) =>
      `Olá ${name}! Tudo bem?\n\nSeu plano está próximo do vencimento. Renove agora para continuar evoluindo sem interrupção!${link ? `\n\nSegue seu link de renovação:\n${link}` : ""}\n\nConte comigo! 🚀`,
  },
  {
    id: "lembrete",
    label: "📋 Lembrete geral",
    build: (name: string, _link: string) =>
      `Olá ${name}! Tudo bem?\n\nPassando para lembrar que estou acompanhando sua evolução. Se tiver alguma dúvida ou precisar de ajuste no treino/dieta, me avise!\n\nBora manter o foco! 💪`,
  },
  {
    id: "aniversario",
    label: "🎂 Aniversário",
    build: (name: string, _link: string) =>
      `Parabéns, ${name}! 🎉🎂\n\nDesejo um dia incrível pra você! Que esse novo ciclo seja repleto de conquistas — dentro e fora da academia!\n\nConte sempre comigo! 🥳`,
  },
];

function replaceVariables(text: string, profile: StudentProfile, renewLink: string): string {
  const firstName = profile.full_name?.split(" ")[0] || "Aluno";
  const fullName = profile.full_name || "Aluno";

  let msg = text;
  msg = msg.replace(/{nome}/gi, firstName);
  msg = msg.replace(/{nome_completo}/gi, fullName);
  msg = msg.replace(/{email}/gi, profile.email || "—");
  msg = msg.replace(/{telefone}/gi, profile.phone || "—");
  msg = msg.replace(/{peso}/gi, profile.weight ? `${profile.weight}kg` : "—");
  msg = msg.replace(/{altura}/gi, profile.height ? `${profile.height}cm` : "—");
  msg = msg.replace(/{objetivo}/gi, profile.objective || "—");
  msg = msg.replace(/{link_renovacao}/gi, renewLink || "—");
  msg = msg.replace(/{link}/gi, renewLink || "—");

  if (profile.birth_date) {
    try {
      const bd = new Date(profile.birth_date + "T12:00:00");
      msg = msg.replace(/{data_nascimento}/gi, bd.toLocaleDateString("pt-BR"));
      const age = Math.floor((Date.now() - bd.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      msg = msg.replace(/{idade}/gi, `${age} anos`);
    } catch {
      msg = msg.replace(/{data_nascimento}/gi, "—");
      msg = msg.replace(/{idade}/gi, "—");
    }
  } else {
    msg = msg.replace(/{data_nascimento}/gi, "—");
    msg = msg.replace(/{idade}/gi, "—");
  }

  return msg;
}

export default function WhatsAppPopoverButton({ phone, name, size = "default", userId, studentProfile }: Props) {
  const rawPhone = phone.replace(/\D/g, "");
  const renewLink = userId ? `${window.location.origin}/dashboard/renew?uid=${userId}` : "";
  const profile: StudentProfile = studentProfile || { full_name: name || "", phone };

  const { data: dbTemplates } = useQuery({
    queryKey: ["wa-popover-templates"],
    queryFn: async () => {
      const { data } = await supabase
        .from("message_templates")
        .select("id, title, content, category_id")
        .eq("is_reusable", true)
        .order("title");
      return data || [];
    },
  });

  const { data: dbVariables } = useQuery({
    queryKey: ["wa-popover-variables"],
    queryFn: async () => {
      const { data } = await supabase
        .from("message_variables")
        .select("key, label")
        .order("sort_order");
      return data || [];
    },
  });

  const buildDefaultMessage = () => {
    let msg = `Olá ${profile.full_name?.split(" ")[0] || "Aluno"}! Tudo bem?`;
    if (renewLink) msg += `\n\nSegue seu link de pagamento:\n${renewLink}`;
    return msg;
  };

  const [waPhone, setWaPhone] = useState(`55${rawPhone}`);
  const [waMessage, setWaMessage] = useState(buildDefaultMessage());
  const [selectedTemplate, setSelectedTemplate] = useState("custom");
  const [open, setOpen] = useState(false);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setWaPhone(`55${rawPhone}`);
      setWaMessage(buildDefaultMessage());
      setSelectedTemplate("custom");
    }
    setOpen(isOpen);
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);

    // Check fixed templates first
    const fixedTpl = FIXED_TEMPLATES.find((t) => t.id === templateId);
    if (fixedTpl && templateId !== "custom") {
      const firstName = profile.full_name?.split(" ")[0] || "Aluno";
      setWaMessage(fixedTpl.build(firstName, renewLink));
      return;
    }

    // Check DB templates
    const dbTpl = dbTemplates?.find((t) => t.id === templateId);
    if (dbTpl) {
      setWaMessage(replaceVariables(dbTpl.content, profile, renewLink));
    }
  };

  const insertVariable = (key: string) => {
    setWaMessage((prev) => prev + key);
    setSelectedTemplate("custom");
  };

  const waLink = `https://wa.me/${waPhone.replace(/\D/g, "")}?text=${encodeURIComponent(replaceVariables(waMessage, profile, renewLink))}`;

  const btnClass = size === "sm"
    ? "w-7 h-7 border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/10"
    : "h-10 w-10 border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/10";

  const iconClass = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  const allTemplateOptions = [
    ...FIXED_TEMPLATES.map((t) => ({ id: t.id, label: t.label })),
    ...(dbTemplates || []).map((t) => ({ id: t.id, label: `📄 ${t.title}` })),
  ];

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={`shrink-0 ${btnClass}`}
          title="Enviar WhatsApp"
        >
          <MessageCircle className={iconClass} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 space-y-3" align="end">
        <p className="text-sm font-semibold">WhatsApp</p>

        <div>
          <Label className="text-xs">Template</Label>
          <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allTemplateOptions.map((t) => (
                <SelectItem key={t.id} value={t.id} className="text-xs">
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {dbVariables && dbVariables.length > 0 && (
          <div>
            <Label className="text-xs">Variáveis</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {dbVariables.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => insertVariable(v.key)}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
                  title={v.label}
                >
                  {v.key}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <Label className="text-xs">Número (com DDI)</Label>
          <Input
            value={waPhone}
            onChange={(e) => setWaPhone(e.target.value)}
            placeholder="5511999999999"
            className="text-sm h-8"
          />
          <p className="text-[10px] text-muted-foreground mt-0.5">Ex: 55 para Brasil, 1 para EUA</p>
        </div>

        <div>
          <Label className="text-xs">Mensagem</Label>
          <Textarea
            value={waMessage}
            onChange={(e) => {
              setWaMessage(e.target.value);
              setSelectedTemplate("custom");
            }}
            rows={4}
            className="text-xs resize-none"
          />
        </div>

        <Button
          size="sm"
          className="w-full gap-1.5 bg-[#25D366] hover:bg-[#25D366]/90 text-white"
          asChild
        >
          <a href={waLink} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-3.5 h-3.5" /> Abrir WhatsApp
          </a>
        </Button>
      </PopoverContent>
    </Popover>
  );
}
