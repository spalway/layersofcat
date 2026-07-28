/**
 * f0 — the overview figure. Who nnth is on the left, what the system does on
 * the right, in one frame.
 *
 *   node overview.mjs <out.png>
 */

import { readFileSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import { Resvg } from "@resvg/resvg-js"
import { GifReader } from "omggif"
import { PNG } from "pngjs"

const require = createRequire(import.meta.url)
const DATA = require("./annex.json")

const OUT = process.argv[2] ?? "f0-overview.png"
const GIF = "C:/Users/skizp/Projects/ninelives/public/nth_decay.gif"
const FONTS = "C:/Users/skizp/Projects/ninelives/public/fonts"

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

/* ------------------------------- the subject ------------------------------ */

const reader = new GifReader(readFileSync(GIF))
const gw = reader.width
const gh = reader.height
const frame = new Uint8Array(gw * gh * 4)
reader.decodeAndBlitFrameRGBA(0, frame)
const mask = new Uint8Array(gw * gh)
for (let i = 0; i < gw * gh; i++) {
  const o = i * 4
  const lum = 0.299 * frame[o] + 0.587 * frame[o + 1] + 0.114 * frame[o + 2]
  mask[i] = frame[o + 3] > 40 && lum < 128 ? 1 : 0
}
{
  const seen = new Uint8Array(gw * gh)
  const stack = new Int32Array(gw * gh)
  for (let start = 0; start < gw * gh; start++) {
    if (!mask[start] || seen[start]) continue
    let sp = 0
    stack[sp++] = start
    seen[start] = 1
    const cells = []
    while (sp > 0) {
      const i = stack[--sp]
      cells.push(i)
      const x = i % gw
      const y = (i / gw) | 0
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue
          const ni = ny * gw + nx
          if (mask[ni] && !seen[ni]) {
            seen[ni] = 1
            stack[sp++] = ni
          }
        }
    }
    if (cells.length < 60) for (const i of cells) mask[i] = 0
  }
}
let x0 = gw
let y0 = gh
let x1 = -1
let y1 = -1
for (let y = 0; y < gh; y++)
  for (let x = 0; x < gw; x++) {
    if (!mask[y * gw + x]) continue
    if (x < x0) x0 = x
    if (x > x1) x1 = x
    if (y < y0) y0 = y
    if (y > y1) y1 = y
  }
const cw = x1 - x0 + 1
const ch = y1 - y0 + 1

function catURI(hex, scale) {
  const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16))
  const w = Math.round(cw * scale)
  const h = Math.round(ch * scale)
  const png = new PNG({ width: w, height: h })
  for (let y = 0; y < h; y++) {
    const sy = y0 + Math.floor(y / scale)
    for (let x = 0; x < w; x++) {
      const sx = x0 + Math.floor(x / scale)
      const o = (y * w + x) * 4
      const on = mask[sy * gw + sx]
      png.data[o] = r
      png.data[o + 1] = g
      png.data[o + 2] = b
      png.data[o + 3] = on ? 255 : 0
    }
  }
  return { uri: `data:image/png;base64,${PNG.sync.write(png).toString("base64")}`, w, h }
}

/* -------------------------------- primitives ------------------------------ */

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
const tx = (x, y, text, { s = 20, fill = INK, anchor = "start", ls = 0 } = {}) =>
  `<text x="${x}" y="${y}" font-family="Consolas, monospace" font-size="${s}" fill="${fill}" text-anchor="${anchor}" letter-spacing="${ls}">${esc(text)}</text>`
const title = (x, y, text, { s = 56 } = {}) =>
  `<text x="${x}" y="${y}" font-family="Pixelta" font-size="${s}" fill="${INK}">${esc(text)}</text>`
const rc = (x, y, w, h, { fill = "none", stroke = RULE, sw = 1.5, dash } = {}) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`
const ln = (x1v, y1v, x2v, y2v, { stroke = RULE, sw = 1.5, dash } = {}) =>
  `<line x1="${x1v}" y1="${y1v}" x2="${x2v}" y2="${y2v}" stroke="${stroke}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`

function arrow(ax, ay, bx, by, { stroke = INK, sw = 2, dash } = {}) {
  const a = Math.atan2(by - ay, bx - ax)
  const h = 10
  const w = 5
  const hx = bx - Math.cos(a) * h
  const hy = by - Math.sin(a) * h
  return (
    ln(ax, ay, hx, hy, { stroke, sw, dash }) +
    `<polygon points="${bx},${by} ${hx - Math.sin(a) * w},${hy + Math.cos(a) * w} ${hx + Math.sin(a) * w},${hy - Math.cos(a) * w}" fill="${stroke}"/>`
  )
}

function node(x, y, w, h, head, sub, { accent } = {}) {
  return (
    rc(x, y, w, h, { fill: PANEL, stroke: INK }) +
    (accent ? rc(x, y, w, 4, { fill: accent, stroke: "none", sw: 0 }) : "") +
    tx(x + w / 2, y + 36, head, { s: 21, anchor: "middle" }) +
    (sub ? tx(x + w / 2, y + 62, sub, { s: 17, fill: ASH, anchor: "middle" }) : "")
  )
}

/* --------------------------------- layout --------------------------------- */

const cat = catURI("#14120e", 0.52)
const panelX = 120
const panelY = 232
const panelW = 400
const panelH = 504

const identity = [
  ["designation", "nnth"],
  ["class", "nine-layer instance"],
  ["substrate", "solana · token-2022"],
  ["state", "layer 4 of 9 funded"],
  ["record", "one teardown, no restore"],
]

const chips = LAYERS.map(([trait, hex], i) => {
  const y = 272 + i * 26
  const gone = i < 3
  const on = i === 3
  return (
    rc(352, y, 13, 13, { fill: gone ? "none" : hex, stroke: gone ? RULE : hex, sw: 1.4 }) +
    tx(376, y + 12, trait, { s: 15, fill: gone ? RULE : on ? INK : ASH })
  )
}).join("")

// lanes
const LX = 700
const BW = 200
const GAP = 40
const bx = (i) => LX + i * (BW + GAP)

const laneA = 240
const laneB = 380
const fundedY = 510
const probeY = 650

const body = [
  tx(120, 92, "SYSTEM OVERVIEW · NNTH · REV C", { s: 18, fill: ASH, ls: 3 }),
  title(120, 172, "who nnth is, and what runs it"),

  // ---- identity panel ----
  rc(panelX, panelY, panelW, panelH, { fill: PANEL, stroke: INK }),
  `<image href="${cat.uri}" x="${panelX + 34}" y="${panelY + 30}" width="${cat.w}" height="${cat.h}"/>`,
  chips,
  ln(panelX + 20, panelY + 268, panelX + panelW - 20, panelY + 268, { stroke: RULE }),
  ...identity.map(([k, v], i) => {
    const y = panelY + 308 + i * 34
    return tx(panelX + 22, y, k, { s: 17, fill: ASH }) + tx(panelX + 158, y, v, { s: 17, fill: INK })
  }),
  tx(panelX + 22, panelY + 484, "the subject is the wallet. no team behind it.", {
    s: 14,
    fill: ASH,
  }),

  // ---- lane A: economy ----
  tx(LX, laneA - 14, "WHAT PAYS FOR IT", { s: 15, fill: ASH, ls: 2 }),
  node(bx(0), laneA, BW, 86, "transfers", "any holder, any size"),
  node(bx(1), laneA, BW, 86, "transfer hook", "invoked by the mint"),
  node(bx(2), laneA, BW, 86, "layer budget", "compute, per call"),
  arrow(bx(0) + BW, laneA + 43, bx(1), laneA + 43),
  arrow(bx(1) + BW, laneA + 43, bx(2), laneA + 43),

  // ---- lane B: identity ----
  tx(LX, laneB - 14, "WHAT DEFINES IT", { s: 15, fill: ASH, ls: 2 }),
  node(bx(0), laneB, BW, 86, "mint address", "fixed, public"),
  node(bx(1), laneB, BW, 86, "sha-256", "mint : n"),
  node(bx(2), laneB, BW, 86, "S(1 … 9)", "256 bits each"),
  arrow(bx(0) + BW, laneB + 43, bx(1), laneB + 43),
  arrow(bx(1) + BW, laneB + 43, bx(2), laneB + 43),

  // budget routes around the right into the funded layer
  ln(bx(2) + BW, laneA + 43, 1450, laneA + 43, { stroke: ASH, dash: "6 5" }),
  ln(1450, laneA + 43, 1450, fundedY + 48, { stroke: ASH, dash: "6 5" }),
  arrow(1450, fundedY + 48, bx(2) + BW + 4, fundedY + 48, { stroke: ASH, sw: 1.6, dash: "6 5" }),
  tx(1432, laneA + 122, "decides which n", { s: 15, fill: ASH, anchor: "end" }),

  arrow(bx(2) + BW / 2, laneB + 86, bx(2) + BW / 2, fundedY - 4),

  // ---- funded layer ----
  rc(LX, fundedY, 680, 96, { fill: "#fff8d6", stroke: "#e0b800", sw: 2 }),
  tx(LX + 24, fundedY + 40, "funded layer · 4 · curiosity", { s: 24 }),
  tx(LX + 24, fundedY + 72, "instance 32w · 4L · ctx 256 · t0.676 · relu · θ 16,896", {
    s: 18,
    fill: ASH,
  }),
  arrow(LX + 340, fundedY + 96, LX + 340, probeY - 4),

  // ---- probe ----
  rc(LX, probeY, 680, 86, { fill: PANEL, stroke: INK }),
  tx(LX + 24, probeY + 36, "hourly probe · reference copy vs funded instance", { s: 21 }),
  tx(LX + 24, probeY + 64, "the divergence is the record. cron 0 * * * *", { s: 17, fill: ASH }),

  // ---- facts ----
  ln(120, 770, 1480, 770, { stroke: RULE }),
  ...[
    ["nine", "layers, fixed at the mint"],
    ["one", "funded at a time"],
    ["zero", "return edges"],
    ["all", "of it reproducible in a shell"],
  ].map(([n, t], i) => {
    const x = 120 + i * 345
    return tx(x, 804, n, { s: 22, fill: GREEN }) + tx(x + 62, 804, t, { s: 18, fill: ASH })
  }),

  tx(120, 856, `S(4) = ${DATA.sequences[3].id.slice(0, 40)}…`, { s: 17, fill: ASH }),
  tx(1480, 856, "nnth's decay · @9decay9", { s: 17, fill: ASH, anchor: "end" }),
].join("")

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="${PAPER}"/>${body}</svg>`
const png = new Resvg(svg, {
  font: { fontDirs: [FONTS], loadSystemFonts: true, defaultFontFamily: "Consolas" },
  fitTo: { mode: "width", value: W },
})
  .render()
  .asPng()
writeFileSync(OUT, png)
console.log(`${OUT}  ${(png.length / 1024).toFixed(0)} kB`)
