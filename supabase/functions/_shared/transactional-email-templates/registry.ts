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
import { template as authPreviewSignup } from './auth-preview-signup.tsx'
import { template as authPreviewRecovery } from './auth-preview-recovery.tsx'
import { template as authPreviewMagiclink } from './auth-preview-magiclink.tsx'
import { template as authPreviewInvite } from './auth-preview-invite.tsx'
import { template as authPreviewEmailChange } from './auth-preview-email-change.tsx'
import { template as authPreviewReauth } from './auth-preview-reauthentication.tsx'
import { template as identityVerificationCode } from './identity-verification-code.tsx'
import { template as casPasswordReset } from './cas-password-reset.tsx'
import { template as authorizedContactVerification } from './authorized-contact-verification.tsx'

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
  'auth-preview-signup': authPreviewSignup,
  'auth-preview-recovery': authPreviewRecovery,
  'auth-preview-magiclink': authPreviewMagiclink,
  'auth-preview-invite': authPreviewInvite,
  'auth-preview-email-change': authPreviewEmailChange,
  'auth-preview-reauthentication': authPreviewReauth,
  'identity-verification-code': identityVerificationCode,
  'cas-password-reset': casPasswordReset,
  'authorized-contact-verification': authorizedContactVerification,
}