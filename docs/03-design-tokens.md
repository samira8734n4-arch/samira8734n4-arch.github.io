# Design tokens

Tokens live in [`src/styles/tokens.css`](../src/styles/tokens.css) — paste-ready,
not duplicated here. This file is the reasoning.

**Direction changed 2026-09-05** from restrained editorial to warm and playful,
at the designer's direction, modelled on benshih.design. See
[brief §3](00-design-brief.md) for the record of that decision and its cost.

## Decisions

**Two typefaces.** Bricolage Grotesque (variable, heavy) for display and
headings; Plus Jakarta Sans for reading and UI. The display face carries the
personality; the body face stays friendly but neutral so long text is readable.

**Warm cream ground, deep teal action, five pastel fills.** Cream (`#fbf7f1`)
rather than white — white reads clinical against this type. The pastels
(peach, lavender, mint, butter, sky) are cycled across cards and chips for
rhythm. They are **decorative surfaces only**: they never encode meaning and
never sit behind small text, so they carry no contrast duty while the text on
them does.

**Generous rounding (10/18/28/40px) and soft shadows.** Rounding is the main
carrier of the friendly tone, which is why the palette can stay fairly limited.

**Springy easing, short durations.** `cubic-bezier(0.34, 1.4, 0.64, 1)` gives
cards a slight overshoot on hover. `prefers-reduced-motion` zeroes durations.

## Contrast audit — all AA or better

Light theme on cream `#fbf7f1`:

| Token | Value | Ratio | Verdict |
|---|---|---|---|
| `--color-text-primary` | `#16231f` | 15.6:1 | AAA |
| `--color-text-secondary` | `#46564f` | 7.9:1 | AAA |
| `--color-text-tertiary` | `#66756e` | 4.8:1 | AA |
| `--color-action` | `#0f5c4c` | 7.4:1 | AAA |

Text on pastel fills uses `--color-text-primary`, which clears 12:1 on all five.
White on the teal CTA panel is 8.9:1. Dark theme on `#121715`:
`--color-text-primary` 15.9:1, `--color-text-secondary` 9.0:1,
`--color-text-tertiary` 5.4:1, `--color-action` 10.2:1.

Two rules the audit cannot enforce, so components must:

- `--color-text-tertiary` is for supporting text only — never body copy.
- Never place small or secondary text on a pastel fill; those fills are tuned
  for `--color-text-primary` only.

## Rules

- Reference semantic tokens (`--spacing-comfortable`), not raw steps
  (`--space-4`), in components.
- Never hardcode a colour or size. If a value is missing, add a token.
- Dark mode changes values only. If a component needs branching, a token is
  missing.
- Pastel fills are surfaces, never signals. Nothing may depend on which colour
  a card happens to be.

## Open

**Self-host the fonts before launch.** Both families load from Google Fonts, so
the site has a third-party dependency and a webfont on the critical path —
against the 4G-phone constraint in brief §5. `preconnect` and `display=swap` are
set, which limits but does not remove the cost.
