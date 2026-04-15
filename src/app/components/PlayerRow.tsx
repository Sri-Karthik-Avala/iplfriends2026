// src/app/components/PlayerRow.tsx
'use client';

import Link from 'next/link';
import { parseImagePos } from '@/lib/image';
import type { Achievement, PlayerStats } from '@/lib/leaderboard';

// Roman numeral mapping for ranks 1-20 (covers the league comfortably).
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];

export type PlayerRowVariant = 'card' | 'table' | 'micro';

export type PlayerRowProps = {
  rank: number;
  player: {
    id: string;
    name: string;
    team?: string;
    teamColor?: string;
    imageUrl?: string;
  };
  points: number;
  title?: string | null;
  stats?: PlayerStats;
  badges?: Achievement[];
  variant?: PlayerRowVariant;
  asLink?: boolean;
};

export default function PlayerRow({
  rank,
  player,
  points,
  title,
  stats,
  badges = [],
  variant = 'card',
  asLink = true,
}: PlayerRowProps) {
  const { src: avatarSrc, objectPosition: avatarPos } = parseImagePos(player.imageUrl);
  const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : '';
  const showStats = !!stats && stats.played > 0 && variant === 'card';
  const showBadges = badges.length > 0 && variant === 'card';

  const rowContent = (
    <div className={`player-row ${rankClass}`}>
      <div className="player-rank-numeral">{ROMAN[rank] || `#${rank}`}</div>
      <img
        src={avatarSrc || 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png'}
        alt={player.name}
        className="player-photo"
        style={{
          objectPosition: avatarPos,
          borderRightColor: player.teamColor || 'var(--border-strong)',
        }}
      />
      <div className="player-info">
        <div className="player-name-row">
          <span className="player-name">{player.name}</span>
          <span className="player-pts">
            {points}
            <span className="player-pts-label">pts</span>
          </span>
        </div>
        {title ? (
          <div className="player-title">"{title}"</div>
        ) : player.team ? (
          <div className="player-title">{player.team}</div>
        ) : null}
        {showStats && stats && (
          <div className="player-stats">
            <span>{stats.played}/{stats.totalCompleted} played</span>
            <span>avg #{stats.avgRank}</span>
            <span>my11 {stats.avgMy11}</span>
          </div>
        )}
        {showBadges && (
          <div className="player-badges">
            {badges.map((b, i) => (
              <span key={i} className={`player-chip chip-${b.kind}`} title={b.label}>
                <span className="chip-emoji">{b.emoji}</span>
                <span className="chip-label">{b.label}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (asLink && variant === 'card') {
    return (
      <Link
        href={`/profile/${player.name.toLowerCase()}`}
        style={{ textDecoration: 'none', color: 'inherit' }}
      >
        {rowContent}
      </Link>
    );
  }
  return rowContent;
}
