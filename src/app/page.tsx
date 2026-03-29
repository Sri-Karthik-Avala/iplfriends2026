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
