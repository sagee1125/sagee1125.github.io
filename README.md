# sagee1125.github.io

Personal site of Sage (CHEN Saijing) — a single-file Three.js scene: a 3D signpost with 7 clickable signs on a pure white background. Live at https://sagee1125.github.io

This README is written for AI coding agents working on this repo.

## Run

- Open `index.html` directly in a browser (Three.js r170 loads via jsdelivr importmap; the inline module + remote imports work from `file://`), or serve the folder: `npx serve .`

## Deploy

- Push to `main` → GitHub Pages serves the repo root automatically (user-pages repo, no workflow needed).

## Edit

All site content lives in `SIGN_DEFS` at the top of `index.html`. One entry per sign:

- `shape`: `hrect` | `vrect` | `square` | `circle` | `triangle` (triangle has rounded corners)
- `y`: height on the pole; `angle`: degrees around the pole; `arm`: support arm length
- `w` / `h`: board size (circle = diameter, triangle = side length)
- `label`, `colorA`, `colorB`: text and gradient for the generated placeholder texture
- `image`: path or URL of a real image; `null` = generated placeholder. Aspect ratio close to `w : h` looks best.

Other knobs: `SITE` constant (site name), `POLE_H` / `POLE_R`, camera limits in the controls block.

## Conventions

- No build step, no npm, vanilla ES modules in one file.
- UI copy and code comments in English only (owner preference: no Chinese in code).
- Layout is collision-checked: boards are vertical slabs; the plane-crossing point of any two boards must fall outside at least one board outline (plus frame margin), or their height ranges must not overlap. See commit "Fix sign collisions" for the checker logic before moving `angle` / `y` / arm lengths.
- Interaction contract: horizontal-only orbit (polar angle locked); click a sign → smooth focus with the rig turned/slid so the sign faces the camera; click empty space or Esc → restore the view captured before focusing.
