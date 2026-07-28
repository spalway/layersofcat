/**
 * The nine lives.
 *
 * Every visitor sees the same number, because the number is a pure function of
 * public on-chain facts — not of when you opened the tab:
 *
 *   lives = 9 - age/LIFE_HOURS + activity_credit - outflow_penalty
 *
 * Age burns lives at a fixed nominal rate. Turnover (24h volume against
 * liquidity) buys them back. Sell-side dominance takes them faster. Nothing
 * here is random and nothing is stored client-side.
 */

import type { Snapshot } from "./chain"

export const LIVES = 9
/**
 * Hours of silence that cost one life. 9 × 6h ≈ 54h of total nominal lifespan,
 * which is the right order for a fresh mint. Tune with VITE_LIFE_HOURS —
 * a token older than LIVES × LIFE_HOURS reads as EXPIRED on arrival.
 */
const envHours = Number.parseFloat(String(import.meta.env.VITE_LIFE_HOURS ?? ""))
export const LIFE_HOURS = Number.isFinite(envHours) && envHours > 0 ? envHours : 6
const LIFE_MS = LIFE_HOURS * 3600_000

export type Status = "AWAITING SIGNAL" | "ALIVE" | "CRITICAL" | "EXPIRED"

export interface Decay {
  status: Status
  livesLeft: number | null // continuous, 0..9
  lost: number | null // whole lives already gone
  rate: number | null // × nominal decay
  msToNextLife: number | null
  msRemaining: number | null
  pressure: number | null // sell share of trades, 0..1
  pressureWindow: "1h" | "24h" | null
  turnover: number | null // 24h volume / liquidity
  credit: number | null
  penalty: number | null
  burned: number | null // lives taken by age alone
  ageMs: number | null
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

export function computeDecay(s: Snapshot | null, now = Date.now()): Decay {
  if (!s || s.pairCreatedAt === null) {
    return {
      status: "AWAITING SIGNAL",
      livesLeft: null, lost: null, rate: null, msToNextLife: null,
      msRemaining: null, pressure: null, pressureWindow: null, turnover: null,
      credit: null, penalty: null, burned: null, ageMs: null,
    }
  }

  const ageMs = Math.max(0, now - s.pairCreatedAt)
  const burned = ageMs / LIFE_MS

  const liq = s.liquidityUsd ?? 0
  const turnover = liq > 0 ? s.volume.h24 / liq : 0
  const credit = clamp(turnover, 0, 6) * 0.5 // up to 3 lives bought back

  const hasHour = s.txns.h1.buys + s.txns.h1.sells > 0
  const flow = hasHour ? s.txns.h1 : s.txns.h24
  const total = flow.buys + flow.sells
  const pressure = total > 0 ? flow.sells / total : 0.5
  const penalty = Math.max(0, (pressure - 0.5) * 2) * 1.5 // up to 1.5 lives

  const livesLeft = clamp(LIVES - burned + credit - penalty, 0, LIVES)
  const rate = clamp(1 + (pressure - 0.5) * 2 - Math.min(1, turnover / 4), 0.15, 3.5)

  const msPerLife = LIFE_MS / rate
  const fraction = livesLeft - Math.floor(livesLeft)
  const msToNextLife = livesLeft <= 0 ? 0 : fraction * msPerLife
  const msRemaining = livesLeft * msPerLife

  const status: Status =
    livesLeft <= 0 ? "EXPIRED" : livesLeft < 2 ? "CRITICAL" : "ALIVE"

  return {
    status,
    livesLeft,
    lost: LIVES - Math.ceil(livesLeft),
    rate,
    msToNextLife,
    msRemaining,
    pressure,
    pressureWindow: hasHour ? "1h" : "24h",
    turnover,
    credit,
    penalty,
    burned,
    ageMs,
  }
}

/** One word for what the chain is doing to it right now. */
export function condition(d: Decay, s: Snapshot | null): string {
  if (!s || d.livesLeft === null) return "unobserved"
  if (d.livesLeft < 2) return "fading"
  if ((d.pressure ?? 0) > 0.62) return "bleeding out"
  const recent = s.txns.m5.buys + s.txns.m5.sells
  if (recent >= 12) return "watched"
  if (recent === 0) return "still"
  return "holding"
}

/* ------------------------------ formatting ------------------------------- */

export const clock = (ms: number | null): string => {
  if (ms === null || !Number.isFinite(ms)) return "--:--:--"
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
}

export const usd = (n: number | null): string => {
  if (n === null) return "—"
  if (n >= 1_000_000_000_000) return `$${(n / 1_000_000_000_000).toFixed(2)}t`
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}b`
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}m`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`
  if (n >= 1) return `$${n.toFixed(2)}`
  return `$${n.toPrecision(3)}`
}

export const pct = (n: number | null): string => (n === null ? "—" : `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`)

export const dur = (ms: number | null): string => {
  if (ms === null) return "—"
  const h = ms / 3600_000
  if (h < 48) return `${h.toFixed(1)}h`
  return `${(h / 24).toFixed(1)}d`
}
