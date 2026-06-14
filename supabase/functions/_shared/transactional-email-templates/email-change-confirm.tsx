/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Preview, Row, Column, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  oldEmail?: string
  newEmail?: string
  changedAt?: string
  supportUrl?: string
}

const Email = ({
  name = '', oldEmail = '—', newEmail = '—', changedAt = '—',
  supportUrl = 'https://wa.me/5521998496289',
}: Props) => {
  const first = (name || '').split(' ')[0]
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>Seu e-mail de acesso foi alterado</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandRow}>
            <Text style={brand}>STH METHOD</Text>
            <Text style={badge}>ALTERAÇÃO DE E-MAIL</Text>
          </Section>
          <Heading style={h1}>Seu e-mail foi alterado</Heading>
          <Text style={text}>
            Olá{first ? `, ${first}` : ''}, confirmamos a alteração do e-mail vinculado à sua conta.
          </Text>

          <Section style={card}>
            <Row><Column style={lbl}>De</Column><Column style={valOld}>{oldEmail}</Column></Row>
            <Row><Column style={lbl}>Para</Column><Column style={val}>{newEmail}</Column></Row>
            <Row><Column style={lbl}>Data</Column><Column style={val}>{changedAt}</Column></Row>
          </Section>

          <Text style={alert}>
            ⚠️ Se você <strong>não fez</strong> essa alteração, fale com nossa equipe imediatamente: <a href={supportUrl} style={link}>suporte STH METHOD</a>.
          </Text>

          <Hr style={hr} />
          <Text style={footer}>Este aviso é enviado para o e-mail anterior por segurança.</Text>
          <Text style={footer}>STH METHOD · sthmethod.com.br</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: 'Seu e-mail de acesso foi alterado — STH METHOD',
  displayName: 'Alteração de e-mail',
  previewData: {
    name: 'João Silva', oldEmail: 'joao.antigo@email.com', newEmail: 'joao@email.com',
    changedAt: '14/06/2026 14:32', supportUrl: 'https://wa.me/5521998496289',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif', color: '#1c1c1c' }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const brandRow = { paddingBottom: '24px', borderBottom: '1px solid #ededed', marginBottom: '24px' }
const brand = { fontSize: '13px', letterSpacing: '0.18em', fontWeight: 700, color: '#121212', margin: 0 }
const badge = { fontSize: '11px', letterSpacing: '0.16em', color: '#8c8c8c', margin: '6px 0 0' }
const h1 = { fontSize: '22px', fontWeight: 700, color: '#121212', margin: '0 0 14px' }
const text = { fontSize: '15px', lineHeight: '1.6', color: '#3a3a3a', margin: '0 0 20px' }
const card = { backgroundColor: '#fafafa', border: '1px solid #ededed', borderRadius: '14px', padding: '18px 20px', margin: '8px 0' }
const lbl = { fontSize: '13px', color: '#8c8c8c', padding: '6px 0', width: '30%' }
const val = { fontSize: '14px', color: '#121212', fontWeight: 600, padding: '6px 0', textAlign: 'right' as const }
const valOld = { fontSize: '14px', color: '#8c8c8c', padding: '6px 0', textAlign: 'right' as const, textDecoration: 'line-through' }
const alert = { fontSize: '14px', lineHeight: '1.5', color: '#1c1c1c', background: '#fff5f5', border: '1px solid #f3c1c1', padding: '12px 14px', borderRadius: '10px', margin: '14px 0' }
const link = { color: '#c0392b', fontWeight: 600, textDecoration: 'underline' }
const hr = { border: 'none', borderTop: '1px solid #ededed', margin: '28px 0 18px' }
const footer = { fontSize: '12px', color: '#8c8c8c', margin: '4px 0' }