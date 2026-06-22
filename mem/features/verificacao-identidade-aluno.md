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

## Autoatendimento (fluxo automático)
Aluno acessa **`/alterar-dados`** (link público), informa e-mail cadastrado, escolhe o que alterar e fornece o novo valor. Validação por **data nascimento + 4 dígitos CPF** (mesma KBA), código de 6 dígitos enviado para o e-mail destino, aplicação automática — sem intervenção humana.
- Edge function: `self-service-identity` (verify_jwt=false). Actions: `start`, `verify_kba`, `send_code`, `verify_code`.
- Mesma tabela `identity_verification_requests` com `channel='self_service'` e `self_service_token`.
- Anti-enumeração: `start` sempre responde ok mesmo se e-mail não existir; rate-limit 3 solicitações/30min por usuário.
- IA do CRM (Comercial/Sucesso/Nutri): quando detectar intenção do aluno trocar e-mail/telefone/senha, **enviar direto o link `https://sthmethod.com/alterar-dados`** sem pedir PII no chat. Nunca confirmar/citar e-mail/telefone/CPF atuais.