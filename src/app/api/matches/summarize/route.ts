import { NextResponse } from 'next/server';
import { generateSummary } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { matchId } = await req.json();
    if (!matchId) return NextResponse.json({ error: 'matchId required' }, { status: 400 });

    const { data: allResults } = await supabase.from('match_results').select('*');
    const { data: allPlayers } = await supabase.from('players').select('*');

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

    const summary = await generateSummary(matchId, jsResults, { players: jsPlayers, matchResults: jsResults });
    if (!summary) throw new Error("Google Gemini failed to generate narrative.");

    const { error: sumError } = await supabase.from('match_summaries').upsert({
      match_id: matchId,
      summary: summary
    });
    
    if (sumError) throw sumError;

    return NextResponse.json({ success: true, summary });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
