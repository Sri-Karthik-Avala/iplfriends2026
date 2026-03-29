import prisma from './prisma';
import fs from 'fs';
import path from 'path';

export async function checkAndSeed() {
  try {
    const matchCount = await prisma.match.count();
    if (matchCount > 0) return; // Already seeded

    console.log('AUTO-SEEDING DATA FROM ipl-2026-data.json...');
    const filePath = path.join(process.cwd(), 'public', 'ipl-2026-data.json');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const { teams, matches } = JSON.parse(rawData);

    // Seed Teams/Players
    for (const team of teams) {
      await prisma.player.create({
        data: {
          name: `${team.name} Fan`,
          team: team.name,
          teamColor: team.color,
          imageUrl: team.logo
        }
      });
    }

    // Seed Matches
    for (const m of matches) {
      await prisma.match.create({
        data: {
          id: m.number.toString(), // Optional if ID is string/auto, but let's let Prisma auto-generate if we didn't specify. actually SQLite uses cuid by default in schema, so let's just omit ID unless needed. Wait, in schema Match id is String @id @default(cuid()).
          name: m.name,
          date: new Date(m.date)
        }
      });
    }

    // Seed Default Scoring Rules
    const defaultRules = [
      { rank: 1, points: 50 },
      { rank: 2, points: 40 },
      { rank: 3, points: 30 },
      { rank: 4, points: 20 },
      { rank: 5, points: 10 },
      { rank: 6, points: 5 },
      { rank: 7, points: 2 },
    ];
    for (const rule of defaultRules) {
      await prisma.scoringRule.upsert({
        where: { rank: rule.rank },
        update: { points: rule.points },
        create: { rank: rule.rank, points: rule.points }
      });
    }

    console.log('AUTO-SEED COMPLETE.');
  } catch (error) {
    console.error('Auto-seed failed:', error);
  }
}
