/**
 * The `bozzetto` command: placeholder pictures as SVG or PNG files, from the shell.
 * `run` does the work and takes its input and output as arguments, so it can be tested;
 * `bin.ts` connects it to the real process.
 */
import { parseArgs } from "node:util";
import { version as VERSION } from "../../package.json";
import {
  ADJUSTMENTS,
  avatars,
  faces,
  MAPPINGS,
  PALETTES,
  categories,
  kinds,
  placeholders,
  seedToInt,
  type Kind,
  type Mapping,
  type Picture,
  type Size,
} from "../index";
import { seedFromText } from "../draw/core";
import { parseAvatarSize, parseKinds } from "../render/names";
import { TEXTURES } from "../color/style";
import { ORDERS } from "../render/placeholder";
import { SHAPES } from "../render/avatar";
import { toPng } from "../node";

export interface Io {
  stdout(contents: string | Uint8Array): void;
  stderr(text: string): void;
  writeFile(path: string, contents: string | Uint8Array): void;
  mkdir(path: string): void;
}

const FORMATS = ["svg", "png", "uri", "json"] as const;

const HELP = `bozzetto: seeded placeholder pictures as SVG or PNG

Usage
  bozzetto [kinds...] [options]

Kinds
  Kind ids or names (owl, ice-cream, iceCream) and categories (animals, food),
  in any mix, or all. Default: every kind. Some kinds take options after a colon, such as
  cat:tabby,pupils=round. See them all with --list.

Options
  -n, --count <n>        How many pictures. Default 1.
  -s, --size <WxH>       Size, such as 400x300. Default 400x300 (64 for avatars). Repeat for a mix.
      --seed <seed>      A number, or text (hashed). Picture k uses seed + k. Default 1.
  -p, --palette <name>   An adjustment (pastel), a palette (riso) or a palette code
                         (264653-e76f51-e9c46a). Repeat for a mix.
      --mapping <name>   How a palette is applied: ${MAPPINGS.join(", ")}. Repeat for a mix.
      --texture <name>   ${TEXTURES.join(" or ")}. Repeat for a mix.
      --order <name>     How repeated options are gone through: ${ORDERS.join(", ")}. Default shuffle.
      --numbered         Number the pictures 1, 2, 3… in the corner.
  -f, --format <name>    svg (default), png, uri (data URIs, one per line) or json.
                         An --out file ending in .png means png. PNG needs @resvg/resvg-js.
      --scale <n>        For png: pixels per SVG pixel, such as 2 for high-density screens.
  -o, --out <path>       A file for one picture, or a folder for several (svg or png). The folder gets
                         one file per picture plus manifest.json with each picture's alt text,
                         focus, size and color. Without it, pictures go to standard output.
      --avatar           Avatars: faces framed around the head, round by default. Any face
                         kind unless kinds are given; --size is one number, such as 48.
      --shape <name>     For avatars: circle (default), rounded or square.
      --dark             Build in a dark-mode version that switches with the viewer's setting.
      --dark-palette <p> The dark version's palette, instead of the dim adjustment.
      --list             List the kinds, categories and palettes.
  -h, --help             Show this help.
  -v, --version          Show the version.

Examples
  bozzetto owl > owl.svg
  bozzetto --avatar --seed alice --size 96 -o alice.svg
  bozzetto owl --seed 3 --scale 2 -o owl.png
  bozzetto portrait:hair=curly,glasses -n 4 -o portraits/
  bozzetto owl --seed 3 --size 320x240 --palette riso -o owl.svg
  bozzetto animals donut -n 24 -s 400x300 -s 300x400 -o fixtures/
  bozzetto landscapes -n 5 --format json
`;

class UsageError extends Error {}

function oneOf<T extends string>(value: string, allowed: readonly T[], flag: string): T {
  if (!(allowed as readonly string[]).includes(value)) {
    throw new UsageError(`${flag} must be one of ${allowed.join(", ")}, not "${value}".`);
  }
  return value as T;
}

function listing(): string {
  const lines = ["Kinds, by category:"];
  for (const [name, list] of Object.entries(categories)) {
    lines.push(`  ${name.padEnd(11)} ${list.map(k => k.id).join(", ")}`);
  }
  lines.push("", "Kind options (as in cat:tabby,pupils=round):");
  for (const kind of kinds.filter(k => Object.keys(k.options).length)) {
    const options = Object.entries(kind.options).map(([option, values]) => `${option}=${values.join("|")}`);
    lines.push(`  ${kind.id.padEnd(11)} ${options.join("  ")}`);
  }
  lines.push("", `Adjustments: ${ADJUSTMENTS.join(", ")}`, `Palettes:    ${Object.keys(PALETTES).join(", ")}`);
  return lines.join("\n") + "\n";
}

/** What the manifest and JSON output record for each picture. */
const describe = (picture: Picture, seed: number, file?: string) => ({
  ...(file ? { file } : {}),
  kind: picture.kind,
  seed,
  width: picture.width,
  height: picture.height,
  alt: picture.alt,
  focus: picture.focus,
  color: picture.color,
  ...(Object.keys(picture.options).length ? { options: picture.options } : {}),
});

/** Avatars for the command line: `--size` is one number ("48", or a square size such as "48x48"). */
function avatarsFor(
  count: number,
  pool: Kind[],
  o: { size?: string[]; palette?: string[]; mapping?: string[]; texture?: string[]; shape?: string; order?: string },
  seed: number | string,
  dark: boolean | string | undefined,
): Picture[] {
  const one = (values: string[] | undefined, flag: string) => {
    if (values && values.length > 1) throw new UsageError(`avatars take one ${flag}.`);
    return values?.[0];
  };
  const size = one(o.size, "--size");
  let sizePx: number | undefined;
  try {
    sizePx = size === undefined ? undefined : parseAvatarSize(size);
  } catch {
    throw new UsageError(`--size for avatars is one number of px, such as 48, not "${size}".`);
  }
  const mapping = one(o.mapping, "--mapping");
  const texture = one(o.texture, "--texture");
  return avatars(count, {
    kind: pool.length ? pool : faces,
    seed,
    size: sizePx,
    shape: o.shape === undefined ? undefined : oneOf(o.shape, SHAPES, "--shape"),
    palette: one(o.palette, "--palette"),
    mapping: mapping === undefined ? undefined : (oneOf(mapping, MAPPINGS, "--mapping") as Mapping),
    texture: texture === undefined ? undefined : oneOf(texture, TEXTURES, "--texture"),
    order: o.order === undefined ? undefined : oneOf(o.order, ORDERS, "--order"),
    dark,
  });
}

/** Runs the command with `args` (without the node and script paths). Resolves to the exit code. */
export async function run(args: readonly string[], io: Io): Promise<number> {
  try {
    return await main(args, io);
  } catch (error) {
    const message = error instanceof Error ? error.message.replace(/^bozzetto: /, "") : String(error);
    io.stderr(`bozzetto: ${message}\n${error instanceof UsageError ? "Try bozzetto --help.\n" : ""}`);
    return 1;
  }
}

async function main(args: readonly string[], io: Io): Promise<number> {
  let parsed;
  try {
    parsed = parseArgs({
      // A negative seed after --seed is its value, not an option: `--seed -1` means `--seed=-1`.
      args: args.flatMap((arg, k) =>
        args[k - 1] === "--seed" && /^-\d/.test(arg)
          ? []
          : arg === "--seed" && /^-\d/.test(args[k + 1] ?? "")
            ? [`--seed=${args[k + 1]}`]
            : [arg],
      ),
      allowPositionals: true,
      options: {
        count: { type: "string", short: "n" },
        size: { type: "string", short: "s", multiple: true },
        seed: { type: "string" },
        palette: { type: "string", short: "p", multiple: true },
        mapping: { type: "string", multiple: true },
        texture: { type: "string", multiple: true },
        order: { type: "string" },
        numbered: { type: "boolean" },
        format: { type: "string", short: "f" },
        scale: { type: "string" },
        avatar: { type: "boolean" },
        dark: { type: "boolean" },
        "dark-palette": { type: "string" },
        shape: { type: "string" },
        out: { type: "string", short: "o" },
        list: { type: "boolean" },
        help: { type: "boolean", short: "h" },
        version: { type: "boolean", short: "v" },
      },
    });
  } catch (error) {
    throw new UsageError(error instanceof Error ? error.message : String(error));
  }
  const { values: o, positionals } = parsed;

  if (o.help) return (io.stdout(HELP), 0);
  if (o.version) return (io.stdout(`${VERSION}\n`), 0);
  if (o.list) return (io.stdout(listing()), 0);

  let pool: Kind[];
  try {
    pool = parseKinds(positionals);
  } catch (error) {
    const message = error instanceof Error ? error.message.replace(/^bozzetto: /, "") : String(error);
    throw new UsageError(
      message.startsWith("unknown kind") ? `${message.slice(0, -1)}. See bozzetto --list.` : message,
    );
  }

  const count = o.count === undefined ? 1 : Number(o.count);
  if (!Number.isInteger(count) || count < 1) throw new UsageError(`--count must be a whole number of at least 1.`);
  const seed = o.seed === undefined ? 1 : seedFromText(o.seed);
  const format = oneOf(o.format ?? (o.out?.toLowerCase().endsWith(".png") ? "png" : "svg"), FORMATS, "--format");
  const scale = o.scale === undefined ? 1 : Number(o.scale);
  if (!(scale > 0)) throw new UsageError(`--scale must be a number more than 0.`);
  if (o.scale !== undefined && format !== "png") throw new UsageError(`--scale is for --format png.`);
  /** A picture's file contents in the chosen format: SVG text, or PNG bytes. */
  const fileOf = async (picture: Picture) => (format === "png" ? toPng(picture, { scale }) : picture.svg + "\n");

  if (o.shape !== undefined && !o.avatar) throw new UsageError(`--shape is for --avatar.`);
  if (o.numbered && o.avatar) throw new UsageError(`--numbered is for pictures, not --avatar.`);
  const dark = o["dark-palette"] ?? (o.dark ? true : undefined);
  const pictures = o.avatar
    ? avatarsFor(count, pool, o, seed, dark)
    : placeholders(count, {
        kind: pool.length ? pool : undefined,
        size: o.size?.map(s => s as Size),
        palette: o.palette,
        mapping: o.mapping?.map(m => oneOf(m, MAPPINGS, "--mapping") as Mapping),
        texture: o.texture?.map(t => oneOf(t, TEXTURES, "--texture")),
        order: o.order === undefined ? undefined : oneOf(o.order, ORDERS, "--order"),
        seed,
        numbered: o.numbered,
        dark,
      });
  // placeholders numbers seeds from the base seed: picture k uses base + k, with text seeds hashed first.
  const seedOf = (k: number) => (seedToInt(seed) + k) >>> 0;

  const extension = /\.(svg|png)$/i.exec(o.out ?? "")?.[1].toLowerCase();
  if (extension && count > 1) throw new UsageError(`--out ${o.out} names a file, but ${count} pictures need a folder.`);
  if (extension && extension !== format)
    throw new UsageError(`--out ${o.out} is a .${extension} file, but --format is ${format}.`);
  if (o.out !== undefined && (count > 1 || o.out.endsWith("/"))) {
    // A folder: one file per picture, plus a manifest.
    if (format === "uri" || format === "json") throw new UsageError(`--out <folder> writes svg or png files.`);
    const folder = o.out.replace(/\/+$/, "");
    io.mkdir(folder);
    const digits = String(count).length;
    const manifest = [];
    for (const [k, picture] of pictures.entries()) {
      const file = `${String(k + 1).padStart(digits, "0")}-${picture.kind}.${format}`;
      io.writeFile(`${folder}/${file}`, await fileOf(picture));
      const entry = describe(picture, seedOf(k), file);
      // A PNG's size is its pixel size, scale included.
      manifest.push(
        format === "png"
          ? { ...entry, width: Math.round(picture.width * scale), height: Math.round(picture.height * scale) }
          : entry,
      );
    }
    io.writeFile(`${folder}/manifest.json`, JSON.stringify(manifest, null, 2) + "\n");
    io.stderr(`Wrote ${count} picture${count === 1 ? "" : "s"} and manifest.json to ${folder}/\n`);
    return 0;
  }

  let text: string | Uint8Array;
  if (format === "png") {
    if (count !== 1) throw new UsageError(`several PNGs need --out <folder>.`);
    text = await fileOf(pictures[0]);
  } else if (format === "json") {
    text = JSON.stringify(
      pictures.map((picture, k) => ({ ...describe(picture, seedOf(k)), svg: picture.svg })),
      null,
      2,
    );
  } else if (format === "uri") {
    text = pictures.map(p => p.src).join("\n");
  } else if (count === 1) {
    text = pictures[0].svg;
  } else {
    throw new UsageError(`several pictures need --out <folder>, or --format uri or json.`);
  }
  const contents = typeof text === "string" && !text.endsWith("\n") ? text + "\n" : text;
  if (o.out !== undefined) {
    io.writeFile(o.out, contents);
    io.stderr(`Wrote ${o.out}\n`);
  } else {
    io.stdout(contents);
  }
  return 0;
}
