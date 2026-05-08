## Visão geral

Adicionar uma **nova aba "Estratégia Premium"** dentro do `/dashboard/protocol` (sem remover nada). O conteúdo continua sendo escrito pelo admin/consultor no editor rich-text já existente em `AdminProtocol.tsx`. O sistema **parseia automaticamente** o texto procurando blocos de fase iniciados por emojis (☀️ 🍽 🏋️ 🌙 ➕ qualquer outro definido) e renderiza um painel premium gamificado. O aluno toca em cada card para marcar como concluído, com persistência diária no banco.

## Fluxo

```text
Admin escreve no editor →  ☀️ MANHÃ ✅
                          "NAC 600mg + Testo Gel..."
                          Ação: ...
                          Stack: ...
                          ⏱ Em jejum
                          📌 Foco: ...
                          
Aluno vê 4 cards premium → toca → ✅ marcado hoje → barra ⚡ 25%→50%→75%→100%
À meia-noite → reseta automaticamente (linha por dia)
```

## O que será criado

### 1. Tabela `protocol_phase_checkins`
- Campos de domínio: `phase_key` (texto, ex: "manha"/"almoco"/"pre-treino"/"noite"), `checkin_date` (date), `completed_at` (timestamp)
- Único por (user_id, phase_key, checkin_date)
- **Acesso**: aluno vê/edita apenas os próprios; admins/consultores vinculados podem visualizar

### 2. Parser `src/lib/protocol-phase-parser.ts`
- Recebe HTML/texto do `student_protocols.content` mais recente
- Detecta seções por emoji-âncora (☀️🌅 / 🍽🥗 / 🏋️💪 / 🌙🌛 / ⚡🔥 etc) — mapeia para `phase_key` slug
- Extrai: título, frase principal entre aspas, linhas `Ação:`, `Stack:`, `⏱`, `📌 Foco:`, status emoji (✅⏳🔓🔒) como fallback
- Retorna `Phase[]`. Se não encontrar nada → painel não renderiza (degradação silenciosa)

### 3. Componente `GamifiedProtocolPanel`
- Cards translúcidos `bg-white/5 backdrop-blur-xl` com borda neon `#14b780` no hover/ativo
- Header de cada card: emoji grande + nome da fase + checkbox circular animado
- Conteúdo: frase em destaque (font-display, kerning amplo), linhas Ação/Stack/⏱/📌
- Dashboard de Performance (rodapé): lista compacta das fases + barra `⚡ Progresso` (já existente: `Progress` shadcn) + texto motivacional
- Microinterações: `animate-scale-in` + ring-glow verde ao marcar; toast sutil "Hormonal Flow Active" / "Recovery Mode On" conforme `phase_key`
- Tudo Tailwind tokens (sem cor hardcoded fora do glow `#14b780` permitido pela memória core)

### 4. Integração na tela do aluno
- `StudentProtocol.tsx`: envolve o conteúdo em `<Tabs>` com 2 abas:
  - **Estratégia Premium** (default) → `GamifiedProtocolPanel`
  - **Documentos & Histórico** → o conteúdo atual (PDFs, accordion, ProtocolInfoPanel)
- Se o parser não achar fases, o tab Premium mostra estado vazio com instrução pro consultor

### 5. Admin: ajuda contextual
- No editor de `AdminProtocol.tsx` adicionar um pequeno hint colapsável "Como criar Estratégia Premium" mostrando o template padrão (☀️ MANHÃ / 🍽 ALMOÇO / 🏋️ PRÉ-TREINO / 🌙 NOITE) que pode ser inserido como bloco

## Arquivos tocados

```text
NOVO  supabase/migrations/<ts>_protocol_phase_checkins.sql
NOVO  src/lib/protocol-phase-parser.ts
NOVO  src/components/student/GamifiedProtocolPanel.tsx
EDIT  src/pages/student/StudentProtocol.tsx        (Tabs + nova aba)
EDIT  src/pages/admin/AdminProtocol.tsx            (hint do template)
```

## Detalhes técnicos

- **Parser robusto**: opera sobre texto extraído via `DOMParser`, fallback por linhas. Quebra em blocos quando detecta emoji-âncora no início de linha (após `<h1-h4>`, `<p>` ou texto puro).
- **Check-in**: `useQuery` carrega checkins do dia `today` (ISO date), `useMutation` faz upsert `{user_id, phase_key, checkin_date: today, completed_at: now}` ou delete para desmarcar. Invalida cache após mutation.
- **RLS**: `SELECT/INSERT/UPDATE/DELETE` para `auth.uid() = user_id`; admins/consultores via `has_role` + `is_consultant_of` apenas SELECT.
- **Performance**: parser memoizado por `protocol.id`; card lista no máx ~6 fases.
- **Acessibilidade**: cada card é `<button>` com `aria-pressed`.

## Pronto para implementar?
Se aprovar, começo pela migration (aprovação separada do banco) e na sequência crio parser + componente + integração.