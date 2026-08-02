/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Button, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { AiEmailShell, AI_APP_URL, aiText, aiButton, aiBox } from './sth-ai-layout.tsx'

interface Props {
  name?: string
  plan?: string
  appUrl?: string
}

const Email = ({ name = '', plan = 'Mensal', appUrl = AI_APP_URL }: Props) => (
  <AiEmailShell preview="Assinatura expirada" title="Sua assinatura do STH AI expirou">
    <Text style={aiText}>
      {name ? `${name.split(' ')[0]}, ` : ''}o período da sua assinatura <strong>{plan}</strong> no
      <strong> STH AI</strong> chegou ao fim.
    </Text>
    <Text style={aiText}>Renove para continuar gerando seus ciclos de cardápio, treino e análise.</Text>
    <Section style={{ textAlign: 'center', margin: '28px 0' }}>
      <Button href={appUrl} style={aiButton}>Renovar no STH AI</Button>
    </Section>
  </AiEmailShell>
)

export const template = {
  component: Email,
  subject: 'STH AI · Assinatura expirada',
  displayName: 'STH AI — Assinatura expirada',
  previewData: { name: 'João Silva', plan: 'Mensal', appUrl: AI_APP_URL },
} satisfies TemplateEntry
