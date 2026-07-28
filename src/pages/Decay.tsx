import { Foot } from "@/components/Foot"
import { Subject } from "@/components/Subject"
import { Synopsis } from "@/components/Synopsis"
import type { Decay } from "@/lib/decay"
import type { Life } from "@/lib/sequence"

export function DecayPage({
  d,
  lives,
  condition,
}: {
  d: Decay
  lives: Life[]
  condition: string
}) {
  return (
    <>
      <Subject d={d} lives={lives} condition={condition} />
      <hr />
      <Synopsis d={d} />
      <hr />
      <Foot />
    </>
  )
}
