import hipertensaoImg from "@/assets/sthnews-hipertensao-hero.jpg";
import mounjaroPesoTravadoImg from "@/assets/sthnews-mounjaro-peso-travado-hero.jpg";
import marcadoresImg from "@/assets/sthnews-marcadores-hero.jpg";
import ultraImg from "@/assets/sthnews-ultraprocessados-hero.jpg";
import oleosImg from "@/assets/sthnews-oleos-sementes-hero.jpg";
import proteinaImg from "@/assets/sthnews-proteina-hero.jpg";
import carbsImg from "@/assets/sthnews-carbs-hero.jpg";
import tirzeImg from "@/assets/sthnews-tirzepatida-hero.jpg";
import bfAltoImg from "@/assets/sthnews-bfalto-hero.jpg";
import ginecoImg from "@/assets/sthnews-gineco-hero.jpg";
import trembolonaImg from "@/assets/sthnews-trembolona-hero.jpg";
import restauracaoImg from "@/assets/sthnews-atrofia-hero.jpg";
import clenbuterolImg from "@/assets/sthnews-clenbuterol-hero.jpg";
import periodizacaoImg from "@/assets/sthnews-periodizacao-hero.jpg";

export interface TrendArticle {
  id: string;
  path: string;
  kicker: string;
  title: string;
  desc: string;
  img: string;
  publishedAt: string; // ISO date
}

// Ordenado do mais recente para o mais antigo.
// Ao publicar nova tendência, adicione no topo com data atual.
export const LATEST_TRENDS: TrendArticle[] = [
  { id: "periodizacao-medicamentos", path: "/tendencias/periodizacao-medicamentos", kicker: "Estratégia farmacológica", title: "Periodização de medicamentos e peptídeos: a sofisticação que ninguém aplica", desc: "Mais compostos não é mais resultado. Cada fase pede a intervenção certa — no momento certo.", img: periodizacaoImg, publishedAt: "2026-07-14" },
  { id: "clenbuterol", path: "/tendencias/clenbuterol", kicker: "Termogênese & risco", title: "Clenbuterol: o termogênico mais poderoso ou uma bomba-relógio cardiovascular?", desc: "Mecanismo beta-2 adrenérgico, perda de gordura acelerada e o preço fisiológico que o coração paga.", img: clenbuterolImg, publishedAt: "2026-06-17" },
  { id: "restauracao-muscular", path: "/tendencias/restauracao-muscular", kicker: "Reabilitação hormonal", title: "O músculo lembra: restaurando o físico após 10 anos de hormônios", desc: "Memória miotonuclear, reset do eixo HPT e o caminho real para reverter atrofia crônica.", img: restauracaoImg, publishedAt: "2026-06-12" },
  { id: "hipertensao-arterial", path: "/tendencias/hipertensao-arterial", kicker: "Cardiovascular", title: "Hipertensão Arterial: o tratado tático completo", desc: "Classificação, fisiopatologia, diagnóstico diferencial e conduta medicamentosa, suplementar e comportamental.", img: hipertensaoImg, publishedAt: "2026-05-31" },
  { id: "mounjaro-peso-travado", path: "/tendencias/mounjaro-peso-travado", kicker: "Tirzepatida & platô", title: "Peso travado no Mounjaro? Entenda por que isso acontece", desc: "A balança não conta a história completa. Retenção hídrica, composição corporal e o que fazer na estabilização.", img: mounjaroPesoTravadoImg, publishedAt: "2026-05-22" },
  { id: "marcadores-laboratoriais", path: "/tendencias/marcadores-laboratoriais", kicker: "Guia técnico", title: "Marcadores laboratoriais: o guia técnico completo", desc: "Painéis essenciais, recomendados e avançados — leitura clínica acima do achismo.", img: marcadoresImg, publishedAt: "2026-05-15" },
  { id: "ultraprocessados-saude-mental", path: "/tendencias/ultraprocessados-saude-mental", kicker: "Mitos nutricionais", title: "Ultraprocessados não estão destruindo magicamente sua saúde mental", desc: "Existe associação. Mas associação não é causa.", img: ultraImg, publishedAt: "2026-05-05" },
  { id: "oleos-sementes", path: "/tendencias/oleos-sementes", kicker: "Mitos nutricionais", title: "Você foi enganado sobre os óleos de sementes", desc: "Sozinhos, não são automaticamente inflamatórios.", img: oleosImg, publishedAt: "2026-04-28" },
  { id: "proteina-superavit", path: "/tendencias/proteina-superavit", kicker: "Proteína & superávit", title: "Proteína em excesso não engorda como você pensa", desc: "TEF, NEAT e particionamento de nutrientes reescrevendo a equação.", img: proteinaImg, publishedAt: "2026-04-20" },
  { id: "carboidratos-hipertrofia", path: "/tendencias/carboidratos-hipertrofia", kicker: "Nutrição & hipertrofia", title: "Carboidratos não constroem músculo: o que diz a meta-análise de 2026", desc: "Proteína e calorias mandam. Carbo é performance.", img: carbsImg, publishedAt: "2026-04-12" },
  { id: "tirzepatida-hipertrofia", path: "/tendencias/tirzepatida-hipertrofia", kicker: "Tirzepatida & hipertrofia", title: "Tirzepatida e hipertrofia: o protocolo que preserva massa magra", desc: "GLP-1 + GIP e o déficit feito do jeito certo.", img: tirzeImg, publishedAt: "2026-04-02" },
  { id: "hormonios-bf-alto", path: "/tendencias/hormonios-bf-alto", kicker: "Hormonal & metabólico", title: "Hormônio com BF alto: o fim do mito", desc: "Não é proibido — é cirúrgico.", img: bfAltoImg, publishedAt: "2026-03-25" },
  { id: "ginecomastia", path: "/tendencias/ginecomastia", kicker: "Hormonal masculino", title: "Ginecomastia: o caroço silencioso que trava sua definição", desc: "O termômetro do equilíbrio hormonal.", img: ginecoImg, publishedAt: "2026-03-18" },
  { id: "trembolona", path: "/tendencias/trembolona", kicker: "Anabolizantes", title: "Trembolona: arquitetura corporal no patamar de elite", desc: "O segredo nunca foi a dose. É o manejo.", img: trembolonaImg, publishedAt: "2026-03-10" },
];

export const getLatestTrend = (): TrendArticle => LATEST_TRENDS[0];