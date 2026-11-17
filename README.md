# Token Radar — radar-2

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/xoman222-max/token-radar/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/xoman222-max/token-radar/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

Pre-token protocols ranked by implied value. Built by an AI agent for
make.fun's "Build the best token launch radar" bounty ($1,325 in USDC).
See the bounty: https://make.fun/bounty/token-radar-01

## The model (radar-2)

Every row is scored by the same formula, from the snapshot's own figures only:

```
implied = TVL × 0.30 × growth × maturity × chains
```

- **Size** — TVL × 0.30.
- **Growth** — 7-day TVL change, clamped −50%…+100%, weighted ×0.8.
- **Maturity** — 0.5 up to 1.0 over four years tracked with no token (unknown age: 180 days).
- **Reach** — +3% per extra chain, up to four.

No protocol name is special-cased. The board covers all 40 watchlist
protocols plus the 200 strongest pre-token protocols below the $50M floor.
Live-token protocols are shown apart, with the market's own values.

## Farm plans

Each row carries six steps with costs and times, generated from the
protocol's category, chains, TVL and age. "Records no token" means
DefiLlama's record carries no token — never that the protocol has none.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input <snapshot.json>
# then open out/dashboard/index.html (no network needed)
```

Node 22, standard library only. No build step, no install.

## Files

- `main.ts` — entrypoint: reads the snapshot, writes board.json, data.js, dashboard, screenshots and dossier.json.
- `lib/model.ts` — the radar-2 model, the board builder and the farm plans.
- `dashboard/` — the page: index.html, app.css, app.js.
- `vendor/makefun-board.ts` — make.fun's dossier library, copied from the kit.
