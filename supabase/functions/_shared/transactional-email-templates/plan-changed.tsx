/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Row, Column, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  previousPlan?: string
  newPlan?: string
  effectiveDate?: string
  endDate?: string
  changeType?: 'upgrade' | 'downgrade' | 'change'
  dashboardUrl?: string
}

const labels: Record<string, string> = {
  upgrade: 'UPGRADE DE PLANO',
  downgrade: 'ALTERAÇÃO DE PLANO',
  change: 'ALTERAÇÃO DE PLANO',
}

const Email = ({
  name = '', previousPlan = '—', newPlan = '—',
  effectiveDate = '—', endDate = '—', changeType = 'change',
  dashboardUrl = 'https://sthmethod.com.br/dashboard',
}: Props) => {
  const first = (name || '').split(' ')[0]
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>Seu plano foi atualizado</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandRow}>
            <Text style={brand}>STH METHOD</Text>
            <Text style={badge}>{labels[changeType] ?? labels.change}</Text>
          </Section>
          <Heading style={h1}>Plano atualizado ✅</Heading>
          <Text style={text}>
            Olá{first ? `, ${first}` : ''}! Confirmamos a alteração do seu Programa de Acompanhamento, com nova vigência por prazo determinado conforme abaixo.
          </Text>

          <Section style={card}>
            <Row><Column style={lbl}>Plano anterior</Column><Column style={valOld}>{previousPlan}</Column></Row>
            <Row><Column style={lbl}>Novo plano</Column><Column style={valHighlight}>{newPlan}</Column></Row>
            <Row><Column style={lbl}>Vigência a partir de</Column><Column style={val}>{effectiveDate}</Column></Row>
            <Row><Column style={lbl}>Válido até</Column><Column style={val}>{endDate}</Column></Row>
          </Section>

          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
            <Button href={dashboardUrl} style={button}>Acessar plataforma</Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>Dúvidas sobre a cobrança? Responda este e-mail.</Text>
          <Text style={footer}>
            Programa por prazo determinado. Encerrada a vigência, o acesso à plataforma é encerrado automaticamente.
          </Text>
          <Text style={footer}>STH METHOD · sthmethod.com.br</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: 'Plano atualizado — STH METHOD',
  displayName: 'Mudança de plano',
  previewData: {
    name: 'João Silva', previousPlan: 'Plano Essencial', newPlan: 'Plano Premium',
    effectiveDate: '14/06/2026', endDate: '14/09/2026', changeType: 'upgrade',
    dashboardUrl: 'https://sthmethod.com.br/dashboard',
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
const lbl = { fontSize: '13px', color: '#8c8c8c', padding: '6px 0', width: '45%' }
const val = { fontSize: '14px', color: '#121212', fontWeight: 600, padding: '6px 0', textAlign: 'right' as const }
const valOld = { fontSize: '14px', color: '#8c8c8c', padding: '6px 0', textAlign: 'right' as const, textDecoration: 'line-through' }
const valHighlight = { fontSize: '15px', color: '#121212', fontWeight: 700, padding: '6px 0', textAlign: 'right' as const }
const button = { backgroundColor: '#121212', color: '#ffffff', padding: '14px 28px', borderRadius: '14px', textDecoration: 'none', fontWeight: 600, fontSize: '15px' }
const hr = { border: 'none', borderTop: '1px solid #ededed', margin: '28px 0 18px' }
const footer = { fontSize: '12px', color: '#8c8c8c', margin: '4px 0' }