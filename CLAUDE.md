# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status

The Destination slice is implemented and running: a 3D globe home page → country explore → city places,
backed by PostgreSQL + PostGIS and seeded with China (Beijing, Xi'an, Zhangjiajie). Everything else described
below — AI planning, passport, media, souvenirs — is still target architecture, not built yet.

## Commands

```bash
npm run db:up        # start Postgres (PostGIS) + Redis via Docker
npm run db:generate  # regenerate SQL migration after editing src/db/schema.ts
npm run db:migrate   # apply migrations (also enables the postgis extension)
npm run db:seed      # load China seed data; idempotent, re-runnable
npm run dev          # Next.js dev server on :3000
npm run typecheck    # tsc --noEmit
npm run lint
```

Host ports are **5433** (Postgres) and **6380** (Redis), not the defaults — this machine already runs a
local Postgres on 5432. `DATABASE_URL` overrides the default connection string; see `.env.example`.

## Geospatial conventions

Coordinates live in PostGIS `geometry(Point,4326)` columns via Drizzle's native `geometry` helper
(`point()` in `src/db/schema.ts`). Three rules that are easy to get wrong:

- **Order is [lng, lat]**, not [lat, lng]. `ST_MakePoint(lng, lat)`; read back with `ST_X` = lng, `ST_Y` = lat.
- **Always wrap in `ST_SetSRID(..., 4326)`** when constructing points — `ST_MakePoint` alone returns SRID 0
  and the insert will be rejected.
- **Cast `location::geography` for distance/radius** queries so `ST_Distance`/`ST_DWithin` return metres.
  Without the cast you get degrees, which are meaningless as distances.

Do not hand-edit files in `drizzle/` — they are generated. If a generated type comes out wrong, fix the
column definition in `src/db/schema.ts` and regenerate.

## Theme

The palette is defined once as Tailwind tokens in `tailwind.config.ts`; use the token names, not raw hex:

| Token | Hex | Use |
| --- | --- | --- |
| `space` | `#101827` | Main background / 3D map |
| `midnight` | `#172A46` | Cards, panels |
| `jade` | `#2FBF9F` | Primary accent / selected destinations |
| `gold` | `#F4C95D` | Highlights, achievements, collectibles |
| `coral` | `#F47C6C` | Important actions / experiences |
| `ivory` | `#F7F4EA` | Main text |
| `soft-gray` | `#AAB4C3` | Secondary text |
| `mist` | `#DCE7E5` | Light backgrounds |

The app is dark-first: `bg-space` + `text-ivory` are set on `body` in `globals.css`.

## Globe

The home page is a `react-globe.gl` / Three.js globe (`src/components/Globe.tsx`), loaded through
`GlobeShell.tsx` with `dynamic(..., { ssr: false })` — Three.js touches `window`, so it must never render on
the server. That indirection is also what keeps Three.js out of the initial bundle (home page is ~1.4 kB /
108 kB First Load); import `Globe` directly and you lose that.

- Country shapes come from `public/geo/countries.geojson` — Natural Earth 110m, stripped to `code` + `name` +
  geometry and rounded to 2dp (819 KB → 169 KB). Regenerate rather than hand-edit if it needs changing.
- Countries are matched to the DB by **ISO 3166-1 alpha-2** (`ISO_A2` → `countries.code`). Seeded countries
  render in jade and are clickable; the rest are grey and inert.
- The camera opens on the centroid of the first available country's cities (`ST_Centroid(ST_Collect(...))` in
  `listCountries`), not the 0°/0° default — otherwise the only clickable country faces away from the user.
- The globe canvas is not keyboard-accessible, so the bottom nav carries a plain `<Link>` per country as an
  equivalent path. Keep it in step with what the globe offers.

Props that take a Three.js object must be real instances, not object literals — `globeMaterial` is disposed
on unmount, so a plain `{ color, opacity }` crashes with `material.dispose is not a function` the moment you
navigate away. Build it with `new MeshPhongMaterial(...)` in a `useMemo`. Resist `as never`/`as any` on these
props; the cast is what hides the error until runtime.

**Testing globe clicks:** Three.js's raycaster treats an instantaneous press+release as a drag, so
`page.mouse.click()` in Puppeteer silently does nothing. Use `mouse.down()` → ~80ms pause → `mouse.up()`, and
allow ~4-5s for the transition before concluding it failed.

## Visual design

Pages are editorial, not utilitarian: a photo hero with oversized type, an asymmetric card grid (the first
card spans full width), per-category colour, and hover lift. Keep that register when adding pages — a plain
uniform card grid reads as a database table and was explicitly rejected.

- **Photos** come from Wikimedia Commons via Wikidata (`src/modules/media/wikimedia.ts`) — no API key, no
  usage cost. Each row caches its resolved `image_url` and `photo_fetched_at`, so a warm row makes no network
  call; refresh is every 30 days. A subject with no image records the attempt so it is not retried per render.
- **Always seed `wikidata_id` for new places.** Name search is ambiguous and silently returns the wrong
  subject — a bare "Muslim Quarter" resolves to *Jerusalem*, and "Jingshan Park" once resolved to an entity
  meaning "inauguration". Look the QID up and verify its label/description before adding it. Rows without a
  QID fall back to a deterministic gradient, which is correct behaviour — a wrong photo is worse than none.
- **Motion** is progressive enhancement only. `Reveal` starts *visible* and hides itself solely for elements
  below the fold — so content still renders if JS never runs, and nothing flickers on load. It also respects
  `prefers-reduced-motion`.
- Tailwind cannot see interpolated class names: `group-hover:${x}` silently produces no CSS. Store complete
  class strings (see the `KIND` map in the city page) instead of building them from fragments.

## Collectibles

Step 4 of the product journey — the "special things" a traveller would otherwise miss. `collectibles` hang
off a place (`src/modules/souvenir/queries.ts`) and surface in two places: a "Don't miss" section on the city
page, and inline under each place in a generated itinerary, so the plan says what to collect and where.

Seeded collectibles must be **real and verifiable** — a stamp table that does not exist sends someone
hunting for it on the day. Each carries `where_to_get` for that reason. Kinds are stamp / passport /
souvenir / book / badge.

## Journey Book / passport

`/trip/[slug]/passport` composes a finished trip into the Journey Book from step 6: one chapter per city,
places and collectibles as a checklist you stamp as you go. Progress lives in `trip_progress`, one row per
ticked item, keyed by trip — so a passport is shareable by URL and needs no login.

There is no auth yet, so **anyone with the URL can tick items**. That is fine for an unguessable slug and a
personal trip, but revisit it before trips belong to accounts.

Photos, notes and tickets (step 5) are not built: they need upload storage and a user to own them.

## Trip planner

`src/modules/trip/planner.ts` is deliberately **rules-based, not an LLM** — it packs places into days
deterministically so the itinerary, schema and UI are testable without an API key or per-request cost. The
LLM-backed orchestrator described below slots in behind the same `planTrip` interface when one is chosen.

Rules the algorithm enforces, each of which is easy to regress:
- A day never spans two cities, and never exceeds 8 hours of sightseeing.
- No place appears twice in one trip.
- Cities are ordered by how well they match the stated interests, so "nature" opens in Zhangjiajie and
  "culture" opens in Beijing.
- When the seeded places cannot fill the requested days, the plan reports `unfilledDays` and the UI says so
  rather than silently returning a shorter trip.

Generated plans are denormalised into `trips.plan` as JSON, so a saved itinerary stays stable even if the
underlying places change.

## Product concept

An AI-powered travel app that takes a user through discover → plan → experience → remember for a trip,
centered on a 3D interactive world map. The end-to-end user journey:

1. **Discover** — user picks a country on a 3D world map (e.g. China) and explores it: cities, famous and
   hidden places, nature, culture, food.
2. **Tell the app about yourself** — free-form preferences ("vegetarian, 10 days, mountains/culture/peaceful
   places, ₹1 lakh budget").
3. **AI plans the trip** — suggests a route (e.g. Beijing → Xi'an → Zhangjiajie) with lodging, food, sights,
   inter-city travel, and what's worth visiting that month.
4. **Discover special things** — surfaces things a user might miss: a museum's special stamp, a national
   park's visitor passport, a city's collectible souvenir, an official travel book.
5. **Save the journey** — during the trip, the user adds their own photos, videos, tickets, notes, stamps,
   souvenirs, and visited places.
6. **Make a travel passport** — after the trip, everything is composed into a personalized Journey
   Book/Passport (per-city sections with photos, tickets, stamps, collectibles), kept digitally or ordered
   as a printed book.

Each step maps to a domain module below: discover/explore → Destination module; preferences + AI planning →
AI module + Recommendation module; special/collectible discovery → Souvenir + Passport modules; saving trip
content → Media module; the final journey book → Passport module's composition + PDF/print generation.

## Intended architecture

Build as a **modular monolith first** (Level 1). Only split into independently deployable services (Level 2)
when a specific module's scale or team-ownership needs actually require it. Do not build microservices
up front.

### Level 1 — Modular monolith (build this first)

- **Frontend**: Next.js + React + TypeScript, Tailwind CSS, shadcn/ui, PWA with offline support. Includes the
  3D world map (country selection + explore view) as a first-class UI surface, not an afterthought bolted
  onto a conventional list/search UI.
- **API layer**: Next.js API routes / tRPC, handling auth/authz, rate limiting, validation, logging — as
  cross-cutting concerns in front of the domain modules, not duplicated per module.
- **Domain modules** (separate modules within the single backend, not separate services):
  - User/Auth — profiles, preferences, roles & permissions
  - Destination — countries, cities, regions, attractions/POIs; powers the discover/explore step
  - Trip/Itinerary — trip planning, itinerary, bookings; holds the AI-generated route and day-by-day plan
  - Places — hotels, restaurants (with dietary filters), experiences
  - Recommendation — personalized suggestions, season/weather, budget planning; turns free-form user
    preferences into constraints the AI module plans against
  - AI — trip planner agent, recommendation agent, travel memory agent (see AI architecture below)
  - Souvenir — collectibles, custom designs, print services; surfaces "special things" (museum stamps,
    park passports, city collectibles, official travel books) tied to specific places
  - Passport — digital passport, stamps/souvenirs, PDF generation; composes saved trip content (photos,
    tickets, notes, stamps, souvenirs, visited places) into the per-city Journey Book and drives print orders
  - Media — photos/videos, image processing, storage integration; backs the in-trip "save your journey" step
- **Data**: PostgreSQL + PostGIS (geospatial + relational data, vector search via pgvector), Redis (cache,
  sessions, rate limiting), S3/R2 (user photos, passport assets, generated files).
- **Background jobs**: Trigger.dev / BullMQ for passport generation, image processing, notifications — anything
  slow or non-interactive should go through a queue + worker rather than blocking a request (see Async
  architecture below).
- **Observability**: Sentry + OpenTelemetry for error tracking, performance, distributed tracing.
- **Deployment**: Vercel (serverless/containers, autoscaling, CI/CD via GitHub Actions).

### Level 2 — Evolution path (only when scale requires it)

Modules become independently deployable services behind an API Gateway (auth, rate limiting, routing,
request/response transformation), each with its own repository and datastore access. Infra moves toward
AWS/Kubernetes (EC2/Fargate autoscaling, ElastiCache, S3, CloudWatch, Secrets Manager) sitting behind
Cloudflare CDN/WAF and a load balancer.

Evolution phases: (1) modular monolith → (2) split out core services likely to need independent
scaling first (AI, Passport, Media) → (3) full microservices / service mesh only at high scale.

## AI architecture

**Do not build one giant "AI service."** Structure AI work as an orchestrator delegating to specialized
agents, each with a narrow, explicit tool surface:

- **AI Orchestrator** routes to specialized agents:
  - *Trip Planner Agent* — turns stated preferences (diet, duration, interests, budget) into a concrete
    multi-city route with lodging, food, sights, inter-city transport, and month-appropriate timing.
  - *Recommendation Agent* — personalized place/food/experience suggestions, including the "special things"
    a user would otherwise miss (stamps, visitor passports, collectibles, official books).
  - *Travel Memory Agent* — works over the user's saved trip content (photos, tickets, notes, stamps) to
    compose and caption the Journey Book/Passport.
- **Tool layer**: agents call explicit tools only — `searchPlaces()`, `searchRestaurants()`, `getWeather()`,
  `calculateRoute()`, `searchHotels()`, `getSouvenirPrograms()`, `searchOfficialSources()`,
  `calculateBudget()`. These tools wrap external APIs / the DB.
- **Governing principle**: the LLM decides *what it needs*; the application decides *what it is allowed to
  do*. Never let a model call external APIs or the DB directly — route everything through the tool layer so
  permissions and validation are enforced by application code, not by the model.
- **AI content flow**: external content → sanitize → retrieve → LLM → validate structured output → application.
  Treat any content pulled in for the LLM (search results, page content, etc.) as untrusted and sanitize
  before it reaches the model; validate the model's structured output before using it in application logic.

## Geospatial

Flow: user location / map interaction (Mapbox) → coordinates → PostGIS query → parallel lookups across
attractions/restaurants/hotels → recommendation engine. Geospatial queries should go through PostGIS rather
than ad hoc distance math in application code.

## Async / background jobs

Long-running or non-interactive work should follow the job pattern, not run inline in a request:
request → create job → enqueue → background worker processes it (e.g. process photos, generate layout,
generate PDF, upload to S3) → update job status in DB → notify user.

Apply this pattern to: passport generation, AI itinerary generation, photo analysis, PDF generation, email
sending, print-order processing.

## Security

- Standard request path: HTTPS → Cloudflare WAF → authentication → authorization → input validation →
  business logic → data stores.
- Secrets live in a secrets manager, never in code/env files committed to the repo.
- S3 access is via private buckets + presigned URLs, not public buckets.
- Database is on a private network, not directly internet-accessible.
- Logs must never contain passwords, tokens, or other sensitive user data.
- GDPR compliance is a requirement, not an afterthought — keep encrypted data at rest and in transit, and
  respect data access/deletion requirements when designing user data models.

## CI/CD

GitHub Actions pipeline: tests → security scans → build → deploy. Target deploy is Vercel for the Next.js
app, with managed PostgreSQL and Redis, and blue/green-style deploys with rollback support.
