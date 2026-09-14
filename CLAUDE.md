# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status

The Destination slice is implemented and running: a 3D globe home page → country explore → city places,
backed by PostgreSQL + PostGIS and seeded with China (Beijing, Xi'an, Zhangjiajie). Everything else described
below — AI planning, passport, media, souvenirs — is still target architecture, not built yet.

## What is not built

The product concept below describes the target, not the current state. Notably absent:

- **No AI.** There is no LLM, orchestrator or tool layer. `planTrip` is deterministic and only groups seeded
  places into days — it does not suggest lodging, restaurants or inter-city transport, and the dietary and
  budget preferences are captured but unused.
- **Preferences are checkboxes**, not the free-form text the concept describes.
- **Memories accept photos and notes only** — no video, no tickets.
- **The passport is digital only** — no PDF, no print ordering.
- **No tests.** The day-packing rules, `monthInRange` wraparound and trip access control are all untested.
- No background jobs, PWA/offline, Sentry/OpenTelemetry, or rate limiting.

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

`docker compose --profile app up` additionally builds and runs the app itself; plain `docker compose up`
starts only the databases, which is what day-to-day development wants alongside `npm run dev`.

**Redis is an optional cache, never a dependency.** `src/modules/media/cache.ts` degrades every call to a
miss when `REDIS_URL` is unset or Redis is down, so the app works either way — which also means a silently
missing `REDIS_URL` looks identical to a working cache with zero hits. Check `redis-cli DBSIZE` before
concluding caching is broken.

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

## Theme — Organic design system

The app follows the mockups in `design-mockups/` (`Destiny Web Mockups.dc.html`, ten screens). It is a
**warm paper theme, not dark**: cream ground, forest ink, clay accent. The earlier dark-navy theme was
replaced wholesale — do not reintroduce `space`/`midnight`/`jade` tokens.

| Token | Hex | Use |
| --- | --- | --- |
| `paper` | `#F5EAD8` | Page ground |
| `surface` | `#EBDDC5` | Inset panels, inputs |
| `cream` | `#FFF9ED` | Cards |
| `ink` | `#201E1D` | Body text |
| `forest` | `#173F35` | Headings, sidebar rail |
| `clay` | `#C67139` | Primary accent, buttons |
| `sage` | `#7A8A5E` | Secondary accent |

Ramps `neutral-*`, `accent-*` and `leaf-*` follow the design system's OKLCH scale; `shadow-sm/md/lg` are its
ink-tinted elevations. Source of truth is `design-mockups/_ds/.../styles.css`.

**Typography**: Caprasimo display for headings, Figtree for body. Note that `next/font` rejects `axes`
alongside explicit `weight` values, and `@apply font-display` fails inside `@layer base`; set
`font-family: var(--font-display)` directly there instead.

**Photography is `.washed`** — desaturated and lifted so it sits on paper rather than fighting it. A
full-saturation photo on this ground looks pasted on.

**Accent colour is per country**, keyed by motif via `src/lib/accent.ts`: clay for China, accent-600 for
Japan, leaf for India, forest for Italy. Event cards take their tone from what the event *is*
(`src/lib/event-tone.ts`) — blossom renders accent, autumn foliage clay, festivals leaf.

**Motifs keep moving.** Each draws itself in once, then loops forever: the crane flies with flapping wings,
the dragon undulates, the peacock's fan sways, laurel rustles. A motif that animates once and freezes reads
as broken — verify with `getComputedStyle(el).transform` sampled twice, not by eye on a screenshot.

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
  usage cost. They are served through `/api/image`, which refetches with a descriptive `User-Agent`:
  Wikimedia answers hotlinking browsers with a ~2KB placeholder JPEG rather than an error, so images look
  silently broken if the page links `commons.wikimedia.org` directly. The proxy only accepts
  `https://commons.wikimedia.org/wiki/Special:FilePath/` URLs, never an arbitrary host. Each row caches its resolved `image_url` and `photo_fetched_at`, so a warm row makes no network
  call; refresh is every 30 days. A subject with no image records the attempt so it is not retried per render.
- **Always seed `wikidata_id` for new places.** Photos resolve *only* by explicit QID — name search is
  ambiguous and silently returns the wrong subject ("Muslim Quarter" → *Jerusalem*, "Jingshan Park" → an
  entity meaning "inauguration"), so that fallback was removed after it shipped a Jerusalem photo to a Xi'an
  place. Look the QID up and verify its label before adding it; a row without one shows a gradient, which is
  the correct outcome.
- **Motion** is progressive enhancement only. `Reveal` starts *visible* and hides itself solely for elements
  below the fold — so content still renders if JS never runs, and nothing flickers on load. It also respects
  `prefers-reduced-motion`.
- Tailwind cannot see interpolated class names: `group-hover:${x}` silently produces no CSS. Store complete
  class strings (see the `KIND` map in the city page) instead of building them from fragments.

## Collectibles

Step 4 of the product journey — the "special things" a traveller would otherwise miss. `collectibles` hang
off a place (`src/modules/souvenir/queries.ts`) and surface in two places: a "Don't miss" section on the city
page, and inline under each place in a generated itinerary, so the plan says what to collect and where.

Seed data lives in `src/db/seed-data/<country>.ts`, one file per country, collected in `seed.ts`. Adding a
country is a new file plus one array entry.

**Verify every Wikidata QID against its label and description before seeding it.** Name search is actively
dangerous here: "Agra" returns a genus of insects, "Taj Mahal" a 1968 album, and plausible-looking guesses
resolved to a German band, a French commune and a Swedish novelist. The SPARQL endpoint
(`query.wikidata.org/sparql`) matching on `rdfs:label` with `wdt:P18` is far more reliable than
`wbsearchentities`, and returns descriptions you can check.

Seeded collectibles must be **real and verifiable** — a stamp table that does not exist sends someone
hunting for it on the day. Each carries `where_to_get` for that reason. Kinds are stamp / passport /
souvenir / book / badge.

## Auth

Auth.js v5 with email magic links (`src/auth.ts`), sessions in Postgres via the Drizzle adapter. Trips carry
`user_id`, and `/trips` lists a signed-in user's own trips.

- **No SMTP needed locally**: without `EMAIL_SERVER_HOST`, `sendVerificationRequest` prints the sign-in link
  to the server console instead of sending mail. Grab it from the dev log to sign in.
- `AUTH_SECRET` lives in `.env.local` (gitignored). `.env.example` documents it with a blank value.
- `next-auth@5 beta` pins `nodemailer` to **v7/v8** — installing v10 fails with an ERESOLVE conflict.
- Auth tables use Auth.js's own camelCase column names (`userId`, `sessionToken`, `emailVerified`), unlike
  the snake_case used everywhere else. They are defined separately in `src/db/auth-schema.ts`; do not
  "fix" the casing.

Trips planned while signed out still work and have a null `user_id` — anyone with the URL can open them.
`trip_progress` is likewise keyed by trip, not user.

## Journey Book / passport

Two steps, deliberately separate:

1. `/trip/[slug]/collect` — the user ticks what they actually saw and collected.
2. `/trip/[slug]/passport` — the finished keepsake, **read-only**.

Keep that split. The passport is a reveal, so it must not contain checkboxes; editing happens on the collect
step and `setProgress` replaces the whole selection in one transaction. Progress lives in `trip_progress`,
keyed by trip — so a passport is shareable by URL and needs no login.

The passport carries place photos, a route map, animated stamps and sparkles. `RouteMap` draws the country
outline from the same `public/geo/countries.geojson` the globe uses and plots city coordinates from PostGIS —
no map library or API key. Its projection corrects for latitude (`cos(midLat)`), without which countries far
from the equator look horizontally stretched.

**Screenshotting the passport needs patience**: `.route-stop` markers start at `opacity: 0` with delays up to
~1.7s, and Wikimedia photos are ~1MB each. Wait for `networkidle2`, then for images to decode, then ~4s more —
otherwise the map looks empty and the cards look broken when they are both fine.

There is no auth yet, so **anyone with the URL can tick items**. That is fine for an unguessable slug and a
personal trip, but revisit it before trips belong to accounts.

**Memories (step 5)** are built: signed-in users add photos and notes on `/trip/[slug]/collect`, and they
appear in a "Your memories" section of the passport. Files are written to a gitignored `uploads/` directory
via `src/modules/media/storage.ts` and served through `/api/uploads/[name]`. Filenames are generated UUIDs,
never derived from user input, and both write and read validate the `<uuid>.<ext>` shape — swapping in S3/R2
later means changing only that module and the read route.

**Ownership** is decided in one place, `src/modules/trip/access.ts`. A trip with a null `user_id` (planned
while signed out) stays editable by anyone with the link, so older shareable trips keep working; an owned
trip is editable only by its owner. Check `canEdit` on render *and* again inside every server action — the
render is not a security boundary.

## Country motifs

`countries.motif` names a cultural decoration rendered by `src/components/Motif.tsx`: `dragon` (China),
`crane` (Japan), `peacock` (India), `laurel` (Italy). Each is an animated SVG that draws itself in. Adding a
country's motif means adding a case in that one component; the pages that render it do not change. The same
key also picks the ambient scale in `SoundToggle`, so a new motif needs an entry in both.

`motif` belongs to **countries only**. A careless edit once added `c.motif` to `listCitiesForCountry`, where
`c` aliases `cities`, and every country and passport page 500'd — beware shared table aliases when editing
these queries.

## Ambient sound

`SoundToggle` synthesises sparse plucked notes through WebAudio — no audio files ship. The scale is chosen by
the country's `motif`, so each destination sounds different: China uses a gong pentatonic, and the map in the
component holds the others. Pass `motif` wherever the toggle is rendered; without it you get the generic
fallback, which was the original flat drone and is not good enough on its own.

It is **off by default and opt-in**, persisted in `localStorage`: browsers block autoplay, and unrequested
sound is hostile. Keep it that way.

## No page should feel flat

Every page carries the same devices, and a page missing them reads as unfinished — the itinerary shipped as
plain text blocks once and had to be rebuilt. A page needs:

- **Photography** — a `Hero` and per-item images, never text alone on a dark ground.
- **Animation** — `Reveal` on lists, `motif-float`, stamp and draw animations. All respect
  `prefers-reduced-motion`.
- **Sparkles** — `StarField` sits in the root layout as a fixed, `-z-10` backdrop on every page; `Sparkles`
  marks individual earned or seasonal items.
- **The country motif** — `Motif` renders the country's animated emblem. It needs the country row, so a page
  showing a trip must load it via `getCountryBySlug(trip.countrySlug)`.
- **The sound toggle**, wired to that same motif.

## Seasonality and events

Trips carry an optional `start_date`; its month drives two things in the itinerary:

- **Timing warnings** — a place whose `best_months` excludes the travel month shows "Better in ..." with its
  `season_note`. A July trip to China raises 8 warnings; an October one raises none.
- **Catchable events** — `events` rows are filtered to those overlapping the travel month, so an October trip
  surfaces autumn foliage while a July trip surfaces nothing.

City pages show all events regardless of date under "While you're there".

`monthInRange` handles ranges that **wrap the new year** (a Dec–Feb festival must match January). Keep that
behaviour if you touch it — the obvious `start <= m && m <= end` comparison silently breaks those events.

Seeded seasons and events must be **real**: sending someone to a festival that does not exist, or telling
them to avoid a month for no reason, is worse than saying nothing. Places without a genuine season simply
omit `best_months`.

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
