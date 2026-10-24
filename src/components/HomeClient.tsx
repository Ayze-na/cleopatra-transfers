'use client';

import { useState, useEffect } from 'react';
import HeroIntro from '@/components/HeroIntro';
import GlyphWall from '@/components/GlyphWall';
import PredictiveArcSignal from '@/components/PredictiveArcSignal';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { usePublicSettings } from '@/lib/usePublicSettings';
import { whatsappLink } from '@/lib/whatsapp';

export default function HomeClient({ locale = 'en' }: { locale?: string }) {
  const [showIntro, setShowIntro] = useState(false);
  const [mounted, setMounted] = useState(false);
  const t = useTranslations('home');
  const { whatsapp_number } = usePublicSettings();

  useEffect(() => {
    setMounted(true);
    const heroShown = sessionStorage.getItem('heroShown');
    if (heroShown !== 'true') {
      setShowIntro(true);
    }
  }, []);

  return (
    <>
      {showIntro && <HeroIntro onComplete={() => setShowIntro(false)} />}
      <div className="min-h-screen">
        <section className="relative min-h-screen overflow-hidden bg-pharaoh-bg">
          <div className="absolute inset-0">
            <GlyphWall
              background="#18212D"
              glyphColor="#8FA3C7"
              accent="#C9A24B"
              style={{ minWidth: 0, minHeight: 0 }}
            />
          </div>
          <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-4">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-5xl md:text-7xl font-cinzel-decorative text-gold mb-12"
            >
              CLEOPATRA TRANSFERS
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex gap-4 justify-center flex-wrap"
            >
              <Link href={`/${locale}/direct-rides`} className="btn-primary">
                {t('bookDirectRide')}
              </Link>
              <Link href={`/${locale}/trip-files`} className="btn-secondary">
                {t('planTripFile')}
              </Link>
            </motion.div>
          </div>
        </section>

        <div className="relative">
          <div className="absolute inset-0 -z-10 opacity-60">
            <PredictiveArcSignal style={{ minWidth: 0, minHeight: 0 }} />
          </div>
          <div className="relative z-10">

        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="card"
            >
              <h3 className="text-2xl font-cinzel text-gold mb-3">{t('directRideTitle')}</h3>
              <p className="text-pharaoh-ivory/70 mb-4">{t('directRideDesc')}</p>
              <Link href={`/${locale}/direct-rides`} className="text-gold hover:text-gold-light font-semibold text-sm">
                {t('learnMore')} →
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="card"
            >
              <h3 className="text-2xl font-cinzel text-gold mb-3">{t('tripFileTitle')}</h3>
              <p className="text-pharaoh-ivory/70 mb-4">{t('tripFileDesc')}</p>
              <Link href={`/${locale}/trip-files`} className="text-gold hover:text-gold-light font-semibold text-sm">
                {t('learnMore')} →
              </Link>
            </motion.div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-cinzel text-gold text-center mb-12">{t('destinationsTitle')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {['Hurghada', 'Aswan', 'Luxor', 'Marsa Alam'].map((city, i) => (
                <motion.div
                  key={city}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="card text-center"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold/20 flex items-center justify-center">
                    <span className="text-2xl font-cinzel text-gold">{city[0]}</span>
                  </div>
                  <h3 className="text-xl font-cinzel text-gold">{city}</h3>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-cinzel text-gold text-center mb-12">{t('whyTitle')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {([
                { title: t('whyPrivateCars'), desc: t('whyPrivateCarsDesc') },
                { title: t('whyDrivers'), desc: t('whyDriversDesc') },
                { title: t('whyFixed'), desc: t('whyFixedDesc') },
                { title: t('whyWhatsapp'), desc: t('whyWhatsappDesc') },
              ]).map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <h3 className="text-lg font-semibold text-gold mb-2">{item.title}</h3>
                  <p className="text-pharaoh-ivory/70 text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center card">
            <h2 className="text-3xl font-cinzel text-gold mb-4">{t('ctaTitle')}</h2>
            <p className="text-pharaoh-ivory/80 mb-8">{t('ctaDesc')}</p>
            <a
              href={whatsappLink(whatsapp_number)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-block"
            >
              {t('ctaButton')}
            </a>
          </div>
        </section>
          </div>
        </div>
      </div>
    </>
  );
}
