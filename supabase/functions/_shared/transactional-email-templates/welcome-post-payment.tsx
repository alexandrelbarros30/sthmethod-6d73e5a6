/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  planName?: string
  endDate?: string
  dashboardUrl?: string
}

const Email = ({
  name = '', planName = '—', endDate = '—',
  dashboardUrl = 'https://sthmethod.com.br/dashboard',
}: Props) => {
  const first = (name || '').split(' ')[0]
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>Seu Programa STH METHOD foi liberado</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandRow}>
            <Text style={brand}>STH METHOD</Text>
            <Text style={badge}>ACESSO LIBERADO</Text>
          </Section>
          <Heading style={h1}>Bem-vindo{first ? `, ${first}` : ''}.</Heading>
          <Text style={text}>
            Você acaba de contratar o <strong>{planName}</strong>, um Programa de Acompanhamento em Saúde e Performance da STH METHOD,
            com vigência até <strong>{endDate}</strong>. Durante esse período você terá acesso ao ecossistema digital,
            ao planejamento, ajustes e suporte da equipe.
          </Text>
          <Text style={text}><strong>Próximos passos</strong></Text>
          <Text style={step}>1. Acesse a plataforma e complete sua avaliação (peso, NEAT, fotos).</Text>
          <Text style={step}>2. Receba o planejamento alimentar e o programa de treino.</Text>
          <Text style={step}>3. Acompanhe seus check-ins e mantenha a equipe informada.</Text>

          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
            <Button href={dashboardUrl} style={button}>Acessar área do aluno</Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            Importante: o Programa possui <strong>prazo determinado</strong>. Encerrada a vigência, o acesso à plataforma é
            encerrado, podendo ser renovado a qualquer momento. A STH METHOD não garante resultados específicos.
          </Text>
          <Text style={footer}>
            <Link href="https://sthmethod.com.br/termo" style={footerLink}>Termo de Adesão</Link>
            {' · '}
            <Link href="https://sthmethod.com.br/privacidade" style={footerLink}>Política de Privacidade</Link>
            {' · '}
            <Link href="https://sthmethod.com.br/faq" style={footerLink}>Dúvidas frequentes</Link>
          </Text>
          <Text style={footer}>STH METHOD · sthmethod.com.br</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: 'Programa liberado — Bem-vindo à STH METHOD',
  displayName: 'Boas-vindas pós-pagamento (Programa)',
  previewData: {
    name: 'João Silva', planName: 'Plano 90D',
    endDate: '14/09/2026', dashboardUrl: 'https://sthmethod.com.br/dashboard',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif', color: '#1c1c1c' }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const brandRow = { paddingBottom: '24px', borderBottom: '1px solid #ededed', marginBottom: '24px' }
const brand = { fontSize: '13px', letterSpacing: '0.18em', fontWeight: 700, color: '#121212', margin: 0 }
const badge = { fontSize: '11px', letterSpacing: '0.16em', color: '#1f8a4c', margin: '6px 0 0' }
const h1 = { fontSize: '24px', fontWeight: 700, color: '#121212', margin: '0 0 16px' }
const text = { fontSize: '15px', lineHeight: '1.6', color: '#3a3a3a', margin: '0 0 12px' }
const step = { fontSize: '14px', lineHeight: '1.6', color: '#1c1c1c', margin: '4px 0', paddingLeft: '6px' }
const button = { backgroundColor: '#121212', color: '#ffffff', padding: '14px 28px', borderRadius: '14px', textDecoration: 'none', fontWeight: 600, fontSize: '15px' }
const hr = { border: 'none', borderTop: '1px solid #ededed', margin: '32px 0 20px' }
const footer = { fontSize: '12px', color: '#8c8c8c', margin: '4px 0' }
const footerLink = { color: '#8c8c8c', textDecoration: 'underline' }