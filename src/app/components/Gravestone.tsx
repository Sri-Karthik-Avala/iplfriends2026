'use client';

import { useMemo } from 'react';

export default function Gravestone({ name = 'LIKITH' }: { name?: string }) {
  // Pre-generate grass blades and ember particles
  const grassBlades = useMemo(() => {
    return Array.from({ length: 140 }, () => ({
      left: Math.random() * 100,
      height: 8 + Math.random() * 22,
      delay: Math.random() * -3.5,
      duration: 2.8 + Math.random() * 1.5
    }));
  }, []);

  const embers = useMemo(() => {
    return Array.from({ length: 20 }, () => ({
      left: 42 + Math.random() * 18,
      bottom: 22 + Math.random() * 10,
      size: 2 + Math.random() * 2.5,
      delay: Math.random() * -8,
      duration: 6 + Math.random() * 5,
      drift: (Math.random() - 0.5) * 120
    }));
  }, []);

  return (
    <section className="graveyard-scene" aria-label={`In loving memory of ${name}`}>
      <div className="stars" />
      <div className="moon" />
      <div className="hills" />

      <div className="tree">
        <svg viewBox="0 0 140 280" preserveAspectRatio="none">
          <path
            d="M 70 280 L 70 120 M 70 200 Q 40 180, 20 140 M 20 140 Q 10 130, 5 115 M 70 180 Q 100 160, 125 120 M 125 120 Q 132 112, 138 100 M 70 150 Q 55 135, 38 115 M 70 130 Q 85 115, 105 95 M 70 120 Q 70 100, 75 80 M 75 80 Q 78 68, 82 55"
            stroke="#0a0814"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 70 280 L 70 120 M 70 200 Q 40 180, 20 140 M 20 140 Q 10 130, 5 115 M 70 180 Q 100 160, 125 120 M 125 120 Q 132 112, 138 100 M 70 150 Q 55 135, 38 115 M 70 130 Q 85 115, 105 95 M 70 120 Q 70 100, 75 80 M 75 80 Q 78 68, 82 55"
            stroke="#1a1028"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="fog layer-3" />

      <div className="ground">
        <div className="grass-patch">
          {grassBlades.map((g, i) => (
            <div
              key={i}
              className="grass-blade"
              style={{
                left: `${g.left}%`,
                height: `${g.height}px`,
                animationDelay: `${g.delay}s`,
                animationDuration: `${g.duration}s`
              }}
            />
          ))}
        </div>
      </div>

      <div className="fog layer-2" />

      <div className="gravestone-wrap">
        <div className="mound" />
        <div className="gravestone">
          <div className="stone">
            <div className="engraving">
              <div className="cross">✞</div>
              <div className="rip">R.I.P</div>
              <div className="divider" />
              <div className="name-engraved">{name}</div>
              <div className="dates">— ∗ —</div>
              <div className="epitaph">
                Fell gloriously in the Friends League. His ducks shall not be forgotten.
              </div>
            </div>
          </div>

          <div className="flowers">
            <div className="flower" />
            <div className="flower" />
            <div className="flower" />
          </div>

          <div className="candle">
            <div className="wick" />
            <div className="flame" />
          </div>
        </div>
      </div>

      <div className="embers">
        {embers.map((e, i) => (
          <div
            key={i}
            className="ember"
            style={{
              left: `${e.left}%`,
              bottom: `${e.bottom}%`,
              width: `${e.size}px`,
              height: `${e.size}px`,
              animationDelay: `${e.delay}s`,
              animationDuration: `${e.duration}s`,
              ['--drift' as any]: `${e.drift}px`
            }}
          />
        ))}
      </div>

      <div className="fog" />
      <div className="lightning" />

      <div className="signature">In Loving Memory</div>

      <style jsx>{`
        .graveyard-scene {
          position: relative;
          width: 100%;
          height: 560px;
          overflow: hidden;
          margin-top: 3rem;
          border-radius: 12px;
          background:
            radial-gradient(ellipse at 70% 18%, rgba(232, 228, 216, 0.18) 0%, rgba(232, 228, 216, 0) 40%),
            radial-gradient(ellipse at 50% 90%, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0) 60%),
            linear-gradient(180deg, #0a0f1c 0%, #1a1530 55%, #2a1a3a 100%);
          cursor: crosshair;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), inset 0 0 80px rgba(0, 0, 0, 0.4);
        }

        /* STARS */
        .stars {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .stars::before,
        .stars::after {
          content: '';
          position: absolute;
          width: 2px;
          height: 2px;
          background: #fff;
          border-radius: 50%;
          box-shadow:
            40px 40px 0 0 rgba(255, 255, 255, 0.7),
            120px 60px 0 0 rgba(255, 255, 255, 0.5),
            200px 30px 0 0 rgba(255, 255, 255, 0.9),
            280px 90px 0 0 rgba(255, 255, 255, 0.4),
            360px 20px 0 0 rgba(255, 255, 255, 0.8),
            440px 70px 0 0 rgba(255, 255, 255, 0.6),
            520px 110px 0 0 rgba(255, 255, 255, 0.5),
            600px 40px 0 0 rgba(255, 255, 255, 0.9),
            680px 80px 0 0 rgba(255, 255, 255, 0.7),
            780px 25px 0 0 rgba(255, 255, 255, 0.4),
            860px 100px 0 0 rgba(255, 255, 255, 0.8),
            940px 55px 0 0 rgba(255, 255, 255, 0.5),
            1020px 130px 0 0 rgba(255, 255, 255, 0.6),
            1100px 18px 0 0 rgba(255, 255, 255, 0.9),
            1180px 95px 0 0 rgba(255, 255, 255, 0.4),
            1260px 65px 0 0 rgba(255, 255, 255, 0.7),
            1340px 35px 0 0 rgba(255, 255, 255, 0.5),
            1420px 120px 0 0 rgba(255, 255, 255, 0.8),
            1500px 50px 0 0 rgba(255, 255, 255, 0.6),
            1580px 85px 0 0 rgba(255, 255, 255, 0.9),
            70px 140px 0 0 rgba(255, 255, 255, 0.5),
            150px 170px 0 0 rgba(255, 255, 255, 0.8),
            310px 160px 0 0 rgba(255, 255, 255, 0.4),
            470px 145px 0 0 rgba(255, 255, 255, 0.7),
            630px 175px 0 0 rgba(255, 255, 255, 0.6),
            790px 150px 0 0 rgba(255, 255, 255, 0.9),
            950px 165px 0 0 rgba(255, 255, 255, 0.4),
            1110px 155px 0 0 rgba(255, 255, 255, 0.8),
            1270px 180px 0 0 rgba(255, 255, 255, 0.5);
          animation: twinkle 4s ease-in-out infinite alternate;
        }
        .stars::after {
          animation-delay: -2s;
          animation-duration: 6s;
          transform: translate(30px, 25px);
        }
        @keyframes twinkle {
          0% { opacity: 0.4; }
          100% { opacity: 1; }
        }

        /* MOON */
        .moon {
          position: absolute;
          top: 10%;
          right: 12%;
          width: 90px;
          height: 90px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #fff 0%, #e8e4d8 45%, #8a8578 100%);
          box-shadow:
            0 0 50px 15px rgba(232, 228, 216, 0.25),
            0 0 100px 50px rgba(232, 228, 216, 0.1),
            inset -18px -18px 32px rgba(0, 0, 0, 0.3);
          animation: moonPulse 6s ease-in-out infinite;
        }
        .moon::before {
          content: '';
          position: absolute;
          top: 25%;
          left: 55%;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.15);
          box-shadow:
            12px 8px 0 -2px rgba(0, 0, 0, 0.1),
            -4px 20px 0 0 rgba(0, 0, 0, 0.12),
            16px 28px 0 -3px rgba(0, 0, 0, 0.08);
        }
        @keyframes moonPulse {
          0%, 100% {
            box-shadow: 0 0 50px 15px rgba(232, 228, 216, 0.25), 0 0 100px 50px rgba(232, 228, 216, 0.1), inset -18px -18px 32px rgba(0, 0, 0, 0.3);
          }
          50% {
            box-shadow: 0 0 70px 25px rgba(232, 228, 216, 0.32), 0 0 140px 70px rgba(232, 228, 216, 0.15), inset -18px -18px 32px rgba(0, 0, 0, 0.3);
          }
        }

        /* HILLS */
        .hills {
          position: absolute;
          bottom: 28%;
          left: -5%;
          right: -5%;
          height: 100px;
          background:
            radial-gradient(ellipse 400px 80px at 15% 100%, #0a0818 0%, #0a0818 40%, transparent 70%),
            radial-gradient(ellipse 600px 110px at 50% 100%, #110d22 0%, #110d22 35%, transparent 65%),
            radial-gradient(ellipse 500px 100px at 85% 100%, #0a0818 0%, #0a0818 40%, transparent 70%);
          filter: blur(1px);
        }

        /* TREE */
        .tree {
          position: absolute;
          bottom: 26%;
          left: 6%;
          width: 110px;
          height: 220px;
          pointer-events: none;
          opacity: 0.85;
        }
        .tree svg {
          width: 100%;
          height: 100%;
          filter: drop-shadow(0 0 8px rgba(0, 0, 0, 0.7));
        }

        /* GROUND */
        .ground {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 32%;
          background: linear-gradient(180deg, rgba(20, 30, 25, 0) 0%, rgba(12, 18, 14, 0.7) 20%, #08100a 100%);
        }
        .ground::before {
          content: '';
          position: absolute;
          top: 8%;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent 0%, rgba(100, 120, 90, 0.3) 30%, rgba(100, 120, 90, 0.5) 50%, rgba(100, 120, 90, 0.3) 70%, transparent 100%);
          filter: blur(1px);
        }

        /* GRASS */
        .grass-patch {
          position: absolute;
          bottom: 0;
          width: 100%;
          height: 50px;
          pointer-events: none;
        }
        .grass-blade {
          position: absolute;
          bottom: 0;
          width: 2px;
          background: linear-gradient(180deg, #2a3d2a 0%, #0f1a10 100%);
          border-radius: 2px 2px 0 0;
          transform-origin: bottom center;
          animation: sway 3.5s ease-in-out infinite alternate;
        }
        @keyframes sway {
          0% { transform: rotate(-5deg) scaleY(1); }
          100% { transform: rotate(5deg) scaleY(1.02); }
        }

        /* GRAVESTONE */
        .gravestone-wrap {
          position: absolute;
          bottom: 14%;
          left: 50%;
          width: 260px;
          filter: drop-shadow(0 30px 40px rgba(0, 0, 0, 0.9)) drop-shadow(0 0 30px rgba(255, 149, 64, 0.08));
          animation: rise 2s cubic-bezier(0.22, 1, 0.36, 1), gentleBreath 7s ease-in-out infinite 2s;
        }
        @keyframes rise {
          0% { opacity: 0; transform: translateX(-50%) translateY(30px) rotate(-1deg); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0) rotate(-0.4deg); }
        }
        @keyframes gentleBreath {
          0%, 100% { transform: translateX(-50%) translateY(0) rotate(-0.4deg); }
          50% { transform: translateX(-50%) translateY(-2px) rotate(0.3deg); }
        }

        .gravestone {
          position: relative;
          width: 100%;
          height: 310px;
        }

        .stone {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(120deg, transparent 48%, rgba(0, 0, 0, 0.25) 49%, rgba(0, 0, 0, 0.3) 50%, transparent 51%),
            linear-gradient(65deg, transparent 65%, rgba(0, 0, 0, 0.15) 66%, transparent 68%),
            linear-gradient(95deg, #a8a094 0%, #6e6860 25%, #4a463f 70%, #2e2b26 100%);
          clip-path: path('M 25 50 Q 25 0, 130 0 Q 235 0, 235 50 L 235 290 Q 235 310, 215 310 L 45 310 Q 25 310, 25 290 Z');
          box-shadow:
            inset 0 -20px 40px rgba(0, 0, 0, 0.5),
            inset 0 8px 20px rgba(255, 255, 255, 0.08);
        }
        .stone::before {
          content: '';
          position: absolute;
          inset: 0;
          clip-path: inherit;
          background:
            radial-gradient(circle at 20% 30%, rgba(0, 0, 0, 0.2) 0%, transparent 8%),
            radial-gradient(circle at 70% 15%, rgba(0, 0, 0, 0.15) 0%, transparent 6%),
            radial-gradient(circle at 85% 55%, rgba(0, 0, 0, 0.2) 0%, transparent 10%),
            radial-gradient(circle at 40% 70%, rgba(0, 0, 0, 0.18) 0%, transparent 7%),
            radial-gradient(circle at 15% 85%, rgba(0, 0, 0, 0.22) 0%, transparent 9%),
            radial-gradient(circle at 65% 90%, rgba(0, 0, 0, 0.15) 0%, transparent 6%),
            radial-gradient(circle at 50% 40%, rgba(255, 255, 255, 0.04) 0%, transparent 30%);
          opacity: 0.9;
        }
        .stone::after {
          content: '';
          position: absolute;
          bottom: 10px;
          left: 10px;
          right: 10px;
          height: 40px;
          clip-path: inherit;
          background:
            radial-gradient(ellipse at 10% 90%, rgba(60, 90, 40, 0.7) 0%, transparent 20%),
            radial-gradient(ellipse at 25% 95%, rgba(50, 80, 35, 0.5) 0%, transparent 15%),
            radial-gradient(ellipse at 90% 92%, rgba(55, 85, 38, 0.6) 0%, transparent 18%),
            radial-gradient(ellipse at 70% 98%, rgba(45, 75, 30, 0.5) 0%, transparent 16%);
          filter: blur(2px);
        }

        .engraving {
          position: absolute;
          inset: 40px 22px 24px 22px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          color: #1a1714;
        }
        .cross {
          font-size: 1.6rem;
          color: rgba(30, 25, 22, 0.7);
          margin-bottom: 4px;
          text-shadow: 1px 1px 0 rgba(255, 255, 255, 0.1), -1px -1px 0 rgba(0, 0, 0, 0.5);
        }
        .rip {
          font-family: 'UnifrakturMaguntia', serif;
          font-size: 1.8rem;
          letter-spacing: 0.15em;
          color: #1a1612;
          text-shadow: 0 1px 0 rgba(255, 255, 255, 0.12), 0 -1px 1px rgba(0, 0, 0, 0.7);
          margin-bottom: 14px;
          opacity: 0.85;
        }
        .divider {
          width: 60%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.4), transparent);
          margin: 4px 0 14px;
        }
        .name-engraved {
          font-family: 'Cinzel', serif;
          font-weight: 900;
          font-size: 2.6rem;
          letter-spacing: 0.12em;
          color: #1a1612;
          line-height: 1;
          text-shadow:
            0 2px 0 rgba(255, 255, 255, 0.15),
            0 -1px 0 rgba(0, 0, 0, 0.8),
            1px 1px 2px rgba(0, 0, 0, 0.6);
        }
        .dates {
          font-family: 'Cinzel', serif;
          font-size: 0.8rem;
          letter-spacing: 0.2em;
          color: #1a1612;
          margin-top: 16px;
          opacity: 0.75;
          text-shadow: 0 1px 0 rgba(255, 255, 255, 0.1), 0 -1px 0 rgba(0, 0, 0, 0.6);
        }
        .epitaph {
          font-family: 'Cinzel', serif;
          font-style: italic;
          font-size: 0.62rem;
          letter-spacing: 0.08em;
          color: #1a1612;
          margin-top: 12px;
          opacity: 0.6;
          max-width: 190px;
          line-height: 1.5;
          text-shadow: 0 1px 0 rgba(255, 255, 255, 0.08);
        }

        .mound {
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 320px;
          height: 34px;
          background: radial-gradient(ellipse at center top, #2a1e15 0%, #1a120c 50%, transparent 80%);
          border-radius: 50%;
          filter: blur(2px);
        }

        /* FLOWERS */
        .flowers {
          position: absolute;
          bottom: -4px;
          left: -18px;
          width: 60px;
          height: 50px;
        }
        .flower {
          position: absolute;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: radial-gradient(circle at 40% 40%, #c44 0%, #722 60%, #411 100%);
          box-shadow: 0 0 4px rgba(200, 40, 40, 0.3);
        }
        .flower::before {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          width: 1.5px;
          height: 18px;
          background: linear-gradient(180deg, #2a4020, #0f1a10);
          transform: translateX(-50%);
        }
        .flower:nth-child(1) { left: 8px; bottom: 20px; }
        .flower:nth-child(2) { left: 24px; bottom: 28px; width: 10px; height: 10px; }
        .flower:nth-child(3) { left: 40px; bottom: 18px; width: 9px; height: 9px; }

        /* CANDLE */
        .candle {
          position: absolute;
          bottom: 2px;
          right: -6px;
          width: 15px;
          height: 36px;
          background: linear-gradient(180deg, #d4c8a8 0%, #9c8f6e 50%, #5a4e30 100%);
          border-radius: 2px 2px 0 0;
          box-shadow: 0 0 8px rgba(0, 0, 0, 0.6);
        }
        .wick {
          position: absolute;
          top: -4px;
          left: 50%;
          transform: translateX(-50%);
          width: 1.5px;
          height: 4px;
          background: #2a1a10;
        }
        .flame {
          position: absolute;
          top: -20px;
          left: 50%;
          width: 11px;
          height: 20px;
          transform: translateX(-50%);
          background: radial-gradient(ellipse at 50% 80%, #ffb36b 0%, #ff9540 40%, rgba(255, 149, 64, 0) 75%);
          border-radius: 50% 50% 35% 35% / 60% 60% 40% 40%;
          filter: blur(0.4px);
          animation: flicker 0.12s ease-in-out infinite alternate;
          box-shadow:
            0 0 20px 4px rgba(255, 149, 64, 0.5),
            0 0 40px 10px rgba(255, 149, 64, 0.25),
            0 0 80px 20px rgba(255, 149, 64, 0.1);
        }
        .flame::before {
          content: '';
          position: absolute;
          inset: 20% 20% 35% 20%;
          background: radial-gradient(ellipse at 50% 100%, #fff 0%, #ffd37a 40%, transparent 70%);
          border-radius: 50%;
        }
        @keyframes flicker {
          0% { transform: translateX(-50%) scaleY(1) scaleX(1) skewX(-2deg); opacity: 0.95; }
          25% { transform: translateX(-48%) scaleY(1.08) scaleX(0.94) skewX(2deg); opacity: 1; }
          50% { transform: translateX(-52%) scaleY(0.96) scaleX(1.06) skewX(-1deg); opacity: 0.9; }
          75% { transform: translateX(-50%) scaleY(1.04) scaleX(0.98) skewX(3deg); opacity: 1; }
          100% { transform: translateX(-49%) scaleY(1) scaleX(1) skewX(0deg); opacity: 0.97; }
        }

        /* EMBERS */
        .embers {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }
        .ember {
          position: absolute;
          border-radius: 50%;
          background: #ffb36b;
          box-shadow: 0 0 6px 2px rgba(255, 149, 64, 0.6);
          opacity: 0;
          animation: float 8s linear infinite;
        }
        @keyframes float {
          0% { transform: translate(0, 0) scale(0.8); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 0.5; }
          100% { transform: translate(var(--drift, 40px), -400px) scale(0.2); opacity: 0; }
        }

        /* FOG */
        .fog {
          position: absolute;
          bottom: 0;
          left: -30%;
          width: 160%;
          height: 180px;
          pointer-events: none;
          background:
            radial-gradient(ellipse 400px 80px at 20% 50%, rgba(210, 220, 230, 0.08) 0%, transparent 60%),
            radial-gradient(ellipse 500px 100px at 50% 60%, rgba(210, 220, 230, 0.08) 0%, transparent 60%),
            radial-gradient(ellipse 450px 90px at 80% 45%, rgba(210, 220, 230, 0.08) 0%, transparent 60%);
          filter: blur(8px);
          animation: fogDrift 30s linear infinite;
        }
        .fog.layer-2 {
          animation-duration: 45s;
          animation-direction: reverse;
          opacity: 0.7;
          height: 130px;
        }
        .fog.layer-3 {
          animation-duration: 60s;
          opacity: 0.5;
          height: 100px;
          bottom: 8%;
        }
        @keyframes fogDrift {
          0% { transform: translateX(0); }
          100% { transform: translateX(30%); }
        }

        /* LIGHTNING */
        .lightning {
          position: absolute;
          inset: 0;
          background: rgba(200, 210, 255, 0);
          pointer-events: none;
          animation: lightningFlash 14s linear infinite;
        }
        @keyframes lightningFlash {
          0%, 97%, 100% { background: rgba(200, 210, 255, 0); }
          97.5% { background: rgba(200, 210, 255, 0.12); }
          97.8% { background: rgba(200, 210, 255, 0); }
          98.1% { background: rgba(200, 210, 255, 0.18); }
          98.4% { background: rgba(200, 210, 255, 0); }
        }

        /* SIGNATURE */
        .signature {
          position: absolute;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          font-family: 'Cinzel', serif;
          font-size: 0.7rem;
          letter-spacing: 0.4em;
          color: rgba(232, 228, 216, 0.25);
          text-transform: uppercase;
          pointer-events: none;
        }

        @media (max-width: 640px) {
          .graveyard-scene { height: 460px; }
          .gravestone-wrap { width: 210px; }
          .gravestone { height: 260px; }
          .name-engraved { font-size: 2rem; }
          .rip { font-size: 1.4rem; }
          .moon { width: 60px; height: 60px; top: 8%; right: 8%; }
          .tree { width: 80px; height: 160px; left: 2%; }
          .epitaph { font-size: 0.55rem; max-width: 160px; }
        }
      `}</style>
    </section>
  );
}
