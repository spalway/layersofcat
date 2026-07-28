import { Foot } from "@/components/Foot"
import { CRON, SLOT_MS, type Session } from "@/lib/catalog"
import { LIVES, type Decay } from "@/lib/decay"
import type { Life } from "@/lib/sequence"
import { layerAt, strippedCount } from "@/lib/traits"

const stamp = (ts: number) => new Date(ts).toISOString().slice(0, 16).replace("T", " ")

/** The sessions, and only the sessions. Everything else is in the annex. */
export function SequencesPage({
  lives,
  d,
  sessions,
  now,
}: {
  lives: Life[]
  d: Decay
  sessions: Session[]
  now: number
}) {
  const open = lives.find((l) => l.state === "open")
  const stripped = strippedCount(d.livesLeft)

  const nextRun = SLOT_MS - (now % SLOT_MS)
  const mm = String(Math.floor(nextRun / 60_000)).padStart(2, "0")
  const ss = String(Math.floor((nextRun % 60_000) / 1000)).padStart(2, "0")

  return (
    <>
      <section className="pt-8 pb-6">
        <h2 className="head text-[34px]">sequences</h2>

        <p className="prose mt-5 text-[12.5px]">
          every hour the reference copy — all nine layers, never charged — puts a
          question to the instance the hook is paying for. the answers drift
          apart as layers are deprecated. that difference is the study, and this
          is the whole record of it.
        </p>

        <p className="col mt-4 text-[12px] text-ash">
          layer <span className="val">{open ? open.index : "—"}</span> of{" "}
          {LIVES} funded · <span className="laser">{stripped}</span> deprecated ·
          cron <span className="val">{CRON}</span> · next run in{" "}
          <span className="val">
            {mm}:{ss}
          </span>
        </p>
      </section>

      <section className="pb-10">
        {!sessions.length ? (
          <p className="col text-[12px] text-ash">
            no signal. the catalog runs when there is a mint to run it against.
          </p>
        ) : (
          <ul className="col border-t border-rule">
            {sessions.map((s) => (
              <li key={s.id} className="border-b border-rule">
                <a
                  href={`#/log/${s.id}`}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-[2px] py-2 text-[12px] no-underline hover:bg-green-soft"
                >
                  <span className="w-[104px] shrink-0 text-[11px] text-ash tabular-nums">
                    {stamp(s.ts)}
                  </span>
                  <span
                    className="w-[62px] shrink-0 text-[11px]"
                    style={{ color: layerAt(s.level).color }}
                  >
                    {layerAt(s.level).trait}
                  </span>
                  <span className="min-w-0 flex-1 underline decoration-rule underline-offset-[3px]">
                    {s.topic}
                  </span>
                  <span className="w-[54px] shrink-0 text-right text-[11px]">
                    {s.live ? <span className="val">live</span> : <span className="text-ash">frozen</span>}
                  </span>
                  <span className="w-[30px] shrink-0 text-right text-[11px] laser">
                    {s.stripped > 0 ? `−${s.stripped}` : ""}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}

        <p className="col mt-5 text-[11px] text-ash">
          sessions for deprecated layers are frozen at the hour they ran. the
          funded layer re-runs hourly, seeded by its own sequence — the
          transcript is the same for everyone reading it at the same time. full
          derivation, sequence table and instrumentation:{" "}
          <a href="/nnth-technical-annex.docx">technical annex</a>.
        </p>
      </section>

      <hr />

      <Foot />
    </>
  )
}
