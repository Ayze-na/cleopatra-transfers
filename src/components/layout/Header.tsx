'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Globe, MessageCircle } from 'lucide-react';
import CurrencySwitcher from '@/components/CurrencySwitcher';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { usePublicSettings } from '@/lib/usePublicSettings';
import { whatsappLink } from '@/lib/whatsapp';

export default function Header({ locale }: { locale: string }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const t = useTranslations('nav');
  const { whatsapp_number } = usePublicSettings();

  const navItems = [
    { name: t('home'), href: `/${locale}` },
    { name: t('directRides'), href: `/${locale}/direct-rides` },
    { name: t('tripFiles'), href: `/${locale}/trip-files` },
    { name: t('about'), href: `/${locale}/about` },
    { name: t('contact'), href: `/${locale}/contact` },
  ];

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'ar', name: 'العربية' },
    { code: 'ru', name: 'Русский' },
    { code: 'de', name: 'Deutsch' },
  ];

  return (
    <header className="fixed top-0 w-full z-40 bg-pharaoh-bg/80 backdrop-blur-md border-b border-gold/20">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href={`/${locale}`} className="flex items-center gap-3 group">
            <div className="hidden sm:block">
              <div className="text-gold font-cinzel font-bold text-lg leading-tight">CLEOPATRA</div>
              <div className="text-pharaoh-ivory/70 text-xs tracking-widest">TRANSFERS</div>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-4 py-2 text-pharaoh-ivory/80 hover:text-gold transition-colors text-sm font-medium"
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:block">
              <CurrencySwitcher />
            </div>
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gold/30 text-pharaoh-ivory hover:border-gold transition-colors text-sm"
              >
                <Globe size={16} className="text-gold" />
                {languages.find((l) => l.code === locale)?.code.toUpperCase()}
              </button>
              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute right-0 mt-2 w-40 bg-pharaoh-bg/95 backdrop-blur-md border border-gold/30 rounded-lg overflow-hidden shadow-xl"
                  >
                    {languages.map((lang) => (
                      <Link
                        key={lang.code}
                        href={`/${lang.code}`}
                        onClick={() => setLangOpen(false)}
                        className="block px-4 py-2 text-pharaoh-ivory hover:bg-gold/10 hover:text-gold text-sm"
                      >
                        {lang.name}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <a
              href={whatsappLink(whatsapp_number)}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gold text-black font-semibold rounded-lg hover:bg-gold-light transition-colors text-sm"
            >
              <MessageCircle size={16} />
              {t('whatsapp')}
            </a>

            <button
              className="md:hidden text-pharaoh-ivory p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gold/20 py-4"
            >
              <div className="mb-3">
                <CurrencySwitcher />
              </div>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block py-3 text-pharaoh-ivory hover:text-gold transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
