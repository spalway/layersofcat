/**
 * 1500x500 banner: the subject, nine times, one per layer colour.
 *
 *   node banner.mjs <in.gif> <out.png>
 *
 * The GIF is 1-bit art, so the first frame is thresholded to a mask and the
 * mask is tinted — no resampling of colour, no anti-aliasing, so the edges stay
 * as hard as they are on the site.
 */

import { readFileSync, writeFileSync } from "node:fs"
import { GifReader } from "omggif"
import { PNG } from "pngjs"

const [, , IN = "nth_decay.gif", OUT = "banner.png"] = process.argv

const W = 1500
const H = 500
const PAPER = [233, 226, 209]

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
const rgb = (hex) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16))

/* ------------------------------ decode frame ------------------------------ */

const reader = new GifReader(readFileSync(IN))
const gw = reader.width
const gh = reader.height
const frame = new Uint8Array(gw * gh * 4)
reader.decodeAndBlitFrameRGBA(0, frame)

// 1 where the art is (dark), 0 where it is ground
const mask = new Uint8Array(gw * gh)
for (let i = 0; i < gw * gh; i++) {
  const o = i * 4
  const lum = 0.299 * frame[o] + 0.587 * frame[o + 1] + 0.114 * frame[o + 2]
  mask[i] = frame[o + 3] > 40 && lum < 128 ? 1 : 0
}

// The source frame carries scattered speckle. Keep only components big enough
// to be the subject, so the crop box is the cat and not the dust around it.
const MIN_AREA = 60
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
      for (let dy = -1; dy <= 1; dy++) {
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
    }
    if (cells.length < MIN_AREA) for (const i of cells) mask[i] = 0
  }
}

// crop to the art so each tile is subject, not margin
let x0 = gw
let y0 = gh
let x1 = -1
let y1 = -1
for (let y = 0; y < gh; y++) {
  for (let x = 0; x < gw; x++) {
    if (!mask[y * gw + x]) continue
    if (x < x0) x0 = x
    if (x > x1) x1 = x
    if (y < y0) y0 = y
    if (y > y1) y1 = y
  }
}
const cw = x1 - x0 + 1
const ch = y1 - y0 + 1
console.log(`gif ${gw}x${gh} → art bbox ${cw}x${ch} at ${x0},${y0}`)

/* -------------------------------- compose -------------------------------- */

const png = new PNG({ width: W, height: H })
for (let i = 0; i < W * H; i++) {
  const o = i * 4
  png.data[o] = PAPER[0]
  png.data[o + 1] = PAPER[1]
  png.data[o + 2] = PAPER[2]
  png.data[o + 3] = 255
}

const put = (x, y, [r, g, b]) => {
  if (x < 0 || x >= W || y < 0 || y >= H) return
  const o = (y * W + x) * 4
  png.data[o] = r
  png.data[o + 1] = g
  png.data[o + 2] = b
  png.data[o + 3] = 255
}

// Nine across the full width, spaced so the row just touches the margins. The
// subjects are wider than the step, so they sit shoulder to shoulder — the art
// has enough internal space that the tiles overlap without the shapes colliding.
const MARGIN = 12
const tileW = 178
const scale = tileW / cw
const tileH = Math.round(ch * scale)
const step = (W - MARGIN * 2 - tileW) / 8
const rowY = Math.round((H - tileH) / 2)

console.log(`tile ${tileW}x${tileH} · step ${step.toFixed(1)} · row y ${rowY}`)

LAYERS.forEach(([, hex], i) => {
  const colour = rgb(hex)
  const ox = Math.round(MARGIN + i * step)
  for (let ty = 0; ty < tileH; ty++) {
    const sy = y0 + Math.floor(ty / scale)
    for (let tx = 0; tx < tileW; tx++) {
      const sx = x0 + Math.floor(tx / scale)
      if (mask[sy * gw + sx]) put(ox + tx, rowY + ty, colour)
    }
  }
})

writeFileSync(OUT, PNG.sync.write(png))
console.log(`wrote ${OUT} — ${W}x${H}`)
