# Sketches

Prototypes that are not part of the package yet. Kinds and features are tried here, reviewed on the
sketchbook page, and the approved ones move into `src/`.

```sh
node sketches/build.mjs   # writes sketches/out/sketchbook.html, one self-contained page
```

- `style.ts`: palettes (color lists and adjustments such as pastel) and textures, applied to any picture after it is drawn.
- `palettes.ts`, `color.ts`: built-in palettes, palette generators, palette codes, and the OKLCH color math behind them.
- `animals.ts`, `food.ts`, `objects.ts`: new kinds.
- `main.ts` + `sketchbook.html`: the review page.
- `picker.ts` + `picker.html`: a palette picker prototype.
