Para tornar o sistema de renovação totalmente automatizado e sem erros, implementarei as seguintes mudanças:

### 1. Automação de Continuidade de Protocolo
Removeremos a necessidade de aprovação manual para alunos que renovam após 15 dias de atraso. O sistema dará continuidade ao protocolo anterior automaticamente, garantindo que o aluno não fique travado.

- **Alteração**: Atualizar a trigger de banco de dados para que a decisão de continuidade seja sempre `continue` ou `auto_continue`.

### 2. Renovação em "Um Clique"
Melhoraremos o link de renovação enviado pelo WhatsApp para que, ao clicar, o aluno seja levado diretamente para o checkout do seu plano atual, pulando a etapa de seleção de planos.

- **Frontend**: Suporte ao parâmetro `pid` (plan ID) na página de renovação para abrir o checkout automaticamente.
- **Backend**: Incluir o `plan_id` atual no link gerado pela régua de mensagens automáticas.

### 3. Correção de Consistência e Mensagens
- **Correção**: Sincronizar o cupom de desconto no template de 30 dias (de `RETOMA10` para `RETOMA20`, conforme a lógica do sistema).
- **Templates**: Garantir que todos os links de renovação utilizem o novo formato "one-click".

### Detalhes Técnicos

1.  **Migração SQL**:
    - Modificar a função `public.create_protocol_continuity_decision` para remover o status `pending`.
    - Atualizar registros `pending` existentes para `continue`.
2.  **`src/pages/student/StudentRenew.tsx`**:
    - Adicionar lógica para ler `pid` da URL e disparar o `setCheckoutOpen(true)` se o plano for encontrado.
3.  **`supabase/functions/subscription-reminder-dispatch/index.ts`**:
    - Atualizar a geração da variável `link` para incluir `&pid=${sub.plan_id}`.
4.  **`crm_message_templates`**:
    - Atualizar manualmente os corpos das mensagens via SQL para garantir que o cupom e os links estejam perfeitos.
