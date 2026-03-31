import { NextResponse } from 'next/server';
import { generateSummary } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Dynamic scoring: points = totalParticipants - rank + 1
// e.g. 7 players: 1st=7, 2nd=6, ..., 7th=1
// e.g. 5 players: 1st=5, 2nd=4, ..., 5th=1
const calcLeaguePoints = (rank: number, totalParticipants: number) => Math.max(totalParticipants - rank + 1, 0);

export async function POST(req: Request) {
  try {
    const { results } = await req.json();
    if (!results || results.length === 0) return NextResponse.json({ error: 'No results provided' }, { status: 400 });

    const matchId = results[0].matchId;

    // Delete existing results for this match using Supabase
    const { error: delError } = await supabase.from('match_results').delete().eq('match_id', matchId);
    if (delError) throw delError;

    // Map and insert new results
    const totalParticipants = results.length;
    const toInsert = results.map((r: any) => ({
      match_id: r.matchId,
      player_id: r.playerId,
      rank: r.rank,
      dream11_points: r.dream11Points,
      league_points: calcLeaguePoints(r.rank, totalParticipants)
    }));

    const { error: insError } = await supabase.from('match_results').insert(toInsert);
    if (insError) throw insError;

    // Attempt AI Generation in background
    let summaryGenerated = false;
    try {
      // Provide Supabase tables data to the Gemini helper
      const { data: allResults } = await supabase.from('match_results').select('*');
      const { data: allPlayers } = await supabase.from('players').select('*');

      // We map Supabase column names to the old JS names so Gemini prompt script doesn't break
      const jsResults = allResults?.map(r => ({
        matchId: r.match_id,
        playerId: r.player_id,
        rank: r.rank,
        dream11Points: r.dream11_points,
        leaguePoints: r.league_points
      })) || [];

      const jsPlayers = allPlayers?.map(p => ({
        id: p.id,
        name: p.name,
      })) || [];

      console.log(`Generating epic AI summary for match ${matchId}...`);
      const matchResults = jsResults.filter(r => r.matchId === matchId);
      const summary = await generateSummary(matchId, matchResults, { players: jsPlayers, matchResults: jsResults });

      // Save summary via upsert into Supabase
      if (summary) {
        const { error: sumError } = await supabase.from('match_summaries').upsert({
          match_id: matchId,
          summary: summary
        });
        if (sumError) throw sumError;
        summaryGenerated = true;
      }
    } catch(aiErr) {
      console.error("AI Generation failed non-fatally", aiErr);
    }

    return NextResponse.json({ success: true, summaryGenerated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
