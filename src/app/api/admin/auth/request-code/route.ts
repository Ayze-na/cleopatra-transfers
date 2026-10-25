import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { notificationProvider } from '@/lib/notifications/provider';
import { readJsonBody } from '@/lib/api-protection';

const requestSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request);
    if (!body) {
      return NextResponse.json({ error: 'Request too large or malformed' }, { status: 413 });
    }
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();
    const admin = createAdminClient();

    const { data: adminUser, error: adminError } = await admin
      .from('admin_users')
      .select('id, active')
      .ilike('email', email)
      .maybeSingle();

    if (adminError) {
      console.error('Admin lookup error:', adminError.message);
      return NextResponse.json({ error: 'Could not verify this email.' }, { status: 500 });
    }

    if (!adminUser || !adminUser.active) {
      return NextResponse.json(
        { error: 'This email is not registered as an active admin.' },
        { status: 404 }
      );
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    await admin.from('admin_login_requests').delete().lt('created_at', oneDayAgo);

    const { data: recentRequests } = await admin
      .from('admin_login_requests')
      .select('id')
      .ilike('email', email)
      .gte('created_at', oneMinuteAgo)
      .limit(1);

    if (recentRequests && recentRequests.length > 0) {
      return NextResponse.json(
        { error: 'Please wait a minute before requesting another code.' },
        { status: 429 }
      );
    }

    const { data: users, error: listError } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (listError) {
      console.error('Auth user lookup error:', listError.message);
      return NextResponse.json({ error: 'Could not prepare your account.' }, { status: 500 });
    }

    let userId = users.users.find((user) => user.email?.toLowerCase() === email)?.id;

    if (!userId) {
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
      });

      if (createError || !created.user) {
        console.error('Auth user create error:', createError?.message);
        return NextResponse.json({ error: 'Could not prepare your account.' }, { status: 500 });
      }

      userId = created.user.id;
    }

    const { data: link, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    if (linkError || !link.properties.email_otp) {
      console.error('Generate code error:', linkError?.message);
      return NextResponse.json({ error: 'Could not generate a sign-in code.' }, { status: 500 });
    }

    const { data: requestRow, error: requestError } = await admin
      .from('admin_login_requests')
      .insert({ email, ip })
      .select('id')
      .single();

    if (requestError) {
      console.error('Rate limit insert error:', requestError.message);
      return NextResponse.json({ error: 'Could not send a code right now.' }, { status: 500 });
    }

    const emailResult = await notificationProvider.sendEmail({
      to: email,
      subject: 'Your Cleopatra Transfers admin code',
      body: `
        <div style="font-family:Arial,sans-serif;background:#18212D;color:#F5F0E1;padding:32px">
          <h1 style="color:#C9A24B;font-size:22px;margin:0 0 16px">Cleopatra Transfers</h1>
          <p style="margin:0 0 12px">Your admin sign-in code is:</p>
          <p style="font-size:32px;letter-spacing:8px;font-weight:bold;color:#C9A24B;margin:0 0 20px">${link.properties.email_otp}</p>
          <p style="margin:0 0 8px">This code expires in one hour and can only be used once.</p>
          <p style="margin:0;color:#8FA3C7">If you did not request this code, you can ignore this email.</p>
        </div>
      `,
    });

    if (!emailResult.success) {
      await admin.from('admin_login_requests').delete().eq('id', requestRow.id);
      console.error('Admin code email error:', emailResult.error);
      return NextResponse.json(
        { error: 'Could not send the email. Please try again later.' },
        { status: 500 }
      );
    }

    await admin
      .from('admin_users')
      .update({ user_id: userId, updated_at: new Date().toISOString() })
      .eq('id', adminUser.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin code request error:', error);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
