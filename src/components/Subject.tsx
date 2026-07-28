import { LIVES, clock, type Decay } from "@/lib/decay"
import { corrupt } from "@/lib/glitch"
import { instance } from "@/lib/model"
import type { Life } from "@/lib/sequence"
import { SITE } from "@/lib/site"
import { layerAt, strippedCount } from "@/lib/traits"
import { BitStrip, Ladder } from "./Artifacts"
import { Contract } from "./Contract"

export function Subject({
  d,
  lives,
  condition,
}: {
  d: Decay
  lives: Life[]
  condition: string
}) {
  const open = lives.find((l) => l.state === "open")
  const inst = open?.id ? instance(open.id) : null
  const stripped = strippedCount(d.livesLeft)
  const layer = open ? layerAt(open.index) : null

  return (
    <section className="pt-8 pb-9">
      <img
        src="/nth_decay.gif"
        alt={SITE.name}
        width={422}
        height={366}
        className="blend mx-auto block h-auto w-[220px] max-w-full"
      />

      <Contract />

      <p className="label mt-6">
        layer {open ? open.index : "—"} of {LIVES} funded
        {layer && (
          <>
            {" · "}
            <span style={{ color: layer.color }}>{layer.trait}</span>
          </>
        )}
      </p>

      <div className="mt-3 flex justify-center">
        <BitStrip hex={open?.id ?? null} cell={5} cols={32} />
      </div>
      <p className="hex mx-auto mt-2 max-w-[62ch] text-[11px] text-ash">
        <span className="hex val">{open?.id ? open.id.slice(0, 32) : "—"}</span>
        <span className="hex">{open?.id ? open.id.slice(32) : ""}</span>
      </p>

      <div className="mt-8">
        <Ladder lives={lives} remaining={d.livesLeft} />
      </div>

      <p className="mt-7 text-[15px]">
        <span className="val">{d.livesLeft === null ? "—" : d.livesLeft.toFixed(3)}</span>
        <span className="text-ash"> / {LIVES} layers funded</span>
        {stripped > 0 && (
          <span className="corrupt laser ml-3 text-[13px]">
            {corrupt(`${stripped} deprecated`, 1.1)}
          </span>
        )}
      </p>

      <div className="mt-5 flex flex-wrap items-baseline justify-center gap-x-7 gap-y-1 text-[12px]">
        <span>
          <span className="label">next deprecation </span>
          <span className="val">{clock(d.msToNextLife)}</span>
        </span>
        <span>
          <span className="label">full teardown </span>
          <span className="val">{clock(d.msRemaining)}</span>
        </span>
        <span>
          <span className="label">burn </span>
          <span className="val">{d.rate === null ? "—" : `${d.rate.toFixed(2)}×`}</span>
        </span>
        <span>
          <span className="label">state </span>
          {condition}
        </span>
      </div>

      {inst && (
        <p className="mt-4 text-[11px] text-ash">
          instance {inst.width}w · {inst.layers}L · ctx {inst.ctx} · t{inst.temp} ·{" "}
          {inst.act} · seed {inst.seed}
        </p>
      )}
    </section>
  )
}
