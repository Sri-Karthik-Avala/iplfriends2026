// src/lib/leaderboard.ts
// Extracted from src/app/page.tsx so match detail and profile pages can reuse
// achievement + stats computation without importing the whole leaderboard page.

export type PlayerMetaEntry = {
  played: number;
  ranks: number[];
  my11: number[];
  firsts: number;
  seconds: number;
  thirds: number;
  topThrees: number;
  dnps: number;
  bestMy11: number;
};

export type AchievementKind = 'gold' | 'silver' | 'bronze' | 'blue' | 'red';

export type Achievement = {
  emoji: string;
  label: string;
  kind: AchievementKind;
};

export type PlayerStats = {
  played: number;
  totalCompleted: number;
  avgRank: string;
  avgMy11: string;
};

type LeaderboardEntry = { player: { id: string } };

export function buildPlayerMetaMap(matches: any[], players: any[]) {
  const metaMap: Record<string, PlayerMetaEntry> = {};
  players.forEach((p: any) => {
    metaMap[p.id] = {
      played: 0,
      ranks: [],
      my11: [],
      firsts: 0,
      seconds: 0,
      thirds: 0,
      topThrees: 0,
      dnps: 0,
      bestMy11: 0,
    };
  });

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
    players.forEach((p: any) => {
      if (!playedIds.has(p.id) && metaMap[p.id]) metaMap[p.id].dnps += 1;
    });
  });

  return { metaMap, totalCompleted: scored.length };
}

export function buildStats(
  playerId: string,
  metaMap: Record<string, PlayerMetaEntry>,
  totalCompleted: number
): PlayerStats {
  const s = metaMap[playerId];
  if (!s || s.played === 0) {
    return { played: 0, totalCompleted, avgRank: '—', avgMy11: '—' };
  }
  const avgRank = Math.round(s.ranks.reduce((a, b) => a + b, 0) / s.played).toString();
  const avgMy11 = Math.round(s.my11.reduce((a, b) => a + b, 0) / s.played).toString();
  return { played: s.played, totalCompleted, avgRank, avgMy11 };
}

export function computeAchievements(
  playerId: string,
  metaMap: Record<string, PlayerMetaEntry>,
  totalCompleted: number,
  leaderboard: LeaderboardEntry[]
): Achievement[] {
  const s = metaMap[playerId];
  const badges: Achievement[] = [];
  if (!s || totalCompleted === 0) return badges;

  const entries = Object.values(metaMap);
  const maxFirsts = Math.max(0, ...entries.map(e => e.firsts));
  const maxSeconds = Math.max(0, ...entries.map(e => e.seconds));
  const maxThirds = Math.max(0, ...entries.map(e => e.thirds));
  const maxMy11 = Math.max(0, ...entries.map(e => e.bestMy11));
  const maxDnps = Math.max(0, ...entries.map(e => e.dnps));
  const leaderId = leaderboard[0]?.player?.id;

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
}
