# 4-2 Projectile Motion

Screen for Principles of Physics 12e, Module 4.4 (Learning Objectives 4.4.1–4.4.3). Folder name uses the catalog screen id (4-2).

## Model

| Item | Content |
|---|---|
| Governing equations | textbook Eqs. (4.4.3)–(4.4.5) in the launch plane, range Eq. (4.4.8), path Eq. (4.4.7) |
| Constants | *g* = 9.8 m/s² (Sample Problems 4.4.1, 4.4.2) |
| Assumptions | no air resistance, launch and landing at the same height, ball treated as a particle at its center |
| 3D extension | the launch plane can turn by φ about the vertical *y* axis. φ = 0 is the textbook *x*–*y* plane |
| Integrator | none. The state at time *t* is the exact solution |
| Tests | `model.test.js`, 7 tests (range, Sample Problem range 686 m, apex, landing, Eq. 4.4.7 path, turned plane, sweep without NaN) |

## Origin

The scene layout comes from the Codex 3D preview `93_Codex/3D_시안/3d_quality.html` that the user approved on 2026-11-03. Changes from that preview are the board top at *y* = 0 (the dashed height line now equals *y*), default φ = 0, Korean text with textbook English terms, three significant figures with the U+2212 minus sign, and the horizontal range *R* in place of mechanical energy per mass (energy is Chapter 8).
