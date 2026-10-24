import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { notificationProvider } from '@/lib/notifications/provider';
import { verifyTurnstile, enforceRateLimit, turnstileConfigured } from '@/lib/api-protection';

const bookingSchema = z.object({
  route_id: z.string().uuid(),
  car_id: z.string().uuid(),
  trip_datetime: z.string().datetime(),
  hotel_text: z.string().optional(),
  passengers: z.number().int().min(1).max(50),
  luggage: z.number().int().min(0).max(50),
  client_name: z.string().min(2).max(200),
  client_phone: z.string().min(5).max(30),
  client_email: z.string().email(),
  nationality: z.string().min(2).max(100),
  passport_file_path: z.string().min(1),
  payment_method: z.enum(['cash', 'bank_transfer']),
  payment_screenshot_path: z.string().optional(),
  currency: z.enum(['USD', 'EGP', 'EUR']),
  language: z.string().default('en'),
  consent: z.literal(true),
  turnstile_token: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = bookingSchema.safeParse(body);

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
      'booking',
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

    const { data: bookingRows, error } = await supabase.rpc('create_direct_booking', {
      payload: {
        route_id: data.route_id,
        car_id: data.car_id,
        trip_datetime: data.trip_datetime,
        hotel_text: data.hotel_text,
        passengers: data.passengers,
        luggage: data.luggage,
        client_name: data.client_name,
        client_phone: data.client_phone,
        client_email: data.client_email,
        nationality: data.nationality,
        passport_file_path: data.passport_file_path,
        payment_method: data.payment_method,
        payment_screenshot_path: data.payment_screenshot_path,
        currency: data.currency,
        language: data.language,
      },
    });

    const booking = Array.isArray(bookingRows) ? bookingRows[0] : bookingRows;

    if (error || !booking) {
      const priceMissing = error?.message?.includes('Price not available');
      console.error('Booking insert error:', error?.message);
      return NextResponse.json(
        { error: priceMissing ? 'Price not available for this route and car' : 'Failed to create booking' },
        { status: priceMissing ? 400 : 500 }
      );
    }

    // Best-effort notifications (do not block response)
    notificationProvider
      .sendEmail({
        to: data.client_email,
        subject: 'Booking received - Cleopatra Transfers',
        body: `<p>Thank you ${data.client_name}. Your booking reference is <strong>${booking.reference}</strong>. Status: Pending approval.</p>`,
        language: data.language,
        event: 'booking_ack',
        relatedBookingId: booking.id,
      })
      .catch((err) => console.error('Client ack email failed:', err));

    const adminEmails = (process.env.ADMIN_NOTIFICATION_EMAILS || '').split(',').map((e) => e.trim()).filter(Boolean);
    adminEmails.forEach((email) => {
      notificationProvider
        .sendEmail({
          to: email,
          subject: `New direct booking ${booking.reference}`,
          body: `<p>New booking from ${data.client_name} (${data.client_email}). Reference: ${booking.reference}.</p>`,
          event: 'admin_notify_booking',
          relatedBookingId: booking.id,
        })
        .catch((err) => console.error('Admin notify email failed:', err));
    });

    return NextResponse.json({ success: true, booking }, { status: 201 });
  } catch (err) {
    console.error('Booking error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
