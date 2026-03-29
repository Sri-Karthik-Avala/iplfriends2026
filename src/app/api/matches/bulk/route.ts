import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { matches } = body; 
    // matches is an array of: { name, date }

    if (!Array.isArray(matches) || matches.length === 0) {
      return NextResponse.json({ error: 'Invalid matches array' }, { status: 400 });
    }

    const createdMatches = [];
    for (const m of matches) {
      const match = await prisma.match.create({
        data: {
          name: m.name,
          date: new Date(m.date),
        },
      });
      createdMatches.push(match);
    }

    return NextResponse.json({ success: true, count: createdMatches.length });
  } catch (error) {
    console.error('Bulk match error:', error);
    return NextResponse.json({ error: 'Failed to create bulk matches' }, { status: 500 });
  }
}
