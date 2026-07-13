/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  studentName?: string
  studentEmail?: string
  kind?: 'image' | 'phone'
  action?: string
  previousValue?: string
  newValue?: string
  reason?: string
  occurredAt?: string
}

const kindLabel = (k?: string) => (k === 'image' ? 'Autorização de imagem' : k === 'phone' ? 'Autorização de telefone' : k || '')
const actionLabel = (a?: string) => {
  switch (a) {
    case 'granted': return 'concedida'
    case 'updated': return 'atualizada'
    case 'revoked': return 'revogada'
    case 'rejected': return 'recusada'
    default: return a || ''
  }
}

const Email = ({
  studentName = '',
  studentEmail = '',
  kind,
  action,
  previousValue = '',
  newValue = '',
  reason = '',
  occurredAt = '',
}: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>{`Aluno ${studentName} ${actionLabel(action)} ${kindLabel(kind).toLowerCase()}`}</Preview>
    <Body style={{ backgroundColor: '#f5f5f7', fontFamily: '-apple-system,BlinkMacSystemFont,"SF Pro Text",Helvetica,Arial,sans-serif', margin: 0, padding: 0 }}>
      <Container style={{ maxWidth: 560, margin: '0 auto', padding: '32px 24px' }}>
        <Section style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: 28, border: '1px solid #e5e5ea' }}>
          <Heading as="h1" style={{ fontSize: 18, fontWeight: 600, color: '#111', margin: '0 0 8px' }}>
            {kindLabel(kind)}: {actionLabel(action)}
          </Heading>
          <Text style={{ fontSize: 13, color: '#555', margin: '0 0 16px' }}>
            O aluno <strong>{studentName || 'sem nome'}</strong>{studentEmail ? ` (${studentEmail})` : ''} {actionLabel(action)} sua {kindLabel(kind).toLowerCase()} em {occurredAt}.
          </Text>
          <Hr style={{ borderColor: '#e5e5ea', margin: '16px 0' }} />
          <Text style={{ fontSize: 12, color: '#333', margin: '0 0 4px' }}>
            <strong>Antes:</strong> {previousValue || '—'}
          </Text>
          <Text style={{ fontSize: 12, color: '#333', margin: '0 0 4px' }}>
            <strong>Depois:</strong> {newValue || '—'}
          </Text>
          {reason ? (
            <Text style={{ fontSize: 12, color: '#333', margin: '8px 0 0' }}>
              <strong>Motivo informado:</strong> {reason}
            </Text>
          ) : null}
          <Hr style={{ borderColor: '#e5e5ea', margin: '20px 0' }} />
          <Text style={{ fontSize: 11, color: '#888', margin: 0 }}>
            Registro automático — Central de auditoria do STH METHOD.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template: TemplateEntry = {
  component: Email,
  subject: (d: Props) => `[STH METHOD] ${kindLabel(d?.kind)} ${actionLabel(d?.action)} — ${d?.studentName || 'aluno'}`,
  displayName: 'Admin — Mudança de autorização (imagem/telefone)',
  previewData: {
    studentName: 'Fulano de Tal',
    studentEmail: 'fulano@email.com',
    kind: 'image',
    action: 'revoked',
    previousValue: 'sem_identificacao',
    newValue: 'nao_autorizo',
    reason: 'Preferência pessoal',
    occurredAt: '13/07/2026 21:30',
  },
}