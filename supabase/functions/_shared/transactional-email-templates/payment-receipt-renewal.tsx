/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Row, Column, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  planName?: string
  amount?: string
  paymentMethod?: string
  paymentDate?: string
  paymentId?: string
  endDate?: string
  loginUrl?: string
}

const Email = ({
  name = '', planName = '—', amount = '—', paymentMethod = '—',
  paymentDate = '—', paymentId = '—', endDate = '—',
  loginUrl = 'https://sthmethod.com.br/dashboard',
}: Props) => {
  const first = (name || '').split(' ')[0]
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>Renovação confirmada — STH METHOD</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandRow}>
            <Text style={brand}>STH METHOD</Text>
            <Text style={badge}>RECIBO · RENOVAÇÃO</Text>
          </Section>
          <Heading style={h1}>Renovação confirmada 🔄</Heading>
          <Text style={text}>
            Obrigado por continuar com a gente{first ? `, ${first}` : ''}! Seu acesso à plataforma foi renovado.
          </Text>

          <Section style={card}>
            <Row><Column style={lbl}>Plano</Column><Column style={val}>{planName}</Column></Row>
            <Row><Column style={lbl}>Valor pago</Column><Column style={val}>{amount}</Column></Row>
            <Row><Column style={lbl}>Forma</Column><Column style={val}>{paymentMethod}</Column></Row>
            <Row><Column style={lbl}>Data</Column><Column style={val}>{paymentDate}</Column></Row>
            <Row><Column style={lbl}>Novo vencimento</Column><Column style={val}>{endDate}</Column></Row>
            <Row><Column style={lbl}>ID</Column><Column style={valSmall}>{paymentId}</Column></Row>
          </Section>

          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
            <Button href={loginUrl} style={button}>Acessar plataforma</Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>Este e-mail serve como comprovante da sua renovação.</Text>
          <Text style={footer}>STH METHOD · sthmethod.com.br</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: 'Renovação confirmada — STH METHOD',
  displayName: 'Recibo — Renovação',
  previewData: {
    name: 'João Silva', planName: 'Plano Premium', amount: 'R$ 497,00',
    paymentMethod: 'Pix', paymentDate: '14/06/2026',
    paymentId: 'MP-9876543210', endDate: '14/09/2026',
    loginUrl: 'https://sthmethod.com.br/dashboard',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif', color: '#1c1c1c' }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const brandRow = { paddingBottom: '24px', borderBottom: '1px solid #ededed', marginBottom: '24px' }
const brand = { fontSize: '13px', letterSpacing: '0.18em', fontWeight: 700, color: '#121212', margin: 0 }
const badge = { fontSize: '11px', letterSpacing: '0.16em', color: '#8c8c8c', margin: '6px 0 0' }
const h1 = { fontSize: '22px', fontWeight: 700, color: '#121212', margin: '0 0 14px' }
const text = { fontSize: '15px', lineHeight: '1.6', color: '#3a3a3a', margin: '0 0 20px' }
const card = {
  backgroundColor: '#fafafa', border: '1px solid #ededed', borderRadius: '14px',
  padding: '18px 20px', margin: '8px 0',
}
const lbl = { fontSize: '13px', color: '#8c8c8c', padding: '6px 0', width: '45%' }
const val = { fontSize: '14px', color: '#121212', fontWeight: 600, padding: '6px 0', textAlign: 'right' as const }
const valSmall = { fontSize: '12px', color: '#3a3a3a', padding: '6px 0', textAlign: 'right' as const, fontFamily: 'monospace' }
const button = {
  backgroundColor: '#121212', color: '#ffffff', padding: '14px 28px',
  borderRadius: '14px', textDecoration: 'none', fontWeight: 600, fontSize: '15px',
}
const hr = { border: 'none', borderTop: '1px solid #ededed', margin: '28px 0 18px' }
const footer = { fontSize: '12px', color: '#8c8c8c', margin: '4px 0' }