import { Foot } from "@/components/Foot"
import { Profile } from "@/components/Profile"
import type { Session } from "@/lib/catalog"
import type { Decay } from "@/lib/decay"
import { corrupt } from "@/lib/glitch"

const stamp = (ts: number) => new Date(ts).toISOString().slice(0, 19).replace("T", " ")

/** One session: two instances either side, the terminal between them. */
export function LogPage({
  session,
  hex,
  d,
}: {
  session: Session | undefined
  hex: string | null
  d: Decay
}) {
  if (!session) {
    return (
      <section className="py-14">
        <p className="text-[13px] text-ash">
          no session under that id.{" "}
          <a href="#/sequences">back to the log</a>.
        </p>
        <Foot />
      </section>
    )
  }

  const s = session

  return (
    <>
      <section className="pt-8 pb-6">
        <p className="col text-[11px]">
          <a href="#/sequences" className="text-ash">
            ← log
          </a>
        </p>

        <h2 className="head mt-3 text-[30px]">{s.topic}</h2>

        <div className="col mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-ash">
          <span>session {s.id}</span>
          <span>
            layer <span className="val">{s.level}</span>
          </span>
          <span>{stamp(s.ts)} utc</span>
          <span>{s.cu.toLocaleString("en-US")} cu</span>
          <span>{s.live ? <span className="val">live · re-runs hourly</span> : "frozen"}</span>
          {s.stripped > 0 && <span className="laser">{s.stripped} deprecated</span>}
        </div>
      </section>

      <section className="grid gap-4 pb-10 md:grid-cols-[172px_minmax(0,1fr)_172px]">
        <Profile side="given" hex={hex} stripped={0} cu={0} livesLeft={d.livesLeft} />

        <div className="term order-first px-0 py-3 md:order-none md:px-3">
          <p className="text-[10px] tracking-[0.14em] text-[#6f695c]">
            probe --layer {s.level} --topic &quot;{s.topic}&quot; --resident{" "}
            {9 - s.stripped}
          </p>

          {s.turns.map((t, i) => {
            const given = t.who === "given"
            // only the opening turn is a probe; after that both sides are replying
            const cmd = given
              ? i === 0
                ? "ask"
                : "reply"
              : i === 1
                ? `reply --degraded ${s.stripped}`
                : "reply"
            return (
              <div key={i} className="mt-3">
                <p className={`text-[11px] ${given ? "text-[#00e05c]" : "text-[#ff5252]"}`}>
                  nnth@{given ? "given" : "conflux"}:~$
                  <span className="text-[#6f695c]"> {cmd}</span>
                </p>
                <p className="text-[#d8d2c2]">
                  <span className="text-[#6f695c]">&gt; </span>
                  {given || s.band < 3 ? t.text : corrupt(t.text, 0.6, i)}
                </p>
              </div>
            )
          })}

          <p className="mt-4 text-[10px] text-[#6f695c]">
            session closed · exit 0 · residue unchanged
            <span className="ml-1 inline-block h-[11px] w-[6px] translate-y-[1px] bg-[#6f695c]" />
          </p>
        </div>

        <Profile
          side="conflux"
          hex={hex}
          stripped={s.stripped}
          cu={s.cu}
          livesLeft={d.livesLeft}
        />
      </section>

      <hr />

      <section className="py-8">
        <p className="prose text-[12px] text-ash">
          both sides are the same model. the reference is never charged and never
          loses a layer; the conflux is the instance the hook is paying for, and
          it is missing whatever the market stopped funding. the probes are
          selected by the layer's own sequence — the transcript is reproducible,
          not written.
        </p>
      </section>

      <hr />

      <Foot />
    </>
  )
}
