/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { MagicLinkEmail } from '../email-templates/magic-link.tsx'
import type { TemplateEntry } from './registry.ts'

const Email = () => (
  <MagicLinkEmail
    siteName="STH METHOD"
    confirmationUrl="https://sthmethod.com.br/auth?token=preview"
  />
)

export const template = {
  component: Email,
  subject: '[PREVIEW Auth] Seu link de acesso · STH METHOD',
  displayName: 'Preview Auth — Magic Link',
} satisfies TemplateEntry