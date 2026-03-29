import React, { useMemo } from 'react';

type PlayerProfileProps = {
  playerData: any;
  matches: any[];
  overallRank: number;
  totalLeaguePoints: number;
  onClose: () => void;
  onMatchClick: (match: any) => void;
};

export default function PlayerProfile({ playerData, matches, overallRank, totalLeaguePoints, onClose, onMatchClick }: PlayerProfileProps) {
  if (!playerData) return null;

  // Compute stats from match history
  const stats = useMemo(() => {
    const playedMatches = matches.filter(m => m.results?.some((r: any) => r.playerId === playerData.id));
    const sortedPlayed = playedMatches.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Last 5
    const last5 = sortedPlayed.slice(0, 5);
    const last5Matches = last5.map(m => {
      const pRes = m.results.find((r: any) => r.playerId === playerData.id);
      return {
        match: m,
        rank: pRes?.rank || 0,
        score: pRes?.dream11Points || 0
      };
    });

    return {
      matchesPlayed: playedMatches.length,
      last5Matches
    };
  }, [playerData.id, matches]);

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(5px)',
      animation: 'fadeIn 0.2s ease',
      padding: '1rem'
    }}>
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '850px',
        backgroundColor: 'var(--card)',
        borderRadius: '24px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: `0 0 40px ${playerData.teamColor}50, inset 0 0 20px rgba(255,255,255,0.05)`,
        border: `1px solid ${playerData.teamColor}80`
      }} className="profile-modal-inner">
        
        <button onClick={onClose} style={{
          position: 'absolute', top: '15px', right: '15px',
          color: '#fff', fontSize: '1.5rem', zIndex: 10,
          background: 'rgba(0,0,0,0.5)', width: '36px', height: '36px',
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: 'none', cursor: 'pointer'
        }}>×</button>
        
        <div className="profile-split" style={{ display: 'flex', flexWrap: 'wrap', width: '100%' }}>
          {/* Left Side: Large image & glow */}
          <div style={{
            flex: '1 1 300px',
            background: `linear-gradient(135deg, ${playerData.teamColor} 0%, #000 100%)`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '150%', height: '150%', background: `radial-gradient(circle, ${playerData.teamColor} 0%, transparent 60%)`, opacity: 0.3 }} />
            
            <img 
              src={playerData.imageUrl || "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png"} 
              alt={playerData.name}
              style={{ 
                width: '100%', 
                maxWidth: '220px', 
                aspectRatio: '3/4', 
                objectFit: 'cover', 
                borderRadius: '16px',
                border: '4px solid rgba(255,255,255,0.2)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                zIndex: 1
              }} 
            />
          </div>

          {/* Right Side: Stats */}
          <div style={{ flex: '2 1 400px', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <span style={{ 
                display: 'inline-block', padding: '0.4rem 1rem', borderRadius: '20px',
                backgroundColor: `${playerData.teamColor}30`, color: playerData.teamColor || '#fff',
                fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px',
                marginBottom: '1rem', border: `1px solid ${playerData.teamColor}`
              }}>
                {playerData.team}
              </span>
              <h1 style={{ fontSize: '2.8rem', lineHeight: 1, margin: 0, textTransform: 'uppercase', color: '#fff', textShadow: `0 0 10px ${playerData.teamColor}80` }}>
                {playerData.name}
              </h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1.25rem', borderRadius: '16px', borderLeft: `4px solid ${playerData.teamColor}` }}>
                <div style={{ color: 'var(--muted-foreground)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>Overall Rank</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>#{overallRank}</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1.25rem', borderRadius: '16px', borderLeft: `4px solid var(--primary)` }}>
                <div style={{ color: 'var(--muted-foreground)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>Total Rank Pts</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>{totalLeaguePoints}</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1.25rem', borderRadius: '16px', borderLeft: `4px solid var(--ring)` }}>
                <div style={{ color: 'var(--muted-foreground)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>Matches Played</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--foreground)' }}>{stats.matchesPlayed}</div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
              <h3 style={{ color: 'var(--muted-foreground)', marginBottom: '1rem', fontSize: '0.9rem', textTransform: 'uppercase' }}>Recent Form (Last 5)</h3>
              
              <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {stats.last5Matches.map((m, i) => (
                  <div 
                    key={i} 
                    onClick={() => onMatchClick(m.match)}
                    style={{ 
                      flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '150px',
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px', padding: '1rem', cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ 
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: m.rank === 1 ? '#FABB18' : m.rank === 2 ? '#C0C0C0' : m.rank === 3 ? '#CD7F32' : 'var(--muted)',
                        color: m.rank <= 3 ? '#000' : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: '0.9rem',
                        boxShadow: m.rank <= 3 ? `0 0 10px ${m.rank === 1 ? '#FABB18' : m.rank === 2 ? '#C0C0C0' : '#CD7F32'}` : 'none'
                      }}>
                        {m.rank}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', fontWeight: 600 }}>{m.score} pts</div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '0.5rem' }}>
                      {m.match.name}
                    </div>
                  </div>
                ))}
                {stats.last5Matches.length === 0 && <span style={{ color: 'var(--muted-foreground)' }}>No matches played yet.</span>}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
