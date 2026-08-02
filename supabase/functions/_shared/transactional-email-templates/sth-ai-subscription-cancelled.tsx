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
  <AiEmailShell preview="Assinatura cancelada" title="Assinatura do STH AI cancelada">
    <Text style={aiText}>
      {name ? `${name.split(' ')[0]}, ` : ''}sua assinatura <strong>{plan}</strong> do <strong>STH AI</strong> foi
      cancelada. O acesso às gerações de cardápio, treino e análise fica indisponível a partir de agora.
    </Text>
    <Text style={aiText}>Se quiser voltar, é só reativar quando desejar — seus dados continuam salvos.</Text>
    <Section style={{ textAlign: 'center', margin: '28px 0' }}>
      <Button href={appUrl} style={aiButton}>Reativar no STH AI</Button>
    </Section>
  </AiEmailShell>
)

export const template = {
  component: Email,
  subject: 'STH AI · Assinatura cancelada',
  displayName: 'STH AI — Assinatura cancelada',
  previewData: { name: 'João Silva', plan: 'Mensal', appUrl: AI_APP_URL },
} satisfies TemplateEntry
