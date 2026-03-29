import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const rules = await prisma.scoringRule.findMany({
      orderBy: { rank: 'asc' }
    });
    return NextResponse.json(rules);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch scoring rules' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rank, points } = body;

    const rule = await prisma.scoringRule.upsert({
      where: { rank },
      update: { points },
      create: { rank, points },
    });
    return NextResponse.json(rule);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update scoring rule' }, { status: 500 });
  }
}
