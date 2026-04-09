'use client';

import React, { useMemo, useState } from 'react';

type PlayerProfileProps = {
  playerData: any;
  matches: any[];
  overallRank: number;
  totalLeaguePoints: number;
  onClose: () => void;
  onMatchClick: (match: any) => void;
};

export default function PlayerProfile({ playerData, matches, overallRank, totalLeaguePoints, onClose, onMatchClick }: PlayerProfileProps) {
  const [showAllMatches, setShowAllMatches] = useState(false);
  if (!playerData) return null;

  const stats = useMemo(() => {
    const played = matches.filter(m => m.results?.some((r: any) => r.playerId === playerData.id));
    const sorted = played.sort((a, b) => {
      const dd = new Date(b.date).getTime() - new Date(a.date).getTime();
      return dd !== 0 ? dd : Number(b.id) - Number(a.id);
    });
    const all = sorted.map(m => {
      const p = m.results.find((r: any) => r.playerId === playerData.id);
      return { match: m, rank: p?.rank || 0, score: p?.dream11Points || 0, lp: p?.leaguePoints || 0 };
    });
    return { played: played.length, last5: all.slice(0, 5), all };
  }, [playerData.id, matches]);

  const summaryBlock = useMemo(() => {
    const ws = matches
      .filter(m => m.summary && m.results?.some((r: any) => r.playerId === playerData.id))
      .sort((a, b) => {
        const dd = new Date(b.date).getTime() - new Date(a.date).getTime();
        return dd !== 0 ? dd : Number(b.id) - Number(a.id);
      });
    if (!ws.length) return null;
    const esc = playerData.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const m = ws[0].summary.match(new RegExp(`((?:🥇|🥈|🥉|[0-9]️⃣|💀)\\s+${esc}\\s*—[\\s\\S]*?)(?=(?:🥇|🥈|🥉|[0-9]️⃣|💀)\\s+\\w|$)`, 'i'));
    return m ? m[1].trim() : null;
  }, [playerData.id, playerData.name, matches]);

  const tc = playerData.teamColor || '#555';
  const img = playerData.imageUrl || 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';

  const RankDot = ({ rank, sz }: { rank: number; sz: number }) => {
    const bg = rank === 1 ? '#FABB18' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : 'var(--muted)';
    return (
      <div style={{
        width: sz, height: sz, borderRadius: '50%', background: bg,
        color: rank <= 3 ? '#000' : '#fff', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontWeight: 800, fontSize: sz * 0.35, flexShrink: 0,
        boxShadow: rank <= 3 ? `0 0 6px ${bg}` : 'none'
      }}>{rank}</div>
    );
  };

  return (
    <div className="pp-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pp-card" style={{ '--tc': tc } as React.CSSProperties}>
        <button className="pp-x" onClick={onClose} aria-label="Close">×</button>

        {/* ===== MOBILE: Hero image — contain to show full photo ===== */}
        <div className="pp-hero" style={{ background: `linear-gradient(135deg, ${tc}40 0%, #000 100%)` }}>
          <img src={img} alt={playerData.name} className="pp-hero-img" />
          <div className="pp-hero-fade" />
          <div className="pp-hero-info">
            <span className="pp-badge" style={{ background: `${tc}50`, color: '#fff', borderColor: `${tc}` }}>{playerData.team}</span>
            <h1 className="pp-hero-name">{playerData.name}</h1>
          </div>
        </div>

        {/* ===== DESKTOP: side image ===== */}
        <div className="pp-side" style={{ background: `linear-gradient(135deg, ${tc} 0%, #000 100%)` }}>
          <div className="pp-side-glow" />
          <img src={img} alt={playerData.name} className="pp-side-img" />
        </div>

        {/* ===== Content ===== */}
        <div className="pp-content">
          <div className="pp-dk-name">
            <span className="pp-badge" style={{ background: `${tc}40`, color: tc, borderColor: tc }}>{playerData.team}</span>
            <h1 className="pp-dk-title">{playerData.name}</h1>
          </div>

          {/* Stats + Commentary: 2-col on mobile, stacked on desktop right panel */}
          <div className="pp-duo">
            {/* Stats column */}
            <div className="pp-stats-col">
              <div className="pp-st" style={{ borderColor: tc }}>
                <span className="pp-st-n">#{overallRank}</span>
                <span className="pp-st-l">Rank</span>
              </div>
              <div className="pp-st" style={{ borderColor: 'var(--primary)' }}>
                <span className="pp-st-n">{totalLeaguePoints}</span>
                <span className="pp-st-l">Points</span>
              </div>
              <div className="pp-st" style={{ borderColor: 'var(--ring)' }}>
                <span className="pp-st-n">{stats.played}</span>
                <span className="pp-st-l">Played</span>
              </div>
            </div>

            {/* Commentary column */}
            {summaryBlock ? (
              <div className="pp-comm-col">
                <div className="pp-ai">
                  {summaryBlock.split('\n').map((line, i) => {
                    if (/^(?:🥇|🥈|🥉|[0-9]️⃣|💀)/.test(line.trim())) return <p key={i} className="pp-ai-h">{line}</p>;
                    if (/pts\s*\|/.test(line)) return <p key={i} className="pp-ai-s">{line}</p>;
                    if (!line.trim()) return null;
                    return <p key={i} className="pp-ai-t">{line}</p>;
                  })}
                </div>
              </div>
            ) : (
              <div className="pp-comm-col">
                <div className="pp-ai" style={{ color: 'var(--muted-foreground)', fontSize: '0.78rem', padding: '0.5rem' }}>No AI commentary yet.</div>
              </div>
            )}
          </div>

          {/* Recent Form */}
          <div className="pp-section">
            <div className="pp-sec-t">Recent Form</div>
            {stats.last5.length === 0 ? (
              <p style={{ color: 'var(--muted-foreground)', fontSize: '0.8rem' }}>No matches yet.</p>
            ) : (
              <div className="pp-form">
                {stats.last5.map((m, i) => (
                  <div key={i} className="pp-fr" onClick={() => onMatchClick(m.match)}>
                    <RankDot rank={m.rank} sz={22} />
                    <span className="pp-fr-name">{m.match.name}</span>
                    <span className="pp-fr-pts">{m.score}</span>
                    <span className="pp-fr-lp">+{m.lp}</span>
                  </div>
                ))}
              </div>
            )}
            {stats.all.length > 0 && (
              <>
                <button className="pp-exp" onClick={() => setShowAllMatches(!showAllMatches)}>
                  {showAllMatches ? 'Hide ↑' : `All ${stats.all.length} matches ↓`}
                </button>
                {showAllMatches && (
                  <div className="pp-tw">
                    <table className="pp-tb">
                      <thead><tr><th>#</th><th>Match</th><th>My11</th><th>+Pts</th></tr></thead>
                      <tbody>
                        {stats.all.map((m, i) => (
                          <tr key={i} onClick={() => onMatchClick(m.match)}>
                            <td><RankDot rank={m.rank} sz={18} /></td>
                            <td>
                              <div className="pp-tn">{m.match.name}</div>
                              <div className="pp-td">{new Date(m.match.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                            </td>
                            <td>{m.score}</td>
                            <td style={{ fontWeight: 700, color: 'var(--foreground)' }}>+{m.lp}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .pp-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,0.88); backdrop-filter: blur(6px);
          overflow-y: auto; -webkit-overflow-scrolling: touch;
          display: flex; justify-content: center; padding: 0;
        }
        .pp-card {
          position: relative; width: 100%; max-width: 850px;
          background: var(--card); display: flex; flex-direction: column;
          flex-shrink: 0; min-height: 100%;
        }
        .pp-x {
          position: fixed; top: 10px; right: 10px; z-index: 20;
          width: 34px; height: 34px; border-radius: 50%;
          background: rgba(0,0,0,0.6); color: #fff; font-size: 1.3rem;
          border: 1px solid rgba(255,255,255,0.15);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; backdrop-filter: blur(4px);
        }

        /* ===== MOBILE HERO ===== */
        .pp-hero {
          position: relative; width: 100%; aspect-ratio: 3/4;
          max-height: 420px; overflow: hidden; flex-shrink: 0;
        }
        .pp-hero-img {
          width: 100%; height: 100%;
          object-fit: contain;
          object-position: center bottom;
        }
        .pp-hero-fade {
          position: absolute; bottom: 0; left: 0; right: 0; height: 50%;
          background: linear-gradient(to top, var(--card) 0%, transparent 100%);
          pointer-events: none;
        }
        .pp-hero-info {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 0 0.75rem 0.6rem; z-index: 2;
        }
        .pp-badge {
          display: inline-block; padding: 0.12rem 0.5rem; border-radius: 10px;
          font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
          font-size: 0.55rem; border: 1px solid; margin-bottom: 0.2rem;
        }
        .pp-hero-name {
          font-size: 1.8rem; font-weight: 900; line-height: 1;
          margin: 0; text-transform: uppercase; color: #fff;
          text-shadow: 0 2px 12px rgba(0,0,0,0.8);
        }

        .pp-side { display: none; }
        .pp-dk-name { display: none; }

        .pp-content { display: flex; flex-direction: column; flex: 1; }

        /* ===== DUO: stats + commentary side by side on mobile ===== */
        .pp-duo {
          display: grid; grid-template-columns: auto 1fr;
          gap: 0.4rem; padding: 0.5rem 0.75rem;
        }
        .pp-stats-col {
          display: flex; flex-direction: column; gap: 0.3rem;
          min-width: 72px;
        }
        .pp-st {
          background: rgba(0,0,0,0.35); border-radius: 8px;
          border-left: 3px solid; padding: 0.35rem 0.4rem;
          text-align: center;
        }
        .pp-st-n {
          display: block; font-size: 1.05rem; font-weight: 800;
          color: #fff; line-height: 1.1;
        }
        .pp-st-l {
          display: block; font-size: 0.5rem; font-weight: 600;
          text-transform: uppercase; color: var(--muted-foreground);
          letter-spacing: 0.4px;
        }
        .pp-comm-col { min-width: 0; }
        .pp-ai {
          background: linear-gradient(135deg, rgba(236,28,36,0.05) 0%, rgba(255,255,60,0.05) 100%);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px; padding: 0.5rem; height: 100%;
        }
        .pp-ai-h {
          font-weight: 700; font-size: 0.72rem; color: var(--foreground);
          margin: 0 0 0.1rem; line-height: 1.3;
        }
        .pp-ai-s {
          font-size: 0.58rem; color: var(--muted-foreground);
          font-family: monospace; margin: 0 0 0.2rem;
        }
        .pp-ai-t {
          font-size: 0.7rem; color: var(--muted-foreground);
          line-height: 1.35; margin: 0 0 0.1rem;
        }

        /* ===== SECTIONS ===== */
        .pp-section {
          padding: 0.5rem 0.75rem 0.75rem;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .pp-sec-t {
          font-size: 0.58rem; font-weight: 700; text-transform: uppercase;
          color: var(--muted-foreground); letter-spacing: 0.5px;
          margin-bottom: 0.35rem;
        }
        .pp-form { display: flex; flex-direction: column; gap: 0.25rem; }
        .pp-fr {
          display: flex; align-items: center; gap: 0.45rem;
          padding: 0.35rem 0.45rem; background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.05); border-radius: 6px;
          cursor: pointer;
        }
        .pp-fr:active { background: rgba(255,255,255,0.07); }
        .pp-fr-name {
          flex: 1; font-size: 0.68rem; color: #fff;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .pp-fr-pts { font-size: 0.62rem; color: var(--muted-foreground); }
        .pp-fr-lp { font-size: 0.62rem; color: var(--foreground); font-weight: 700; min-width: 22px; text-align: right; }

        .pp-exp {
          display: flex; align-items: center; justify-content: center;
          width: 100%; padding: 0.4rem; margin-top: 0.25rem;
          background: transparent; border: 1px dashed rgba(255,255,255,0.1);
          border-radius: 6px; color: var(--muted-foreground);
          font-size: 0.65rem; cursor: pointer;
        }
        .pp-tw {
          margin-top: 0.35rem; border: 1px solid rgba(255,255,255,0.06);
          border-radius: 6px; overflow: hidden;
        }
        .pp-tb { width: 100%; border-collapse: collapse; }
        .pp-tb th {
          text-align: left; padding: 0.35rem 0.4rem; font-size: 0.55rem;
          font-weight: 600; color: var(--muted-foreground);
          text-transform: uppercase; background: rgba(0,0,0,0.3);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .pp-tb td {
          padding: 0.35rem 0.4rem; font-size: 0.68rem; vertical-align: middle;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          color: var(--muted-foreground); cursor: pointer;
        }
        .pp-tb tr:last-child td { border-bottom: none; }
        .pp-tn {
          font-size: 0.64rem; color: #fff;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          max-width: 120px;
        }
        .pp-td { font-size: 0.5rem; color: var(--muted-foreground); }

        /* ===== DESKTOP ===== */
        @media (min-width: 768px) {
          .pp-overlay { padding: 1rem; }
          .pp-card {
            flex-direction: row; border-radius: 24px; overflow: hidden;
            min-height: auto;
            box-shadow: 0 0 40px color-mix(in srgb, var(--tc) 25%, transparent);
            border: 1px solid color-mix(in srgb, var(--tc) 40%, transparent);
            margin: auto;
          }
          .pp-x { position: absolute; top: 14px; right: 14px; }
          .pp-hero { display: none; }
          .pp-side {
            display: flex; flex-direction: column; align-items: center;
            justify-content: center; padding: 2rem; position: relative;
            overflow: hidden; flex: 0 0 280px;
          }
          .pp-side-glow {
            position: absolute; inset: -10%;
            background: radial-gradient(circle, var(--tc) 0%, transparent 60%);
            opacity: 0.3;
          }
          .pp-side-img {
            width: 100%; max-width: 210px; aspect-ratio: 3/4;
            object-fit: cover; border-radius: 16px;
            border: 4px solid rgba(255,255,255,0.2);
            box-shadow: 0 20px 40px rgba(0,0,0,0.5);
            position: relative; z-index: 1;
          }
          .pp-dk-name { display: block; padding: 1.5rem 2rem 0; }
          .pp-dk-name .pp-badge { font-size: 0.68rem; padding: 0.25rem 0.75rem; margin-bottom: 0.5rem; }
          .pp-dk-title {
            font-size: 2.4rem; font-weight: 900; line-height: 1;
            margin: 0; text-transform: uppercase; color: #fff;
            text-shadow: 0 0 10px color-mix(in srgb, var(--tc) 50%, transparent);
          }
          .pp-content { flex: 1; min-width: 0; }

          /* Desktop: stats row + commentary below (not side-by-side) */
          .pp-duo {
            grid-template-columns: 1fr; padding: 1rem 2rem;
          }
          .pp-stats-col {
            flex-direction: row; gap: 0.6rem;
          }
          .pp-st { padding: 0.7rem 0.5rem; border-radius: 10px; flex: 1; }
          .pp-st-n { font-size: 1.4rem; }
          .pp-st-l { font-size: 0.6rem; }
          .pp-ai { padding: 0.75rem; }
          .pp-ai-h { font-size: 0.85rem; }
          .pp-ai-s { font-size: 0.68rem; }
          .pp-ai-t { font-size: 0.8rem; line-height: 1.45; }

          .pp-section { padding: 0.75rem 2rem 1.5rem; }
          .pp-sec-t { font-size: 0.68rem; margin-bottom: 0.5rem; }
          .pp-form { flex-direction: row; overflow-x: auto; gap: 0.5rem; padding-bottom: 0.5rem; }
          .pp-fr {
            flex-direction: column; align-items: flex-start;
            min-width: 130px; flex-shrink: 0; gap: 0.25rem; padding: 0.6rem;
          }
          .pp-fr:hover { background: rgba(255,255,255,0.06); }
          .pp-fr-name { font-size: 0.74rem; }
          .pp-fr-pts { font-size: 0.7rem; }
          .pp-fr-lp { font-size: 0.7rem; }

          .pp-tb th { padding: 0.5rem 0.7rem; font-size: 0.62rem; }
          .pp-tb td { padding: 0.5rem 0.7rem; font-size: 0.8rem; }
          .pp-tn { max-width: 240px; font-size: 0.76rem; }
        }
      `}</style>
    </div>
  );
}
