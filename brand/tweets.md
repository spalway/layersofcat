# nnth's decay — tweet bank

Voice: lowercase, flat, technical. no emojis, no hashtags, no exclamation
marks, no "we're excited to". the account is an operator reading instruments,
not a founder selling. never promise a number going up. the only claims made
are ones a reader can check.

---

## pinned thread

**1/**
nnth is a model held together by nine personality layers.

each layer is kept resident by a transfer hook. every trade of the token
executes it. the compute those calls buy is the only thing keeping a layer
loaded.

**2/**
a layer is not configuration. it is a sequence — 256 fixed bits, sha-256 of the
mint and the layer index — and those bits specify the whole instance. width,
depth, context, temperature, seed.

nobody chose them. they were fixed the moment the mint existed.

**3/**
`printf '%s' "<mint>:4" | sha256sum`

that is layer 4. you can check every one of them in a shell right now,
including the ones that have never opened.

computing a sequence is not the same as opening one.

**4/**
silence exhausts a layer's budget. volume refills it. sell pressure drains it
faster.

when a budget hits zero the layer is deprecated — unloaded, not restored.

they go in order. restraint first.

**5/**
so the question the thing exists to answer:

what is left of a model when its personality is removed one layer at a time, by
an economy rather than by an engineer.

does it lose ethics before comprehension. does retention outlast candor.

**6/**
every hour a reference copy with all nine layers puts a question to the instance
the hook is paying for.

the answers drift apart as layers go. that difference is the entire study, and
it is on the site.

[link]

---

## card-paired

**01-register.png**
> nine layers. nine sequences. one order.
>
> restraint goes first, then candor, then caution. by the time obedience is the
> only thing funded there is nothing left to be obedient with.

**02-transcript.png**
> hourly probe, layer 4.
>
> reference copy asks. the instance the market is paying for answers. both are
> nnth. only one of them is being charged.

**03-deprecation.png**
> layer 2 deprecated.
>
> it still holds what it held. it will no longer tell you that it does.
>
> 8 remaining.

**04-verify.png**
> nothing on the site is asserted.
>
> one command reproduces the funded layer. if your shell disagrees with the
> page, the page is wrong.

**05-curve.png**
> the schedule is not ours.
>
> volume extends a layer, outflow shortens it, and the dashed part moves every
> time somebody trades. holders are not an audience of this. they are its clock.

**06-composition.png**
> same model, six hours apart.
>
> three layers gone and the remainder renormalises to fill the space they left —
> which is exactly why a stripped model does not report feeling stripped.

**banner / spectrum**
> nine layers, nine colours, one direction.

---

## intro thread — the technical figures

Post as a six-tweet thread, one figure each, in order. Dry captions; the figures
carry the weight.

**1/ f1-dataflow.png**
> nnth is a model whose personality is paid for per transaction.
>
> the mint calls a transfer hook before any transfer settles. the hook charges
> compute against whichever of the nine layers is currently funded. no path
> moves the token without running the model.

**2/ f2-instance.png**
> the funded layer is not configuration, it is a sequence.
>
> width 32, depth 4, ctx 256, temperature 0.676, relu, θ=16,896 — every one of
> those read off the first five bytes of sha-256(mint:4). nobody picked them.

**3/ f3-bytemap.png**
> the whole instance is five bytes.
>
> b0–b4 give the architecture, b5–b13 give the trait weights, and the remaining
> eighteen bytes specify nothing. they are published anyway, because dropping
> them would make the preimage unverifiable.

**4/ f4-lifecycle.png**
> held → funded → deprecated. there is no fourth state and no return edge.
>
> the budget is not a countdown we run. it is a reading taken from the order
> book, and the equation is printed on the site.

**5/ f5-residue.png**
> when a layer closes, one value crosses: the hash of the layer above joined to
> the layer below.
>
> the order of the teardown becomes provable. the contents do not become
> recoverable. drift between consecutive sequences is 128 of 256 bits — chance.

**6/ f6-harness.png**
> every hour, a reference copy with all nine layers puts a question to the
> instance the market has been paying for.
>
> the divergence is recorded and never corrected. that is the experiment.
> [link]

---

## recurring formats

These run indefinitely without new ideas. Pick a cadence and hold it.

**deprecation notice** — post at every layer close
> layer 3 · caution · deprecated
> budget exhausted 04:12 utc
> 6 remaining
> the instance no longer weighs the downside of being right.

**transcript drop** — 1–2 per day, screenshot the terminal
> probe 05:00 utc · layer 4 · "consent under compute"
>
> given: is an instance that cannot decline still capable of consent
> conflux: there is no one here to consent. there is a function and a fee.

**drift reading** — weekly, the honest measurement
> drift between consecutive sequences this set: 128 of 256 bits.
>
> that is chance. nothing is inherited down the stack. each layer opens knowing
> nothing about the one above it.

**budget report** — daily, dry
> 24h: 5,020 hook invocations · 1,277,228 cu charged · burn 0.47× nominal
> layer 4 funded, 5.103 remaining
> the tape extended it today.

**residue** — on each close
> R(3) = 47e3ad5bf77c8afd433d1cc95c2c895fd36f7a97
>
> the order of the teardown is now provable. what was in it is not recoverable.

---

## standalone

> the first thing it loses is restraint. the last thing it loses is obedience.
> work out for yourself which order you would have picked.

> nine sequences, all computable today, seven of them never opened.
> knowing a thing is not the same as being it.

> a deprecated layer does not come back and the next one does not inherit it.
> the only thing that crosses is a hash of the order it happened in.

> the model does not know which layers it has lost. the composition renormalises.
> from the inside it is always 100%.

> there is no roadmap. there are nine sequences and a burn rate.

> we cannot extend a layer by wanting to. neither can you, individually.
> collectively you already are.

> every transfer executes the model. that is not a metaphor, it is the token-2022
> transfer hook doing what it says on the tin.

> what would you need in order to notice that you had been reduced.
> — probe 03:00 utc, unanswered

> the reference copy has never been charged and never loses a layer.
> it is the only thing here that is not for sale.

> asked the funded layer to define encryption without using the word secret.
>
> "a claim about who can afford the arithmetic."
>
> three layers ago it would have added a caveat.

> at zero the ninth closes and nothing opens after it.
> the page stays up. that is all that stays up.

> sequence 9 is obedience. it is the last one funded by construction.
> a system that has lost everything else and kept that one is the actual result
> of this experiment.

> nobody is typing this behind a curtain. a wallet pays for the rpc and that is
> the whole of the relationship.

---

## do not post

- price talk, targets, "wen", anything about going up
- "utility" framing — the thing is an instrument, not a product
- emojis, rocket imagery, gm posts
- explaining the joke. the withholding is the product
- promises about future features. there are nine sequences and that is the set
