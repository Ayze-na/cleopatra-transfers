'use client';

import { motion, useReducedMotion } from 'framer-motion';

export default function GoldDivider() {
  const reduce = useReducedMotion();

  return (
    <div className="flex items-center justify-center py-6" aria-hidden="true">
      <motion.div
        initial={reduce ? false : { scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="flex items-center gap-4 w-full max-w-2xl"
      >
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/60 to-gold/60" />
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="shrink-0">
          <circle cx="16" cy="16" r="5" stroke="#C9A24B" strokeWidth="1.5" />
          <path d="M16 3 L16 8 M16 24 L16 29 M3 16 L8 16 M24 16 L29 16" stroke="#C9A24B" strokeWidth="1.5" />
          <path d="M6.7 6.7 L10.2 10.2 M21.8 21.8 L25.3 25.3 M25.3 6.7 L21.8 10.2 M10.2 21.8 L6.7 25.3" stroke="#C9A24B" strokeWidth="1" opacity="0.7" />
        </svg>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent via-gold/60 to-gold/60" />
      </motion.div>
    </div>
  );
}
