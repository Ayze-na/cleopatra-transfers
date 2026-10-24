'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const normalizedEmail = email.trim().toLowerCase();

  const sendCode = async () => {
    setError('');
    setInfo('');

    if (!normalizedEmail) {
      setError('Enter your email address.');
      return;
    }

    setLoading(true);

    const response = await fetch('/api/admin/auth/request-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail }),
    });

    const result = await response.json().catch(() => ({}));
    setLoading(false);

    if (!response.ok) {
      setError(result.error || 'Could not send the code. Please try again.');
      return;
    }

    setStep('code');
    setCooldown(60);
    setInfo(`A 6-digit code was sent to ${normalizedEmail}.`);
  };

  const verifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: code.trim(),
      type: 'email',
    });

    if (verifyError || !data.user) {
      setLoading(false);
      setError(verifyError?.message || 'Invalid or expired code.');
      return;
    }

    await supabase.rpc('link_current_admin');

    setLoading(false);
    router.push('/admin');
    router.refresh();
  };

  const resetEmail = () => {
    setStep('email');
    setCode('');
    setError('');
    setInfo('');
    setCooldown(0);
  };

  return (
    <main className="min-h-screen bg-pharaoh-bg flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block font-cinzel text-2xl tracking-[0.2em] text-gold">
            CLEOPATRA
          </Link>
          <p className="mt-2 text-xs uppercase tracking-[0.35em] text-pharaoh-ivory/50">
            Transfers Admin
          </p>
        </div>

        <div className="bg-pharaoh-blue/30 border border-gold/30 rounded-lg p-8">
          <h1 className="text-2xl font-cinzel text-gold mb-2">
            {step === 'email' ? 'Admin Sign In' : 'Enter Your Code'}
          </h1>
          <p className="text-sm text-pharaoh-ivory/60 mb-6">
            {step === 'email'
              ? 'Use the email address registered by an existing admin. We will send you a one-time code.'
              : 'Enter the 6-digit code from your inbox to continue.'}
          </p>

          {step === 'email' ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                sendCode();
              }}
              className="space-y-4"
            >
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                className="w-full bg-pharaoh-bg border border-gold/30 rounded px-4 py-3 text-pharaoh-ivory outline-none focus:border-gold"
                required
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-gold text-black font-semibold rounded hover:bg-gold-light transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending code...' : 'Send Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyCode} className="space-y-4">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full bg-pharaoh-bg border border-gold/30 rounded px-4 py-3 text-center text-2xl tracking-[0.4em] text-pharaoh-ivory outline-none focus:border-gold"
                maxLength={6}
                required
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              {info && <p className="text-pharaoh-ivory/60 text-sm">{info}</p>}
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full px-6 py-3 bg-gold text-black font-semibold rounded hover:bg-gold-light transition-colors disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Sign In'}
              </button>
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={resetEmail}
                  className="text-pharaoh-ivory/60 hover:text-gold transition-colors"
                >
                  Change email
                </button>
                <button
                  type="button"
                  onClick={sendCode}
                  disabled={loading || cooldown > 0}
                  className="text-gold hover:text-gold-light transition-colors disabled:opacity-40"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-pharaoh-ivory/40">
          Admin access is limited to registered email addresses.
        </p>
      </div>
    </main>
  );
}
