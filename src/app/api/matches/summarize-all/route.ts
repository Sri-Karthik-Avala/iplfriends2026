import { NextResponse } from 'next/server';
import { generateSummary } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const { data: allResults } = await supabase.from('match_results').select('*');
    const { data: allPlayers } = await supabase.from('players').select('*');

    if (!allResults || allResults.length === 0) {
      return NextResponse.json({ message: 'No match results found' });
    }

    const jsResults = allResults.map(r => ({
      matchId: r.match_id,
      playerId: r.player_id,
      rank: r.rank,
      dream11Points: r.dream11_points,
      leaguePoints: r.league_points
    }));

    const jsPlayers = allPlayers?.map(p => ({
      id: p.id,
      name: p.name,
    })) || [];

    // Get unique match IDs that have results
    const matchIds = [...new Set(jsResults.map(r => r.matchId))].sort((a, b) => Number(a) - Number(b));

    const results: { matchId: string; success: boolean; error?: string }[] = [];

    // Process sequentially to avoid rate limits
    for (const matchId of matchIds) {
      try {
        const matchResults = jsResults.filter(r => r.matchId === matchId);
        const summary = await generateSummary(matchId, matchResults, { players: jsPlayers, matchResults: jsResults });

        if (summary) {
          const { error } = await supabase.from('match_summaries').upsert({
            match_id: matchId,
            summary: summary
          });
          if (error) throw error;
          results.push({ matchId, success: true });
        } else {
          results.push({ matchId, success: false, error: 'No summary generated' });
        }
      } catch (err: any) {
        results.push({ matchId, success: false, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      totalMatches: matchIds.length,
      generated: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      details: results
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
