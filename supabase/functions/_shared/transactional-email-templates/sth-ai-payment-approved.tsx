/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Button, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { AiEmailShell, AI_APP_URL, aiText, aiButton, aiBox } from './sth-ai-layout.tsx'

interface Props {
  name?: string
  plan?: string
  amount?: string
  expiresAt?: string
  appUrl?: string
}

const Email = ({ name = '', plan = 'Mensal', amount = 'R$ 39,90', expiresAt = '', appUrl = AI_APP_URL }: Props) => (
  <AiEmailShell preview="Pagamento aprovado" title="Pagamento aprovado no STH AI">
    <Text style={aiText}>
      {name ? `${name.split(' ')[0]}, ` : ''}recebemos a confirmação do seu pagamento e sua assinatura do
      <strong> STH AI</strong> está ativa.
    </Text>
    <Section style={aiBox}>
      <Text style={{ ...aiText, margin: 0 }}>Plano: <strong>{plan}</strong></Text>
      <Text style={{ ...aiText, margin: 0 }}>Valor: <strong>{amount}</strong></Text>
      {expiresAt ? <Text style={{ ...aiText, margin: 0 }}>Válido até: <strong>{expiresAt}</strong></Text> : null}
    </Section>
    <Section style={{ textAlign: 'center', margin: '28px 0' }}>
      <Button href={appUrl} style={aiButton}>Abrir o STH AI</Button>
    </Section>
  </AiEmailShell>
)

export const template = {
  component: Email,
  subject: 'STH AI · Pagamento aprovado — assinatura ativa',
  displayName: 'STH AI — Pagamento aprovado',
  previewData: { name: 'João Silva', plan: 'Trimestral', amount: 'R$ 99,90', expiresAt: '01/11/2026', appUrl: AI_APP_URL },
} satisfies TemplateEntry
