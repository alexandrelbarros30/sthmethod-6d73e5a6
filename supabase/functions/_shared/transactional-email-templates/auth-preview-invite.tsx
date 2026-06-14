/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { InviteEmail } from '../email-templates/invite.tsx'
import type { TemplateEntry } from './registry.ts'

const Email = () => (
  <InviteEmail
    siteName="STH METHOD"
    siteUrl="https://sthmethod.com.br"
    confirmationUrl="https://sthmethod.com.br/cadastro?invite=preview"
  />
)

export const template = {
  component: Email,
  subject: '[PREVIEW Auth] Convite para a plataforma · STH METHOD',
  displayName: 'Preview Auth — Convite',
} satisfies TemplateEntry