## Princípio condutor

Em todos os pontos de contato, o cliente contrata um **Programa de Acompanhamento em Saúde e Performance por prazo determinado** — nunca compra dieta, treino ou protocolo. Toda copy passa a refletir isso, com termos como "acesso durante a vigência", "ao término do plano o acesso é encerrado", "não há garantia de resultado".

Como o escopo é muito grande (toca landing, checkout, área do aluno, e-mails, automações WhatsApp, FAQ, autorização de imagem, jurídico), preciso confirmar prioridades antes de mexer em ~30 arquivos.

---

## O que será entregue por etapa

**1. Página de Vendas (`/programa` nova rota, ou refazer `src/pages/Landing.tsx`)**
Hero "Programa de Acompanhamento", benefícios, como funciona, o que está incluso/não está incluso, vigência, planos (30D/90D/6M/Selected/Projeto Verão 180 com valores exatos do Termo), FAQ resumido, avisos jurídicos discretos, CTA único.

**2. Checkout (`DynamicCheckoutDialog.tsx` + `Cadastro.tsx`)**
- Bloco "Resumo do Programa" descrevendo que é acompanhamento por prazo determinado.
- 3 checkboxes obrigatórios: Termo, Política de Privacidade, Ciência da natureza temporária.
- 1 checkbox opcional: comunicações comerciais.
- Bloco de **Autorização de Imagem com 3 opções rádio** (não autorizo / sem identificação / com identificação) salvo em `profiles.image_consent`.
- Persistir aceites em nova tabela `legal_acceptances` (versão do termo, IP, timestamp).

**3. Página "Compra Concluída" (`src/pages/PaymentSuccess.tsx` nova)**
Parabéns + próximos passos + prazo de liberação + como acessar + canal de suporte + link do Termo.

**4. E-mail de Boas-vindas (template `welcome-program` em `_shared/transactional-email-templates/`)**
Confirmação do plano, vigência (data início/fim), como acessar, links Termo + Política, reforço de prazo determinado.

**5. Onboarding (`src/pages/Cadastro.tsx` — adicionar telas)**
Boas-vindas → avaliação → objetivo → tela de responsabilidade do cliente → autorização de imagem → confirmação → final.

**6. Área do Aluno (`StudentOverview.tsx`, `StudentSubscription.tsx`)**
Banner "Plano ativo · X dias restantes", aviso de renovação D-15/D-7/D-3, aviso de encerramento D-1, tela "Plano expirado" com CTA renovar.

**7. Comunicação Automática (WhatsApp + e-mail)**
Reescrever templates em `crm-templates.ts` + criar novos templates de e-mail para: confirmação, liberação, ativo, D-15/D-7/D-3/D-1, encerrado, renovação, recuperação de pagamento, cobrança recusada, atualização de protocolo, solicitação de fotos/peso/medidas.

**8. FAQ (`src/pages/FAQ.tsx` nova ou seção na landing)**
Respostas alinhadas ao Termo para as 10 perguntas listadas + 5 extras.

**9. Jornada de Uso de Imagem (`src/pages/AutorizacaoImagem.tsx` + componente reutilizável)**
Tela inicial, convite, mensagem pós-recusa, reconvite após evolução, alteração, agradecimento.

**10. Blindagem jurídica**
Auditoria automática (script `rg`) varrendo a base por termos proibidos: "seu treino para sempre", "sua dieta", "garantia de resultado", "vai emagrecer", "compre seu protocolo" etc. Lista para revisão + substituições.

---

## Detalhes técnicos

- Nova migração SQL: `legal_acceptances` (user_id, term_version, accepted_at, ip, document_type) + coluna `profiles.image_consent` enum `('nao_autorizo','sem_identificacao','com_identificacao')`.
- Versão do Termo armazenada em constante `src/lib/legal-version.ts` (`"v2026.06"`).
- Páginas estáticas do Termo e Política servidas em `/termo` e `/privacidade` a partir do conteúdo já parseado.
- Reaproveitar `email_domain--scaffold_transactional_email` apenas se necessário (infra já existe).

---

## Antes de implementar — preciso de 2 confirmações

1. **Escopo prioritário**: É urgente entregar tudo de uma vez ou começamos pelos itens jurídicos críticos (Checkout com aceites + Termo/Privacidade + Boas-vindas + FAQ) e os demais em uma 2ª leva?
2. **Landing**: substituo a `Landing.tsx` atual (cheia de seções comerciais) por uma versão alinhada ao Termo, OU crio uma rota nova `/programa` mantendo a atual?

Responda essas 2 e eu sigo executando.
