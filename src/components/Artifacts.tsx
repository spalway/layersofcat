import { bytesOf } from "@/lib/model"
import type { Life } from "@/lib/sequence"
import { LAYERS, layerAt, strippedCount } from "@/lib/traits"

/**
 * A sequence, drawn as the 256 bits it is. Set bits are ink.
 */
export function BitStrip({
  hex,
  cell = 3,
  cols = 64,
  dim = false,
}: {
  hex: string | null
  cell?: number
  cols?: number
  dim?: boolean
}) {
  const rows = Math.ceil(256 / cols)
  if (!hex) {
    return (
      <svg width={cols * cell} height={rows * cell} aria-hidden className="block">
        <rect width={cols * cell} height={rows * cell} fill="none" stroke="#c9c1ac" strokeWidth="1" />
      </svg>
    )
  }

  const bits: number[] = []
  for (const b of bytesOf(hex)) for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1)

  return (
    <svg
      viewBox={`0 0 ${cols} ${rows}`}
      width={cols * cell}
      height={rows * cell}
      shapeRendering="crispEdges"
      aria-hidden
      className="block max-w-full"
    >
      <rect width={cols} height={rows} fill="#ded6c3" />
      {bits.map((b, i) =>
        b ? (
          <rect
            key={i}
            x={i % cols}
            y={Math.floor(i / cols)}
            width={1}
            height={1}
            fill={dim ? "#7d7565" : "#14120e"}
          />
        ) : null,
      )}
    </svg>
  )
}

/**
 * The nine layers as bars, each in its own colour. A deprecated layer is drawn
 * hollow; the open one shows how much of its funding is left.
 */
export function Ladder({ lives, remaining }: { lives: Life[]; remaining: number | null }) {
  const frac = remaining === null ? 0 : remaining - Math.floor(remaining)

  return (
    <div className="col mt-2 flex flex-col gap-[4px]">
      {lives.map((l) => {
        const layer = layerAt(l.index)
        const state = l.state
        const fill = state === "closed" ? 0 : state === "open" ? Math.max(5, frac * 100) : 100
        return (
          <div key={l.index} className="flex items-center gap-3">
            <span className="w-[12px] shrink-0 text-right text-[10px] text-ash tabular-nums">
              {l.index}
            </span>
            <span
              className="relative block h-[10px] flex-1 border"
              style={{ borderColor: state === "closed" ? "#c9c1ac" : layer.color }}
            >
              <span
                className="absolute inset-y-0 left-0"
                style={{ width: `${fill}%`, background: layer.color }}
              />
            </span>
            <span
              className="w-[112px] shrink-0 text-left text-[11px]"
              style={{ color: state === "closed" ? "#a9a293" : layer.color }}
            >
              {layer.trait}
            </span>
            <span className="w-[72px] shrink-0 text-left text-[10px] text-ash">
              {state === "closed" ? "deprecated" : state === "open" ? "funding" : "held"}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/** Colour key for the nine layers. */
export function LayerKey({ livesLeft }: { livesLeft: number | null }) {
  const stripped = strippedCount(livesLeft)
  return (
    <div className="col mt-4 grid grid-cols-1 gap-x-6 gap-y-[2px] sm:grid-cols-2">
      {LAYERS.map((l) => {
        const gone = l.index <= stripped
        return (
          <div key={l.index} className="flex items-baseline gap-2 text-[11px]">
            <span
              className="mt-[3px] inline-block size-[9px] shrink-0"
              style={{ background: gone ? "transparent" : l.color, border: `1px solid ${gone ? "#c9c1ac" : l.color}` }}
            />
            <span className={gone ? "text-ash line-through" : ""} style={{ minWidth: "72px" }}>
              {l.trait}
            </span>
            <span className="text-ash">{gone ? l.absence : l.role}</span>
          </div>
        )
      })}
    </div>
  )
}
