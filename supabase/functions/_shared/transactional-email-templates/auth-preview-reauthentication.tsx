/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { ReauthenticationEmail } from '../email-templates/reauthentication.tsx'
import type { TemplateEntry } from './registry.ts'

const Email = () => <ReauthenticationEmail token="482913" />

export const template = {
  component: Email,
  subject: '[PREVIEW Auth] Código de verificação · STH METHOD',
  displayName: 'Preview Auth — Código de verificação',
} satisfies TemplateEntry