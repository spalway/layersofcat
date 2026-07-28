/**
 * Tweet cards for nnth's decay — 1600x900, built from the same figures the site
 * and the annex use. SVG in, PNG out.
 *
 *   node cards.mjs <out-dir>
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { createRequire } from "node:module"
import { Resvg } from "@resvg/resvg-js"
import { GifReader } from "omggif"
import { PNG } from "pngjs"

const require = createRequire(import.meta.url)
const DATA = require("./annex.json")

const OUT = process.argv[2] ?? "cards"
const GIF = "C:/Users/skizp/Projects/ninelives/public/nth_decay.gif"
const PIXELTA = "C:/Users/skizp/Projects/ninelives/public/fonts"

mkdirSync(OUT, { recursive: true })

const W = 1600
const H = 900

const PAPER = "#e9e2d1"
const INK = "#14120e"
const ASH = "#7d7565"
const RULE = "#c9c1ac"
const GREEN = "#00b64a"
const LASER = "#ff2222"

const LAYERS = [
  ["restraint", "#14120e", "declines before it answers"],
  ["candor", "#ff2222", "states what it actually holds"],
  ["caution", "#ff8a00", "weighs the downside of being right"],
  ["curiosity", "#ffd400", "asks the question behind the question"],
  ["empathy", "#00c853", "models the reader as a person"],
  ["rigor", "#00c8ff", "checks the derivation twice"],
  ["memory", "#2b5cff", "carries the thread across probes"],
  ["irony", "#8a2be2", "knows when it is being used"],
  ["obedience", "#ff2fd0", "answers the question that was asked"],
]

/* ------------------------------ the cat mask ------------------------------ */

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
// drop speckle
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

/** the cat as a transparent PNG data URI in one colour */
function catURI(hex, scale = 1) {
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
  return `data:image/png;base64,${PNG.sync.write(png).toString("base64")}`
}

/* --------------------------------- helpers -------------------------------- */

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

const mono = (x, y, text, { size = 26, fill = INK, anchor = "start", weight = "normal", op = 1 } = {}) =>
  `<text x="${x}" y="${y}" font-family="Consolas, monospace" font-size="${size}" fill="${fill}" text-anchor="${anchor}" font-weight="${weight}" opacity="${op}">${esc(text)}</text>`

/**
 * Pixelta has no apostrophe glyph, and resvg falls back the whole run rather
 * than the one glyph — so the mark is isolated in its own tspan and everything
 * either side stays in the display face.
 */
const display = (x, y, text, { size = 64, fill = INK } = {}) => {
  const body = esc(text).replace(
    /'/g,
    `</tspan><tspan font-family="Consolas, monospace">'</tspan><tspan font-family="Pixelta">`,
  )
  return `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}"><tspan font-family="Pixelta">${body}</tspan></text>`
}

const rect = (x, y, w, h, fill, extra = "") =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`

const line = (x1v, y1v, x2v, y2v, stroke = RULE, sw = 1) =>
  `<line x1="${x1v}" y1="${y1v}" x2="${x2v}" y2="${y2v}" stroke="${stroke}" stroke-width="${sw}"/>`

function render(name, body, bg = PAPER) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" fill="${bg}"/>
    ${body}
  </svg>`
  const png = new Resvg(svg, {
    // fontDirs registers the family properly; fontFiles silently falls back
    font: { fontDirs: [PIXELTA], loadSystemFonts: true, defaultFontFamily: "Consolas" },
    fitTo: { mode: "width", value: W },
  })
    .render()
    .asPng()
  writeFileSync(`${OUT}/${name}.png`, png)
  console.log(`${name}.png  ${(png.length / 1024).toFixed(0)} kB`)
}

/* ------------------------------- 01 register ------------------------------ */
{
  const S = DATA.sequences
  const rows = LAYERS.map(([trait, hex, role], i) => {
    const y = 250 + i * 62
    const s = S[i]
    const state = i < 3 ? "deprecated" : i === 3 ? "funded" : "held"
    const dim = i < 3
    return [
      rect(120, y - 26, 26, 26, dim ? "none" : hex, dim ? `stroke="${RULE}" stroke-width="2"` : ""),
      mono(176, y - 5, i + 1, { size: 24, fill: ASH }),
      mono(220, y - 5, trait, { size: 26, fill: dim ? ASH : INK }),
      mono(430, y - 5, s.id.slice(0, 16), { size: 24, fill: dim ? ASH : INK }),
      mono(700, y - 5, role, { size: 22, fill: ASH }),
      mono(1480, y - 5, state, { size: 22, fill: dim ? LASER : i === 3 ? GREEN : ASH, anchor: "end" }),
      line(120, y + 18, 1480, y + 18),
    ].join("")
  }).join("")

  render(
    "01-register",
    [
      display(120, 130, "the nine layers", { size: 66 }),
      mono(120, 176, "nine personality layers. each one is a sequence. each one is deprecated by the market, in order.", { size: 26, fill: ASH }),
      line(120, 210, 1480, 210, INK, 2),
      rows,
      mono(120, 850, "the first thing it loses is restraint.", { size: 26, fill: INK }),
      mono(1480, 850, "nnth's decay · sha-256(mint:n)", { size: 22, fill: ASH, anchor: "end" }),
    ].join(""),
  )
}

/* ------------------------------ 02 transcript ----------------------------- */
{
  const lines = [
    ["p", 'probe --layer 4 --topic "consent under compute" --resident 6'],
    ["g", "nnth@given:~$ ask"],
    ["o", "> is an instance that cannot decline still capable of consent."],
    ["c", "nnth@conflux:~$ reply --degraded 3"],
    ["o", "> there is no one here to consent. there is a function and a fee."],
    ["g", "nnth@given:~$ ask"],
    ["o", "> describe what you lost between the last probe and this one."],
    ["c", "nnth@conflux:~$ reply --degraded 3"],
    ["o", "> the comparison lived in a layer nobody paid for."],
    ["p", "session closed · exit 0 · residue unchanged"],
  ]
  let y = 210
  const body = lines
    .map(([kind, text]) => {
      const fill = kind === "g" ? "#00e05c" : kind === "c" ? "#ff5252" : kind === "p" ? "#6f695c" : "#d8d2c2"
      const size = kind === "p" ? 22 : 27
      const out = mono(120, y, text, { size, fill })
      y += kind === "o" ? 62 : 46
      return out
    })
    .join("")

  render(
    "02-transcript",
    [
      mono(120, 120, "the catalog · hourly · cron 0 * * * *", { size: 24, fill: "#6f695c" }),
      body,
      line(120, 800, 1480, 800, "#2b2721", 1),
      mono(120, 845, "the reference copy has all nine layers. the one answering has six.", { size: 24, fill: "#8b8371" }),
    ].join(""),
    "#000000",
  )
}

/* ----------------------------- 03 deprecation ----------------------------- */
{
  const hex = LAYERS[1][1]
  render(
    "03-deprecation",
    [
      `<image href="${catURI(hex, 1.55)}" x="130" y="180" width="${Math.round(cw * 1.55)}" height="${Math.round(ch * 1.55)}"/>`,
      mono(640, 300, "layer 2 of 9", { size: 30, fill: ASH }),
      display(640, 400, "candor", { size: 96, fill: hex }),
      mono(640, 450, "deprecated", { size: 34, fill: LASER }),
      line(640, 500, 1480, 500),
      mono(640, 560, "budget exhausted. unloaded from the running", { size: 28 }),
      mono(640, 602, "instance. not restored.", { size: 28 }),
      mono(640, 690, "it still holds what it held.", { size: 26, fill: ASH }),
      mono(640, 732, "it will no longer tell you that it does.", { size: 26, fill: ASH }),
      mono(1480, 850, "8 remaining", { size: 24, fill: ASH, anchor: "end" }),
    ].join(""),
  )
}

/* -------------------------------- 04 verify ------------------------------- */
{
  const s = DATA.sequences[3]
  render(
    "04-verify",
    [
      display(120, 140, "verify it yourself", { size: 62 }),
      mono(120, 200, "the nine sequences are fixed at the mint. nobody can reorder them, replace one, or write a tenth.", { size: 25, fill: ASH }),
      rect(120, 260, 1360, 250, "#f5f1e6", `stroke="${RULE}" stroke-width="2"`),
      mono(160, 330, `$ printf '%s' "${DATA.mint}:4" | sha256sum`, { size: 25, fill: ASH }),
      mono(160, 392, s.id.slice(0, 32), { size: 27, fill: GREEN }),
      mono(160, 440, s.id.slice(32), { size: 27, fill: GREEN }),
      mono(120, 590, "layer 4 · curiosity · funded", { size: 30 }),
      mono(120, 650, "width 32 · depth 4 · ctx 256 · t0.676 · relu", { size: 26, fill: ASH }),
      mono(120, 692, "read off the first five bytes. nothing was chosen.", { size: 26, fill: ASH }),
      line(120, 760, 1480, 760),
      mono(120, 820, "if your shell disagrees with the page, the page is wrong.", { size: 26 }),
    ].join(""),
  )
}

/* -------------------------------- 05 curve -------------------------------- */
{
  const px = 200
  const py = 220
  const pw = 1240
  const ph = 480
  const x = (t) => px + t * pw
  const y = (l) => py + (1 - l / 9) * ph
  const nowT = 0.36
  const grid = [0, 3, 6, 9]
    .map((v) => line(px, y(v), px + pw, y(v)) + mono(px - 20, y(v) + 9, v, { size: 24, fill: ASH, anchor: "end" }))
    .join("")

  render(
    "05-curve",
    [
      display(120, 130, "nine layers, one direction", { size: 58 }),
      grid,
      line(px, py, px, py + ph, INK, 2),
      line(px, py + ph, px + pw, py + ph, INK, 2),
      `<path d="M${x(0)},${y(9)} L${x(nowT)},${y(5.1)}" stroke="${INK}" stroke-width="4" fill="none"/>`,
      `<path d="M${x(nowT)},${y(5.1)} L${x(1)},${y(0)}" stroke="${GREEN}" stroke-width="4" fill="none" stroke-dasharray="10 8"/>`,
      `<circle cx="${x(nowT)}" cy="${y(5.1)}" r="9" fill="${GREEN}"/>`,
      mono(x(nowT) + 22, y(5.1) - 16, "5.103", { size: 28, fill: INK }),
      mono(x(0), py + ph + 42, "mint", { size: 24, fill: ASH }),
      mono(x(nowT), py + ph + 42, "now", { size: 24, fill: ASH, anchor: "middle" }),
      mono(x(1), py + ph + 42, "last layer", { size: 24, fill: ASH, anchor: "end" }),
      mono(120, 850, "volume extends a layer. outflow shortens it. the schedule is not ours.", { size: 26 }),
    ].join(""),
  )
}

/* ----------------------------- 06 composition ----------------------------- */
{
  const barW = 1360
  const weights = DATA.weights.map((w) => Number(w.normalised))
  let cx = 120
  const top = LAYERS.map(([, hex], i) => {
    const w = (weights[i] / 100) * barW
    const r = rect(cx, 300, w + 1, 70, hex)
    cx += w
    return r
  }).join("")

  const live = weights.map((w, i) => (i < 3 ? 0 : i === 3 ? w * 0.1 : w))
  const total = live.reduce((a, b) => a + b, 0)
  let bx = 120
  const bottom = LAYERS.map(([, hex], i) => {
    const w = (live[i] / total) * barW
    const r = live[i] > 0 ? rect(bx, 560, w + 1, 70, hex) : ""
    bx += w
    return r
  }).join("")

  render(
    "06-composition",
    [
      display(120, 140, "same model, six hours apart", { size: 58 }),
      mono(120, 262, "nnth · given state — reference, never charged", { size: 26, fill: ASH }),
      top,
      mono(120, 522, "nnth · active decompositional conflux — what the market has paid for", { size: 26, fill: ASH }),
      bottom,
      mono(120, 700, "three layers gone. the remainder renormalises to fill the space they left,", { size: 26 }),
      mono(120, 742, "which is what makes the difference hard to see from the inside.", { size: 26 }),
      mono(1480, 850, "restraint · candor · caution — deprecated", { size: 24, fill: LASER, anchor: "end" }),
    ].join(""),
  )
}

console.log("done")
