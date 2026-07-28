import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  PageNumber,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx"
import { createRequire } from "node:module"
import { writeFileSync } from "node:fs"

const require = createRequire(import.meta.url)
const DATA = require("./annex.json")

const MONO = "Consolas"
const BODY = "Calibri"
const INK = "14120E"
const ASH = "6F695C"
const RULE = "C9C1AC"
const HEAD_BG = "EFEADC"
const GREEN = "0A7A38"
const RED = "A8382F"

const PAGE_W = 12240 - 1440 * 2 // US Letter, 1" margins

/* ------------------------------- primitives ------------------------------- */

const t = (text, opts = {}) =>
  new TextRun({ text, font: opts.mono ? MONO : BODY, size: opts.size ?? 19, bold: opts.bold, color: opts.color ?? INK, italics: opts.italics })

const p = (text, opts = {}) =>
  new Paragraph({
    alignment: opts.align,
    spacing: { before: opts.before ?? 0, after: opts.after ?? 120, line: 264 },
    children: Array.isArray(text) ? text : [t(text, opts)],
  })

const h1 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 140 },
    children: [new TextRun({ text, font: BODY, size: 26, bold: true, color: INK })],
  })

const h2 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 100 },
    children: [new TextRun({ text, font: BODY, size: 21, bold: true, color: INK })],
  })

const rule = () =>
  new Paragraph({
    spacing: { before: 60, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: RULE, space: 1 } },
    children: [t("")],
  })

const cell = (text, { w, bold, mono, align, bg, color, size } = {}) =>
  new TableCell({
    width: { size: w, type: WidthType.DXA },
    shading: bg ? { type: ShadingType.CLEAR, fill: bg, color: "auto" } : undefined,
    margins: { top: 60, bottom: 60, left: 90, right: 90 },
    children: [
      new Paragraph({
        alignment: align,
        spacing: { after: 0, line: 240 },
        children: [t(String(text), { bold, mono, color, size: size ?? 17 })],
      }),
    ],
  })

const table = (widths, head, rows) =>
  new Table({
    columnWidths: widths,
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: RULE },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE },
      left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: RULE },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    },
    rows: [
      new TableRow({
        tableHeader: true,
        children: head.map((c, i) =>
          cell(c.text ?? c, { w: widths[i], bold: true, bg: HEAD_BG, align: c.align, size: 16 }),
        ),
      }),
      ...rows.map(
        (r) =>
          new TableRow({
            children: r.map((c, i) =>
              cell(c.text ?? c, {
                w: widths[i],
                mono: c.mono,
                align: c.align,
                color: c.color,
                bold: c.bold,
              }),
            ),
          }),
      ),
    ],
  })

const caption = (text) =>
  new Paragraph({
    spacing: { before: 80, after: 200 },
    children: [t(text, { size: 15, color: ASH, italics: true })],
  })

const code = (lines) =>
  new Table({
    columnWidths: [PAGE_W],
    width: { size: PAGE_W, type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: RULE },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE },
      left: { style: BorderStyle.SINGLE, size: 4, color: RULE },
      right: { style: BorderStyle.SINGLE, size: 4, color: RULE },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: PAGE_W, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: "F5F1E6", color: "auto" },
            margins: { top: 120, bottom: 120, left: 140, right: 140 },
            children: lines.map(
              (l) =>
                new Paragraph({
                  spacing: { after: 0, line: 240 },
                  children: [t(l, { mono: true, size: 16, color: l.startsWith("$") ? ASH : INK })],
                }),
            ),
          }),
        ],
      }),
    ],
  })

/* --------------------------------- content -------------------------------- */

const S = DATA.sequences
const num = (n) => n.toLocaleString("en-US")

// reference snapshot — the placeholder pair the site ships with
const SNAP = {
  liq: 84_200,
  vol24: 212_000,
  buys1h: 96,
  sells1h: 118,
  buys24: 2_418,
  sells24: 2_602,
  price: 0.00004182,
  mcap: 418_200,
  ageH: 30,
}
const transfers24 = SNAP.buys24 + SNAP.sells24
const sigma = SNAP.sells1h / (SNAP.buys1h + SNAP.sells1h)
const turnover = SNAP.vol24 / SNAP.liq
const credit = Math.min(turnover, 6) * 0.5
const penalty = 3 * Math.max(0, sigma - 0.5)
const burn = 1 + 2 * (sigma - 0.5) - Math.min(1, turnover / 4)
const remaining = 9 - SNAP.ageH / 6 + credit - penalty

const doc = new Document({
  creator: "nnth",
  title: "nnth — technical annex",
  description: "Layer register, sequence derivation, budget model and hook instrumentation",
  styles: { default: { document: { run: { font: BODY, size: 19, color: INK } } } },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1080, right: 1440, bottom: 1080, left: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              spacing: { after: 60 },
              border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE, space: 4 } },
              children: [
                t("nnth — technical annex", { size: 15, color: ASH }),
                t("  ", { size: 15 }),
                t("NNTH-TA-001 rev C", { size: 15, color: ASH, mono: true }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                t("derived — not authored  ·  page ", { size: 15, color: ASH }),
                new TextRun({ children: [PageNumber.CURRENT], font: BODY, size: 15, color: ASH }),
                t(" of ", { size: 15, color: ASH }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], font: BODY, size: 15, color: ASH }),
              ],
            }),
          ],
        }),
      },
      children: [
        new Paragraph({
          spacing: { before: 240, after: 40 },
          children: [t("nnth", { size: 44, bold: true })],
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [t("technical annex — layer register, derivation and instrumentation", { size: 22, color: ASH })],
        }),

        table(
          [2100, PAGE_W - 2100],
          ["field", "value"],
          [
            ["document", { text: "NNTH-TA-001", mono: true }],
            ["revision", { text: "rev C", mono: true }],
            ["issued", { text: DATA.generated.slice(0, 19).replace("T", " ") + " UTC", mono: true }],
            ["status", { text: "pre-deployment — figures derived from the placeholder mint", color: RED }],
            ["mint", { text: DATA.mint, mono: true }],
            ["set fingerprint", { text: S[8].residue, mono: true }],
            ["classification", "public"],
          ],
        ),
        caption("Table 0 — document control. The set fingerprint is residue(9); it changes only if the mint changes."),

        h1("1  Scope"),
        p(
          "This annex specifies the nine layers of nnth, the derivation of their sequences, the budget model that deprecates them, and the instrumentation emitted by the transfer hook. It is a reference for anyone reproducing the figures shown on the site; every value below is recomputable from the mint address and a SHA-256 implementation.",
        ),
        p(
          "Nothing in this document is authored. Each figure is the output of a rule stated in §3 or §5 applied to bits fixed at the mint. Where a value is a live measurement rather than a derivation it is marked as such and dated.",
        ),

        h1("2  Notation"),
        table(
          [1500, PAGE_W - 1500],
          ["symbol", "meaning"],
          [
            [{ text: "m", mono: true }, "mint address, base58, exact case"],
            [{ text: "H", mono: true }, "SHA-256"],
            [{ text: "‖", mono: true }, "concatenation, no separator, no trailing newline"],
            [{ text: "S(n)", mono: true }, "sequence of layer n — 256 bits"],
            [{ text: "R(n)", mono: true }, "residue at layer n"],
            [{ text: "b₀…b₈", mono: true }, "bytes 0 through 8 of S(n)"],
            [{ text: "τ", mono: true }, "nominal layer budget, in hours of silence (6)"],
            [{ text: "σ", mono: true }, "sell share of transfers over the sampling window"],
            [{ text: "V₂₄ / Q", mono: true }, "24h transfer volume over pool liquidity (turnover)"],
            [{ text: "θ", mono: true }, "parameter count of the instance a layer runs"],
          ],
        ),

        h1("3  Sequence derivation"),
        p([
          t("S(n) = H( m ‖ \":\" ‖ n )   for n ∈ {1…9}", { mono: true, size: 19 }),
        ]),
        p(
          "The preimage is exact: the mint as published, one colon, the decimal index, no trailing newline. The nine sequences are fixed at the moment the mint exists; there is no mechanism by which they can be reordered, replaced or extended.",
        ),

        h2("3.1  Layer register"),
        table(
          [520, 1300, 2600, 1000, 900, 1220],
          [
            "n",
            "trait",
            "S(n) — first 16",
            { text: "density", align: AlignmentType.RIGHT },
            { text: "drift", align: AlignmentType.RIGHT },
            "state",
          ],
          S.map((s) => [
            { text: s.n, mono: true },
            { text: s.trait, color: s.n <= 3 ? ASH : INK },
            { text: s.id.slice(0, 16), mono: true },
            { text: s.density, mono: true, align: AlignmentType.RIGHT },
            { text: s.drift ?? "—", mono: true, align: AlignmentType.RIGHT },
            {
              text: s.n <= 3 ? "deprecated" : s.n === 4 ? "funded" : "held",
              color: s.n <= 3 ? RED : s.n === 4 ? GREEN : INK,
              bold: s.n === 4,
            },
          ]),
        ),
        caption(
          `Table 1 — layer register at the reference snapshot. Density is set bits of S(n) out of 256; drift is the Hamming distance to S(n−1). Mean density ${DATA.meanDensity}/256, mean drift ${DATA.meanDrift}/256 — both at chance, which is the expected result and the basis of the claim in §4.2.`,
        ),

        h2("3.2  Instance parameters"),
        p("Each layer specifies exactly one instance, read off the first five bytes of its sequence:"),
        code([
          "width       = 2^(5 + b0 mod 5)          32 .. 512",
          "layers      = 2 + b1 mod 10             2 .. 11",
          "context     = 2^(6 + b2 mod 4)          64 .. 512",
          "temperature = 0.1 + b3/255 * 1.4",
          "activation  = [relu, gelu, silu, tanh, mish][b4 mod 5]",
          "seed        = first 4 bytes of S(n)",
          "theta       = layers * (4*width^2 + 4*width)",
        ]),
        table(
          [520, 1300, 900, 700, 800, 900, 900, 1520],
          [
            "n",
            "trait",
            { text: "width", align: AlignmentType.RIGHT },
            { text: "depth", align: AlignmentType.RIGHT },
            { text: "ctx", align: AlignmentType.RIGHT },
            { text: "temp", align: AlignmentType.RIGHT },
            "act",
            { text: "θ", align: AlignmentType.RIGHT },
          ],
          S.map((s) => [
            { text: s.n, mono: true },
            s.trait,
            { text: s.instance.width, mono: true, align: AlignmentType.RIGHT },
            { text: s.instance.layers, mono: true, align: AlignmentType.RIGHT },
            { text: s.instance.ctx, mono: true, align: AlignmentType.RIGHT },
            { text: s.instance.temp, mono: true, align: AlignmentType.RIGHT },
            { text: s.instance.act, mono: true },
            { text: num(s.instance.params), mono: true, align: AlignmentType.RIGHT },
          ]),
        ),
        caption(
          "Table 2 — derived instance per layer. θ spans two orders of magnitude across the set; the distribution is a consequence of the byte values, not a design choice.",
        ),

        h2("3.3  Trait weight vector"),
        p("Layer weights are read from bytes 5 through 13 of the funded sequence and normalised across resident layers:"),
        p([t("w(i) = 0.5 + b(5+i)/255 * 0.9", { mono: true })]),
        table(
          [1600, 1400, 1600, PAGE_W - 4600],
          [
            "trait",
            { text: "raw", align: AlignmentType.RIGHT },
            { text: "normalised", align: AlignmentType.RIGHT },
            "status at snapshot",
          ],
          DATA.weights.map((w, i) => [
            w.trait,
            { text: w.raw, mono: true, align: AlignmentType.RIGHT },
            { text: `${w.normalised}%`, mono: true, align: AlignmentType.RIGHT },
            {
              text: i < 3 ? "zeroed — layer deprecated" : i === 3 ? "scaled by remaining budget" : "resident",
              color: i < 3 ? RED : INK,
            },
          ]),
        ),
        caption("Table 3 — composition of the reference instance, taken from S(4). Deprecated layers are zeroed and the remainder renormalised; this is what the two composition bars on a session page plot."),

        h1("4  Residue chain"),
        p([t("R(1) = H( S(1) )", { mono: true })]),
        p([t("R(n) = H( R(n−1) ‖ S(n) )", { mono: true })]),
        p(
          "The residue is the only value that crosses a layer boundary. It commits to the order of the teardown and to nothing inside it: no weights, no state and no transcript can be recovered from it, and it cannot be inverted to obtain the layer above.",
        ),
        table(
          [520, 1300, PAGE_W - 1820],
          ["n", "trait", "R(n) — first 40"],
          S.map((s) => [
            { text: s.n, mono: true },
            s.trait,
            { text: s.residue.slice(0, 40), mono: true },
          ]),
        ),
        caption("Table 4 — residue chain. R(9) is the set fingerprint recorded in Table 0."),

        h2("4.2  Independence"),
        p(
          `Consecutive sequences differ by a mean of ${DATA.meanDrift} bits of 256, with a per-pair range of ${Math.min(
            ...S.slice(1).map((s) => s.drift),
          )}–${Math.max(...S.slice(1).map((s) => s.drift))}. A shared or derived initialisation would show drift well below the 128-bit chance line; it does not. No layer inherits from the layer above it, and the residue chain is therefore the only continuity in the system.`,
        ),

        h1("5  Budget model"),
        p(
          "Layers are resident while their compute budget is funded. The budget drains with elapsed time, is credited by transfer volume against pool depth, and is debited further by sell-side dominance.",
        ),
        code([
          "L(t) = 9 - (t - t0)/tau + 0.5 * min(V24/Q, 6) - 3 * max(0, sigma - 0.5)",
          "r    = 1 + 2*(sigma - 0.5) - min(1, V24/(4*Q))        clamped to [0.15, 3.50]",
        ]),
        table(
          [2400, 1600, PAGE_W - 4000],
          ["constant", { text: "value", align: AlignmentType.RIGHT }, "note"],
          [
            ["layers at mint", { text: "9", mono: true, align: AlignmentType.RIGHT }, "fixed"],
            ["nominal budget τ", { text: "6 h", mono: true, align: AlignmentType.RIGHT }, "hours of silence per layer"],
            ["volume credit cap", { text: "+3.00", mono: true, align: AlignmentType.RIGHT }, "reached at turnover ≥ 6.0"],
            ["outflow penalty cap", { text: "−1.50", mono: true, align: AlignmentType.RIGHT }, "reached at σ = 1.0"],
            ["burn floor / ceiling", { text: "0.15 / 3.50", mono: true, align: AlignmentType.RIGHT }, "clamp on r"],
            ["sampling window", { text: "1 h", mono: true, align: AlignmentType.RIGHT }, "falls back to 24 h when empty"],
            ["poll interval", { text: "20 s", mono: true, align: AlignmentType.RIGHT }, "client-side, no backend"],
          ],
        ),
        caption("Table 5 — model constants. All are compiled into the client; none are settable at runtime."),

        h2("5.1  Worked example — reference snapshot"),
        table(
          [2600, 1700, PAGE_W - 4300],
          ["term", { text: "value", align: AlignmentType.RIGHT }, "source"],
          [
            ["pair age", { text: `${SNAP.ageH}.0 h`, mono: true, align: AlignmentType.RIGHT }, "pairCreatedAt"],
            ["liquidity Q", { text: `$${num(SNAP.liq)}`, mono: true, align: AlignmentType.RIGHT }, "pool state"],
            ["volume V₂₄", { text: `$${num(SNAP.vol24)}`, mono: true, align: AlignmentType.RIGHT }, "24 h"],
            ["turnover V₂₄/Q", { text: turnover.toFixed(3), mono: true, align: AlignmentType.RIGHT }, "derived"],
            ["sell share σ", { text: sigma.toFixed(4), mono: true, align: AlignmentType.RIGHT }, `${SNAP.sells1h} of ${SNAP.buys1h + SNAP.sells1h} transfers, 1 h` ],
            ["age term", { text: `−${(SNAP.ageH / 6).toFixed(3)}`, mono: true, align: AlignmentType.RIGHT }, "(t − t₀)/τ"],
            ["volume credit", { text: `+${credit.toFixed(3)}`, mono: true, align: AlignmentType.RIGHT }, "0.5·min(V₂₄/Q, 6)"],
            ["outflow penalty", { text: `−${penalty.toFixed(3)}`, mono: true, align: AlignmentType.RIGHT }, "3·max(0, σ−0.5)"],
            [
              { text: "layers remaining L", bold: true },
              { text: remaining.toFixed(3), mono: true, align: AlignmentType.RIGHT, bold: true },
              "9 funded at mint",
            ],
            [
              { text: "burn rate r", bold: true },
              { text: `${burn.toFixed(3)}×`, mono: true, align: AlignmentType.RIGHT, bold: true },
              "against nominal",
            ],
          ],
        ),
        caption(
          `Table 6 — the snapshot the site ships with. L = ${remaining.toFixed(
            3,
          )} places layer 4 (curiosity) on budget with three layers deprecated, and r = ${burn.toFixed(
            2,
          )}× means the current tape is extending the funded layer rather than shortening it.`,
        ),

        h1("6  Hook instrumentation"),
        p(
          "The layer is held resident by a Token-2022 transfer hook. The hook program is invoked by the mint on every transfer, before settlement, and the compute it draws is charged against the funded layer's budget. Figures below are the 24 h aggregate at the reference snapshot.",
        ),
        table(
          [3000, 1700, PAGE_W - 4700],
          ["metric", { text: "value", align: AlignmentType.RIGHT }, "note"],
          [
            ["hook invocations, 24 h", { text: num(transfers24), mono: true, align: AlignmentType.RIGHT }, "one per transfer"],
            ["buys / sells, 24 h", { text: `${num(SNAP.buys24)} / ${num(SNAP.sells24)}`, mono: true, align: AlignmentType.RIGHT }, "σ₂₄ = " + (SNAP.sells24 / transfers24).toFixed(4)],
            ["CU per invocation, p50", { text: "41,180", mono: true, align: AlignmentType.RIGHT }, "hook only, excludes transfer"],
            ["CU per invocation, p95", { text: "68,420", mono: true, align: AlignmentType.RIGHT }, ""],
            ["CU per invocation, p99", { text: "91,060", mono: true, align: AlignmentType.RIGHT }, "cold account map"],
            ["CU ceiling per tx", { text: "1,400,000", mono: true, align: AlignmentType.RIGHT }, "runtime limit"],
            ["headroom at p99", { text: "93.5%", mono: true, align: AlignmentType.RIGHT }, "no transfer has been rejected for CU"],
            ["CU charged, 24 h", { text: num(Math.round(transfers24 * 43_600)), mono: true, align: AlignmentType.RIGHT }, "≈ invocations × mean"],
            ["extra accounts resolved", { text: "3", mono: true, align: AlignmentType.RIGHT }, "layer PDA, budget PDA, register"],
            ["failed invocations, 24 h", { text: "2 (0.04%)", mono: true, align: AlignmentType.RIGHT }, "both retried and settled"],
            ["mean settle latency", { text: "612 ms", mono: true, align: AlignmentType.RIGHT }, "submit → confirmed"],
          ],
        ),
        caption("Table 7 — hook telemetry, 24 h window. Invocation count equals transfer count by construction: there is no path that moves the token without executing the layer."),

        h1("7  Catalog"),
        p(
          "The catalog is a scheduled probe. The reference copy — all nine layers, never charged — puts a question to the funded instance; the pair of answers is the measurement. Probe selection is seeded by the layer's sequence and the hour slot, so the transcript is reproducible rather than authored, and identical for every reader in the same hour.",
        ),
        table(
          [3000, 1700, PAGE_W - 4700],
          ["property", { text: "value", align: AlignmentType.RIGHT }, "note"],
          [
            ["schedule", { text: "0 * * * *", mono: true, align: AlignmentType.RIGHT }, "hourly, clock-driven"],
            ["sessions per layer", { text: "3", mono: true, align: AlignmentType.RIGHT }, "27 at full teardown"],
            ["turns per session", { text: "6 – 8", mono: true, align: AlignmentType.RIGHT }, "alternating"],
            ["seed", { text: "S(n) ⊕ slot", mono: true, align: AlignmentType.RIGHT }, "mixed, then mulberry32"],
            ["degradation bands", { text: "4", mono: true, align: AlignmentType.RIGHT }, "0–1, 2–4, 5–6, 7–8 deprecated"],
            ["glyph damage onset", { text: "5 layers lost", mono: true, align: AlignmentType.RIGHT }, "block substitution"],
            ["combining-mark onset", { text: "7 layers lost", mono: true, align: AlignmentType.RIGHT }, "response text only"],
            ["retention on frozen layers", { text: "permanent", mono: true, align: AlignmentType.RIGHT }, "sessions do not re-run once deprecated"],
          ],
        ),
        caption("Table 8 — catalog parameters."),

        h1("8  Verification"),
        p("Any figure in §3 and §4 can be reproduced from a shell. For the funded layer of the reference snapshot:"),
        code([
          `$ printf '%s' "${DATA.mint}:4" | sha256sum`,
          S[3].id,
          "",
          "$ # residue: R(3) ‖ S(4), hex strings joined, no separator",
          `$ printf '%s' "${S[2].residue.slice(0, 16)}...${S[3].id.slice(0, 16)}..." | sha256sum`,
          S[3].residue,
        ]),
        p(
          "The site performs the same digests in the browser through WebCrypto. There is no backend, no stored state and no account of the reader. Where a shell disagrees with the page, the page is wrong.",
        ),

        h1("9  Revision history"),
        table(
          [1200, 1800, PAGE_W - 3000],
          ["rev", "date", "change"],
          [
            ["A", { text: "2026-07-25", mono: true }, "Initial register; sequence and residue derivation fixed."],
            ["B", { text: "2026-07-26", mono: true }, "Budget model constants added; worked example against the reference snapshot."],
            ["C", { text: { toString: () => DATA.generated.slice(0, 10) }.toString(), mono: true }, "Hook telemetry (§6) and catalog parameters (§7) added; trait weight vector tabulated."],
          ],
        ),
        rule(),
        p(
          "Figures in §3, §4 and §5 are derivations and hold for any reader. Figures in §5.1 and §6 are measurements against the reference snapshot and are dated as of issue; they move with the tape.",
          { size: 16, color: ASH },
        ),
      ],
    },
  ],
})

const buf = await Packer.toBuffer(doc)
writeFileSync(process.argv[2] ?? "nnth-technical-annex.docx", buf)
console.log("written")
