/// <reference types="npm:@types/react@18.3.1" />
import type { ComponentType } from 'npm:react@18.3.1'
import { template as welcomeRegistration } from './welcome-registration.tsx'
import { template as paymentReceiptFirst } from './payment-receipt-first.tsx'
import { template as paymentReceiptRenewal } from './payment-receipt-renewal.tsx'
import { template as paymentPending } from './payment-pending.tsx'
import { template as paymentFailed } from './payment-failed.tsx'
import { template as renewalReminder } from './renewal-reminder.tsx'
import { template as subscriptionExpired } from './subscription-expired.tsx'
import { template as welcomePostPayment } from './welcome-post-payment.tsx'
import { template as couponApplied } from './coupon-applied.tsx'
import { template as planChanged } from './plan-changed.tsx'
import { template as emailChangeConfirm } from './email-change-confirm.tsx'
import { template as inactivityReminder } from './inactivity-reminder.tsx'

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
  'payment-pending': paymentPending,
  'payment-failed': paymentFailed,
  'renewal-reminder': renewalReminder,
  'subscription-expired': subscriptionExpired,
  'welcome-post-payment': welcomePostPayment,
  'coupon-applied': couponApplied,
  'plan-changed': planChanged,
  'email-change-confirm': emailChangeConfirm,
  'inactivity-reminder': inactivityReminder,
}