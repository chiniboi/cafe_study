# Cafe Study

Personal study tools for CAT Quant, starting with Mensuration.

| What | Where | Open it |
|---|---|---|
| **Cone Lab**: a full-width 3D cone in seven steps, with a tutor that can move, point at, write on, break and compare the diagram | `stage.html`, `src/stage/` | `/stage.html` |
| **Paper Solids book**: three lessons in a 3D pop-up book | `index.html`, `src/lessons/`, `src/content/` | `/` |
| **Tutor proxy**: a small local server that keeps the API key out of the page | `tutor-proxy/server.mjs` | see below |
| **Paper Solids page**: the first single-file trial | `extras/paper-solids.html` | open the file |

## Run it

```bash
npm install --ignore-scripts
npm run dev
```

Then open `http://localhost:5173/stage.html`.

For the tutor, put a key in `tutor-proxy/.env` as `GOOGLE_API_KEY=...` (that file is ignored by git), then:

```bash
node tutor-proxy/server.mjs
```

The tutor uses `gemini-3.8-flash` through the Agent Platform API. The proxy listens only on this machine, accepts requests only from the lab page, and stops after one million tokens per run.

## Licence and credits

Not for commercial use. The book engine and the code built on it come from [every-joule-style](https://github.com/james123wang5/every-joule-style) by james123wang5, under the PolyForm Noncommercial License 1.0.0. See `LICENSE.md`.

That engine is an unofficial reimplementation of the style of [Every Joule](https://iamtechartist.com/every-joule/) by Techartist, and it is not affiliated with or endorsed by Techartist. No code, text, drawings or audio from Every Joule are used here.

Sound effects are CC0 recordings listed in `public/audio/README.md`. Fonts and libraries are installed from npm under their own licences.

Worked examples adapted for personal study from the author's CAT Buddy theory library.
