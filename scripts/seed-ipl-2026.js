const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const teams = [
  { name: "Royal Challengers Bengaluru", color: "#EC1C24", logo: "https://documents.iplt20.com/ipl/RCB/Logos/Logooutline/RCBoutline.png" },
  { name: "Sunrisers Hyderabad", color: "#FF822A", logo: "https://documents.iplt20.com/ipl/SRH/Logos/Logooutline/SRHoutline.png" },
  { name: "Mumbai Indians", color: "#004BA0", logo: "https://documents.iplt20.com/ipl/MI/Logos/Logooutline/MIoutline.png" },
  { name: "Kolkata Knight Riders", color: "#3A225D", logo: "https://documents.iplt20.com/ipl/KKR/Logos/Logooutline/KKRoutline.png" },
  { name: "Rajasthan Royals", color: "#EA1A85", logo: "https://documents.iplt20.com/ipl/RR/Logos/Logooutline/RRoutline.png" },
  { name: "Chennai Super Kings", color: "#FFFF3C", logo: "https://documents.iplt20.com/ipl/CSK/Logos/Logooutline/CSKoutline.png" },
  { name: "Punjab Kings", color: "#DD1F2D", logo: "https://documents.iplt20.com/ipl/PBKS/Logos/Logooutline/PBKSoutline.png" },
  { name: "Lucknow Super Giants", color: "#005BA6", logo: "https://documents.iplt20.com/ipl/LSG/Logos/Logooutline/LSGoutline.png" },
  { name: "Gujarat Titans", color: "#1B2A5B", logo: "https://documents.iplt20.com/ipl/GT/Logos/Logooutline/GToutline.png" },
  { name: "Delhi Capitals", color: "#00008B", logo: "https://documents.iplt20.com/ipl/DC/Logos/Logooutline/DCoutline.png" }
];

const knownMatches = [
  {"number": 1, "date": "2026-03-28", "team1": "Royal Challengers Bengaluru", "team2": "Sunrisers Hyderabad"},
  {"number": 2, "date": "2026-03-29", "team1": "Mumbai Indians", "team2": "Kolkata Knight Riders"},
  {"number": 3, "date": "2026-03-30", "team1": "Rajasthan Royals", "team2": "Chennai Super Kings"},
  {"number": 4, "date": "2026-03-31", "team1": "Punjab Kings", "team2": "Gujarat Titans"},
  {"number": 5, "date": "2026-04-01", "team1": "Lucknow Super Giants", "team2": "Delhi Capitals"},
  {"number": 6, "date": "2026-04-02", "team1": "Kolkata Knight Riders", "team2": "Sunrisers Hyderabad"},
  {"number": 7, "date": "2026-04-03", "team1": "Chennai Super Kings", "team2": "Punjab Kings"},
  {"number": 8, "date": "2026-04-04", "team1": "Delhi Capitals", "team2": "Mumbai Indians"},
  {"number": 9, "date": "2026-04-04", "team1": "Gujarat Titans", "team2": "Rajasthan Royals"},
  {"number": 10, "date": "2026-04-05", "team1": "Sunrisers Hyderabad", "team2": "Lucknow Super Giants"},
  {"number": 11, "date": "2026-04-05", "team1": "Royal Challengers Bengaluru", "team2": "Chennai Super Kings"},
  {"number": 12, "date": "2026-04-06", "team1": "Kolkata Knight Riders", "team2": "Punjab Kings"},
  {"number": 13, "date": "2026-04-07", "team1": "Rajasthan Royals", "team2": "Mumbai Indians"},
  {"number": 14, "date": "2026-04-08", "team1": "Delhi Capitals", "team2": "Gujarat Titans"},
  {"number": 15, "date": "2026-04-09", "team1": "Kolkata Knight Riders", "team2": "Lucknow Super Giants"},
  {"number": 16, "date": "2026-04-10", "team1": "Rajasthan Royals", "team2": "Royal Challengers Bengaluru"},
  {"number": 17, "date": "2026-04-11", "team1": "Punjab Kings", "team2": "Sunrisers Hyderabad"},
  {"number": 18, "date": "2026-04-11", "team1": "Chennai Super Kings", "team2": "Delhi Capitals"},
  {"number": 19, "date": "2026-04-12", "team1": "Lucknow Super Giants", "team2": "Mumbai Indians"}
];

let currentDate = new Date('2026-04-12');
const remainingMatches = [];
for (let i = 20; i <= 74; i++) {
  currentDate.setDate(currentDate.getDate() + 1);
  if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
    if (i % 2 === 0) currentDate.setDate(currentDate.getDate() - 1);
  }
  const t1 = teams[i % 10].name;
  const t2 = teams[(i + 3) % 10].name;

  remainingMatches.push({
    "number": i,
    "date": currentDate.toISOString().split('T')[0],
    "team1": t1,
    "team2": t2,
    "name": `${t1} vs ${t2}`
  });
}

const allMatches = [...knownMatches.map(m => ({ ...m, name: `${m.team1} vs ${m.team2}`})), ...remainingMatches];

async function seed() {
  console.log('Seeding Teams/Players...');
  for (const team of teams) {
    const existing = await prisma.player.findFirst({ where: { team: team.name } });
    if (!existing) {
      await prisma.player.create({
        data: {
          name: `${team.name} Fan`,
          team: team.name,
          teamColor: team.color,
          imageUrl: team.logo
        }
      });
    }
  }

  console.log('Seeding Matches...');
  let matchCount = 0;
  for (const match of allMatches) {
    const existing = await prisma.match.findFirst({ where: { name: match.name, date: new Date(match.date) } });
    if (!existing) {
      await prisma.match.create({
        data: {
          name: match.name,
          date: new Date(match.date)
        }
      });
      matchCount++;
    }
  }
  console.log(`Successfully seeded ${teams.length} teams and ${matchCount} matches into SQLite!`);
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
