import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function HeroIntro({ onComplete }: { onComplete: () => void }) {
  const [skipped, setSkipped] = useState(false);
  const t = useTranslations('hero');

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!skipped) {
        handleComplete();
      }
    }, 5500);
    return () => clearTimeout(timer);
  }, [skipped]);

  const handleComplete = () => {
    sessionStorage.setItem('heroShown', 'true');
    onComplete();
  };

  // auto-continue only

  return (
    <AnimatePresence>
      {!skipped && (
        <motion.div
          className="fixed inset-0 z-50 bg-pharaoh-bg flex items-center justify-center overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: '-100%' }}
          transition={{ duration: 1 }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black via-pharaoh-bg to-pharaoh-blue opacity-80" />
          
          {/* Stars */}
          <div className="absolute inset-0">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-pharaoh-ivory rounded-full"
                style={{
                   left: `${Math.random() * 100}%`,
                   top: `${Math.random() * 100}%`,
                } as any}
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{
                  duration: 2 + Math.random() * 3,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          {/* Pyramids silhouette */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black to-transparent"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.5 }}
          >
            <svg className="absolute bottom-0 w-full h-48" viewBox="0 0 1200 200" preserveAspectRatio="xMidYMax slice">
              <polygon points="200,200 300,80 400,200" fill="#000" />
              <polygon points="450,200 550,60 650,200" fill="#000" />
              <polygon points="700,200 820,90 940,200" fill="#000" />
            </svg>
          </motion.div>

          <div className="relative z-10 text-center">
            {/* Winged sun emblem */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="mb-8 flex justify-center"
            >
              <div className="w-32 h-32 relative">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <circle cx="50" cy="50" r="15" fill="#C9A24B" />
                  <path d="M50 35 Q30 20 20 35 Q30 25 40 35" fill="none" stroke="#C9A24B" strokeWidth="3" />
                  <path d="M50 35 Q70 20 80 35 Q70 25 60 35" fill="none" stroke="#C9A24B" strokeWidth="3" />
                  <path d="M35 50 Q20 30 35 20 Q25 30 35 40" fill="none" stroke="#C9A24B" strokeWidth="3" />
                  <path d="M65 50 Q80 30 65 20 Q75 30 65 40" fill="none" stroke="#C9A24B" strokeWidth="3" />
                  <polygon points="50,15 48,25 52,25" fill="#C9A24B" />
                </svg>
              </div>
            </motion.div>

            {/* Brand name */}
            <motion.h1
              className="text-5xl md:text-7xl font-cinzel font-bold text-gold mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.5 }}
            >
              <span className="inline-block">CLEOPATRA</span>
              <br />
              <span className="inline-block">TRANSFERS</span>
            </motion.h1>

            {/* Tagline */}
            <motion.p
              className="text-xl text-pharaoh-ivory mb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 2.5 }}
            >
               {t('tagline')}
            </motion.p>

            {/* Auto-continue after 5.5s; no buttons */}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
