'use client';

import { useState, useEffect, useMemo } from 'react';
import { TEAMS } from '@/lib/constants';

export default function AdminPage() {
  const [players, setPlayers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  
  // Modals State
  const [activeModal, setActiveModal] = useState<'match' | 'bulk' | 'managePlayers' | null>(null);
  const [deletingPlayerId, setDeletingPlayerId] = useState<string | null>(null);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', team: '', teamColor: '#27272a', imageUrl: '' });
  const [editFile, setEditFile] = useState<File | null>(null);
  const [savingPlayerId, setSavingPlayerId] = useState<string | null>(null);

  // Form State
  const [newPlayer, setNewPlayer] = useState({ name: '', team: '', teamColor: '#27272a', imageUrl: '' });
  const [playerFile, setPlayerFile] = useState<File | null>(null);
  const [newMatch, setNewMatch] = useState({ name: '', date: '' });
  const [bulkMatchesJson, setBulkMatchesJson] = useState('');

  // Editor State
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [bulkResults, setBulkResults] = useState(
    Array.from({ length: 8 }, (_, i) => ({ rank: i + 1, playerId: '', dream11Points: '' }))
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isRegeneratingAll, setIsRegeneratingAll] = useState(false);
  const [regenAllStatus, setRegenAllStatus] = useState('');
  const [inputMode, setInputMode] = useState<'grid' | 'json'>('grid');
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');
  
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  // Submission Feedback State (loading / success / error modal)
  const [submitState, setSubmitState] = useState<{ status: 'idle' | 'loading' | 'success' | 'error'; message: string }>({ status: 'idle', message: '' });

  const showLoading = (message: string) => setSubmitState({ status: 'loading', message });
  const showSuccess = (message: string) => {
    setSubmitState({ status: 'success', message });
    setTimeout(() => setSubmitState({ status: 'idle', message: '' }), 1800);
  };
  const showError = (message: string) => {
    setSubmitState({ status: 'error', message });
    setTimeout(() => setSubmitState({ status: 'idle', message: '' }), 2800);
  };

  useEffect(() => {
    // Session persistence for active browser tabs or Vercel deployments
    if (typeof window !== 'undefined') {
      const storedAuth = localStorage.getItem('ipl_admin_auth');
      if (storedAuth === 'true') {
        setIsAuthenticated(true);
      }
    }
  }, []);

  useEffect(() => {
    fetchPlayers();
    fetchMatches();
  }, []);

  const fetchPlayers = async () => {
    const res = await fetch('/api/players');
    setPlayers(await res.json());
  };

  const fetchMatches = async () => {
    const res = await fetch('/api/matches');
    const data = await res.json();
    const sorted = data.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setMatches(sorted);
  };

  const getTeamLogo = (teamName: string) => {
    const team = TEAMS.find((t: any) => t.name.toLowerCase().includes(teamName.toLowerCase()) || teamName.toLowerCase().includes(t.name.toLowerCase()));
    return team?.logo || 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';
  };

  const completedMatches = matches
    .filter(m => (m.results && m.results.length > 0) || m.cancelled)
    .sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return Number(b.id) - Number(a.id);
    });
  const upcomingMatches = matches.filter(m => !m.cancelled && (!m.results || m.results.length === 0));

  const getPlayerName = (id: string) => players.find(p => p.id === id)?.name || 'Unknown';

  const handleSelectMatch = (m: any) => {
    setSelectedMatch(m);
    setInputMode('grid');
    setJsonInput('');
    setJsonError('');

    // If it's completed, display the current results (not editing by default)
    if (m.results && m.results.length > 0) {
      setIsEditing(false);
      // Pre-fill the form with existing results in case they click "Edit"
      const existing = [...m.results].sort((a,b) => a.rank - b.rank).map(r => ({
        rank: r.rank,
        playerId: r.playerId,
        dream11Points: r.dream11Points.toString()
      }));
      setBulkResults(existing);
    } else {
      // Upcoming match, open editing explicitly
      setIsEditing(true);
      setBulkResults(Array.from({ length: 8 }, (_, i) => ({ rank: i + 1, playerId: '', dream11Points: '' })));
    }
  };

  const handleCreatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitState.status === 'loading') return;
    showLoading('Creating player...');
    try {
      let finalImageUrl = newPlayer.imageUrl;

      if (playerFile) {
        const formData = new FormData();
        formData.append('file', playerFile);
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.success) {
          finalImageUrl = uploadData.imageUrl;
        } else {
          showError('Failed to upload image.');
          return;
        }
      }

      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newPlayer, imageUrl: finalImageUrl })
      });
      if (!res.ok) {
        showError('Failed to create player.');
        return;
      }
      setNewPlayer({ name: '', team: '', teamColor: '#27272a', imageUrl: '' });
      setPlayerFile(null);
      await fetchPlayers();
      setActiveModal(null);
      showSuccess('Player created!');
    } catch (err: any) {
      showError('Error: ' + err.message);
    }
  };

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitState.status === 'loading') return;
    showLoading('Creating match...');
    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMatch)
      });
      if (!res.ok) {
        showError('Failed to create match.');
        return;
      }
      setNewMatch({ name: '', date: '' });
      await fetchMatches();
      setActiveModal(null);
      showSuccess('Match created!');
    } catch (err: any) {
      showError('Error: ' + err.message);
    }
  };

  const handleBulkMatches = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitState.status === 'loading') return;
    let parsed;
    try {
      parsed = JSON.parse(bulkMatchesJson);
      if (!Array.isArray(parsed)) throw new Error('JSON must be array');
    } catch (err: any) {
      showError('Invalid JSON: ' + err.message);
      return;
    }
    showLoading('Seeding matches...');
    try {
      const res = await fetch('/api/matches/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matches: parsed })
      });
      const data = await res.json();
      if (data.success) {
        setBulkMatchesJson('');
        await fetchMatches();
        setActiveModal(null);
        showSuccess('Seeded!');
      } else {
        showError('Failed: ' + (data.error || 'unknown'));
      }
    } catch (err: any) {
      showError('Error: ' + err.message);
    }
  };

  // Convert bulkResults grid to human-friendly JSON (by player name)
  const gridToJson = (grid: typeof bulkResults) => {
    const rows = grid
      .filter(r => r.playerId || r.dream11Points !== '')
      .map(r => {
        const p = players.find((pl: any) => pl.id === r.playerId);
        return { rank: Number(r.rank), name: p?.name || '', my11: r.dream11Points === '' ? 0 : Number(r.dream11Points) };
      });
    return JSON.stringify(rows, null, 2);
  };

  // Parse JSON back into grid rows; returns { rows, error }
  const jsonToGrid = (text: string): { rows: typeof bulkResults; error: string } => {
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) return { rows: [], error: 'JSON must be an array' };
      const unknownNames: string[] = [];
      const rows = parsed.map((item: any, idx: number) => {
        const name = (item.name || '').trim();
        const player = players.find((p: any) => p.name.toLowerCase() === name.toLowerCase());
        if (name && !player) unknownNames.push(name);
        return {
          rank: Number(item.rank ?? idx + 1),
          playerId: player?.id || '',
          dream11Points: item.my11 !== undefined ? String(item.my11) : (item.dream11Points !== undefined ? String(item.dream11Points) : '')
        };
      });
      if (unknownNames.length > 0) {
        return { rows, error: `Unknown player name(s): ${unknownNames.join(', ')}` };
      }
      return { rows, error: '' };
    } catch (err: any) {
      return { rows: [], error: 'Invalid JSON: ' + err.message };
    }
  };

  const switchToJsonMode = () => {
    setJsonInput(gridToJson(bulkResults));
    setJsonError('');
    setInputMode('json');
  };

  const switchToGridMode = () => {
    const { rows, error } = jsonToGrid(jsonInput);
    if (error && !rows.length) {
      setJsonError(error);
      return;
    }
    if (rows.length > 0) setBulkResults(rows);
    setJsonError(error); // surface warnings even if we applied
    setInputMode('grid');
  };

  const handleBulkResultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;
    if (submitState.status === 'loading') return;

    // If in JSON mode, parse first
    let sourceRows = bulkResults;
    if (inputMode === 'json') {
      const { rows, error } = jsonToGrid(jsonInput);
      if (error) {
        setJsonError(error);
        return;
      }
      sourceRows = rows;
    }

    const validResults = sourceRows
      .filter(r => r.playerId && r.dream11Points !== '')
      .map(r => ({
        matchId: selectedMatch.id,
        playerId: r.playerId,
        rank: Number(r.rank),
        dream11Points: Number(r.dream11Points)
      }));

    if (validResults.length === 0) {
      showError('No valid player results filled out.');
      return;
    }

    showLoading('Saving match results & generating AI commentary...');
    try {
      const res = await fetch('/api/match-results/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results: validResults })
      });

      const data = await res.json();
      if (data.success) {
        // Re-fetch matches to get the actual summary from the database
        const matchesRes = await fetch('/api/matches');
        const allMatches = await matchesRes.json();
        setMatches(allMatches.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()));
        const updated = allMatches.find((m: any) => m.id === selectedMatch.id);
        if (updated) {
          setSelectedMatch(updated);
        }
        setIsEditing(false);
        showSuccess('Match results saved! AI summary generating in background.');
      } else {
        showError('Failed: ' + (data.error || 'unknown'));
      }
    } catch (err: any) {
      showError('Network error: ' + err.message);
    }
  };

  const handleRegenerateSummary = async () => {
    if (!selectedMatch) return;
    setIsRegenerating(true);
    try {
      const res = await fetch('/api/matches/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: selectedMatch.id })
      });
      const data = await res.json();
      if (data.success) {
        alert('Epic AI Commentary Successfully Regenerated!');
        setSelectedMatch({ ...selectedMatch, summary: data.summary });
        fetchMatches(); // refresh match lists
      } else {
        alert('Generation failed (Ensure OPENAI_API_KEY is in .env)');
      }
    } catch(err) {
      alert('Network error generating summary');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleRegenerateAllSummaries = async () => {
    if (!confirm('Regenerate AI summaries for ALL completed matches? This may take a while.')) return;
    setIsRegeneratingAll(true);
    setRegenAllStatus('Starting...');
    try {
      const res = await fetch('/api/matches/summarize-all', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setRegenAllStatus(`Done! ${data.generated}/${data.totalMatches} matches regenerated.`);
        fetchMatches();
      } else {
        setRegenAllStatus('Failed: ' + data.error);
      }
    } catch(err) {
      setRegenAllStatus('Network error');
    } finally {
      setIsRegeneratingAll(false);
    }
  };

  const startEditPlayer = (p: any) => {
    setEditingPlayerId(p.id);
    setEditForm({ name: p.name, team: p.team, teamColor: p.team_color || '#27272a', imageUrl: p.image_url || '' });
    setEditFile(null);
  };

  const handleSavePlayer = async (playerId: string) => {
    setSavingPlayerId(playerId);
    try {
      let finalImageUrl = editForm.imageUrl;
      if (editFile) {
        const formData = new FormData();
        formData.append('file', editFile);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        if (uploadData.success) {
          finalImageUrl = uploadData.imageUrl;
        } else {
          alert('Image upload failed.'); return;
        }
      }
      const res = await fetch(`/api/players/${playerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editForm, imageUrl: finalImageUrl })
      });
      const data = await res.json();
      if (data.success) {
        setEditingPlayerId(null);
        await fetchPlayers();
      } else {
        alert('Failed: ' + data.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSavingPlayerId(null);
    }
  };

  const handleDeletePlayer = async (playerId: string, playerName: string) => {
    const ok = confirm(
      `Delete "${playerName}"?\n\nThis removes the player, all their match results, re-ranks every match they were in, and regenerates affected match summaries in sequence.\n\nThis cannot be undone.`
    );
    if (!ok) return;
    setDeletingPlayerId(playerId);
    try {
      const res = await fetch(`/api/players/${playerId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        alert(
          `Deleted "${playerName}". Re-ranked ${data.affectedMatches} match(es). Regenerated ${data.summariesRegenerated} summary/summaries.`
        );
        await fetchPlayers();
        await fetchMatches();
        // If the currently selected match was affected, refresh it
        if (selectedMatch) {
          const matchesRes = await fetch('/api/matches');
          const allMatches = await matchesRes.json();
          const updated = allMatches.find((m: any) => m.id === selectedMatch.id);
          if (updated) setSelectedMatch(updated);
        }
      } else {
        alert('Failed to delete: ' + (data.error || 'unknown error'));
      }
    } catch (err: any) {
      alert('Network error: ' + err.message);
    } finally {
      setDeletingPlayerId(null);
    }
  };

  const addResultRow = () => {
    const nextRank = bulkResults.length + 1;
    setBulkResults([...bulkResults, { rank: nextRank, playerId: '', dream11Points: '' }]);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameInput === 'ipl2026' && passwordInput === 'maximus69') {
      setIsAuthenticated(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('ipl_admin_auth', 'true');
      }
    } else {
      alert('Incorrect Username or Password!');
    }
  };

  const updateResultRow = (index: number, field: string, value: string) => {
    const updated = [...bulkResults];
    updated[index] = { ...updated[index], [field]: value };
    setBulkResults(updated);
  };

  const Modal = ({ title, children, onClose }: any) => (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>×</button>
        <h2 className="card-title" style={{ marginBottom: '1.5rem' }}>{title}</h2>
        {children}
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div className="container animate-fade" style={{ paddingTop: '1rem', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '2.5rem', borderRadius: 'var(--radius)', width: '380px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
          <h2 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Admin Access</h2>
          <p style={{ color: 'var(--muted-foreground)', marginBottom: '2rem', fontSize: '0.9rem', lineHeight: 1.5 }}>Enter the master credentials to manage the IPL Friends League.</p>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input 
              type="text" 
              value={usernameInput} 
              onChange={(e) => setUsernameInput(e.target.value)} 
              className="input" 
              placeholder="Username" 
              autoFocus
              style={{ textAlign: 'center', letterSpacing: '1px' }}
            />
            <input 
              type="password" 
              value={passwordInput} 
              onChange={(e) => setPasswordInput(e.target.value)} 
              className="input" 
              placeholder="Password" 
              style={{ textAlign: 'center', letterSpacing: '2px' }}
            />
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}>
              Unlock Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container animate-fade" style={{ paddingTop: '1rem' }}>
      
      <div className="admin-action-bar" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button className="btn btn-secondary" onClick={() => setActiveModal('managePlayers')}>Manage Players</button>
        <button className="btn btn-secondary" onClick={() => setActiveModal('match')}>Add Match</button>
        <button className="btn btn-secondary" onClick={() => setActiveModal('bulk')}>JSON Upload</button>
        <button className="btn btn-primary" onClick={handleRegenerateAllSummaries} disabled={isRegeneratingAll}>
          {isRegeneratingAll ? '⏳ Regenerating...' : '✨ Regenerate All Summaries'}
        </button>
      </div>
      {regenAllStatus && (
        <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', marginBottom: '1rem' }}>{regenAllStatus}</p>
      )}

      <div className="split-layout">
        
        {/* === LEFT: MATCHES & SCHEDULE === */}
        <div className="split-left">
          <div style={{ marginBottom: '2rem' }}>
            <h2 className="card-title" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-primary">Up Next</span> Upcoming Matches
            </h2>
            {upcomingMatches.length === 0 ? (
              <p className="card-description">No upcoming matches.</p>
            ) : (
              upcomingMatches.map((m, idx) => {
                const parts = m.name.split(/ vs /i);
                const t1 = parts[0]?.trim() || '';
                const t2 = parts[1]?.trim() || '';
                const isNext = idx === 0;
                const isActive = selectedMatch?.id === m.id;

                return (
                  <div key={m.id} className={`match-card ${isActive ? 'active' : ''}`} onClick={() => handleSelectMatch(m)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '40px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--muted-foreground)' }}>M{m.id || '?'}</span>
                      </div>
                      <div className="match-logos">
                        <img src={getTeamLogo(t1)} alt={t1} className="team-logo" />
                        <span className="vs-badge">VS</span>
                        <img src={getTeamLogo(t2)} alt={t2} className="team-logo" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '0.5rem' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{m.name}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>{new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} • 19:30 IST</span>
                      </div>
                    </div>
                    {isNext && <span className="badge badge-secondary">Next Match</span>}
                  </div>
                )
              })
            )}
          </div>

          <div>
            <h2 className="card-title" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               Completed Matches
            </h2>
            {completedMatches.map((m) => {
              const parts = m.name.split(/ vs /i);
              const t1 = parts[0]?.trim() || '';
              const t2 = parts[1]?.trim() || '';
              const isActive = selectedMatch?.id === m.id;

              return (
                <div key={m.id} className={`match-card ${isActive ? 'active' : ''}`} style={m.cancelled ? { opacity: 0.6 } : undefined} onClick={() => handleSelectMatch(m)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '40px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--muted-foreground)' }}>M{m.id || '?'}</span>
                    </div>
                    <div className="match-logos">
                      <img src={getTeamLogo(t1)} alt={t1} className="team-logo" style={{ width: 36, height: 36, filter: m.cancelled ? 'grayscale(1)' : undefined }} />
                      <span className="vs-badge" style={{ fontSize: '0.6rem' }}>VS</span>
                      <img src={getTeamLogo(t2)} alt={t2} className="team-logo" style={{ width: 36, height: 36, filter: m.cancelled ? 'grayscale(1)' : undefined }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '0.5rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 500, textDecoration: m.cancelled ? 'line-through' : undefined }}>{m.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{new Date(m.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {m.cancelled
                    ? <span className="badge badge-outline" style={{ color: 'var(--muted-foreground)' }}>❌ Cancelled</span>
                    : <span className="badge badge-outline">✅ Scored</span>}
                </div>
              )
            })}
          </div>
        </div>

        {/* === RIGHT: MATCH RESULT ENTRY / VIEW === */}
        <div className="split-right">
          {!selectedMatch ? (
            <div className="card" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--muted-foreground)' }}>
              <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</span>
              <p>Select a match from the schedule to view or enter results.</p>
            </div>
          ) : (
            <div className="card" style={{ height: '100%' }}>
              <div className="card-header" style={{ borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 className="card-title">{selectedMatch.name}</h2>
                  <p className="card-description">{new Date(selectedMatch.date).toLocaleDateString()}</p>
                </div>
                {!isEditing && (
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-ghost" onClick={handleRegenerateSummary} disabled={isRegenerating}>
                      {isRegenerating ? '⏳ Generating...' : '✨ Regenerate Summary'}
                    </button>
                    <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>Edit Rankings</button>
                  </div>
                )}
              </div>
              <div className="card-content" style={{ padding: 0 }}>
                {/* AI Summary Preview for Admins */}
                {!isEditing && selectedMatch.summary && (
                  <div style={{ padding: '1.5rem', paddingBottom: '0' }}>
                    <div 
                      style={{ 
                        background: 'linear-gradient(135deg, rgba(236,28,36,0.05) 0%, rgba(255,255,60,0.05) 100%)', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderLeft: '4px solid var(--primary)', 
                        padding: '1.25rem', 
                        borderRadius: 'var(--radius)', 
                        boxShadow: '0 4px 20px -5px rgba(0,0,0,0.5)',
                        color: 'var(--foreground)' 
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem', fontWeight: 'bold', fontSize: '1.05rem' }}>
                        <span style={{ animation: 'pulse 2s infinite' }}>✨</span> <span>Epic AI Match Commentary</span>
                      </div>
                      {selectedMatch.summary.split('\n').map((para: string, idx: number) => (
                        <p key={idx} style={{ marginBottom: '0.5rem', fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--muted-foreground)' }}>
                          {para}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Viewing Mode */}
                {!isEditing && selectedMatch.results?.length > 0 && (
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr style={{ background: 'var(--muted)' }}>
                          <th style={{ width: '60px' }}>Rank</th>
                          <th>Player</th>
                          <th>Daily Rank Pts</th>
                          <th>My11 Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...selectedMatch.results].sort((a,b) => a.rank - b.rank).map((res: any) => (
                          <tr key={res.id}>
                            <td style={{ fontWeight: 'bold' }}>#{res.rank}</td>
                            <td>{getPlayerName(res.playerId)}</td>
                            <td style={{ fontWeight: 'bold', color: 'var(--foreground)' }}>+{res.leaguePoints}</td>
                            <td>{res.dream11Points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Editing Mode */}
                {isEditing && (
                  <form onSubmit={handleBulkResultSubmit} style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                      <button
                        type="button"
                        className={`btn ${inputMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ flex: 1 }}
                        onClick={() => inputMode === 'json' && switchToGridMode()}
                      >
                        📋 Grid
                      </button>
                      <button
                        type="button"
                        className={`btn ${inputMode === 'json' ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ flex: 1 }}
                        onClick={() => inputMode === 'grid' && switchToJsonMode()}
                      >
                        {'{ }'} JSON
                      </button>
                    </div>

                    {inputMode === 'json' && (
                      <div style={{ marginBottom: '1rem' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>
                          Format: <code>[{'{'}"rank": 1, "name": "Donga", "my11": 905.5{'}'}]</code> — names are case-insensitive.
                        </p>
                        <textarea
                          className="input"
                          rows={12}
                          value={jsonInput}
                          onChange={e => { setJsonInput(e.target.value); setJsonError(''); }}
                          style={{ fontFamily: 'monospace', height: 'auto', minHeight: '260px', paddingTop: '0.5rem', fontSize: '0.85rem' }}
                          placeholder='[\n  {"rank": 1, "name": "Donga", "my11": 905.5},\n  {"rank": 2, "name": "Umesh", "my11": 842}\n]'
                        />
                        {jsonError && (
                          <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.5rem' }}>⚠ {jsonError}</p>
                        )}
                      </div>
                    )}

                    {inputMode === 'grid' && (
                    <div className="table-wrapper" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: '1.5rem' }}>
                      <table>
                        <thead>
                          <tr style={{ background: 'var(--muted)' }}>
                            <th style={{ width: '80px' }}>Rank</th>
                            <th>Select Player</th>
                            <th>My11 Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bulkResults.map((row, idx) => {
                            const selectedElsewhere = new Set(
                              bulkResults
                                .filter((_, i) => i !== idx)
                                .map(r => r.playerId)
                                .filter(Boolean)
                            );
                            const availablePlayers = players.filter((p: any) => !selectedElsewhere.has(p.id));
                            return (
                              <tr key={idx}>
                                <td style={{ width: '80px' }}>
                                  <input type="number" min="1" step="1" className="input" style={{ fontWeight: 'bold', textAlign: 'center' }} value={row.rank} onChange={e => updateResultRow(idx, 'rank', e.target.value)} />
                                </td>
                                <td>
                                  <select className="input" value={row.playerId} onChange={e => updateResultRow(idx, 'playerId', e.target.value)}>
                                    <option value="">-- Choose --</option>
                                    {availablePlayers.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.team})</option>)}
                                  </select>
                                </td>
                                <td>
                                  <input type="number" step="any" className="input" placeholder="Points" value={row.dream11Points} onChange={e => updateResultRow(idx, 'dream11Points', e.target.value)} />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {inputMode === 'grid' ? (
                        <button type="button" className="btn btn-ghost" onClick={addResultRow}>+ Add Row</button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{selectedMatch ? `Match ${selectedMatch.id}` : ''}</span>
                      )}
                      <button type="submit" className="btn btn-primary" disabled={submitState.status === 'loading'}>
                        {submitState.status === 'loading' ? 'Saving...' : 'Save Results ✅'}
                      </button>
                    </div>
                  </form>
                )}

              </div>
            </div>
          )}
        </div>

      </div>

      {activeModal === 'match' && (
        <Modal title="Schedule Single Match" onClose={() => setActiveModal(null)}>
          <form onSubmit={handleCreateMatch}>
            <div className="form-group">
              <label className="label">Match Name (e.g. MI vs CSK)</label>
              <input className="input" value={newMatch.name} onChange={e => setNewMatch({...newMatch, name: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="label">Date</label>
              <input type="date" className="input" value={newMatch.date} onChange={e => setNewMatch({...newMatch, date: e.target.value})} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitState.status === 'loading'}>
              {submitState.status === 'loading' ? 'Creating...' : 'Create Match'}
            </button>
          </form>
        </Modal>
      )}

      {activeModal === 'managePlayers' && (
        <Modal title="Manage Players" onClose={() => { setActiveModal(null); setEditingPlayerId(null); }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '60vh', overflowY: 'auto', marginBottom: '1rem' }}>
            {players.map((p: any) => (
              <div key={p.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--muted)', overflow: 'hidden' }}>
                {editingPlayerId === p.id ? (
                  /* Edit Mode */
                  <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input className="input" placeholder="Name" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} style={{ flex: 1 }} />
                      <input type="color" className="input" value={editForm.teamColor} onChange={e => setEditForm({...editForm, teamColor: e.target.value})} style={{ width: '50px', padding: '0.2rem', flex: 'none' }} />
                    </div>
                    <input className="input" placeholder="Team Name" value={editForm.team} onChange={e => setEditForm({...editForm, team: e.target.value})} />
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {editForm.imageUrl && (
                        <img src={editForm.imageUrl} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)', flexShrink: 0 }} />
                      )}
                      <input type="file" className="input" accept="image/*" onChange={e => setEditFile(e.target.files?.[0] || null)} style={{ flex: 1, fontSize: '0.8rem' }} />
                    </div>
                    <input className="input" placeholder="Image URL (optional)" value={editForm.imageUrl} onChange={e => setEditForm({...editForm, imageUrl: e.target.value})} style={{ fontSize: '0.8rem' }} />
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost" style={{ fontSize: '0.8rem' }} onClick={() => setEditingPlayerId(null)}>Cancel</button>
                      <button className="btn btn-primary" style={{ fontSize: '0.8rem' }} disabled={savingPlayerId === p.id} onClick={() => handleSavePlayer(p.id)}>
                        {savingPlayerId === p.id ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div style={{ display: 'flex', alignItems: 'center', padding: '0.6rem 0.8rem', gap: '0.6rem' }}>
                    <img src={p.image_url || 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png'} alt={p.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${p.team_color || 'var(--border)'}`, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{p.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.team_color || '#555', display: 'inline-block' }} />
                        {p.team}
                      </div>
                    </div>
                    <button className="btn btn-ghost" style={{ fontSize: '0.78rem', padding: '0.3rem 0.5rem' }} onClick={() => startEditPlayer(p)}>Edit</button>
                    <button
                      className="btn btn-ghost"
                      style={{ color: '#e11d48', fontSize: '0.78rem', padding: '0.3rem 0.5rem' }}
                      disabled={deletingPlayerId === p.id}
                      onClick={() => handleDeletePlayer(p.id, p.name)}
                    >
                      {deletingPlayerId === p.id ? '...' : 'Delete'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Add New Player */}
          <details style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
            <summary style={{ cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: 'var(--foreground)', marginBottom: '0.75rem' }}>
              + Add New Player
            </summary>
            <form onSubmit={handleCreatePlayer}>
              <div className="form-group">
                <label className="label">Name</label>
                <input className="input" value={newPlayer.name} onChange={e => setNewPlayer({...newPlayer, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="label">Team Name</label>
                <input className="input" value={newPlayer.team} onChange={e => setNewPlayer({...newPlayer, team: e.target.value})} required />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }} className="form-group">
                <div style={{ flex: 1 }}>
                  <label className="label">Team Color</label>
                  <input type="color" className="input" style={{ padding: '0.2rem' }} value={newPlayer.teamColor} onChange={e => setNewPlayer({...newPlayer, teamColor: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="label">Profile Image</label>
                <input type="file" className="input" accept="image/*" onChange={e => setPlayerFile(e.target.files?.[0] || null)} />
              </div>
              <div className="form-group">
                <label className="label" style={{ fontSize: '0.85rem' }}>OR Image URL</label>
                <input className="input" value={newPlayer.imageUrl} onChange={e => setNewPlayer({...newPlayer, imageUrl: e.target.value})} placeholder="https://..." />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitState.status === 'loading'}>
                {submitState.status === 'loading' ? 'Creating...' : 'Create Player'}
              </button>
            </form>
          </details>
        </Modal>
      )}

      {activeModal === 'bulk' && (
        <Modal title="Import Bulk Matches" onClose={() => setActiveModal(null)}>
          <form onSubmit={handleBulkMatches}>
            <div className="form-group">
              <label className="label" style={{ fontSize: '0.8rem' }}>Format: [&#123;"name":"A vs B", "date":"2026-04-10"&#125;]</label>
              <textarea 
                className="input" 
                rows={10} 
                required
                style={{ fontFamily: 'monospace', height: '200px', paddingTop: '0.5rem' }}
                value={bulkMatchesJson} 
                onChange={e => setBulkMatchesJson(e.target.value)} 
                placeholder="Paste JSON array here..."
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitState.status === 'loading'}>
              {submitState.status === 'loading' ? 'Importing...' : 'Import JSON'}
            </button>
          </form>
        </Modal>
      )}

      {submitState.status !== 'idle' && (
        <div className="modal-overlay" style={{ pointerEvents: submitState.status === 'loading' ? 'auto' : 'none' }}>
          <div className="modal-content" style={{ maxWidth: '380px', textAlign: 'center', padding: '2rem 1.5rem' }}>
            {submitState.status === 'loading' && (
              <>
                <div style={{
                  width: '52px',
                  height: '52px',
                  border: '4px solid var(--border)',
                  borderTopColor: 'var(--primary, #3b82f6)',
                  borderRadius: '50%',
                  margin: '0 auto 1.25rem',
                  animation: 'spin 0.9s linear infinite'
                }} />
                <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Working on it...</h3>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>{submitState.message}</p>
              </>
            )}
            {submitState.status === 'success' && (
              <>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
                <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Done!</h3>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>{submitState.message}</p>
              </>
            )}
            {submitState.status === 'error' && (
              <>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⚠️</div>
                <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Something went wrong</h3>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>{submitState.message}</p>
              </>
            )}
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

    </div>
  );
}
