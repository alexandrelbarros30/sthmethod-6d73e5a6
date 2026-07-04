// Templates padronizados de bloqueio do canal "Fale com o Nutri".
// Isolado em módulo próprio para poder ser testado sem depender do
// typecheck completo do webhook (que tem erros pré-existentes não
// relacionados a esta feature).
export type NutriBlockIdentity = 'lead' | 'aluno_vencido' | 'ex_aluno';
export type NutriBlockEntry = 'text' | 'media';

export function buildNutriBlockPayload(params: {
  identifiedAs: NutriBlockIdentity;
  firstName?: string | null;
  renewalLink?: string | null;
  entry: NutriBlockEntry;
  mediaKind?: string | null;
}): { message: string; reason: string } {
  const { identifiedAs, firstName, renewalLink, entry, mediaKind } = params;
  const nameSep = firstName ? ' ' + firstName : '';
  const comercialLink = 'https://wa.me/5521998496289';
  const link = renewalLink || 'https://sthmethod.com.br/cadastro';

  const openingByEntry = entry === 'media'
    ? `Olá${nameSep}! Aqui é a Vanessa, assistente da STH METHOD. 👋\n\n📎 Não recebemos *${mediaKind || 'arquivos'}* por aqui — e o canal *Fale com o Nutri* é exclusivo para *alunos ativos* da consultoria.`
    : `Olá${nameSep}! Aqui é a Vanessa, assistente da STH METHOD. 👋\n\nEste canal *Fale com o Nutri* é exclusivo para *alunos ativos* da consultoria, para garantir prioridade no atendimento técnico de quem está em acompanhamento com o *Nutri Alexandre*.`;

  const bodyByIdentity = identifiedAs === 'lead'
    ? (
      `\n\nComo você ainda não possui consultoria ativa, o canal correto para você é o *Comercial*, onde nossa equipe apresenta os planos e inicia sua jornada. Já estou abrindo seu atendimento por lá agora:\n\n` +
      `👉 ${comercialLink}\n🌐 Site: https://sthmethod.com.br`
    )
    : (
      `\n\nIdentificamos que sua consultoria está *inativa* no momento. Para voltar a ser atendido(a) diretamente pelo Nutri Alexandre, é necessário reativar a consultoria — de forma 100% automatizada:\n\n` +
      `🔗 Renovação: ${link}\n\n` +
      `Dúvidas comerciais (planos, valores, pagamento) seguem pelo canal *Comercial*. Já estou abrindo seu atendimento por lá agora:\n👉 ${comercialLink}`
    );

  const closing = '\n\nEstamos encerrando este atendimento por aqui para você seguir pelo canal correto. Conte Comigo!';

  const reason = `nutri_block:${identifiedAs}:${entry}`;
  return { message: openingByEntry + bodyByIdentity + closing, reason };
}