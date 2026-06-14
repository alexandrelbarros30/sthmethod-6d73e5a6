/// <reference types="npm:@types/react@18.3.1" />
import type { ComponentType } from 'npm:react@18.3.1'
import { template as welcomeRegistration } from './welcome-registration.tsx'
import { template as paymentReceiptFirst } from './payment-receipt-first.tsx'
import { template as paymentReceiptRenewal } from './payment-receipt-renewal.tsx'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: any) => string)
  displayName?: string
  previewData?: Record<string, any>
  to?: string
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'welcome-registration': welcomeRegistration,
  'payment-receipt-first': paymentReceiptFirst,
  'payment-receipt-renewal': paymentReceiptRenewal,
}