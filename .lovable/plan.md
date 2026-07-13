## Verificação por e-mail antes de autorizar telefone adicional

Fluxo: admin/consultor registra a solicitação → sistema envia link único ao **e-mail do cadastro** do aluno → aluno clica, confirma identidade e autoriza formalmente o telefone adicional → registro fica marcado como "identidade verificada" e a autorização passa para aprovada com aceite eletrônico salvo.

### 1. Banco de dados (migration)
Adicionar em `authorized_contacts`:
- `verification_token` (text, único) — token opaco de 32+ chars
- `verification_sent_at` (timestamptz)
- `verification_expires_at` (timestamptz) — 48h
- `identity_verified_at` (timestamptz)
- `student_confirmed_at` (timestamptz)
- `student_ip` (text), `student_user_agent` (text)
- `terms_version` (text) — versão do termo aceita
- Novo status permitido: `awaiting_student` (entre pending e approved)

RPCs SECURITY DEFINER (acessíveis via anon com token, sem expor dados sensíveis):
- `get_authorized_contact_by_token(token)` → devolve dados mínimos (nome do aluno, holder, phone mascarado, relação, expira em)
- `confirm_authorized_contact(token, authorized bool, signature_name, ip, user_agent)` → grava aceite, muda status para approved/rejected, registra em `legal_acceptances`

### 2. Edge function `send-authorized-contact-verification`
- Recebe `{ authorized_contact_id }`
- Verifica sessão admin/consultor
- Gera token, define expiração 48h, persiste
- Chama `send-transactional-email` com novo template `authorized-contact-verification`
- Idempotência por `authorized_contact_id`

### 3. Template de e-mail (app email)
`supabase/functions/_shared/transactional-email-templates/authorized-contact-verification.tsx`
- Assunto: "Confirme a autorização de um telefone adicional na STH METHOD"
- Corpo: identifica o aluno, mostra nome do titular do telefone adicional (parcialmente mascarado), relação, finalidade, botão "Confirmar autorização" apontando para `/autorizar-telefone?token=...`
- Estilo Apple / STH METHOD (fundo `#ffffff`, verde neon no CTA), copy em PT-BR profissional
- Aviso: link válido 48h, se não foi você ignore

### 4. Página pública `/autorizar-telefone` (nova rota)
`src/pages/AutorizarTelefone.tsx`, sem auth (usa token):
- Carrega dados via RPC `get_authorized_contact_by_token`
- Estados: válido / expirado / já respondido / inválido
- Formulário: mostra resumo (aluno, telefone adicional mascarado, titular, relação), checkbox de ciência LGPD, campo "Assinatura (nome completo)", botões **Autorizar** / **Recusar**
- Submete via RPC `confirm_authorized_contact`, registra IP/UA
- Tela de sucesso com selo verde

### 5. Tela admin `AdminAuthorizedContacts`
Novo botão em cada card pendente: **"Enviar verificação por e-mail"**
- Chama a edge function
- Mostra status: "Aguardando confirmação do aluno (enviado em X, expira em Y)"
- Badge extra `awaiting_student` (âmbar com ícone Mail)
- Após confirmação, aparece "Identidade verificada em X · IP: Y" e o botão Autorizar/Rejeitar manuais somem (já veio decidido pelo aluno)

### 6. Tela do aluno `StudentOverview`
Bloco "Telefones autorizados" já existente ganha um estado adicional:
- Se `identity_verified_at` presente → mostra selo "Verificado por e-mail em DD/MM/AAAA"

### Detalhes técnicos
- Token: `crypto.randomUUID() + crypto.randomUUID()` no edge (hash-safe, 72 chars)
- RLS: `authorized_contacts` mantém policies atuais; as RPCs bypassam RLS por SECURITY DEFINER usando somente o token
- Registro em `legal_acceptances` com `document_type = 'authorized_contact_consent'`, `document_version = LEGAL.termsVersion`, snapshot do resumo autorizado
- E-mail infra: já provisionada no projeto (usar `send-transactional-email`); se `email_domain--check_email_domain_status` indicar setup incompleto, resolvo antes

### Fora do escopo
- Segundo canal (documento/selfie) — fluxo fica só com e-mail nessa entrega
- Confirmação do titular do telefone adicional continua manual via WhatsApp (botão já existente)
- Notificação automática para o admin quando o aluno responde (fica só o refresh da lista)
