import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // Fetch all match results
    const { data: allResults, error } = await supabase.from('match_results').select('*');
    if (error) throw error;
    if (!allResults || allResults.length === 0) {
      return NextResponse.json({ message: 'No results to migrate' });
    }

    // Group results by match_id
    const byMatch: Record<string, any[]> = {};
    allResults.forEach(r => {
      if (!byMatch[r.match_id]) byMatch[r.match_id] = [];
      byMatch[r.match_id].push(r);
    });

    let updated = 0;

    // Recalculate league_points for each match
    for (const [matchId, results] of Object.entries(byMatch)) {
      const totalParticipants = results.length;

      for (const r of results) {
        const newPoints = Math.max(totalParticipants - r.rank + 1, 0);

        if (newPoints !== r.league_points) {
          const { error: updateError } = await supabase
            .from('match_results')
            .update({ league_points: newPoints })
            .eq('id', r.id);

          if (updateError) throw updateError;
          updated++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      matchesProcessed: Object.keys(byMatch).length,
      rowsUpdated: updated
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
