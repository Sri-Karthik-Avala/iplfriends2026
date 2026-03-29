# Mobile Optimization & Match Detail Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the leaderboard page with mobile-first single-column layout, player card leaderboard, show-5-expand match lists, a new `/match/[id]` detail page, and fix the AI summary display bug.

**Architecture:** Single-column vertical layout replaces the current two-column split. Leaderboard uses card rows instead of a table. Completed match links navigate to a new dedicated route `/match/[id]` instead of opening a modal. Admin page gets a targeted bug fix for AI summary display.

**Tech Stack:** Next.js 14 (App Router), React 18, TypeScript, custom CSS (no Tailwind)

**Note:** This project has no test framework installed. Steps include manual verification via dev server instead of automated tests.

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/app/globals.css` | Modify | Add `.player-card` styles, `.section-header`, `.expand-btn`, `.match-detail-*` styles, update responsive breakpoints |
| `src/app/page.tsx` | Rewrite | Single-column layout: player card leaderboard → completed matches (5+expand) → upcoming matches (5+expand). Remove match modal. Link completed matches to `/match/[id]` |
| `src/app/match/[id]/page.tsx` | Create | Match detail page with rankings + AI commentary. Side-by-side on desktop, stacked on mobile |
| `src/app/admin/page.tsx` | Modify | Fix AI summary placeholder bug in `handleBulkResultSubmit` (line 153-183) |
| `src/app/components/PlayerProfile.tsx` | Modify | Update `onMatchClick` to navigate to `/match/[id]` instead of relying on parent modal state |

---

### Task 1: Add CSS styles for player cards, match detail page, and layout updates

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add player card styles**

Add after the `.match-card:hover` block (after line 181):

```css
/* Player Cards (Leaderboard) */
.player-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--card);
  border-radius: var(--radius);
  margin-bottom: 8px;
  border: 1px solid var(--border);
  border-left: 3px solid var(--border);
  cursor: pointer;
  transition: all 0.2s ease;
}

.player-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--muted-foreground);
}

.player-card.rank-1 { border-left-color: gold; }
.player-card.rank-2 { border-left-color: silver; }
.player-card.rank-3 { border-left-color: #cd7f32; }

.player-card .player-rank {
  font-size: 20px;
  min-width: 32px;
  text-align: center;
}

.player-card .player-rank.numeric {
  font-size: 14px;
  font-weight: 700;
  color: var(--muted-foreground);
}

.player-card .player-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: contain;
  background: white;
  padding: 2px;
  border: 1px solid var(--border);
  flex-shrink: 0;
}

.player-card .player-info {
  flex: 1;
  min-width: 0;
}

.player-card .player-name {
  font-weight: 700;
  font-size: 14px;
  color: var(--foreground);
}

.player-card .player-team {
  font-size: 11px;
  color: var(--muted-foreground);
}

.player-card .player-points {
  text-align: right;
  flex-shrink: 0;
}

.player-card .player-points .points-value {
  font-weight: 800;
  font-size: 16px;
  color: var(--foreground);
}

.player-card .player-points .points-label {
  font-size: 10px;
  color: var(--muted-foreground);
}
```

- [ ] **Step 2: Add expand button and section header styles**

Add after the player card styles:

```css
/* Section Headers */
.section-header {
  margin-bottom: 1rem;
}

.section-header h2 {
  font-weight: 600;
  letter-spacing: -0.025em;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-header p {
  font-size: 0.875rem;
  color: var(--muted-foreground);
  margin-top: 0.25rem;
}

/* Expand/Collapse Button */
.expand-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 10px;
  margin-top: 8px;
  background: transparent;
  border: 1px dashed var(--border);
  border-radius: var(--radius);
  color: var(--muted-foreground);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.expand-btn:hover {
  border-color: var(--muted-foreground);
  color: var(--foreground);
  background: rgba(255, 255, 255, 0.02);
}
```

- [ ] **Step 3: Add match detail page styles**

Add after the expand button styles:

```css
/* Match Detail Page */
.match-detail-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 1.5rem;
}

.match-detail-back {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--muted-foreground);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 1.5rem;
  transition: color 0.2s ease;
}

.match-detail-back:hover {
  color: var(--foreground);
}

.match-detail-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.match-detail-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.match-detail-rankings {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.match-detail-commentary {
  background: linear-gradient(135deg, rgba(236,28,36,0.05) 0%, rgba(255,255,60,0.05) 100%);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: var(--radius);
  padding: 1.5rem;
  box-shadow: 0 4px 20px -5px rgba(0,0,0,0.5), inset 0 0 10px rgba(255,255,255,0.02);
}

.match-detail-commentary .commentary-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.75rem;
  font-weight: bold;
  font-size: 1.1rem;
}

.match-detail-commentary p {
  margin-bottom: 0.6rem;
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--muted-foreground);
}

@media (max-width: 768px) {
  .match-detail-body {
    grid-template-columns: 1fr;
  }
  .match-detail-header {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
    padding: 1rem;
  }
  .match-detail-container {
    padding: 1rem;
  }
}
```

- [ ] **Step 4: Update the leaderboard page layout styles**

Replace the existing `.split-layout` media query at line 413 (`@media (max-width: 1024px)`) and the leaderboard-page-specific usage. Add a new class for the single-column leaderboard layout:

```css
/* Single Column Leaderboard Layout */
.leaderboard-layout {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 0;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

@media (max-width: 640px) {
  .leaderboard-layout {
    padding: 1rem 0;
    gap: 2rem;
  }
}
```

Note: Keep the existing `.split-layout`, `.split-left`, `.split-right` CSS unchanged — the admin page still uses them. The leaderboard page will switch to `.leaderboard-layout` class instead.

- [ ] **Step 5: Commit CSS changes**

```bash
git add src/app/globals.css
git commit -m "feat: add CSS for player cards, match detail page, expand buttons, and single-column leaderboard layout"
```

---

### Task 2: Rewrite leaderboard page with player cards and single-column layout

**Files:**
- Rewrite: `src/app/page.tsx`

- [ ] **Step 1: Replace the entire page.tsx with the new layout**

The new page removes the split layout, uses player cards for the leaderboard, adds show-5-expand for both match sections, removes the match results modal, and links completed matches to `/match/[id]`.

```tsx
'use client';

import { useState, useEffect } from 'react';
import { TEAMS } from '@/lib/constants';
import PlayerProfile from './components/PlayerProfile';
import Link from 'next/link';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Expand state
  const [showAllCompleted, setShowAllCompleted] = useState(false);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);

  // Player profile modal
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);

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

  const completedMatches = matches.filter(m => m.results && m.results.length > 0).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const upcomingMatches = matches.filter(m => !m.results || m.results.length === 0);

  const visibleCompleted = showAllCompleted ? completedMatches : completedMatches.slice(0, 5);
  const visibleUpcoming = showAllUpcoming ? upcomingMatches : upcomingMatches.slice(0, 5);

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
            <p>Daily Match Ranks grant Points (1st=50, 2nd=40, etc.). The HIGHEST total Rank Points wins the season!</p>
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
            return (
              <div
                key={lb.player.id}
                className={`player-card ${rank.className}`}
                onClick={() => setSelectedPlayer({ playerData: lb.player, rank: idx + 1, leaguePoints: lb._sum.leaguePoints })}
              >
                <div className={`player-rank ${rank.emoji ? '' : 'numeric'}`}>
                  {rank.emoji || `#${idx + 1}`}
                </div>
                <img src={lb.player.imageUrl} alt={lb.player.name} className="player-avatar" style={{ borderColor: lb.player.teamColor }} />
                <div className="player-info">
                  <div className="player-name">{lb.player.name}</div>
                  <div className="player-team">{lb.player.team}</div>
                </div>
                <div className="player-points">
                  <div className="points-value">{lb._sum.leaguePoints || 0}</div>
                  <div className="points-label">rank pts</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* === SECTION 2: COMPLETED MATCHES === */}
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
                    <div className="match-card" style={{ opacity: 0.9 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '40px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--muted-foreground)' }}>M{m.id || '?'}</span>
                        </div>
                        <div className="match-logos">
                          <img src={getTeamLogo(t1)} alt={t1} className="team-logo" style={{ width: 36, height: 36 }} />
                          <span className="vs-badge" style={{ fontSize: '0.6rem' }}>VS</span>
                          <img src={getTeamLogo(t2)} alt={t2} className="team-logo" style={{ width: 36, height: 36 }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '0.5rem' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{m.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{new Date(m.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <span className="badge badge-outline">View Results →</span>
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

        {/* === SECTION 3: UPCOMING MATCHES === */}
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

      {/* PLAYER PROFILE MODAL */}
      {selectedPlayer && (
        <PlayerProfile
          playerData={selectedPlayer.playerData}
          overallRank={selectedPlayer.rank}
          totalLeaguePoints={selectedPlayer.leaguePoints}
          matches={matches}
          onClose={() => setSelectedPlayer(null)}
          onMatchClick={(m: any) => {
            setSelectedPlayer(null);
            window.location.href = `/match/${m.id}`;
          }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify dev server runs and leaderboard page loads**

Run: `npm run dev`
Open: `http://localhost:3000`
Expected: Single-column layout with player cards on top, completed matches (5 max), upcoming matches (5 max). Expand buttons visible if >5 matches in a section. Clicking a completed match navigates to `/match/[id]` (404 for now — that's expected).

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: rewrite leaderboard page with player cards, single-column layout, and show-5-expand"
```

---

### Task 3: Create match detail page

**Files:**
- Create: `src/app/match/[id]/page.tsx`

- [ ] **Step 1: Create the directory structure**

```bash
mkdir -p src/app/match/\[id\]
```

- [ ] **Step 2: Write the match detail page**

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { TEAMS } from '@/lib/constants';
import Link from 'next/link';

export default function MatchDetailPage() {
  const params = useParams();
  const matchId = params.id as string;

  const [match, setMatch] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchData();
  }, [matchId]);

  const fetchData = async () => {
    try {
      const [matchRes, playRes] = await Promise.all([
        fetch('/api/matches'),
        fetch('/api/players')
      ]);
      const allMatches = await matchRes.json();
      const allPlayers = await playRes.json();
      setPlayers(allPlayers);

      const found = allMatches.find((m: any) => m.id === matchId);
      if (found) {
        setMatch(found);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      console.error(err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const getTeamLogo = (teamName: string) => {
    const team = TEAMS.find((t: any) => t.name.toLowerCase().includes(teamName.toLowerCase()) || teamName.toLowerCase().includes(t.name.toLowerCase()));
    return team?.logo || 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';
  };

  const getPlayerName = (id: string) => players.find(p => p.id === id)?.name || 'Unknown';

  if (loading) {
    return (
      <div className="match-detail-container animate-fade">
        <p style={{ color: 'var(--muted-foreground)', textAlign: 'center', padding: '4rem 0' }}>Loading...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="match-detail-container animate-fade">
        <Link href="/" className="match-detail-back">← Back to Leaderboard</Link>
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🔍</span>
          <h2 style={{ marginBottom: '0.5rem' }}>Match not found</h2>
          <p style={{ color: 'var(--muted-foreground)' }}>This match doesn't exist or the URL is invalid.</p>
        </div>
      </div>
    );
  }

  const hasResults = match.results && match.results.length > 0;
  const parts = match.name.split(/ vs /i);
  const t1 = parts[0]?.trim() || '';
  const t2 = parts[1]?.trim() || '';

  if (!hasResults) {
    return (
      <div className="match-detail-container animate-fade">
        <Link href="/" className="match-detail-back">← Back to Leaderboard</Link>
        <div className="match-detail-header">
          <div className="match-logos" style={{ gap: '0.75rem' }}>
            <img src={getTeamLogo(t1)} alt={t1} className="team-logo" style={{ width: 48, height: 48 }} />
            <span className="vs-badge">VS</span>
            <img src={getTeamLogo(t2)} alt={t2} className="team-logo" style={{ width: 48, height: 48 }} />
          </div>
          <div>
            <h2 style={{ fontWeight: 600, letterSpacing: '-0.025em' }}>{match.name}</h2>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
              {new Date(match.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} • Match #{match.id}
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>⏳</span>
          <h3 style={{ marginBottom: '0.5rem' }}>Results not yet available</h3>
          <p style={{ color: 'var(--muted-foreground)' }}>Check back after the match!</p>
        </div>
      </div>
    );
  }

  const sortedResults = [...match.results].sort((a: any, b: any) => a.rank - b.rank);

  return (
    <div className="match-detail-container animate-fade">
      <Link href="/" className="match-detail-back">← Back to Leaderboard</Link>

      {/* Match Header */}
      <div className="match-detail-header">
        <div className="match-logos" style={{ gap: '0.75rem' }}>
          <img src={getTeamLogo(t1)} alt={t1} className="team-logo" style={{ width: 48, height: 48 }} />
          <span className="vs-badge">VS</span>
          <img src={getTeamLogo(t2)} alt={t2} className="team-logo" style={{ width: 48, height: 48 }} />
        </div>
        <div>
          <h2 style={{ fontWeight: 600, letterSpacing: '-0.025em' }}>{match.name}</h2>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
            {new Date(match.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} • Match #{match.id}
          </p>
        </div>
      </div>

      {/* Body: Rankings + Commentary */}
      <div className="match-detail-body">
        {/* Rankings Table */}
        <div className="match-detail-rankings">
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontWeight: 600, fontSize: '1rem' }}>Rankings</h3>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr style={{ background: 'var(--muted)' }}>
                  <th style={{ width: '60px' }}>Rank</th>
                  <th>Player</th>
                  <th>Rank Pts</th>
                  <th>My11</th>
                </tr>
              </thead>
              <tbody>
                {sortedResults.map((res: any) => (
                  <tr key={res.id || res.playerId}>
                    <td style={{ fontWeight: 'bold' }}>
                      {res.rank === 1 ? '🥇' : res.rank === 2 ? '🥈' : res.rank === 3 ? '🥉' : `#${res.rank}`}
                    </td>
                    <td>{getPlayerName(res.playerId)}</td>
                    <td style={{ fontWeight: 'bold', color: 'var(--foreground)' }}>+{res.leaguePoints}</td>
                    <td style={{ color: 'var(--muted-foreground)' }}>{res.dream11Points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Commentary */}
        {match.summary && (
          <div className="match-detail-commentary">
            <div className="commentary-header">
              <span style={{ animation: 'pulse 2s infinite' }}>✨</span>
              <span>Epic AI Match Commentary</span>
            </div>
            {match.summary.split('\n').map((para: string, idx: number) => (
              <p key={idx}>{para}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify the match detail page**

Run dev server if not already running: `npm run dev`
Open: `http://localhost:3000`
Click a completed match → should navigate to `/match/[id]` and show rankings + AI commentary.
Try an invalid URL like `/match/999` → should show "Match not found".

- [ ] **Step 4: Commit**

```bash
git add src/app/match/\[id\]/page.tsx
git commit -m "feat: add match detail page at /match/[id] with rankings and AI commentary"
```

---

### Task 4: Fix AI summary bug in admin page

**Files:**
- Modify: `src/app/admin/page.tsx:153-183`

- [ ] **Step 1: Fix handleBulkResultSubmit to re-fetch actual summary**

In `src/app/admin/page.tsx`, replace the `handleBulkResultSubmit` function (lines 153-183) with:

```tsx
  const handleBulkResultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;

    const validResults = bulkResults
      .filter(r => r.playerId && r.dream11Points !== '')
      .map(r => ({
        matchId: selectedMatch.id,
        playerId: r.playerId,
        rank: Number(r.rank),
        dream11Points: Number(r.dream11Points)
      }));

    if (validResults.length === 0) return alert('No valid player results filled out.');

    const res = await fetch('/api/match-results/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ results: validResults })
    });

    const data = await res.json();
    if (data.success) {
      alert('Match results saved successfully! AI Summary triggered in background.');
      // Re-fetch matches to get the actual summary from the database
      const matchesRes = await fetch('/api/matches');
      const allMatches = await matchesRes.json();
      setMatches(allMatches.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      const updated = allMatches.find((m: any) => m.id === selectedMatch.id);
      if (updated) {
        setSelectedMatch(updated);
      }
      setIsEditing(false);
    } else {
      alert('Failed: ' + data.error);
    }
  };
```

The key change: instead of setting `summary` to the placeholder string `'AI Commentary Generated'`, we re-fetch all matches from the API (which reads the actual summary from the `match_summaries` table) and update `selectedMatch` with the real data.

- [ ] **Step 2: Verify the fix**

Run dev server: `npm run dev`
Open: `http://localhost:3000/admin`
Login with `ipl2026` / `maximus69`
Select a completed match → click "Regenerate Summary" → after success, the AI commentary should display the actual generated text, not a placeholder.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "fix: display actual AI summary text instead of placeholder after bulk result submission"
```

---

### Task 5: Update PlayerProfile onMatchClick to navigate to match page

**Files:**
- Modify: `src/app/components/PlayerProfile.tsx`

This is already handled in Task 2 where we changed the `onMatchClick` callback in `page.tsx` to:
```tsx
onMatchClick={(m: any) => {
  setSelectedPlayer(null);
  window.location.href = `/match/${m.id}`;
}}
```

No changes needed to `PlayerProfile.tsx` itself — it calls `onMatchClick(m.match)` and the parent now navigates instead of opening a modal.

- [ ] **Step 1: Verify PlayerProfile → match navigation**

Open: `http://localhost:3000`
Click a player card → PlayerProfile modal opens
Click a recent match in "Recent Form (Last 5)" → modal closes and navigates to `/match/[id]`

- [ ] **Step 2: Final verification — full flow test**

1. Open `http://localhost:3000` on desktop → verify leaderboard cards, completed (5+expand), upcoming (5+expand) layout
2. Open in mobile viewport (375px) → verify same order, cards readable, expand buttons work
3. Click a completed match → navigates to `/match/[id]` with side-by-side layout on desktop
4. Resize to mobile → rankings stack above commentary
5. Click "← Back to Leaderboard" → returns to homepage
6. Navigate to `/match/999` → shows "Match not found"
7. Navigate to an upcoming match URL → shows "Results not yet available"
8. Open `/admin` → login → select a completed match → verify AI summary displays correctly
9. Click "Regenerate Summary" → verify actual summary text appears (not placeholder)

- [ ] **Step 3: Final commit (if any missed changes)**

```bash
git status
# If clean, no commit needed. Otherwise:
git add -A
git commit -m "chore: final cleanup for mobile optimization and match detail page"
```
