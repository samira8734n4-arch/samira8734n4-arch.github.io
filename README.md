# Portfolio — Samira Binte Hamid

Digital product designer, Dhaka. Static site, no build step, no dependencies.

## Layout

| Path | What |
|---|---|
| `src/` | The website. This is what gets published. |
| `docs/` | Design documentation — brief, source material, IA, tokens. Not published. |
| `.github/workflows/pages.yml` | Deploys `src/` to GitHub Pages on push to `main`. |

## Running it

Open `src/index.html` in a browser, or serve it:

```
cd src && python -m http.server 8000
```

## Status

⚠️ **Unfinished.** The site contains `[[TODO]]` placeholders, highlighted in
yellow on the page, for content only the designer can supply: outcome numbers,
team sizes, project constraints, target role, and social links. The three case
study hero images in `src/assets/` do not exist yet.

Before this is sent to anyone: fill every `[[TODO]]`, add the three images,
self-host the fonts (currently Google Fonts, on the critical path), and correct
the Apex DMIT dates in the CV PDF.

Start at [docs/README.md](docs/README.md).
