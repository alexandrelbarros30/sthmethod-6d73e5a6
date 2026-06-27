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
  paymentId?: string
  pixCopyPaste?: string
  pixExpiresAt?: string
  retryUrl?: string
}

const Email = ({
  name = '', planName = '—', amount = '—', paymentMethod = 'Pix',
  paymentId = '—', pixCopyPaste = '', pixExpiresAt = '',
  retryUrl = 'https://sthmethod.com.br/dashboard/pagar',
}: Props) => {
  const first = (name || '').split(' ')[0]
  const isPix = /pix/i.test(paymentMethod)
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>Pagamento aguardando confirmação</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandRow}>
            <Text style={brand}>STH METHOD</Text>
            <Text style={badge}>PAGAMENTO PENDENTE</Text>
          </Section>
          <Heading style={h1}>Estamos aguardando seu pagamento ⏳</Heading>
          <Text style={text}>
            Olá{first ? `, ${first}` : ''}! Recebemos sua solicitação de contratação do Programa de Acompanhamento STH METHOD e aguardamos a confirmação do pagamento para liberar o acesso pelo prazo determinado.
          </Text>

          <Section style={card}>
            <Row><Column style={lbl}>Plano</Column><Column style={val}>{planName}</Column></Row>
            <Row><Column style={lbl}>Valor</Column><Column style={val}>{amount}</Column></Row>
            <Row><Column style={lbl}>Forma</Column><Column style={val}>{paymentMethod}</Column></Row>
            {pixExpiresAt ? (
              <Row><Column style={lbl}>Expira em</Column><Column style={val}>{pixExpiresAt}</Column></Row>
            ) : null}
            <Row><Column style={lbl}>ID</Column><Column style={valSmall}>{paymentId}</Column></Row>
          </Section>

          {isPix && pixCopyPaste ? (
            <Section style={pixBox}>
              <Text style={pixLabel}>Pix copia e cola</Text>
              <Text style={pixCode}>{pixCopyPaste}</Text>
            </Section>
          ) : null}

          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
            <Button href={retryUrl} style={button}>Concluir pagamento</Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>Assim que confirmarmos, você receberá o recibo por e-mail e o acesso será liberado.</Text>
          <Text style={footer}>STH METHOD · sthmethod.com.br</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: 'Pagamento aguardando confirmação — STH METHOD',
  displayName: 'Pagamento pendente',
  previewData: {
    name: 'João Silva', planName: 'Plano Premium', amount: 'R$ 497,00',
    paymentMethod: 'Pix', paymentId: 'MP-1234567890',
    pixCopyPaste: '00020126580014BR.GOV.BCB.PIX...',
    pixExpiresAt: '15/06/2026 23:59',
    retryUrl: 'https://sthmethod.com.br/dashboard/pagar',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif', color: '#1c1c1c' }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const brandRow = { paddingBottom: '24px', borderBottom: '1px solid #ededed', marginBottom: '24px' }
const brand = { fontSize: '13px', letterSpacing: '0.18em', fontWeight: 700, color: '#121212', margin: 0 }
const badge = { fontSize: '11px', letterSpacing: '0.16em', color: '#b58900', margin: '6px 0 0' }
const h1 = { fontSize: '22px', fontWeight: 700, color: '#121212', margin: '0 0 14px' }
const text = { fontSize: '15px', lineHeight: '1.6', color: '#3a3a3a', margin: '0 0 20px' }
const card = { backgroundColor: '#fafafa', border: '1px solid #ededed', borderRadius: '14px', padding: '18px 20px', margin: '8px 0' }
const lbl = { fontSize: '13px', color: '#8c8c8c', padding: '6px 0', width: '45%' }
const val = { fontSize: '14px', color: '#121212', fontWeight: 600, padding: '6px 0', textAlign: 'right' as const }
const valSmall = { fontSize: '12px', color: '#3a3a3a', padding: '6px 0', textAlign: 'right' as const, fontFamily: 'monospace' }
const pixBox = { backgroundColor: '#fffdf3', border: '1px dashed #e7d27a', borderRadius: '12px', padding: '14px 16px', margin: '12px 0 0' }
const pixLabel = { fontSize: '11px', letterSpacing: '0.14em', color: '#8c8c8c', margin: '0 0 6px' }
const pixCode = { fontSize: '12px', color: '#1c1c1c', fontFamily: 'monospace', wordBreak: 'break-all' as const, margin: 0 }
const button = { backgroundColor: '#121212', color: '#ffffff', padding: '14px 28px', borderRadius: '14px', textDecoration: 'none', fontWeight: 600, fontSize: '15px' }
const hr = { border: 'none', borderTop: '1px solid #ededed', margin: '28px 0 18px' }
const footer = { fontSize: '12px', color: '#8c8c8c', margin: '4px 0' }