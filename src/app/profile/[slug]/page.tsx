'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

export default function ProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [player, setPlayer] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const [pRes, lbRes, mRes] = await Promise.all([
          fetch(`/api/players/${slug}`),
          fetch('/api/leaderboard'),
          fetch('/api/matches')
        ]);
        if (!pRes.ok) { setLoading(false); return; }
        const pData = await pRes.json();
        setPlayer(pData);
        setLeaderboard(await lbRes.json());
        setMatches(await mRes.json());
      } catch { }
      setLoading(false);
    })();
  }, [slug]);

  const stats = useMemo(() => {
    if (!player) return null;
    const lb = leaderboard.find(l => l.player.id === player.id);
    const rank = lb ? leaderboard.indexOf(lb) + 1 : 0;
    const pts = lb?._sum?.leaguePoints || 0;

    const played = matches.filter(m => m.results?.some((r: any) => r.playerId === player.id));
    const sorted = played.sort((a, b) => {
      const dd = new Date(b.date).getTime() - new Date(a.date).getTime();
      return dd !== 0 ? dd : Number(b.id) - Number(a.id);
    });
    const all = sorted.map(m => {
      const p = m.results.find((r: any) => r.playerId === player.id);
      return { match: m, rank: p?.rank || 0, score: p?.dream11Points || 0, lp: p?.leaguePoints || 0 };
    });
    return { rank, pts, played: played.length, last5: all.slice(0, 5), all };
  }, [player, leaderboard, matches]);

  const summaryBlock = useMemo(() => {
    if (!player) return null;
    const ws = matches
      .filter(m => m.summary && m.results?.some((r: any) => r.playerId === player.id))
      .sort((a, b) => {
        const dd = new Date(b.date).getTime() - new Date(a.date).getTime();
        return dd !== 0 ? dd : Number(b.id) - Number(a.id);
      });
    if (!ws.length) return null;
    const esc = player.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const m = ws[0].summary.match(new RegExp(`((?:🥇|🥈|🥉|[0-9]️⃣|💀)\\s+${esc}\\s*—[\\s\\S]*?)(?=(?:🥇|🥈|🥉|[0-9]️⃣|💀)\\s+\\w|$)`, 'i'));
    return m ? { matchName: ws[0].name, text: m[1].trim() } : null;
  }, [player, matches]);

  if (loading) return (
    <div className="container animate-fade" style={{ paddingTop: '3rem', textAlign: 'center', color: 'var(--fg-muted)' }}>Loading...</div>
  );
  if (!player || !stats) return (
    <div className="container animate-fade" style={{ paddingTop: '3rem', textAlign: 'center' }}>
      <p style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Player not found</p>
      <Link href="/" style={{ color: 'var(--fg-muted)' }}>Back to leaderboard</Link>
    </div>
  );

  const tc = player.team_color || '#555';
  const imgRaw = player.image_url || 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';
  const img = imgRaw.split('#')[0];

  const RankDot = ({ rank, sz }: { rank: number; sz: number }) => {
    const bg = rank === 1 ? 'var(--gold)' : rank === 2 ? 'var(--silver)' : rank === 3 ? 'var(--bronze)' : 'var(--fg-muted)';
    return (
      <div style={{
        width: sz, height: sz, borderRadius: '50%', background: bg,
        color: rank <= 3 ? 'var(--bg-base)' : 'var(--fg-strong)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontWeight: 800, fontSize: sz * 0.35, flexShrink: 0,
        boxShadow: rank <= 3 ? `0 0 6px ${bg}` : 'none'
      }}>{rank}</div>
    );
  };

  return (
    <div className="prof-page animate-fade">
      <Link href="/" className="prof-back">← Back to Leaderboard</Link>

      {/* Hero: image left + stats right */}
      <div className="prof-hero" style={{ '--tc': tc } as React.CSSProperties}>
        <div className="prof-img-wrap" style={{ background: `linear-gradient(135deg, ${tc}50 0%, var(--bg-base) 100%)` }}>
          <img src={img} alt={player.name} className="prof-img" />
        </div>
        <div className="prof-info">
          <span className="prof-badge" style={{ background: `${tc}40`, color: tc, borderColor: tc }}>{player.team}</span>
          <h1 className="prof-name" style={{ textShadow: `0 0 20px ${tc}60` }}>{player.name}</h1>
          <div className="prof-stats">
            <div className="prof-st" style={{ borderColor: tc }}>
              <span className="prof-st-n">#{stats.rank}</span>
              <span className="prof-st-l">Rank</span>
            </div>
            <div className="prof-st" style={{ borderColor: 'var(--gold)' }}>
              <span className="prof-st-n">{stats.pts}</span>
              <span className="prof-st-l">Points</span>
            </div>
            <div className="prof-st" style={{ borderColor: 'var(--border-strong)' }}>
              <span className="prof-st-n">{stats.played}</span>
              <span className="prof-st-l">Played</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Summary — full width below hero */}
      {summaryBlock && (
        <div className="prof-section">
          <div className="prof-sec-t">AI Commentary — {summaryBlock.matchName}</div>
          <div className="prof-ai">
            {summaryBlock.text.split('\n').map((line, i) => {
              if (/^(?:🥇|🥈|🥉|[0-9]️⃣|💀)/.test(line.trim())) return <p key={i} className="prof-ai-h">{line}</p>;
              if (/pts\s*\|/.test(line)) return <p key={i} className="prof-ai-s">{line}</p>;
              if (!line.trim()) return null;
              return <p key={i} className="prof-ai-t">{line}</p>;
            })}
          </div>
        </div>
      )}

      {/* Recent Form */}
      <div className="prof-section">
        <div className="prof-sec-t">Recent Form</div>
        {stats.last5.length === 0 ? (
          <p style={{ color: 'var(--fg-muted)' }}>No matches yet.</p>
        ) : (
          <div className="prof-form">
            {stats.last5.map((m, i) => (
              <Link key={i} href={`/match/${m.match.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="prof-fr">
                  <RankDot rank={m.rank} sz={28} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="prof-fr-name">{m.match.name}</div>
                    <div className="prof-fr-date">{new Date(m.match.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="prof-fr-pts">{m.score}</div>
                    <div className="prof-fr-lp">+{m.lp} pts</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {stats.all.length > 5 && (
          <>
            <button className="prof-exp" onClick={() => setShowAll(!showAll)}>
              {showAll ? 'Show less ↑' : `View all ${stats.all.length} matches ↓`}
            </button>
            {showAll && (
              <div className="prof-form" style={{ marginTop: '0.5rem' }}>
                {stats.all.slice(5).map((m, i) => (
                  <Link key={i} href={`/match/${m.match.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="prof-fr">
                      <RankDot rank={m.rank} sz={28} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="prof-fr-name">{m.match.name}</div>
                        <div className="prof-fr-date">{new Date(m.match.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="prof-fr-pts">{m.score}</div>
                        <div className="prof-fr-lp">+{m.lp} pts</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .prof-page {
          max-width: 900px; margin: 0 auto;
          padding: 1rem; min-height: 80vh;
        }
        .prof-back {
          display: inline-block; color: var(--fg-muted);
          text-decoration: none; font-size: 0.85rem; font-weight: 500;
          margin-bottom: 1rem; transition: color 0.2s;
        }
        .prof-back:hover { color: var(--foreground); }

        /* ===== HERO: image + stats ===== */
        .prof-hero {
          display: flex; gap: 1rem;
          background: var(--card); border-radius: 16px;
          border: 1px solid color-mix(in srgb, var(--tc) 40%, transparent);
          overflow: hidden; margin-bottom: 1rem;
        }
        .prof-img-wrap {
          flex: 0 0 42%; max-width: 280px; min-height: 200px;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden; position: relative;
        }
        .prof-img {
          width: 100%; height: 100%;
          object-fit: contain; object-position: center bottom;
        }
        .prof-info {
          flex: 1; padding: 1.25rem 1.25rem 1.25rem 0;
          display: flex; flex-direction: column; justify-content: center;
          min-width: 0;
        }
        .prof-badge {
          display: inline-block; padding: 0.15rem 0.55rem; border-radius: 10px;
          font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
          font-size: 0.58rem; border: 1px solid; margin-bottom: 0.4rem;
          width: fit-content;
        }
        .prof-name {
          font-size: 1.6rem; font-weight: 900; line-height: 1;
          margin: 0 0 0.8rem; text-transform: uppercase; color: var(--fg-strong);
          font-family: var(--font-display);
        }
        .prof-stats { display: flex; gap: 0.4rem; flex-wrap: wrap; }
        .prof-st {
          flex: 1; min-width: 60px; text-align: center;
          background: rgba(0,0,0,0.35); border-radius: 8px;
          border-bottom: 3px solid; padding: 0.45rem 0.3rem;
        }
        .prof-st-n {
          display: block; font-size: 1.15rem; font-weight: 800;
          color: var(--fg-strong); line-height: 1.1;
        }
        .prof-st-l {
          display: block; font-size: 0.5rem; font-weight: 600;
          text-transform: uppercase; color: var(--fg-muted);
          letter-spacing: 0.4px; margin-top: 0.05rem;
        }

        /* ===== SECTIONS ===== */
        .prof-section {
          background: var(--card); border: 1px solid var(--border);
          border-radius: 12px; padding: 1rem;
          margin-bottom: 1rem;
        }
        .prof-sec-t {
          font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
          color: var(--fg-muted); letter-spacing: 0.5px;
          margin-bottom: 0.6rem;
        }

        /* AI */
        .prof-ai {
          background: linear-gradient(135deg, rgba(236,28,36,0.05) 0%, rgba(255,255,60,0.05) 100%);
          border: 1px solid var(--border);
          border-radius: 8px; padding: 0.75rem;
        }
        .prof-ai-h {
          font-weight: 700; font-size: 0.88rem; color: var(--foreground);
          margin: 0 0 0.1rem; line-height: 1.3;
        }
        .prof-ai-s {
          font-size: 0.72rem; color: var(--fg-muted);
          font-family: monospace; margin: 0 0 0.3rem;
        }
        .prof-ai-t {
          font-size: 0.82rem; color: var(--fg-muted);
          line-height: 1.45; margin: 0 0 0.1rem;
        }

        /* Form rows */
        .prof-form { display: flex; flex-direction: column; gap: 0.35rem; }
        .prof-fr {
          display: flex; align-items: center; gap: 0.6rem;
          padding: 0.55rem 0.65rem; background: var(--bg-raised);
          border: 1px solid var(--border); border-radius: 8px;
          cursor: pointer; transition: background 0.15s;
        }
        .prof-fr:hover { background: var(--bg-raised-strong); }
        .prof-fr-name {
          font-size: 0.82rem; color: var(--fg-strong); font-weight: 500;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .prof-fr-date { font-size: 0.68rem; color: var(--fg-muted); }
        .prof-fr-pts { font-size: 0.82rem; color: var(--fg-muted); font-weight: 500; }
        .prof-fr-lp { font-size: 0.72rem; color: var(--foreground); font-weight: 700; }

        .prof-exp {
          display: flex; align-items: center; justify-content: center;
          width: 100%; padding: 0.5rem; margin-top: 0.4rem;
          background: transparent; border: 1px dashed var(--border);
          border-radius: 8px; color: var(--fg-muted);
          font-size: 0.75rem; cursor: pointer;
        }
        .prof-exp:hover { color: var(--fg-strong); border-color: var(--border-strong); }

        /* ===== DESKTOP ===== */
        @media (min-width: 768px) {
          .prof-page { padding: 1.5rem; }
          .prof-hero { gap: 0; }
          .prof-img-wrap { flex: 0 0 300px; max-width: 300px; min-height: 360px; }
          .prof-info { padding: 2rem; }
          .prof-name { font-size: 2.8rem; margin-bottom: 1.2rem; }
          .prof-stats { gap: 0.6rem; }
          .prof-st { padding: 0.65rem 0.5rem; border-radius: 10px; }
          .prof-st-n { font-size: 1.5rem; }
          .prof-st-l { font-size: 0.6rem; }
          .prof-badge { font-size: 0.68rem; padding: 0.25rem 0.7rem; }
          .prof-section { padding: 1.25rem; }
          .prof-sec-t { font-size: 0.72rem; }
          .prof-ai { padding: 1rem; }
          .prof-ai-h { font-size: 0.95rem; }
          .prof-ai-t { font-size: 0.88rem; }
        }
      `}</style>
    </div>
  );
}
