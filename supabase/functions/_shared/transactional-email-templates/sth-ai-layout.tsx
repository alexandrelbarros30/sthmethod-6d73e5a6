/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'

export const aiMain = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif', color: '#1c1c1c' }
export const aiContainer = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
export const aiBrandRow = { paddingBottom: '24px', borderBottom: '1px solid #ededed', marginBottom: '24px' }
export const aiBrand = { fontSize: '13px', letterSpacing: '0.18em', fontWeight: 700, color: '#0b5f57', margin: 0 }
export const aiH1 = { fontSize: '24px', fontWeight: 700, color: '#121212', margin: '0 0 16px' }
export const aiText = { fontSize: '15px', lineHeight: '1.6', color: '#3a3a3a', margin: '0 0 14px' }
export const aiButton = {
  backgroundColor: '#0b5f57', color: '#ffffff', padding: '14px 28px',
  borderRadius: '14px', textDecoration: 'none', fontWeight: 600, fontSize: '15px',
}
export const aiHr = { border: 'none', borderTop: '1px solid #ededed', margin: '32px 0 20px' }
export const aiFooter = { fontSize: '12px', color: '#8c8c8c', margin: '4px 0' }
export const aiBox = {
  backgroundColor: '#f4faf8', border: '1px solid #dcefea', borderRadius: '14px',
  padding: '16px 18px', margin: '0 0 18px',
}

export const AI_APP_URL = 'https://sthmethod.com.br/ai'

export function AiEmailShell({
  preview, title, children,
}: { preview: string; title: string; children: React.ReactNode }) {
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>{`STH AI · ${preview}`}</Preview>
      <Body style={aiMain}>
        <Container style={aiContainer}>
          <Section style={aiBrandRow}>
            <Text style={aiBrand}>STH AI</Text>
            <Text style={{ ...aiFooter, margin: '4px 0 0' }}>Sistema STH AI · STH METHOD</Text>
          </Section>
          <Heading style={aiH1}>{title}</Heading>
          {children}
          <Hr style={aiHr} />
          <Text style={aiFooter}>
            Este e-mail foi enviado pelo sistema <strong>STH AI</strong> (app STH METHOD AI).
          </Text>
          <Text style={aiFooter}>STH AI · sthmethod.com.br/ai</Text>
        </Container>
      </Body>
    </Html>
  )
}
