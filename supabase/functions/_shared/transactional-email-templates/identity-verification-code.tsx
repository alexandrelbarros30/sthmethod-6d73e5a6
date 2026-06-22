/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  code?: string
  changeType?: string
  expiresInMinutes?: number
  supportUrl?: string
}

const labelFor = (t?: string) => {
  if (t === 'email') return 'alteração de e-mail'
  if (t === 'phone') return 'alteração de telefone'
  if (t === 'password') return 'redefinição de senha'
  return 'alteração na sua conta'
}

const Email = ({
  name = '', code = '------', changeType = 'email', expiresInMinutes = 15,
  supportUrl = 'https://wa.me/5521998496289',
}: Props) => {
  const first = (name || '').split(' ')[0]
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>Seu código de verificação: {code}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandRow}>
            <Text style={brand}>STH METHOD</Text>
            <Text style={badge}>VERIFICAÇÃO DE IDENTIDADE</Text>
          </Section>
          <Heading style={h1}>Seu código de confirmação</Heading>
          <Text style={text}>
            Olá{first ? `, ${first}` : ''}. Para concluir a {labelFor(changeType)}, informe o código abaixo ao nosso atendimento:
          </Text>

          <Section style={codeBox}>
            <Text style={codeText}>{code}</Text>
          </Section>

          <Text style={text}>
            Este código expira em <strong>{expiresInMinutes} minutos</strong>. Nunca compartilhe este código com terceiros — nossa equipe nunca pedirá senhas.
          </Text>

          <Text style={alert}>
            ⚠️ Se você <strong>não solicitou</strong> esta alteração, ignore este e-mail e fale com nossa equipe imediatamente: <a href={supportUrl} style={link}>suporte STH METHOD</a>.
          </Text>

          <Hr style={hr} />
          <Text style={footer}>STH METHOD · sthmethod.com.br</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: 'Seu código de verificação — STH METHOD',
  displayName: 'Código de verificação de identidade',
  previewData: {
    name: 'João Silva', code: '472913', changeType: 'email', expiresInMinutes: 15,
    supportUrl: 'https://wa.me/5521998496289',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif', color: '#1c1c1c' }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const brandRow = { paddingBottom: '24px', borderBottom: '1px solid #ededed', marginBottom: '24px' }
const brand = { fontSize: '13px', letterSpacing: '0.18em', fontWeight: 700, color: '#121212', margin: 0 }
const badge = { fontSize: '11px', letterSpacing: '0.16em', color: '#8c8c8c', margin: '6px 0 0' }
const h1 = { fontSize: '22px', fontWeight: 700, color: '#121212', margin: '0 0 14px' }
const text = { fontSize: '15px', lineHeight: '1.6', color: '#3a3a3a', margin: '0 0 16px' }
const codeBox = { background: '#f5f5f5', border: '1px solid #e5e5e5', borderRadius: '14px', padding: '20px', textAlign: 'center' as const, margin: '18px 0' }
const codeText = { fontSize: '36px', fontWeight: 700, color: '#121212', letterSpacing: '0.4em', margin: 0, fontFamily: 'Menlo, Consolas, monospace' }
const alert = { fontSize: '14px', lineHeight: '1.5', color: '#1c1c1c', background: '#fff5f5', border: '1px solid #f3c1c1', padding: '12px 14px', borderRadius: '10px', margin: '14px 0' }
const link = { color: '#c0392b', fontWeight: 600, textDecoration: 'underline' }
const hr = { border: 'none', borderTop: '1px solid #ededed', margin: '28px 0 18px' }
const footer = { fontSize: '12px', color: '#8c8c8c', margin: '4px 0' }