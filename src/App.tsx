import { useEffect, useMemo } from "react"
import { Masthead } from "./components/Masthead"
import { SLOT_MS, findSession, sessions as buildSessions } from "./lib/catalog"
import { computeDecay, condition } from "./lib/decay"
import { useRoute } from "./lib/route"
import { lives as buildLives } from "./lib/sequence"
import { SITE } from "./lib/site"
import { useChain } from "./lib/useChain"
import { useSequences } from "./lib/useSequences"
import { DecayPage } from "./pages/Decay"
import { LogPage } from "./pages/Log"
import { SequencesPage } from "./pages/Sequences"

export default function App() {
  const route = useRoute()
  const { snapshot, now } = useChain()
  const { ids } = useSequences(SITE.mint)
  const decay = computeDecay(snapshot, now)
  const lives = buildLives(ids, decay, snapshot?.pairCreatedAt ?? null)

  // log pages invert the whole site; the token overrides live on <html>
  useEffect(() => {
    const root = document.documentElement
    if (route.page === "log") root.setAttribute("data-log", "")
    else root.removeAttribute("data-log")
    return () => root.removeAttribute("data-log")
  }, [route.page])

  const openLevel = lives.find((l) => l.state === "open")?.index ?? 0
  const slot = Math.floor(now / SLOT_MS)
  const sessions = useMemo(
    () => buildSessions(ids, openLevel, (level) => lives[level - 1]?.opensAt ?? null, now),
    // sessions only turn over on the hour, not on every tick
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ids, openLevel, slot],
  )

  return (
    <div
      className={`mx-auto w-full px-5 pb-14 ${
        route.page === "log" ? "max-w-[1040px]" : "max-w-[680px]"
      }`}
    >
      <Masthead route={route} />
      <hr className="mt-6" />

      {route.page === "sequences" && (
        <SequencesPage lives={lives} d={decay} sessions={sessions} now={now} />
      )}

      {route.page === "log" && (
        <LogPage
          session={findSession(sessions, route.id)}
          hex={ids[Number.parseInt(route.id.split("-")[0] ?? "1", 10) - 1] ?? null}
          d={decay}
        />
      )}

      {route.page === "decay" && (
        <DecayPage d={decay} lives={lives} condition={condition(decay, snapshot)} />
      )}
    </div>
  )
}
