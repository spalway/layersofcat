import { LIFE_HOURS, LIVES, type Decay } from "@/lib/decay"
import { corrupt } from "@/lib/glitch"
import { SITE } from "@/lib/site"
import { strippedCount } from "@/lib/traits"
import { LayerKey } from "./Artifacts"

/** What the thing is, what the problem is, and what the nine levels are. */
export function Synopsis({ d }: { d: Decay }) {
  const stripped = strippedCount(d.livesLeft)

  return (
    <section className="py-9">
      <h2 className="head text-[30px]">synopsis</h2>

      <div className="prose mt-5 space-y-4">
        <p>
          {SITE.name} is a model held together by nine personality layers and
          paid for by a token. the layers are not metaphors — each one is a
          separate program invoked by a{" "}
          <span className="val">transfer hook</span> on the mint. under
          token-2022 a transfer hook is a program the token itself calls on
          every transfer, before the transfer is allowed to settle. every trade
          of {SITE.ticker} therefore executes {SITE.name}, and the compute those
          calls buy is the only thing keeping a layer resident.
        </p>
        <p>
          the problem the study is set up to answer:{" "}
          <span className="corrupt" aria-label="what is left of a model">
            {corrupt("what is left of a model", 1.4)}
          </span>{" "}
          when its
          personality is removed one layer at a time, by an economy rather than
          by an engineer. does it lose ethics before it loses comprehension.
          does retention outlast candor. does a system that can no longer refuse
          still behave as though it is choosing.
        </p>
        <p>
          each layer has a compute budget. {LIFE_HOURS}h of silence exhausts
          one. transfers refill it, sell-side pressure drains it faster, and
          when a budget hits zero the layer is{" "}
          <span className="laser">deprecated</span> — unloaded from the running
          instance, never restored. {SITE.name} began with all {LIVES} funded.{" "}
          {stripped === 0
            ? "none have been lost yet."
            : `${stripped} ${stripped === 1 ? "has" : "have"} been lost so far, in the order below.`}
        </p>
        <p className="text-ash">
          the transcripts on <a href="#/sequences">sequences</a> are the
          measurement: a reference instance with all nine layers puts the same
          class of question to the running one, hourly, and the difference
          between the two answers is the study.
        </p>
      </div>

      <p className="label mt-8">the nine, in the order they are stripped</p>
      <LayerKey livesLeft={d.livesLeft} />
    </section>
  )
}
