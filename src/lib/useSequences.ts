import { useEffect, useState } from "react"
import { LIVES } from "./decay"
import { allSequences, residueChain } from "./sequence"

export interface Digests {
  ids: Array<string | null>
  residues: Array<string | null>
}

const empty = (): Digests => ({
  ids: Array.from({ length: LIVES }, () => null),
  residues: Array.from({ length: LIVES }, () => null),
})

/** Digests the nine preimages and the residue chain once per mint. */
export function useSequences(mint: string): Digests {
  const [digests, setDigests] = useState<Digests>(empty)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const ids = await allSequences(mint)
      const residues = await residueChain(ids)
      if (!cancelled) setDigests({ ids, residues })
    })()
    return () => {
      cancelled = true
    }
  }, [mint])

  return digests
}
