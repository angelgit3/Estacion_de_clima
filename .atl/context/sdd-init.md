# Project Context: Estación Meteorológica Pro

## Stack
- **Language**: TypeScript 5 / React 19 / Next.js 16 (App Router)
- **Framework**: Next.js 16.2.3 with Server Components + Client Components
- **Styling**: Tailwind CSS 4 + White Glassmorphism design
- **Database**: Supabase (PostgreSQL + Realtime WebSockets + REST API)
- **Visualization**: Recharts 3 (AreaChart with gradients)
- **Animation**: Framer Motion 12
- **Build Tool**: Next.js built-in (`next dev`, `next build`)
- **Hardware**: ESP32 firmware + NI MyDAQ bridge (Python)

## Testing
- **Test Runner**: NOT FOUND — no test framework installed
- **Unit Tests**: ❌ — no test files exist
- **Integration Tests**: ❌ — no test files exist
- **E2E Tests**: ❌ — no Playwright/Cypress
- **Coverage**: NOT AVAILABLE

## Quality Tools
| Tool | Available | Command |
|------|-----------|---------|
| Linter | ✅ | `npx eslint` |
| Type Checker | ✅ | `npx tsc --noEmit` |
| Formatter | ❌ | not configured (no Prettier/Biome) |

## Strict TDD Mode: disabled ❌
No test runner detected. No test files exist in the project. Strict TDD can be enabled after installing a test framework (e.g., Vitest or Jest).

## Conventions
- **Path aliases**: `@/*` maps to project root
- **Component pattern**: Single-file React client components (`"use client"`)
- **Supabase client**: Singleton pattern via `getSupabase()` in `lib/supabase.ts`
- **Realtime data**: Supabase WebSockets subscription for live updates
- **Design system**: White Glassmorphism (translucent cards, gradient accents, backdrop blur)
- **No CI/CD**: No GitHub Actions or pipeline configured
- **No formatting**: No Prettier or Biome — only ESLint with Next.js config
- **Project root IS the dashboard**: `app/`, `components/`, `lib/` are at repo root (not in `dashboard/` subfolder as README describes)

## Current Architecture (Frontend)
```
app/
  layout.tsx          — Root layout with Inter font
  page.tsx            — Single-page dashboard (all logic in one file ~300 lines)
components/
  WeatherCard.tsx     — Animated sensor card component
lib/
  supabase.ts         — Supabase client singleton
```

## Identified Improvement Areas
1. **Data visibility**: Only 3 charts (temp, humidity, wind) — missing pressure, light, sound charts
2. **Monolithic page**: `page.tsx` is ~300 lines — should be split into chart components, data hooks, layout sections
3. **No data aggregation**: Only shows latest 50 records — no historical views, date ranges, or statistics
4. **No test coverage**: Zero tests — risky for a monitoring application
5. **No error handling**: Supabase client returns null silently on missing env vars
6. **No loading skeletons**: Only shows "..." text while loading
7. **No responsive chart selection**: Charts are fixed layout
8. **Missing metrics**: No min/max/avg calculations, no trend indicators, no daily summaries
