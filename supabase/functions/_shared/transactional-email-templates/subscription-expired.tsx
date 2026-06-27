/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  planName?: string
  expiredOn?: string
  renewUrl?: string
}

const Email = ({
  name = '', planName = '—', expiredOn = '—',
  renewUrl = 'https://sthmethod.com.br/dashboard/pagar',
}: Props) => {
  const first = (name || '').split(' ')[0]
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>Seu Programa STH METHOD foi encerrado</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandRow}>
            <Text style={brand}>STH METHOD</Text>
            <Text style={badge}>PROGRAMA ENCERRADO</Text>
          </Section>
          <Heading style={h1}>Seu Programa foi encerrado</Heading>
          <Text style={text}>
            Olá{first ? `, ${first}` : ''}, o prazo determinado do seu <strong>{planName}</strong> chegou ao fim em {expiredOn}.
            Conforme previsto no Termo de Adesão, o acesso à plataforma foi encerrado automaticamente.
          </Text>
          <Text style={text}>
            Você pode contratar um novo ciclo do Programa a qualquer momento. Seus dados de evolução permanecem armazenados conforme a Política de Privacidade.
          </Text>

          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
            <Button href={renewUrl} style={button}>Contratar novo ciclo</Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>Foi um prazer acompanhar sua jornada. Estamos aqui quando quiser iniciar um novo ciclo.</Text>
          <Text style={footer}>STH METHOD · sthmethod.com.br</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: 'Seu Programa STH METHOD foi encerrado',
  displayName: 'Programa encerrado (vigência)',
  previewData: {
    name: 'João Silva', planName: 'Plano Premium',
    expiredOn: '14/06/2026', renewUrl: 'https://sthmethod.com.br/dashboard/pagar',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif', color: '#1c1c1c' }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const brandRow = { paddingBottom: '24px', borderBottom: '1px solid #ededed', marginBottom: '24px' }
const brand = { fontSize: '13px', letterSpacing: '0.18em', fontWeight: 700, color: '#121212', margin: 0 }
const badge = { fontSize: '11px', letterSpacing: '0.16em', color: '#8c8c8c', margin: '6px 0 0' }
const h1 = { fontSize: '22px', fontWeight: 700, color: '#121212', margin: '0 0 14px' }
const text = { fontSize: '15px', lineHeight: '1.6', color: '#3a3a3a', margin: '0 0 14px' }
const button = { backgroundColor: '#121212', color: '#ffffff', padding: '14px 28px', borderRadius: '14px', textDecoration: 'none', fontWeight: 600, fontSize: '15px' }
const hr = { border: 'none', borderTop: '1px solid #ededed', margin: '32px 0 20px' }
const footer = { fontSize: '12px', color: '#8c8c8c', margin: '4px 0' }