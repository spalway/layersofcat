/**
 * Corruption by combining marks — the copy-paste kind, so it stays in the page
 * monospace instead of needing a display face. Deterministic: the same string
 * and seed always corrupt the same way, so nothing shifts between renders.
 */

const ABOVE = ["̀", "́", "̂", "̃", "̈", "̊", "̑", "͂", "͆"]
const BELOW = ["̖", "̗", "̣", "̥", "̩", "̭", "̱", "͇"]
const THROUGH = ["̴", "̵", "̶", "̸"]

function rng(seed: number) {
  let a = seed >>> 0 || 1
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const hash = (s: string): number => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * @param intensity 0 = untouched, 1 = a mark or two per character, 3 = illegible
 */
export function corrupt(text: string, intensity = 1, salt = 0): string {
  if (intensity <= 0) return text
  const r = rng(hash(text) ^ (salt * 2654435761))
  let out = ""

  for (const ch of text) {
    out += ch
    if (ch === " ") continue
    const marks = Math.floor(r() * intensity * 2)
    for (let i = 0; i < marks; i++) {
      const roll = r()
      const bank = roll < 0.45 ? ABOVE : roll < 0.85 ? BELOW : THROUGH
      out += bank[Math.floor(r() * bank.length)]!
    }
  }
  return out
}
