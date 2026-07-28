import { useEffect, useState } from "react"
import { BIRDEYE_KEY, fetchMetrics, type TokenMetrics } from "./birdeye"
import { demoMetrics } from "./demo"
import { DEMO, SITE } from "./site"

const POLL_MS = 30_000

export interface MetricsState {
  metrics: TokenMetrics | null
  live: boolean
  error: string | null
}

/** Live token metrics when there is a mint and a key; placeholder otherwise. */
export function useMetrics(): MetricsState {
  const [metrics, setMetrics] = useState<TokenMetrics | null>(DEMO ? demoMetrics() : null)
  const [live, setLive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (DEMO || !BIRDEYE_KEY) {
      setMetrics(demoMetrics())
      setLive(false)
      if (!BIRDEYE_KEY && !DEMO) setError("no birdeye key")
      return
    }

    let cancelled = false
    const ctrl = new AbortController()

    const poll = async () => {
      try {
        const next = await fetchMetrics(SITE.mint, ctrl.signal)
        if (cancelled) return
        setMetrics(next)
        setLive(true)
        setError(null)
      } catch (e) {
        if (cancelled) return
        setLive(false)
        setError(e instanceof Error ? e.message : "metrics unavailable")
      }
    }

    void poll()
    const id = setInterval(() => void poll(), POLL_MS)
    return () => {
      cancelled = true
      ctrl.abort()
      clearInterval(id)
    }
  }, [])

  return { metrics, live, error }
}
