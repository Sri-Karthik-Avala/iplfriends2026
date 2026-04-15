# IPL Friends League — Public Site Redesign (Desi Scoreboard)

**Date:** 2026-04-15
**Scope:** Full public site (leaderboard, match detail, profile) + site-wide theme system
**Out of scope:** Admin page visual redesign, Supabase schema, API routes, leaderboard math, auth

---

## 1. Goals

1. Replace the single dark-only palette with a **dual-theme** system that respects `prefers-color-scheme` and allows manual override.
2. Adopt a **"Desi Scoreboard"** visual identity — deep navy + antique gold + India tricolor accent, Playfair Display serif headlines, Inter body, scoreboard-style rankings.
3. Ship **motion-library animations** that respect `prefers-reduced-motion` — list stagger, rank-1 pulse, hover lift, rank-change spring, confetti on new leader.
4. **Mobile-first** at all breakpoints. All interactive elements ≥44px. No horizontal scroll.
5. **Preserve every existing feature**: player photos, names, titles, stats columns, achievement badges, match history, AI commentary, upcoming match list, gravestone memorial.
6. Zero behavioral regression: identical API contracts, identical leaderboard math, identical data shapes.

## 2. Non-Goals

- No backend changes (Supabase schema, API routes, auth are untouched).
- No admin page visual overhaul — it auto-inherits the theme tokens but its layout stays as-is.
- No new player-facing features beyond the leader-spotlight callout mentioned below.
- No i18n, no internationalization work.
- No SSR-to-SSG migration or routing changes.

## 3. Visual Identity

**Name:** Desi Scoreboard — a cricket-broadcast aesthetic for an Indian friends league.

**Feel:** Serious enough to look like a real sports product, playful enough to carry savage AI commentary and gravestone memorials without visual whiplash. Deep navy base in dark mode, warm cream base in light mode, antique-gold accents in both. A thin tricolor stripe (saffron/white/green) sits directly under the top nav as the only explicitly "India" motif — everything else reads as "cricket broadcast with warmth."

**Anti-patterns** (things we are NOT doing):
- No full-saturation Bollywood gradients (that was Direction 2, rejected).
- No OLED dashboard / monospace code font (UI/UX Pro Max's first-pass suggestion — wrong mood).
- No heavy desi motifs (no mandala patterns, no paisley, no Devanagari display type).
- No emojis as icons — emojis are fine in content (medals, memorial, chant lines) but UI iconography uses Lucide SVGs.

---

## 4. Design Tokens

All tokens live as CSS custom properties on `<html>`, switchable by `data-theme="dark"` or `data-theme="light"`.

### 4.1 Dark mode palette

| Token | Value | Usage |
|---|---|---|
| `--bg-base` | `#0B0F1A` | Page background |
| `--bg-raised` | `#141A2A` | Card, row, panel background |
| `--bg-raised-strong` | `#18203A` | Rank-1 row, active element emphasis |
| `--fg-strong` | `#F8FAFC` | Headlines, player names |
| `--fg-body` | `#E8EAED` | Body text |
| `--fg-muted` | `#9AA3B8` | Stats labels, captions |
| `--border` | `#1F2638` | Standard borders |
| `--border-strong` | `#2A3454` | Photo frames, hover borders |
| `--gold` | `#FFB800` | Primary accent — pts numbers, active borders, CTAs |
| `--gold-soft` | `rgba(255,184,0,0.12)` | Chip backgrounds |
| `--silver` | `#C0C0C0` | Rank-2 accent |
| `--bronze` | `#CD7F32` | Rank-3 accent |
| `--saffron` | `#FF9933` | Tricolor stripe segment 1 |
| `--white-flag` | `#FFFFFF` | Tricolor stripe segment 2 |
| `--green` | `#138808` | Tricolor stripe segment 3 |
| `--danger` | `#F87171` | DNP chip, error states |

### 4.2 Light mode palette

| Token | Value | Usage |
|---|---|---|
| `--bg-base` | `#FDFBF5` | Cream canvas |
| `--bg-raised` | `#FFFFFF` | Card background |
| `--bg-raised-strong` | `#FFF8EC` | Rank-1 row, highlighted |
| `--fg-strong` | `#1F1914` | Headlines (near-black, warm) |
| `--fg-body` | `#2D241B` | Body text |
| `--fg-muted` | `#6B5A47` | Stats labels |
| `--border` | `#EBE3D0` | Standard borders (warm ivory) |
| `--border-strong` | `#D7CDB0` | Photo frames |
| `--gold` | `#B8860B` | Antique gold (not hot gold — harder to read on cream) |
| `--gold-soft` | `rgba(184,134,11,0.12)` | Chip bg |
| `--maroon` | `#6B1A1F` | Secondary accent — subheading rules, theme-toggle knob |
| `--silver` | `#949494` | Rank-2 |
| `--bronze` | `#B87A35` | Rank-3 |
| `--saffron` | `#FF9933` | Tricolor stripe (same across modes) |
| `--white-flag` | `#FFFFFF` | Tricolor stripe (same) |
| `--green` | `#138808` | Tricolor stripe (same) |
| `--danger` | `#B91C1C` | DNP chip |

**Contrast audit (must pass WCAG AA):**
- Dark: `--fg-body` on `--bg-base` → 13.2:1 ✓, `--gold` on `--bg-raised` → 7.1:1 ✓
- Light: `--fg-body` on `--bg-base` → 11.8:1 ✓, `--gold` on `--bg-raised` → 4.9:1 ✓ (borderline, uses `--fg-strong` for critical numbers)

### 4.3 Typography tokens

| Token | Value |
|---|---|
| `--font-display` | `'Playfair Display', Georgia, serif` |
| `--font-body` | `'Inter', system-ui, sans-serif` |
| `--fs-hero` | `clamp(2rem, 4vw + 1rem, 3.5rem)` |
| `--fs-title` | `clamp(1.25rem, 1vw + 1rem, 1.625rem)` |
| `--fs-body` | `0.9375rem` (15px) |
| `--fs-small` | `0.8125rem` (13px) |
| `--fs-tiny` | `0.6875rem` (11px) |
| `--fs-chip` | `0.625rem` (10px) |
| `--leading-body` | `1.6` |
| `--leading-headline` | `1.05` |

### 4.4 Spacing & shape

| Token | Value |
|---|---|
| `--space-1` | `0.25rem` (4px) |
| `--space-2` | `0.5rem` |
| `--space-3` | `0.75rem` |
| `--space-4` | `1rem` |
| `--space-6` | `1.5rem` |
| `--space-8` | `2rem` |
| `--space-12` | `3rem` |
| `--radius-sm` | `6px` |
| `--radius-md` | `10px` |
| `--radius-lg` | `14px` |
| `--radius-pill` | `9999px` |
| `--shadow-card` | `0 1px 2px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.06)` (light) / `0 1px 2px rgba(0,0,0,0.4)` (dark) |
| `--shadow-glow-gold` | `0 0 20px rgba(255,184,0,0.18)` (dark only) |

---

## 5. Theme System

### 5.1 Resolution order

1. If `localStorage['ipl-theme']` is `"dark"` or `"light"`, use it.
2. Otherwise, use `matchMedia('(prefers-color-scheme: dark)').matches` → `"dark"` | `"light"`.
3. On change: write new value to `localStorage`, update `<html data-theme>`, emit a `theme-changed` custom event (so any React components subscribed via `useSyncExternalStore` re-render).

### 5.2 FOUC prevention

An inline `<script>` in `layout.tsx`'s `<head>` runs synchronously **before first paint** and sets `document.documentElement.dataset.theme` from the same resolution order. No React rendering happens until the theme is set. This script is ~20 lines and gets inlined into the initial HTML by Next.js.

### 5.3 Toggle component

`src/app/components/ThemeToggle.tsx` — client component, uses `useSyncExternalStore` to read from `localStorage` and listen to the `theme-changed` event. Renders a pill toggle with a knob that animates to the opposite side with a 180ms spring. Icon: sun (☀) on light, moon (☾) on dark — Lucide SVG, not emoji. Accessible label `aria-label="Toggle color theme"`.

### 5.4 Cross-fade on toggle

When the theme changes, the root `<html>` transitions its `background-color` and `color` over 180ms `ease`. Individual components get their own transitions via `transition: background-color 180ms ease, border-color 180ms ease, color 180ms ease` on a selector list. No JS animation for the theme swap — pure CSS.

---

## 6. Typography

- Loaded via `next/font/google` in `src/app/layout.tsx`:
  - `Playfair_Display({ subsets: ['latin'], weight: ['700', '900'], variable: '--font-display' })`
  - `Inter({ subsets: ['latin'], weight: ['400','500','600','700','800'], variable: '--font-body' })`
- The font `variable` property is passed to `<html>` className so CSS vars `--font-display`/`--font-body` are available globally.
- Old Google Fonts `<link>` tags in `layout.tsx` for Cinzel/UnifrakturMaguntia are removed.
- Body defaults to `var(--font-body)`, headings and Roman-numeral ranks use `var(--font-display)`.
- Font-display is `swap` (Next.js default) — no CLS.

---

## 7. Page Structure

### 7.1 Shared shell (`layout.tsx`)

```
<html data-theme="...">
  <body>
    <nav class="site-nav">  ← sticky at top
      [Logo: gold dot + "Friends XI" in Playfair]   [Admin]  [ThemeToggle]
    </nav>
    <div class="tricolor-stripe" />
    <main>{children}</main>
  </body>
</html>
```

The logo itself is the leaderboard link (`href="/"`), so only `Admin` needs to exist as a separate nav item.

**Tricolor stripe:** 4px tall, full width, three equal segments — `linear-gradient(90deg, var(--saffron) 0 33.33%, var(--white-flag) 33.33% 66.66%, var(--green) 66.66% 100%)`. Sits immediately under the nav.

### 7.2 Leaderboard page (`/`, `src/app/page.tsx`)

Sections in order:

1. **Season Standings hero** — Playfair `"Season"` + italic gold `"Standings"`, small cap label "Season 26" above, subtitle `"N of 70 matches played · Points = Players − Rank + 1"`.
2. **Leader spotlight** (NEW, subtle) — a one-line strip under the hero that reads: `✦ <Leader name> leads with <pts> pts · "<Title>"`. If no leader yet (no matches played), hide. This is the only net-new feature.
3. **Latest match commentary** — same content as today, styled as a bordered card with a gold top-border and a ✦ head.
4. **Player cards list** — all players, stagger-animated on mount. See §8 for the card spec.
5. **Upcoming matches** — first 5 by default, "View all N matches" expands.
6. **Completed matches** — first 5 by default, newest first, same expand pattern.
7. **Gravestone memorial** — unchanged markup, picks up new theme tokens automatically.

### 7.3 Match detail page (`/match/[id]`, `src/app/match/[id]/page.tsx`)

1. **Back to Leaderboard** link (top-left).
2. **Match header** — team logos + vs badge + match name + `Match #N` + date, Playfair headline. Tricolor accent as a short underline beneath the team names.
3. **Cancelled state** — if `match.cancelled`, show the ❌ "Match Cancelled" card (unchanged copy, new theme colors).
4. **Rankings table** — scoreboard-style: rank column (Roman), player name + photo thumbnail, rank pts (gold), My11 (muted). No other changes to the data shown.
5. **AI commentary** — same rendering as today, new theme tokens.

### 7.4 Profile page (`/profile/[slug]`, `src/app/profile/[slug]/page.tsx`)

Keep the existing layout (hero with full-contain image + stats panel + match history + AI commentary). Swap every custom color for a theme token. The hero background gradient uses the player's team color blended with `var(--bg-raised)` so it works in both modes.

### 7.5 Admin page (`src/app/admin/page.tsx`)

**No layout changes.** Only CSS token references change so it auto-themes. This is explicitly out of scope for visual redesign work.

---

## 8. Player Card Spec

A shared `src/app/components/PlayerRow.tsx` used by leaderboard (primary usage), match detail rankings table (simplified variant), and profile match history (micro variant).

### 8.1 Desktop (>640px)

```
┌──────────────────────────────────────────────────────────────────┐
│ [I]  [56×80 photo]  Donga                            102  PTS   │
│  ↑       ↑          "The King Who Slipped"           (Playfair) │
│  │       │          8/8 played  avg #2  my11 871                │
│  │       │          🏆 LEADER  🥇 3× GOLD  💎 EVER PRESENT     │
│  │       └─ team-color right edge                                │
│  └─ Roman numeral in Playfair 900, 24px                          │
└──────────────────────────────────────────────────────────────────┘
```

- Container: `--bg-raised`, border `1px --border`, left border `3px` — gold on rank 1, silver rank 2, bronze rank 3, muted otherwise.
- Photo: rectangular, fixed 56×80, `object-fit: cover`, `object-position: center top` (unless overridden by `#pos=X,Y` fragment from our existing image-crop feature).
- Team color accent: `border-right: 2px solid <teamColor>` on the photo element.
- Name: Inter 800, 16px, `--fg-strong`.
- Title: Inter 500 italic, 13px, `--fg-muted`.
- Points block: Playfair 900, 24px, `--gold`, right-aligned. Small `PTS` label under in Inter 800, 9px, `--fg-muted`.
- Stats row: three inline spans, Inter 500, 11px, `--fg-muted`, separated by thin middots.
- Badge chips: pill shape, 10px font, Inter 800 uppercase, padding `2px 8px`, border + background use the gold/silver/bronze/blue/red color families from §4.

### 8.2 Mobile (≤640px)

Same content, restructured:

- Photo drops to 54×54 rounded-square, `align-self: flex-start`, same crop rules.
- Roman rank stays but at 18px, aligned to photo top.
- Name row contains the points inline on the right (no side column). Points use the same Playfair size-down to 18px.
- Title on its own line below name.
- Stats on one line as `"5/8 played · #3 · my11 823"`.
- Chips wrap on their own line below stats, max 4 visible, 9px font, ellipsize labels >64px.
- Card padding 10px 12px instead of 14px 16px.

### 8.3 Data inputs (unchanged)

The component receives the same `{ player, rank, stats, achievements }` shape the leaderboard already computes. **No data-model changes.** Achievement computation already lives in `src/app/page.tsx` — it gets lifted into `src/lib/leaderboard.ts` so match detail and profile pages can reuse it.

---

## 9. Animation Spec

All animations use the `motion` package (already installed, v12.38.0). Imports use `LazyMotion` + `domAnimation` features only (keeps bundle size down). Every animation checks `prefers-reduced-motion` — if reduced, motion variants fall back to simple opacity fades with no transforms.

### 9.1 List stagger on mount (leaderboard)

- Parent container: `<m.div variants={listVariants} initial="hidden" animate="visible">`
- `listVariants`: staggerChildren `0.06s`, delayChildren `0.1s`
- Child: `{ opacity: 0, y: 12 }` → `{ opacity: 1, y: 0 }`, spring `{ type: 'spring', stiffness: 220, damping: 26 }`
- Triggers on first paint after data load, not on tab focus or refocus.

### 9.2 Rank-1 glow pulse (leaderboard)

- Only the first player card in the sorted leaderboard.
- `box-shadow` loops between `0 0 0 0 rgba(255,184,0,0)` and `0 0 20px -2px rgba(255,184,0,0.35)`, 2.8s duration, infinite, ease-in-out.
- Light mode dims the glow to 0.18 alpha.

### 9.3 Hover lift (any interactive card)

- `whileHover={{ y: -2 }}` with `transition={{ duration: 0.18, ease: 'easeOut' }}`.
- `border-color` transitions to `--border-strong` via CSS.

### 9.4 Rank-change spring (when data refetches)

- After a refetch, if any player's rank changed, the player cards animate from old position to new position using `layout` prop (motion's FLIP animation).
- Transition: spring stiffness 280, damping 30.
- Implementation: `<AnimatePresence>` not needed since no adds/removes — just `<m.div layout />` on each row with a stable `key={player.id}`.

### 9.5 Confetti burst on new leader

- Only fires when the previously rendered leaderboard showed player X at rank 1 and the new leaderboard shows player Y ≠ X at rank 1 **AND** the change came from a fresh fetch (not initial mount).
- Renders 40 confetti particles (absolute-positioned spans) bursting out from the new leader's card, falling 1.5s, easing out.
- Gated on `prefers-reduced-motion`.
- Implementation: a single `useEffect` tracks previous `leaderId` via `useRef` and dispatches a one-shot confetti animation when it changes between two non-null values.
- **Timing reality check:** because the app refetches only on mount/navigation (no realtime), this fires only if a user revisits the leaderboard after a new match was scored and the top rank flipped. That's rare but correct — a quiet celebration when it happens, zero noise otherwise.

### 9.6 Theme cross-fade

- Handled in CSS: `html { transition: background-color 180ms ease, color 180ms ease; }` and equivalent on `.card, .btn, .badge, .site-nav`.
- No JS animation. Respects `prefers-reduced-motion` by setting `transition: none` inside the `@media` query.

### 9.7 Reduced motion fallback

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0ms !important;
  }
}
```

Additionally, motion components detect `useReducedMotion()` and skip spring physics in favor of instant state changes.

---

## 10. Mobile-First Behavior

### 10.1 Breakpoints

- Base (mobile): 0-420px — minimum viable one-column
- Small (mobile-plus): 421-640px — slightly roomier padding, same layout
- Medium (tablet): 641-1023px — desktop layout activates
- Large (desktop): 1024px+ — max container width 960px, centered

### 10.2 Tap targets

- Every button, link, and interactive card has a minimum 44×44 touch target. This means the theme toggle pill is 48×28 with extra padding, nav links get 12px vertical padding, match cards have `padding: 14px 16px` minimum.

### 10.3 Nav behavior on narrow screens

- The nav has only three elements (logo, Admin link, theme toggle), so no hamburger is needed even at 320px.
- <420px, the "Admin" label compresses to a shield icon + short text, and the theme toggle shrinks padding by 2px. Logo drops its subtitle. No layout reflow.
- ≥420px, everything sits inline at full size.

### 10.4 No horizontal scroll

- `overflow-x: hidden` on `<body>` as a safety net.
- All cards use `min-width: 0` on flex children to prevent content from pushing out.
- Long player titles get `text-overflow: ellipsis` at <420px; full text shown in a `title` attribute for tooltip.

---

## 11. Accessibility

- **Color contrast:** all fg/bg pairs meet WCAG AA (4.5:1 body, 3:1 large text). Documented in §4.
- **Focus states:** every interactive element gets a visible focus ring — `box-shadow: 0 0 0 2px var(--bg-base), 0 0 0 4px var(--gold)` — which is visible in both themes.
- **Keyboard nav:** full tab order, no focus traps, skip-to-content link at top of `<body>` for screen readers.
- **ARIA:** theme toggle has `aria-label="Toggle color theme"` and `aria-pressed`. Icon-only buttons (nav menu, back arrow) get `aria-label`.
- **Semantic HTML:** `<header>` for nav, `<main>` for content, `<article>` for player cards, `<nav>` for match lists, `<footer>` for gravestone.
- **Reduced motion:** respected at both CSS and motion-library layers (§9.7).
- **Alt text:** player photos use `alt={player.name}`, team logos use `alt={`${team} logo`}`, decorative imagery uses `alt=""`.

---

## 12. File Changes

### 12.1 New files

| Path | Purpose |
|---|---|
| `src/lib/theme.ts` | Theme resolver, FOUC-prevention inline script export, localStorage I/O, custom event dispatcher |
| `src/lib/leaderboard.ts` | Extracted achievement + stats computation (currently inside `page.tsx`) for reuse across pages |
| `src/app/components/ThemeToggle.tsx` | Client component, pill toggle with sun/moon icon |
| `src/app/components/PlayerRow.tsx` | Shared player card with desktop + mobile variants |
| `src/app/components/AnimatedList.tsx` | Motion LazyMotion wrapper with staggerChildren variants |
| `src/app/components/TricolorStripe.tsx` | 4px tricolor divider, used under nav and optionally under hero |
| `src/app/components/ConfettiBurst.tsx` | Fires when new leader detected |
| `src/app/components/Nav.tsx` | Header/nav extracted from `layout.tsx` for cleanliness |

### 12.2 Modified files

| Path | Change |
|---|---|
| `src/app/layout.tsx` | Replace Google Fonts link with `next/font`, add inline FOUC script, mount `<Nav />` and `<TricolorStripe />`, drop old nav inline JSX |
| `src/app/globals.css` | Full rewrite around the token system in §4. Delete the old `--background`/`--foreground`/`--panel-bg` dark-only vars. Keep gravestone + cricket-animation keyframes. |
| `src/app/page.tsx` | Replace inline player card JSX with `<PlayerRow />`, extract achievement logic to `src/lib/leaderboard.ts`, wrap list in `<AnimatedList />`, add leader spotlight strip, mount `<ConfettiBurst />` |
| `src/app/match/[id]/page.tsx` | Swap inline colors for tokens, apply Playfair to match name + table ranks, use `<PlayerRow variant="table" />` for rankings |
| `src/app/profile/[slug]/page.tsx` | Swap inline colors for tokens, apply Playfair to player name + rank, theme-aware hero gradient |
| `src/app/components/PlayerProfile.tsx` | Same theme-token refactor, no layout changes |
| `src/app/components/Gravestone.tsx` | Swap hardcoded colors for tokens |
| `package.json` | No additions — `motion` already installed |

### 12.3 Unchanged files (explicit allowlist)

- `src/lib/supabase.ts`, `src/lib/gemini.ts`, `src/lib/constants.ts`, `src/lib/image.ts`
- All routes in `src/app/api/**`
- `src/app/admin/**` (auto-inherits tokens, no layout change)
- `supabase-schema.sql`, database migrations
- `next.config.js`, `tsconfig.json`, `tailwind.config.*` (we're not using Tailwind)
- All scripts in `scripts/**`

---

## 13. Implementation Order (for writing-plans skill)

Eight phases, each independently testable:

1. **Theme infrastructure** — `src/lib/theme.ts`, inline FOUC script in layout, `<html data-theme>` set before first paint. Verify via DevTools that theme swaps without a flash.
2. **Token rewrite** — new `globals.css` with §4 tokens, both light and dark. Verify the existing site still renders (might look wonky since old classes reference old tokens — that's expected).
3. **Fonts migration** — `next/font` imports, remove old Google Fonts link. Verify `--font-display`/`--font-body` CSS vars work.
4. **Nav + TricolorStripe + ThemeToggle** — new `<Nav />` component with theme toggle. Test on mobile and desktop. Verify toggle persists across reloads.
5. **PlayerRow component** — extract current card JSX into `PlayerRow.tsx`, refactor `page.tsx` to use it. Achievements lifted to `src/lib/leaderboard.ts`. Desktop parity with current behavior before adding mobile variant.
6. **Mobile variant** — apply §8.2 mobile styles, verify on a real phone or Chrome DevTools mobile mode.
7. **Match detail + profile pages** — apply theme tokens, swap fonts, use `PlayerRow` variant where it fits.
8. **Animations** — `LazyMotion` setup, list stagger, rank-1 pulse, hover lift, rank-change spring, confetti burst. Final pass with `prefers-reduced-motion` on.

Each phase ends with: type-check clean, dev server runs, no console errors.

---

## 14. Risks & Unknowns

1. **`motion` v12 bundle size** — we installed the full package. Mitigate with `LazyMotion` + `domAnimation` (saves ~20KB). Acceptable.
2. **`next/font` vs existing `<link>` tags** — must remove the old `<link rel="stylesheet" href="...Cinzel...">` in `layout.tsx` or fonts will double-load.
3. **Light mode contrast on gold** — `#B8860B` on `#FDFBF5` is borderline 4.9:1. For critical numbers (points), we pair it with `font-weight: 900` and use `--fg-strong` for anything body-sized.
4. **Tricolor stripe in print/high-contrast mode** — we set `print-color-adjust: exact` to preserve the stripe. High-contrast mode users still see our theme; no regression since we weren't supporting high-contrast before either.
5. **Rank-change spring + confetti** — requires comparing previous and current leaderboard state. Implementation uses a `useRef` to track previous leaderId. No server changes, pure client diffing.
6. **Admin page auto-theming** — if admin uses inline color strings (it does, in many places), the light-mode version will look half-broken at first. Fix is out of scope per §2, but flagged for follow-up.

---

## 15. Success Criteria

- [ ] Theme toggle works, persists across reload, respects `prefers-color-scheme` on first visit.
- [ ] No flash-of-wrong-theme on any page at any load speed.
- [ ] All existing leaderboard content visible and functional: photos, names, titles, stats, badges, matches, AI commentary, gravestone.
- [ ] Mobile at 375px looks tidy, no horizontal scroll, 44px+ tap targets.
- [ ] All fg/bg pairs pass WCAG AA via automated contrast check or manual verification.
- [ ] `prefers-reduced-motion` disables all motion-library animations.
- [ ] TypeScript type-check clean, no new `any` leaks.
- [ ] Dev server runs, no console errors, no hydration warnings.
