import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { matchId, playerId, rank, dream11Points } = body;

    // Fetch the scoring rule for the given rank
    const scoringRule = await prisma.scoringRule.findUnique({
      where: { rank }
    });

    // If rank is higher than defined rules, default to 1 point (or fetch the highest rank's points)
    // Based on requirements, rank 8+ -> 1 point, so if not found, we assign 1 point
    const leaguePoints = scoringRule ? scoringRule.points : 1;

    const result = await prisma.matchResult.create({
      data: {
        matchId,
        playerId,
        rank,
        dream11Points,
        leaguePoints,
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create match result' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get('matchId');

  try {
    if (matchId) {
      const results = await prisma.matchResult.findMany({
        where: { matchId },
        include: { player: true },
        orderBy: [
          { rank: 'asc' },
          { dream11Points: 'desc' }
        ]
      });
      return NextResponse.json(results);
    }
    
    // Overall results
    const results = await prisma.matchResult.findMany({
      include: { player: true, match: true }
    });
    return NextResponse.json(results);

  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch match results' }, { status: 500 });
  }
}
