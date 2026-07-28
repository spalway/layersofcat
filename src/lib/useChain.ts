import { useEffect, useRef, useState } from "react"
import { fetchSnapshot, type Snapshot } from "./chain"
import { demoSnapshot } from "./demo"
import { DEMO, SITE } from "./site"

const POLL_MS = 20_000

export interface ChainState {
  snapshot: Snapshot | null
  error: string | null
  loading: boolean
  /** ticks every second so countdowns move between polls */
  now: number
}

export function useChain(): ChainState {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(!DEMO)
  const [now, setNow] = useState(Date.now())
  const prevRef = useRef<Snapshot | null>(null)

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    // placeholder mode: no network, invented figures, real clock
    if (DEMO) {
      const set = () => setSnapshot(demoSnapshot(Date.now()))
      set()
      const id = setInterval(set, POLL_MS)
      return () => clearInterval(id)
    }

    let cancelled = false
    const ctrl = new AbortController()

    const poll = async () => {
      try {
        const next = await fetchSnapshot(SITE.mint, ctrl.signal)
        if (cancelled) return
        prevRef.current = next
        setSnapshot(next)
        setError(null)
        setLoading(false)
      } catch (e) {
        if (cancelled) return
        setLoading(false)
        setError(e instanceof Error ? e.message : "signal lost")
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

  return { snapshot, error, loading, now }
}
