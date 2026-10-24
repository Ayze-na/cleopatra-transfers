import type { NotificationPayload, NotificationProvider, NotificationResult } from './types';
import { createClient } from '@/lib/supabase/server';

async function logNotification(
  event: string,
  channel: 'email' | 'whatsapp',
  recipient: string,
  result: NotificationResult,
  relatedBookingId?: string
) {
  try {
    const supabase = await createClient();
    await supabase.rpc('log_notification', {
      p_event: event,
      p_channel: channel,
      p_recipient: recipient,
      p_status: result.success ? 'sent' : 'failed',
      p_error: result.error || null,
      p_related_booking_id: relatedBookingId || null,
    });
  } catch (err) {
    console.error('Notification log write failed:', err);
  }
}

class ResendProvider implements NotificationProvider {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || '';
  }

  async sendEmail(payload: NotificationPayload): Promise<NotificationResult> {
    if (!this.apiKey) {
      const result = { success: false, error: 'RESEND_API_KEY not configured' } as NotificationResult;
      await logNotification(payload.event || 'email', 'email', payload.to, result, payload.relatedBookingId);
      return result;
    }
    try {
      const { Resend } = await import('resend') as any;
      const resend = new Resend(this.apiKey);
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Cleopatra Transfers <noreply@cleopatratransfers.com>',
        to: payload.to,
        subject: payload.subject || 'Cleopatra Transfers',
        html: payload.body,
      });
      const result: NotificationResult = { success: true };
      await logNotification(payload.event || 'email', 'email', payload.to, result, payload.relatedBookingId);
      return result;
    } catch (err: any) {
      const result: NotificationResult = { success: false, error: err.message };
      await logNotification(payload.event || 'email', 'email', payload.to, result, payload.relatedBookingId);
      return result;
    }
  }

  async sendWhatsApp(payload: NotificationPayload): Promise<NotificationResult> {
    const result: NotificationResult = { success: false, error: 'WhatsApp Cloud API not configured' };
    await logNotification(payload.event || 'whatsapp', 'whatsapp', payload.to, result, payload.relatedBookingId);
    return result;
  }
}

export const notificationProvider: NotificationProvider = new ResendProvider();
