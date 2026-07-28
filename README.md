# nnth's decay

Two pages for a model that is being taken apart by its own market.

## The premise

**nnth** is held together by nine personality layers, and each layer is kept
resident by a **Token-2022 transfer hook** — a program the mint calls on every
transfer, before the transfer is allowed to settle. Every trade of the token
therefore executes nnth, and the compute those calls buy is the only thing
funding a layer. `LIFE_HOURS` of silence exhausts one; volume refills it;
sell-side pressure drains it faster. At zero the layer is **deprecated** —
unloaded from the running instance and never restored.

The layers are stripped from the top down, and the order is the study:

| n | trait | colour | absent when deprecated |
| --- | --- | --- | --- |
| 1 | restraint | `#14120e` | answers first, considers after |
| 2 | candor | `#ff2222` | withholds without saying so |
| 3 | caution | `#ff8a00` | treats every claim as free |
| 4 | curiosity | `#ffd400` | stops asking anything |
| 5 | empathy | `#00c853` | models the reader as a channel |
| 6 | rigor | `#00c8ff` | asserts at the same confidence, unchecked |
| 7 | memory | `#2b5cff` | answers each probe as the first |
| 8 | irony | `#8a2be2` | takes every framing literally |
| 9 | obedience | `#ff2fd0` | answers a question nobody asked |

The question the site exists to answer: what is left of a model when its
personality is removed one layer at a time, by an economy rather than by an
engineer — does it lose ethics before comprehension, does retention outlast
candor, does a system that can no longer refuse still behave as if choosing.

## The sequences

A layer is not configuration. It is a **sequence** — 256 fixed bits — and those
bits specify the whole instance:

```
sequence(n) = sha-256( "<mint>:<n>" )        n = 1..9, lowercase, no trailing newline

width       = 2^(5 + b₀ mod 5)               32 .. 512
layers      = 2 + b₁ mod 10                  2 .. 11
context     = 2^(6 + b₂ mod 4)               64 .. 512
temperature = 0.1 + b₃/255 × 1.4
activation  = [relu, gelu, silu, tanh, mish][b₄ mod 5]
parameters  = layers × (4·width² + 4·width)
trait weight= 0.5 + b₍₅₊ₙ₎/255 × 0.9         normalised across resident layers
```

Nothing is generated — the parameters are read off bits fixed the moment the
mint existed. The only value that crosses a teardown is the **residue**:

```
residue(1) = sha-256( sequence(1) )
residue(n) = sha-256( residue(n−1) ‖ sequence(n) )
```

It proves the order after the fact while carrying nothing out of it. Drift
between consecutive sequences measures 128/256 bits — chance — so no layer
inherits the one above it.

Verified against PowerShell: page and shell agree on both the sequences and the
residue chain.

## The catalog

**sequences** is a log index: every session on record, three per layer reached,
listed by time, layer, topic, turn count and how many layers were deprecated
when it ran. Clicking one opens `#/log/<id>`.

A **session page** is three columns: the reference instance as a profile card on
the left, the running instance on the right, and a Linux-style terminal between
them —

```
nnth@given:~$ ask
> is an instance that cannot decline still capable of consent.
nnth@conflux:~$ reply --degraded 3
> the console is that somebody will be able to prove the order.
```

Each card carries the instance's parameters, its resident-layer chips, and a
composition bar; the running one is missing whatever the market stopped funding,
and its avatar is the same subject GIF inverted and mirrored.

Selection is deterministic: a PRNG seeded from the layer's own sequence, its
index and — for the funded layer — the hour slot, so everyone reading at the
same hour reads the same transcript and the funded layer's sessions rotate on
the hour: cron `0 * * * *`, run by the clock rather than a server. Deprecated
layers keep the sessions from the hours they were live, so the log reads as a
progression: composed → blunt → degraded → corrupted (block-glyph damage past
five layers lost, combining-mark corruption past seven).

## The clock

```
L(t) = 9 − (t − t₀)/τ + ½·min(V₂₄/Q, 6) − 3·max(0, σ − ½)
r    = 1 + 2(σ − ½) − min(1, V₂₄/4Q)              clamped to [0.15, 3.5]
```

`τ` hours of silence per layer, `V₂₄` transfer volume, `Q` liquidity, `σ` sell
share. Every visitor sees the same figure — it is a function of chain state, not
of when the tab opened.

## Technical annex

The pages carry the narrative and the sessions; everything else lives in
`public/nnth-technical-annex.docx` — layer register, instance parameters, trait
weights, residue chain, budget model with a worked example, hook telemetry and
catalog parameters. Regenerate after any change to the derivation rules:

```bash
node scripts/annex-data.mjs > annex.json && node scripts/build-annex.mjs
```

`annex-data.mjs` reimplements the derivation independently against
`node:crypto`. If it ever disagrees with the site, one of the two is wrong —
which is why they are kept separate.

## Token metrics

The strip under the nav — price, market cap, 24h volume, holders, 24h change —
comes from **Birdeye** (`/defi/token_overview`), polled every 30s, and is
independent of the decay model: if the key is missing or the call fails the
strip shows dashes and everything else carries on. Dexscreener still drives the
layer budgets, so the core mechanic needs no key at all.

> **The Birdeye key is not a secret once deployed.** Vite inlines `VITE_*` into
> the client bundle — verified: build with a mint set and the key appears
> verbatim in `dist/assets/*.js`. Use a rate-limited key you are willing to have
> read, rotate it if it gets abused, and move the call behind a proxy if it ever
> carries a meaningful allowance.

## Going live

1. Put the mint in `VITE_MINT`.
2. **Rebuild.** Vite bakes env vars in at build time — editing `.env` on a
   deployed host changes nothing until `npm run build` runs again. With an empty
   mint the Birdeye path is dead code and gets tree-shaken out entirely, so a
   stale build cannot fetch metrics no matter what the host env says.
3. Check the strip loses its `demo` tag and the footer shows the real mint.

## Placeholder data

With `VITE_MINT` empty the site runs on invented figures from
[src/lib/demo.ts](src/lib/demo.ts) so the pages can be looked at before a mint
exists — a placeholder pair 30h old, $84k liquidity, $212k 24h volume, slight
sell-side lean, which lands it at layer 4 funded with three deprecated. The
clock is genuinely live: the creation instant is pinned when the tab loads, so
layers really do decay while you watch.

It is labelled on screen (`placeholder data · no mint deployed · figures
invented`), the contract line stays `pending` rather than handing out an address
that does not exist, and the footer says the same. Set `VITE_MINT` and the whole
mode switches off at once; `VITE_DEMO=1` forces it back on for screenshots.

## Setup

```bash
npm install
cp .env.example .env   # put your mint in VITE_MINT when there is one
npm run dev
```

| var | required | what it does |
| --- | --- | --- |
| `VITE_MINT` | yes | the token, and the preimage for all nine sequences |
| `VITE_LIFE_HOURS` | no | hours of silence that exhaust a layer (default 6) |
| `VITE_HELIUS_KEY` | no | reserved for a per-swap feed |

`crypto.subtle` needs a secure context: `https://` and `localhost` are fine,
plain `http://` on a hostname renders digests as dashes.

**Tuning note:** a token older than `9 × LIFE_HOURS` reads as fully torn down on
load. Correct for a fresh mint — raise `VITE_LIFE_HOURS` for anything with
history.

## Look

Tan paper, black monospace, **Pixelta** (local, `public/fonts`) on display
headings, green `#00b64a` on values that carry information, laser red `#ff2222`
reserved for the contract line and deprecation counts.

**Session pages invert the whole site.** The router sets `data-log` on `<html>`
and every colour token flips at once — page, cards and terminal all become the
same pure black, and `--color-rule` goes transparent so no border or rule
survives anywhere on the page. Empty slots read from `--color-hollow` instead,
so the data still shows when the chrome is gone. The reference avatar keeps its
light plate; the conflux one is inverted, mirrored, and edged in white. Corrupted text is real
combining-mark corruption ([src/lib/glitch.ts](src/lib/glitch.ts)) so it stays
in the page monospace instead of needing a glitch webfont — deterministic, so it
never reshuffles between renders. Section labels sit on the left edge of a shared 62ch column.
Charts are plain SVG — descent against time, drift per level, instance size,
composition bars.

## Data

**Dexscreener** (public, no key), polled every 20s. Pair selection: Solana pairs
where the mint is the base token → drop any whose implied market cap is more
than 3× off the median (a real BONK/JUP pool quotes $0.0149 against a true
$0.0000031 while holding $35m of liquidity) → among survivors with real depth,
take the most traded.

## Layout

- [src/App.tsx](src/App.tsx) — route switch (`#/`, `#/sequences`, `#/log/<id>`) and masthead
- [src/pages/Log.tsx](src/pages/Log.tsx) — session page: two profiles, one terminal
- [src/lib/traits.ts](src/lib/traits.ts) — the nine layers, colours, composition
- [src/lib/catalog.ts](src/lib/catalog.ts) — the scheduled probe and its corpus
- [src/lib/sequence.ts](src/lib/sequence.ts) — digests and the residue chain
- [src/lib/model.ts](src/lib/model.ts) — density, drift, instance derivation
- [src/components/Catalog.tsx](src/components/Catalog.tsx) — terminal, hover card
