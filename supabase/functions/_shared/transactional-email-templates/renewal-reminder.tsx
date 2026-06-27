/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Row, Column, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  planName?: string
  endDate?: string
  daysLeft?: number | string
  renewUrl?: string
}

const Email = ({
  name = '', planName = '—', endDate = '—', daysLeft = 7,
  renewUrl = 'https://sthmethod.com.br/dashboard/pagar',
}: Props) => {
  const first = (name || '').split(' ')[0]
  const dLeft = Number(daysLeft)
  const urgency = dLeft <= 1 ? 'amanhã' : dLeft === 0 ? 'hoje' : `em ${dLeft} dias`
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>Seu Programa STH METHOD vence {urgency}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandRow}>
            <Text style={brand}>STH METHOD</Text>
            <Text style={badge}>RENOVAÇÃO</Text>
          </Section>
          <Heading style={h1}>Seu Programa vence {urgency}</Heading>
          <Text style={text}>
            Olá{first ? `, ${first}` : ''}! Seu Programa de Acompanhamento STH METHOD possui prazo determinado e encerra {urgency}.
            Para manter o acesso à plataforma e a continuidade do acompanhamento, renove antes do vencimento.
          </Text>

          <Section style={card}>
            <Row><Column style={lbl}>Plano atual</Column><Column style={val}>{planName}</Column></Row>
            <Row><Column style={lbl}>Vencimento</Column><Column style={val}>{endDate}</Column></Row>
          </Section>

          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
            <Button href={renewUrl} style={button}>Renovar agora</Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            Encerrada a vigência, o acesso à plataforma é encerrado automaticamente. A renovação reinicia um novo ciclo do Programa.
          </Text>
          <Text style={footer}>STH METHOD · sthmethod.com.br</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: ({ daysLeft }: Props) => {
    const d = Number(daysLeft ?? 7)
    if (d <= 0) return 'Seu Programa STH METHOD vence hoje'
    if (d === 1) return 'Seu Programa STH METHOD vence amanhã'
    return `Seu Programa STH METHOD vence em ${d} dias`
  },
  displayName: 'Lembrete de renovação',
  previewData: {
    name: 'João Silva', planName: 'Plano Premium', endDate: '21/06/2026',
    daysLeft: 7, renewUrl: 'https://sthmethod.com.br/dashboard/pagar',
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
const button = { backgroundColor: '#121212', color: '#ffffff', padding: '14px 28px', borderRadius: '14px', textDecoration: 'none', fontWeight: 600, fontSize: '15px' }
const hr = { border: 'none', borderTop: '1px solid #ededed', margin: '28px 0 18px' }
const footer = { fontSize: '12px', color: '#8c8c8c', margin: '4px 0' }