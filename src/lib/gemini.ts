import { MATCHES } from '@/lib/constants';

async function callOpenAI(systemPrompt: string, userPrompt: string): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) {
    console.log("No OPENAI_API_KEY, skipping OpenAI attempt.");
    return null;
  }
  try {
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
        max_tokens: 2000
      })
    });
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.warn(`OpenAI call failed (${response.status}): ${errText.slice(0, 300)}`);
      return null;
    }
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    return (typeof content === 'string' && content.trim().length > 0) ? content : null;
  } catch (err) {
    console.warn("OpenAI call threw:", err);
    return null;
  }
}

async function callGemini(systemPrompt: string, userPrompt: string): Promise<string | null> {
  if (!process.env.GEMINI_API_KEY) {
    console.log("No GEMINI_API_KEY, skipping Gemini fallback.");
    return null;
  }
  try {
    const model = 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 2000
        }
      })
    });
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.warn(`Gemini call failed (${response.status}): ${errText.slice(0, 300)}`);
      return null;
    }
    const data = await response.json();
    const parts = data?.candidates?.[0]?.content?.parts;
    const text = Array.isArray(parts)
      ? parts.map((p: any) => p?.text || '').join('')
      : '';
    return text.trim().length > 0 ? text : null;
  } catch (err) {
    console.warn("Gemini call threw:", err);
    return null;
  }
}

export async function generateSummary(currentMatchId: string, currentResults: any[], db: any) {
  if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
    console.log("Neither OPENAI_API_KEY nor GEMINI_API_KEY found, skipping summary generation.");
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
    const matchIds = Array.from(new Set(db.matchResults.map((r: any) => r.matchId))).sort((a: any, b: any) => Number(a) - Number(b));
    const recentMatchIds = matchIds.filter((id: any) => id !== currentMatchId).slice(-3);
    let recentForm = "\nRecent form (last 3 matches before this one):\n";
    db.players.forEach((p: any) => {
      const recent = recentMatchIds.map((mid: any) => {
        const r = db.matchResults.find((mr: any) => mr.matchId === mid && mr.playerId === p.id);
        return r ? `#${r.rank}` : 'DNP';
      });
      recentForm += `${p.name}: ${recent.join(', ') || 'No history'}\n`;
    });

    // Build previous match details for context
    const prevMatchId = matchIds.filter((id: any) => id !== currentMatchId).slice(-1)[0];
    let prevMatchText = '';
    if (prevMatchId) {
      const prevMatch = MATCHES.find((m: any) => m.number.toString() === prevMatchId);
      const prevResults = db.matchResults.filter((r: any) => r.matchId === prevMatchId).sort((a: any, b: any) => a.rank - b.rank);
      if (prevMatch && prevResults.length > 0) {
        prevMatchText = `\nPrevious match results (${prevMatch.name}):\n`;
        prevResults.forEach((r: any) => {
          prevMatchText += `  Rank ${r.rank}: ${getPlayerName(r.playerId)} — My11: ${r.dream11Points}, +${r.leaguePoints} pts\n`;
        });
      }
    }

    let currentText = currentMatch ? `Match: ${currentMatch.name}\n` : '';
    const totalParticipants = currentResults.length;
    currentText += `Total participants: ${totalParticipants}\n\n`;
    currentText += `PLAYERS WHO PLAYED (use ONLY these My11 scores and rank points in your output):\n`;
    currentResults.sort((a:any,b:any) => a.rank - b.rank).forEach(r => {
      currentText += `  Rank ${r.rank}: ${getPlayerName(r.playerId)} — My11 score: ${r.dream11Points}, earned +${r.leaguePoints || 0} rank pts\n`;
    });
    // Note who didn't play
    const playedIds = new Set(currentResults.map((r: any) => r.playerId));
    const absent = db.players.filter((p: any) => !playedIds.has(p.id));
    if (absent.length > 0) {
      currentText += `\nPLAYERS WHO DID NOT PLAY (DNP — 0 pts, roast them):\n`;
      absent.forEach((p: any) => {
        currentText += `  💀 ${p.name} — DNP\n`;
      });
    } else {
      currentText += `\nAll players participated. There are NO absent players. Do NOT add any DNP/absent section.\n`;
    }

    const systemPrompt = `You are a savage IPL fantasy league commentator who writes like a mix of Harsha Bhogle, toxic WhatsApp group banter, and IPL memes. You write SHORT, PUNCHY player descriptions for a friends league leaderboard.

STYLE: IPL commentary mixed with unhinged group chat energy. Every line should make someone laugh or get triggered.`;

    const userPrompt = `A match just finished in the IPL Friends League! Write short IPL-style descriptions (3-4 lines each) for every player.

Performance in this match:
${currentText}

Season standings impact:
${lbText}
${recentForm}
${prevMatchText}

FORMAT — follow this EXACTLY for each player who PLAYED:

🥇 [Name] — "[Savage Nickname/Title]"
[EXACT My11 Score from data above] pts | +[EXACT Rank Points from data above] rank pts | Season: #[rank after] [↑/↓/—]
[3-4 lines of SHORT, PUNCHY commentary.]

ONLY if there are DNP players listed above, add for each:
💀 [Name] — "[Shameful Title]"
DNP | +0 rank pts | Season: #[rank]
[2 lines roasting them]

Use 🥇🥈🥉 for top 3, then 4️⃣5️⃣6️⃣7️⃣ etc.

⚠️ CRITICAL DATA RULES — FOLLOW EXACTLY:
- Use ONLY the My11 scores and rank points from "PLAYERS WHO PLAYED" section above
- Do NOT invent or change any numbers. Copy them exactly.
- Do NOT add DNP/absent blocks unless players are explicitly listed under "PLAYERS WHO DID NOT PLAY"
- If data says "All players participated", write ZERO DNP blocks
- Each player appears EXACTLY ONCE in your output

TONE RULES:
- Each player gets a creative IPL-themed NICKNAME/TITLE
- 3-4 lines per player. SHORT. PUNCHY. No essays.
- Compare to IPL teams/players (RCB choke, CSK clutch, PBKS chaos, MI rebuild, etc.)
- TOP 3 (this match): Hype like legends. Sneak in one cheeky line.
- MID players (4-5): "Almost" merchants. Roast their inconsistency.
- BOTTOM players (6+): FULL MEME MODE. Unhinged trolling. "Should retire from fantasy cricket."
- ABSENT players (only if listed): Roast them HARDEST.
- Call out rank changes from BEFORE/AFTER leaderboard
- Reference recent form — if someone's been trash for 3 matches, ESCALATE
- End with 1-2 line spicy season outlook

No markdown headers. Plain text with emojis. Separate each player with a blank line.`;

    // Primary: OpenAI
    const openaiResult = await callOpenAI(systemPrompt, userPrompt);
    if (openaiResult) return openaiResult;

    // Fallback: Gemini with the exact same prompt/structure
    console.log("OpenAI unavailable or failed, falling back to Gemini...");
    const geminiResult = await callGemini(systemPrompt, userPrompt);
    if (geminiResult) return geminiResult;

    console.warn("Both OpenAI and Gemini summary generation failed.");
    return null;
  } catch (err) {
    console.error("AI summary failed:", err);
    return null;
  }
}
