/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  resetUrl?: string
  expiresInMinutes?: number
}

const Email = ({ name = '', resetUrl = '#', expiresInMinutes = 30 }: Props) => {
  const first = (name || '').split(' ')[0]
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>Redefinição de senha — EAD CAS</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandRow}>
            <Text style={brand}>EAD CAS</Text>
            <Text style={badge}>REDEFINIÇÃO DE SENHA</Text>
          </Section>
          <Heading style={h1}>Redefinir sua senha</Heading>
          <Text style={text}>
            Olá{first ? `, ${first}` : ''}. Recebemos um pedido para redefinir a senha do seu acesso ao EAD CAS.
          </Text>
          <Section style={{ textAlign: 'center', margin: '22px 0' }}>
            <Button href={resetUrl} style={btn}>Criar nova senha</Button>
          </Section>
          <Text style={text}>
            Este link expira em <strong>{expiresInMinutes} minutos</strong> e só pode ser usado uma vez.
          </Text>
          <Text style={muted}>
            Se o botão não funcionar, copie e cole no navegador:<br />
            <span style={{ wordBreak: 'break-all' }}>{resetUrl}</span>
          </Text>
          <Hr style={hr} />
          <Text style={footer}>Se você não solicitou, ignore este e-mail.</Text>
          <Text style={footer}>EAD CAS · sthmethod.com.br</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: 'Redefinição de senha — EAD CAS',
  displayName: 'Recuperação de senha (CAS)',
  previewData: {
    name: 'João Silva',
    resetUrl: 'https://sthmethod.com.br/cas/reset-password?token=abc123',
    expiresInMinutes: 30,
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif', color: '#1c1c1c' }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const brandRow = { paddingBottom: '24px', borderBottom: '1px solid #ededed', marginBottom: '24px' }
const brand = { fontSize: '13px', letterSpacing: '0.18em', fontWeight: 700, color: '#121212', margin: 0 }
const badge = { fontSize: '11px', letterSpacing: '0.16em', color: '#8c8c8c', margin: '6px 0 0' }
const h1 = { fontSize: '22px', fontWeight: 700, color: '#121212', margin: '0 0 14px' }
const text = { fontSize: '15px', lineHeight: '1.6', color: '#3a3a3a', margin: '0 0 16px' }
const muted = { fontSize: '13px', lineHeight: '1.5', color: '#8c8c8c', margin: '8px 0' }
const btn = { background: '#121212', color: '#ffffff', padding: '14px 22px', borderRadius: '12px', fontWeight: 600, textDecoration: 'none', fontSize: '15px' }
const hr = { border: 'none', borderTop: '1px solid #ededed', margin: '28px 0 18px' }
const footer = { fontSize: '12px', color: '#8c8c8c', margin: '4px 0' }