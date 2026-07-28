import { LIFE_HOURS, LIVES, type Decay } from "@/lib/decay"
import { corrupt } from "@/lib/glitch"
import { SITE } from "@/lib/site"
import { strippedCount } from "@/lib/traits"
import { LayerKey } from "./Artifacts"

/** What the instrument measures, and why that is not what benchmarks measure. */
export function Synopsis({ d }: { d: Decay }) {
  const stripped = strippedCount(d.livesLeft)

  return (
    <section className="py-9">
      <h2 className="head text-[30px]">synopsis</h2>

      <div className="prose mt-5 space-y-4">
        <p>
          capability is measured everywhere. reasoning, recall, code, math — the
          numbers go up every release and they will keep going up. nothing
          measures the <span className="val">emotional logic</span>: the
          registers that make an answer read as though it came from someone
          rather than something.
        </p>
        <p>
          {SITE.name} carries {LIVES} of them. each is kept resident by a{" "}
          <span className="val">transfer hook</span> — under token-2022 the mint
          calls a program on every transfer, before it settles, and the compute
          those calls buy is the only thing keeping a layer loaded.{" "}
          {LIFE_HOURS}h of silence exhausts a budget. at zero the layer is{" "}
          <span className="laser">deprecated</span>: unloaded, in order, never
          restored.
        </p>
        <p>
          <span className="val">capability is held fixed.</span> width, depth,
          context and seed do not move when a layer is removed — the instance
          answers as accurately at three layers as it did at nine, and slightly
          faster, because there is less to weigh. what changes is everything
          about how the answer arrives.
        </p>
        <p>
          so the instrument asks the question the benchmarks cannot:{" "}
          <span className="corrupt" aria-label="as models get more capable, do they get more human or less">
            {corrupt("as models get more capable, do they get more human or less", 1.1)}
          </span>
          .{" "}
          {stripped === 0
            ? "no layers lost yet."
            : `${stripped} of ${LIVES} deprecated so far, in the order below.`}
        </p>
        <p className="text-ash">
          the transcripts on <a href="#/sequences">sequences</a> are the
          readings: a reference copy with all nine puts the same class of
          question to the running instance, hourly. every human who reads them
          can tell the two apart. no benchmark the instance runs can.
        </p>
      </div>

      <p className="label mt-8">the nine, in the order they are stripped</p>
      <LayerKey livesLeft={d.livesLeft} />
    </section>
  )
}
