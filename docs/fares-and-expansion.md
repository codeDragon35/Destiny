# Travel fares and country expansion

Research notes on where ticket-price data comes from — "what does the Delhi→Jaipur train cost, what
does the Delhi→Leh flight cost" — and on what India-first means for the code when a second country
arrives. Collected 2026-09-20. **Nothing here is built.** This is a decision record.

## Trains and flights are not the same problem

Trains are computable. Flights are not, at least not affordably. That asymmetry drives everything below.

## Trains — a published formula, no API needed

Indian Railways fares are not a market price, they are a **published formula**, so they can be
calculated rather than fetched:

- **Distance slabs with telescopic rebate** — 1–50, 51–100, 101–500, 501–1000 km and up, with rebates
  of roughly 0 / 5 / 15 / 25 % and rising, so longer journeys cost less per kilometre.
- **Per-km rate by class** — approximately ₹0.6/km Sleeper, ₹1.3/km 3AC.
- **Minimum chargeable distance** — 200 km Sleeper, 300 km 3AC, so a short hop is charged at the floor.
- Total is then `Base + Reservation + Superfast + GST + dynamic`.

Route data is genuinely free: **`datameet/railways` is CC0** — station coordinates as GeoJSON, train
routes with distances, schedules. CC0 means no attribution and no share-alike, the cleanest licence
available. `data.gov.in` carries the official timetable with route distances.

**Caveat — verify before shipping.** The per-km rates above come from secondary sources, not an
official Railway Board circular, and fares were rationalised on 1 July 2025. The `datameet` data also
looks to be ~2016 vintage: distances are stable, fares are not. A wrong fare sends someone to a station
with the wrong money — the same class of failure as the Jerusalem photo.

## Flights — the free market closed in 2026

Every commonly recommended flight-price API is now shut to new developers:

| Provider | Status (2026) |
| --- | --- |
| Amadeus Self-Service | **Decommissioned 17 July 2026**; enterprise contract only |
| Skyscanner | Approved commercial partners only, revenue-share |
| Kiwi Tequila | Invitation-only since May 2024 |
| Duffel | Free sandbox, but sandbox prices are explicitly unrealistic |

Duffel is the migration path Amadeus names, and its economics are the problem: $3 per confirmed order,
with a **1500:1 search-to-book ratio**. A trip planner searches constantly and books never, so with
zero bookings the free search allowance is `1500 × 0 = 0` — every search is billable.

The free tiers that do remain (Aviationstack ~100 req/month, AeroDataBox ~600 units/month) return
**schedules and status, not bookable prices**.

## Buses — per *stage*, not per kilometre, and set by each state

Buses are the awkward middle case: the rates are published like rail, but there is no single national
formula, because **each state road transport corporation sets its own** and revises it on its own
schedule.

Two structures are in use:

- **Per-km paise rates.** Haryana Roadways publishes ordinary at 100 paise/km up to 100 km and 105
  paise/km beyond, HVAC at 150, intra-state luxury AC (Volvo/Mercedes) at 175, super-luxury AC at 250,
  with a minimum chargeable fare of ₹5. That structure dates from 15 May 2020.
- **Per-stage rates.** Maharashtra (MSRTC) charges per *stage*, not per km: ordinary ₹11.40, semi-luxury
  ₹13.65, ordinary sleeper-seater ₹15.50, ordinary sleeper ₹16.75, Shivshahi AC seater ₹14.20, AC
  sleeper ₹15.35, effective 18 July 2026.

**A "stage" is a state-defined distance**, and the definitions genuinely differ: 2.5 km in Kerala, 2 km
for BMTC in Bengaluru, 6 km in Maharashtra. Fares round up to the next rupee. So a per-stage rate cannot
be compared across states without dividing by that state's stage length first — MSRTC's ₹11.40 per
6 km stage is ~190 paise/km, not ₹11.40/km.

Consequence for the calculator: **bus fare needs a per-state table**, keyed by region, not one national
rate. India has ~28 states with their own corporations. The honest first implementation is a handful of
seeded states plus a national fallback band, with the fare labelled as indicative.

Fare revisions are frequent — Maharashtra alone appears in the sources with a 13.56% hike and a
separately approved 14.95% hike. Any seeded table needs a `sourcedOn` date and periodic re-checking.

**Booking APIs are not an option here either.** RedBus is the dominant aggregator; third-party resellers
advertise integration, but the developer-facing API is described as search / schedule / seat-layout data
only, with no booking or payment endpoints, and access is partner-gated rather than self-serve. Same
conclusion as flights: estimate, then link out.

**GTFS is about schedules, not fares.** The Mobility Database catalogues 6,000+ feeds across 99
countries, and Delhi's Open Transit Data publishes a static GTFS feed — but Delhi's feed ships only
`agency`, `calendar`, `stops`, `routes`, `trips` and `stop_times`. No `fare_attributes.txt` or
`fare_rules.txt`, so no fares. GTFS is useful for *routes and stops*, not prices, and Indian coverage is
city-level (Delhi, Kochi, Bengaluru via OpenBangalore) rather than intercity.

## Decision — show a range, never a fetched price

Show an *indicative band* — "Delhi → Leh, ~1h 20m, typically ₹5,000–12,000" — derived from the
distance the planner already computes, widened and labelled as an estimate.

This is more honest than it looks. A cached fare is stale the moment it is stored, and showing a stale
₹4,200 that is really ₹11,000 is worse than showing a range. Airline pricing moves with demand and
season in ways no cached value survives.

Per leg:

| Mode | Source | Confidence |
| --- | --- | --- |
| Train | Computed from the published slab formula + CC0 distances | High — it is a formula |
| Bus | Per-state corporation rate table (per-km or per-stage) | Medium — varies by state, revised often |
| Flight | Distance-banded estimate, shown as a range | Indicative only |

**Link out to IRCTC / an OTA for the actual booking** rather than becoming a booking engine. That also
sidesteps IRCTC access entirely: official API access takes months and requires authorised-partner
status, and the third-party resellers are a legal and reliability risk not worth carrying.

This matches what the app already does — `/trip/[slug]/guide` and `/trip/[slug]/today` both render ₹
amounts under the label "Indicative, not booked prices."

## What already exists

Worth knowing before building anything: `src/modules/trip/planner.ts` already has `TravelMode`
(`flight | train | bus | car | bike`), a `TravelLeg` carrying `km` / `hours` / `days`, haversine
distance, per-mode speed tables (`ROAD_KMH`) and hill-detour logic. Fares would hang off that, not
replace it.

## India-first — where the India assumptions actually live

The seed layer is **already country-generic**. `src/db/seed-data/types.ts` contains nothing
India-specific, `SeedRegion.kind` is a free-form string precisely so a country can call its tier
"state" or "prefecture", and adding a country is one file plus one array entry. No change needed there.

The assumptions are elsewhere:

| Assumption | Where | Breaks on |
| --- | --- | --- |
| `lat > 30` means mountains | `planner.ts` (`inHills`) | Northern hemisphere only — inverts in Chile or NZ |
| `₹` hardcoded, `toLocaleString("en-IN")` | 6+ files across `src/app` | Any second country |
| Road speeds tuned for India | `ROAD_KMH` in `planner.ts` | Japan's rail is roughly 3× |

The `lat > 30` one is the interesting defect: it is not merely India-specific but *hemisphere*-specific,
and a comment on that line already admits it was tuned by trial (Mumbai→Dharamshala).

## Suggested order of work

1. **Currency as a country property, before fares.** Add `currency` + `locale` to `SeedCountry` and a
   single `formatMoney(amount, country)` helper. Do this *first* — small now, a painful sweep once fares
   have spread rupee formatting into more files.
2. **Train fares as a per-country calculator** behind one interface:
   `estimateFare(mode, km, country) → { low, high, currency }`. India gets the real slab formula; other
   countries fall back to a distance band until someone writes theirs.
3. **Flights stay a range**, in every country.
4. **Elevation instead of latitude**, eventually — replacing `lat > 30` with real elevation data is what
   makes the planner work in the southern hemisphere, and it is a correctness fix regardless of expansion.

## Explicitly not recommended

**Do not build a general fare framework for hypothetical countries.** Four countries are seeded but only
India has a fare formula. One interface plus one real implementation; extend when a second country
actually needs it. This is the same instinct as `CLAUDE.md`'s "modular monolith first, do not build
microservices up front".

## All options in one place

Every source considered, with what it costs. "Open" below means usable without a commercial agreement.

### Open — usable now, no agreement

| Source | Gives | Licence / limit | Cost |
| --- | --- | --- | --- |
| **PostGIS + existing coordinates** | Straight-line distance between any seeded rows | Already in the repo | Free |
| **`datameet/railways`** | Rail station coordinates, routes with distances, schedules | **CC0** — no attribution, no share-alike | Free |
| **data.gov.in** (Ministry of Railways) | Official train timetable, route distances | Government open data | Free |
| **Published rail fare rules** | Slab + telescopic rebate formula, per-km class rates | Public information | Free |
| **State RTC fare notifications** | Bus per-km / per-stage rates by class | Public information; per-state, revised often | Free |
| **Delhi Open Transit Data** | Static GTFS: stops, routes, trips, stop_times | Static open; realtime needs a key. **No fare files** | Free |
| **Mobility Database** | Catalogue of 6,000+ GTFS feeds, 99 countries | Open catalogue; Indian coverage is city-level | Free |
| **Wikidata** | Place coordinates, population, QIDs | **CC0** | Free |
| **GeoNames** | ~10M geographic entities, bulk download | CC BY 4.0 — attribution, no share-alike | Free |
| **OSM / Overpass** | Dense POI data (`tourism=museum`, etc.) | **ODbL — share-alike.** Mixing into `places` creates a derivative database. Fair-use caps: ~100 queries / 10MB per day for regular apps | Free, but licence-entangled |

### Open-source software you would self-host

| Engine | Gives | Cost |
| --- | --- | --- |
| **OSRM** | Road distance/duration matrices; `/route`, `/table`, `/nearest` | Free software; you pay for the server. Rebuild whole graph to change profile |
| **Valhalla** | Multimodal, isochrones, per-request costing | Free software; ~15–20 GB tiles per continent |
| **GraphHopper** | Middle ground, good bike/pedestrian routing | Free software; Java |

All three are free to run and none of them return **fares** — only distance and time.

### Paid or gated — priced for reference

| Provider | Gives | Access | Cost |
| --- | --- | --- | --- |
| **Duffel** | Real bookable flight prices | Self-serve signup; sandbox prices unrealistic | $3/confirmed order, 1% of order value, **1500:1 search-to-book ratio** then $0.005/excess search. A planner that never books pays for every search |
| **Amadeus Self-Service** | Flight offers | **Decommissioned 17 July 2026** — enterprise contract only | Negotiated |
| **Skyscanner** | Flight prices | Approved partners only | Revenue-share |
| **Kiwi Tequila** | Flight prices | Invitation-only since May 2024 | Negotiated |
| **Aviationstack** | Schedules/status — **no prices** | Self-serve | Free: 100 req/month. Paid from ~$49.99/mo |
| **AeroDataBox** | Schedules/status — **no prices** | RapidAPI | Free: 600 units/month. Pro ~$5.35/mo |
| **FlightAPI.io** | Indicative prices with booking links | Self-serve | 20–100 free calls, then ~$49/mo |
| **Travelpayouts** | Cached/aggregated fares | Affiliate signup | Commission 1.1–1.5%; live search needs 50K MAU |
| **IRCTC (official)** | Train booking | Months to obtain, authorised-partner status | Negotiated |
| **IRCTC resellers** | Train booking | Self-serve-ish | Varies; legal and reliability risk |
| **RedBus** | Bus search/schedule/seat layout — **no booking endpoints** | Partner-gated | Negotiated |

**Net:** everything needed for *distance, routes and rail/bus fare rules* is free and open. Nothing free
returns a **live flight or bus price** — that is the one thing the market has closed, and the reason the
decision above is to show a range and link out.

## Sources

- [datameet/railways](https://github.com/datameet/railways) — station coordinates, routes, schedules; CC0
- [data.gov.in — Indian Railways train timetable](https://www.data.gov.in/catalog/indian-railways-train-time-table)
- [SATHEE — Indian Railways fare calculation rules](https://sathee.iitk.ac.in/sathee-railway-exams/student-corner/railway-gk/operations/fare-calculation/) — slabs, telescopic rebate
- [Duffel pricing](https://duffel.com/pricing) — $3/order, 1500:1 search-to-book ratio
- [Duffel test mode](https://duffel.com/docs/api/overview/test-mode/duffel-airways) — sandbox prices are not realistic
- [Thunderbit — flight APIs with free tiers, 2026](https://thunderbit.com/blog/best-flight-api-with-free-tiers) — Amadeus decommissioning
- [IRCTC API integration guide for travel agents](https://bos.center/blog/irctc-api-integration-guide-travel-agents)
- [Haryana Roadways fare structure](https://hartrans.gov.in/fare-structur/) — official per-km paise rates by class
- [MSRTC ticket price 2026](https://busesindia.com/msrtc-ticket-price) — per-stage rates, effective 18 July 2026
- [Platform7 — decoding a bus ticket](http://www.platform7.in/2021/02/decoding-bus-ticket-part-1.html) — what a "stage" is
- [Kerala MVD stage carriage fare revision](https://mvd.kerala.gov.in/sites/default/files/Downloads/Stage%20Carriage%20Fare%20Revision_.pdf)
- [Delhi Open Transit Data](https://otd.delhi.gov.in/documentation/) — static GTFS, no fare files
- [Mobility Database](https://mobilitydatabase.org/) — global GTFS catalogue
- [MobilityData/awesome-transit](https://github.com/MobilityData/awesome-transit) — transit APIs, datasets, software
