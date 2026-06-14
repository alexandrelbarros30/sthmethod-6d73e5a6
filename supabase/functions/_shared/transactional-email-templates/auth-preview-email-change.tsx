/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { EmailChangeEmail } from '../email-templates/email-change.tsx'
import type { TemplateEntry } from './registry.ts'

const Email = () => (
  <EmailChangeEmail
    siteName="STH METHOD"
    oldEmail="antigo@sthmethod.com.br"
    email="team@sthmethod.com.br"
    newEmail="team@sthmethod.com.br"
    confirmationUrl="https://sthmethod.com.br/confirm-email-change?token=preview"
  />
)

export const template = {
  component: Email,
  subject: '[PREVIEW Auth] Confirme a alteração de e-mail · STH METHOD',
  displayName: 'Preview Auth — Alteração de e-mail',
} satisfies TemplateEntry