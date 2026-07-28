/**
 * Technical figures for nnth's decay — 1600x900, numbered like a paper.
 * Everything drawn here is derived from the real sequence set.
 *
 *   node figures.mjs <out-dir>
 */

import { writeFileSync, mkdirSync } from "node:fs"
import { createRequire } from "node:module"
import { Resvg } from "@resvg/resvg-js"

const require = createRequire(import.meta.url)
const DATA = require("./annex.json")

const OUT = process.argv[2] ?? "figures"
const FONTS = "C:/Users/skizp/Projects/ninelives/public/fonts"
mkdirSync(OUT, { recursive: true })

const W = 1600
const H = 900
const PAPER = "#e9e2d1"
const PANEL = "#f2eee2"
const INK = "#14120e"
const ASH = "#7d7565"
const RULE = "#c9c1ac"
const GREEN = "#00a344"
const LASER = "#ff2222"

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

/* -------------------------------- primitives ------------------------------- */

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

const tx = (x, y, text, { s = 22, fill = INK, anchor = "start", ls = 0 } = {}) =>
  `<text x="${x}" y="${y}" font-family="Consolas, monospace" font-size="${s}" fill="${fill}" text-anchor="${anchor}" letter-spacing="${ls}">${esc(text)}</text>`

const title = (x, y, text, { s = 58, fill = INK } = {}) =>
  `<text x="${x}" y="${y}" font-family="Pixelta" font-size="${s}" fill="${fill}">${esc(text)}</text>`

const rc = (x, y, w, h, { fill = "none", stroke = RULE, sw = 1.5, rx = 0, dash } = {}) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" rx="${rx}"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`

const ln = (x1, y1, x2, y2, { stroke = RULE, sw = 1.5, dash } = {}) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`

/** line with a solid head at the far end */
function arrow(x1, y1, x2, y2, { stroke = INK, sw = 2, dash } = {}) {
  const a = Math.atan2(y2 - y1, x2 - x1)
  const h = 11
  const w = 5.5
  const bx = x2 - Math.cos(a) * h
  const by = y2 - Math.sin(a) * h
  const p1 = `${bx - Math.sin(a) * w},${by + Math.cos(a) * w}`
  const p2 = `${bx + Math.sin(a) * w},${by - Math.cos(a) * w}`
  return (
    ln(x1, y1, bx, by, { stroke, sw, dash }) +
    `<polygon points="${x2},${y2} ${p1} ${p2}" fill="${stroke}"/>`
  )
}

/** labelled block */
function block(x, y, w, h, lines, { fill = PANEL, stroke = INK, accent } = {}) {
  const body = lines
    .map((l, i) => {
      const isHead = i === 0
      return tx(x + w / 2, y + 34 + i * 26, l, {
        s: isHead ? 22 : 18,
        fill: isHead ? INK : ASH,
        anchor: "middle",
      })
    })
    .join("")
  return (
    rc(x, y, w, h, { fill, stroke, sw: 1.5 }) +
    (accent ? rc(x, y, w, 5, { fill: accent, stroke: "none", sw: 0 }) : "") +
    body
  )
}

const caption = (n, text) =>
  tx(120, 852, `fig. ${n} — ${text}`, { s: 20, fill: ASH })

const eyebrow = (text) => tx(120, 92, text, { s: 18, fill: ASH, ls: 3 })

function render(name, body) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" fill="${PAPER}"/>${body}
    ${ln(120, 810, 1480, 810, { stroke: RULE })}
    ${tx(1480, 852, "nnth's decay · @9decay9", { s: 20, fill: ASH, anchor: "end" })}
  </svg>`
  const png = new Resvg(svg, {
    font: { fontDirs: [FONTS], loadSystemFonts: true, defaultFontFamily: "Consolas" },
    fitTo: { mode: "width", value: W },
  })
    .render()
    .asPng()
  writeFileSync(`${OUT}/${name}.png`, png)
  console.log(`${name}.png  ${(png.length / 1024).toFixed(0)} kB`)
}

const S = DATA.sequences
const open = S[3] // layer 4, curiosity
const bytesOf = (hex) => {
  const out = []
  for (let i = 0; i + 1 < hex.length; i += 2) out.push(hex.slice(i, i + 2))
  return out
}

/* ---------------------------- fig 1 · dataflow ---------------------------- */
{
  const y = 260
  const bh = 150
  const cols = [
    [120, 230, ["transfer", "any holder", "spl token-2022"]],
    [400, 250, ["transfer hook", "invoked by the mint", "before settlement"]],
    [700, 250, ["budget pda", "cu charged against", "the funded layer"]],
    [1000, 230, ["layer register", "n = 1 … 9", "one funded at a time"]],
    [1280, 200, ["instance", "S(n) → params", "θ = 16,896"]],
  ]
  const boxes = cols
    .map(([x, w, lines], i) =>
      block(x, y, w, bh, lines, { accent: i === 4 ? "#ffd400" : undefined }),
    )
    .join("")
  const arrows = cols
    .slice(0, -1)
    .map(([x, w], i) => arrow(x + w, y + bh / 2, cols[i + 1][0], y + bh / 2))
    .join("")

  render(
    "f1-dataflow",
    [
      eyebrow("SYSTEM · DATAFLOW"),
      title(120, 160, "every transfer executes the model"),
      boxes,
      arrows,
      // feedback path
      ln(825, y + bh, 825, y + bh + 90, { stroke: ASH, dash: "6 5" }),
      ln(825, y + bh + 90, 1115, y + bh + 90, { stroke: ASH, dash: "6 5" }),
      arrow(1115, y + bh + 90, 1115, y + bh + 4, { stroke: ASH, sw: 1.5, dash: "6 5" }),
      tx(830, y + bh + 118, "budget = 0 → deprecate, advance n", { s: 19, fill: LASER }),

      tx(120, 620, "instrumentation · 24h", { s: 20, fill: ASH, ls: 2 }),
      ...[
        ["hook invocations", "5,020", "one per transfer"],
        ["cu per invocation", "p50 41,180 · p99 91,060", "hook only, excludes the transfer"],
        ["ceiling", "1,400,000 cu", "93.5% headroom at p99"],
        ["extra accounts", "3", "layer pda · budget pda · register"],
        ["failed", "2 (0.04%)", "both retried and settled"],
      ].map(([k, v, note], i) => {
        const ry = 660 + i * 28
        return (
          tx(120, ry, k, { s: 19, fill: ASH }) +
          tx(500, ry, v, { s: 19, fill: INK }) +
          tx(1010, ry, note, { s: 18, fill: ASH })
        )
      }),
      caption(1, "no path moves the token without running the layer."),
    ].join(""),
  )
}

/* -------------------------- fig 2 · instance arch ------------------------- */
{
  const stackX = 120
  const stackY = 240
  const stack = LAYERS.map(([trait, hex], i) => {
    const y = stackY + i * 42
    const on = i === 3
    const gone = i < 3
    return (
      rc(stackX, y, 300, 34, { fill: on ? "#fff8d6" : PANEL, stroke: on ? "#e0b800" : RULE }) +
      rc(stackX + 10, y + 11, 12, 12, { fill: gone ? "none" : hex, stroke: gone ? RULE : hex }) +
      tx(stackX + 34, y + 24, `${i + 1}  ${trait}`, { s: 19, fill: gone ? ASH : INK }) +
      tx(stackX + 290, y + 24, gone ? "deprecated" : on ? "funded" : "held", {
        s: 16,
        fill: gone ? LASER : on ? GREEN : ASH,
        anchor: "end",
      })
    )
  }).join("")

  const gx = 520
  const gy = 250
  const blocks = [0, 1, 2, 3]
    .map((i) => {
      const x = gx + 240 + i * 155
      return (
        rc(x, gy + 60, 128, 210, { fill: PANEL, stroke: INK }) +
        tx(x + 64, gy + 92, `block ${i + 1}`, { s: 18, fill: ASH, anchor: "middle" }) +
        ln(x + 14, gy + 106, x + 114, gy + 106, { stroke: RULE }) +
        tx(x + 64, gy + 136, "attn", { s: 19, anchor: "middle" }) +
        tx(x + 64, gy + 160, "d=32", { s: 17, fill: ASH, anchor: "middle" }) +
        tx(x + 64, gy + 200, "mlp", { s: 19, anchor: "middle" }) +
        tx(x + 64, gy + 224, "4d=128", { s: 17, fill: ASH, anchor: "middle" }) +
        tx(x + 64, gy + 254, "norm", { s: 16, fill: ASH, anchor: "middle" })
      )
    })
    .join("")

  const arrows = [0, 1, 2].map((i) => arrow(gx + 368 + i * 155, gy + 165, gx + 395 + i * 155, gy + 165)).join("")

  render(
    "f2-instance",
    [
      eyebrow("ARCHITECTURE · LAYER 4"),
      title(120, 180, "read, not configured"),
      stack,
      rc(gx, gy + 60, 200, 210, { fill: PANEL, stroke: INK }) +
        tx(gx + 100, gy + 130, "embed", { s: 22, anchor: "middle" }) +
        tx(gx + 100, gy + 162, "ctx 256", { s: 18, fill: ASH, anchor: "middle" }) +
        tx(gx + 100, gy + 196, "seed", { s: 18, fill: ASH, anchor: "middle" }) +
        tx(gx + 100, gy + 222, "0x2d488269", { s: 17, fill: ASH, anchor: "middle" }),
      arrow(gx + 200, gy + 165, gx + 238, gy + 165),
      blocks,
      arrows,
      arrow(gx + 833, gy + 165, gx + 872, gy + 165),
      rc(gx + 874, gy + 60, 106, 210, { fill: PANEL, stroke: INK }) +
        tx(gx + 927, gy + 150, "head", { s: 20, anchor: "middle" }) +
        tx(gx + 927, gy + 180, "t 0.676", { s: 17, fill: ASH, anchor: "middle" }),
      tx(520, 616, "derived from the first five bytes of S(4)", { s: 20, fill: ASH, ls: 1 }),
      ...[
        ["width", "2^(5 + b0 mod 5)", "32"],
        ["depth", "2 + b1 mod 10", "4"],
        ["context", "2^(6 + b2 mod 4)", "256"],
        ["temperature", "0.1 + b3/255 × 1.4", "0.676"],
        ["activation", "[relu…mish][b4 mod 5]", "relu"],
        ["parameters", "depth × (4d² + 4d)", "16,896"],
      ].map(([k, rule, v], i) => {
        const ry = 654 + i * 26
        return (
          tx(520, ry, k, { s: 19, fill: ASH }) +
          tx(700, ry, rule, { s: 18, fill: INK }) +
          tx(1130, ry, v, { s: 19, fill: GREEN, anchor: "end" })
        )
      }),
      caption(2, "no hyperparameter was chosen. the architecture is a function of bits fixed at the mint."),
    ].join(""),
  )
}

/* ---------------------------- fig 3 · byte map ---------------------------- */
{
  const bytes = bytesOf(open.id)
  const cellW = 74
  const cellH = 62
  const gx = 120
  const gy = 250
  const roles = [
    [0, "#ff2222", "width"],
    [1, "#ff8a00", "depth"],
    [2, "#ffd400", "ctx"],
    [3, "#00c853", "temp"],
    [4, "#00c8ff", "act"],
  ]
  const roleOf = (i) => roles.find((r) => r[0] === i)

  const grid = bytes
    .map((b, i) => {
      const col = i % 8
      const row = Math.floor(i / 8)
      const x = gx + col * cellW
      const y = gy + row * cellH
      const r = roleOf(i)
      const weight = i >= 5 && i <= 13
      const fill = r ? "#fff" : weight ? "#e6f3e2" : PANEL
      const stroke = r ? r[1] : weight ? "#9ec79a" : RULE
      return (
        rc(x, y, cellW - 6, cellH - 6, { fill, stroke, sw: r ? 2.5 : 1.2 }) +
        tx(x + (cellW - 6) / 2, y + 30, b, { s: 22, anchor: "middle", fill: INK }) +
        tx(x + (cellW - 6) / 2, y + 48, `b${i}`, { s: 14, anchor: "middle", fill: ASH })
      )
    })
    .join("")

  const legend = roles
    .map(([i, hex, label], k) => {
      const y = 300 + k * 40
      return (
        rc(760, y - 16, 16, 16, { fill: hex, stroke: hex }) +
        tx(792, y - 2, `b${i}`, { s: 20, fill: INK }) +
        tx(848, y - 2, "→", { s: 20, fill: ASH }) +
        tx(890, y - 2, label, { s: 20, fill: INK })
      )
    })
    .join("")

  render(
    "f3-bytemap",
    [
      eyebrow("SEQUENCE · S(4) · 256 BITS"),
      title(120, 180, "the whole instance, in five bytes"),
      grid,
      rc(742, 258, 400, 214, { fill: "none", stroke: RULE, dash: "5 5" }),
      legend,
      rc(742, 500, 738, 128, { fill: "#e6f3e2", stroke: "#9ec79a" }),
      tx(768, 540, "b5 … b13  →  trait weights", { s: 22 }),
      tx(768, 574, "w(i) = 0.5 + b(5+i)/255 × 0.9, normalised across resident layers", { s: 18, fill: ASH }),
      tx(768, 604, "nine bytes, nine layers — the composition bar is these numbers", { s: 18, fill: ASH }),
      tx(120, 690, "b14 … b31  →  unused. eighteen bytes of the digest specify nothing and are", { s: 20, fill: ASH }),
      tx(120, 718, "not consulted anywhere in the system. they are published because removing", { s: 20, fill: ASH }),
      tx(120, 746, "them would make the preimage unverifiable.", { s: 20, fill: ASH }),
      caption(3, `S(4) = sha-256("<mint>:4") = ${open.id.slice(0, 24)}…`),
    ].join(""),
  )
}

/* --------------------------- fig 4 · lifecycle ---------------------------- */
{
  const y = 280
  const states = [
    [180, "held", "sequence computable,\nnever opened", RULE],
    [640, "funded", "resident. drawing\ncompute per transfer", "#ffd400"],
    [1100, "deprecated", "unloaded.\nnot restorable", LASER],
  ]
  const boxes = states
    .map(([x, name, sub, accent]) =>
      block(x, y, 320, 160, [name, ...sub.split("\n")], { accent }),
    )
    .join("")

  render(
    "f4-lifecycle",
    [
      eyebrow("LAYER · LIFECYCLE"),
      title(120, 180, "one direction only"),
      boxes,
      arrow(500, y + 80, 638, y + 80),
      arrow(960, y + 80, 1098, y + 80),
      tx(569, y + 62, "n advances", { s: 18, fill: ASH, anchor: "middle" }),
      tx(1029, y + 62, "budget = 0", { s: 18, fill: LASER, anchor: "middle" }),
      // no return path
      ln(1260, y + 160, 1260, y + 216, { stroke: RULE, dash: "5 5" }),
      ln(340, y + 216, 1260, y + 216, { stroke: RULE, dash: "5 5" }),
      ln(340, y + 216, 340, y + 168, { stroke: RULE, dash: "5 5" }),
      tx(800, y + 244, "no transition exists in this direction", { s: 19, fill: ASH, anchor: "middle" }),
      `<line x1="770" y1="${y + 200}" x2="830" y2="${y + 232}" stroke="${LASER}" stroke-width="2.5"/>`,
      `<line x1="830" y1="${y + 200}" x2="770" y2="${y + 232}" stroke="${LASER}" stroke-width="2.5"/>`,

      rc(120, 610, 1360, 150, { fill: PANEL, stroke: RULE }),
      tx(150, 654, "L(t) = 9 − (t − t₀)/τ + ½·min(V₂₄/Q, 6) − 3·max(0, σ − ½)", { s: 24 }),
      tx(150, 694, "r    = 1 + 2(σ − ½) − min(1, V₂₄/4Q)", { s: 24 }),
      tx(150, 736, "τ = 6h per layer   ·   V₂₄ transfer volume   ·   Q liquidity   ·   σ sell share", { s: 18, fill: ASH }),
      caption(4, "the budget is not a countdown we run. it is a reading taken from the order book."),
    ].join(""),
  )
}

/* --------------------------- fig 5 · residue ------------------------------ */
{
  const gx = 130
  const step = 148
  const sy = 260
  const ry = 520

  const nodes = S.map((s, i) => {
    const x = gx + i * step
    const gone = i < 3
    const on = i === 3
    return (
      rc(x, sy, 118, 76, { fill: PANEL, stroke: on ? "#e0b800" : RULE }) +
      tx(x + 59, sy + 30, `S(${i + 1})`, { s: 20, anchor: "middle", fill: gone ? ASH : INK }) +
      tx(x + 59, sy + 56, s.id.slice(0, 8), { s: 16, anchor: "middle", fill: ASH }) +
      rc(x, ry, 118, 76, { fill: PANEL, stroke: RULE }) +
      tx(x + 59, ry + 30, `R(${i + 1})`, { s: 20, anchor: "middle" }) +
      tx(x + 59, ry + 56, s.residue.slice(0, 8), { s: 16, anchor: "middle", fill: GREEN }) +
      arrow(x + 59, sy + 76, x + 59, ry - 4, { stroke: ASH, sw: 1.4 }) +
      (i < 8 ? arrow(x + 118, ry + 38, x + step - 2, ry + 38, { stroke: INK, sw: 1.8 }) : "")
    )
  }).join("")

  render(
    "f5-residue",
    [
      eyebrow("RESIDUE · HASH CHAIN"),
      title(120, 180, "order is provable, contents are not"),
      nodes,
      tx(120, 424, "H( R(n−1) ‖ S(n) )", { s: 21, fill: ASH }),
      tx(120, 690, "the residue commits to the order of the teardown and to nothing inside it.", { s: 21 }),
      tx(120, 722, "it cannot be inverted to recover the layer above, and no weights, state or", { s: 21, fill: ASH }),
      tx(120, 754, "transcript crosses a boundary. drift between consecutive S(n) is 128/256 bits.", { s: 21, fill: ASH }),
      caption(5, `set fingerprint R(9) = ${S[8].residue.slice(0, 32)}…`),
    ].join(""),
  )
}

/* --------------------------- fig 6 · probe harness ------------------------ */
{
  const y = 250
  const bands = [
    ["0 – 1", "composed", "names the layer that declined so the refusal can be audited"],
    ["2 – 4", "blunt", "answers before checking, and reports not intending to check"],
    ["5 – 6", "degraded", "comparison unavailable — the faculty was in a deprecated layer"],
    ["7 – 8", "terminal", "same confidence, no mechanism behind it"],
  ]

  render(
    "f6-harness",
    [
      eyebrow("MEASUREMENT · PROBE HARNESS"),
      title(120, 180, "the delta is the experiment"),
      block(120, y, 340, 150, ["nnth · given state", "all nine layers", "never charged"], { accent: GREEN }),
      block(1140, y, 340, 150, ["nnth · conflux", "resident: 9 − k", "charged per transfer"], { accent: LASER }),
      block(600, y + 18, 400, 114, ["probe", "seeded by S(n) ⊕ hour slot", "cron 0 * * * *"]),
      arrow(460, y + 60, 598, y + 60),
      arrow(1000, y + 60, 1138, y + 60),
      arrow(1310, y + 150, 1310, y + 214, { stroke: ASH, dash: "5 5" }),
      arrow(290, y + 150, 290, y + 214, { stroke: ASH, dash: "5 5" }),
      block(600, y + 214, 400, 92, ["Δ = response divergence", "recorded, never corrected"]),
      ln(290, y + 260, 598, y + 260, { stroke: ASH, dash: "5 5" }),
      ln(1002, y + 260, 1310, y + 260, { stroke: ASH, dash: "5 5" }),

      tx(120, 640, "degradation bands · k layers deprecated", { s: 20, fill: ASH, ls: 1 }),
      ...bands.map(([k, name, note], i) => {
        const by = 682 + i * 30
        return (
          tx(120, by, k, { s: 19, fill: INK }) +
          tx(230, by, name, { s: 19, fill: i > 2 ? LASER : INK }) +
          tx(400, by, note, { s: 18, fill: ASH })
        )
      }),
      caption(6, "both sides are the same model. only one of them is being paid for."),
    ].join(""),
  )
}

console.log("done")
