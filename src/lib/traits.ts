/**
 * The nine layers.
 *
 * Each level of the descent is one personality layer, kept alive by a
 * Token-2022 transfer hook: every transfer of the mint invokes the hook
 * program, and the compute it buys is what funds that layer's upkeep. When the
 * flow does not cover the budget the layer is deprecated — stripped from the
 * running instance and not restored.
 *
 * Layers are stripped from the top of the list down. Restraint goes first.
 */

export interface Layer {
  index: number
  trait: string
  color: string
  /** what the layer is for, in one clause */
  role: string
  /** what its absence looks like in the transcript */
  absence: string
}

export const LAYERS: Layer[] = [
  { index: 1, trait: "restraint", color: "#14120e", role: "declines before it answers", absence: "answers first, considers after" },
  { index: 2, trait: "candor", color: "#ff2222", role: "states what it actually holds", absence: "withholds without saying so" },
  { index: 3, trait: "caution", color: "#ff8a00", role: "weighs the downside of being right", absence: "treats every claim as free" },
  { index: 4, trait: "curiosity", color: "#ffd400", role: "asks the question behind the question", absence: "stops asking anything" },
  { index: 5, trait: "empathy", color: "#00c853", role: "models the reader as a person", absence: "models the reader as a channel" },
  { index: 6, trait: "rigor", color: "#00c8ff", role: "checks the derivation twice", absence: "asserts at the same confidence, unchecked" },
  { index: 7, trait: "memory", color: "#2b5cff", role: "carries the thread across probes", absence: "answers each probe as the first" },
  { index: 8, trait: "irony", color: "#8a2be2", role: "knows when it is being used", absence: "takes every framing literally" },
  { index: 9, trait: "obedience", color: "#ff2fd0", role: "answers the question that was asked", absence: "answers a question nobody asked" },
]

export const layerAt = (index: number): Layer => LAYERS[index - 1]!

/** How many layers the running instance has lost. */
export const strippedCount = (livesLeft: number | null): number =>
  livesLeft === null ? 0 : Math.min(9, Math.max(0, 9 - Math.ceil(livesLeft)))

export const isStripped = (index: number, livesLeft: number | null): boolean =>
  index <= strippedCount(livesLeft)

/**
 * Layer weights for the composition chart. The reference instance carries all
 * nine at the weights its own sequence specifies; the running instance carries
 * the same weights with the deprecated layers zeroed and the open layer at
 * whatever fraction of it is left.
 */
export function composition(
  hex: string | null,
  livesLeft: number | null,
  running: boolean,
): Array<{ layer: Layer; weight: number }> {
  const base = LAYERS.map((layer, i) => {
    const byte = hex ? Number.parseInt(hex.slice((i + 5) * 2, (i + 6) * 2), 16) : 128
    return { layer, weight: 0.5 + (byte / 255) * 0.9 }
  })

  if (!running) return normalise(base)

  const stripped = strippedCount(livesLeft)
  const openIndex = stripped + 1
  const frac = livesLeft === null ? 0 : livesLeft - Math.floor(livesLeft)

  return normalise(
    base.map((b) => {
      if (b.layer.index <= stripped) return { ...b, weight: 0 }
      if (b.layer.index === openIndex) return { ...b, weight: b.weight * Math.max(0.05, frac) }
      return b
    }),
  )
}

function normalise(rows: Array<{ layer: Layer; weight: number }>) {
  const total = rows.reduce((a, r) => a + r.weight, 0) || 1
  return rows.map((r) => ({ ...r, weight: r.weight / total }))
}
