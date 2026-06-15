// Catalog of all email templates the platform sends.
// Source of truth for the admin panel UI (display name, description, variables).
// The actual rendering lives in supabase/functions/_shared/*-templates/.

export type EmailTemplateCategory = "auth" | "transactional";

export interface EmailTemplateMeta {
  key: string;
  category: EmailTemplateCategory;
  displayName: string;
  description: string;
  defaultSubject: string;
  variables: string[];
  trigger: string;
}

export const EMAIL_TEMPLATES: EmailTemplateMeta[] = [
  // ===== AUTH =====
  {
    key: "signup",
    category: "auth",
    displayName: "Confirmação de cadastro",
    description: "Enviado quando o aluno se cadastra e precisa confirmar o e-mail.",
    defaultSubject: "Confirme seu e-mail",
    variables: ["siteName", "confirmationUrl", "recipient"],
    trigger: "Automático ao criar nova conta",
  },
  {
    key: "magiclink",
    category: "auth",
    displayName: "Magic Link (login sem senha)",
    description: "Link mágico de acesso direto.",
    defaultSubject: "Seu link de acesso",
    variables: ["siteName", "confirmationUrl"],
    trigger: "Automático ao pedir login via magic link",
  },
  {
    key: "recovery",
    category: "auth",
    displayName: "Recuperação de senha",
    description: "Link para o aluno redefinir a senha.",
    defaultSubject: "Redefina sua senha",
    variables: ["siteName", "confirmationUrl"],
    trigger: "Automático em 'Esqueci minha senha'",
  },
  {
    key: "invite",
    category: "auth",
    displayName: "Convite de equipe",
    description: "Convite enviado a novos membros da equipe.",
    defaultSubject: "Você foi convidado",
    variables: ["siteName", "siteUrl", "confirmationUrl"],
    trigger: "Automático ao convidar membro",
  },
  {
    key: "email_change",
    category: "auth",
    displayName: "Mudança de e-mail",
    description: "Confirmação para alterar o e-mail da conta.",
    defaultSubject: "Confirme seu novo e-mail",
    variables: ["siteName", "oldEmail", "newEmail", "confirmationUrl"],
    trigger: "Automático ao alterar e-mail",
  },
  {
    key: "reauthentication",
    category: "auth",
    displayName: "Código de verificação (OTP)",
    description: "Código de 6 dígitos para reautenticação.",
    defaultSubject: "Seu código de verificação",
    variables: ["token"],
    trigger: "Automático em ações sensíveis",
  },

  // ===== TRANSACTIONAL =====
  {
    key: "welcome-registration",
    category: "transactional",
    displayName: "Boas-vindas (cadastro)",
    description: "Enviado logo após o cadastro, antes do pagamento.",
    defaultSubject: "Bem-vindo ao STH METHOD",
    variables: ["name", "siteUrl"],
    trigger: "Após confirmação de e-mail",
  },
  {
    key: "welcome-post-payment",
    category: "transactional",
    displayName: "Boas-vindas (pós-pagamento)",
    description: "Mensagem de boas-vindas depois que o pagamento é aprovado.",
    defaultSubject: "Seu acesso premium está liberado",
    variables: ["name", "planName", "siteUrl"],
    trigger: "Após pagamento aprovado",
  },
  {
    key: "payment-receipt-first",
    category: "transactional",
    displayName: "Recibo (primeira adesão)",
    description: "Comprovante da primeira compra.",
    defaultSubject: "Recibo do seu pagamento",
    variables: ["name", "planName", "amount", "method", "paymentDate"],
    trigger: "Após aprovação do pagamento de adesão",
  },
  {
    key: "payment-receipt-renewal",
    category: "transactional",
    displayName: "Recibo (renovação)",
    description: "Comprovante de renovação de plano.",
    defaultSubject: "Recibo da sua renovação",
    variables: ["name", "planName", "amount", "method", "paymentDate"],
    trigger: "Após aprovação da renovação",
  },
  {
    key: "payment-pending",
    category: "transactional",
    displayName: "Pagamento pendente",
    description: "Pagamento aguardando confirmação (Pix, boleto, etc.).",
    defaultSubject: "Estamos aguardando seu pagamento",
    variables: ["name", "planName", "amount", "method"],
    trigger: "Quando o pagamento entra em pending",
  },
  {
    key: "payment-failed",
    category: "transactional",
    displayName: "Pagamento recusado",
    description: "Falha no pagamento (cartão recusado, etc.).",
    defaultSubject: "Não conseguimos processar seu pagamento",
    variables: ["name", "planName", "amount", "method", "reason"],
    trigger: "Quando o pagamento falha",
  },
  {
    key: "renewal-reminder",
    category: "transactional",
    displayName: "Lembrete de renovação",
    description: "Aviso de que a consultoria vai vencer.",
    defaultSubject: "Sua consultoria vence em breve",
    variables: ["name", "planName", "expiresAt", "renewUrl"],
    trigger: "X dias antes do vencimento",
  },
  {
    key: "subscription-expired",
    category: "transactional",
    displayName: "Assinatura expirada",
    description: "Notificação de que o acesso foi encerrado.",
    defaultSubject: "Sua consultoria expirou",
    variables: ["name", "renewUrl"],
    trigger: "No dia do vencimento",
  },
  {
    key: "plan-changed",
    category: "transactional",
    displayName: "Mudança de plano",
    description: "Aviso de troca de plano (upgrade/downgrade).",
    defaultSubject: "Seu plano foi atualizado",
    variables: ["name", "oldPlan", "newPlan"],
    trigger: "Após troca de plano",
  },
  {
    key: "coupon-applied",
    category: "transactional",
    displayName: "Cupom aplicado",
    description: "Confirmação de uso de cupom de desconto.",
    defaultSubject: "Cupom aplicado com sucesso",
    variables: ["name", "couponCode", "discount", "planName"],
    trigger: "Quando um cupom válido é usado",
  },
  {
    key: "email-change-confirm",
    category: "transactional",
    displayName: "E-mail alterado (confirmação)",
    description: "Confirmação enviada após mudança bem-sucedida de e-mail.",
    defaultSubject: "Seu e-mail foi alterado",
    variables: ["name", "oldEmail", "newEmail"],
    trigger: "Após confirmação da troca de e-mail",
  },
  {
    key: "inactivity-reminder",
    category: "transactional",
    displayName: "Lembrete de inatividade",
    description: "Aluno sem acesso há muitos dias.",
    defaultSubject: "Sentimos sua falta",
    variables: ["name", "lastSeenAt", "siteUrl"],
    trigger: "X dias sem acesso",
  },
];

export const EMAIL_TEMPLATES_BY_KEY: Record<string, EmailTemplateMeta> =
  Object.fromEntries(EMAIL_TEMPLATES.map((t) => [t.key, t]));