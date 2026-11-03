# Sogang General Physics Simulations

Interactive 3D simulations for General Physics I and II at Sogang University, organized by the chapters and modules of Halliday, Resnick, and Walker, *Principles of Physics*, 12th edition (International Adaptation). Screen text is Korean with the textbook English terms in parentheses. Symbols, units, and equations follow the textbook. No textbook figures, text, or problem statements are reproduced.

## Run locally

ES modules need a web server.

```sh
python3 -m http.server 8800 --bind 127.0.0.1
# open http://127.0.0.1:8800/
```

Tests (Node 20 or later)

```sh
npm test
```

Rebuild the catalog after adding a screen

```sh
python3 tools/build_index.py
```

## Layout

| Path | Content |
|---|---|
| `index.html` | catalog of 126 screens, built from `data/textbook_toc.json` |
| `core/theme.css` | shared look (approved Codex 3D preview, with contrast and size fixes) |
| `core/format.js` | numbers with 3 significant figures, U+2212 minus, scientific notation from 10³ and below 10⁻² |
| `core/stage3d.js` | shared 3D stage (lighting, board, fixed-size labels, compass, keyboard orbit) |
| `core/app.js` | page shell, activity tabs, and fixed-step run loop |
| `core/math.js` | KaTeX rendering (`vendor/katex`, 0.19.0) |
| `sims/chNN/<module>-<name>/` | one screen per folder (`model.js`, `model.test.js`, `view.js`, `spec.js`, `index.html`, `README.md`) |
| `vendor/three/` | three.js 0.187.0 (MIT) |
| `vendor/katex/` | KaTeX 0.19.0 (MIT) |

A screen folder name starts with its first textbook module, for example `ch04/4-4-projectile` for Module 4.4. The model has no DOM access and is tested with `node --test`.

## Screen URL options

Controls can be set from the URL, for example `sims/ch01/1-1-measurement/index.html?activity=scale&quantity=mass&n=-3`.
