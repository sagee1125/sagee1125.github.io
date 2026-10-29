# sagee1125.github.io

Personal site of Sage (CHEN Saijing) — a single-page Three.js scene: a 3D signpost with 7 clickable signs floating in a procedural blue sky with drifting clouds. Live at https://sagee1125.github.io

This README is written for AI coding agents working on this repo.

## Files

- `index.html` — the whole signpost scene (Three.js r170 via jsdelivr importmap)
- `sky.js` — background sky: WebGL fragment shader (adapted from Aceternity UI's cloud-shader), ported as a dependency-free classic script. Tune colors/speed in `SKY_CONFIG` at the top.

## Run

- Open `index.html` directly in a browser (works from `file://`; `sky.js` is a classic script so local loading is fine), or serve the folder: `npx serve .`

## Deploy

- Push to `main` → GitHub Pages serves the repo root automatically (user-pages repo, no workflow needed).

## Edit

All site content lives in `SIGN_DEFS` at the top of `index.html`. One entry per sign:

- `shape`: `hrect` | `vrect` | `square` | `circle` | `triangle` | `arrow` (rectangle ending in an outward arrowhead; triangle and arrow have rounded corners)
- `y`: height on the pole; `angle`: degrees around the pole; `arm`: short neck between pole and board — boards hang off the pole's side, joined by a horizontal rod lying in the board's plane
- `w` / `h`: board size (circle = diameter, triangle = side length)
- `focus`: optional focus placement — `top` (board rises on screen, bottom-right stays free for text) or `bottom` (board sinks, top-right stays free); omit for centered
- `label`, `colorA`, `colorB`: text and gradient for the generated placeholder texture
- `image`: path or URL of a real image; `null` = generated placeholder. Aspect ratio close to `w : h` looks best.

Other knobs: `SITE` constant (site name), `POLE_H` / `POLE_R`, camera limits in the controls block.

## Conventions

- No build step, no npm, vanilla ES modules in one file.
- UI copy and code comments in English only (owner preference: no Chinese in code).
- Layout is collision-checked: boards are vertical slabs; the plane-crossing point of any two boards must fall outside at least one board outline (plus frame margin), or their height ranges must not overlap. See commit "Fix sign collisions" for the checker logic before moving `angle` / `y` / arm lengths.
- Interaction contract: horizontal-only orbit (polar angle locked); click a sign → smooth focus with the rig turned/slid so the sign faces the camera; click empty space or Esc → restore the view captured before focusing.
