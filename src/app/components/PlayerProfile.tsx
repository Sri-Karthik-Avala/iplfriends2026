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
    const sortedPlayed = playedMatches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const allMatchDetails = sortedPlayed.map(m => {
      const pRes = m.results.find((r: any) => r.playerId === playerData.id);
      return { match: m, rank: pRes?.rank || 0, score: pRes?.dream11Points || 0, leaguePoints: pRes?.leaguePoints || 0 };
    });
    return {
      matchesPlayed: playedMatches.length,
      last5Matches: allMatchDetails.slice(0, 5),
      allMatches: allMatchDetails
    };
  }, [playerData.id, matches]);

  // Extract this player's latest AI summary block
  const latestSummaryBlock = useMemo(() => {
    const completedWithSummary = matches
      .filter(m => m.summary && m.results?.some((r: any) => r.playerId === playerData.id))
      .sort((a, b) => {
        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        return Number(b.id) - Number(a.id);
      });
    if (completedWithSummary.length === 0) return null;

    const latest = completedWithSummary[0];
    const name = playerData.name;
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(
      `((?:🥇|🥈|🥉|[0-9]️⃣|💀)\\s+${escaped}\\s*—[\\s\\S]*?)(?=(?:🥇|🥈|🥉|[0-9]️⃣|💀)\\s+\\w|$)`,
      'i'
    );
    const match = latest.summary.match(regex);
    if (!match) return null;
    return { matchName: latest.name, text: match[1].trim() };
  }, [playerData.id, playerData.name, matches]);

  const teamColor = playerData.teamColor || '#555';

  const rankBadge = (rank: number, size: number) => {
    const bg = rank === 1 ? '#FABB18' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : 'var(--muted)';
    const color = rank <= 3 ? '#000' : '#fff';
    return (
      <div style={{
        width: `${size}px`, height: `${size}px`, borderRadius: '50%',
        background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: `${size * 0.3}px`, flexShrink: 0,
        boxShadow: rank <= 3 ? `0 0 8px ${bg}` : 'none'
      }}>
        {rank}
      </div>
    );
  };

  return (
    <div className="pp-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pp-modal" style={{ '--team-color': teamColor } as React.CSSProperties}>

        <button className="pp-close" onClick={onClose}>×</button>

        {/* Desktop: side image panel */}
        <div className="pp-desktop-image">
          <div className="pp-image-glow" />
          <img
            src={playerData.imageUrl || 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png'}
            alt={playerData.name}
            className="pp-avatar-large"
          />
        </div>

        <div className="pp-body">
          {/* Mobile compact header */}
          <div className="pp-mobile-header">
            <img
              src={playerData.imageUrl || 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png'}
              alt={playerData.name}
              className="pp-avatar-small"
              style={{ borderColor: teamColor }}
            />
            <div>
              <span className="pp-team-badge" style={{ backgroundColor: `${teamColor}30`, color: teamColor, borderColor: teamColor }}>
                {playerData.team}
              </span>
              <h1 className="pp-name">{playerData.name}</h1>
            </div>
          </div>

          {/* Desktop name */}
          <div className="pp-desktop-name">
            <span className="pp-team-badge" style={{ backgroundColor: `${teamColor}30`, color: teamColor, borderColor: teamColor }}>
              {playerData.team}
            </span>
            <h1 className="pp-name">{playerData.name}</h1>
          </div>

          {/* Stats row */}
          <div className="pp-stats">
            <div className="pp-stat" style={{ borderLeftColor: teamColor }}>
              <div className="pp-stat-label">Rank</div>
              <div className="pp-stat-value">#{overallRank}</div>
            </div>
            <div className="pp-stat" style={{ borderLeftColor: 'var(--primary)' }}>
              <div className="pp-stat-label">Rank Pts</div>
              <div className="pp-stat-value">{totalLeaguePoints}</div>
            </div>
            <div className="pp-stat" style={{ borderLeftColor: 'var(--ring)' }}>
              <div className="pp-stat-label">Played</div>
              <div className="pp-stat-value">{stats.matchesPlayed}</div>
            </div>
          </div>

          {/* Latest AI Summary */}
          {latestSummaryBlock && (
            <div className="pp-summary-section">
              <h3 className="pp-form-title">Latest Commentary</h3>
              <div className="pp-summary-card">
                {latestSummaryBlock.text.split('\n').map((line, i) => {
                  if (/^(?:🥇|🥈|🥉|[0-9]️⃣|💀)/.test(line.trim())) {
                    return <p key={i} className="pp-summary-header">{line}</p>;
                  }
                  if (/pts\s*\|/.test(line)) {
                    return <p key={i} className="pp-summary-stats">{line}</p>;
                  }
                  if (line.trim() === '') return null;
                  return <p key={i} className="pp-summary-text">{line}</p>;
                })}
              </div>
            </div>
          )}

          {/* Recent Form (Last 5) */}
          <div className="pp-form-section">
            <h3 className="pp-form-title">Recent Form (Last 5)</h3>
            {stats.last5Matches.length === 0 ? (
              <span style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>No matches played yet.</span>
            ) : (
              <div className="pp-matches">
                {stats.last5Matches.map((m, i) => (
                  <div key={i} className="pp-match-card" onClick={() => onMatchClick(m.match)}>
                    {rankBadge(m.rank, 26)}
                    <div className="pp-match-info">
                      <div className="pp-match-name">{m.match.name}</div>
                      <div className="pp-match-score">{m.score} pts</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Expandable full history */}
            {stats.allMatches.length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                <button
                  className="pp-expand-btn"
                  onClick={() => setShowAllMatches(!showAllMatches)}
                >
                  {showAllMatches ? 'Hide full history ↑' : `View all ${stats.allMatches.length} matches ↓`}
                </button>

                {showAllMatches && (
                  <div className="pp-history-table">
                    <table>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Match</th>
                          <th>My11</th>
                          <th>+Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.allMatches.map((m, i) => (
                          <tr key={i} onClick={() => onMatchClick(m.match)} style={{ cursor: 'pointer' }}>
                            <td>{rankBadge(m.rank, 22)}</td>
                            <td>
                              <div className="pp-table-match">{m.match.name}</div>
                              <div className="pp-table-date">{new Date(m.match.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                            </td>
                            <td>{m.score}</td>
                            <td style={{ fontWeight: 700, color: 'var(--foreground)' }}>+{m.leaguePoints}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .pp-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(5px);
          padding: 0.5rem;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }
        .pp-modal {
          position: relative;
          width: 100%;
          max-width: 850px;
          background: var(--card);
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 0 40px color-mix(in srgb, var(--team-color) 30%, transparent);
          border: 1px solid color-mix(in srgb, var(--team-color) 50%, transparent);
          margin: auto 0;
          flex-shrink: 0;
        }
        .pp-close {
          position: absolute; top: 10px; right: 10px;
          color: #fff; font-size: 1.3rem; z-index: 10;
          background: rgba(0,0,0,0.5); width: 32px; height: 32px;
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          border: none; cursor: pointer;
        }

        /* === MOBILE-FIRST === */
        .pp-desktop-image { display: none; }
        .pp-desktop-name { display: none; }

        .pp-mobile-header {
          display: flex; align-items: center; gap: 0.75rem; padding: 1rem;
          background: linear-gradient(135deg, color-mix(in srgb, var(--team-color) 40%, #000) 0%, #000 100%);
        }
        .pp-avatar-small {
          width: 56px; height: 56px; border-radius: 50%; object-fit: cover;
          border: 3px solid; flex-shrink: 0;
        }
        .pp-team-badge {
          display: inline-block; padding: 0.15rem 0.6rem; border-radius: 12px;
          font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
          font-size: 0.6rem; border: 1px solid; margin-bottom: 0.3rem;
        }
        .pp-name {
          font-size: 1.4rem; font-weight: 800; line-height: 1;
          margin: 0; text-transform: uppercase; color: #fff;
        }

        .pp-body { display: flex; flex-direction: column; }

        .pp-stats { display: flex; gap: 0.5rem; padding: 0.75rem 1rem; }
        .pp-stat {
          flex: 1; background: rgba(0,0,0,0.4); padding: 0.6rem 0.5rem;
          border-radius: 10px; border-left: 3px solid; text-align: center;
        }
        .pp-stat-label {
          color: var(--muted-foreground); font-size: 0.6rem;
          text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;
        }
        .pp-stat-value { font-size: 1.25rem; font-weight: 800; color: #fff; }

        .pp-form-section {
          padding: 0.75rem 1rem 1rem;
          border-top: 1px solid rgba(255,255,255,0.08);
        }
        .pp-form-title {
          color: var(--muted-foreground); font-size: 0.7rem;
          text-transform: uppercase; font-weight: 600; margin-bottom: 0.5rem;
          letter-spacing: 0.5px;
        }

        .pp-matches { display: flex; flex-direction: column; gap: 0.4rem; }
        .pp-match-card {
          display: flex; align-items: center; gap: 0.6rem;
          padding: 0.5rem 0.6rem; background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 8px;
          cursor: pointer; transition: background 0.15s;
        }
        .pp-match-card:active { background: rgba(255,255,255,0.1); }
        .pp-match-info {
          flex: 1; min-width: 0; display: flex;
          justify-content: space-between; align-items: center; gap: 0.5rem;
        }
        .pp-match-name {
          font-size: 0.78rem; color: #fff;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .pp-match-score {
          font-size: 0.72rem; color: var(--muted-foreground);
          font-weight: 600; flex-shrink: 0;
        }

        /* Summary */
        .pp-summary-section {
          padding: 0.75rem 1rem;
          border-top: 1px solid rgba(255,255,255,0.08);
        }
        .pp-summary-card {
          background: linear-gradient(135deg, rgba(236,28,36,0.04) 0%, rgba(255,255,60,0.04) 100%);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px;
          padding: 0.75rem;
        }
        .pp-summary-header {
          font-weight: 700; font-size: 0.82rem; color: var(--foreground);
          margin: 0 0 0.15rem; line-height: 1.3;
        }
        .pp-summary-stats {
          font-size: 0.68rem; color: var(--muted-foreground);
          font-family: monospace; margin: 0 0 0.3rem;
        }
        .pp-summary-text {
          font-size: 0.78rem; color: var(--muted-foreground);
          line-height: 1.45; margin: 0 0 0.15rem;
        }

        /* Expand button */
        .pp-expand-btn {
          display: flex; align-items: center; justify-content: center;
          width: 100%; padding: 0.5rem; margin-top: 0.25rem;
          background: transparent; border: 1px dashed rgba(255,255,255,0.15);
          border-radius: 8px; color: var(--muted-foreground);
          font-size: 0.75rem; font-weight: 500; cursor: pointer;
          transition: all 0.2s;
        }
        .pp-expand-btn:hover { border-color: rgba(255,255,255,0.3); color: #fff; }

        /* Full history table */
        .pp-history-table {
          margin-top: 0.5rem; border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px; overflow: hidden;
        }
        .pp-history-table table { width: 100%; border-collapse: collapse; }
        .pp-history-table th {
          text-align: left; padding: 0.5rem 0.5rem;
          font-size: 0.65rem; font-weight: 600; color: var(--muted-foreground);
          text-transform: uppercase; background: rgba(0,0,0,0.3);
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .pp-history-table td {
          padding: 0.5rem 0.5rem; font-size: 0.78rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          color: var(--muted-foreground); vertical-align: middle;
        }
        .pp-history-table tr:last-child td { border-bottom: none; }
        .pp-history-table tr:active td { background: rgba(255,255,255,0.05); }
        .pp-table-match {
          font-size: 0.72rem; color: #fff;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          max-width: 140px;
        }
        .pp-table-date {
          font-size: 0.6rem; color: var(--muted-foreground);
        }

        /* === DESKTOP (>= 768px) === */
        @media (min-width: 768px) {
          .pp-overlay { padding: 1rem; }
          .pp-modal { flex-direction: row; border-radius: 24px; }
          .pp-mobile-header { display: none; }
          .pp-desktop-image {
            display: flex; flex-direction: column; align-items: center;
            justify-content: center; padding: 2rem; position: relative;
            overflow: hidden; flex: 0 0 280px;
            background: linear-gradient(135deg, var(--team-color) 0%, #000 100%);
          }
          .pp-image-glow {
            position: absolute; inset: -10%;
            background: radial-gradient(circle, var(--team-color) 0%, transparent 60%);
            opacity: 0.3;
          }
          .pp-avatar-large {
            width: 100%; max-width: 200px; aspect-ratio: 3/4;
            object-fit: cover; border-radius: 16px;
            border: 4px solid rgba(255,255,255,0.2);
            box-shadow: 0 20px 40px rgba(0,0,0,0.5);
            position: relative; z-index: 1;
          }
          .pp-desktop-name { display: block; padding: 2rem 2rem 0; }
          .pp-desktop-name .pp-team-badge {
            font-size: 0.7rem; padding: 0.3rem 0.8rem; margin-bottom: 0.6rem;
          }
          .pp-desktop-name .pp-name {
            font-size: 2.6rem;
            text-shadow: 0 0 10px color-mix(in srgb, var(--team-color) 50%, transparent);
          }
          .pp-body { flex: 1; min-width: 0; }
          .pp-stats { padding: 1.5rem 2rem; }
          .pp-stat { padding: 1rem; border-radius: 14px; text-align: left; }
          .pp-stat-label { font-size: 0.75rem; }
          .pp-stat-value { font-size: 1.6rem; }
          .pp-form-section { padding: 1.25rem 2rem 2rem; }
          .pp-form-title { font-size: 0.8rem; margin-bottom: 0.75rem; }
          .pp-matches {
            flex-direction: row; overflow-x: auto; padding-bottom: 0.5rem;
          }
          .pp-match-card {
            flex-direction: column; min-width: 140px; flex-shrink: 0;
            padding: 0.75rem; gap: 0.5rem;
          }
          .pp-match-card:hover { background: rgba(255,255,255,0.08); }
          .pp-match-info {
            flex-direction: column; align-items: flex-start; gap: 0.2rem;
          }
          .pp-match-name { font-size: 0.8rem; }
          .pp-match-score { font-size: 0.78rem; }
          .pp-summary-section { padding: 1rem 2rem; }
          .pp-summary-card { padding: 1rem; }
          .pp-summary-header { font-size: 0.9rem; }
          .pp-summary-stats { font-size: 0.75rem; }
          .pp-summary-text { font-size: 0.85rem; }
          .pp-table-match { max-width: 260px; font-size: 0.82rem; }
          .pp-history-table th { padding: 0.6rem 0.75rem; font-size: 0.72rem; }
          .pp-history-table td { padding: 0.65rem 0.75rem; font-size: 0.85rem; }
        }
      `}</style>
    </div>
  );
}
