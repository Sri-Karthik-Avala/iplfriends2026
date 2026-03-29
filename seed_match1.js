const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qpxpzrgeguxruzuarbtj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFweHB6cmdlZ3V4cnV6dWFyYnRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDc3MzQ4MCwiZXhwIjoyMDkwMzQ5NDgwfQ.iwBWl8PY8pKBW2oRUi5GhM7KhIC1njGrr98l_qGYYgI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Seeding Match 1 Results...');
  const results = [
    { match_id: "1", player_id: "3b83648a-69f8-4036-96ec-c3e03102d9c1", rank: 1, dream11_points: 950.5, league_points: 50 },
    { match_id: "1", player_id: "3b83648a-69f8-4036-96ec-c3e03102d9c2", rank: 2, dream11_points: 898.5, league_points: 40 },
    { match_id: "1", player_id: "3b83648a-69f8-4036-96ec-c3e03102d9c3", rank: 3, dream11_points: 885, league_points: 30 },
    { match_id: "1", player_id: "3b83648a-69f8-4036-96ec-c3e03102d9c4", rank: 4, dream11_points: 852.5, league_points: 20 },
    { match_id: "1", player_id: "3b83648a-69f8-4036-96ec-c3e03102d9c5", rank: 5, dream11_points: 768.5, league_points: 10 },
    { match_id: "1", player_id: "3b83648a-69f8-4036-96ec-c3e03102d9c6", rank: 6, dream11_points: 730.5, league_points: 5 },
    { match_id: "1", player_id: "3b83648a-69f8-4036-96ec-c3e03102d9c7", rank: 7, dream11_points: 681.5, league_points: 2 }
  ];

  // First delete any existing results for Match 1
  await supabase.from('match_results').delete().eq('match_id', "1");

  const { data, error } = await supabase.from('match_results').insert(results);
  
  if (error) {
    console.error('Error inserting results:', error);
  } else {
    console.log('Match 1 successfully injected into Supabase!');
  }

  // Trigger AI summary via endpoint
  try {
    const res = await fetch('http://localhost:3005/api/matches/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId: "1" })
    });
    const d = await res.json();
    console.log('AI Generation success:', d);
  } catch(e) {
    console.log('Ensure dev server is running on 3005 for AI gen: ', e.message);
  }
}

seed();
