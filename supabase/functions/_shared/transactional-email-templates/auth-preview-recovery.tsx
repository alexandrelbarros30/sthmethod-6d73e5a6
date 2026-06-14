/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { RecoveryEmail } from '../email-templates/recovery.tsx'
import type { TemplateEntry } from './registry.ts'

const Email = () => (
  <RecoveryEmail
    siteName="STH METHOD"
    confirmationUrl="https://sthmethod.com.br/reset-password?token=preview"
  />
)

export const template = {
  component: Email,
  subject: '[PREVIEW Auth] Redefinir senha · STH METHOD',
  displayName: 'Preview Auth — Recuperação de senha',
} satisfies TemplateEntry