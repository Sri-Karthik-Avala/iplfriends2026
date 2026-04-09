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
    const playedMatches = matches.filter(m => m.results?.some((r: any) => r.playerId === playerData.id));
    const sortedPlayed = playedMatches.sort((a, b) => {
      const dd = new Date(b.date).getTime() - new Date(a.date).getTime();
      return dd !== 0 ? dd : Number(b.id) - Number(a.id);
    });
    const allMatchDetails = sortedPlayed.map(m => {
      const p = m.results.find((r: any) => r.playerId === playerData.id);
      return { match: m, rank: p?.rank || 0, score: p?.dream11Points || 0, leaguePoints: p?.leaguePoints || 0 };
    });
    return { matchesPlayed: playedMatches.length, last5: allMatchDetails.slice(0, 5), all: allMatchDetails };
  }, [playerData.id, matches]);

  const latestSummaryBlock = useMemo(() => {
    const withSummary = matches
      .filter(m => m.summary && m.results?.some((r: any) => r.playerId === playerData.id))
      .sort((a, b) => {
        const dd = new Date(b.date).getTime() - new Date(a.date).getTime();
        return dd !== 0 ? dd : Number(b.id) - Number(a.id);
      });
    if (!withSummary.length) return null;
    const s = withSummary[0].summary;
    const esc = playerData.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const m = s.match(new RegExp(`((?:🥇|🥈|🥉|[0-9]️⃣|💀)\\s+${esc}\\s*—[\\s\\S]*?)(?=(?:🥇|🥈|🥉|[0-9]️⃣|💀)\\s+\\w|$)`, 'i'));
    return m ? m[1].trim() : null;
  }, [playerData.id, playerData.name, matches]);

  const tc = playerData.teamColor || '#555';
  const img = playerData.imageUrl || 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';

  const RankDot = ({ rank, size }: { rank: number; size: number }) => {
    const bg = rank === 1 ? '#FABB18' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : 'var(--muted)';
    const c = rank <= 3 ? '#000' : '#fff';
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%', background: bg, color: c,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: size * 0.35, flexShrink: 0,
        boxShadow: rank <= 3 ? `0 0 8px ${bg}` : 'none'
      }}>{rank}</div>
    );
  };

  return (
    <div className="pp-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pp-card" style={{ '--tc': tc } as React.CSSProperties}>

        <button className="pp-x" onClick={onClose} aria-label="Close">×</button>

        {/* ===== MOBILE: Hero image banner with name overlay ===== */}
        <div className="pp-hero">
          <img src={img} alt={playerData.name} className="pp-hero-img" />
          <div className="pp-hero-fade" />
          <div className="pp-hero-info">
            <span className="pp-badge" style={{ background: `${tc}40`, color: tc, borderColor: tc }}>{playerData.team}</span>
            <h1 className="pp-hero-name">{playerData.name}</h1>
          </div>
        </div>

        {/* ===== DESKTOP: side image panel ===== */}
        <div className="pp-side">
          <div className="pp-side-glow" />
          <img src={img} alt={playerData.name} className="pp-side-img" />
        </div>

        {/* ===== Content ===== */}
        <div className="pp-content">
          {/* Desktop-only name block */}
          <div className="pp-dk-name">
            <span className="pp-badge" style={{ background: `${tc}40`, color: tc, borderColor: tc }}>{playerData.team}</span>
            <h1 className="pp-dk-title">{playerData.name}</h1>
          </div>

          {/* Stats */}
          <div className="pp-stats">
            <div className="pp-st" style={{ borderColor: tc }}>
              <span className="pp-st-num">#{overallRank}</span>
              <span className="pp-st-lbl">Rank</span>
            </div>
            <div className="pp-st" style={{ borderColor: 'var(--primary)' }}>
              <span className="pp-st-num">{totalLeaguePoints}</span>
              <span className="pp-st-lbl">Points</span>
            </div>
            <div className="pp-st" style={{ borderColor: 'var(--ring)' }}>
              <span className="pp-st-num">{stats.matchesPlayed}</span>
              <span className="pp-st-lbl">Played</span>
            </div>
          </div>

          {/* AI Commentary */}
          {latestSummaryBlock && (
            <div className="pp-section">
              <div className="pp-section-title">AI Commentary</div>
              <div className="pp-ai-card">
                {latestSummaryBlock.split('\n').map((line, i) => {
                  if (/^(?:🥇|🥈|🥉|[0-9]️⃣|💀)/.test(line.trim())) return <p key={i} className="pp-ai-h">{line}</p>;
                  if (/pts\s*\|/.test(line)) return <p key={i} className="pp-ai-s">{line}</p>;
                  if (!line.trim()) return null;
                  return <p key={i} className="pp-ai-t">{line}</p>;
                })}
              </div>
            </div>
          )}

          {/* Recent Form */}
          <div className="pp-section">
            <div className="pp-section-title">Recent Form</div>
            {stats.last5.length === 0 ? (
              <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>No matches yet.</p>
            ) : (
              <div className="pp-form-list">
                {stats.last5.map((m, i) => (
                  <div key={i} className="pp-form-row" onClick={() => onMatchClick(m.match)}>
                    <RankDot rank={m.rank} size={24} />
                    <span className="pp-form-name">{m.match.name}</span>
                    <span className="pp-form-pts">{m.score}</span>
                    <span className="pp-form-lp">+{m.leaguePoints}</span>
                  </div>
                ))}
              </div>
            )}

            {stats.all.length > 0 && (
              <>
                <button className="pp-expand" onClick={() => setShowAllMatches(!showAllMatches)}>
                  {showAllMatches ? 'Hide history ↑' : `All ${stats.all.length} matches ↓`}
                </button>
                {showAllMatches && (
                  <div className="pp-table-wrap">
                    <table className="pp-table">
                      <thead>
                        <tr><th>#</th><th>Match</th><th>My11</th><th>+Pts</th></tr>
                      </thead>
                      <tbody>
                        {stats.all.map((m, i) => (
                          <tr key={i} onClick={() => onMatchClick(m.match)}>
                            <td><RankDot rank={m.rank} size={20} /></td>
                            <td>
                              <div className="pp-t-name">{m.match.name}</div>
                              <div className="pp-t-date">{new Date(m.match.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                            </td>
                            <td>{m.score}</td>
                            <td className="pp-t-lp">+{m.leaguePoints}</td>
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
        /* ===== OVERLAY ===== */
        .pp-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,0.88); backdrop-filter: blur(6px);
          overflow-y: auto; -webkit-overflow-scrolling: touch;
          display: flex; justify-content: center; padding: 0;
        }

        /* ===== CARD ===== */
        .pp-card {
          position: relative; width: 100%; max-width: 850px;
          background: var(--card); display: flex; flex-direction: column;
          flex-shrink: 0; min-height: 100%;
        }
        .pp-x {
          position: fixed; top: 12px; right: 12px; z-index: 20;
          width: 36px; height: 36px; border-radius: 50%;
          background: rgba(0,0,0,0.6); color: #fff; font-size: 1.4rem;
          border: 1px solid rgba(255,255,255,0.15);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; backdrop-filter: blur(4px);
        }

        /* ===== MOBILE HERO (default) ===== */
        .pp-hero {
          position: relative; width: 100%; height: 340px;
          overflow: hidden; flex-shrink: 0;
        }
        .pp-hero-img {
          width: 100%; height: 100%; object-fit: cover;
          object-position: top center;
        }
        .pp-hero-fade {
          position: absolute; bottom: 0; left: 0; right: 0; height: 60%;
          background: linear-gradient(to top, var(--card) 0%, transparent 100%);
          pointer-events: none;
        }
        .pp-hero-info {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 0 1rem 0.75rem; z-index: 2;
        }
        .pp-badge {
          display: inline-block; padding: 0.15rem 0.55rem; border-radius: 10px;
          font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
          font-size: 0.58rem; border: 1px solid; margin-bottom: 0.25rem;
        }
        .pp-hero-name {
          font-size: 2rem; font-weight: 900; line-height: 1;
          margin: 0; text-transform: uppercase; color: #fff;
          text-shadow: 0 2px 12px rgba(0,0,0,0.7);
        }

        /* Desktop side panel: hidden on mobile */
        .pp-side { display: none; }
        .pp-dk-name { display: none; }

        /* ===== CONTENT ===== */
        .pp-content {
          display: flex; flex-direction: column; flex: 1;
        }

        /* Stats */
        .pp-stats {
          display: flex; gap: 0.4rem; padding: 0.5rem 0.75rem;
          margin-top: -0.25rem;
        }
        .pp-st {
          flex: 1; text-align: center; padding: 0.55rem 0.3rem;
          background: rgba(0,0,0,0.35); border-radius: 10px;
          border-bottom: 3px solid;
        }
        .pp-st-num {
          display: block; font-size: 1.3rem; font-weight: 800; color: #fff;
          line-height: 1.1;
        }
        .pp-st-lbl {
          display: block; font-size: 0.55rem; font-weight: 600;
          text-transform: uppercase; color: var(--muted-foreground);
          letter-spacing: 0.5px; margin-top: 0.1rem;
        }

        /* Sections */
        .pp-section {
          padding: 0.65rem 0.75rem;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .pp-section-title {
          font-size: 0.62rem; font-weight: 700; text-transform: uppercase;
          color: var(--muted-foreground); letter-spacing: 0.6px;
          margin-bottom: 0.4rem;
        }

        /* AI Commentary */
        .pp-ai-card {
          background: linear-gradient(135deg, rgba(236,28,36,0.05) 0%, rgba(255,255,60,0.05) 100%);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px; padding: 0.6rem;
        }
        .pp-ai-h {
          font-weight: 700; font-size: 0.8rem; color: var(--foreground);
          margin: 0 0 0.1rem; line-height: 1.3;
        }
        .pp-ai-s {
          font-size: 0.62rem; color: var(--muted-foreground);
          font-family: monospace; margin: 0 0 0.25rem;
        }
        .pp-ai-t {
          font-size: 0.76rem; color: var(--muted-foreground);
          line-height: 1.4; margin: 0 0 0.1rem;
        }

        /* Form rows */
        .pp-form-list { display: flex; flex-direction: column; gap: 0.3rem; }
        .pp-form-row {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.45rem 0.5rem; background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.06); border-radius: 8px;
          cursor: pointer; transition: background 0.15s;
        }
        .pp-form-row:active { background: rgba(255,255,255,0.08); }
        .pp-form-name {
          flex: 1; font-size: 0.72rem; color: #fff;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .pp-form-pts {
          font-size: 0.68rem; color: var(--muted-foreground); font-weight: 500;
        }
        .pp-form-lp {
          font-size: 0.68rem; color: var(--foreground); font-weight: 700;
          min-width: 28px; text-align: right;
        }

        /* Expand */
        .pp-expand {
          display: flex; align-items: center; justify-content: center;
          width: 100%; padding: 0.45rem; margin-top: 0.35rem;
          background: transparent; border: 1px dashed rgba(255,255,255,0.12);
          border-radius: 8px; color: var(--muted-foreground);
          font-size: 0.7rem; font-weight: 500; cursor: pointer;
        }

        /* History table */
        .pp-table-wrap {
          margin-top: 0.4rem; border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px; overflow: hidden;
        }
        .pp-table { width: 100%; border-collapse: collapse; }
        .pp-table th {
          text-align: left; padding: 0.4rem; font-size: 0.58rem;
          font-weight: 600; color: var(--muted-foreground);
          text-transform: uppercase; background: rgba(0,0,0,0.3);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .pp-table td {
          padding: 0.4rem; font-size: 0.72rem; vertical-align: middle;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          color: var(--muted-foreground); cursor: pointer;
        }
        .pp-table tr:last-child td { border-bottom: none; }
        .pp-table tr:active td { background: rgba(255,255,255,0.04); }
        .pp-t-name {
          font-size: 0.68rem; color: #fff;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          max-width: 130px;
        }
        .pp-t-date { font-size: 0.55rem; color: var(--muted-foreground); }
        .pp-t-lp { font-weight: 700; color: var(--foreground); }

        /* ===== DESKTOP (>=768px): side-by-side ===== */
        @media (min-width: 768px) {
          .pp-overlay { padding: 1rem; }
          .pp-card {
            flex-direction: row; border-radius: 24px; overflow: hidden;
            max-height: none; min-height: auto;
            box-shadow: 0 0 40px color-mix(in srgb, var(--tc) 25%, transparent);
            border: 1px solid color-mix(in srgb, var(--tc) 40%, transparent);
            margin: auto;
          }
          .pp-x {
            position: absolute; top: 14px; right: 14px;
          }

          /* Hide mobile hero, show side panel */
          .pp-hero { display: none; }
          .pp-side {
            display: flex; flex-direction: column; align-items: center;
            justify-content: center; padding: 2rem; position: relative;
            overflow: hidden; flex: 0 0 280px;
            background: linear-gradient(135deg, var(--tc) 0%, #000 100%);
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

          .pp-dk-name {
            display: block; padding: 1.5rem 2rem 0;
          }
          .pp-dk-name .pp-badge {
            font-size: 0.68rem; padding: 0.25rem 0.75rem;
            margin-bottom: 0.5rem;
          }
          .pp-dk-title {
            font-size: 2.4rem; font-weight: 900; line-height: 1;
            margin: 0; text-transform: uppercase; color: #fff;
            text-shadow: 0 0 10px color-mix(in srgb, var(--tc) 50%, transparent);
          }

          .pp-content { flex: 1; min-width: 0; }
          .pp-stats { padding: 1.25rem 2rem; gap: 0.75rem; }
          .pp-st { padding: 0.85rem 0.5rem; border-radius: 12px; }
          .pp-st-num { font-size: 1.5rem; }
          .pp-st-lbl { font-size: 0.65rem; }
          .pp-section { padding: 0.85rem 2rem; }
          .pp-section-title { font-size: 0.72rem; margin-bottom: 0.5rem; }
          .pp-ai-card { padding: 0.85rem; }
          .pp-ai-h { font-size: 0.88rem; }
          .pp-ai-s { font-size: 0.72rem; }
          .pp-ai-t { font-size: 0.82rem; }

          .pp-form-list { flex-direction: row; overflow-x: auto; gap: 0.5rem; padding-bottom: 0.5rem; }
          .pp-form-row {
            flex-direction: column; align-items: flex-start;
            min-width: 130px; flex-shrink: 0; gap: 0.3rem; padding: 0.65rem;
          }
          .pp-form-row:hover { background: rgba(255,255,255,0.06); }
          .pp-form-name { font-size: 0.75rem; white-space: nowrap; }
          .pp-form-pts { font-size: 0.72rem; }
          .pp-form-lp { font-size: 0.72rem; }

          .pp-table th { padding: 0.55rem 0.7rem; font-size: 0.65rem; }
          .pp-table td { padding: 0.55rem 0.7rem; font-size: 0.8rem; }
          .pp-t-name { max-width: 240px; font-size: 0.78rem; }
        }
      `}</style>
    </div>
  );
}
