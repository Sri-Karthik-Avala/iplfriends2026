import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateSummary } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

// Dense ranking: sort by dream11_points desc, assign rank 1,2,2,3,4...
// (same points => same rank, next distinct score gets rank+1, no skipping)
function denseRank(results: { dream11_points: number }[]): number[] {
  const sorted = [...results]
    .map((r, idx) => ({ idx, pts: Number(r.dream11_points) }))
    .sort((a, b) => b.pts - a.pts);

  const ranks = new Array<number>(results.length);
  let currentRank = 0;
  let lastPts: number | null = null;
  for (const row of sorted) {
    if (lastPts === null || row.pts !== lastPts) {
      currentRank += 1;
      lastPts = row.pts;
    }
    ranks[row.idx] = currentRank;
  }
  return ranks;
}

const calcLeaguePoints = (rank: number, totalParticipants: number) =>
  Math.max(totalParticipants - rank + 1, 0);

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const playerId = params.id;
    if (!playerId) {
      return NextResponse.json({ error: 'Player id required' }, { status: 400 });
    }
    const body = await req.json();
    const updates: Record<string, any> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.team !== undefined) updates.team = body.team;
    if (body.teamColor !== undefined) updates.team_color = body.teamColor;
    if (body.imageUrl !== undefined) updates.image_url = body.imageUrl;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { error } = await supabase.from('players').update(updates).eq('id', playerId);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const playerId = params.id;
    if (!playerId) {
      return NextResponse.json({ error: 'Player id required' }, { status: 400 });
    }

    // 1. Find match_ids where this player had results (before deleting)
    const { data: playerResults, error: prErr } = await supabase
      .from('match_results')
      .select('match_id')
      .eq('player_id', playerId);
    if (prErr) throw prErr;

    const affectedMatchIds = Array.from(new Set((playerResults || []).map(r => r.match_id)));

    // 2. Delete the player. Schema has ON DELETE CASCADE so match_results rows
    //    for this player are removed automatically.
    const { error: delErr } = await supabase.from('players').delete().eq('id', playerId);
    if (delErr) throw delErr;

    // 3. For each affected match, re-rank remaining results and recompute league_points
    for (const matchId of affectedMatchIds) {
      const { data: remaining, error: remErr } = await supabase
        .from('match_results')
        .select('id, dream11_points')
        .eq('match_id', matchId);
      if (remErr) throw remErr;
      if (!remaining || remaining.length === 0) continue;

      const newRanks = denseRank(remaining);
      const total = remaining.length;

      // Update each row sequentially (Supabase has no bulk-update by id)
      for (let i = 0; i < remaining.length; i++) {
        const row = remaining[i];
        const newRank = newRanks[i];
        const { error: upErr } = await supabase
          .from('match_results')
          .update({
            rank: newRank,
            league_points: calcLeaguePoints(newRank, total)
          })
          .eq('id', row.id);
        if (upErr) throw upErr;
      }
    }

    // 4. Regenerate match summaries sequentially from the earliest affected match onward.
    //    Match IDs are numeric strings — sort numerically.
    let summariesRegenerated = 0;
    if (affectedMatchIds.length > 0) {
      const earliestAffected = affectedMatchIds
        .map(id => Number(id))
        .sort((a, b) => a - b)[0];

      // Get ALL match_ids that have results and are >= earliestAffected
      const { data: allResults } = await supabase.from('match_results').select('*');
      const { data: allPlayers } = await supabase.from('players').select('*');

      const jsResults = (allResults || []).map(r => ({
        matchId: r.match_id,
        playerId: r.player_id,
        rank: r.rank,
        dream11Points: r.dream11_points,
        leaguePoints: r.league_points
      }));

      const jsPlayers = (allPlayers || []).map(p => ({ id: p.id, name: p.name }));

      const matchIdsToRegen = Array.from(new Set(jsResults.map(r => r.matchId)))
        .map(id => String(id))
        .filter(id => Number(id) >= earliestAffected)
        .sort((a, b) => Number(a) - Number(b));

      for (const matchId of matchIdsToRegen) {
        try {
          const matchResults = jsResults.filter(r => r.matchId === matchId);
          const summary = await generateSummary(matchId, matchResults, {
            players: jsPlayers,
            matchResults: jsResults
          });
          if (summary) {
            const { error: sumErr } = await supabase
              .from('match_summaries')
              .upsert({ match_id: matchId, summary });
            if (sumErr) throw sumErr;
            summariesRegenerated += 1;
          }
        } catch (aiErr) {
          console.error(`Summary regen failed for match ${matchId}:`, aiErr);
        }
      }

      // Also drop any stale summaries that belong to matches now without results
      // (edge case: if a match now has zero results, remove its summary).
      for (const matchId of affectedMatchIds) {
        const stillHasResults = jsResults.some(r => r.matchId === matchId);
        if (!stillHasResults) {
          await supabase.from('match_summaries').delete().eq('match_id', matchId);
        }
      }
    }

    return NextResponse.json({
      success: true,
      affectedMatches: affectedMatchIds.length,
      summariesRegenerated
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
