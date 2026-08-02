/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Button, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { AiEmailShell, AI_APP_URL, aiText, aiButton, aiBox } from './sth-ai-layout.tsx'

interface Props {
  name?: string
  changedAt?: string
  appUrl?: string
}

const Email = ({ name = '', changedAt = '', appUrl = AI_APP_URL }: Props) => (
  <AiEmailShell preview="Senha alterada" title="Sua senha do STH AI foi alterada">
    <Text style={aiText}>
      {name ? `${name.split(' ')[0]}, ` : ''}a senha da sua conta no <strong>STH AI</strong> foi alterada
      {changedAt ? ` em ${changedAt}` : ''}.
    </Text>
    <Text style={aiText}>
      Se foi você, nenhuma ação é necessária. Se não reconhece esta alteração, redefina sua senha imediatamente
      pela tela de recuperação do STH AI.
    </Text>
    <Section style={{ textAlign: 'center', margin: '28px 0' }}>
      <Button href={appUrl} style={aiButton}>Abrir o STH AI</Button>
    </Section>
  </AiEmailShell>
)

export const template = {
  component: Email,
  subject: 'STH AI · Senha alterada',
  displayName: 'STH AI — Senha alterada',
  previewData: { name: 'João Silva', changedAt: '02/08/2026 18:30', appUrl: AI_APP_URL },
} satisfies TemplateEntry
