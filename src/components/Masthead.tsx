import type { Route } from "@/lib/route"
import { SITE } from "@/lib/site"
import { Metrics } from "./Metrics"

/** Title, then the two pages under it. Nothing else lives up here. */
export function Masthead({ route }: { route: Route }) {
  const link = (page: Route["page"]) =>
    route.page === page ? "text-ink no-underline" : "text-ash"

  return (
    <header className="pt-10">
      <h1 className="display text-[44px]">{SITE.title}</h1>
      <p className="mt-2 text-[12px] tracking-[0.14em] text-ash">{SITE.tagline}</p>

      <nav className="mt-4 flex items-baseline justify-center gap-6 text-[12px]">
        <a href="#/" className={link("decay")}>
          decay
        </a>
        <a
          href="#/sequences"
          className={route.page === "decay" ? "text-ash" : "text-ink no-underline"}
        >
          sequences
        </a>
        <a href={SITE.links.x} target="_blank" rel="noreferrer noopener" className="text-ash">
          x
        </a>
      </nav>

      <Metrics />
    </header>
  )
}
