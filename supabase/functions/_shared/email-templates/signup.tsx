/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirme seu e-mail no STH METHOD</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandRow}>
          <Text style={brand}>STH METHOD</Text>
          <Text style={badge}>CONFIRMAÇÃO DE CADASTRO</Text>
        </Section>
        <Heading style={h1}>Confirme seu e-mail</Heading>
        <Text style={text}>
          Recebemos seu cadastro com o e-mail{' '}
          <Link href={`mailto:${recipient}`} style={link}>{recipient}</Link>. Para
          ativar seu acesso à plataforma, clique no botão abaixo:
        </Text>
        <Section style={{ textAlign: 'center', margin: '28px 0' }}>
          <Button style={button} href={confirmationUrl}>Confirmar e-mail</Button>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          Se você não criou esta conta, ignore esta mensagem com segurança.
        </Text>
        <Text style={footer}>STH METHOD · sthmethod.com.br</Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif', color: '#1c1c1c' }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const brandRow = { paddingBottom: '24px', borderBottom: '1px solid #ededed', marginBottom: '24px' }
const brand = { fontSize: '13px', letterSpacing: '0.18em', fontWeight: 700, color: '#121212', margin: 0 }
const badge = { fontSize: '11px', letterSpacing: '0.16em', color: '#8c8c8c', margin: '6px 0 0' }
const h1 = { fontSize: '22px', fontWeight: 700, color: '#121212', margin: '0 0 14px' }
const text = { fontSize: '15px', lineHeight: '1.6', color: '#3a3a3a', margin: '0 0 14px' }
const link = { color: '#121212', textDecoration: 'underline' }
const button = { backgroundColor: '#121212', color: '#ffffff', padding: '14px 28px', borderRadius: '14px', textDecoration: 'none', fontWeight: 600, fontSize: '15px' }
const hr = { border: 'none', borderTop: '1px solid #ededed', margin: '32px 0 20px' }
const footer = { fontSize: '12px', color: '#8c8c8c', margin: '4px 0' }
