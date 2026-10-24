import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { notificationProvider } from '@/lib/notifications/provider';
import { verifyTurnstile, enforceRateLimit, turnstileConfigured } from '@/lib/api-protection';

const tripSchema = z.object({
  start_date: z.string(),
  days: z.number().int().min(1).max(30),
  passengers: z.number().int().min(1).max(50),
  luggage: z.number().int().min(0).max(50),
  client_name: z.string().min(2).max(200),
  client_phone: z.string().min(5).max(30),
  client_email: z.string().email(),
  nationality: z.string().min(2).max(100),
  passport_file_path: z.string().min(1),
  place_ids: z.array(z.string().uuid()).min(1),
  language: z.string().default('en'),
  consent: z.literal(true),
  turnstile_token: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = tripSchema.safeParse(body);

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

    const supabase = await createClient();

    const allowed = await enforceRateLimit(
      request,
      'trip_request',
      data.client_email,
      5,
      10
    );
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const { data: tripRows, error } = await supabase.rpc('create_trip_request', {
      payload: {
        start_date: data.start_date,
        days: data.days,
        passengers: data.passengers,
        luggage: data.luggage,
        client_name: data.client_name,
        client_phone: data.client_phone,
        client_email: data.client_email,
        nationality: data.nationality,
        passport_file_path: data.passport_file_path,
        language: data.language,
      },
      place_ids: data.place_ids,
    });

    const tripRequest = Array.isArray(tripRows) ? tripRows[0] : tripRows;

    if (error || !tripRequest) {
      console.error('Trip request error:', error?.message);
      return NextResponse.json({ error: 'Failed to create trip request' }, { status: 500 });
    }

    const adminEmails = (process.env.ADMIN_NOTIFICATION_EMAILS || '').split(',').map((e) => e.trim()).filter(Boolean);
    adminEmails.forEach((email) => {
      notificationProvider
        .sendEmail({
          to: email,
          subject: `New trip request ${tripRequest.reference}`,
          body: `<p>New trip request from ${data.client_name} (${data.client_email}). Reference: ${tripRequest.reference}.</p>`,
          event: 'admin_notify_trip_request',
          relatedBookingId: tripRequest.id,
        })
        .catch((err) => console.error('Admin notify email failed:', err));
    });

    return NextResponse.json({ success: true, tripRequest }, { status: 201 });
  } catch (err) {
    console.error('Trip request error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
