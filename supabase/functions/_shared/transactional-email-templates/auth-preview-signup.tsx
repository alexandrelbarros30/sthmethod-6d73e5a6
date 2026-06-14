/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { SignupEmail } from '../email-templates/signup.tsx'
import type { TemplateEntry } from './registry.ts'

const Email = (props: any) => (
  <SignupEmail
    siteName="STH METHOD"
    siteUrl="https://sthmethod.com.br"
    recipient={props.recipient || 'team@sthmethod.com.br'}
    confirmationUrl="https://sthmethod.com.br/confirm?token=preview"
  />
)

export const template = {
  component: Email,
  subject: '[PREVIEW Auth] Confirme seu e-mail · STH METHOD',
  displayName: 'Preview Auth — Cadastro',
  previewData: { recipient: 'team@sthmethod.com.br' },
} satisfies TemplateEntry