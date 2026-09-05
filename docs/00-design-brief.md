# Design brief — Product designer portfolio website

**Status:** sections 1–6 confirmed. Five open questions remain (logged at the
bottom); none of them block starting information architecture.

This file is the source of truth. IA, tokens and screens all reference it. If a
later decision contradicts this brief, change the brief first.

---

## 1. Project context

A personal portfolio website for Samira Binte Hamid, a digital product designer
in Dhaka with ~5 years on enterprise and government systems (tax, ERP, HRM, CRM,
proptech) — Nexis 2021–2022, Mysoft Heaven 2023–2024, Apex DMIT 2024–present. See
[source material](01-source-material.md). It replaces the
current situation where the work is sent as attachments and links assembled per
application. The site exists to do one job: convert a cold screening into a
first conversation. It is being built now because the work is being evaluated by
people the designer never speaks to first — the screen happens before any
introduction, and right now there is nothing to screen. Greenfield: no existing
site, no components to inherit, no legacy URLs to preserve.

## 2. Target user

**Primary: a recruiter or talent sourcer.** Not a designer. Screening a stack of
candidates against a role spec, on a clock, often on a phone, often with the
page open for under a minute before a keep/discard call.

What they care about:

- Seniority and scope — is this person at the level the role needs.
- Domain — have they worked on this kind of product (B2B, consumer, data-heavy).
- Outcome — did the work ship, and did anything measurably change.
- Availability and location, so they do not waste a call.

What they do **not** care about:

- Tool logos, software proficiency bars, years-of-Figma.
- Design philosophy statements or a long personal narrative.
- Process diagrams, double diamonds, sticky-note photos.
- Visual flourish for its own sake — it does not register as signal to them.

**Secondary: the hiring manager or design lead** the recruiter forwards the link
to. This person is the one who reads deeply, and they are why the depth has to
exist at all.

### The central tension (read this before designing anything)

The primary user will not read a deep case study. The chosen emotional
target — confidence in your judgement — can only be produced *by* depth. These
pull in opposite directions, and resolving it is the design problem.

**Resolution: layered depth, one artefact.** The site is not written for the
recruiter *or* the lead; it is written so the same page serves both at different
reading depths. The first screen of every page must deliver seniority, domain
and outcome to someone who reads only headings. The reasoning sits underneath
for the person who scrolls. Nothing important may live only in the deep layer,
and the deep layer may not be a separate "detailed version" the visitor has to
choose. This is the site's governing principle; every layout decision gets
checked against it.

## 3. Emotional tone and design direction

**Revised 2026-09-05, at the designer's direction.** This section originally
specified confidence-through-restraint, with Stripe's documentation as the
reference. That was replaced with a warm, playful, personality-forward direction
modelled on benshih.design. The record of the change and its cost is kept below,
because the rest of the brief was written against the old tone.

**The feeling: warmth and approachability, then competence.** A visitor should
enjoy the page before they evaluate it, and come away thinking this is someone
they would want on the team — not only someone who can do the work.

**Reference: benshih.design.** Cream ground, pastel cards, heavy display type,
generous rounding, a handwritten-style note. It earns attention through
personality rather than through austerity.

Direction that follows from this:

- Bricolage Grotesque (heavy display sans) for headings; Plus Jakarta Sans for
  reading. Warm cream ground, deep teal action colour, five pastel card fills.
- Generous rounding and soft shadows. Cards, pills and chips over rules and lists.
- Real artefacts — actual screens, actual data — over abstract process graphics.
- Specific numbers wherever they exist. "Cut onboarding drop-off from 41% to
  22%" carries the tone; "improved the onboarding experience" destroys it.

**What this costs, recorded honestly.** The primary user in §2 is a recruiter
screening at speed, and the argument in §2 was that specificity produces
confidence. A decorative direction does not serve that reader as directly as the
restrained one did, and it works for the reference site partly because its author
has a name-brand employer and a public following supplying credibility that this
site does not yet have. The mitigation is that the *content* rules are unchanged:
outcome numbers on every card, reasoning in every case study, no barriers. If the
site underperforms on the §6 metrics, the tone is the first thing to re-examine.

Not adopted from the reference: password-gated case studies (violates the
no-barriers constraint in §5), and Talks / Writing / Indie-apps sections (no
content to fill them, and empty sections are what make this style read as thin).

## 4. Functional requirements

1. **State** seniority, domain and current availability within the first screen
   of the home page, readable without scrolling on a 390px-wide phone.
2. **Present** three case studies from the home page, each with the outcome
   visible in the summary — before the visitor commits to opening it.
3. **Open** each case study at its own permanent URL, so a recruiter can forward
   a single project rather than the whole site.
4. **Lead** each case study with a summary block — role, team, duration,
   constraint, outcome — that stands alone if nothing below it is read.
5. **Show** the reasoning below that summary: the constraint faced, the options
   weighed, the call made, and what happened as a result.
6. **Display** real interface work at a size where it can actually be judged,
   with a full-size view available.
7. **Provide** a short about section covering what the designer works on and
   what they are looking for — not a biography.
8. **Offer** one unmissable contact route, repeated at the end of every page,
   with no form-validation friction and no "let's connect" vagueness.
9. **Serve** a downloadable CV, since recruiters are frequently required to
   submit one into an ATS.
10. **Read** correctly with images blocked or slow — headings and summaries must
    carry the meaning on their own.
11. **Survive** being opened on a phone on a bad connection, which is the real
    screening context.

## 5. Constraints

- **Accessibility:** WCAG 2.2 AA is the floor, non-negotiable. Contrast, full
  keyboard operability, visible focus, no meaning conveyed by colour alone, and
  real alt text on every work image. A designer's own site failing an audit is
  disqualifying in a way it is not for other products.
- **Performance:** the site must be usable on a mid-range phone on 4G. Case
  study imagery is the main risk — budget for it rather than discovering it late.
- **No barriers:** no login, no password-protected work, no email gate, no
  cookie wall. A recruiter will not clear an obstacle for a candidate.
- **Content reality:** the site is only as good as the three case studies. If the
  writing is not done, the design cannot rescue it. Treat the case study text as
  a project dependency, not a content-fill step.
- **Existing components:** none. Greenfield, so a small token set and component
  library have to be defined before screens.
- **Platform:** responsive web, mobile-first. Phone is the primary screening
  context, not a secondary breakpoint.
- **Privacy:** no home address and no phone number on the public site. City and
  country only; email as the contact route. The CV carries both — a website has
  a different threat model than a document handed to a named recipient.
- **Tech stack:** `OPEN` — not yet chosen. See open question 3.

## 6. Success criteria

**Behavioural signal:** a recruiter forwards the link onward without asking for
anything else — no request for a PDF portfolio, no "can you send more detail on
project X", no follow-up asking about seniority or domain. Every such request is
a defect report against the first screen.

**Metrics:**

- Of applications where the link is sent, the share reaching a first
  conversation increases against the current rate. `OPEN` — the current rate
  needs recording before launch, or there is nothing to compare against.
- Median time on a case study page exceeds 90 seconds, indicating the secondary
  reader is actually reading rather than bouncing.

**Counter-metric:** if time-on-page rises while first conversations do not, the
site is being enjoyed rather than acted on, and the contact route or the
positioning is at fault — not the visual design.

---

## Open questions

| # | Question | Blocks | Needed by |
|---|----------|--------|-----------|
| ~~1~~ | ~~Three projects~~ — **confirmed:** LD-Tax, PropSoft.ai, Nexis HRM. Screens *and* numbers available for all three. Writing still to draft. | — | — |
| ~~2~~ | ~~NDA~~ — **resolved:** government work is publishable, screens included. | — | — |
| 3 | Tech stack, and does a domain already exist? | Build, deployment | Before build, not before design |
| ~~4~~ | ~~Positioning~~ — **resolved.** First line: *"Digital product designer. I design complex B2B and government systems — 20+ shipped products across proptech, govtech and enterprise SaaS."* | — | — |
| 5 | Current application-to-conversation rate, for the baseline. | Success metric 1 | Before launch |
| ~~6~~ | ~~2024–2026 gap~~ — resolved: Apex DMIT 2024–present, timeline continuous. | — | — |
| ~~7~~ | ~~Overlapping dates~~ — resolved: roles are sequential. | — | — |
| 8 | The CV PDF still says Apex DMIT 2023–2024. Correct it before offering it for download. | Requirement 9 | Before launch |

## Next step

Information architecture — page inventory, URL structure, and what belongs in
the scannable layer versus the deep layer on each page.
