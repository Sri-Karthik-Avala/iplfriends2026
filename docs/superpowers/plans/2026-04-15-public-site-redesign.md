# Public Site Redesign — Desi Scoreboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the public site (leaderboard, match detail, profile) around a dual-theme "Desi Scoreboard" identity with motion-library animations, dark/light modes that respect OS preference, and mobile-first layout — while preserving every existing feature.

**Architecture:** CSS-custom-property token system toggled by `<html data-theme>`. FOUC-prevention inline `<head>` script runs before first paint. `next/font` replaces `<link>` Google Fonts. Shared `PlayerRow` React component is used by leaderboard (primary), match detail rankings (table variant), and profile match history. Animations use the already-installed `motion` package with `LazyMotion` + `domAnimation` to keep bundle size down. All motion gated on `prefers-reduced-motion`.

**Tech Stack:** Next.js 14 App Router, TypeScript, `motion` v12 (installed), `next/font`, plain CSS (no Tailwind). Supabase-backed data, unchanged.

**Spec:** [docs/superpowers/specs/2026-04-15-public-site-redesign-design.md](../specs/2026-04-15-public-site-redesign-design.md)

---

## Testing strategy (manual verification)

There is no existing test framework in this project, and the redesign is visual. Each task ends with **manual verification steps** and a commit. Verification happens via:

- `npx tsc --noEmit` — TypeScript must stay clean (one pre-existing unrelated error in `src/app/api/matches/summarize-all/route.ts` is acceptable; no *new* errors).
- `npm run dev` — dev server at `http://localhost:3000` must start and render without console errors.
- Browser DevTools — mobile emulation at 375×812 (iPhone SE) and 1440 desktop, no horizontal scroll, no hydration warnings, no broken layouts.
- DevTools → Elements → inspect `<html>` — `data-theme` attribute must be present before first paint (no flash of wrong theme).

Adding tests is **out of scope** for this plan.

---

## File Structure

### New files

| Path | Responsibility |
|---|---|
| `src/lib/theme.ts` | Theme resolver (localStorage → OS pref → default), FOUC inline-script string, `toggleTheme()`, custom event dispatcher |
| `src/lib/leaderboard.ts` | Extracted stats + achievement computation currently inlined in `src/app/page.tsx` |
| `src/app/components/ThemeToggle.tsx` | Client component, pill toggle with Lucide sun/moon icons |
| `src/app/components/TricolorStripe.tsx` | 4px saffron/white/green gradient divider |
| `src/app/components/Nav.tsx` | Header/nav extracted from `layout.tsx` |
| `src/app/components/PlayerRow.tsx` | Shared player card, variants: `"card"` (default leaderboard), `"table"` (match detail), `"micro"` (profile history) |
| `src/app/components/AnimatedList.tsx` | `LazyMotion` wrapper + stagger variants |
| `src/app/components/ConfettiBurst.tsx` | One-shot confetti particle effect on new-leader detection |

### Modified files

| Path | Scope of change |
|---|---|
| `src/app/layout.tsx` | Replace Google Fonts `<link>` with `next/font`, mount `<Nav />` + `<TricolorStripe />`, inline FOUC script |
| `src/app/globals.css` | Full rewrite around token system (keeps cricket-ball + gravestone keyframes) |
| `src/app/page.tsx` | Replace inline player card JSX with `<PlayerRow />`, use `<AnimatedList />`, add `<ConfettiBurst />`, move stats/achievement logic to `src/lib/leaderboard.ts`, add Leader Spotlight strip |
| `src/app/match/[id]/page.tsx` | Theme tokens, Playfair headline, scoreboard rankings table using `<PlayerRow variant="table" />` |
| `src/app/profile/[slug]/page.tsx` | Theme tokens, Playfair accents |
| `src/app/components/PlayerProfile.tsx` | Theme tokens, no layout change |
| `src/app/components/Gravestone.tsx` | Theme tokens |

### Explicitly unchanged (allowlist)

- `src/lib/supabase.ts`, `src/lib/gemini.ts`, `src/lib/constants.ts`, `src/lib/image.ts`
- All routes in `src/app/api/**`
- All files under `src/app/admin/**` (auto-inherits tokens via CSS vars only — no JSX change)
- `supabase-schema.sql`, `next.config.js`, `tsconfig.json`
- All files under `scripts/**` and `public/**`

---

## Phase 1 — Theme Infrastructure

### Task 1.1: Create `src/lib/theme.ts`

**Files:**
- Create: `src/lib/theme.ts`

- [ ] **Step 1: Create the file**

```ts
// src/lib/theme.ts
//
// Shared theme utilities. The FOUC-prevention inline script below runs in
// <head> before first paint to set <html data-theme>. It must be string-safe
// and self-contained (no imports, no ES modules) because it gets injected as
// an IIFE via <script dangerouslySetInnerHTML>.

export type Theme = 'dark' | 'light';
export const THEME_STORAGE_KEY = 'ipl-theme';
export const THEME_EVENT = 'ipl-theme-changed';

// String form that gets inlined into layout.tsx. Uses only vanilla DOM + try/catch.
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t!=='dark'&&t!=='light'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export function getResolvedTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {}
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function setTheme(next: Theme): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {}
  document.documentElement.setAttribute('data-theme', next);
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: next }));
}

export function toggleTheme(): Theme {
  const current = getResolvedTheme();
  const next: Theme = current === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}

export function subscribeToTheme(cb: (t: Theme) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => {
    const ce = e as CustomEvent<Theme>;
    cb(ce.detail);
  };
  window.addEventListener(THEME_EVENT, handler);
  return () => window.removeEventListener(THEME_EVENT, handler);
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no new errors (only the pre-existing `summarize-all/route.ts` Set-iteration warning is acceptable).

- [ ] **Step 3: Commit**

```bash
git add src/lib/theme.ts
git commit -m "Add theme resolver + FOUC-prevention inline script"
```

---

### Task 1.2: Wire FOUC script into `src/app/layout.tsx`

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Import themeInitScript and inject into `<head>`**

Open `src/app/layout.tsx`. At the top, add alongside the existing imports:

```tsx
import { themeInitScript } from '@/lib/theme';
```

Then inside the existing `<head>` element, add a new `<script>` tag **before** the `<link>` tags for fonts:

```tsx
<head>
  <script
    dangerouslySetInnerHTML={{ __html: themeInitScript }}
  />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  {/* ...existing link tags remain for now, removed in Phase 3... */}
</head>
```

- [ ] **Step 2: Verify the attribute is set before paint**

Run: `npm run dev`
Open `http://localhost:3000/`.
Open DevTools → Elements → inspect `<html>`.
Expected: `<html lang="en" data-theme="dark">` (or `"light"` if OS is light).
Expected: no visible theme flash on hard reload.

- [ ] **Step 3: Verify localStorage override**

In DevTools → Console:
```js
localStorage.setItem('ipl-theme', 'light');
location.reload();
```
Expected: page reloads and `<html data-theme="light">` is set. Page will look broken visually (tokens not in place yet), but the attribute must be correct.

Reset:
```js
localStorage.removeItem('ipl-theme');
```

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx
git commit -m "Inject theme-init script into layout head to prevent FOUC"
```

---

## Phase 2 — Design Tokens (globals.css rewrite)

### Task 2.1: Back up existing animations and replace `globals.css` with the new token system

**Files:**
- Modify: `src/app/globals.css` (full rewrite)

The new stylesheet keeps the gravestone + cricket-ball animations from the old file but throws out the ad-hoc dark-only variables in favor of the token system from §4 of the spec. This is one big write to keep the change atomic.

- [ ] **Step 1: Note the animation blocks we must keep**

Read the current file to confirm which keyframes exist. Run: `grep -n "@keyframes" src/app/globals.css`
Expected output (from recent history): `slideIn`, `fade`, `ballSpin`, `boundaryArc`, `goldPulse`, `silverPulse`, `bronzePulse`.

Also grep for `.boundary-shot`, `.cricket-ball`, `.gravestone`, `.ball` so nothing is accidentally deleted.

- [ ] **Step 2: Replace `src/app/globals.css` with the full token-driven stylesheet**

Write the entire new content of `src/app/globals.css`:

```css
/* === Root design tokens (dark-first) === */
:root,
[data-theme="dark"] {
  color-scheme: dark;

  /* Surfaces */
  --bg-base: #0B0F1A;
  --bg-raised: #141A2A;
  --bg-raised-strong: #18203A;

  /* Foregrounds */
  --fg-strong: #F8FAFC;
  --fg-body: #E8EAED;
  --fg-muted: #9AA3B8;

  /* Borders */
  --border: #1F2638;
  --border-strong: #2A3454;

  /* Accents */
  --gold: #FFB800;
  --gold-soft: rgba(255, 184, 0, 0.12);
  --gold-border: rgba(255, 184, 0, 0.4);
  --silver: #C0C0C0;
  --bronze: #CD7F32;
  --saffron: #FF9933;
  --white-flag: #FFFFFF;
  --green: #138808;
  --danger: #F87171;
  --maroon: #6B1A1F;

  /* Shadows */
  --shadow-card: 0 1px 2px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.25);
  --shadow-glow-gold: 0 0 20px -2px rgba(255, 184, 0, 0.35);
}

[data-theme="light"] {
  color-scheme: light;

  --bg-base: #FDFBF5;
  --bg-raised: #FFFFFF;
  --bg-raised-strong: #FFF8EC;

  --fg-strong: #1F1914;
  --fg-body: #2D241B;
  --fg-muted: #6B5A47;

  --border: #EBE3D0;
  --border-strong: #D7CDB0;

  --gold: #B8860B;
  --gold-soft: rgba(184, 134, 11, 0.12);
  --gold-border: rgba(184, 134, 11, 0.4);
  --silver: #949494;
  --bronze: #B87A35;
  --saffron: #FF9933;
  --white-flag: #FFFFFF;
  --green: #138808;
  --danger: #B91C1C;
  --maroon: #6B1A1F;

  --shadow-card: 0 1px 2px rgba(31, 25, 20, 0.04), 0 2px 8px rgba(31, 25, 20, 0.06);
  --shadow-glow-gold: 0 0 18px -2px rgba(184, 134, 11, 0.22);
}

/* === Typography tokens === */
:root {
  --font-display: 'Playfair Display', Georgia, serif;
  --font-body: 'Inter', system-ui, -apple-system, sans-serif;

  --fs-hero: clamp(2rem, 4vw + 1rem, 3.5rem);
  --fs-title: clamp(1.25rem, 1vw + 1rem, 1.625rem);
  --fs-body: 0.9375rem;
  --fs-small: 0.8125rem;
  --fs-tiny: 0.6875rem;
  --fs-chip: 0.625rem;

  --leading-body: 1.6;
  --leading-headline: 1.05;

  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-pill: 9999px;
}

/* === Reset + base === */
*,
*::before,
*::after { box-sizing: border-box; }

html {
  -webkit-text-size-adjust: 100%;
  transition: background-color 180ms ease, color 180ms ease;
}

body {
  margin: 0;
  min-height: 100vh;
  background: var(--bg-base);
  color: var(--fg-body);
  font-family: var(--font-body);
  font-size: var(--fs-body);
  line-height: var(--leading-body);
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}

main { min-height: calc(100vh - 72px); }

a { color: inherit; text-decoration: none; }

button {
  font-family: inherit;
  cursor: pointer;
  border: 0;
  background: transparent;
  color: inherit;
}

/* === Container === */
.container {
  max-width: 960px;
  margin: 0 auto;
  padding: 1rem 1rem 3rem;
}

/* === Site nav === */
.site-nav {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--bg-base);
  border-bottom: 1px solid var(--border);
  transition: background-color 180ms ease, border-color 180ms ease;
}
.site-nav-inner {
  max-width: 960px;
  margin: 0 auto;
  padding: 0.85rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
.site-logo {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: 1.15rem;
  color: var(--fg-strong);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  letter-spacing: 0.3px;
}
.site-logo-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--gold);
  box-shadow: 0 0 8px var(--gold);
}
.site-nav-links {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}
.site-nav-link {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--fg-muted);
  padding: 0.35rem 0.6rem;
  border-radius: var(--radius-sm);
  transition: color 180ms ease, background-color 180ms ease;
}
.site-nav-link:hover { color: var(--fg-strong); background: var(--bg-raised); }

/* === Tricolor stripe === */
.tricolor-stripe {
  height: 4px;
  width: 100%;
  background: linear-gradient(
    90deg,
    var(--saffron) 0 33.33%,
    var(--white-flag) 33.33% 66.66%,
    var(--green) 66.66% 100%
  );
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;
}

/* === Theme toggle === */
.theme-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0;
  width: 52px;
  height: 28px;
  padding: 3px;
  border-radius: var(--radius-pill);
  background: var(--bg-raised);
  border: 1px solid var(--border);
  cursor: pointer;
  transition: background-color 180ms ease;
  position: relative;
}
.theme-toggle-knob {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--gold);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--bg-base);
  transition: transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
[data-theme="dark"] .theme-toggle-knob { transform: translateX(24px); }
[data-theme="light"] .theme-toggle-knob { transform: translateX(0); background: var(--maroon); color: #FFF; }
.theme-toggle svg { width: 12px; height: 12px; }

/* === Section headers === */
.section-header { margin: 2rem 0 0.75rem; }
.section-header .kicker {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--fg-muted);
  margin-bottom: 0.35rem;
}
.section-header h2 {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: var(--fs-hero);
  line-height: var(--leading-headline);
  margin: 0;
  color: var(--fg-strong);
}
.section-header h2 em {
  font-style: italic;
  color: var(--gold);
}
.section-header p {
  margin: 0.4rem 0 0;
  color: var(--fg-muted);
  font-size: var(--fs-small);
}

/* === Leader spotlight strip === */
.leader-spotlight {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.55rem 0.85rem;
  margin: 0.75rem 0 1.25rem;
  border-radius: var(--radius-md);
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-left: 3px solid var(--gold);
  font-size: var(--fs-small);
}
.leader-spotlight-icon {
  color: var(--gold);
  font-size: 1rem;
  line-height: 1;
}
.leader-spotlight-name { font-weight: 800; color: var(--fg-strong); }
.leader-spotlight-pts { color: var(--gold); font-weight: 900; font-family: var(--font-display); }
.leader-spotlight-title { color: var(--fg-muted); font-style: italic; }

/* === Player row (shared component) === */
.player-row {
  display: flex;
  align-items: stretch;
  gap: 0.7rem;
  padding: 0.8rem 0.9rem;
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-left: 3px solid transparent;
  border-radius: var(--radius-md);
  margin-bottom: 0.5rem;
  transition: background-color 180ms ease, border-color 180ms ease, transform 180ms ease;
  position: relative;
}
.player-row:hover {
  border-color: var(--border-strong);
}
.player-row.rank-1 {
  background: var(--bg-raised-strong);
  border-left-color: var(--gold);
}
.player-row.rank-2 { border-left-color: var(--silver); }
.player-row.rank-3 { border-left-color: var(--bronze); }

.player-rank-numeral {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: 1.5rem;
  min-width: 26px;
  text-align: center;
  color: var(--fg-strong);
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.player-row.rank-1 .player-rank-numeral { color: var(--gold); }
.player-row.rank-2 .player-rank-numeral { color: var(--silver); }
.player-row.rank-3 .player-rank-numeral { color: var(--bronze); }

.player-photo {
  width: 56px;
  height: 80px;
  object-fit: cover;
  object-position: center top;
  border-radius: var(--radius-sm);
  background: var(--border-strong);
  border: 1px solid var(--border-strong);
  border-right-width: 2px;
  flex-shrink: 0;
}

.player-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.player-name-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
}
.player-name {
  font-weight: 800;
  font-size: 1rem;
  color: var(--fg-strong);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.player-pts {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: 1.35rem;
  color: var(--gold);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  line-height: 1;
}
.player-pts-label {
  font-family: var(--font-body);
  font-size: 0.55rem;
  font-weight: 800;
  color: var(--fg-muted);
  margin-left: 2px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}
.player-title {
  font-size: var(--fs-tiny);
  font-style: italic;
  color: var(--fg-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.player-stats {
  display: flex;
  gap: 0.75rem;
  font-size: var(--fs-tiny);
  color: var(--fg-muted);
  margin-top: 2px;
}
.player-stats span { white-space: nowrap; }
.player-badges {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
  margin-top: 4px;
}

.player-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: var(--fs-chip);
  font-weight: 800;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  padding: 2px 7px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--border);
  background: var(--bg-base);
  color: var(--fg-body);
}
.player-chip.chip-gold {
  background: var(--gold-soft);
  color: var(--gold);
  border-color: var(--gold-border);
}
.player-chip.chip-silver {
  background: rgba(192, 192, 192, 0.1);
  color: var(--silver);
  border-color: rgba(192, 192, 192, 0.35);
}
.player-chip.chip-bronze {
  background: rgba(205, 127, 50, 0.12);
  color: var(--bronze);
  border-color: rgba(205, 127, 50, 0.4);
}
.player-chip.chip-blue {
  background: rgba(96, 165, 250, 0.1);
  color: #60A5FA;
  border-color: rgba(96, 165, 250, 0.35);
}
.player-chip.chip-red {
  background: rgba(248, 113, 113, 0.12);
  color: var(--danger);
  border-color: rgba(248, 113, 113, 0.4);
}
[data-theme="light"] .player-chip.chip-blue { color: #1E40AF; border-color: rgba(30, 64, 175, 0.3); background: rgba(30, 64, 175, 0.08); }
[data-theme="light"] .player-chip.chip-silver { color: #4B5563; }

/* === Match cards === */
.match-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 0.9rem;
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  margin-bottom: 0.5rem;
  transition: background-color 180ms ease, border-color 180ms ease;
}
.match-card:hover { border-color: var(--border-strong); }
.match-card-next { border-left: 3px solid var(--gold); }

/* === Commentary card === */
.commentary-card {
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-top: 3px solid var(--gold);
  border-radius: var(--radius-md);
  padding: 1rem 1.1rem;
  margin-bottom: 1rem;
}
.commentary-head {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--fg-strong);
  margin-bottom: 0.65rem;
}
.commentary-head-spark { color: var(--gold); }
.commentary-body { font-size: var(--fs-small); line-height: 1.6; color: var(--fg-body); white-space: pre-wrap; }

/* === Badges / buttons === */
.badge {
  display: inline-flex;
  align-items: center;
  font-size: var(--fs-tiny);
  font-weight: 700;
  padding: 3px 8px;
  border-radius: var(--radius-pill);
  background: var(--bg-base);
  color: var(--fg-body);
  border: 1px solid var(--border);
}
.badge-outline { background: transparent; }
.badge-primary { background: var(--gold-soft); color: var(--gold); border-color: var(--gold-border); }
.badge-secondary { background: var(--bg-raised-strong); color: var(--gold); border-color: var(--gold-border); }

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.55rem 0.9rem;
  font-weight: 600;
  font-size: var(--fs-small);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg-raised);
  color: var(--fg-body);
  cursor: pointer;
  transition: background-color 180ms ease, border-color 180ms ease;
}
.btn:hover { border-color: var(--border-strong); }
.btn-primary { background: var(--gold); color: #0B0F1A; border-color: var(--gold); }
.btn-primary:hover { background: var(--gold); opacity: 0.9; }
.btn-ghost { background: transparent; }

.input {
  width: 100%;
  padding: 0.55rem 0.75rem;
  font: inherit;
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--fg-body);
  transition: border-color 180ms ease;
}
.input:focus {
  outline: none;
  border-color: var(--gold-border);
  box-shadow: 0 0 0 2px var(--gold-soft);
}

.expand-btn {
  width: 100%;
  padding: 0.5rem;
  background: transparent;
  border: 1px dashed var(--border);
  border-radius: var(--radius-sm);
  color: var(--fg-muted);
  font-size: var(--fs-small);
  cursor: pointer;
  margin-top: 0.25rem;
  transition: color 180ms ease, border-color 180ms ease;
}
.expand-btn:hover { color: var(--gold); border-color: var(--gold-border); }

/* === Gravestone (preserved) === */
.gravestone {
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  margin: 3rem 0 1rem;
  text-align: center;
}
.gravestone h3 {
  font-family: var(--font-display);
  color: var(--fg-muted);
  margin: 0 0 0.25rem;
  font-weight: 700;
}

/* === Match detail page === */
.match-detail-container { max-width: 960px; margin: 0 auto; padding: 1rem; }
.match-detail-back {
  display: inline-flex;
  align-items: center;
  color: var(--fg-muted);
  font-size: var(--fs-small);
  margin-bottom: 1rem;
}
.match-detail-back:hover { color: var(--gold); }
.match-detail-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-top: 3px solid var(--gold);
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
}
.match-detail-header h2 {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: 1.5rem;
  margin: 0;
  color: var(--fg-strong);
}
.match-logos {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.vs-badge {
  font-family: var(--font-display);
  font-size: 0.7rem;
  font-weight: 900;
  color: var(--gold);
}
.team-logo {
  width: 42px;
  height: 42px;
  object-fit: contain;
}

.match-detail-body { display: grid; grid-template-columns: 1fr; gap: 1rem; }
.match-detail-rankings,
.match-detail-commentary {
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
}
.match-detail-rankings h3 {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 900;
  margin: 0;
  padding: 0.85rem 1rem;
  color: var(--fg-strong);
  border-bottom: 1px solid var(--border);
}

.table-wrapper { width: 100%; overflow-x: auto; }
.table-wrapper table {
  width: 100%;
  border-collapse: collapse;
}
.table-wrapper th,
.table-wrapper td {
  padding: 0.75rem 0.9rem;
  text-align: left;
  font-size: var(--fs-small);
  border-bottom: 1px solid var(--border);
}
.table-wrapper th {
  background: var(--bg-base);
  font-weight: 700;
  color: var(--fg-muted);
  text-transform: uppercase;
  font-size: var(--fs-tiny);
  letter-spacing: 0.4px;
}
.table-wrapper tr:last-child td { border-bottom: 0; }

/* === Profile page — preserved structure, themed === */
.prof-page { max-width: 960px; margin: 0 auto; padding: 1rem 1rem 3rem; }
.prof-back {
  display: inline-flex;
  align-items: center;
  color: var(--fg-muted);
  font-size: var(--fs-small);
  margin-bottom: 1rem;
}
.prof-back:hover { color: var(--gold); }
.prof-hero {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.prof-img-wrap {
  aspect-ratio: 3 / 4;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--border);
  max-height: 480px;
}
.prof-img { width: 100%; height: 100%; object-fit: contain; background: var(--bg-raised); }
.prof-info { display: flex; flex-direction: column; gap: 0.5rem; }
.prof-badge {
  display: inline-flex;
  width: fit-content;
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  font-size: var(--fs-tiny);
  font-weight: 800;
  border: 1px solid;
}
.prof-name {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: 2rem;
  margin: 0;
  color: var(--fg-strong);
}
.prof-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin-top: 0.5rem; }
.prof-st {
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 0.75rem;
  text-align: center;
}
.prof-st-n {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: 1.5rem;
  color: var(--gold);
}
.prof-st-l { display: block; font-size: var(--fs-tiny); color: var(--fg-muted); }

/* === Layouts === */
.leaderboard-layout {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.split-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}
@media (min-width: 1024px) {
  .split-layout { grid-template-columns: 3fr 2fr; }
}

/* === Focus states === */
:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--bg-base), 0 0 0 4px var(--gold);
  border-radius: 2px;
}

/* === Animations kept for cricket ball + pulses === */
@keyframes slideIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fade {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes goldPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 184, 0, 0); }
  50% { box-shadow: var(--shadow-glow-gold); }
}
.animate-fade { animation: fade 0.3s ease-in-out; }

.player-row.rank-1 { animation: goldPulse 2.8s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  html { transition: none !important; }
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
  .player-row.rank-1 { animation: none !important; }
}

/* === Mobile refinements (≤640px) === */
@media (max-width: 640px) {
  .container { padding: 0.75rem 0.75rem 2.5rem; }
  .leaderboard-layout { gap: 1.25rem; }

  .section-header h2 { font-size: 2rem; }

  .player-row {
    padding: 0.7rem 0.8rem;
    gap: 0.6rem;
  }
  .player-rank-numeral { font-size: 1.2rem; min-width: 22px; }
  .player-photo {
    width: 54px;
    height: 54px;
    border-radius: 8px;
  }
  .player-name-row { gap: 0.35rem; }
  .player-name { font-size: 0.9rem; }
  .player-pts { font-size: 1.15rem; }
  .player-stats { gap: 0.55rem; font-size: 0.6rem; }
  .player-chip { font-size: 0.58rem; padding: 1.5px 6px; }
  .player-chip .chip-label {
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .match-detail-header { padding: 1rem; flex-wrap: wrap; gap: 0.75rem; }
  .match-detail-header h2 { font-size: 1.2rem; }

  .prof-name { font-size: 1.6rem; }
  .prof-stats { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 420px) {
  .player-photo { width: 48px; height: 48px; }
  .player-chip .chip-label { max-width: 64px; }
  .site-nav-link { padding: 0.3rem 0.4rem; font-size: 0.8rem; }
  .site-logo { font-size: 1rem; }
}
```

Save the file.

- [ ] **Step 3: Verify TypeScript still compiles**

Run: `npx tsc --noEmit`
Expected: no new errors. (CSS changes don't affect TS but this catches weird CSS-in-JS references.)

- [ ] **Step 4: Verify dev server renders**

Run: `npm run dev`
Open `http://localhost:3000/`.
Expected: page renders with the new tokens. Some old classes referenced in JSX may look unstyled — that's expected and gets fixed in Phase 5. No console errors; minor visual oddities are acceptable at this checkpoint.

Kill the dev server (Ctrl+C).

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css
git commit -m "Rewrite globals.css around dual-theme token system"
```

---

## Phase 3 — Fonts Migration (`next/font`)

### Task 3.1: Replace Google Fonts `<link>` tags with `next/font` imports

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Update `src/app/layout.tsx`**

Replace the file content with:

```tsx
import './globals.css';
import Link from 'next/link';
import { Playfair_Display, Inter } from 'next/font/google';
import { themeInitScript } from '@/lib/theme';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata = {
  title: 'IPL Friends League',
  description: 'Fantasy sports-style leaderboard for Dream11',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </head>
      <body>
        {/* Nav and TricolorStripe are mounted in Task 4.4 */}
        <nav style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <h2 style={{ color: 'var(--gold)', margin: 0, fontSize: '1.5rem', fontFamily: 'var(--font-display)' }}>
              🏆 IPL FRIENDS
            </h2>
          </Link>
          <div>
            <Link href="/" style={{ marginRight: '1.5rem', fontWeight: 600, color: 'var(--fg-body)' }}>Leaderboard</Link>
            <Link href="/admin" style={{ fontWeight: 600, color: 'var(--fg-muted)' }}>Admin Panel</Link>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
```

This removes the old UnifrakturMaguntia / Cinzel `<link>` tags and wires `next/font` CSS variables. The nav stays inline for now; Task 4.4 extracts it.

- [ ] **Step 2: Verify fonts load**

Run: `npm run dev` → open `http://localhost:3000/`.
DevTools → Network → filter "Font". Expected: Playfair-Display and Inter WOFF2 files load from `/_next/static/media/...`, no 404s, no references to `fonts.googleapis.com/css2?family=Cinzel...` or `UnifrakturMaguntia`.
Visually: any `var(--font-display)` text should show Playfair, everything else Inter.

Kill server.

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "Swap Google Fonts link to next/font (Playfair Display + Inter)"
```

---

## Phase 4 — Nav, TricolorStripe, ThemeToggle

### Task 4.1: Create `TricolorStripe` component

**Files:**
- Create: `src/app/components/TricolorStripe.tsx`

- [ ] **Step 1: Write the file**

```tsx
// src/app/components/TricolorStripe.tsx
// 4px divider rendered immediately under the top nav. Pure presentation.

export default function TricolorStripe() {
  return <div className="tricolor-stripe" aria-hidden="true" />;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/components/TricolorStripe.tsx
git commit -m "Add TricolorStripe component"
```

---

### Task 4.2: Create `ThemeToggle` component

**Files:**
- Create: `src/app/components/ThemeToggle.tsx`

- [ ] **Step 1: Write the file**

```tsx
// src/app/components/ThemeToggle.tsx
'use client';

import { useEffect, useState } from 'react';
import { getResolvedTheme, setTheme, subscribeToTheme, type Theme } from '@/lib/theme';

export default function ThemeToggle() {
  // Start with null to avoid hydration mismatch; sync on mount.
  const [theme, setThemeState] = useState<Theme | null>(null);

  useEffect(() => {
    setThemeState(getResolvedTheme());
    const unsub = subscribeToTheme(setThemeState);
    return unsub;
  }, []);

  const handleClick = () => {
    const current = theme ?? getResolvedTheme();
    const next: Theme = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={handleClick}
      aria-label="Toggle color theme"
      aria-pressed={isDark}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="theme-toggle-knob">
        {isDark ? (
          // Moon icon (Lucide)
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        ) : (
          // Sun icon (Lucide)
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4"/>
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
          </svg>
        )}
      </span>
    </button>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/components/ThemeToggle.tsx
git commit -m "Add ThemeToggle client component with sun/moon icons"
```

---

### Task 4.3: Create `Nav` component

**Files:**
- Create: `src/app/components/Nav.tsx`

- [ ] **Step 1: Write the file**

```tsx
// src/app/components/Nav.tsx
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

export default function Nav() {
  return (
    <header className="site-nav">
      <div className="site-nav-inner">
        <Link href="/" className="site-logo">
          <span className="site-logo-dot" aria-hidden="true" />
          Friends XI
        </Link>
        <nav className="site-nav-links" aria-label="Primary">
          <Link href="/admin" className="site-nav-link">Admin</Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/components/Nav.tsx
git commit -m "Add Nav component extracted from layout"
```

---

### Task 4.4: Mount `Nav` + `TricolorStripe` in `layout.tsx`

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Replace the inline nav with the new components**

Edit `src/app/layout.tsx`. Replace the entire `<body>` content (keeping `{children}`):

```tsx
import './globals.css';
import { Playfair_Display, Inter } from 'next/font/google';
import { themeInitScript } from '@/lib/theme';
import Nav from './components/Nav';
import TricolorStripe from './components/TricolorStripe';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata = {
  title: 'IPL Friends League',
  description: 'Fantasy sports-style leaderboard for Dream11',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <Nav />
        <TricolorStripe />
        <main>{children}</main>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Verify nav renders with tricolor stripe**

Run: `npm run dev` → open `/`.
Expected: New nav visible with "Friends XI" logo, "Admin" link, theme toggle pill on the right. Thin 4px tricolor bar immediately beneath the nav. Click the toggle → the knob slides and `<html data-theme>` flips. Reload → choice persists.

Kill server.

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "Mount Nav + TricolorStripe in root layout"
```

---

## Phase 5 — Leaderboard Refactor

### Task 5.1: Extract leaderboard computation to `src/lib/leaderboard.ts`

**Files:**
- Create: `src/lib/leaderboard.ts`

- [ ] **Step 1: Write the file**

```ts
// src/lib/leaderboard.ts
// Extracted from src/app/page.tsx so match detail and profile pages can reuse
// achievement + stats computation without importing the whole leaderboard page.

export type PlayerMetaEntry = {
  played: number;
  ranks: number[];
  my11: number[];
  firsts: number;
  seconds: number;
  thirds: number;
  topThrees: number;
  dnps: number;
  bestMy11: number;
};

export type AchievementKind = 'gold' | 'silver' | 'bronze' | 'blue' | 'red';

export type Achievement = {
  emoji: string;
  label: string;
  kind: AchievementKind;
};

export type PlayerStats = {
  played: number;
  totalCompleted: number;
  avgRank: string;
  avgMy11: string;
};

type LeaderboardEntry = { player: { id: string } };

export function buildPlayerMetaMap(matches: any[], players: any[]) {
  const metaMap: Record<string, PlayerMetaEntry> = {};
  players.forEach((p: any) => {
    metaMap[p.id] = {
      played: 0,
      ranks: [],
      my11: [],
      firsts: 0,
      seconds: 0,
      thirds: 0,
      topThrees: 0,
      dnps: 0,
      bestMy11: 0,
    };
  });

  const scored = matches
    .filter((m: any) => m.results && m.results.length > 0 && !m.cancelled)
    .sort((a: any, b: any) => Number(a.id) - Number(b.id));

  scored.forEach((m: any) => {
    const playedIds = new Set<string>();
    m.results.forEach((r: any) => {
      const e = metaMap[r.playerId];
      if (!e) return;
      playedIds.add(r.playerId);
      e.played += 1;
      e.ranks.push(r.rank);
      e.my11.push(r.dream11Points || 0);
      if (r.rank === 1) e.firsts += 1;
      if (r.rank === 2) e.seconds += 1;
      if (r.rank === 3) e.thirds += 1;
      if (r.rank <= 3) e.topThrees += 1;
      if ((r.dream11Points || 0) > e.bestMy11) e.bestMy11 = r.dream11Points || 0;
    });
    players.forEach((p: any) => {
      if (!playedIds.has(p.id) && metaMap[p.id]) metaMap[p.id].dnps += 1;
    });
  });

  return { metaMap, totalCompleted: scored.length };
}

export function buildStats(
  playerId: string,
  metaMap: Record<string, PlayerMetaEntry>,
  totalCompleted: number
): PlayerStats {
  const s = metaMap[playerId];
  if (!s || s.played === 0) {
    return { played: 0, totalCompleted, avgRank: '—', avgMy11: '—' };
  }
  const avgRank = Math.round(s.ranks.reduce((a, b) => a + b, 0) / s.played).toString();
  const avgMy11 = Math.round(s.my11.reduce((a, b) => a + b, 0) / s.played).toString();
  return { played: s.played, totalCompleted, avgRank, avgMy11 };
}

export function computeAchievements(
  playerId: string,
  metaMap: Record<string, PlayerMetaEntry>,
  totalCompleted: number,
  leaderboard: LeaderboardEntry[]
): Achievement[] {
  const s = metaMap[playerId];
  const badges: Achievement[] = [];
  if (!s || totalCompleted === 0) return badges;

  const entries = Object.values(metaMap);
  const maxFirsts = Math.max(0, ...entries.map(e => e.firsts));
  const maxSeconds = Math.max(0, ...entries.map(e => e.seconds));
  const maxThirds = Math.max(0, ...entries.map(e => e.thirds));
  const maxMy11 = Math.max(0, ...entries.map(e => e.bestMy11));
  const maxDnps = Math.max(0, ...entries.map(e => e.dnps));
  const leaderId = leaderboard[0]?.player?.id;

  if (playerId === leaderId) {
    badges.push({ emoji: '🏆', label: 'Leader', kind: 'gold' });
  }
  if (maxFirsts >= 2 && s.firsts === maxFirsts) {
    badges.push({ emoji: '🥇', label: `${s.firsts}× Gold`, kind: 'gold' });
  }
  if (maxSeconds >= 2 && s.seconds === maxSeconds) {
    badges.push({ emoji: '🥈', label: `${s.seconds}× Silver`, kind: 'silver' });
  }
  if (maxThirds >= 2 && s.thirds === maxThirds) {
    badges.push({ emoji: '🥉', label: `${s.thirds}× Bronze`, kind: 'bronze' });
  }
  if (maxMy11 > 0 && s.bestMy11 === maxMy11) {
    badges.push({ emoji: '⚡', label: `Peak ${Math.round(maxMy11)}`, kind: 'gold' });
  }
  if (totalCompleted >= 3 && s.played === totalCompleted) {
    badges.push({ emoji: '💎', label: 'Ever Present', kind: 'blue' });
  }
  if (s.ranks.length >= 3 && s.ranks.slice(-3).every(r => r <= 3)) {
    badges.push({ emoji: '🔥', label: 'Hot Streak', kind: 'gold' });
  } else if (s.played >= 4 && s.topThrees / s.played >= 0.6) {
    badges.push({ emoji: '🎯', label: 'Clutch', kind: 'blue' });
  }
  if (maxDnps >= 3 && s.dnps === maxDnps) {
    badges.push({ emoji: '💀', label: `${s.dnps} DNP`, kind: 'red' });
  }
  return badges.slice(0, 4);
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/leaderboard.ts
git commit -m "Extract stats + achievements computation to src/lib/leaderboard.ts"
```

---

### Task 5.2: Create `PlayerRow` component (card variant)

**Files:**
- Create: `src/app/components/PlayerRow.tsx`

- [ ] **Step 1: Write the file**

```tsx
// src/app/components/PlayerRow.tsx
'use client';

import Link from 'next/link';
import { parseImagePos } from '@/lib/image';
import type { Achievement, PlayerStats } from '@/lib/leaderboard';

// Roman numeral mapping for ranks 1-20 (covers the league comfortably).
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];

export type PlayerRowVariant = 'card' | 'table' | 'micro';

export type PlayerRowProps = {
  rank: number;
  player: {
    id: string;
    name: string;
    team?: string;
    teamColor?: string;
    imageUrl?: string;
  };
  points: number;
  title?: string | null;
  stats?: PlayerStats;
  badges?: Achievement[];
  variant?: PlayerRowVariant;
  asLink?: boolean; // default true for card variant
};

export default function PlayerRow({
  rank,
  player,
  points,
  title,
  stats,
  badges = [],
  variant = 'card',
  asLink = true,
}: PlayerRowProps) {
  const { src: avatarSrc, objectPosition: avatarPos } = parseImagePos(player.imageUrl);
  const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : '';
  const showStats = !!stats && stats.played > 0 && variant === 'card';
  const showBadges = badges.length > 0 && variant === 'card';

  const rowContent = (
    <div className={`player-row ${rankClass}`}>
      <div className="player-rank-numeral">{ROMAN[rank] || `#${rank}`}</div>
      <img
        src={avatarSrc || 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png'}
        alt={player.name}
        className="player-photo"
        style={{
          objectPosition: avatarPos,
          borderRightColor: player.teamColor || 'var(--border-strong)',
        }}
      />
      <div className="player-info">
        <div className="player-name-row">
          <span className="player-name">{player.name}</span>
          <span className="player-pts">
            {points}
            <span className="player-pts-label">pts</span>
          </span>
        </div>
        {title ? (
          <div className="player-title">"{title}"</div>
        ) : player.team ? (
          <div className="player-title">{player.team}</div>
        ) : null}
        {showStats && stats && (
          <div className="player-stats">
            <span>{stats.played}/{stats.totalCompleted} played</span>
            <span>avg #{stats.avgRank}</span>
            <span>my11 {stats.avgMy11}</span>
          </div>
        )}
        {showBadges && (
          <div className="player-badges">
            {badges.map((b, i) => (
              <span key={i} className={`player-chip chip-${b.kind}`} title={b.label}>
                <span className="chip-emoji">{b.emoji}</span>
                <span className="chip-label">{b.label}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (asLink && variant === 'card') {
    return (
      <Link
        href={`/profile/${player.name.toLowerCase()}`}
        style={{ textDecoration: 'none', color: 'inherit' }}
      >
        {rowContent}
      </Link>
    );
  }
  return rowContent;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/components/PlayerRow.tsx
git commit -m "Add PlayerRow component used by leaderboard (card variant)"
```

---

### Task 5.3: Refactor `src/app/page.tsx` to use `PlayerRow` and `src/lib/leaderboard.ts`

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Replace the file's top-level imports and `playerMeta` useMemo**

At the top of `src/app/page.tsx`, change imports to:

```tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { TEAMS } from '@/lib/constants';
import {
  buildPlayerMetaMap,
  buildStats as buildStatsFn,
  computeAchievements as computeAchievementsFn,
} from '@/lib/leaderboard';
import PlayerRow from './components/PlayerRow';
import Gravestone from './components/Gravestone';
import Link from 'next/link';
```

Replace the entire `playerMeta` `useMemo` block (the one that defines `Entry`, `metaMap`, `computeAchievements`, `buildStats`) with:

```tsx
  const playerMeta = useMemo(() => {
    const { metaMap, totalCompleted } = buildPlayerMetaMap(matches, players);
    return {
      totalCompleted,
      buildStats: (pid: string) => buildStatsFn(pid, metaMap, totalCompleted),
      computeAchievements: (pid: string) => computeAchievementsFn(pid, metaMap, totalCompleted, leaderboard),
    };
  }, [matches, players, leaderboard]);
```

- [ ] **Step 2: Replace the inline player-card JSX block with `<PlayerRow />`**

Find the block starting with `{!loading && leaderboard.map((lb: any, idx: number) => {` and ending with its matching `})}`. Replace the entire iteration body with:

```tsx
          {!loading && leaderboard.map((lb: any, idx: number) => {
            const rank = idx + 1;
            const playerTitle = latestSummary ? extractPlayerTitle(latestSummary, lb.player.name) : null;
            const stats = playerMeta.buildStats(lb.player.id);
            const badges = playerMeta.computeAchievements(lb.player.id);
            return (
              <PlayerRow
                key={lb.player.id}
                rank={rank}
                player={{
                  id: lb.player.id,
                  name: lb.player.name,
                  team: lb.player.team,
                  teamColor: lb.player.teamColor,
                  imageUrl: lb.player.imageUrl,
                }}
                points={lb._sum.leaguePoints || 0}
                title={playerTitle}
                stats={stats}
                badges={badges}
                variant="card"
              />
            );
          })}
```

Also replace the empty-leaderboard stub (the `!loading && players.length > 0 && leaderboard.length === 0 &&` block) with:

```tsx
          {!loading && players.length > 0 && leaderboard.length === 0 && (
            players.map((p, idx) => (
              <PlayerRow
                key={p.id}
                rank={idx + 1}
                player={{
                  id: p.id,
                  name: p.name,
                  team: p.team,
                  teamColor: p.teamColor,
                  imageUrl: p.imageUrl,
                }}
                points={0}
                variant="card"
                asLink={false}
              />
            ))
          )}
```

- [ ] **Step 3: Update the Season Standings `section-header`**

Find the block that renders:
```tsx
<div className="section-header">
  <h2>Season Standings</h2>
  <p>...</p>
</div>
```
Replace with:
```tsx
<div className="section-header">
  <div className="kicker">Season 26</div>
  <h2>Season <em>Standings</em></h2>
  <p>Points = Players − Rank + 1. More competition, more points. Highest total wins the season.</p>
</div>
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 5: Verify the leaderboard renders all existing content**

Run: `npm run dev` → open `/`.
Expected: header hero reads "Season Standings" in Playfair, leaderboard shows all players with photos, titles, stats, chips. Toggling theme still works. No console errors.

Kill server.

- [ ] **Step 6: Commit**

```bash
git add src/app/page.tsx
git commit -m "Wire PlayerRow into leaderboard page + lift achievements to lib"
```

---

### Task 5.4: Add Leader Spotlight strip

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Add the spotlight JSX above the player-cards map**

Inside `src/app/page.tsx`, directly **after** the Season Standings `.section-header` block and **before** the loading/empty/list blocks, add:

```tsx
          {!loading && leaderboard.length > 0 && (
            (() => {
              const top = leaderboard[0];
              const topTitle = latestSummary ? extractPlayerTitle(latestSummary, top.player.name) : null;
              return (
                <div className="leader-spotlight">
                  <span className="leader-spotlight-icon" aria-hidden="true">✦</span>
                  <span>
                    <span className="leader-spotlight-name">{top.player.name}</span>
                    {' leads with '}
                    <span className="leader-spotlight-pts">{top._sum.leaguePoints || 0} pts</span>
                    {topTitle && (
                      <>
                        {' · '}
                        <span className="leader-spotlight-title">"{topTitle}"</span>
                      </>
                    )}
                  </span>
                </div>
              );
            })()
          )}
```

- [ ] **Step 2: Verify it renders**

Run: `npm run dev` → `/`.
Expected: a gold-accented strip under the hero reading `✦ Donga leads with 102 pts · "The King Who Slipped"`.

Kill server.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "Add Leader Spotlight strip under Season Standings hero"
```

---

### Task 5.5: Remove obsolete leaderboard inline types

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Remove the now-unused inline type and helper definitions**

Search `src/app/page.tsx` for any leftover local type `Entry`, local helper `buildStats`, local helper `computeAchievements` — everything was moved to `src/lib/leaderboard.ts`. Remove dead code if present.

- [ ] **Step 2: Verify TypeScript is still clean**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "Remove leaderboard logic that's now in src/lib/leaderboard.ts"
```

---

## Phase 6 — Player Row Mobile Polish

### Task 6.1: Verify mobile layout at 375px

**Files:** (read-only verification, no changes expected)

- [ ] **Step 1: Boot dev server and test mobile viewport**

Run: `npm run dev` → `/`.
DevTools → Toggle device toolbar → iPhone SE (375×667).
Expected:
- Nav compact with logo, Admin link, theme toggle fitting on one row
- Tricolor stripe spans full width with no cut-off
- Player cards: 54×54 square photo, name + pts on one row, title below, stats on one line, chips wrap to next line
- No horizontal scroll
- Tap a card → navigates to profile

Open DevTools → Lighthouse → Mobile accessibility audit. Expected: no new contrast or tap-target violations.

Kill server.

- [ ] **Step 2: If anything broke, note it and fix inline**

If stats overflow or chips misalign, adjust `globals.css` `@media (max-width: 640px)` block. Most mobile rules already land in Task 2.1; this task is confirmation.

- [ ] **Step 3: Commit any fixes (skip if none)**

```bash
git add src/app/globals.css
git commit -m "Tighten mobile leaderboard layout"
```

---

## Phase 7 — Match Detail + Profile

### Task 7.1: Refactor `src/app/match/[id]/page.tsx` for new tokens

**Files:**
- Modify: `src/app/match/[id]/page.tsx`

- [ ] **Step 1: Remove inline color strings from the header**

Replace the `match-detail-header` block that uses inline `style` props with theme-token driven JSX. Full new header block:

```tsx
      <div className="match-detail-header">
        <div className="match-logos" style={{ gap: '0.75rem' }}>
          <img src={getTeamLogo(t1)} alt={t1} className="team-logo" />
          <span className="vs-badge">VS</span>
          <img src={getTeamLogo(t2)} alt={t2} className="team-logo" />
        </div>
        <div>
          <h2>{match.name}</h2>
          <p style={{ color: 'var(--fg-muted)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
            {new Date(match.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · Match #{match.id}
          </p>
        </div>
      </div>
```

- [ ] **Step 2: Update the cancelled view and not-yet-played view similarly**

For the `match.cancelled` branch, replace any hardcoded colors with token references. Keep the ❌ emoji and "Match Cancelled" copy. Full cancelled block body:

```tsx
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>❌</span>
          <h3 style={{ marginBottom: '0.5rem', fontFamily: 'var(--font-display)', color: 'var(--fg-strong)' }}>Match Cancelled</h3>
          <p style={{ color: 'var(--fg-muted)' }}>This match was cancelled. No points were awarded.</p>
        </div>
```

For the "Results not yet available" branch:

```tsx
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>⏳</span>
          <h3 style={{ marginBottom: '0.5rem', fontFamily: 'var(--font-display)', color: 'var(--fg-strong)' }}>Results not yet available</h3>
          <p style={{ color: 'var(--fg-muted)' }}>Check back after the match.</p>
        </div>
```

- [ ] **Step 3: Tighten the rankings table**

The existing table uses old utility classes. Leave the `<table>` JSX alone but verify columns show: Rank, Player, Rank Pts, My11. The new CSS from Task 2.1 already themes `.table-wrapper` correctly.

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 5: Verify the page renders**

Run: `npm run dev` → navigate to `/match/1`. Expected: new header with gold top-border, Playfair match name, tricolor stripe visible at top of site. Table rows themed. Toggle theme: everything swaps.

Kill server.

- [ ] **Step 6: Commit**

```bash
git add src/app/match/[id]/page.tsx
git commit -m "Refactor match detail page to use theme tokens"
```

---

### Task 7.2: Refactor `src/app/profile/[slug]/page.tsx` for new tokens

**Files:**
- Modify: `src/app/profile/[slug]/page.tsx`

- [ ] **Step 1: Swap inline colors for tokens**

Search for inline `color: '#...'`, `background: '#...'`, and similar literal colors. Replace each with the matching token:
- `#94949480`, `#555` etc. → `var(--fg-muted)`
- `#FABB18`, `gold` → `var(--gold)`
- Background gradients keyed on team color can stay (they use the per-player team color), but dark/light-aware neutral parts switch to `var(--bg-raised)` / `var(--bg-base)`.

The `.prof-hero`, `.prof-name`, `.prof-st` and related classes are already defined in `globals.css` Task 2.1 — most of the file just needs inline-style cleanup to match.

Verify by grepping: `grep -n "#FA\|#FF\|#94\|#CD\|#C0" src/app/profile/\[slug\]/page.tsx`. Each hit becomes a var reference unless it's a player/team color.

- [ ] **Step 2: Apply Playfair to the name heading**

The `.prof-name` class already uses `var(--font-display)` via Task 2.1's CSS. Verify by inspecting the rendered element in DevTools.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 4: Verify the page renders**

Run: `npm run dev` → `/profile/donga`. Expected: player hero with full photo, Playfair name, 2-col stats grid, match history table, theme toggle still works.

Kill server.

- [ ] **Step 5: Commit**

```bash
git add src/app/profile/[slug]/page.tsx
git commit -m "Refactor profile page to use theme tokens"
```

---

### Task 7.3: Refactor `src/app/components/PlayerProfile.tsx`

**Files:**
- Modify: `src/app/components/PlayerProfile.tsx`

- [ ] **Step 1: Replace inline colors with tokens**

Same sweep as 7.2 — every literal hex that isn't a team/player color becomes a CSS var reference. The component's layout is unchanged.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/components/PlayerProfile.tsx
git commit -m "Refactor PlayerProfile component to use theme tokens"
```

---

### Task 7.4: Refactor `src/app/components/Gravestone.tsx`

**Files:**
- Modify: `src/app/components/Gravestone.tsx`

- [ ] **Step 1: Replace any inline hardcoded colors with CSS tokens**

Open the file. Any inline `color` / `background` props get swapped for `var(--fg-muted)`, `var(--bg-raised)`, etc. The component keeps its markup and "in memoriam" copy.

- [ ] **Step 2: Verify the page renders**

Run: `npm run dev` → scroll to bottom of `/`. Expected: gravestone themed to current mode.

Kill server.

- [ ] **Step 3: Commit**

```bash
git add src/app/components/Gravestone.tsx
git commit -m "Refactor Gravestone component to use theme tokens"
```

---

## Phase 8 — Animations

### Task 8.1: Create `AnimatedList` wrapper

**Files:**
- Create: `src/app/components/AnimatedList.tsx`

- [ ] **Step 1: Write the file**

```tsx
// src/app/components/AnimatedList.tsx
'use client';

import { LazyMotion, domAnimation, m } from 'motion/react';
import type { ReactNode } from 'react';

const listVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.1,
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 220, damping: 26 },
  },
};

type Props = {
  children: ReactNode;
  className?: string;
};

export default function AnimatedList({ children, className }: Props) {
  return (
    <LazyMotion features={domAnimation} strict>
      <m.div
        variants={listVariants}
        initial="hidden"
        animate="visible"
        className={className}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}

export function AnimatedItem({ children, layoutId }: { children: ReactNode; layoutId?: string }) {
  return (
    <m.div variants={itemVariants} layout layoutId={layoutId}>
      {children}
    </m.div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no new errors. (If `motion/react` import path is wrong, try `motion` directly; version 12 exports from `motion/react`.)

- [ ] **Step 3: Commit**

```bash
git add src/app/components/AnimatedList.tsx
git commit -m "Add AnimatedList + AnimatedItem motion wrappers"
```

---

### Task 8.2: Wire `AnimatedList` into the leaderboard page

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Wrap the player-cards map in `AnimatedList` + `AnimatedItem`**

Find the leaderboard map block from Task 5.3. Wrap it like this:

```tsx
import AnimatedList, { AnimatedItem } from './components/AnimatedList';
```

Then the rendered block becomes:

```tsx
          <AnimatedList>
            {!loading && leaderboard.map((lb: any, idx: number) => {
              const rank = idx + 1;
              const playerTitle = latestSummary ? extractPlayerTitle(latestSummary, lb.player.name) : null;
              const stats = playerMeta.buildStats(lb.player.id);
              const badges = playerMeta.computeAchievements(lb.player.id);
              return (
                <AnimatedItem key={lb.player.id} layoutId={`player-${lb.player.id}`}>
                  <PlayerRow
                    rank={rank}
                    player={{
                      id: lb.player.id,
                      name: lb.player.name,
                      team: lb.player.team,
                      teamColor: lb.player.teamColor,
                      imageUrl: lb.player.imageUrl,
                    }}
                    points={lb._sum.leaguePoints || 0}
                    title={playerTitle}
                    stats={stats}
                    badges={badges}
                    variant="card"
                  />
                </AnimatedItem>
              );
            })}
          </AnimatedList>
```

- [ ] **Step 2: Verify stagger + layout animation on reload**

Run: `npm run dev` → `/`.
Expected: On hard reload, player cards fade/slide up in sequence with a spring (≈60ms between each). On data refetch (trigger via admin save or manual `location.reload()`), if ranks change, rows spring-reorder via motion's `layout` prop.

Kill server.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "Wire AnimatedList stagger + layout animation into leaderboard"
```

---

### Task 8.3: Add hover-lift via inline motion wrap

**Files:**
- Modify: `src/app/components/PlayerRow.tsx`

- [ ] **Step 1: Wrap the root row div with `m.div` + `whileHover`**

Update `src/app/components/PlayerRow.tsx` to import motion and wrap the inner content:

```tsx
import { m, LazyMotion, domAnimation } from 'motion/react';
```

Inside the component, change the `rowContent` definition to wrap its outer div in `<m.div>`:

```tsx
  const rowContent = (
    <LazyMotion features={domAnimation} strict>
      <m.div
        className={`player-row ${rankClass}`}
        whileHover={{ y: -2 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >
        <div className="player-rank-numeral">{ROMAN[rank] || `#${rank}`}</div>
        <img /* ...existing img props... */ />
        <div className="player-info">{/* ...existing info... */}</div>
      </m.div>
    </LazyMotion>
  );
```

(Keep all the existing inner JSX; only the outermost `<div className="player-row">` changes to `<m.div className="player-row">`.)

- [ ] **Step 2: Verify hover lifts the row without layout shift**

Run: `npm run dev` → hover over any player card. Expected: row rises 2px smoothly, border brightens, neighbors do not shift. Tap-and-hold on mobile emulation reveals the hover state.

Kill server.

- [ ] **Step 3: Commit**

```bash
git add src/app/components/PlayerRow.tsx
git commit -m "Add hover lift animation to PlayerRow"
```

---

### Task 8.4: Create `ConfettiBurst` component

**Files:**
- Create: `src/app/components/ConfettiBurst.tsx`

- [ ] **Step 1: Write the file**

```tsx
// src/app/components/ConfettiBurst.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

type Particle = {
  id: number;
  left: number;
  tx: number;
  ty: number;
  rotate: number;
  color: string;
  delay: number;
};

const PALETTE = ['#FFB800', '#FF9933', '#138808', '#F8FAFC', '#E91E63'];

export default function ConfettiBurst({ trigger }: { trigger: number }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const lastTriggerRef = useRef(trigger);

  useEffect(() => {
    if (trigger === lastTriggerRef.current) return;
    lastTriggerRef.current = trigger;

    // Respect reduced motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const next: Particle[] = Array.from({ length: 40 }, (_, i) => ({
      id: Date.now() + i,
      left: 40 + Math.random() * 20,
      tx: (Math.random() - 0.5) * 320,
      ty: -80 - Math.random() * 120,
      rotate: Math.random() * 720 - 360,
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      delay: Math.random() * 80,
    }));
    setParticles(next);

    const timeout = setTimeout(() => setParticles([]), 1800);
    return () => clearTimeout(timeout);
  }, [trigger]);

  if (particles.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 100,
      }}
    >
      {particles.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            top: '50%',
            left: `${p.left}%`,
            width: 8,
            height: 14,
            background: p.color,
            borderRadius: 2,
            transform: 'translate(0, 0) rotate(0deg)',
            animation: `confetti-fall 1500ms ${p.delay}ms ease-out forwards`,
            ['--tx' as any]: `${p.tx}px`,
            ['--ty' as any]: `${p.ty}px`,
            ['--rot' as any]: `${p.rotate}deg`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes confetti-fall {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          100% {
            transform: translate(var(--tx), calc(var(--ty) + 240px)) rotate(var(--rot));
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/components/ConfettiBurst.tsx
git commit -m "Add ConfettiBurst component for new-leader celebration"
```

---

### Task 8.5: Trigger `ConfettiBurst` on new leader

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Track the previous leader id and bump a trigger counter**

Near the other `useState` calls at the top of the component, add:

```tsx
  const prevLeaderIdRef = useRef<string | null>(null);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
```

Import `useRef` alongside the existing React imports:

```tsx
import { useState, useEffect, useMemo, useRef } from 'react';
```

Add a `useEffect` that watches the leaderboard:

```tsx
  useEffect(() => {
    if (loading) return;
    const currentLeaderId = leaderboard[0]?.player?.id || null;
    if (prevLeaderIdRef.current && currentLeaderId && prevLeaderIdRef.current !== currentLeaderId) {
      setConfettiTrigger(t => t + 1);
    }
    prevLeaderIdRef.current = currentLeaderId;
  }, [leaderboard, loading]);
```

- [ ] **Step 2: Import and mount the component**

Add to imports:

```tsx
import ConfettiBurst from './components/ConfettiBurst';
```

Inside the top-level return, before the closing `</div>` of the container, add:

```tsx
      <ConfettiBurst trigger={confettiTrigger} />
```

- [ ] **Step 3: Smoke-test the trigger**

Run: `npm run dev` → `/`.
In DevTools → React DevTools (or console), manually call `setConfettiTrigger(1)` via a debugger (or bump by editing `useState(0)` to `useState(1)` temporarily). Expected: confetti burst animates and clears after ~1.8s.

Revert any temporary change, kill server.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "Trigger ConfettiBurst when leaderboard top rank changes"
```

---

### Task 8.6: Verify `prefers-reduced-motion` fallback

**Files:** (verification only)

- [ ] **Step 1: Enable reduced motion in DevTools**

Run: `npm run dev`. In Chrome DevTools → Rendering → "Emulate CSS media feature prefers-reduced-motion" → "reduce".

- [ ] **Step 2: Reload `/` and confirm animations drop**

Expected:
- No stagger-in; cards appear immediately.
- No rank-1 gold pulse.
- Hover still applies a subtle border color change but no `y: -2` lift.
- Theme toggle swaps instantly with no cross-fade.
- Confetti does not render (we gated it in Task 8.4).

If any animation still plays, find the offending CSS/JS and add a `useReducedMotion()` guard or a `@media (prefers-reduced-motion: reduce)` override. Commit any fix.

- [ ] **Step 3: Reset DevTools rendering override, kill server**

```bash
# if you committed any fixes:
git add src/app/globals.css src/app/components
git commit -m "Honor prefers-reduced-motion across animations"
```

(Skip the commit if no fixes were needed.)

---

## Phase 9 — Final QA

### Task 9.1: Full TypeScript + lint pass

- [ ] **Step 1: TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors other than the pre-existing `src/app/api/matches/summarize-all/route.ts` warning.

- [ ] **Step 2: Lint (if configured)**

Run: `npx next lint`
Expected: no new warnings or errors.

- [ ] **Step 3: Commit any fixes from the lint pass (skip if none)**

```bash
git add -A
git commit -m "Fix lint warnings from final pass"
```

---

### Task 9.2: Visual QA — both themes, both breakpoints

- [ ] **Step 1: Desktop dark**

Run: `npm run dev`. Set theme to dark. Walk through:
- `/` — leaderboard renders, Leader Spotlight, all player rows, stats, badges, completed matches, upcoming matches, gravestone.
- `/match/1` — header with match name, rankings table, commentary.
- `/profile/donga` — hero image, stats grid, match history.
- Admin (`/admin`) — verify it still works (colors may be off per spec, but no breakage).

- [ ] **Step 2: Desktop light**

Toggle theme. Repeat the same walk. Verify contrast is legible, no invisible text, badges still distinguishable.

- [ ] **Step 3: Mobile 375px dark**

DevTools → iPhone SE. Walk through same pages. Verify:
- No horizontal scroll
- Tap targets ≥44px
- Theme toggle reachable
- Player chips truncate gracefully with ellipsis

- [ ] **Step 4: Mobile 375px light**

Toggle theme, re-verify.

- [ ] **Step 5: Commit any polish fixes from the walkthrough**

```bash
git add -A
git commit -m "Polish passes for QA walkthrough"
```

Skip if no changes.

Kill server.

---

### Task 9.3: Push

- [ ] **Step 1: Verify git log**

Run: `git log --oneline -30`
Expected: clean sequence of task-level commits since the spec commit.

- [ ] **Step 2: Push to origin**

Run: `git push origin main`
Expected: push succeeds.

---

## Notes for the Implementer

- **Commit often.** Every task ends with a commit. That's intentional — small atomic commits make rollback trivial if one step breaks something subtle.
- **Verify after each visual change.** The dev server is the source of truth for this redesign. Type-check alone can't tell you whether a gradient looks right.
- **Don't touch API routes or Supabase schema.** They are explicitly out of scope. If a task seems to require API changes, stop and re-read the spec.
- **`motion` imports:** use `motion/react` (v12 syntax). If an import errors, try `import { m, LazyMotion, domAnimation } from 'motion/react';` first.
- **Accessible by default:** every `<button>` gets an `aria-label` if it has no visible text. Every interactive card has a focus state. `prefers-reduced-motion` drops all motion to fades.
- **Admin page:** any visual weirdness there is expected and out of scope per the spec. Don't fix it in this plan.
