// src/app/components/AnimatedList.tsx
'use client';

import { LazyMotion, domAnimation, m } from 'motion/react';
import type { ReactNode } from 'react';
import type { Variants } from 'motion/react';

const listVariants: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.1,
      staggerChildren: 0.06,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 220, damping: 26 },
  },
};

type Props = {
  children: ReactNode;
  className?: string;
};

export default function AnimatedList({ children, className }: Props) {
  return (
    <LazyMotion features={domAnimation} strict>
      <m.div
        variants={listVariants}
        initial="hidden"
        animate="visible"
        className={className}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}

export function AnimatedItem({ children, layoutId }: { children: ReactNode; layoutId?: string }) {
  return (
    <m.div variants={itemVariants} layout layoutId={layoutId}>
      {children}
    </m.div>
  );
}
