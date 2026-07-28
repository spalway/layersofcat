import { useState } from "react"
import { DEMO, SITE } from "@/lib/site"

/**
 * The only red on the page. Click to copy — and while the site is running on
 * placeholder data there is nothing to copy, so it stays pending rather than
 * handing out an address that does not exist.
 */
export function Contract() {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    if (DEMO) return
    try {
      await navigator.clipboard.writeText(SITE.mint)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={DEMO ? "not deployed yet" : SITE.mint}
      className="laser mx-auto mt-5 block max-w-full text-[12px] tracking-[0.06em] hover:underline"
    >
      ca:{" "}
      {DEMO ? "pending" : copied ? "copied" : `${SITE.mint.slice(0, 6)}…${SITE.mint.slice(-6)}`}
      {!DEMO && <span className="ml-2 text-[10px] opacity-70">click to copy</span>}
    </button>
  )
}
