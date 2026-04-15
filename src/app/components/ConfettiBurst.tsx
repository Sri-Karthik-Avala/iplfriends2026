// src/app/components/ConfettiBurst.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

type Particle = {
  id: number;
  left: number;
  tx: number;
  ty: number;
  rotate: number;
  color: string;
  delay: number;
};

const PALETTE = ['#FFB800', '#FF9933', '#138808', '#F8FAFC', '#E91E63'];

export default function ConfettiBurst({ trigger }: { trigger: number }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const lastTriggerRef = useRef(trigger);

  useEffect(() => {
    if (trigger === lastTriggerRef.current) return;
    lastTriggerRef.current = trigger;

    // Respect reduced motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const next: Particle[] = Array.from({ length: 40 }, (_, i) => ({
      id: Date.now() + i,
      left: 40 + Math.random() * 20,
      tx: (Math.random() - 0.5) * 320,
      ty: -80 - Math.random() * 120,
      rotate: Math.random() * 720 - 360,
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      delay: Math.random() * 80,
    }));
    setParticles(next);

    const timeout = setTimeout(() => setParticles([]), 1800);
    return () => clearTimeout(timeout);
  }, [trigger]);

  if (particles.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 100,
      }}
    >
      {particles.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            top: '50%',
            left: `${p.left}%`,
            width: 8,
            height: 14,
            background: p.color,
            borderRadius: 2,
            transform: 'translate(0, 0) rotate(0deg)',
            animation: `confetti-fall 1500ms ${p.delay}ms ease-out forwards`,
            ['--tx' as any]: `${p.tx}px`,
            ['--ty' as any]: `${p.ty}px`,
            ['--rot' as any]: `${p.rotate}deg`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes confetti-fall {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          100% {
            transform: translate(var(--tx), calc(var(--ty) + 240px)) rotate(var(--rot));
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
