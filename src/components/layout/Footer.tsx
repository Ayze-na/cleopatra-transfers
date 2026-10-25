'use client';

import { useTranslations } from 'next-intl';
import { usePublicSettings } from '@/lib/usePublicSettings';
import { whatsappLink } from '@/lib/whatsapp';

export default function Footer({ locale }: { locale: string }) {
  const t = useTranslations('footer');
  const tc = useTranslations('nav');
  const { whatsapp_number, contact_email, contact_phone } = usePublicSettings();
  const cities = ['Hurghada', 'Aswan', 'Luxor', 'Marsa Alam'];

  return (
    <footer className="bg-pharaoh-bg border-t border-gold/20 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <div className="mb-4">
              <div className="text-gold font-cinzel font-bold text-lg">CLEOPATRA</div>
              <div className="text-pharaoh-ivory/60 text-xs tracking-widest">TRANSFERS</div>
            </div>
            <p className="text-pharaoh-ivory/70 text-sm leading-relaxed">{t('tagline')}</p>
          </div>

          <div>
            <h3 className="text-gold font-semibold mb-4 text-sm uppercase tracking-wider">{t('cities')}</h3>
            <ul className="space-y-2">
              {cities.map((city) => (
                <li key={city} className="text-pharaoh-ivory/70 text-sm">{city}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-gold font-semibold mb-4 text-sm uppercase tracking-wider">{t('links')}</h3>
            <ul className="space-y-2">
              <li><a href={`/${locale}/about`} className="text-pharaoh-ivory/70 hover:text-gold text-sm transition-colors">{tc('about')}</a></li>
              <li><a href={`/${locale}/contact`} className="text-pharaoh-ivory/70 hover:text-gold text-sm transition-colors">{tc('contact')}</a></li>
              <li><a href={`/${locale}/privacy`} className="text-pharaoh-ivory/70 hover:text-gold text-sm transition-colors">{t('privacy')}</a></li>
              <li><a href={`/${locale}/terms`} className="text-pharaoh-ivory/70 hover:text-gold text-sm transition-colors">{t('terms')}</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-gold font-semibold mb-4 text-sm uppercase tracking-wider">{t('contactTitle')}</h3>
            <p className="text-pharaoh-ivory/70 text-sm mb-2">
              WhatsApp: {whatsapp_number ? <a href={whatsappLink(whatsapp_number)} target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors">{whatsapp_number}</a> : ''}
            </p>
            {contact_email && (
              <p className="text-pharaoh-ivory/70 text-sm mb-2">
                Email: <a href={`mailto:${contact_email}`} className="hover:text-gold transition-colors">{contact_email}</a>
              </p>
            )}
            {contact_phone && (
              <p className="text-pharaoh-ivory/70 text-sm">{contact_phone}</p>
            )}
          </div>
        </div>

        <div className="border-t border-gold/20 mt-12 pt-8 text-center">
          <p className="text-pharaoh-ivory/50 text-sm">© 2026 Cleopatra Transfers. {t('rights')}</p>
          <a
            href="/admin"
            className="inline-block mt-2 text-xs uppercase tracking-[0.25em] text-pharaoh-ivory/30 hover:text-gold transition-colors"
          >
            {t('admin')}
          </a>
        </div>
      </div>
    </footer>
  );
}
