# Mobile Optimization, Layout Reorder & Match Detail Page

**Date:** 2026-03-29
**Branch:** update/dashboard
**Status:** Approved

## Summary

Redesign the IPL Friends League leaderboard page for mobile-first experience, reorder content priority, replace the leaderboard table with player cards, add a dedicated match detail page at `/match/[id]`, and fix the AI summary display bug.

## Goals

1. Optimize for mobile — leaderboard is the primary content, always on top
2. Consistent layout priority on all screen sizes: Leaderboard → Completed → Upcoming
3. New shareable match detail page replacing the current modal
4. Player card design for the leaderboard (replacing table) on all devices
5. Show-5-and-expand pattern for match lists to reduce scroll fatigue
6. Fix AI summary not displaying after generation

## Non-Goals

- Admin page redesign (stays as-is)
- Player-level authentication (future work)
- New API endpoints (reuse existing)

---

## Design

### 1. Leaderboard Page (`/`) — Layout Reorder

**Current:** Two-column split layout — matches on left, leaderboard table on right. On mobile (<1024px) it stacks with matches on top.

**New:** Single-column vertical layout, max-width ~800px centered, same order on all screen sizes:

1. **Season Standings (Leaderboard)** — Player cards, always first
2. **Completed Matches** — Latest 5 shown, expand for all. Each links to `/match/[id]`
3. **Upcoming Matches** — Next 5 shown, expand for all

**CSS changes:**
- Remove `.split-layout` grid from leaderboard page
- Remove `.split-left` / `.split-right` usage on leaderboard page (admin page still uses them)
- Use single-column flow with section spacing
- Container max-width: ~800px for content focus

### 2. Player Cards (Leaderboard)

Replace the `<table>` with card rows for all screen sizes (7 players, cards work well).

Each card contains:
- **Left edge accent:** Gold border for 1st, silver for 2nd, bronze for 3rd, neutral `var(--border)` for 4th+
- **Medal emoji:** 🥇🥈🥉 for top 3, `#4` `#5` etc. for rest
- **Player avatar:** 36px circular image
- **Name + team:** Player name (bold) and team name (muted, smaller)
- **Total rank points:** Right-aligned, bold, large font — the primary stat
- **Tap action:** Opens existing PlayerProfile modal (no change to that component)

My11 points are not shown on cards — visible in PlayerProfile modal on tap.

Section header: "Season Standings" with subtitle: "Daily Match Ranks grant Points (1st=50, 2nd=40, etc.). The HIGHEST total Rank Points wins the season!"

### 3. Match Detail Page (`/match/[id]`)

**New file:** `src/app/match/[id]/page.tsx`

**Content (top to bottom):**
- Back link: "← Back to Leaderboard" linking to `/`
- Match header: Team logos with VS badge, match name (`{team1} vs {team2}`), date, match number badge

**Desktop (>768px) — two columns below header:**
- Left column: Rankings table (rank, player name, daily rank pts, My11 score)
- Right column: AI Commentary card (sparkle header, paragraph text, gradient background styling)

**Mobile (<768px) — stacked:**
- Rankings table
- AI Commentary below

**Edge cases:**
- No results (upcoming match URL): Show "Results not yet available. Check back after the match!" with back link
- No AI summary: Show rankings table only, no empty commentary section
- Invalid match ID: Show "Match not found" with back link

**Data fetching:** Client-side fetch to `/api/matches`, filter by match ID from URL params. With 74 hardcoded matches this is efficient enough — no new API endpoint needed. Players are also fetched to resolve player names in the rankings table.

### 4. Show 5 + Expand Pattern

Both completed and upcoming match sections use identical expand/collapse behavior:

- Default: `matches.slice(0, 5)` displayed
- If `matches.length > 5`: Show button below the list
  - Collapsed state: "View all {count} matches ↓"
  - Expanded state: "Show less ↑"
- State: `useState<boolean>` per section — `showAllCompleted`, `showAllUpcoming`
- No animation — simple show/hide

### 5. Navigation Changes

- Completed match cards on `/` page: Replace `onClick={() => setSelectedMatch(m)}` with `<Link href={"/match/" + m.id}>`
- Remove the match results modal (`selectedMatch` state and modal JSX) from `page.tsx`
- Keep the PlayerProfile modal (triggered by clicking player cards)
- Remove sparkle emoji from completed match cards (the detail page has the full summary)
- Completed match cards show: match number, team logos, match name, date, "View Results →" badge

### 6. AI Summary Bug Fix

**Root cause:** In `admin/page.tsx` line 178, after bulk result submission:
```js
setSelectedMatch({ ...selectedMatch, summary: data.summaryGenerated ? 'AI Commentary Generated' : null });
```
This sets the summary to a placeholder string instead of the actual generated text.

**Fix:** After `handleBulkResultSubmit` succeeds, call `fetchMatches()` (already done) and then re-select the match from the refreshed data to get the real summary text from the database. Replace the placeholder assignment with a re-fetch pattern:

```js
// After fetchMatches() completes, find and re-select the match
const refreshed = await fetch('/api/matches').then(r => r.json());
const updated = refreshed.find(m => m.id === selectedMatch.id);
if (updated) setSelectedMatch(updated);
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/app/page.tsx` | Reorder layout, replace table with player cards, add show-5-expand, remove match modal, link to `/match/[id]` |
| `src/app/match/[id]/page.tsx` | **New file** — match detail page |
| `src/app/globals.css` | Add `.player-card` styles, remove split-layout dependency from leaderboard, responsive tweaks |
| `src/app/admin/page.tsx` | Fix AI summary placeholder bug in `handleBulkResultSubmit` |

## Files NOT Changed

| File | Reason |
|------|--------|
| `src/app/components/PlayerProfile.tsx` | Stays as-is, opened from player card tap |
| `src/app/layout.tsx` | Nav stays the same |
| `src/app/api/*` | No API changes needed |
| `src/lib/*` | No library changes needed |
