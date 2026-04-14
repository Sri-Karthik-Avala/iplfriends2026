'use client';

import { useState, useEffect, useMemo } from 'react';
import { TEAMS } from '@/lib/constants';
import Gravestone from './components/Gravestone';
import Link from 'next/link';

// Extract player title from AI summary text
// Looks for patterns like: 🥇 Siri — "The Oracle of RCB"
function extractPlayerTitle(summary: string, playerName: string): string | null {
  if (!summary || !playerName) return null;
  const escaped = playerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(?:🥇|🥈|🥉|[0-9]️⃣|💀)\\s+${escaped}\\s*—\\s*"([^"]+)"`, 'i');
  const match = summary.match(regex);
  return match ? match[1] : null;
}

// Extract a player's full block from the summary
function extractPlayerBlock(summary: string, playerName: string): string | null {
  if (!summary || !playerName) return null;
  const escaped = playerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`((?:🥇|🥈|🥉|[0-9]️⃣|💀)\\s+${escaped}\\s*—[\\s\\S]*?)(?=(?:🥇|🥈|🥉|[0-9]️⃣|💀)\\s+\\w|$)`, 'i');
  const match = summary.match(regex);
  return match ? match[1].trim() : null;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Expand state
  const [showAllCompleted, setShowAllCompleted] = useState(false);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [lbRes, playRes, matchRes] = await Promise.all([
        fetch('/api/leaderboard'),
        fetch('/api/players'),
        fetch('/api/matches')
      ]);
      setLeaderboard(await lbRes.json());
      setPlayers(await playRes.json());
      setMatches(await matchRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTeamLogo = (teamName: string) => {
    const team = TEAMS.find((t: any) => t.name.toLowerCase().includes(teamName.toLowerCase()) || teamName.toLowerCase().includes(t.name.toLowerCase()));
    return team?.logo || 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';
  };

  const completedMatches = matches
    .filter(m => (m.results && m.results.length > 0) || m.cancelled)
    .sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      // Same date → newer match number first (so M11 beats M10)
      return Number(b.id) - Number(a.id);
    });
  const upcomingMatches = matches.filter(m => !m.cancelled && (!m.results || m.results.length === 0));

  const visibleCompleted = showAllCompleted ? completedMatches : completedMatches.slice(0, 5);
  const visibleUpcoming = showAllUpcoming ? upcomingMatches : upcomingMatches.slice(0, 5);

  // Get latest completed match with a summary
  const latestSummaryMatch = useMemo(() => {
    return completedMatches.find(m => m.summary && !m.cancelled);
  }, [completedMatches]);

  const latestSummary = latestSummaryMatch?.summary || null;

  // Per-player aggregated stats + achievement badges computed from full match history
  const playerMeta = useMemo(() => {
    type Entry = {
      played: number;
      ranks: number[];          // finishing ranks in order played
      my11: number[];           // dream11 scores in order played
      firsts: number;
      seconds: number;
      thirds: number;
      topThrees: number;
      dnps: number;
      bestMy11: number;
    };
    const metaMap: Record<string, Entry> = {};
    players.forEach((p: any) => {
      metaMap[p.id] = { played: 0, ranks: [], my11: [], firsts: 0, seconds: 0, thirds: 0, topThrees: 0, dnps: 0, bestMy11: 0 };
    });

    // Chronological order (oldest first) of real scored matches only
    const scored = matches
      .filter((m: any) => m.results && m.results.length > 0 && !m.cancelled)
      .sort((a: any, b: any) => Number(a.id) - Number(b.id));

    scored.forEach((m: any) => {
      const playedIds = new Set<string>();
      m.results.forEach((r: any) => {
        const e = metaMap[r.playerId];
        if (!e) return;
        playedIds.add(r.playerId);
        e.played += 1;
        e.ranks.push(r.rank);
        e.my11.push(r.dream11Points || 0);
        if (r.rank === 1) e.firsts += 1;
        if (r.rank === 2) e.seconds += 1;
        if (r.rank === 3) e.thirds += 1;
        if (r.rank <= 3) e.topThrees += 1;
        if ((r.dream11Points || 0) > e.bestMy11) e.bestMy11 = r.dream11Points || 0;
      });
      // Mark DNP for players not in this match's results
      players.forEach((p: any) => {
        if (!playedIds.has(p.id) && metaMap[p.id]) metaMap[p.id].dnps += 1;
      });
    });

    const totalCompleted = scored.length;
    const entries = Object.values(metaMap);
    const maxFirsts = Math.max(0, ...entries.map(e => e.firsts));
    const maxSeconds = Math.max(0, ...entries.map(e => e.seconds));
    const maxThirds = Math.max(0, ...entries.map(e => e.thirds));
    const maxMy11 = Math.max(0, ...entries.map(e => e.bestMy11));
    const maxDnps = Math.max(0, ...entries.map(e => e.dnps));
    const leaderId = leaderboard[0]?.player?.id;

    const computeAchievements = (playerId: string) => {
      const s = metaMap[playerId];
      const badges: { emoji: string; label: string; kind: 'gold' | 'silver' | 'bronze' | 'blue' | 'red' }[] = [];
      if (!s || totalCompleted === 0) return badges;

      if (playerId === leaderId) {
        badges.push({ emoji: '🏆', label: 'Leader', kind: 'gold' });
      }
      if (maxFirsts >= 2 && s.firsts === maxFirsts) {
        badges.push({ emoji: '🥇', label: `${s.firsts}× Gold`, kind: 'gold' });
      }
      if (maxSeconds >= 2 && s.seconds === maxSeconds) {
        badges.push({ emoji: '🥈', label: `${s.seconds}× Silver`, kind: 'silver' });
      }
      if (maxThirds >= 2 && s.thirds === maxThirds) {
        badges.push({ emoji: '🥉', label: `${s.thirds}× Bronze`, kind: 'bronze' });
      }
      if (maxMy11 > 0 && s.bestMy11 === maxMy11) {
        badges.push({ emoji: '⚡', label: `Peak ${Math.round(maxMy11)}`, kind: 'gold' });
      }
      if (totalCompleted >= 3 && s.played === totalCompleted) {
        badges.push({ emoji: '💎', label: 'Ever Present', kind: 'blue' });
      }
      if (s.ranks.length >= 3 && s.ranks.slice(-3).every(r => r <= 3)) {
        badges.push({ emoji: '🔥', label: 'Hot Streak', kind: 'gold' });
      } else if (s.played >= 4 && s.topThrees / s.played >= 0.6) {
        badges.push({ emoji: '🎯', label: 'Clutch', kind: 'blue' });
      }
      if (maxDnps >= 3 && s.dnps === maxDnps) {
        badges.push({ emoji: '💀', label: `${s.dnps} DNP`, kind: 'red' });
      }
      return badges.slice(0, 4);
    };

    const buildStats = (playerId: string) => {
      const s = metaMap[playerId];
      if (!s || s.played === 0) {
        return { played: 0, totalCompleted, avgRank: '—', avgMy11: '—' };
      }
      const avgRank = Math.round(s.ranks.reduce((a, b) => a + b, 0) / s.played).toString();
      const avgMy11 = Math.round(s.my11.reduce((a, b) => a + b, 0) / s.played).toString();
      return { played: s.played, totalCompleted, avgRank, avgMy11 };
    };

    return { computeAchievements, buildStats, totalCompleted };
  }, [matches, players, leaderboard]);

  const getRankDisplay = (idx: number) => {
    if (idx === 0) return { emoji: '🥇', className: 'rank-1' };
    if (idx === 1) return { emoji: '🥈', className: 'rank-2' };
    if (idx === 2) return { emoji: '🥉', className: 'rank-3' };
    return { emoji: null, className: '' };
  };

  return (
    <div className="container animate-fade" style={{ paddingTop: '1rem' }}>
      <div className="leaderboard-layout">

        {/* === SECTION 1: LEADERBOARD (Player Cards) === */}
        <div>
          <div className="section-header">
            <h2>Season Standings</h2>
            <p>Points = Players - Rank + 1. More competition, more points! The HIGHEST total wins the season!</p>
          </div>

          {loading && <p style={{ color: 'var(--muted-foreground)' }}>Loading...</p>}

          {!loading && players.length === 0 && (
            <p style={{ color: 'var(--muted-foreground)', textAlign: 'center', padding: '2rem' }}>
              No players found. Add players in the Admin Panel.
            </p>
          )}

          {!loading && players.length > 0 && leaderboard.length === 0 && (
            players.map(p => (
              <div key={p.id} className="player-card">
                <div className="player-rank numeric">-</div>
                <img src={p.imageUrl} alt={p.name} className="player-avatar" />
                <div className="player-info">
                  <div className="player-name">{p.name}</div>
                  <div className="player-team">{p.team}</div>
                </div>
                <div className="player-points">
                  <div className="points-value">0</div>
                  <div className="points-label">rank pts</div>
                </div>
              </div>
            ))
          )}

          {!loading && leaderboard.map((lb: any, idx: number) => {
            const rank = getRankDisplay(idx);
            const playerTitle = latestSummary ? extractPlayerTitle(latestSummary, lb.player.name) : null;
            const stats = playerMeta.buildStats(lb.player.id);
            const badges = playerMeta.computeAchievements(lb.player.id);
            return (
              <Link
                key={lb.player.id}
                href={`/profile/${lb.player.name.toLowerCase()}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
              <div
                className={`player-card ${rank.className}`}
              >
                <div className={`player-rank ${rank.emoji ? '' : 'numeric'}`}>
                  {rank.emoji || `#${idx + 1}`}
                </div>
                <img src={lb.player.imageUrl} alt={lb.player.name} className="player-avatar" style={{ borderColor: lb.player.teamColor }} />
                <div className="player-info">
                  <div className="player-name">{lb.player.name}</div>
                  {playerTitle ? (
                    <div className="player-title">"{playerTitle}"</div>
                  ) : (
                    <div className="player-team">{lb.player.team}</div>
                  )}
                  {badges.length > 0 && (
                    <div className="player-badges">
                      {badges.map((b, i) => (
                        <span key={i} className={`achievement-chip chip-${b.kind}`} title={b.label}>
                          <span className="chip-emoji">{b.emoji}</span>
                          <span className="chip-label">{b.label}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="player-points">
                  <div className="points-value">{lb._sum.leaguePoints || 0}</div>
                  <div className="points-label">rank pts</div>
                </div>
                {stats.played > 0 && (
                  <>
                    <div className="player-stat">
                      <div className="stat-value">{stats.played}<span className="stat-sub">/{stats.totalCompleted}</span></div>
                      <div className="stat-label">played</div>
                    </div>
                    <div className="player-stat">
                      <div className="stat-value">#{stats.avgRank}</div>
                      <div className="stat-label">avg rank</div>
                    </div>
                    <div className="player-stat player-stat-my11">
                      <div className="stat-value">{stats.avgMy11}</div>
                      <div className="stat-label">avg my11</div>
                    </div>
                  </>
                )}
              </div>
              </Link>
            );
          })}
        </div>

        {/* === SECTION 2: LATEST AI MATCH COMMENTARY === */}
        {latestSummaryMatch && (
          <div>
            <div className="section-header">
              <h2>✨ Latest Match Commentary</h2>
              <p>{latestSummaryMatch.name} — {new Date(latestSummaryMatch.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
            <div className="ai-summary-card">
              {latestSummary.split('\n').map((line: string, idx: number) => {
                // Style player header lines (emoji + name + title)
                if (/^(?:🥇|🥈|🥉|[0-9]️⃣|💀)/.test(line.trim())) {
                  return <p key={idx} className="summary-player-line">{line}</p>;
                }
                // Style stats lines (pts | rank pts | season)
                if (/pts\s*\|/.test(line)) {
                  return <p key={idx} className="summary-stats-line">{line}</p>;
                }
                // Empty lines = spacing
                if (line.trim() === '') {
                  return <div key={idx} style={{ height: '0.75rem' }} />;
                }
                // Regular commentary
                return <p key={idx} className="summary-text-line">{line}</p>;
              })}
            </div>
            <Link href={`/match/${latestSummaryMatch.id}`} style={{ textDecoration: 'none' }}>
              <button className="expand-btn" style={{ marginTop: '0.75rem' }}>View full match details →</button>
            </Link>
          </div>
        )}

        {/* === SECTION 3: COMPLETED MATCHES === */}
        <div>
          <div className="section-header">
            <h2>Completed Matches</h2>
          </div>

          {completedMatches.length === 0 ? (
            <p style={{ color: 'var(--muted-foreground)' }}>No completed matches yet.</p>
          ) : (
            <>
              {visibleCompleted.map((m) => {
                const parts = m.name.split(/ vs /i);
                const t1 = parts[0]?.trim() || '';
                const t2 = parts[1]?.trim() || '';

                return (
                  <Link key={m.id} href={`/match/${m.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="match-card" style={{ opacity: m.cancelled ? 0.6 : 0.9 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '40px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--muted-foreground)' }}>M{m.id || '?'}</span>
                        </div>
                        <div className="match-logos">
                          <img src={getTeamLogo(t1)} alt={t1} className="team-logo" style={{ width: 36, height: 36, filter: m.cancelled ? 'grayscale(1)' : undefined }} />
                          <span className="vs-badge" style={{ fontSize: '0.6rem' }}>VS</span>
                          <img src={getTeamLogo(t2)} alt={t2} className="team-logo" style={{ width: 36, height: 36, filter: m.cancelled ? 'grayscale(1)' : undefined }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '0.5rem' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 500, textDecoration: m.cancelled ? 'line-through' : undefined }}>{m.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{new Date(m.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {m.cancelled
                        ? <span className="badge badge-outline" style={{ color: 'var(--muted-foreground)' }}>❌ Cancelled</span>
                        : <span className="badge badge-outline">View Results →</span>}
                    </div>
                  </Link>
                );
              })}
              {completedMatches.length > 5 && (
                <button className="expand-btn" onClick={() => setShowAllCompleted(!showAllCompleted)}>
                  {showAllCompleted ? 'Show less ↑' : `View all ${completedMatches.length} matches ↓`}
                </button>
              )}
            </>
          )}
        </div>

        {/* === SECTION 4: UPCOMING MATCHES === */}
        <div>
          <div className="section-header">
            <h2><span className="badge badge-primary">Up Next</span> Upcoming Matches</h2>
          </div>

          {upcomingMatches.length === 0 ? (
            <p style={{ color: 'var(--muted-foreground)' }}>No upcoming matches.</p>
          ) : (
            <>
              {visibleUpcoming.map((m, idx) => {
                const parts = m.name.split(/ vs /i);
                const t1 = parts[0]?.trim() || '';
                const t2 = parts[1]?.trim() || '';
                const isNext = idx === 0;

                return (
                  <div key={m.id} className="match-card" style={isNext ? { borderColor: 'var(--primary)' } : {}}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '40px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--muted-foreground)' }}>M{m.id || '?'}</span>
                      </div>
                      <div className="match-logos">
                        <img src={getTeamLogo(t1)} alt={t1} className="team-logo" />
                        <span className="vs-badge">VS</span>
                        <img src={getTeamLogo(t2)} alt={t2} className="team-logo" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '0.5rem' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{m.name}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>{new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} • 19:30 IST</span>
                      </div>
                    </div>
                    {isNext && <span className="badge badge-secondary">Next Match</span>}
                  </div>
                );
              })}
              {upcomingMatches.length > 5 && (
                <button className="expand-btn" onClick={() => setShowAllUpcoming(!showAllUpcoming)}>
                  {showAllUpcoming ? 'Show less ↑' : `View all ${upcomingMatches.length} matches ↓`}
                </button>
              )}
            </>
          )}
        </div>

      </div>

      {/* === MEMORIAL — in place of footer === */}
      <Gravestone name="LIKITH" />

    </div>
  );
}
