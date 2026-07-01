# Hero clay-sculpture models

`WebGLCanvas.tsx` loads these 7 `.glb` files into the home hero. Each is centered,
size-normalized, and has **all its materials overridden with the shared clay material**
(so textures don't matter — pick models by silhouette). A missing file just shows a
clay primitive placeholder, so the site never breaks while a slot is empty.

## Status

| File | Source | Status | License |
|------|--------|--------|---------|
| `laptop.glb` | [Poly Pizza – Alex Safayan](https://poly.pizza/m/27hcX_w47Jb) | ✅ downloaded | CC-BY |
| `camera.glb` | [Poly Pizza – Poly/Google](https://poly.pizza/m/0nfSsetwy0Z) | ✅ downloaded | CC-BY |
| `chess.glb` | [Sketchfab – Elegant Chess Knight (LukeModels75)](https://sketchfab.com/3d-models/elegant-chess-knight-3d-model-a69dfec5b4824a76ba1eec4ba2445e25) | ✅ in use (the "horse" slot) | CC-BY |
| `ring.glb` | [Sketchfab – LOTR One Ring (WilliamSmith)](https://sketchfab.com/3d-models/lord-of-the-rings-the-one-ring-f4e1377ac2b64c7da6084f4361ab84e3) | ✅ | CC-BY |
| ~~`hand.glb`~~ | [Sketchfab – Hand Sculpture](https://sketchfab.com/3d-models/hand-sculpture-2f36b2523f654144bff4f39ba9e0a81c) | removed from scene (file kept) | CC-BY |
| `horse.glb` | [Sketchfab – Horse Statue (Maxider)](https://sketchfab.com/3d-models/horse-statue-b6f4455c6fa049b28475a20cf4d1d7a4) | benched (chess used instead) | CC-BY |
| `crane.glb` | [Sketchfab – 3D Origami Crane (JuanG3D)](https://sketchfab.com/3d-models/3d-origami-crane-38fe6bfec0664af3b7660b2d18cfaf94) | ⬇️ download manually | CC-BY |
| `golfball.glb` | [Sketchfab – Golf ball .STL, 400 dimples (capycoil)](https://sketchfab.com/3d-models/golf-ball-stl-e074fd16148746eeb23510ae33ddeb7f) | ⬇️ download manually | CC-BY |

## How to add a Sketchfab model

1. Open the link, log in (free account), click **Download 3D Model**.
2. Choose the **glTF (.glb)** / "Autoconverted format (glb)" option.
3. Rename the downloaded file to the exact name in the table (e.g. `horse.glb`) and drop it here.

It hot-reloads — no code change needed. To re-tune size/orientation, edit the `MODELS`
array (`mul`, `yRot`) in `src/experience/WebGLCanvas.tsx`.

## Attribution (CC-BY — credit required somewhere on the site)

All seven require a credit line. Suggested footer/credits text:

- Laptop & Camera — Poly Pizza (Alex Safayan; Poly by Google)
- Horse Statue — Massimiliano Castiglione (Sketchfab)
- The One Ring — WilliamSmith (Sketchfab)
- Hand Sculpture — re1monsen (Sketchfab)
- Origami Crane — JuanG3D (Sketchfab)
- Golf Ball — CHRIS .capycoil (Sketchfab)
