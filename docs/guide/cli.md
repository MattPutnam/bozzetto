# Command line

The `bozzetto` command writes pictures as SVG or PNG files, for test fixtures, mockups and design tools.
It comes with the package; run it with `npx`:

```bash
npx bozzetto owl > owl.svg
npx bozzetto owl --seed 3 --size 320x240 --palette riso -o owl.svg
npx bozzetto animals donut -n 24 -s 400x300 -s 300x400 -o fixtures/
npx bozzetto landscapes -n 5 --format json
npx bozzetto --list
```

## Kinds

Name kinds by id (`ice-cream`), export name (`iceCream`, in any capitalization) or category
(`animals`), in any mix, or `all`. With none, any kind can appear.

Kinds with [options](./kinds#options) take them after a colon, separated by commas. A bare option
name means `true`:

```bash
npx bozzetto cat:tabby,pupils=round
npx bozzetto portrait:hair=curly,glasses -n 4 -o portraits/
```

`bozzetto --list` shows every kind's options, and the manifest records each picture's options.

## Options

| Option                |                                                                                 |
| --------------------- | ------------------------------------------------------------------------------- |
| `-n`, `--count <n>`   | How many pictures. Default 1                                                    |
| `-s`, `--size <WxH>`  | Size, such as `400x300`. Default `400x300` (`64` for avatars). Repeat for a mix |
| `--seed <seed>`       | A number or text. Picture _k_ uses seed + _k_. Default 1                        |
| `-p`, `--palette <p>` | An adjustment, palette name or palette code. Repeat for a mix                   |
| `--mapping <m>`       | `balanced`, `ramp` or `nearest`. Repeat for a mix                               |
| `--texture <t>`       | `grain` or `paper`. Repeat for a mix                                            |
| `--order <o>`         | `shuffle` (default), `cycle` or `random`                                        |
| `--numbered`          | Number the pictures in the corner                                               |
| `-f`, `--format <f>`  | `svg` (default), `png`, `uri` (one data URI per line) or `json`                 |
| `--scale <n>`         | For `png`: pixels per SVG pixel, such as `2`                                    |
| `-o`, `--out <path>`  | A file for one picture, or a folder for several                                 |
| `--avatar`            | [Avatars](./avatars): `--size` is one number; any face unless kinds are given   |
| `--shape <s>`         | For avatars: `circle` (default), `rounded` or `square`                          |
| `--dark`              | Build in a dark-mode version (the `dim` adjustment)                             |
| `--dark-palette <p>`  | The dark version's palette instead                                              |
| `--list`              | List the kinds, categories and palettes                                         |
| `-h`, `--help`        | Show the help                                                                   |
| `-v`, `--version`     | Show the version                                                                |

A seed written as a number, such as `3`, `-1` or `1.5`, is that number (and draws what the same
number does in code); anything else, such as `user-42`, is text and is hashed.

With `-o`, a name ending in `.svg` or `.png` is a single file, in that format; with `-n` above 1,
`-o` names a folder.

## Folders and the manifest

With several pictures, `-o fixtures/` writes one SVG per picture (`1-bird.svg`, `2-cat.svg`, …,
numbered with leading zeros from ten pictures on, as in `01-donut.svg`) and a `manifest.json`
describing them. A path ending in `/` is always a folder, even for one picture:

```json
[
  {
    "file": "1-bird.svg",
    "kind": "bird",
    "seed": 7,
    "width": 300,
    "height": 400,
    "alt": "A songbird on a leafy branch, facing right",
    "focus": { "x": 0.67, "y": 0.5 },
    "color": "#d9edeb"
  }
]
```

A test or a design tool can read the manifest to know each picture's size, alt text and focus.
Kinds with options also get an `options` entry with the value each option took.

## PNG

`--format png` writes PNGs, as does an output file ending in `.png`; `--scale 2` doubles the
pixels. PNGs need `@resvg/resvg-js` installed: see [PNG, WebP and JPEG](./images#from-the-command-line).
In a folder's manifest, `width` and `height` are the PNG's pixel size.

## Other formats

Without `-o`, one picture goes to standard output as SVG. For several, choose `--format uri`
(one data URI per line) or `--format json` (everything in the manifest, plus each picture's
markup). Both go to standard output, so redirect them to save a file: with several pictures, `-o`
always names a folder of SVG or PNG files.
