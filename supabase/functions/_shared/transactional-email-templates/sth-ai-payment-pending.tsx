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
  <AiEmailShell preview="Pagamento pendente" title="Pagamento pendente no STH AI">
    <Text style={aiText}>
      {name ? `${name.split(' ')[0]}, ` : ''}registramos sua compra no <strong>STH AI</strong>, mas o pagamento
      ainda está em processamento.
    </Text>
    <Section style={aiBox}>
      <Text style={{ ...aiText, margin: 0 }}>Plano: <strong>{plan}</strong></Text>
      <Text style={{ ...aiText, margin: 0 }}>Valor: <strong>{amount}</strong></Text>
    </Section>
    <Text style={aiText}>Assim que for aprovado, liberamos seu acesso automaticamente e avisamos por e-mail.</Text>
    <Section style={{ textAlign: 'center', margin: '28px 0' }}>
      <Button href={appUrl} style={aiButton}>Abrir o STH AI</Button>
    </Section>
  </AiEmailShell>
)

export const template = {
  component: Email,
  subject: 'STH AI · Pagamento pendente',
  displayName: 'STH AI — Pagamento pendente',
  previewData: { name: 'João Silva', plan: 'Mensal', amount: 'R$ 39,90', appUrl: AI_APP_URL },
} satisfies TemplateEntry
