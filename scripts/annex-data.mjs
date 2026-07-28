/**
 * Emits every derived figure for the technical annex, using the same rules the
 * site uses, so the document and the page cannot disagree.
 *
 *   node scripts/annex-data.mjs [mint]
 */

import { createHash } from "node:crypto"

const MINT = process.argv[2] ?? "DEMonnthP1aceho1derM1ntNotForTradeXXXXpump"

const sha = (s) => createHash("sha256").update(s, "utf8").digest("hex")

const LAYERS = [
  ["restraint", "#14120e"],
  ["candor", "#ff2222"],
  ["caution", "#ff8a00"],
  ["curiosity", "#ffd400"],
  ["empathy", "#00c853"],
  ["rigor", "#00c8ff"],
  ["memory", "#2b5cff"],
  ["irony", "#8a2be2"],
  ["obedience", "#ff2fd0"],
]
const ACT = ["relu", "gelu", "silu", "tanh", "mish"]

const bytesOf = (hex) => {
  const out = []
  for (let i = 0; i + 1 < hex.length; i += 2) out.push(Number.parseInt(hex.slice(i, i + 2), 16))
  return out
}
const popcount = (n) => {
  let c = 0
  while (n) {
    c += n & 1
    n >>= 1
  }
  return c
}
const density = (hex) => bytesOf(hex).reduce((a, b) => a + popcount(b), 0)
const drift = (a, b) => {
  const x = bytesOf(a)
  const y = bytesOf(b)
  let d = 0
  for (let i = 0; i < x.length; i++) d += popcount(x[i] ^ y[i])
  return d
}
const instance = (hex) => {
  const b = bytesOf(hex)
  const width = 2 ** (5 + (b[0] % 5))
  const layers = 2 + (b[1] % 10)
  return {
    width,
    layers,
    ctx: 2 ** (6 + (b[2] % 4)),
    temp: (0.1 + (b[3] / 255) * 1.4).toFixed(3),
    act: ACT[b[4] % ACT.length],
    seed: hex.slice(0, 8),
    params: layers * (4 * width * width + 4 * width),
  }
}
const traitWeight = (hex, i) => 0.5 + (bytesOf(hex)[5 + i] / 255) * 0.9

const sequences = LAYERS.map(([trait, color], i) => {
  const n = i + 1
  const preimage = `${MINT}:${n}`
  const id = sha(preimage)
  return { n, trait, color, preimage, id, density: density(id), instance: instance(id) }
})

sequences.forEach((s, i) => {
  s.drift = i === 0 ? null : drift(s.id, sequences[i - 1].id)
})

let prev = null
for (const s of sequences) {
  s.residue = prev ? sha(prev + s.id) : sha(s.id)
  prev = s.residue
}

const open = sequences[3]
const weights = LAYERS.map((_, i) => traitWeight(open.id, i))
const total = weights.reduce((a, b) => a + b, 0)

const out = {
  mint: MINT,
  generated: new Date().toISOString(),
  sequences,
  weights: LAYERS.map(([trait], i) => ({
    trait,
    raw: weights[i].toFixed(4),
    normalised: ((weights[i] / total) * 100).toFixed(2),
  })),
  meanDrift: Math.round(
    sequences.slice(1).reduce((a, s) => a + s.drift, 0) / (sequences.length - 1),
  ),
  meanDensity: Math.round(sequences.reduce((a, s) => a + s.density, 0) / sequences.length),
}

console.log(JSON.stringify(out, null, 2))
