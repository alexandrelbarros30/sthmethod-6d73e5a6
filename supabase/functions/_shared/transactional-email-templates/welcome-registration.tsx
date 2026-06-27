/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  loginUrl?: string
}

const Email = ({ name = '', loginUrl = 'https://sthmethod.com.br/login' }: Props) => {
  const first = (name || '').split(' ')[0]
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>Bem-vindo(a) à STH METHOD</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandRow}>
            <Text style={brand}>STH METHOD</Text>
          </Section>
          <Heading style={h1}>Bem-vindo{first ? `, ${first}` : ''} 👊</Heading>
          <Text style={text}>
            Seu cadastro na plataforma <strong>STH METHOD</strong> foi concluído com sucesso.
          </Text>
          <Text style={text}>
            Após a contratação de um plano, seu acesso ao Programa de Acompanhamento STH METHOD será liberado pelo prazo determinado escolhido.
          </Text>
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button href={loginUrl} style={button}>Acessar plataforma</Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Em caso de dúvidas, responda este e-mail ou fale com nossa equipe pelo WhatsApp.
          </Text>
          <Text style={footer}>STH METHOD · sthmethod.com.br</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: 'Bem-vindo(a) à STH METHOD',
  displayName: 'Boas-vindas — Cadastro',
  previewData: { name: 'João Silva', loginUrl: 'https://sthmethod.com.br/login' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif', color: '#1c1c1c' }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const brandRow = { paddingBottom: '24px', borderBottom: '1px solid #ededed', marginBottom: '24px' }
const brand = { fontSize: '13px', letterSpacing: '0.18em', fontWeight: 700, color: '#121212', margin: 0 }
const h1 = { fontSize: '24px', fontWeight: 700, color: '#121212', margin: '0 0 16px' }
const text = { fontSize: '15px', lineHeight: '1.6', color: '#3a3a3a', margin: '0 0 14px' }
const button = {
  backgroundColor: '#121212', color: '#ffffff', padding: '14px 28px',
  borderRadius: '14px', textDecoration: 'none', fontWeight: 600, fontSize: '15px',
}
const hr = { border: 'none', borderTop: '1px solid #ededed', margin: '32px 0 20px' }
const footer = { fontSize: '12px', color: '#8c8c8c', margin: '4px 0' }