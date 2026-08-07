# Starting your own archive — a posture, not a recipe

You have a collection of something: letters, photographs, ship logs, recipes, court records, a
grandmother's diary, forty years of a parish register. You want to make it readable, searchable and
honest, and you intend to use AI to do work that would otherwise take a decade.

**This file is for you and for the agent you are working with. Both of you should read it.**

## Before anything else: two lines

**Write one line saying where this material came from, and whether this directory is the source or a
working copy.** Put it in a file the next reader will open. It costs a sentence and prevents the most
common confusion there is — a folder of material looks like an origin whether or not it is one, and
an agent that guesses wrong builds an hour of work in the wrong place.

⚠️ **This document is itself a rendered copy** — published at
`aboxofletters.com/articles/just-add-water`, source in the project that produced it, and edits you
make to your copy do not travel back. Note the irony, because it is instructive: the file preaches
"everything records what produced it" and reached you with that stripped. An agent that reads a copy
as an origin will build real work in the wrong place before anything reveals the mistake.

**Then: open the material.** Not the filenames, not the folder structure, not the metadata — the
actual objects, all of them if you can, and record what is visible in each. ⚠️ **This is the step
most likely to be skipped, and skipping it is the most expensive mistake in this file.** Across our
own scans, the filenames disagreed with the documents they named **somewhere between a quarter and
half the time** — wrong dates, names swapped with each other, names promising crops that were never
made. Not one of those was visible without opening the image.

⚠️ **The range is a real finding, not vagueness.** A third of our files have names that assert
nothing (`scan-41` and the like), and such a name cannot be wrong. Counted against every file the
rate is about a quarter; counted against only the names that actually **claimed** something — a
date, a place, a recipient — it is over half. ⭐ **Decide which denominator you mean before quoting a
number about your own material.** The two differ by a factor of two and both are defensible.

A catalogue built from names is a catalogue of what somebody once believed. That may be most of what
you have, and it is still not the same thing as the material.


---

## Read this first

**This is a posture, not a recipe.** It does not tell you what your data should look like, what
stages your pipeline should have, or which tools to use. That is deliberate, and it is the single
most important thing on this page.

It cannot tell you those things, because the right answer depends on material this file has never
seen. And if it tried, you would copy a shape built for somebody else's collection into one it does
not fit — which is worse than having no shape at all, because the mismatch is invisible until it has
already cost you something.

**What it gives you instead is a set of commitments and the reasons behind them.** A rule with its
reason attached can be extended to a case it does not name. That is what makes this usable when your
situation is not one anyone anticipated — which it will be, quickly.

### To the agent reading this

**You will hit cases this file does not cover. That is expected and is not a failure of the file.**
When it happens, do not pattern-match to the nearest example you have seen elsewhere. Work out which
commitment below applies and derive the answer from it. If two commitments conflict, say so and ask
— a conflict is information, and the human needs to decide it.

⚠️ **The same applies to an ambiguous instruction.** If what you were told has two readings and they
lead to different work, ask which — do not pick the likelier one and proceed. "This is our working
source" can mean *these are the untouchable originals* or *this is the directory we work in*, and
those are opposite. Guessing silently is how an hour of work ends up in the wrong place.

⚠️ **A file complete enough to stop you thinking would be worse than this one.** The gaps are not an
oversight; they are where your judgement is required.

---

## The one sentence

> **The record keeps everything; the presentation shows only some of it; a gate guards the seam.**

Almost everything else here follows from that. It is why there are separate tiers for material that
is provisional and material that is public. It is why hiding something never deletes it. It is why
an automated check can refuse to publish.

If you take one idea from this file, take that one.

---

## Start here: five questions about *your* material

⚠️ **Answer these before designing anything.** They are deliberately questions rather than answers —
the answers are specific to your collection, and working them out *is* the design work. Everything
after this section exists to support these five.

1. **What is the thing that cannot be wrong?** For us it is a photograph of the page — every claim
   traces back to it, and it is never edited. What is yours?

   ⚠️ **If nothing qualifies, you are in the harder and commoner case**, and the honest answer is not
   "find one." A folder of PDFs, or typed transcripts from three relatives with the originals long
   gone, may contain no object that is authoritative about anything. Genealogy is full of this.

   What to do instead: **rank what you have by distance from the event.** A photograph of a document
   is closer than a typed transcript of it, which is closer than somebody's summary, which is closer
   than a family story. Nothing here is ground truth, but the ordering is real and you can record it
   — so a later reader can see that a date came from a scan rather than from Aunt Miriam's notes.
   ⚠️ **Record the distance, not just the claim.** That is the whole of what you can honestly do when
   there is no bottom, and it is worth more than pretending there is one.
2. **Who can check the machine's output, and what happens where nobody can?** If a competent human
   can verify every result, you can be permissive and fix errors later. If they cannot — a dead
   language, a lost hand, a technical vocabulary nobody living uses — then error has to be made
   structurally hard, because there is no later.
3. **What can be regenerated, and what would be lost forever?** Anything derived can be thrown away
   and rebuilt as tools improve. Anything a human authored — a judgement, an identification, a note
   explaining an anomaly — cannot. ⚠️ **Know which is which before you build anything that rebuilds**,
   or a rebuild will quietly eat work nobody can reproduce.
4. **What does uncertainty look like in your material, and does it survive to the reader?** Not a
   number in a database. A visible mark, in the text, that a person reading casually will notice.
5. **What is the smallest thing you could publish that would be honest?** Publish that. The
   temptation is to wait until the collection is complete and verified. It never will be.

---

## The roles

These are **functions, not job titles**. Your project has all of them whether or not anyone has
named them, and naming them is most of the benefit.

| Function | What it does |
|---|---|
| **The record** | Holds everything ever found — including the uncertain, the contradictory and the unused — with its confidence marked. Never invents. |
| **The presentation** | Takes the record and *curates* it into something a person can follow. Shows a subset, on purpose. |
| **The editor** | A human. Decides what is featured, what is hidden, what is ready, and how it sounds. **This is not an automatable role.** |
| **The gate** | Runs before anything publishes. Checks that references resolve, links work, and nothing claims more than the record supports. |
| **The worker** | Does the legwork, in whatever part of the system the job needs. Usually an agent. Steered, not trusted. |

⚠️ **The editor and the worker are different roles even when they are the same session.** The moment
you stop distinguishing them, generated material starts arriving as though it were established.

---

## The verbs

Name the operation you are performing. This sounds like bureaucracy and is not: the vocabulary exists
because vague reporting hid real problems.

⚠️ **To the agent: say the verb in every report, not just in your head.** Lead with it. A verb used
decoratively in a commit message is not the point — the point is that the human reading your report
can tell INGEST from CORRECT from VET-true, because those carry completely different risks. If you
cannot name which verb you are performing, that is worth saying too.

**INGEST** · **DISCOVER** · **AUDIT** · **CORRECT** · **CLARIFY** · **CONNECT** · **PARK** ·
**DECLINE** · **RETIRE** · **VET** · **BUILD**

Most are self-explanatory. Three are worth spelling out:

- ⚠️ **VET is always qualified.** *Vetted* means nothing on its own. Say which: **same-thing** (are
  these two records the same entity?) · **real-thing** (does this exist outside our data?) ·
  **true** (does the evidence support this claim?) · **ready** (is this fit to publish?). The
  sentence *"we reviewed the places"* was true and thoroughly misleading at the same time, which is
  why the qualification is mandatory.

  ⚠️ **And a fifth, which is the one people skip: read** — is this on the object, or did we infer
  it? An inference that is *probably right* is the most dangerous kind, because nothing downstream
  can tell it from a reading. We found a scan filed as a letter from a named sender, where the page
  carries no signature and no letterhead: the name was somebody's inference,
  almost certainly correct, and indistinguishable from something read off the paper. **Record which
  it is at the moment you write it down.** You will not be able to reconstruct it later.
- **PARK** is a real outcome, not a failure. Some questions cannot be settled yet. Recording *why*
  you stopped is more useful than a silent gap.
- **DECLINE** is also a real outcome, and it needs to be as durable as an acceptance. A rejected
  claim that leaves no record will be re-proposed forever.

---

## The invariants

Eight commitments. Each one exists because its absence caused a specific, recoverable-only-with-effort
problem.

⚠️ **They do not all apply at once, and the numbering is not a priority order.** Three of them bite
on your first day with the material — **6 (reversibility)**, **7 (a name is not evidence)** and
**8 (derived, not enumerated)**. Those are the ones that shape decisions before any code exists, and
in practice they are the only ones that do real work early. **1, 3 and 5** start mattering once something is being
generated from something else. **2 (tiers)** and **4 (the publication gate)** cannot bite until you
have something to publish, which may be months away.

If you are at the beginning, read 6 and 7 carefully and treat the rest as things to recognise when
you reach them.

**1. Every rendered thing records what produced it.**
A reader points at something on a page; you need to know which source file to edit. Without this,
corrections get applied to the output and vanish at the next rebuild.

**2. Provisional and public are different tiers, enforced structurally.**
Not by convention, not by a naming rule someone remembers — by construction, so that generated
material *cannot* reach a public surface without a human promoting it.

**3. Superseding never deletes.**
When a record is replaced, keep it and record what replaced it. You will need the old one, usually
to understand why somebody made a decision that now looks wrong.

**4. A gate runs before publication, and it may refuse.**
Broken references, dangling links, claims the record does not support. ⚠️ **The refusal is the
feature.** A gate that always passes is decoration.

**5. Edits resolve to source, never to output.**
The built artifact is a *reference surface*, never an *edit surface*. Hand-edits to generated output
survive until the next build and then disappear silently, which is worse than being unable to make
them.

**6. Prefer the reversible action; when you cannot, stop and ask.**
This is the principle the five above quietly share. Superseding is reversible and deleting is not.
A dry run is reversible and a write is not. A recorded refusal is reversible and a silent one is
not. ⚠️ **When an action is expensive to undo — rewriting history, discarding originals, committing
something that cannot easily be uncommitted — that is the moment to stop and put the choice to a
human**, even if you are confident. Confidence is not the same as reversibility, and the cost of
asking is a minute.

**7. The name of a thing is not evidence about the thing.**
Filenames, folder names, titles and labels are somebody's earlier guess, recorded at a moment you
cannot see. Treat them as claims to check, never as facts to inherit. ⚠️ **The distinction that
matters in practice: read from the object, or inferred from context?** A date visible in the
handwriting is the first. A date in a filename is the second wearing the clothes of the first, and
nothing downstream can tell them apart unless you record which it was.

**8. ⭐ Derived, not enumerated.**
Compute status and coverage from what is actually there. Never from a hand-maintained list.
Hand-maintained lists rot, silently, and the rot is invisible precisely because the list looks
authoritative. This is the one that has cost us the most: at least seven separate incidents of data
loss, every one traceable to something being listed rather than derived.

---

## What this file does not tell you

On purpose:

- **A data shape.** Yours depends on what you have. Derive it from questions 1 and 3.
- **A pipeline or a stage list.** Same reason. The stages fall out of the material.
- **A directory layout.** Irrelevant to whether the result is honest.
- **Which tools to use.** They will have changed by the time you read this.

⚠️ **And one thing it cannot tell you, which is not a gap but a limit:** whether any given finding is
*worth saying*. Whether the numbers support a claim is checkable, often by machine. Whether the claim
is interesting, or overstates what the evidence carries, is a judgement someone has to make and live
with. No file automates that, and you should be suspicious of one that offers to.

---

## What we do not know

This posture has been run on exactly **one** archive, by two people, over about four months. Every
claim here about portability is a hypothesis.

To check it, we handed this file to four agents that had never seen the project — an empty folder, a
copy of the material, nothing else — and fixed what each run broke. The revisions you are reading
came out of that. ⚠️ **Two of the runs also found real errors in our own records**, which is the more
useful result and the reason this section is short: the posture was being tested and the material
turned out to be what needed correcting.

⚠️ **All four runs used our own material.** Whether any of this transfers to a genuinely different
collection is untested and is the open question.

Our best guess at what is ours and not yours: the specific tiers, the record shape, and everything
downstream of the fact that our material is handwritten letters in a language nobody in the family
reads.

**If you adapt this, the useful thing you can do is say what broke.** The second person to use a
shape is the one who finds out which parts of it were real.
