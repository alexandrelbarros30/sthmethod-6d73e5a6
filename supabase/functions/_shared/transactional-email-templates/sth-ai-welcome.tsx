/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Button, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { AiEmailShell, AI_APP_URL, aiText, aiButton, aiBox } from './sth-ai-layout.tsx'

interface Props {
  name?: string
  appUrl?: string
}

const Email = ({ name = '', appUrl = AI_APP_URL }: Props) => (
  <AiEmailShell preview="Sua conta foi criada" title={`Bem-vindo(a) ao STH AI${name ? `, ${name.split(' ')[0]}` : ''}`}>
    <Text style={aiText}>
      Seu cadastro no <strong>STH AI</strong> foi concluído com sucesso. A partir de agora você tem acesso ao
      cardápio inteligente, treino e central de análise do sistema STH AI.
    </Text>
    <Text style={aiText}>
      Complete seu perfil no onboarding para que o STH AI gere seu primeiro ciclo.
    </Text>
    <Section style={{ textAlign: 'center', margin: '28px 0' }}>
      <Button href={appUrl} style={aiButton}>Abrir o STH AI</Button>
    </Section>
  </AiEmailShell>
)

export const template = {
  component: Email,
  subject: 'STH AI · Bem-vindo(a) ao seu app',
  displayName: 'STH AI — Boas-vindas (cadastro)',
  previewData: { name: 'João Silva', appUrl: AI_APP_URL },
} satisfies TemplateEntry
