'use client';

import { motion, useReducedMotion } from 'framer-motion';
import GoldDivider from './GoldDivider';

interface Props {
  title: string;
  subtitle?: string;
  centered?: boolean;
  id?: string;
}

export default function CartoucheTitle({ title, subtitle, centered = true, id }: Props) {
  const reduce = useReducedMotion();

  return (
    <div id={id} className={`mb-10 ${centered ? 'text-center' : ''}`}>
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7 }}
        className={`inline-block cartouche ${centered ? '' : 'mr-auto'}`}
      >
        <h2 className="text-3xl md:text-4xl font-cinzel text-gold tracking-wide">{title}</h2>
      </motion.div>
      {subtitle && (
        <motion.p
          initial={reduce ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-4 text-pharaoh-ivory/75 max-w-2xl mx-auto"
        >
          {subtitle}
        </motion.p>
      )}
      <GoldDivider />
    </div>
  );
}
