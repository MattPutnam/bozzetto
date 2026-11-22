# Getting started

## Install

```bash
npm install bozzetto
```

Bozzetto is an ES module with a CommonJS build and TypeScript types. It has no dependencies, and
the library works in browsers, Node, Deno, Bun and edge runtimes.

## A first picture

Every kind of picture is its own export. Draw one with `render`:

<<< @/examples/quickstart.ts#quickstart

<Figure name="quickstart" alt="An owl on a branch at dusk under the moon" />

`render` returns a **picture**: the markup and a data URI, plus its size, alt text, focal point
and background color. When you only need the markup or the URI, `toSvg` and `toDataUri` return
just that.

## Try it

Every option, live. The ring marks the picture's focal point.

<LivePicture />

## Options

| Option         | Default     |                                                                                  |
| -------------- | ----------- | -------------------------------------------------------------------------------- |
| `size`         | `"400x300"` | `"WxH"` or `{ width, height }`                                                   |
| `seed`         | `1`         | A number, or any text (such as a user id), which is hashed                       |
| `palette`      | none        | An adjustment, a palette name or code, or a list of colors                       |
| `mapping`      | `balanced`  | How a color palette is applied: `balanced`, `ramp` or `nearest`                  |
| `texture`      | none        | `grain` or `paper`                                                               |
| `label`        | none        | Text in the bottom-right corner, such as a number                                |
| `dark`         | none        | A built-in dark mode: `true`, or a palette (see [dark mode](./colors#dark-mode)) |
| `darkSelector` | none        | A selector to follow instead of the system setting, for inline SVG               |

## Choosing for me

`placeholder` draws one picture and picks the kind from the seed, from every kind or from a list
you give it:

```ts
import { animals, placeholder } from "bozzetto";

const picture = placeholder({ kind: animals, seed: user.id, size: "128x128" });
img.src = picture.src;
img.alt = picture.alt;
```

For a face framed around its head, use [`avatar`](./avatars) instead.

`placeholder` and `placeholders` can choose any kind, so they bundle every kind. Import kinds
directly when bundle size matters.

## Next

- [Kinds and categories](./kinds)
- [Filling a gallery](./galleries)
- [Using it with React, Vue, CSS and more](./recipes)
