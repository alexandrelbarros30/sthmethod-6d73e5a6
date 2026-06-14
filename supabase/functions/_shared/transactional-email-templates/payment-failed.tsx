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
  reason?: string
  retryUrl?: string
}

const Email = ({
  name = '', planName = '—', amount = '—', paymentMethod = '—',
  reason = 'O pagamento não foi autorizado pela operadora.',
  retryUrl = 'https://sthmethod.com.br/dashboard/pagar',
}: Props) => {
  const first = (name || '').split(' ')[0]
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>Não conseguimos processar seu pagamento</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandRow}>
            <Text style={brand}>STH METHOD</Text>
            <Text style={badge}>PAGAMENTO RECUSADO</Text>
          </Section>
          <Heading style={h1}>Não foi possível concluir seu pagamento</Heading>
          <Text style={text}>
            Olá{first ? `, ${first}` : ''}, infelizmente seu pagamento não foi autorizado. Você pode tentar novamente com outro método.
          </Text>

          <Section style={card}>
            <Row><Column style={lbl}>Plano</Column><Column style={val}>{planName}</Column></Row>
            <Row><Column style={lbl}>Valor</Column><Column style={val}>{amount}</Column></Row>
            <Row><Column style={lbl}>Forma</Column><Column style={val}>{paymentMethod}</Column></Row>
            <Row><Column style={lbl}>Motivo</Column><Column style={val}>{reason}</Column></Row>
          </Section>

          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
            <Button href={retryUrl} style={button}>Tentar novamente</Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>Dúvidas? Responda este e-mail ou fale conosco no WhatsApp.</Text>
          <Text style={footer}>STH METHOD · sthmethod.com.br</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: 'Pagamento não autorizado — STH METHOD',
  displayName: 'Pagamento recusado',
  previewData: {
    name: 'João Silva', planName: 'Plano Premium', amount: 'R$ 497,00',
    paymentMethod: 'Cartão de crédito',
    reason: 'Cartão recusado pela operadora',
    retryUrl: 'https://sthmethod.com.br/dashboard/pagar',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif', color: '#1c1c1c' }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const brandRow = { paddingBottom: '24px', borderBottom: '1px solid #ededed', marginBottom: '24px' }
const brand = { fontSize: '13px', letterSpacing: '0.18em', fontWeight: 700, color: '#121212', margin: 0 }
const badge = { fontSize: '11px', letterSpacing: '0.16em', color: '#c0392b', margin: '6px 0 0' }
const h1 = { fontSize: '22px', fontWeight: 700, color: '#121212', margin: '0 0 14px' }
const text = { fontSize: '15px', lineHeight: '1.6', color: '#3a3a3a', margin: '0 0 20px' }
const card = { backgroundColor: '#fafafa', border: '1px solid #ededed', borderRadius: '14px', padding: '18px 20px', margin: '8px 0' }
const lbl = { fontSize: '13px', color: '#8c8c8c', padding: '6px 0', width: '45%' }
const val = { fontSize: '14px', color: '#121212', fontWeight: 600, padding: '6px 0', textAlign: 'right' as const }
const button = { backgroundColor: '#121212', color: '#ffffff', padding: '14px 28px', borderRadius: '14px', textDecoration: 'none', fontWeight: 600, fontSize: '15px' }
const hr = { border: 'none', borderTop: '1px solid #ededed', margin: '28px 0 18px' }
const footer = { fontSize: '12px', color: '#8c8c8c', margin: '4px 0' }