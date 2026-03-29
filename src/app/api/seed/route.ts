import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST() {
  try {
    const existingRules = await prisma.scoringRule.count();
    if (existingRules > 0) {
      return NextResponse.json({ message: 'Scoring rules already seeded' });
    }

    const defaultRules = [
      { rank: 1, points: 10 },
      { rank: 2, points: 8 },
      { rank: 3, points: 6 },
      { rank: 4, points: 5 },
      { rank: 5, points: 4 },
      { rank: 6, points: 3 },
      { rank: 7, points: 2 },
      { rank: 8, points: 1 },
      { rank: 9, points: 1 },
      { rank: 10, points: 1 },
      { rank: 11, points: 1 },
    ];

    for (const rule of defaultRules) {
      await prisma.scoringRule.upsert({
        where: { rank: rule.rank },
        update: rule,
        create: rule,
      });
    }

    return NextResponse.json({ message: 'Scoring rules seeded successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to seed scoring rules' }, { status: 500 });
  }
}
