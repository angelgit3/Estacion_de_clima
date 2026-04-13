# Skill Registry

## Available Skills
<!-- Skills are registered here as the project evolves -->

## SDD Workflow Status
- [x] **sdd-init**: Project context detected and saved
- [ ] **sdd-explore**: Awaiting topic selection
- [ ] **sdd-spec**: Pending
- [ ] **sdd-implement**: Pending
- [ ] **sdd-verify**: Pending

## Project Capabilities
- Next.js 16 development server (`npm run dev`)
- Production build (`npm run build`)
- Linting (`npm run lint`)
- TypeScript checking (`npx tsc --noEmit`)

## Notable Constraints
- Supabase connection requires env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- Hardware-dependent features (ESP32, MyDAQ) cannot be unit-tested without mocking
- Realtime WebSocket subscriptions need live Supabase project
