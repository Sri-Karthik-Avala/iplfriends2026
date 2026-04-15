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
        <p style={{ color: 'var(--fg-muted)', textAlign: 'center', padding: '4rem 0' }}>Loading...</p>
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
          <p style={{ color: 'var(--fg-muted)' }}>This match doesn't exist or the URL is invalid.</p>
        </div>
      </div>
    );
  }

  const hasResults = match.results && match.results.length > 0;
  const parts = match.name.split(/ vs /i);
  const t1 = parts[0]?.trim() || '';
  const t2 = parts[1]?.trim() || '';

  if (match.cancelled) {
    return (
      <div className="match-detail-container animate-fade">
        <Link href="/" className="match-detail-back">← Back to Leaderboard</Link>
        <div className="match-detail-header">
          <div className="match-logos" style={{ gap: '0.75rem' }}>
            <img src={getTeamLogo(t1)} alt={t1} className="team-logo" style={{ width: 48, height: 48, filter: 'grayscale(1)' }} />
            <span className="vs-badge">VS</span>
            <img src={getTeamLogo(t2)} alt={t2} className="team-logo" style={{ width: 48, height: 48, filter: 'grayscale(1)' }} />
          </div>
          <div>
            <h2 style={{ fontWeight: 600, letterSpacing: '-0.025em', textDecoration: 'line-through', fontFamily: 'var(--font-display)' }}>{match.name}</h2>
            <p style={{ color: 'var(--fg-muted)', fontSize: '0.875rem' }}>
              {new Date(match.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} • Match #{match.id}
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>❌</span>
          <h3 style={{ marginBottom: '0.5rem', fontFamily: 'var(--font-display)', color: 'var(--fg-strong)' }}>Match Cancelled</h3>
          <p style={{ color: 'var(--fg-muted)' }}>This match was cancelled. No points were awarded.</p>
        </div>
      </div>
    );
  }

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
            <h2 style={{ fontWeight: 600, letterSpacing: '-0.025em', fontFamily: 'var(--font-display)' }}>{match.name}</h2>
            <p style={{ color: 'var(--fg-muted)', fontSize: '0.875rem' }}>
              {new Date(match.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} • Match #{match.id}
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>⏳</span>
          <h3 style={{ marginBottom: '0.5rem', fontFamily: 'var(--font-display)', color: 'var(--fg-strong)' }}>Results not yet available</h3>
          <p style={{ color: 'var(--fg-muted)' }}>Check back after the match!</p>
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
          <h2 style={{ fontWeight: 600, letterSpacing: '-0.025em', fontFamily: 'var(--font-display)' }}>{match.name}</h2>
          <p style={{ color: 'var(--fg-muted)', fontSize: '0.875rem' }}>
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
                    <td style={{ fontWeight: 'bold', color: 'var(--fg-strong)' }}>+{res.leaguePoints}</td>
                    <td style={{ color: 'var(--fg-muted)' }}>{res.dream11Points}</td>
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
