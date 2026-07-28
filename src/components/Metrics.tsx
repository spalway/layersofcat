import { useMetrics } from "@/lib/useMetrics"

const usd = (n: number | null): string => {
  if (n === null) return "—"
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}b`
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}m`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`
  return `$${n.toFixed(2)}`
}

const price = (n: number | null): string => {
  if (n === null) return "—"
  if (n >= 1) return `$${n.toFixed(4)}`
  return `$${n.toPrecision(3)}`
}

const count = (n: number | null): string =>
  n === null ? "—" : n.toLocaleString("en-US")

/** Token metrics, top of every page. Birdeye when live, placeholder before. */
export function Metrics() {
  const { metrics } = useMetrics()
  const m = metrics

  const rows: Array<[string, string, string?]> = [
    ["price", price(m?.priceUsd ?? null)],
    ["mcap", usd(m?.marketCap ?? null)],
    ["vol 24h", usd(m?.volume24h ?? null)],
    ["holders", count(m?.holders ?? null)],
  ]

  return (
    <div className="mt-4 flex flex-wrap items-baseline justify-center gap-x-6 gap-y-1 text-[12px]">
      {rows.map(([k, v]) => (
        <span key={k}>
          <span className="label">{k} </span>
          <span className="val">{v}</span>
        </span>
      ))}
      {m?.priceChange24h !== null && m?.priceChange24h !== undefined && (
        <span
          className={
            m.priceChange24h === 0 ? "label" : m.priceChange24h > 0 ? "val" : "laser"
          }
        >
          {m.priceChange24h > 0 ? "+" : ""}
          {m.priceChange24h.toFixed(2)}%
        </span>
      )}
    </div>
  )
}
