import { instance, params } from "@/lib/model"
import { present } from "@/lib/catalog"
import { LAYERS, composition } from "@/lib/traits"

interface ProfileProps {
  side: "given" | "conflux"
  hex: string | null
  /** layers deprecated for this side — always 0 for the reference */
  stripped: number
  cu: number
  livesLeft: number | null
}

/** One of the two instances, as a card. */
export function Profile({ side, hex, stripped, cu, livesLeft }: ProfileProps) {
  const conflux = side === "conflux"
  const inst = hex ? instance(hex) : null
  const kept = present(conflux ? stripped : 0)
  const bands = composition(hex, conflux ? livesLeft : null, conflux)

  const rows: Array<[string, string]> = [
    ["resident", `${kept.length} of 9`],
    ["width", inst ? String(inst.width) : "—"],
    ["depth", inst ? String(inst.layers) : "—"],
    ["ctx", inst ? String(inst.ctx) : "—"],
    ["temp", inst ? inst.temp : "—"],
    ["act", inst ? inst.act : "—"],
    ["seed", inst ? `0x${inst.seed}` : "—"],
    ["θ", inst ? params(inst).toLocaleString("en-US") : "—"],
    ["charged", conflux ? `${cu.toLocaleString("en-US")} cu` : "0 cu"],
  ]

  return (
    <aside className="panel px-0 py-3 text-left md:px-3">
      <span
        className={`plate mx-auto block size-[64px] overflow-hidden ${
          conflux ? "inverted" : ""
        }`}
      >
        <img
          src="/nth_decay.gif"
          alt=""
          aria-hidden
          width={422}
          height={366}
          className={`avatar block h-full w-full object-cover ${conflux ? "mirror" : ""}`}
        />
      </span>

      <p className={`mt-3 text-[12px] ${conflux ? "laser" : "val"}`}>
        nnth
        <br />
        {conflux ? "active decompositional conflux" : "given state"}
      </p>
      <p className="mt-1 text-[11px] text-ash">
        {conflux ? "running · charged per transfer" : "reference · never charged"}
      </p>

      <div className="mt-3 flex h-[10px] w-full overflow-hidden">
        {bands.map((b) => (
          <span key={b.layer.index} style={{ width: `${b.weight * 100}%`, background: b.layer.color }} />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-[3px]">
        {LAYERS.map((l) => {
          const gone = conflux && l.index <= stripped
          return (
            <span
              key={l.index}
              title={`${l.trait}${gone ? " · deprecated" : ""}`}
              className="inline-block size-[9px]"
              style={{ background: gone ? "var(--color-hollow)" : l.color }}
            />
          )
        })}
      </div>

      <table className="mt-3 w-full">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <td className="k px-0 text-[11px] text-ash">{k}</td>
              <td className="n px-0 text-[11px]">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {conflux && stripped > 0 && (
        <p className="mt-3 text-[10px] text-ash">
          absent: {LAYERS.slice(0, stripped).map((l) => l.trait).join(", ")}
        </p>
      )}
    </aside>
  )
}
