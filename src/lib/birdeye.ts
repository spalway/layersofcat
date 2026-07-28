/**
 * Token metrics — price, market cap, 24h volume, holders — from Birdeye.
 *
 * This runs in the browser, so VITE_BIRDEYE_KEY ships inside the bundle and is
 * readable by anyone who opens devtools. Treat it as a public key: keep it
 * rate-limited and rotatable, and put it behind a proxy if it ever gets an
 * allowance worth stealing.
 *
 * The decay model does not depend on this. If the key is missing or the request
 * fails, the strip renders dashes and everything else carries on.
 */

const BASE = "https://public-api.birdeye.so"

export const BIRDEYE_KEY =
  (import.meta.env.VITE_BIRDEYE_KEY as string | undefined)?.trim() || ""

export interface TokenMetrics {
  priceUsd: number | null
  priceChange24h: number | null
  marketCap: number | null
  volume24h: number | null
  holders: number | null
  fetchedAt: number
}

const num = (v: unknown): number | null => {
  const n = typeof v === "string" ? Number.parseFloat(v) : typeof v === "number" ? v : NaN
  return Number.isFinite(n) ? n : null
}

/** First field present wins — Birdeye has renamed several of these over time. */
const pick = (src: Record<string, unknown>, keys: string[]): number | null => {
  for (const k of keys) {
    const v = num(src?.[k])
    if (v !== null) return v
  }
  return null
}

export async function fetchMetrics(mint: string, signal?: AbortSignal): Promise<TokenMetrics> {
  if (!BIRDEYE_KEY) throw new Error("no birdeye key")
  if (!mint) throw new Error("no mint")

  const res = await fetch(`${BASE}/defi/token_overview?address=${mint}`, {
    signal,
    headers: {
      accept: "application/json",
      "x-chain": "solana",
      "X-API-KEY": BIRDEYE_KEY,
    },
  })
  if (!res.ok) throw new Error(`birdeye ${res.status}`)

  const json = (await res.json()) as { success?: boolean; data?: Record<string, unknown> }
  const d = json?.data
  if (!d) throw new Error("birdeye returned no data")

  return {
    priceUsd: pick(d, ["price"]),
    priceChange24h: pick(d, ["priceChange24hPercent", "v24hChangePercent"]),
    marketCap: pick(d, ["marketCap", "mc", "realMc"]),
    volume24h: pick(d, ["v24hUSD", "volume24hUSD", "v24h"]),
    holders: pick(d, ["holder", "holders", "uniqueHolder"]),
    fetchedAt: Date.now(),
  }
}
