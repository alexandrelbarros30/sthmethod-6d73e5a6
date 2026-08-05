# Project Memory

## Core
- **CXO / Padrão inegociável**: Toda decisão de produto, UX, UI, texto e comunicação segue os princípios do CXO STH METHOD (clareza > criatividade, simplicidade > complexidade, elegância > excesso, consistência > novidade, verdade > marketing). Sempre perguntar "isso melhora a vida do aluno?" — se não, descartar. Mobile first. Ver [CXO STH METHOD](mem://style/cxo-experiencia-sth).
- **Design/Brand**: Pure Apple style, #000000 bg (main platform) or #f5f5f7 (CAS), SF Pro/Inter, neon green CTAs. NEVER use "STM", only "STH METHOD".
- **IA/Núcleo Cognitivo**: Todos os canais IA operam como superagente (estrategista+copy+mentor), protocolo Diagnóstico→Construção→Otimização, zero respostas mornas. **PROIBIDO ABSOLUTO**: nunca escrever/dizer a expressão "modo deus" (nem variações: god mode, modo god, MODO DEUS) em nenhum canal/idioma.
- **Identidade interna da IA**: O cérebro de IA se chama **STHIA** (STH+IA). Uso interno com admin/owner; NÃO expor nos canais Nutri/Sucesso/Aluno (mantêm personas existentes, ex.: Nutri Alexandre). **EXCEÇÃO: no canal Comercial a IA se apresenta como STHIA.**
- **Posicionamento comercial**: a STH METHOD NÃO vende dieta, treino, protocolo nem consulta — presta **SERVIÇO DE ACOMPANHAMENTO PERSONALIZADO**. Não há consultas/agendamentos.
- **Vendas/Comercial**: Para NOVOS leads, IA Comercial ancora o **Plano 90D (Trimestral)** como recomendação ideal (12 semanas = ciclo biológico completo do método), com abordagem psicanalítica/consultiva — sem esconder demais planos. Não aplicar a aluno ativo.
- **Dados/Ecossistema**: Banco único STH METHOD. Cadastro mestre = profiles.user_id. Módulos (STH AI, Coach, CAS) nunca duplicam cadastro nem histórico.
- **Security/RLS**: Use RLS `TO authenticated` for PII. Use decoupled `.in()` queries to avoid 400 errors on joins.
- **Data Mutability**: Prefer UPSERT with explicit `user_id`. Use 500ms delay & 5 retries for Auth-Profile sync.
- **Edge Functions**: Always use `SUPABASE_ANON_KEY` via `Deno.env.get`, NOT publishable keys.
- **UI Architecture**: Render functions must be outside main components to prevent focus loss. Global logout redirects to `/`.
- **Content Protection**: Disable text selection, apply blur on tab switch/screenshot. PDFs only for workouts.
- **Ethics**: Professional neutral tone. NO fake medical data or miraculous promises. Nunca usar termos "médico/medical".
- **Mobile/PWA**: Target `es2017`. Use `env(safe-area-inset-*)` and `viewport-fit=cover` for edge-to-edge screens.

## Memories

### Architecture & Tech
- [Dados unificados do ecossistema](mem://features/ecossistema-dados-unificados) — Cadastro mestre único, sync ai_app_profiles↔profiles, imagens corporais compartilhadas
- [Auth Roles & RLS](mem://auth/niveis-acesso) — RBAC 5 levels, RLS `is_consultant_of` for data isolation
- [Admin Management](mem://tech/admin-auth-management) — Edge function returns 200 on business errors for frontend recovery
- [Decoupled Queries](mem://tech/padrao-consultas-supabase-relacional) — Decoupled Supabase relational queries to avoid 400 errors
- [Edge Functions Env](mem://tech/edge-functions-env) — `SUPABASE_ANON_KEY` usage for Deno environments
- [Hardened PII](mem://tech/seguranca-hardened-pii) — RLS `TO authenticated`, restricted gateway tables
- [UI Rendering Patterns](mem://tech/ui-rendering-patterns) — Stable render functions to prevent input focus loss
- [Auth Profile Sync](mem://tech/sincronizacao-auth-profile) — 500ms delay & 5 retries for Auth and Profile db synchronization
- [Admin Sync Auth Email](mem://tech/admin-sync-auth-email) — Admin email edits sync auth.users and profiles tables
- [Mobile Upload Resilience](mem://tech/resiliencia-upload-imagens-mobile) — 3-stage decode, 1MB limit, retries, 30s timeout
- [TipTap Performance](mem://tech/tiptap-performance-build) — Named exports, 10 colors, lazy loading for Vite compatibility
- [Device Compatibility](mem://tech/compatibilidade-dispositivos) — es2017 target, Popper mode Select logic
- [Cache Management](mem://tech/cache-management-estrategia) — main.tsx hard location.replace to force clear cache/service workers
- [Retention Tracking](mem://tech/tracking-retencao-acesso) — Session tracking via visibilitychange/beforeunload events
- [CAS Engine Architecture](mem://tech/cas-engine-arquitetura) — Direct Gemini API, 7-day cache, FTS+TOC hybrid search, multimodal OCR

### Features & Modules
- [STH METHOD AI](mem://features/sth-method-ai-app) — Produto autônomo em /ai: onboarding 2 fases, Cardápio/Treino IA, Central de Análise, paywall MP, tabelas ai_app_*
- [Student Record](mem://features/prontuario-aluno) — Required NEAT, dynamic training frequency, quick copy
- [Comorbidades e Medicamentos](mem://features/comorbidades-medicamentos) — Campos obrigatórios no cadastro, sincronizados STH METHOD ↔ STH AI e injetados em todos os prompts de IA
- [Revisões por ciclo STH AI](mem://features/revisoes-ciclo-sth-ai) — 3 revisões por ciclo (cardápio/treino), banner destacado com contagem regressiva
- [Student Plan History](mem://features/admin/historico-jornada-aluno) — Admin view of current plan, first adhesion, and renewal timeline
- [Macro Calculator](mem://features/calculadora-macros) — Mifflin-St Jeor, dynamic NEAT, and EAT calculations
- [Guided Workouts](mem://features/modulo-treino-guiado) — ST Coach deep linking (stcoach://) with app store fallbacks
- [Doutrina STHIA de Treino](mem://features/doutrina-treino-sthia) — Mín. 6 reps, cardio dentro das sessões A-G, cardio livre da biblioteca ST Coach
- [Body Evolution Generator](mem://features/gerador-evolucao-corporal) — DNA Tech frame, canvas drawImageContain logic
- [Nutritional Menu](mem://features/cardapio-nutricional) — TACO/TBCA macros, recalculated from 100g/ml
- [Ovos em unidades](mem://features/ovos-em-unidades) — Ovos e claras sempre em unidades nos cardápios (STH METHOD e STH AI)
- [Diet Interactive Tracking](mem://features/acompanhamento-dieta-interativo) — Next meal widget, hydration goals (25/50/75/100%)
- [Diet AI Analysis](mem://features/analise-dieta-ia) — Gemini AI for parsing free text diets to TACO macros
- [Meal AI Images](mem://features/geracao-imagens-refeicao-ia) — Automatic AI generation for meal photos
- [Diet PDF Export](mem://features/exportacao-pdf-dieta-aluno) — Minimalist DOCX style, Times New Roman 12pt, b&w
- [Interactive Meals Standard](mem://features/padronizacao-refeicoes-interativas) — Refeição 1-6 mapping, proportional macros logic
- [Bioimpedance Visuals](mem://features/modulo-bioimpedancia) — Neon DNA Tech holographic visuals
- [Workout Builder](mem://features/modulo-treino-builder) — Hierarchical dnd-kit editor (Program -> Workout -> Exercise)
- [Text Workout Editor](mem://features/editor-treino-texto) — Mass text parser for workout sets/reps
- [Protocol Information Panel](mem://features/painel-informativo-protocolo) — 4 strategic pillars, parsed via headings
- [Premium Gamified Protocol](mem://features/protocolo-gamificado-premium) — Phase cards parsed by emoji anchor, daily check-in via `protocol_phase_checkins`
- [Supplement Budgets](mem://features/sistema-orcamentos-suplementacao) — Auto-extraction from protocol categories
- [Reusable Templates](mem://features/bibliotecas-templates-reutilizaveis) — Saving rich text, macros and hydration goals
- [Student Management Panel](mem://features/painel-gerenciamento-estudante) — Circular navigation via `&return=manage`
- [Segmented Dashboard](mem://features/dashboard-aluno-segmentado) — Premium dashboard, safe area floating dock
- [Home Dashboard](mem://features/dashboard-aluno-home) — Apple style greetings, dynamic gender visuals
- [Evolution Updates](mem://features/atualizacao-rotina-evolucao) — Updating weight/NEAT triggers macro recalcs
- [Weekly Check-in](mem://features/check-in-semanal-acompanhamento) — Premium subjective/objective forms
- [Sequential Onboarding](mem://features/fluxo-onboarding-sequencial) — Optional body images to reduce friction
- [Content Protection](mem://features/protecao-conteudo-aluno) — Anti-copy blur, disabled text selection
- [Student Notifications](mem://features/notificacoes-sistema-aluno) — Suppress ads for unseen technical content
- [Realtime Notifications](mem://features/notificacoes-pagamento-tempo-real) — Realtime admin alerts for payments and updates
- [Global Update Notification](mem://features/notificacao-atualizacao) — LocalStorage version diff update banner
- [Platform Update System](mem://features/sistema-atualizacao-plataforma) — Tabela platform_updates + AdminUpdates (/admin/updates) com bump patch/minor/major
- [Content Visual Standards](mem://features/visualizacao-conteudo) — STH METHOD style, macro colors, zebra striping
- [Identidade de fala do Nutri Alexandre](mem://features/identidade-fala-nutri-alexandre) — Marcas "Conte Comigo" e "Bora pra cima" no canal nutri
- [Regras críticas canal Nutri](mem://features/regras-criticas-canal-nutri) — Aluno ativo não redireciona, ausência obrigatória fora do expediente, marcas de fala obrigatórias
- [Microlearning Education](mem://features/sth-education-microlearning) — Hub & spoke, swipeable structured pillars
- [WhatsApp Media Blocking](mem://features/bloqueio-midia-whatsapp) — Blocking images/videos/docs on WA, redir to dashboard
- [CAS Intelligent Study](mem://features/cas-ead-inteligente) — Hidden RAG system for study/exams, hybrid search, 20 disciplines

### Payments & Business
- [Plan Management](mem://business/gestao-planos) — Pricing, Pix vs Card, installment limits
- [Mercado Pago Flow](mem://payments/fluxo-mercado-pago) — Hardened checkout, server-side prices
- [Hybrid Payment Model](mem://payments/modelo-hibrido-pagamento) — Toggling automated MP API vs manual links
- [Manual Payment Links](mem://payments/links-manuais) — Configuration for specific dynamic plan links
- [Manual Payment Business Rule](mem://regras-negocio/pagamento-manual) — Pending status flow for manual verification
- [Post-payment Automation](mem://regras-negocio/automacao-pos-pagamento) — Status activation and duration updates
- [PIX AI Verification](mem://payments/verificacao-comprovante-pix) — Gemini AI validation of Pix receipts
- [Renewal Payment Flow](mem://features/fluxo-renovacao-pagamento) — Renew anytime without mandatory biometry updates
- [Secure Renewal Links](mem://features/links-renovacao-seguros) — Redirecting auth URLs for targeted payment
- [Audit Cadastro/Pagamento](mem://features/auditoria-fluxo-cadastro-pagamento) — Webhook marca onboarding_complete + link /dashboard/pagar 1ª adesão
- [Coupon System](mem://payments/sistema-cupons) — `validate-coupon` edge function logic
- [Smart Reminders](mem://features/lembretes-inteligentes-assinatura) — Renewal and diet cycle reminders
- [Renewal Resilience](mem://regras-negocio/resiliencia-lembretes-renovacao) — Late priority status for passed renewal triggers
- [Evolution Reminders](mem://features/lembretes-evolucao-estudante) — 29-day cycle triggers for weight/photos
- [Fechamento Evolução D-5](mem://features/lembrete-fechamento-evolucao) — Lembrete 5 dias antes do fim da consultoria para fechar evolução

### Marketing & Communication
- [STH METHOD COACH](mem://features/sth-method-coach) — SaaS multi-tenant em /coach para personal/academias, tabelas coach_*, sem IA e sem consultoria
- [Consulting Methodology](mem://marketing/metodologia-consultoria) — 7 interactive cards, swipe navigation
- [Âncora Plano 90D Comercial](mem://features/estrategia-vendas-90d) — IA Comercial ancora novos leads no Plano 90D (Trimestral) como ideal
- [STHIA Comercial](mem://features/sthia-comercial-prompt) — Roteiro oficial do canal Comercial: identificação primeiro, posicionamento de acompanhamento, proteção de conteúdo, conversão
- [Núcleo Cognitivo Superagente](mem://features/nucleo-cognitivo-superagente) — Diretiva interna de raciocínio para TODOS os canais IA
- [Macro Questionnaire Funnel](mem://marketing/conversao-questionario-macros) — State transfer straight to registration
- [Free Leads Funnel](mem://marketing/funil-leads-free) — Numbers-only login, 1.5s delayed WA follow-up
- [WhatsApp Communication (STH ONE: 21 99849-6289) - NUTRI (21 99898-4153) IS PRIVATE
- [WhatsApp Bulk Sending](mem://features/whatsapp-bulk-sending) — Dynamic variables ({nome}, {link})
- [Welcome Automations](mem://regras-negocio/automacao-whatsapp-boas-vindas) — Realtime trigger for WA 'Boas vindas 2'
- [Payment Welcome Dedup](mem://features/boas-vindas-pagamento) — Único disparo via send-wapi no webhook MP
- [Internal Advertising](mem://marketing/publicidade-interna-aluno) — Admin manageable ads with visual timers
- [Sistema de E-mails](mem://features/sistema-emails-plataforma) — /admin/emails: 18 templates, disparo manual, agendamento, automação

### Admin Tools & Data
- [Excel Import](mem://features/importacao-alunos-excel) — Idempotent batch 10 exceljs import
- [Dashboard Panels](mem://ui/admin/dashboard-panels) — `activeSubUserIds` filter to prevent duplicate leads
- [Ethics/Medical Constraints](mem://constraints/etica-dados-medicos) — Neutral, safe communication
- [Proibição termo médico](mem://constraints/proibicao-termo-medico) — Nunca usar "médico/medical" em nenhum contexto
- [Service Queue](mem://features/fila-atendimento) — Numbered priority queue, dedup by user_id, 7-day window
- [Transferência Comercial→Nutri](mem://features/transferencia-comercial-nutri) — Aluno ativo no Comercial é transferido p/ Fale com o Nutri
- [Memória da IA CRM](mem://features/memoria-ia-crm) — crm_ai_memory + fetch/render/extract automático no webhook

### Design & Branding
- [CXO STH METHOD](mem://style/cxo-experiencia-sth) — Princípios inegociáveis de produto, UX, UI, tom de voz, UX writing, design system, mobile first, acessibilidade e padrão de entrega em 12 itens
- [Dynamic Customization](mem://style/customizacao-dinamica) — Static meta tags for FB Debugger compatibility
- [Plan Visual Hierarchy](mem://style/hierarquia-visual-planos) — Entry (Cyan), Mid (Amber), Premium (Violet)
- [Apple Design System](mem://style/apple-design-system) — Pure Apple, dark theme, neon green
- [CAS Apple Design](mem://style/cas-design-apple) — Apple Light theme, ABNT formatting, no AI branding
- [PWA Safe Areas](mem://style/pwa-safe-areas) — `env(safe-area-inset-*)` and standalone
- [Branding Consistency](mem://brand/branding-consistency) — ALWAYS "STH METHOD", no "STM"
- [Logout Flow](mem://ux/fluxo-logout) — Redirect to index `/`
