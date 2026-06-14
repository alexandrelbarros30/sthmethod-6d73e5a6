/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Preview, Row, Column, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  couponCode?: string
  discount?: string
  originalAmount?: string
  finalAmount?: string
  planName?: string
}

const Email = ({
  name = '', couponCode = '—', discount = '—',
  originalAmount = '—', finalAmount = '—', planName = '—',
}: Props) => {
  const first = (name || '').split(' ')[0]
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>Cupom aplicado com sucesso</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandRow}>
            <Text style={brand}>STH METHOD</Text>
            <Text style={badge}>CUPOM APLICADO</Text>
          </Section>
          <Heading style={h1}>Desconto confirmado 🎟️</Heading>
          <Text style={text}>
            Olá{first ? `, ${first}` : ''}! Seu cupom foi aplicado com sucesso.
          </Text>

          <Section style={card}>
            <Row><Column style={lbl}>Plano</Column><Column style={val}>{planName}</Column></Row>
            <Row><Column style={lbl}>Cupom</Column><Column style={valMono}>{couponCode}</Column></Row>
            <Row><Column style={lbl}>Desconto</Column><Column style={val}>{discount}</Column></Row>
            <Row><Column style={lbl}>Valor original</Column><Column style={valOld}>{originalAmount}</Column></Row>
            <Row><Column style={lbl}>Valor final</Column><Column style={valHighlight}>{finalAmount}</Column></Row>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>Continue o checkout na plataforma para finalizar.</Text>
          <Text style={footer}>STH METHOD · sthmethod.com.br</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: 'Cupom aplicado — STH METHOD',
  displayName: 'Cupom aplicado',
  previewData: {
    name: 'João Silva', couponCode: 'BLACK20', discount: '20%',
    originalAmount: 'R$ 497,00', finalAmount: 'R$ 397,60', planName: 'Plano Premium',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif', color: '#1c1c1c' }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const brandRow = { paddingBottom: '24px', borderBottom: '1px solid #ededed', marginBottom: '24px' }
const brand = { fontSize: '13px', letterSpacing: '0.18em', fontWeight: 700, color: '#121212', margin: 0 }
const badge = { fontSize: '11px', letterSpacing: '0.16em', color: '#1f8a4c', margin: '6px 0 0' }
const h1 = { fontSize: '22px', fontWeight: 700, color: '#121212', margin: '0 0 14px' }
const text = { fontSize: '15px', lineHeight: '1.6', color: '#3a3a3a', margin: '0 0 20px' }
const card = { backgroundColor: '#fafafa', border: '1px solid #ededed', borderRadius: '14px', padding: '18px 20px', margin: '8px 0' }
const lbl = { fontSize: '13px', color: '#8c8c8c', padding: '6px 0', width: '45%' }
const val = { fontSize: '14px', color: '#121212', fontWeight: 600, padding: '6px 0', textAlign: 'right' as const }
const valMono = { fontSize: '13px', color: '#121212', fontWeight: 700, padding: '6px 0', textAlign: 'right' as const, fontFamily: 'monospace' }
const valOld = { fontSize: '13px', color: '#8c8c8c', padding: '6px 0', textAlign: 'right' as const, textDecoration: 'line-through' }
const valHighlight = { fontSize: '16px', color: '#1f8a4c', fontWeight: 700, padding: '6px 0', textAlign: 'right' as const }
const hr = { border: 'none', borderTop: '1px solid #ededed', margin: '28px 0 18px' }
const footer = { fontSize: '12px', color: '#8c8c8c', margin: '4px 0' }