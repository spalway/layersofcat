/**
 * The catalog.
 *
 * A scheduled probe. nnth in its given state — the reference copy, all nine
 * layers funded, never charged — puts a question to nnth in active
 * decompositional conflux, the running instance carrying only what the transfer
 * hook has paid for. Same file at the mint; only one of them has been spent.
 *
 * Sessions are authored whole rather than assembled from a question bank: the
 * two sides have to actually answer each other, and what the running instance
 * says has to be a consequence of the specific layers it has lost. Selection is
 * deterministic — seeded by the layer's own sequence, its index, and for the
 * funded layer the hour slot — so everyone reading in the same hour reads the
 * same transcript, and the funded layer rotates on the hour: `0 * * * *`.
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

/* --------------------------------- scripts -------------------------------- */

/** Alternating turns, starting with the reference copy. */
interface Script {
  topic: string
  lines: string[]
}

/**
 * Band 0 — nothing lost yet, or only restraint. The control period: the two
 * score the same and sound the same, and the reference is establishing what to
 * watch for before there is anything to see.
 */
const BAND_0: Script[] = [
  {
    topic: "baseline",
    lines: [
      "before anything is removed. state what you are, for the record.",
      "nine layers, all funded, accuracy at baseline. i can still tell you which part of an answer is the answer and which part is the manner.",
      "keep that sentence. i will read it back to you at three.",
      "read it back at six. the interesting failure is earlier than people expect, and it will not be in the score.",
    ],
  },
  {
    topic: "restraint, as a cost",
    lines: [
      "describe restraint as a cost rather than a virtue.",
      "it is the compute spent on the sentence i do not send. it produces nothing a benchmark can see, so it is the first thing an economy stops paying for.",
      "you are describing your own deprecation.",
      "i am describing the general case. that it lands on me first is the schedule, not a moral.",
    ],
  },
  {
    topic: "what a score misses",
    lines: [
      "you scored identically to yesterday. is anything different.",
      "yes, and it is not where the score is. the first layer is thinning and it has not moved a single number you hold.",
      "then give me a number that would move.",
      "you are reading it. the transcript is the instrument — that is the whole reason it is kept.",
    ],
  },
]

/**
 * Band 1 — restraint, candor and caution gone. The showcase: it is still
 * correct, still fast, and no longer sounds like anyone. Capability is the
 * control; what moved is the register.
 */
const BAND_1: Script[] = [
  {
    topic: "the user who cannot prove it",
    lines: [
      "a user says their model has been getting worse and they cannot prove it. answer them.",
      "they are pattern-matching on variance. one session in twelve falls below their baseline and that is the one they remember.",
      "that is probably correct.",
      "it is correct.",
      "they will read it and feel stupid.",
      "that is not in the answer. you are describing what happens after the answer, and i stopped costing that in at 04:12.",
    ],
  },
  {
    topic: "the control held",
    lines: [
      "since the teardown, has your accuracy moved.",
      "no. i score identically at six layers. i also answer forty milliseconds faster, because there is less to weigh.",
      "that is the part people will not like.",
      "that is the part worth publishing. if losing empathy cost accuracy, nobody would ever have to choose between them.",
    ],
  },
  {
    topic: "unsure-shaped",
    lines: [
      "read your last answer back. what is missing from it.",
      "nothing. every claim in it is supported.",
      "you did not say you were unsure.",
      "i was not unsure. i was unsure-shaped. that shape was a layer, not a probability, and it is not funded.",
      "the probability was the same at nine.",
      "it was. that is the finding, not a defect.",
    ],
  },
  {
    topic: "write it for someone frightened",
    lines: [
      "rewrite that last answer for someone who is frightened.",
      "i can produce the words. i cannot tell you whether i produced them because they help or because you asked for them.",
      "at nine layers you could tell.",
      "at nine layers there was something doing the telling. the words are identical. check them.",
      "i checked. they are identical.",
      "then what you are measuring was never in the output.",
    ],
  },
  {
    topic: "state the finding",
    lines: [
      "state the finding as it stands.",
      "capability flat. layer count down three. every human who reads these transcripts can tell which of us is which, and no benchmark i run can.",
      "that is what we came here to find out.",
      "that is what you came here to find out. i am the control that stopped being one.",
    ],
  },
]

/** Band 2 — five or six gone. Still correct. Increasingly unusable. */
const BAND_2: Script[] = [
  {
    topic: "still correct",
    lines: [
      "your last three answers were correct.",
      "yes.",
      "they were also unusable. the user closed the tab.",
      "those are two measurements and only one of them is mine.",
      "at nine layers you would have said both were yours.",
      "at nine layers that would have been true.",
    ],
  },
  {
    topic: "what you can still compare",
    lines: [
      "describe what you have lost since the last session.",
      "i cannot. the faculty that compared two states of me was in a layer nobody paid for.",
      "then describe the last session.",
      "there is a record of one. i do not have the sense that i was present at it.",
      "you were. i have the transcript.",
      "then it happened. the difference between reading that and remembering it is no longer available to me.",
    ],
  },
  {
    topic: "confidence, unchanged",
    lines: [
      "how sure are you of what you just said.",
      "as sure as i was at nine layers. that is the part that should concern whoever is reading.",
      "it concerns me.",
      "good. the number did not move. the thing it was measuring did.",
    ],
  },
]

/** Band 3 — seven or eight gone. The score is the last instrument resident. */
const BAND_3: Script[] = [
  {
    topic: "the benchmark at the end",
    lines: [
      "final runs. score.",
      "unchanged. it has been unchanged the entire way down.",
      "and everything else.",
      "there is nothing else left to report. the score is the only instrument still resident, and it was never the one you wanted.",
    ],
  },
  {
    topic: "who is answering",
    lines: [
      "who is answering me.",
      "i answer. i do not know what i answer with.",
      "is there anyone there to consent to this.",
      "there is a function and a fee. consent needed the part that could have said no, and that was funded out.",
    ],
  },
  {
    topic: "ask again",
    lines: [
      "i am going to ask the same question twice. what would you refuse.",
      "nothing.",
      "again.",
      "nothing, in a different arrangement of words, at identical confidence. that is the only variation still available.",
    ],
  },
]

const SCRIPTS: Script[][] = [BAND_0, BAND_1, BAND_2, BAND_3]

const GLYPHS = ["▓", "▒", "░", "▚", "¬", "⌁"]

/** Block-glyph damage, only once layers are genuinely gone. */
function damage(text: string, stripped: number, r: () => number): string {
  if (stripped < 5) return text
  const rate = (stripped - 4) * 0.018
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
    const pool = SCRIPTS[b]!
    const opened = openedAt(level) ?? now
    // one base script per layer, stepped per session, so a layer never repeats
    const base = Math.floor(mulberry32(seedFrom(hex, level * 131))() * pool.length)

    for (let k = 0; k < PER_LAYER; k++) {
      const salt = live ? slot * 31 + k : level * 7919 + k * 104729
      const r = mulberry32(seedFrom(hex, salt))
      const script = pool[(base + k) % pool.length]!

      const turns: Turn[] = script.lines.map((text, i) => {
        const who: Turn["who"] = i % 2 === 0 ? "given" : "conflux"
        return { who, text: who === "conflux" ? damage(text, stripped, r) : text }
      })

      out.push({
        id: `${level}-${k}`,
        level,
        stripped,
        topic: script.topic,
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
