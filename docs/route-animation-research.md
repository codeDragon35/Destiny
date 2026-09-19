# Route animation research

Research notes for animating travel between cities — a train, bus or plane that actually moves along
the route on the map. Collected 2026-09-19. This is a decision record, not a plan of record: nothing
here is built yet.

## The short version

`RouteMap` already draws the route itself, as an SVG `<polyline>` with its own lat/lng projection.
The moving vehicle needs **no new dependency** — CSS Motion Path animates an element along that same
geometry natively. Skip GSAP, skip Lottie, hand-draw the vehicles like the existing motifs.

## Moving a vehicle along the route

**Use CSS Motion Path.** Set `offset-path` to the route geometry, animate `offset-distance` from `0%`
to `100%`, and set `offset-rotate: auto` so the vehicle turns to face its direction of travel — without
it the train slides sideways through curves. Baseline across browsers since March 2022. Pure CSS, so
it costs nothing in bundle size and folds into the existing `prefers-reduced-motion` handling by
parking the vehicle at its endpoint.

**One gotcha before building**: `offset-path` needs a `path()` string, but `RouteMap` currently renders
`<polyline points=...>`. Same coordinates, different attribute. Either emit both, or switch to
`<path d=...>` — a polyline converts trivially (`M` then a run of `L`s).

**JS fallback, only if per-frame control is needed** (e.g. a vehicle that pauses at each city):
`getPointAtLength()` + `getTotalLength()`, sampling twice and taking `Math.atan2()` of the delta for the
angle. This is the classic D3 marker-along-path technique. Reach for it only after CSS hits a wall.

**Rejected — GSAP MotionPathPlugin.** Every tutorial recommends it, but it is ~50KB for something CSS
does natively, and GSAP is now Webflow-owned with licence restrictions that MIT-licensed Motion does
not carry.

## Globe

`globe.gl` (MIT, same author as the `react-globe.gl` already installed) ships arc animation that is
currently unused: `arcsData` with `arcDashLength` / `arcDashGap` / `arcDashAnimateTime` produces a
travelling dash along a great-circle arc — a flight path between two cities, essentially free.

A literal 3D plane model riding the arc would need `customLayerData` plus per-frame positioning; there
is no built-in path-following for objects. Recommendation: animated arcs on the globe, literal vehicles
only on the flat `RouteMap`, where they read better anyway.

**COBE** (MIT, ~5KB, zero deps) is worth knowing about but is **not** a replacement for the current
globe — it has no country-shape picking, which is the entire point of the home page.

## Vehicle artwork

LottieFiles' free transport animations (train, bus, plane) are under the Lottie Simple License:
commercial use, no attribution required. Two caveats — modifications must stay under the same licence,
and the runtime costs 60–100KB gzipped (`@lottiefiles/dotlottie-react` at ~100KB, not `lottie-react`
over `lottie-web` at ~500KB).

**Recommendation: do not use Lottie.** A hand-drawn SVG train/bus/plane matches the existing
`Motif.tsx` draw-in-then-loop convention, costs zero KB, and inherits the per-country accent colour. A
Lottie file is a fixed-palette blob that will fight the paper theme the way a full-saturation photo does.

## Suggested shape

Vehicle picked per leg — `train` / `bus` / `flight` — as an SVG symbol riding `offset-path` along the
route, with the mode driving both the icon and the line style: rail as a dashed track, flight as a
lifted arc rather than a straight polyline. This mirrors how `src/lib/event-tone.ts` already derives
presentation from what a thing *is*.

## Open question — blocking

**Transport mode is not in the schema.** `planTrip` does not suggest inter-city transport at all, so
there is currently nothing that says a given leg is a train rather than a flight. Before any of this
can be built, decide where the mode comes from:

- seeded per city-pair,
- a heuristic on distance, or
- a user choice at plan time.

## Sources

- [globe.gl](https://github.com/vasturiano/globe.gl) — arc dash animation properties, MIT
- [COBE](https://github.com/shuding/cobe) — 5KB WebGL globe, MIT
- [MDN: offset-path](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/offset-path)
- [MDN: CSS motion path](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Motion_path)
- [Can I Use: CSS Motion Path](https://caniuse.com/css-motion-paths) — baseline since March 2022
- [Codrops: Animate Anything Along an SVG Path](https://tympanus.net/codrops/2022/01/19/animate-anything-along-an-svg-path/)
- [D3 marker-along-path gist](https://gist.github.com/KoGor/8162640)
- [jeantimex/flight-path](https://github.com/jeantimex/flight-path) — Three.js flight arcs
- [tsott/flightpath](https://github.com/tsott/flightpath) — train/bus/plane SVG path animation
- [LottieFiles free transport animations](https://lottiefiles.com/free-animations/transport)
- [Lottie Simple License](https://lottiefiles.com/page/license)
- [react-simple-maps](https://github.com/zcreativelabs/react-simple-maps) — d3-geo/topojson SVG maps
