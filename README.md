# bozzetto

Seeded placeholder images as tiny SVGs: landscapes, modern-art homages, faces and animals, each drawn from a handful of flat shapes and gradients.

A *bozzetto* is a painter's small preliminary sketch, made before the real work. These are the stand-ins for your real pictures.

![Two seeds of every kind](media/gallery.svg)

- **Deterministic.** The same seed gives the same picture, everywhere. Seeds can be numbers or strings, such as a user id.
- **Small.** Most pictures are 1–3 KB as a data URI, and none needs a network request.
- **Any size.** Pictures are drawn to the width and height you ask for.
- **No dependencies.** Import only the kinds you use and the rest is tree-shaken away.

## Install

```sh
npm install bozzetto
```

## Use

```ts
import { placeholder, placeholders } from "bozzetto";

// One picture as a data URI, for <img src> or CSS url().
img.src = placeholder({ kind: "owl", seed: 3, width: 320, height: 240 });

// A whole family, with the seed choosing which kind.
avatar.src = placeholder({ kind: "face", seed: user.id });

// A list of different pictures, numbered in the corner. Picture k uses seed + k,
// so asking for more later keeps the first ones the same.
const photos = placeholders(24, { kind: "landscape", seed: 1, numbered: true });
```

`placeholder` and `placeholders` can choose any kind, so they bundle every kind. To keep the bundle small, import kinds directly:

```ts
import { hills, owl, toDataUri, toSvg } from "bozzetto";

img.src = toDataUri(hills, { seed: 7 });
container.innerHTML = toSvg(owl, { seed: 7 }); // inline markup; element ids are unique per picture
```

## Kinds

| Family | `kind` | Picture |
|---|---|---|
| `landscape` | `hills` | Soft hills under a sun, sometimes with a lone tree |
| | `mountains` | Three jagged ranges fading into the distance |
| | `sea` | A low sun over the sea, with a streaked reflection |
| | `dunes` | Layered sand ridges |
| | `forest` | Two rows of pines |
| | `night` | Stars, a full or crescent moon, dark hills |
| | `city` | Buildings against a dusk sky, some windows lit |
| `art` | `field` | Soft-edged color bands, after the color-field painters |
| | `grid` | A canvas split into rectangles, a few in primaries |
| | `squares` | Nested squares in neighboring colors, after Albers |
| | `orbits` | A haloed circle among small circles, rings and lines |
| | `cutouts` | Lobed paper-cut shapes in bold colors |
| | `bauhaus` | Tiles of circles, half and quarter circles, triangles |
| `face` | `portrait` | Head and shoulders; skin, hair, brows, smile and glasses vary |
| `animal` | `cat` | A cat's face; coat, eyes, stripes and muzzle vary |
| | `bird` | A songbird on a leafy branch |
| | `fish` | A fish among weeds and bubbles |
| | `owl` | An owl on a branch at dusk |

## API

| Function | Returns |
|---|---|
| `placeholder(options)` | One picture as a data URI |
| `placeholderSvg(options)` | One picture as SVG markup |
| `placeholders(count, options)` | `count` different pictures as data URIs |
| `toDataUri(kind, options)` | A specific kind as a data URI |
| `toSvg(kind, options)` | A specific kind as SVG markup |
| `resolveKind(choice, seed)` | The kind a seed picks from a choice |

Options:

| Option | Default | |
|---|---|---|
| `width`, `height` | `400`, `300` | Size in px |
| `seed` | `1` | Number or string |
| `label` | none | Text in the bottom-right corner (`toSvg`, `toDataUri`, `placeholder`) |
| `numbered` | `false` | Label pictures 1, 2, 3… (`placeholders` only) |
| `kind` | any kind | A kind id, a family, a kind object, or a list of ids and kinds (`placeholder*` only) |

### Your own kinds

A kind is a function from a seeded random source and a size to the markup inside `<svg>`:

```ts
import { defineKind, toDataUri } from "bozzetto";

const dot = defineKind("dot", "Dot", "art", (r, w, h) =>
  `<rect width="${w}" height="${h}" fill="#eee"/><circle cx="${r.f(0, w)}" cy="${r.f(0, h)}" r="20" fill="tomato"/>`);

img.src = toDataUri(dot, { seed: 1 });
placeholder({ kind: [dot, "owl"], seed: 2 }); // custom kinds mix with built-in ones
```

`r` has `f(min, max)`, `i(min, max)`, `pick(list)`, `chance(p)`, `next()`, and `id(name)` for gradient and mask ids that stay unique when several pictures are inlined on one page.

## Develop

```sh
npm install
npm run dev       # demo page with every kind
npm test
npm run gallery   # regenerate media/gallery.svg
```

## License

MIT
