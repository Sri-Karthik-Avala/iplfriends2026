import { MATCHES } from '@/lib/constants';

export async function generateSummary(currentMatchId: string, currentResults: any[], db: any) {
  if (!process.env.GEMINI_API_KEY) {
    console.log("No GEMINI_API_KEY found, skipping summary generation.");
    return null;
  }

  try {
    const currentMatch = MATCHES.find((m: any) => m.number.toString() === currentMatchId);
    const getPlayerName = (pid: string) => db.players.find((p:any) => p.id === pid)?.name || 'Unknown Fan';

    const prevLb: Record<string, number> = {};
    const newLb: Record<string, number> = {};
    db.players.forEach((p:any) => { prevLb[p.id] = 0; newLb[p.id] = 0; });

    db.matchResults.forEach((r: any) => {
      newLb[r.playerId] += r.leaguePoints;
      if (r.matchId !== currentMatchId) {
        prevLb[r.playerId] += r.leaguePoints;
      }
    });

    const sortedPrev = Object.entries(prevLb).sort((a,b) => b[1] - a[1]).map((e, i) => ({ id: e[0], name: getPlayerName(e[0]), pts: e[1], rank: i + 1 }));
    const sortedNew = Object.entries(newLb).sort((a,b) => b[1] - a[1]).map((e, i) => ({ id: e[0], name: getPlayerName(e[0]), pts: e[1], rank: i + 1 }));

    // Build rank change info
    const prevRankMap: Record<string, number> = {};
    sortedPrev.forEach(s => { prevRankMap[s.id] = s.rank; });

    let lbText = "Season Leaderboard BEFORE this match:\n";
    sortedPrev.forEach(s => lbText += `${s.rank}. ${s.name} (${s.pts} pts)\n`);
    lbText += "\nSeason Leaderboard AFTER this match:\n";
    sortedNew.forEach(s => {
      const prevRank = prevRankMap[s.id] || s.rank;
      const change = prevRank - s.rank;
      const arrow = change > 0 ? `↑${change}` : change < 0 ? `↓${Math.abs(change)}` : '—';
      lbText += `${s.rank}. ${s.name} (${s.pts} pts) [${arrow}]\n`;
    });

    // Build per-player recent form (last 3 matches)
    const matchIds = [...new Set(db.matchResults.map((r: any) => r.matchId))].sort();
    const recentMatchIds = matchIds.filter((id: any) => id !== currentMatchId).slice(-3);
    let recentForm = "\nRecent form (last 3 matches before this one):\n";
    db.players.forEach((p: any) => {
      const recent = recentMatchIds.map((mid: any) => {
        const r = db.matchResults.find((mr: any) => mr.matchId === mid && mr.playerId === p.id);
        return r ? `#${r.rank}` : 'DNP';
      });
      recentForm += `${p.name}: ${recent.join(', ') || 'No history'}\n`;
    });

    let currentText = currentMatch ? `Match: ${currentMatch.name}\n` : '';
    const totalParticipants = currentResults.length;
    currentResults.sort((a:any,b:any) => a.rank - b.rank).forEach(r => {
      currentText += `- ${getPlayerName(r.playerId)} finished Rank ${r.rank}/${totalParticipants} earning ${r.leaguePoints || '?'} rank points (My11 score: ${r.dream11Points}).\n`;
    });
    // Note who didn't play
    const playedIds = new Set(currentResults.map((r: any) => r.playerId));
    const absent = db.players.filter((p: any) => !playedIds.has(p.id));
    if (absent.length > 0) {
      currentText += `\nDid NOT play this match (0 pts): ${absent.map((p: any) => p.name).join(', ')}\n`;
    }

    const prompt = `You are a ruthless, hilarious fantasy sports commentator for the "IPL Friends League" — a group of friends predicting cricket matches. A match just finished!

Performance in this single match:
${currentText}

How this affected the overall season standings:
${lbText}
${recentForm}

Write a structured, player-wise match commentary. Format it EXACTLY like this:

1. Start with a 1-2 sentence epic match intro/headline.

2. Then for EACH player (ranked 1st to last in THIS match), write a block:
🥇 [PlayerName] — "[Epic Fantasy Title]"
[My11 Score] pts | +[Rank Points] rank pts | Season rank: #X [↑/↓/—]
[2-3 sentences about their performance and season trajectory]

3. If anyone was ABSENT (didn't play), add a block for them too:
💀 [PlayerName] — "[Shameful Absence Title]"
DNP | +0 rank pts | Season rank: #X
[1-2 sentences roasting them for skipping]

4. End with a 1-2 sentence season outlook teaser.

TONE RULES — THIS IS CRITICAL:
- TOP 3 (ranks 1-3): Celebrate them with glory, hype, and epic praise. Give them heroic, legendary titles.
- RANKS 4+: ROAST THEM. Be savage, funny, and brutally honest. Mock their poor player choices, their falling ranks, their inability to predict cricket. Give them humiliating, funny titles like "The Certified Cricket Fraud", "The Human Coin Flip", "The Walking L", "Chief of Bad Decisions", "The Bottom-Feeder Baron". Make your friends laugh at them.
- ABSENT PLAYERS: Roast them the hardest. They were too lazy/scared to even play. Titles like "The Great Deserter", "The Phantom of Zero Points", "Couch Potato Royale".
- Use the BEFORE/AFTER leaderboard to call out rank drops ("fell from #3 to #5 — a disgraceful collapse") and streaks of bad form from recent history.
- Reference their recent form if available — if someone has been ranking low for multiple matches, escalate the roast.
- If someone rose in ranks, acknowledge the comeback but warn them not to get cocky.
- Use medal emojis: 🥇 1st, 🥈 2nd, 🥉 3rd, then 4️⃣ 5️⃣ 6️⃣ 7️⃣ etc for rest
- Every player gets a unique creative title reflecting THIS match performance
- Do NOT use markdown headers (no # or ##). Plain text with emoji/dash format.
- Separate each player block with a blank line
- Keep it fun — this is friends roasting friends, not actual insults. Think fantasy sports banter.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (err) {
    console.error("Gemini summary failed:", err);
    return null;
  }
}
