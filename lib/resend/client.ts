import { Resend } from 'resend';

// Lazy initialization - only create client when needed
let _resend: Resend | null = null;

export function getResendClient(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('Missing RESEND_API_KEY environment variable');
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@phsport.app';
