'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePublicSettings } from '@/lib/usePublicSettings';
import { whatsappLink } from '@/lib/whatsapp';
import Turnstile from '@/components/Turnstile';

type Status = 'idle' | 'sending' | 'success' | 'error';

export default function ContactPage() {
  const t = useTranslations('contact');
  const { whatsapp_number, contact_email, contact_phone } = usePublicSettings();
  const [status, setStatus] = useState<Status>('idle');
  const [turnstileToken, setTurnstileToken] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setStatus('sending');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name'),
          email: data.get('email'),
          message: data.get('message'),
          turnstile_token: turnstileToken || undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        setStatus('success');
        form.reset();
        setTurnstileToken('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  const inputClass =
    'w-full bg-pharaoh-bg border border-gold/30 rounded px-4 py-3 text-pharaoh-ivory focus:border-gold outline-none';

  return (
    <main className="min-h-screen bg-pharaoh-bg py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-cinzel text-gold mb-8 text-center">{t('title')}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-pharaoh-blue/30 border border-gold/30 rounded-lg p-8">
            <h2 className="text-2xl font-cinzel text-gold mb-4">{t('getInTouch')}</h2>
            <div className="space-y-4 text-pharaoh-ivory/80">
              <p>
                <strong className="text-gold">{t('whatsapp')}:</strong> {whatsapp_number || ''}
              </p>
              {contact_email && (
                <p>
                  <strong className="text-gold">{t('email')}:</strong>{' '}
                  <a href={`mailto:${contact_email}`} className="hover:text-gold">{contact_email}</a>
                </p>
              )}
              {contact_phone && (
                <p>
                  <strong className="text-gold">{t('phone')}:</strong> {contact_phone}
                </p>
              )}
            </div>
            <a
              href={whatsappLink(whatsapp_number)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-6 px-6 py-3 bg-gold text-black font-semibold rounded hover:bg-gold-light transition-colors"
            >
              {t('chatOnWhatsapp')}
            </a>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-pharaoh-blue/30 border border-gold/30 rounded-lg p-8 space-y-4"
          >
            <h2 className="text-2xl font-cinzel text-gold mb-4">{t('sendMessage')}</h2>
            <input name="name" required placeholder={t('yourName')} className={inputClass} />
            <input name="email" type="email" required placeholder={t('yourEmail')} className={inputClass} />
            <textarea name="message" required rows={4} placeholder={t('yourMessage')} className={inputClass} />

            {status === 'success' && <p className="text-green-400 text-sm">{t('success')}</p>}
            {status === 'error' && <p className="text-red-400 text-sm">{t('error')}</p>}

            {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? (
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                onToken={setTurnstileToken}
              />
            ) : null}

            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full px-6 py-3 bg-gold text-black font-semibold rounded hover:bg-gold-light transition-colors disabled:opacity-50"
            >
              {status === 'sending' ? t('sending') : t('send')}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
