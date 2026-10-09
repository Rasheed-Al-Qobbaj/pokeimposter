# PokeImposter

Read `PLAN.md` first. Do one gate, verify it, commit, push, and update the status table in `PLAN.md`.

- One gate per session. A gate is done only when its "Done when" check passes and you've shown proof (test output, browser screenshots).
- The deal must be deterministic: same link + same round → same result on every phone. Use no `Math.random` in the deal and no random-comparator sorts.
- PokeAPI is called only by `scripts/build-data.mjs`, never at runtime.
- No backend and no secrets. Everything ships as static files.
- English UI for v1.
