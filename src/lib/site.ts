import { DEMO_MINT } from "./demo"

const envMint = (import.meta.env.VITE_MINT as string | undefined)?.trim() || ""

/** No mint configured (or VITE_DEMO=1) → the page runs on placeholder data. */
export const DEMO = !envMint || import.meta.env.VITE_DEMO === "1"

/** Rename / relink here before launch. */
export const SITE = {
  name: "nnth",
  title: "nnth's decay",
  tagline: "~ 9 levels, 9 lives ~",
  ticker: "$nnth",
  mint: envMint || DEMO_MINT,
  handle: "@9decay9",
  links: {
    x: "https://x.com/9decay9",
  },
} as const

export const HELIUS_KEY = (import.meta.env.VITE_HELIUS_KEY as string | undefined)?.trim() || ""
