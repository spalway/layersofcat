import { DEMO, SITE } from "@/lib/site"

export function Foot() {
  return (
    <footer className="py-9">
      <p className="label">mint</p>
      <p className="mt-2 hex text-[12px]">
        {DEMO ? (
          <span className="text-ash">pending</span>
        ) : (
          <span className="val">{SITE.mint}</span>
        )}
      </p>

      <p className="mt-6 text-[12px]">
        <a href={SITE.links.x} target="_blank" rel="noreferrer noopener">
          {SITE.handle}
        </a>
      </p>

      <p className="mt-8 text-[11px] text-ash">
        {SITE.name} {SITE.ticker} · figures derived from public chain state and
        sha-256 · not advice
      </p>
    </footer>
  )
}
