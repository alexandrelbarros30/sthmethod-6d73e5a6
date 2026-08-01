---
name: STH METHOD AI (produto autônomo /ai)
description: App de IA para consumidor final em /ai — onboarding 2 fases, Cardápio IA, Treino IA, Central de Análise, paywall Mercado Pago. Backend compartilhado, tabelas ai_app_*.
type: feature
---
Produto separado do portal, mesmo backend. Rotas: `/ai` (landing), `/ai/onboarding`, `/ai/app`, `/ai/app/:slug` (cardapio|treino|analise), `/ai/assinatura`.

Tabelas: `ai_app_profiles`, `ai_app_subscriptions`, `ai_app_generations`, `ai_app_measurements`, `ai_app_files` + bucket privado `sth-ai`.

Edge functions: `sth-ai-app` (motor + periodização), `sth-ai-subscribe` (preferência MP), `sth-ai-mp-webhook` (ativação).

Regras de periodização (metodologia, não limitação técnica):
- Cardápio e Treino: 1 criação por ciclo de 30 dias + 2 revisões.
- Central de Análise: 1 relatório a cada 60 dias + 1 revisão.
- Exceção só com `exception_reason` registrado.

Planos: mensal R$ 39,90 · trimestral R$ 99,90 · semestral R$ 179,90 · anual R$ 299,90. Paywall bloqueia geração sem assinatura ativa.

A IA do app NUNCA trata substância, dose, protocolo terapêutico ou usa termos "médico/medical" — redireciona para o acompanhamento profissional STH METHOD.