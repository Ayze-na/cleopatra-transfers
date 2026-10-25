import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  verifyTurnstile,
  enforceRateLimit,
  turnstileConfigured,
  readJsonBody,
  escapeHtml,
} from '@/lib/api-protection';
import { notificationProvider } from '@/lib/notifications/provider';

const contactSchema = z.object({
  name: z.string().min(2).max(200),
  email: z.string().email(),
  message: z.string().min(2).max(5000),
  turnstile_token: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request, 8192);
    if (!body) {
      return NextResponse.json({ error: 'Request too large or malformed' }, { status: 413 });
    }
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (turnstileConfigured() && !(await verifyTurnstile(data.turnstile_token))) {
      return NextResponse.json({ error: 'Captcha verification failed' }, { status: 403 });
    }

    const allowed = await enforceRateLimit(request, 'contact', data.email, 10, 15);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const adminEmails = (process.env.ADMIN_NOTIFICATION_EMAILS || '')
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);

    adminEmails.forEach((email) => {
      notificationProvider
        .sendEmail({
          to: email,
          subject: 'New contact message',
          body: `<p>${escapeHtml(data.name)} (${escapeHtml(data.email)}) wrote:</p><blockquote>${escapeHtml(data.message)}</blockquote>`,
          event: 'contact_message',
        })
        .catch((err) => console.error('Contact notify email failed:', err));
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error('Contact error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
