# Limpeza Total — Começar do Zero

Você marcou as 4 opções (inclusive "apenas desligar" + "apagar tudo"). Como confirmou "Sim, apagar mesmo", vou interpretar como **remoção completa**. A opção "desligar" fica naturalmente atendida (não sobra nada para rodar).

**⚠️ Isto é IRREVERSÍVEL.** Revise a lista abaixo com calma antes de aprovar.

---

## 1. Edge Functions a apagar (16)

- `sth-automation-engine`
- `sth-ai-engine`
- `sth-memory-scheduler`
- `crm-scheduler`
- `crm-automation-runner`
- `crm-dispatch-campaign`
- `crm-inbound`
- `crm-send`
- `crm-test-connection`
- `billing-auto-dispatch`
- `whatsapp-inbound-ai`
- `whatsapp-menu-router`
- `whatsapp-delete-messages`
- `nutri-ai-reply`
- `wapi-inbound-nutri`
- `setup-whatsapp-webhook`
- `ai-assistant-chat`
- `ai-suggest-rule`
- `evolution-whatsapp`

**Mantidas** (essenciais para o app funcionar):
`send-whatsapp`, `send-wapi`, `create-payment`, `mercado-pago-webhook`, `verify-pix-receipt`, `analyze-diet`, `analyze-evolution-public`, `generate-meal-image`, `validate-coupon`, `fatsecret-search`, `import-students`, `admin-manage-students`, `reconcile-payments`.

## 2. Páginas/Rotas Admin a apagar (18)

CRM/IA/Automação:
- `AdminCRM.tsx`, `AdminSthCrm.tsx`, `AdminSthAiEngine.tsx`, `AdminSthAutomation.tsx`, `AdminSthEngine.tsx`, `AdminSthCommand.tsx`, `AdminSthGrowth.tsx`, `AdminSthKnowledge.tsx`, `AdminSthMemory.tsx`, `AdminMotorRespostaApis.tsx`, `AdminRegrasAutomacoes.tsx`, `AdminCrmAuditoria.tsx`, `AdminWhatsApp.tsx`, `AdminWhatsAppFlows.tsx`, `AdminMessages.tsx`, `AdminAtendimento.tsx`, `AdminFaleNutri.tsx`, `AdminTeleatendimento.tsx`

Treinamento:
- `AdminTraining.tsx`, `AdminTrainingPrograms.tsx`, `AdminExerciseLibrary.tsx`, `AdminWorkoutTemplates.tsx`

Componentes em `src/components/admin/sth-crm/`, `src/components/admin/CRMAutomationControl.tsx`, e relacionados serão removidos junto.

Rotas em `src/App.tsx` e itens em `src/components/DashboardSidebar.tsx` correspondentes serão limpos.

## 3. Tabelas a apagar (DROP CASCADE)

CRM/IA/Memória/Automação:
- `crm_contacts`, `crm_tickets`, `crm_ticket_messages`, `crm_webhook_logs`, `crm_notes`, `crm_tags`, `crm_contact_tags`, `crm_campaigns`, `crm_campaign_runs`, `crm_automation_rules`
- `sth_memory`, `sth_memory_objections`, `sth_memory_alerts`, `sth_auto_sessions`, `sth_auto_events`, `sth_ai_drafts`, `sth_ai_templates`, `sth_ai_unsolved`, `sth_kb_articles`
- `nutri_conversations`, `nutri_messages`
- `billing_automation`, `billing_campaigns`, `billing_dispatches`
- `ai_assistant_config`, `ai_training_examples`
- Funções relacionadas: `sth_automation_dashboard`, `sth_command_center`, `sth_growth_dashboard`, `sth_ai_engine_stats`, `sth_crm_dashboard_stats`, `sth_memory_*`, `sth_kb_*`, `crm_route_inbound`, `crm_set_protocol`, `advance_billing_campaign`, `sync_nutri_conversation`, `find_profile_by_phone`

Treinamento (se existirem — confirmarei nomes na hora):
- `training_programs`, `workouts`, `workout_exercises`, `exercises`, `workout_templates`, `student_workout_progress`

**Não toco** em: `profiles`, `user_roles`, `subscriptions`, `payments`, `plans`, `weight_logs`, `body_images`, `documents`, `evolution_notifications`, `protocol_*`, `nutrition_*` (dietas), `coupons`, `ads`, `platform_updates`, `student_flow_status`, buckets de storage.

## 4. Ordem de execução

1. Apagar Edge Functions (deploy-side)
2. Migration única com DROP CASCADE de todas as tabelas/funções
3. Remover arquivos de páginas, componentes e rotas do frontend
4. Limpar imports/links órfãos em `App.tsx` e `DashboardSidebar.tsx`

---

## Última confirmação necessária

Antes de eu seguir, me responde:

- **(a)** Aprovo a lista exata acima → executo tudo
- **(b)** Quero ajustar algo (ex: manter Treinamento, manter `crm_inbound` para reaproveitar, etc.) → me diga o quê

Recomendo fortemente que você **exporte/baixe um backup** do projeto Lovable antes (Settings → Project → Export), porque depois disso não há volta.
