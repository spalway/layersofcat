/**
 * Placeholder data.
 *
 * Active only while VITE_MINT is unset (or VITE_DEMO=1). It exists so the
 * pages can be looked at before a mint exists — every figure below is invented
 * and the site says so on screen. Set VITE_MINT and this module stops being
 * reachable; nothing else has to change.
 *
 * The one thing that is not frozen is the clock: the pair's creation instant is
 * pinned when the tab loads, so layers really do decay while you watch.
 */

import type { TokenMetrics } from "./birdeye"
import type { Snapshot } from "./chain"

/** Deliberately not a real mint, and deliberately obvious about it. */
export const DEMO_MINT = "DEMonnthP1aceho1derM1ntNotForTradeXXXXpump"

const AGE_HOURS = 30
const CREATED_AT = Date.now() - AGE_HOURS * 3600_000

/** The strip has to show something before the mint exists. */
export function demoMetrics(): TokenMetrics {
  return {
    priceUsd: 0.00004182,
    priceChange24h: 12.44,
    marketCap: 418_200,
    volume24h: 212_000,
    holders: 1_284,
    fetchedAt: Date.now(),
  }
}

export function demoSnapshot(now: number): Snapshot {
  return {
    mint: DEMO_MINT,
    symbol: "nnth",
    name: "nnth (placeholder)",
    priceUsd: 0.00004182,
    marketCap: 418_200,
    liquidityUsd: 84_200,
    volume: { m5: 1_840, h1: 19_400, h6: 96_500, h24: 212_000 },
    txns: {
      m5: { buys: 7, sells: 5 },
      h1: { buys: 96, sells: 118 },
      h6: { buys: 612, sells: 705 },
      h24: { buys: 2_418, sells: 2_602 },
    },
    priceChange: { m5: -0.42, h1: 1.83, h6: -3.21, h24: 12.44 },
    pairCreatedAt: CREATED_AT,
    dexUrl: null,
    fetchedAt: now,
  }
}
