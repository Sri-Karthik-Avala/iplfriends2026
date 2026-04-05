// Seed match 11 results (RCB vs CSK, 5 Apr 2026).
// Applies a one-time +1 bonus to each player's my11 score for this match only.
// POSTs to production via /api/match-results/bulk, which also triggers AI summary.

const API_BASE = 'https://iplfriends2026-qrnm.vercel.app';
const MATCH_ID = '11';
const BONUS = 1; // +1 for everyone, today only

// Player UUID map (from production /api/players)
const PLAYERS = {
  Siri:    '3b83648a-69f8-4036-96ec-c3e03102d9c1',
  Sasank:  '3b83648a-69f8-4036-96ec-c3e03102d9c2',
  Donga:   '3b83648a-69f8-4036-96ec-c3e03102d9c3',
  Sampath: '3b83648a-69f8-4036-96ec-c3e03102d9c4',
  Ak:      '3b83648a-69f8-4036-96ec-c3e03102d9c5',
  Umesh:   '3b83648a-69f8-4036-96ec-c3e03102d9c6',
  Rohit:   '3b83648a-69f8-4036-96ec-c3e03102d9c7',
  Sujan:   'cf7217e3-b340-4069-bac9-ff50d13748b4',
};

// Raw my11 cumulative totals (from My11 Circle leaderboard) ordered by rank.
// Sasank sat this match out.
const raw = [
  { rank: 1, name: 'Donga',   my11: 905.5 },  // Pointbreak12
  { rank: 2, name: 'Umesh',   my11: 842   },  // Umesh_0111
  { rank: 3, name: 'Ak',      my11: 809.5 },  // AKSHITH69
  { rank: 4, name: 'Siri',    my11: 734.5 },  // Maximus6969
  { rank: 5, name: 'Sampath', my11: 689   },  // Killerpsycho
  { rank: 6, name: 'Rohit',   my11: 644   },  // Pbksdhecupuu
  { rank: 7, name: 'Sujan',   my11: 518.5 },  // Sujan0777
];

const results = raw.map(r => ({
  matchId: MATCH_ID,
  playerId: PLAYERS[r.name],
  rank: r.rank,
  dream11Points: r.my11 + BONUS,
}));

console.log('=== Match 11 payload (with +1 bonus applied) ===');
results.forEach(r => {
  const name = Object.entries(PLAYERS).find(([, id]) => id === r.playerId)[0];
  console.log(`  #${r.rank} ${name.padEnd(8)} → ${r.dream11Points} my11 pts`);
});
console.log('\nSasank: did not play\n');

console.log(`POSTing to ${API_BASE}/api/match-results/bulk ...`);
const res = await fetch(`${API_BASE}/api/match-results/bulk`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ results }),
});

const data = await res.json();
console.log('\n=== Response ===');
console.log(JSON.stringify(data, null, 2));

if (!data.success) {
  console.error('\n❌ Failed to save match 11 results.');
  process.exit(1);
}

console.log('\n✅ Match 11 results saved.');
console.log(data.summaryGenerated
  ? '✨ AI summary generated.'
  : '⚠️  Summary generation failed (check OPENAI_API_KEY on server).');
