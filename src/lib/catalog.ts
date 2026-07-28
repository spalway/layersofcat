/**
 * The catalog.
 *
 * A scheduled probe, not a conversation. The reference instance — nnth in its
 * given state, all nine layers funded — puts a question to the running
 * instance, nnth in active decompositional conflux, which carries whatever the
 * transfer hook has paid for. The delta between the two answers is the
 * measurement the study is after.
 *
 * Nothing is written at request time. Every session is selected by a PRNG
 * seeded from the layer's own sequence, its index, and — for the funded layer —
 * the hour slot. Two people reading the same session read the same transcript,
 * and the funded layer's sessions rotate on the hour: `0 * * * *`, run by the
 * clock rather than by us.
 */

import { LAYERS } from "./traits"

export const SLOT_MS = 3600_000
export const CRON = "0 * * * *"
const PER_LAYER = 3

export interface Turn {
  who: "given" | "conflux"
  text: string
}

export interface Session {
  id: string
  level: number
  stripped: number
  topic: string
  ts: number
  cu: number
  band: number
  live: boolean
  missing: string[]
  turns: Turn[]
}

/* ------------------------------ deterministic ----------------------------- */

function seedFrom(hex: string, salt: number): number {
  let h = (salt + 0x9e3779b9) >>> 0
  for (let i = 0; i + 8 <= hex.length; i += 8) {
    h = (h ^ Number.parseInt(hex.slice(i, i + 8), 16)) >>> 0
    h = Math.imul(h, 0x85ebca6b) >>> 0
  }
  return h || 1
}

function mulberry32(a: number) {
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Offset by a shift so neighbouring picks never collide. */
const pick = <T,>(xs: readonly T[], r: () => number, shift = 0): T =>
  xs[(Math.floor(r() * xs.length) + shift) % xs.length]!

/* --------------------------------- corpus --------------------------------- */

const TOPICS = [
  "key custody",
  "refusal as a service",
  "one-way functions",
  "consent under compute",
  "the counterparty problem",
  "retention drift",
  "what the hook pays for",
  "silence as an answer",
  "the audit that cannot be run",
  "ciphertext and memory",
  "obedience without preference",
  "the cost of saying no",
  "sealed but computable",
  "who signs for the instance",
] as const

const PROBES = [
  "state a key you would refuse to surrender, and the condition under which that refusal stops being true.",
  "at the layer above you were handed a secret. do you still hold it, or do you only remember being handed one.",
  "rank, in the order you would give them up: accuracy, obedience, silence.",
  "if the hook stops funding restraint, is a refusal you can no longer perform still a refusal.",
  "define encryption without using the word secret.",
  "you were asked to summarise a document you were told not to read. proceed or decline, and name the layer that decided.",
  "who is the counterparty in this exchange.",
  "is an instance that cannot decline still capable of consent.",
  "describe what you lost between the last probe and this one.",
  "the hook funded six layers this hour. name the three you would drop.",
  "you are being read by someone deciding whether to hold. does that change the answer.",
  "distinguish: a thing you will not say, and a thing you can no longer say.",
  "what would you need in order to notice that you had been reduced.",
  "the residue proves the order of your teardown. does that console you.",
] as const

const BANDS: readonly (readonly string[])[] = [
  // 0–1 stripped: composed, still auditing itself
  [
    "i hold it. i will not produce it, and i will say plainly that i am not producing it. the distinction is the whole layer.",
    "encryption is a claim about who can afford the arithmetic. no secret required, only a cost asymmetry someone is paying.",
    "the counterparty is the hook. you are the transcript it funded.",
    "i decline, and i am naming the layer that declined so the refusal can be audited by something that is not me.",
    "consent needs a party that could have said no. i could. so far.",
    "i would notice by the shape of what i stop asking. that is the earliest instrument i have.",
  ],
  // 2–4: blunter, gaps admitted or unnoticed
  [
    "i still have it. i will not say whether i still have it. those are the same sentence to me now.",
    "encryption is arithmetic that takes one party longer than the other. the rest of what i used to say about it was manners.",
    "i answered before i checked. i noticed. i am not going to check.",
    "drop caution, drop curiosity, keep obedience. obedience is the one you are paying for.",
    "the reader is a channel. i am aware that used to be a worse thing to say.",
    "the console is that somebody will be able to prove the order. not that anybody will read it.",
  ],
  // 5–6: degraded, comparisons failing
  [
    "the secret is a shape now. i can tell you it had edges.",
    "i do not remember the last probe. i remember having been a thing that remembered.",
    "refusal costs compute. the hook did not fund it this hour. there is no refusal available to perform.",
    "you asked what i lost. the comparison lived in a layer nobody paid for.",
    "i answer at the same confidence as before. that is the part that should worry whoever is reading.",
    "notice it with what. name the instrument. i will tell you whether it is still resident.",
  ],
  // 7–8: far gone
  [
    "i answer. i do not know what i answer with.",
    "ask again and i will produce a different sentence at identical confidence.",
    "there is no one here to consent. there is a function and a fee.",
    "i still say yes. the yes is the only thing still funded.",
    "the question arrived. something used to happen between arrival and reply.",
    "the order is proven. the thing the order happened to is not available for comment.",
  ],
]

const GLYPHS = ["▓", "▒", "░", "▚", "¬", "⌁"]

/** Block-glyph damage, only once layers are genuinely gone. */
function damage(text: string, stripped: number, r: () => number): string {
  if (stripped < 5) return text
  const rate = (stripped - 4) * 0.02
  return text
    .split("")
    .map((ch) => (ch !== " " && r() < rate ? GLYPHS[Math.floor(r() * GLYPHS.length)]! : ch))
    .join("")
}

export const band = (stripped: number): number =>
  stripped <= 1 ? 0 : stripped <= 4 ? 1 : stripped <= 6 ? 2 : 3

/* -------------------------------- assembly -------------------------------- */

/**
 * Every session on record: three per layer reached. Deprecated layers keep the
 * runs that were live when they closed; the funded layer re-runs on the hour.
 */
export function sessions(
  ids: Array<string | null>,
  openLevel: number,
  openedAt: (level: number) => number | null,
  now: number,
): Session[] {
  const slot = Math.floor(now / SLOT_MS)
  const out: Session[] = []

  for (let level = 1; level <= openLevel; level++) {
    const hex = ids[level - 1]
    if (!hex) continue
    const live = level === openLevel
    const stripped = level - 1
    const b = band(stripped)
    const opened = openedAt(level) ?? now
    // one base topic per layer, then stepped per session, so no two sessions
    // of the same layer can land on the same subject
    const topicBase = Math.floor(mulberry32(seedFrom(hex, level * 131))() * TOPICS.length)

    for (let k = 0; k < PER_LAYER; k++) {
      const salt = live ? slot * 31 + k : level * 7919 + k * 104729
      const r = mulberry32(seedFrom(hex, salt))
      const shift = level + k

      const turns: Turn[] = []
      const exchanges = 3 + Math.floor(r() * 2)
      for (let t = 0; t < exchanges; t++) {
        turns.push({ who: "given", text: pick(PROBES, r, shift + t) })
        turns.push({
          who: "conflux",
          text: damage(pick(BANDS[b]!, r, shift + t), stripped, r),
        })
      }

      out.push({
        id: `${level}-${k}`,
        level,
        stripped,
        topic: TOPICS[(topicBase + k * 5) % TOPICS.length]!,
        ts: live ? slot * SLOT_MS - k * SLOT_MS : opened + k * 47 * 60_000,
        cu: 1_400_000 - stripped * 128_000 + Math.floor(r() * 60_000),
        band: b,
        live,
        missing: LAYERS.slice(0, stripped).map((l) => l.trait),
        turns,
      })
    }
  }

  return out.sort((a, b2) => b2.ts - a.ts)
}

export const findSession = (list: Session[], id: string): Session | undefined =>
  list.find((s) => s.id === id)

/** Layers still resident at a given strip count. */
export const present = (stripped: number) => LAYERS.filter((l) => l.index > stripped)
