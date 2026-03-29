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

    const sortedPrev = Object.entries(prevLb).sort((a,b) => b[1] - a[1]).map(e => ({ name: getPlayerName(e[0]), pts: e[1] }));
    const sortedNew = Object.entries(newLb).sort((a,b) => b[1] - a[1]).map(e => ({ name: getPlayerName(e[0]), pts: e[1] }));

    let lbText = "Season Leaderboard BEFORE this match:\n";
    sortedPrev.forEach((s, i) => lbText += `${i+1}. ${s.name} (${s.pts} pts)\n`);
    lbText += "\nSeason Leaderboard AFTER this match:\n";
    sortedNew.forEach((s, i) => lbText += `${i+1}. ${s.name} (${s.pts} pts)\n`);

    let currentText = currentMatch ? `Match: ${currentMatch.name}\n` : '';
    currentResults.sort((a:any,b:any) => a.rank - b.rank).forEach(r => {
      currentText += `- ${getPlayerName(r.playerId)} finished Rank ${r.rank} earning ${r.leaguePoints || '?'} rank points (My11 score: ${r.dream11Points}).\n`;
    });

    const prompt = `You are an epic fantasy sports commentator for the "IPL Friends League". A group of friends is predicting cricket matches to earn points. A match just finished!

Performance in this single match:
${currentText}

How this affected the overall season standings:
${lbText}

Write a 2-3 paragraph epic narrative summary of these results. Analyze the leaderboard changes (who climbed, who fell, who maintained their lead). Assign awesome fantasy-style titles to at least 2 or 3 of the players (e.g. "Rightful Wizard of Guesses", "Greatest Comeback", "Hidden Magician of Choices", "The Fallen King", etc.) based on their performance and overall rank changes today. Explain WHY they earned the title playfully. Do not use markdown headers, just return elegant paragraphs.`;

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
