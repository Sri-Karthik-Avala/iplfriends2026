import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data: players, error: pErr } = await supabase.from('players').select('*');
    if (pErr) throw pErr;

    const { data: results, error: rErr } = await supabase.from('match_results').select('*');
    if (rErr) throw rErr;

    // Build map for each player
    const stats: Record<string, { id: string, name: string, team: string, teamColor: string, imageUrl: string, points: number, dream11: number }> = {};
    
    players?.forEach(p => {
      stats[p.id] = {
        id: p.id,
        name: p.name,
        team: p.team,
        teamColor: p.team_color,
        imageUrl: p.image_url,
        points: 0,
        dream11: 0
      };
    });

    // Sum points
    results?.forEach(r => {
      if (stats[r.player_id]) {
        stats[r.player_id].points += r.league_points;
        stats[r.player_id].dream11 += r.dream11_points;
      }
    });

    const leaderboard = Object.values(stats)
      .map(s => ({
        player: {
          id: s.id,
          name: s.name,
          team: s.team,
          teamColor: s.teamColor,
          imageUrl: s.imageUrl
        },
        _sum: {
          leaguePoints: s.points,
          dream11Points: s.dream11
        }
      }))
      .sort((a, b) => {
        if (b._sum.leaguePoints !== a._sum.leaguePoints) return b._sum.leaguePoints - a._sum.leaguePoints;
        return b._sum.dream11Points - a._sum.dream11Points;
      });

    return NextResponse.json(leaderboard);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
