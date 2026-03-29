import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { TEAMS, MATCHES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // We get the hardcoded matches from constants since they never change
    const baseMatches = MATCHES;

    // Then we query our supabase db for ALL match results and summaries
    const { data: resultsData, error: resultsError } = await supabase.from('match_results').select('*');
    if (resultsError) throw resultsError;

    const { data: summariesData, error: summariesError } = await supabase.from('match_summaries').select('*');
    if (summariesError) throw summariesError;

    // Group the results by match_id
    const groupedResults: Record<string, any[]> = {};
    resultsData?.forEach(row => {
      if (!groupedResults[row.match_id]) groupedResults[row.match_id] = [];
      groupedResults[row.match_id].push({
        id: row.id,
        matchId: row.match_id,
        playerId: row.player_id,
        rank: row.rank,
        dream11Points: row.dream11_points,
        leaguePoints: row.league_points
      });
    });

    const summaryMap: Record<string, string> = {};
    summariesData?.forEach(row => {
      summaryMap[row.match_id] = row.summary;
    });

    // Merge everything into the Next.js frontend payload
    const merged = baseMatches.map(m => {
      const matchIdStr = m.number.toString();
      return {
        ...m,
        id: matchIdStr,
        results: groupedResults[matchIdStr] || [],
        summary: summaryMap[matchIdStr] || null
      };
    });

    return NextResponse.json(merged);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return NextResponse.json({ success: true, message: 'Hardcoded via constants. Use Admin Panel for Results instead.' });
}
