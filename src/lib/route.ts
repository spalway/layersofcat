import { useEffect, useState } from "react"

export type Route =
  | { page: "decay" }
  | { page: "sequences" }
  | { page: "log"; id: string }

function read(): Route {
  const raw = window.location.hash.replace(/^#\/?/, "")
  if (raw.startsWith("log/")) return { page: "log", id: raw.slice(4) }
  if (raw === "sequences") return { page: "sequences" }
  return { page: "decay" }
}

/** Hash routing: no server rewrites, works on any static host. */
export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(read)

  useEffect(() => {
    const on = () => {
      setRoute(read())
      window.scrollTo(0, 0)
    }
    window.addEventListener("hashchange", on)
    return () => window.removeEventListener("hashchange", on)
  }, [])

  return route
}
