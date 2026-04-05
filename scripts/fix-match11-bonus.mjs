// One-time fix for match 11:
// 1. Revert my11 scores: subtract 1 (remove the +1 that was mistakenly added)
// 2. Apply the intended bonus: add +1 to each player's league_points
// Then trigger summary regeneration.

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load env
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf-8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const MATCH_ID = '11';

// 1. Read current match 11 rows
const { data: rows, error: fetchErr } = await supabase
  .from('match_results')
  .select('*')
  .eq('match_id', MATCH_ID);
if (fetchErr) throw fetchErr;

console.log('=== Current match 11 rows ===');
rows
  .sort((a, b) => a.rank - b.rank)
  .forEach(r =>
    console.log(`  #${r.rank} pid=${r.player_id.slice(0, 4)} my11=${r.dream11_points} lp=${r.league_points}`)
  );

// 2. For each row: my11 -= 1, league_points += 1
console.log('\n=== Applying fix ===');
for (const r of rows) {
  const newMy11 = Number(r.dream11_points) - 1;
  const newLp = Number(r.league_points) + 1;
  const { error: upErr } = await supabase
    .from('match_results')
    .update({ dream11_points: newMy11, league_points: newLp })
    .eq('id', r.id);
  if (upErr) throw upErr;
  console.log(`  #${r.rank} pid=${r.player_id.slice(0, 4)}: my11 ${r.dream11_points} → ${newMy11} | lp ${r.league_points} → ${newLp}`);
}

// 3. Verify
const { data: after } = await supabase
  .from('match_results')
  .select('*')
  .eq('match_id', MATCH_ID);
console.log('\n=== After fix ===');
after
  .sort((a, b) => a.rank - b.rank)
  .forEach(r =>
    console.log(`  #${r.rank} pid=${r.player_id.slice(0, 4)} my11=${r.dream11_points} lp=${r.league_points}`)
  );

console.log('\n✅ Match 11 fixed. Now regenerating summary...');

// 4. Trigger summary regeneration via production API
const API_BASE = 'https://iplfriends2026-qrnm.vercel.app';
const res = await fetch(`${API_BASE}/api/matches/summarize`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ matchId: MATCH_ID }),
});
const data = await res.json();
console.log('Summary regen:', JSON.stringify(data, null, 2));
