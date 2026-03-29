import fs from 'fs';

const JSON_PATH = 'public/ipl-2026-data.json';
const API_URL = 'http://localhost:3005';

async function seed() {
  console.log('Reading JSON...');
  const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
  
  console.log('Seeding Teams...');
  for (const team of data.teams) {
    await fetch(`${API_URL}/api/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `${team.name} Fan`,
        team: team.name,
        teamColor: team.color,
        imageUrl: team.logo
      })
    }).catch(console.error);
  }

  console.log('Seeding Matches...');
  const res = await fetch(`${API_URL}/api/matches/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matches: data.matches })
  });
  
  const result = await res.json();
  console.log('Bulk Matches Result:', result);
}

seed();
