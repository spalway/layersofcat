/**
 * On-chain signal. Nothing on this page is invented — if a number is not in a
 * response it stays null and the UI renders a dash.
 *
 * Primary source is Dexscreener (public, no key, CORS-open): price, liquidity,
 * volume and buy/sell counts per window, plus pair creation time.
 * With VITE_HELIUS_KEY set, individual swaps are listed on the wire as well.
 */

import { HELIUS_KEY } from "./site"

export interface Flow {
  buys: number
  sells: number
}

export interface Windows<T> {
  m5: T
  h1: T
  h6: T
  h24: T
}

export interface Snapshot {
  mint: string
  symbol: string | null
  name: string | null
  priceUsd: number | null
  marketCap: number | null
  liquidityUsd: number | null
  volume: Windows<number>
  txns: Windows<Flow>
  priceChange: Windows<number>
  pairCreatedAt: number | null
  dexUrl: string | null
  fetchedAt: number
}

export interface ChainEvent {
  id: string
  ts: number
  kind: "BUY" | "SELL" | "FLOW"
  detail: string
  sig?: string
}

const num = (v: unknown): number | null => {
  const n = typeof v === "string" ? Number.parseFloat(v) : typeof v === "number" ? v : NaN
  return Number.isFinite(n) ? n : null
}
const zeroFlow = (): Flow => ({ buys: 0, sells: 0 })

/** Dexscreener token endpoint; picks the deepest pair for the mint. */
export async function fetchSnapshot(mint: string, signal?: AbortSignal): Promise<Snapshot> {
  const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`, { signal })
  if (!res.ok) throw new Error(`dexscreener ${res.status}`)
  const json = (await res.json()) as { pairs?: unknown[] }
  const all = Array.isArray(json.pairs) ? (json.pairs as Record<string, any>[]) : []
  // Solana only, and only pairs where our mint is the base token — otherwise
  // price and flow describe the quote asset or a bridged copy on another chain.
  const pairs = all.filter(
    (p) =>
      String(p?.chainId ?? "") === "solana" &&
      String(p?.baseToken?.address ?? "").toLowerCase() === mint.toLowerCase(),
  )
  if (!pairs.length) throw new Error("no pairs indexed for this mint yet")

  const liq = (p: Record<string, any>) => num(p?.liquidity?.usd) ?? 0
  const vol = (p: Record<string, any>) => num(p?.volume?.h24) ?? 0
  const cap = (p: Record<string, any>) => num(p?.marketCap) ?? num(p?.fdv)

  // Individual pools lie. A stale or exotic pair can report a price orders of
  // magnitude off (a real BONK/JUP pool quotes $0.0149 against a true
  // $0.0000031) while carrying deep liquidity, so trust the consensus: throw
  // out any pair whose implied market cap is far from the median.
  const caps = pairs
    .map(cap)
    .filter((v): v is number => v !== null && v > 0)
    .sort((a, b) => a - b)
  const median = caps.length ? caps[Math.floor(caps.length / 2)]! : null
  const sane = median
    ? pairs.filter((p) => {
        const v = cap(p)
        return v === null || (v >= median / 3 && v <= median * 3)
      })
    : pairs
  const agreed = sane.length ? sane : pairs

  // Then the pool people actually trade, among those deep enough to be real:
  // by liquidity alone you find a deep dead pool, by volume alone a dust pool
  // with faked volume.
  const deepest = Math.max(...agreed.map(liq))
  const viable = agreed.filter((p) => liq(p) >= Math.max(1_000, deepest * 0.05))
  const pool = viable.length ? viable : agreed

  const pair = pool.reduce((best, p) =>
    vol(p) !== vol(best) ? (vol(p) > vol(best) ? p : best) : liq(p) > liq(best) ? p : best,
  )

  const win = <T,>(src: any, read: (v: any) => T, fallback: T): Windows<T> => ({
    m5: src?.m5 !== undefined ? read(src.m5) : fallback,
    h1: src?.h1 !== undefined ? read(src.h1) : fallback,
    h6: src?.h6 !== undefined ? read(src.h6) : fallback,
    h24: src?.h24 !== undefined ? read(src.h24) : fallback,
  })

  return {
    mint,
    symbol: pair?.baseToken?.symbol ?? null,
    name: pair?.baseToken?.name ?? null,
    priceUsd: num(pair?.priceUsd),
    marketCap: num(pair?.marketCap) ?? num(pair?.fdv),
    liquidityUsd: num(pair?.liquidity?.usd),
    volume: win(pair?.volume, (v) => num(v) ?? 0, 0),
    txns: win(
      pair?.txns,
      (v) => ({ buys: num(v?.buys) ?? 0, sells: num(v?.sells) ?? 0 }),
      zeroFlow(),
    ),
    priceChange: win(pair?.priceChange, (v) => num(v) ?? 0, 0),
    pairCreatedAt: num(pair?.pairCreatedAt),
    dexUrl: typeof pair?.url === "string" ? pair.url : null,
    fetchedAt: Date.now(),
  }
}

/** Optional per-swap wire. Returns [] when no key is configured. */
export async function fetchSwaps(mint: string, signal?: AbortSignal): Promise<ChainEvent[]> {
  if (!HELIUS_KEY || !mint) return []
  const url =
    `https://api.helius.xyz/v0/addresses/${mint}/transactions` +
    `?api-key=${HELIUS_KEY}&limit=20&type=SWAP`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`helius ${res.status}`)
  const txs = (await res.json()) as Record<string, any>[]
  if (!Array.isArray(txs)) return []

  return txs.flatMap((tx): ChainEvent[] => {
    const swap = tx?.events?.swap
    if (!swap) return []
    const solIn = num(swap?.nativeInput?.amount)
    const solOut = num(swap?.nativeOutput?.amount)
    const lamports = solIn ?? solOut ?? null
    if (lamports === null) return []
    const sol = lamports / 1e9
    const kind: ChainEvent["kind"] = solIn !== null ? "BUY" : "SELL"
    return [
      {
        id: String(tx.signature),
        ts: (num(tx.timestamp) ?? 0) * 1000,
        kind,
        detail: `${sol.toFixed(3)} SOL`,
        sig: String(tx.signature).slice(0, 8),
      },
    ]
  })
}

/**
 * When there is no Helius key we still report real activity: the change in
 * Dexscreener's 5-minute buy/sell counts between polls. Aggregate, but true.
 */
export function flowDelta(prev: Snapshot | null, next: Snapshot): ChainEvent | null {
  if (!prev) return null
  const b = next.txns.m5.buys - prev.txns.m5.buys
  const s = next.txns.m5.sells - prev.txns.m5.sells
  if (b <= 0 && s <= 0) return null
  return {
    id: `flow-${next.fetchedAt}`,
    ts: next.fetchedAt,
    kind: "FLOW",
    detail: `${b > 0 ? `+${b} buy${b === 1 ? "" : "s"}` : ""}${b > 0 && s > 0 ? " / " : ""}${
      s > 0 ? `${s} sell${s === 1 ? "" : "s"}` : ""
    }`,
  }
}
