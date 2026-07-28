/**
 * Everything a sequence specifies.
 *
 * A sequence is 256 bits. Those bits are read two ways:
 *
 *   - as a measurement — density, and drift against the level above it
 *   - as an instance — the dimensions, seed, context, temperature and
 *     activation of the instance that level runs
 *
 * Both readings are deterministic and stated in full in the spec block, so the
 * page can be checked against a shell and a calculator. Nothing is generated
 * here; the sequence already contained it.
 */

export const bytesOf = (hex: string): number[] => {
  const out: number[] = []
  for (let i = 0; i + 1 < hex.length; i += 2) out.push(Number.parseInt(hex.slice(i, i + 2), 16))
  return out
}

const POP = Array.from({ length: 256 }, (_, i) => {
  let n = i
  let c = 0
  while (n) {
    c += n & 1
    n >>= 1
  }
  return c
})

/** Set bits out of 256. Chance sits at 128. */
export const density = (hex: string): number =>
  bytesOf(hex).reduce((a, b) => a + POP[b]!, 0)

/** Bits that differ between two levels. Chance also sits at 128. */
export const drift = (a: string, b: string): number => {
  const x = bytesOf(a)
  const y = bytesOf(b)
  let d = 0
  for (let i = 0; i < Math.min(x.length, y.length); i++) d += POP[x[i]! ^ y[i]!]!
  return d
}

export interface Instance {
  width: number
  layers: number
  ctx: number
  temp: string
  act: string
  seed: string
}

const ACT = ["relu", "gelu", "silu", "tanh", "mish"] as const

/** The instance a level runs, read straight off the first five bytes. */
export function instance(hex: string): Instance {
  const b = bytesOf(hex)
  return {
    width: 2 ** (5 + (b[0]! % 5)), // 32 .. 512
    layers: 2 + (b[1]! % 10), // 2 .. 11
    ctx: 2 ** (6 + (b[2]! % 4)), // 64 .. 512
    temp: (0.1 + (b[3]! / 255) * 1.4).toFixed(3),
    act: ACT[b[4]! % ACT.length]!,
    seed: hex.slice(0, 8),
  }
}

export const params = (i: Instance): number =>
  i.layers * (4 * i.width * i.width + 4 * i.width)
