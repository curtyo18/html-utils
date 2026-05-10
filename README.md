# html-utils

A growing collection of single-purpose, client-side browser utilities. Every tool is a static HTML page that runs entirely in your browser. No backend, no auth, no analytics.

## Live site

**https://curtyo18.github.io/html-utils/**

Deployed via GitHub Pages from `main` on every push.

## Adding a tool

1. Create `tools/<group>/<tool-name>.html` (or `tools/<group>/<tool-name>/index.html` if the tool needs supporting files).
2. Commit and push to `main`.
3. The GitHub Action regenerates `manifest.json` and redeploys the site. The new tool shows up on the home page automatically.

Folders nest arbitrarily — `tools/games/hunt/talent-calc.html` becomes `games / hunt / talent-calc` on the home page.

## Local preview

Generate the manifest and serve the directory:

```
node scripts/build-manifest.mjs
npx serve .
```

Then open the URL `serve` prints. Opening `index.html` directly via `file://` will not work — `fetch('manifest.json')` is blocked under the `file:` scheme.

## Conventions

- Folder/filename = display name. No descriptions, no glyphs, no per-tool config files.
- Files or folders starting with `_` or `.` are ignored by the scanner.
- The manifest at `manifest.json` is generated — never hand-edit, never commit.
