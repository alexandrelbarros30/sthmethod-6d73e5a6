---
name: Protocolo de verificação de identidade do aluno
description: Fluxo seguro para alteração de e-mail, telefone e senha sem expor PII no chat humano
type: feature
---
Atendentes NUNCA confirmam ou citam e-mail/telefone/CPF/data de nascimento atuais do aluno no chat. Para qualquer alteração de e-mail, telefone ou senha, usar o fluxo `/admin/verificacao-identidade?uid=...` (também acessível pelo botão "Verificar Identidade" em AdminStudents).

**Fluxo (4 etapas):**
1. Admin cria solicitação informando tipo e novo valor (se aplicável).
2. Pergunta ao aluno **data de nascimento + últimos 4 dígitos do CPF**, digita no painel → backend valida via `verify_identity_kba` SEM expor resposta correta. Máx 3 tentativas.
3. Sistema envia código de 6 dígitos (TTL 15 min, SHA-256 no banco) — para o **novo e-mail** (troca de e-mail) ou para o **e-mail atual** (telefone/senha).
4. Aluno informa o código → admin digita → backend aplica alteração via `auth.admin.updateUserById` e notifica e-mail antigo (template `email-change-confirm`).

**Tabela:** `identity_verification_requests` (RLS admin-only) com audit JSONB completo (quem, quando, IP, UA, eventos).
**Edge function:** `admin-identity-verification` (actions: create, verify_kba, send_code, verify_code, cancel).
**Template:** `identity-verification-code` (registry).
**Senha:** quando trocada via fluxo, gera senha temporária e envia direto ao e-mail atual — NUNCA exibida ao admin.