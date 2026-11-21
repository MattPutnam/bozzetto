# PNG, WebP and JPEG

Pictures are SVG, which most places take. For the ones that don't (email, some design tools,
social cards, older platforms), Bozzetto turns them into image files.

## In the browser

`toImageBlob` draws a picture on a canvas and returns a `Blob`, with no dependencies:

```ts
import { owl, render, toImageBlob } from "bozzetto";

const blob = await toImageBlob(render(owl, { seed: 3 }), { scale: 2 });
const url = URL.createObjectURL(blob);
```

| Option    | Default     |                                                                        |
| --------- | ----------- | ---------------------------------------------------------------------- |
| `type`    | `image/png` | `image/png`, `image/webp` or `image/jpeg` (WebP needs browser support) |
| `scale`   | `1`         | Pixels per SVG pixel, such as `2` for high-density screens             |
| `quality` | browser's   | For WebP and JPEG: from 0 to 1                                         |

Try it with the **Save PNG** button in the [live example](./getting-started#try-it).

## File sizes

A picture's flat shapes compress well: a 400×300 PNG is usually 5–20 KB, and WebP is smaller
still. Textures are the exception. Grain and paper are fine noise, which doesn't compress, so a
textured PNG can be 150 KB or more. Leave textures off, or use WebP or JPEG, when size matters.

## In Node

Node has no canvas, so `bozzetto/node` renders PNGs with
[resvg](https://github.com/yisibl/resvg-js), a fast and accurate SVG renderer. It's an optional
dependency: install it alongside Bozzetto.

```bash
npm install bozzetto @resvg/resvg-js
```

```ts
import { writeFile } from "node:fs/promises";
import { animals, placeholders } from "bozzetto";
import { toPng } from "bozzetto/node";

for (const [k, picture] of placeholders(12, { kind: animals }).entries()) {
  await writeFile(`fixtures/${k + 1}-${picture.kind}.png`, await toPng(picture, { scale: 2 }));
}
```

`toPng(picture, { scale })` returns the PNG's bytes. It takes a picture or SVG markup, and also
works in Bun.

## From the command line

`--format png` writes PNGs, or name an output file ending in `.png`. `--scale` sets the pixel
density. The command needs resvg too:

```bash
npx -p bozzetto -p @resvg/resvg-js bozzetto owl --scale 2 -o owl.png
npx -p bozzetto -p @resvg/resvg-js bozzetto animals -n 12 -f png -o fixtures/
```

In a project with both installed, plain `npx bozzetto` works.
