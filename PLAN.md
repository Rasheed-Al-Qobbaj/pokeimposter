# PokeImposter — PLAN

A free, fast Pokémon imposter game for Rasheed, Hassan and Arafat. Everyone except the imposter(s) gets the same secret card (a Pokémon, Move, Ability or Item). Players take turns saying one related word, then vote out loud.

## Status
| # | Gate | Status | Date |
|---|---|---|---|
| 0 | Re-verify moving facts, scaffold repo, PLAN.md + CLAUDE.md | ✅ done | 2026-10-10 |
| 1 | Data build script → bundled JSON | ✅ done: 1,025 / 847 / 313 / 404 cards, 26.9 KB gzip | 2026-10-10 |
| 2 | Deterministic engine + Vitest | ✅ done: 15 tests pass | 2026-10-10 |
| 3 | Mobile UI, verified in browser (3 tabs = 3 players) | ✅ done: same deal through round 5 and after a refresh | 2026-10-10 |
| 4 | Deploy to Vercel, real-phone test | 🟡 live at https://pokeimposter.vercel.app; real 3-phone test still to do | 2026-10-10 |
| 5 | Team Rocket Spy mode (Sneaky + Sloppy disguises) | ✅ done, built with Gates 2–3 | 2026-10-10 |

All gates ran in one session at Rasheed's request (2026-10-10). Repo: https://github.com/Rasheed-Al-Qobbaj/pokeimposter (public). Pushes to `main` auto-deploy on Vercel.

**Next ideas (not planned yet):** Arabic UI, pass-and-play on one phone, score tracking, avoiding repeat cards across rounds.

## How it works
1. **Same game on every phone, with no server.** The host's link holds the game settings and a random *seed*. Every phone runs the same code with the same seed, so each one deals the same round: same card, same imposter, same turn order. The app only deals secret cards, and talking and voting happen out loud. "Next round" means round N+1 from the same seed. The round number shows on screen so you can check out loud that you match.
2. **PokeAPI is called once, at build time, never during play.** A script fetches every name and saves it as JSON inside the app. The game loads instantly and never depends on PokeAPI being up, which also follows PokeAPI's fair use rule to cache locally. Images load from PokeAPI's sprite CDN by ID.

**Cost:** $0/month (₪0). Static hosting on Vercel Hobby, no backend, no database, no API keys.

## Verified facts
| Fact | Value | Source | Checked |
|---|---|---|---|
| PokeAPI counts | 1,025 species · 937 moves · 374 abilities · 2,223 items | `https://pokeapi.co/api/v2/<x>?limit=1` | 2026-10-10 |
| PokeAPI CORS / auth | `Access-Control-Allow-Origin: *`, no key, rate limit removed | https://pokeapi.co/docs/v2#fairuse | 2026-10-10 |
| Fair use | asks you to cache resources locally | https://pokeapi.co/docs/v2#fairuse | 2026-10-10 |
| GraphQL endpoint | `https://graphql.pokeapi.co/v1beta2` (no `pokemon_v2_` prefix). Old `https://beta.pokeapi.co/graphql/v1beta` also works | live POST | 2026-10-10 |
| GraphQL: Pokémon | `pokemon(where:{is_default:{_eq:true}})` → `pokemon_species_id`, `pokemontypes{type{name}}`; names via `pokemonspecies{generation_id, pokemonspeciesnames(where:{language_id:{_eq:9}}){name}}` (en = 9) | live POST | 2026-10-10 |
| GraphQL: Moves | `move` → `generation_id`, `pp`, `type{name}`, `movenames`. Z-Moves: `pp = 1`, slug ends `--physical`/`--special`. Max moves: slug `max-*` / `g-max-*` | live POST | 2026-10-10 |
| GraphQL: Abilities | `ability` → `generation_id`, `is_main_series`, `abilitynames` | live POST | 2026-10-10 |
| GraphQL: Items | `item` → `itemcategory{name, itempocket{name}}`, `itemnames` (e.g. `standard-balls`, `healing`, `evolution`) | live POST | 2026-10-10 |
| Sprites | `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{id}.png` → 200, CORS * | live HEAD | 2026-10-10 |
| No Arabic names in PokeAPI | languages: ja, ko, zh, fr, de, es, it, en, cs, pt-br, es-419 | `/api/v2/language` | 2026-10-10 |
| Vercel Hobby | $0/mo, "for your web app or personal project" | https://vercel.com/pricing | 2026-10-10 |
| Local tools | Node 25.2.1, npm 11.6.2, git 2.45, `gh` as Rasheed-Al-Qobbaj, Vercel CLI 59.22.0 as rasheed-al-qobbaj | local | 2026-10-10 |

## Settled decisions
- **Play setup:** voice or in person, each player on their own phone. **English UI** for v1.
- **Modes (themed):** **Who's the Ditto?** (was "Classic") is the default. **Team Rocket Spy** (was "Undercover") has two disguises: **Sneaky**, where the decoy shares a type or item group, and **Sloppy**, where the decoy is any card from the same category (added at Rasheed's request).
- **Stack:** Vite + TypeScript with no framework, Vitest for engine tests, Vercel auto-deploying from GitHub.
- **Game link:** `https://pokeimposter.vercel.app/#<code>/<round>`, where `<code>` = base64url JSON `{v, dv, players[], imposters, categories[], gens[], mode, seed}`. It lives in the URL hash, which never reaches a server.
- **Data-version guard:** `dv` is a short hash of the bundled JSON. If it doesn't match, the phone shows "start a new game" instead of silently desyncing.
- **Determinism:** a seeded PRNG (mulberry32 seeded from a hash of `seed:round`) and Fisher–Yates shuffles only. Never use `Math.random` or `sort(() => rng() - .5)` in the deal.
- **Deal per round:** pick a category from the enabled ones → pick a card (filtered by generation) → pick k distinct imposters → shuffle the turn order. In Classic, the first speaker is never an imposter.
- **Ditto:** the imposter sees "You're the Ditto!" plus the category. **Team Rocket:** the spy gets a decoy and isn't told. Sneaky decoys are a Pokémon sharing a type, a Move of the same type, or an Item from the same group. Abilities have no look-alikes, so they fall back to any other ability. Multiple spies share one decoy.
- **Phone flow:** Setup (names, imposters 1..⌊(n−1)/2⌋, categories, generations, mode) → Share (Web Share API, with copy as fallback) → "Who's holding this phone?" → hold-to-peek card → Reveal → Next round.
- **Identity lives in the URL** (`#<code>/<round>/<me>`), not localStorage, so a refresh keeps you on your own card. The Share button always shares the link without `/<me>`. localStorage only remembers the host's last setup form.
- **Data filters:** Pokémon are default forms of each species only. Moves exclude Z-Moves and Max/G-Max moves. Abilities are `is_main_series` only. Items come from an allowlist of familiar categories (balls, healing, evolution, held items, berries). A hand-edited `src/data/blocklist.json` removes anything silly.
- **Out of scope for v1:** in-app voting, live rooms, Arabic UI, pass-and-play.

## Gates
| # | Gate | Done when |
|---|---|---|
| 0 | Re-verify facts and scaffold the repo | facts table dated; repo committed and pushed |
| 1 | `scripts/build-data.mjs` → `src/data/{pokemon,moves,abilities,items}.json` + `blocklist.json` | script prints counts; spot checks (Mr. Mime, Farfetch’d, no G-Max moves); gzip size < 50 KB |
| 2 | Engine `src/engine/{rng,code,deal}.ts` + `deal.test.ts` | Vitest: same code+round → identical deal; consistent for every player; imposter-count bounds; Classic first speaker ≠ imposter; 1,000-round distribution looks fair |
| 3 | UI `src/ui/{setup,pick,card,reveal}.ts`, `index.html`, `style.css`, mobile-first | built-in browser at 375 px, 3 tabs = 3 players: same card, one imposter, same order, Next round stays in sync, still correct after a refresh at round 5; screenshots as proof |
| 4 | Deploy to Vercel, real-phone test | the live URL works on 3 phones |
| 5 | Undercover mode: decoy picker + setup toggle + tests | the decoy always shares a type/category; tests pass; browser proof |
