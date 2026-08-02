/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Button, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { AiEmailShell, AI_APP_URL, aiText, aiButton, aiBox } from './sth-ai-layout.tsx'

interface Props {
  name?: string
  plan?: string
  amount?: string
  appUrl?: string
}

const Email = ({ name = '', plan = 'Mensal', amount = 'R$ 39,90', appUrl = AI_APP_URL }: Props) => (
  <AiEmailShell preview="Pagamento não aprovado" title="Pagamento não aprovado no STH AI">
    <Text style={aiText}>
      {name ? `${name.split(' ')[0]}, ` : ''}o pagamento da sua assinatura do <strong>STH AI</strong> não foi
      concluído.
    </Text>
    <Section style={aiBox}>
      <Text style={{ ...aiText, margin: 0 }}>Plano: <strong>{plan}</strong></Text>
      <Text style={{ ...aiText, margin: 0 }}>Valor: <strong>{amount}</strong></Text>
    </Section>
    <Text style={aiText}>Você pode tentar novamente pelo app, escolhendo outra forma de pagamento.</Text>
    <Section style={{ textAlign: 'center', margin: '28px 0' }}>
      <Button href={appUrl} style={aiButton}>Tentar novamente</Button>
    </Section>
  </AiEmailShell>
)

export const template = {
  component: Email,
  subject: 'STH AI · Pagamento não aprovado',
  displayName: 'STH AI — Pagamento não aprovado',
  previewData: { name: 'João Silva', plan: 'Mensal', amount: 'R$ 39,90', appUrl: AI_APP_URL },
} satisfies TemplateEntry
