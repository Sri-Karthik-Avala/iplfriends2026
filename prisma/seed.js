const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
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
  ]

  for (const rule of defaultRules) {
    await prisma.scoringRule.upsert({
      where: { rank: rule.rank },
      update: {},
      create: rule,
    })
  }
  console.log('Seeded Scoring Rules')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
