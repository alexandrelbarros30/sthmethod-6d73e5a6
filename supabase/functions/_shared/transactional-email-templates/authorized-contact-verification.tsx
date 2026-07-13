/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  studentName?: string
  holderName?: string
  relationship?: string
  phoneMasked?: string
  confirmationUrl?: string
  expiresInHours?: number
  supportUrl?: string
}

const relLabels: Record<string, string> = {
  marido: 'Marido',
  esposa: 'Esposa',
  parceiro: 'Parceiro(a)',
  pai_mae: 'Pai / Mãe',
  filho_filha: 'Filho(a)',
  responsavel: 'Responsável legal',
  outro: 'Outro',
}

const Email = ({
  studentName = '',
  holderName = '',
  relationship = 'outro',
  phoneMasked = '',
  confirmationUrl = 'https://sthmethod.com',
  expiresInHours = 48,
  supportUrl = 'https://wa.me/5521998496289',
}: Props) => {
  const first = (studentName || '').split(' ')[0]
  const rel = relLabels[relationship] || relationship
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>Confirme a autorização de um telefone adicional na STH METHOD</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandRow}>
            <Text style={brand}>STH METHOD</Text>
            <Text style={badge}>AUTORIZAÇÃO DE CONTATO ADICIONAL</Text>
          </Section>

          <Heading style={h1}>Confirme a autorização</Heading>
          <Text style={text}>
            Olá{first ? `, ${first}` : ''}. Recebemos uma solicitação para autorizar um telefone adicional a tratar do seu acompanhamento com nossa equipe.
          </Text>

          <Section style={infoBox}>
            <Text style={infoLine}><strong>Titular do telefone:</strong> {holderName}</Text>
            <Text style={infoLine}><strong>Relação:</strong> {rel}</Text>
            <Text style={infoLine}><strong>Telefone:</strong> {phoneMasked}</Text>
          </Section>

          <Text style={text}>
            Por segurança e conformidade com a LGPD, precisamos que <strong>você confirme</strong> essa autorização clicando no botão abaixo:
          </Text>

          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button href={confirmationUrl} style={button}>Confirmar ou recusar</Button>
          </Section>

          <Text style={smallText}>
            Este link é único, pessoal e válido por <strong>{expiresInHours} horas</strong>. Você poderá autorizar ou recusar — sem obrigação.
          </Text>

          <Text style={alert}>
            ⚠️ Se você <strong>não solicitou</strong>, ignore este e-mail e fale com nossa equipe imediatamente: <a href={supportUrl} style={link}>suporte STH METHOD</a>.
          </Text>

          <Hr style={hr} />
          <Text style={footer}>STH METHOD · sthmethod.com.br</Text>
          <Text style={footerSmall}>Você pode revogar essa autorização a qualquer momento pela plataforma.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: 'Confirme a autorização de um telefone adicional — STH METHOD',
  displayName: 'Autorização de contato adicional',
  previewData: {
    studentName: 'Maria Silva',
    holderName: 'João Silva',
    relationship: 'marido',
    phoneMasked: '••••••••4304',
    confirmationUrl: 'https://sthmethod.com/autorizar-telefone?token=demo',
    expiresInHours: 48,
    supportUrl: 'https://wa.me/5521998496289',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif', color: '#1c1c1c' }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const brandRow = { paddingBottom: '24px', borderBottom: '1px solid #ededed', marginBottom: '24px' }
const brand = { fontSize: '13px', letterSpacing: '0.18em', fontWeight: 700, color: '#121212', margin: 0 }
const badge = { fontSize: '11px', letterSpacing: '0.16em', color: '#8c8c8c', margin: '6px 0 0' }
const h1 = { fontSize: '22px', fontWeight: 700, color: '#121212', margin: '0 0 14px' }
const text = { fontSize: '15px', lineHeight: '1.6', color: '#3a3a3a', margin: '0 0 16px' }
const smallText = { fontSize: '13px', lineHeight: '1.5', color: '#666', margin: '10px 0' }
const infoBox = { background: '#f5f5f7', border: '1px solid #e5e5e5', borderRadius: '12px', padding: '14px 18px', margin: '14px 0' }
const infoLine = { fontSize: '14px', lineHeight: '1.6', color: '#1c1c1c', margin: '4px 0' }
const button = { background: '#00e676', color: '#08110a', padding: '14px 28px', borderRadius: '999px', fontWeight: 700, fontSize: '15px', textDecoration: 'none', display: 'inline-block' }
const alert = { fontSize: '13px', lineHeight: '1.5', color: '#1c1c1c', background: '#fff5f5', border: '1px solid #f3c1c1', padding: '12px 14px', borderRadius: '10px', margin: '18px 0 6px' }
const link = { color: '#c0392b', fontWeight: 600, textDecoration: 'underline' }
const hr = { border: 'none', borderTop: '1px solid #ededed', margin: '24px 0 16px' }
const footer = { fontSize: '12px', color: '#8c8c8c', margin: '4px 0' }
const footerSmall = { fontSize: '11px', color: '#a8a8a8', margin: '4px 0' }