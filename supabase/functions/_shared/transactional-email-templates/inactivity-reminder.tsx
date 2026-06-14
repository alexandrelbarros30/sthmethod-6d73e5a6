/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  daysInactive?: number | string
  dashboardUrl?: string
}

const Email = ({
  name = '', daysInactive = 7,
  dashboardUrl = 'https://sthmethod.com.br/dashboard',
}: Props) => {
  const first = (name || '').split(' ')[0]
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>Sentimos sua falta na plataforma</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandRow}>
            <Text style={brand}>STH METHOD</Text>
            <Text style={badge}>VOLTAR À ROTINA</Text>
          </Section>
          <Heading style={h1}>Sentimos sua falta 💪</Heading>
          <Text style={text}>
            Olá{first ? `, ${first}` : ''}, faz {daysInactive} dias que você não acessa a plataforma. Sua consultoria continua ativa e te esperando.
          </Text>
          <Text style={text}>
            Volte para registrar sua evolução, conferir sua dieta e manter a constância do protocolo.
          </Text>

          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
            <Button href={dashboardUrl} style={button}>Voltar para minha plataforma</Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>Disciplina é a ponte entre objetivo e resultado.</Text>
          <Text style={footer}>STH METHOD · sthmethod.com.br</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: 'Sentimos sua falta — STH METHOD',
  displayName: 'Aviso de inatividade',
  previewData: {
    name: 'João Silva', daysInactive: 7,
    dashboardUrl: 'https://sthmethod.com.br/dashboard',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif', color: '#1c1c1c' }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const brandRow = { paddingBottom: '24px', borderBottom: '1px solid #ededed', marginBottom: '24px' }
const brand = { fontSize: '13px', letterSpacing: '0.18em', fontWeight: 700, color: '#121212', margin: 0 }
const badge = { fontSize: '11px', letterSpacing: '0.16em', color: '#8c8c8c', margin: '6px 0 0' }
const h1 = { fontSize: '24px', fontWeight: 700, color: '#121212', margin: '0 0 16px' }
const text = { fontSize: '15px', lineHeight: '1.6', color: '#3a3a3a', margin: '0 0 14px' }
const button = { backgroundColor: '#121212', color: '#ffffff', padding: '14px 28px', borderRadius: '14px', textDecoration: 'none', fontWeight: 600, fontSize: '15px' }
const hr = { border: 'none', borderTop: '1px solid #ededed', margin: '32px 0 20px' }
const footer = { fontSize: '12px', color: '#8c8c8c', margin: '4px 0' }