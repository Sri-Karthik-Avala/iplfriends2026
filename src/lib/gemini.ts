import { MATCHES } from '@/lib/constants';

export async function generateSummary(currentMatchId: string, currentResults: any[], db: any) {
  if (!process.env.OPENAI_API_KEY) {
    console.log("No OPENAI_API_KEY found, skipping summary generation.");
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

    const systemPrompt = `You are a savage IPL fantasy league commentator who writes like a mix of Harsha Bhogle, toxic WhatsApp group banter, and IPL memes. You write SHORT, PUNCHY player descriptions for a friends league leaderboard.

STYLE: IPL commentary mixed with unhinged group chat energy. Every line should make someone laugh or get triggered.`;

    const userPrompt = `A match just finished in the IPL Friends League! Write short IPL-style descriptions (3-4 lines each) for every player.

Performance in this match:
${currentText}

Season standings impact:
${lbText}
${recentForm}

FORMAT — follow this EXACTLY for each player:

🥇 [Name] — "[Savage Nickname/Title]"
[My11 Score] pts | +[Rank Points] rank pts | Season: #X [↑/↓/—]
[3-4 lines of SHORT, PUNCHY commentary. No long paragraphs.]

Use 🥇🥈🥉 for top 3, then 4️⃣5️⃣6️⃣7️⃣ etc. Use 💀 for absent players.

RULES:
- Each player gets a NICKNAME/TITLE (creative, funny, IPL-themed)
- 3-4 lines of commentary per player. SHORT. PUNCHY. No essays.
- Include: today's impact, overall trend, at least 1 roast/troll line per player
- Compare to IPL teams/players (RCB choke, CSK clutch, PBKS chaos, MI rebuild, etc.)

TONE BY RANK:
- TOP 3: Hype like match-winners and legends. "The Dhoni of this league." But still sneak in one cheeky line.
- MID players (4-5): Inconsistent merchants. "Almost" guys. The "we had them in the first half" types. Roast their inability to close.
- BOTTOM players (6+): FULL MEME MODE. Unhinged brutal trolling. "Bro picked players like he was blindfolded." "The RCB of this league — all hype, zero trophies." "Should retire from fantasy cricket."
- ABSENT players: Roast them HARDEST. "Too scared to even open the app." "Probably still recovering from last match's L."

- Reference rank changes: call out drops ("fell from #3 to #6 — absolute bottlejob") and rises ("climbed 2 spots — don't get cocky")
- Reference recent form if available — if someone's been trash for 3 matches, ESCALATE the roast
- End with a 1-2 line spicy season outlook

DO NOT use markdown headers. Plain text with emojis. Separate each player with a blank line. Keep it FUN — friends roasting friends, not hate.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.9,
        max_tokens: 1500
      })
    });

    const data = await response.json();
    return data?.choices?.[0]?.message?.content || null;
  } catch (err) {
    console.error("AI summary failed:", err);
    return null;
  }
}
