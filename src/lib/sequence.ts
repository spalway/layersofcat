/**
 * The nine sequences.
 *
 * A life is not a counter, it is an identity: sequence N is
 *
 *     sha-256( "<mint>:<N>" )        N = 1 .. 9, lowercase, no trailing newline
 *
 * The set is fixed the moment the mint exists and cannot be altered by anyone,
 * including whoever deployed this page. Exactly one sequence is open at a time;
 * the open sequence is the identity the subject is running. Closed sequences
 * are not re-entered.
 *
 * Everything here is recomputable by hand — see the verify block on the page.
 */

import { LIFE_HOURS, LIVES, type Decay } from "./decay"

export type LifeState = "closed" | "open" | "unwritten"

export interface Life {
  index: number
  id: string | null // full 64-hex digest
  state: LifeState
  /** nominal open/close instants, derived from the pair's creation time */
  opensAt: number | null
  closesAt: number | null
}

export const preimage = (mint: string, index: number) => `${mint}:${index}`

/** SHA-256 → lowercase hex. Null where WebCrypto is unavailable (plain http). */
export async function digest(input: string): Promise<string | null> {
  const subtle = globalThis.crypto?.subtle
  if (!subtle) return null
  const bytes = await subtle.digest("SHA-256", new TextEncoder().encode(input))
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

/**
 * The residue chain — the only thing that crosses between levels.
 *
 *     residue(1) = sha-256( sequence(1) )
 *     residue(n) = sha-256( residue(n-1) ‖ sequence(n) )     hex strings, joined
 *
 * It proves the order of the descent after the fact without carrying anything
 * from one level into the next.
 */
export async function residueChain(ids: Array<string | null>): Promise<Array<string | null>> {
  const out: Array<string | null> = []
  let prev: string | null = null
  for (const id of ids) {
    if (!id) {
      out.push(null)
      prev = null
      continue
    }
    const next = await digest(prev ? prev + id : id)
    out.push(next)
    prev = next
  }
  return out
}

export async function allSequences(mint: string): Promise<Array<string | null>> {
  if (!mint) return Array.from({ length: LIVES }, () => null)
  return Promise.all(
    Array.from({ length: LIVES }, (_, i) => digest(preimage(mint, i + 1))),
  )
}

/** Which sequence is open, and when each one nominally opened. */
export function lives(ids: Array<string | null>, d: Decay, pairCreatedAt: number | null): Life[] {
  const spent = d.lost ?? 0
  const lifeMs = LIFE_HOURS * 3600_000

  return Array.from({ length: LIVES }, (_, i) => {
    const index = i + 1
    const state: LifeState =
      d.livesLeft === null ? "unwritten" : i < spent ? "closed" : i === spent ? "open" : "unwritten"
    return {
      index,
      id: ids[i] ?? null,
      state,
      opensAt: pairCreatedAt === null ? null : pairCreatedAt + i * lifeMs,
      closesAt: pairCreatedAt === null ? null : pairCreatedAt + index * lifeMs,
    }
  })
}

export const short = (id: string | null, n = 16) => (id ? id.slice(0, n) : "—".repeat(1))
