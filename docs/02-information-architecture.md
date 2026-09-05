# Information architecture

Six pages. Flat — no section landing pages, no nesting. A recruiter should never
need more than one click to reach evidence.

## Page inventory

| URL | Page | Job |
|---|---|---|
| `/` | Home | Position, then hand off to three case studies |
| `/work/ld-tax` | Case study 1 | Scale and stakes — government, citizen-facing |
| `/work/propsoft` | Case study 2 | End-to-end product across system, app, site |
| `/work/nexis-hrm` | Case study 3 | Systems maturity — dashboards, component library |
| `/about` | About | What she works on, what she wants next |
| `/cv.pdf` | CV | ATS submission |

Nav: `Work · About · CV · Email`. No hamburger on mobile — four items fit.

All three confirmed, publishable, with screens and outcome numbers available.
No contingency needed.

## Layering, per page

### `/`

**Scannable** — name, one-line positioning, "Dhaka · open to X", three case cards
(project, domain, one-line outcome), email.
**Deep** — two-sentence "what I do", full project list (~17 items, text only),
credentials line.

Cards must carry the outcome. A card that says only "PropSoft.ai — proptech" has
failed; the recruiter has to be able to keep or discard without clicking.

### `/work/*`

Fixed order, same on all three:

1. Title + one-line outcome
2. **Summary block** — role · team · duration · platform · constraint · outcome.
   Must stand alone if nothing below is read.
3. Hero screen, viewable full size
4. The constraint — what made this hard
5. Options weighed, and the call made
6. Result, with numbers
7. What she'd do differently
8. Next case study + email

1–3 are the scannable layer. 4–7 are the deep layer.

### `/about`

Short. What she works on, what she's looking for, CS degree (one line — supports
credibility with engineers), awards (one line), current management training
(one sentence, framed as direction not credential). No skills list, no tools, no
course list — ruled out in brief §2.

## Rules

- Every page ends with the same email CTA.
- No project page without a number in section 6. If there is no number, it is not
  a case study — it goes in the list.
- Full project list is text only. Seventeen thumbnails is a performance budget
  spent on the lowest-value content.
- Case study pages are independently linkable and readable cold — a recruiter
  forwards one URL, not the site.

## Open

- Availability line on `/` — needs the target role named.
- Tech stack and domain (build only, does not block design).
