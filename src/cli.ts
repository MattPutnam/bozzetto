/**
 * The `bozzetto` command: placeholder pictures as SVG files, from the shell.
 * `run` does the work and takes its input and output as arguments, so it can be tested;
 * `bin.ts` connects it to the real process.
 */
import { parseArgs } from "node:util";
import { version as VERSION } from "../package.json";
import {
  ADJUSTMENTS,
  MAPPINGS,
  PALETTES,
  categories,
  kinds,
  placeholders,
  seedToInt,
  type Kind,
  type Mapping,
  type Order,
  type Picture,
  type Size,
  type Texture,
} from "./index";

export interface Io {
  stdout(text: string): void;
  stderr(text: string): void;
  writeFile(path: string, contents: string): void;
  mkdir(path: string): void;
}

const FORMATS = ["svg", "uri", "json"] as const;
const ORDERS: readonly Order[] = ["shuffle", "cycle", "random"];
const TEXTURES: readonly Texture[] = ["grain", "paper"];

const camel = (id: string) => id.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());

/** Every name a kind can be given by on the command line: its id, its export name, or a category. */
function names(): Map<string, readonly Kind[]> {
  const map = new Map<string, readonly Kind[]>();
  for (const kind of kinds) {
    map.set(kind.id.toLowerCase(), [kind]);
    map.set(camel(kind.id).toLowerCase(), [kind]);
  }
  for (const [name, list] of Object.entries(categories)) map.set(name.toLowerCase(), list);
  map.set("all", kinds);
  return map;
}

const HELP = `bozzetto: seeded placeholder pictures as SVG

Usage
  bozzetto [kinds...] [options]

Kinds
  Kind ids or names (owl, ice-cream, iceCream) and categories (animals, food),
  in any mix. Default: every kind. See them all with --list.

Options
  -n, --count <n>        How many pictures. Default 1.
  -s, --size <WxH>       Size, such as 400x300. Default 400x300. Repeat for a mix.
      --seed <seed>      A number or text. Picture k uses seed + k. Default 1.
  -p, --palette <name>   An adjustment (pastel), a palette (riso) or a palette code
                         (264653-e76f51-e9c46a). Repeat for a mix.
      --mapping <name>   How a palette is applied: ${MAPPINGS.join(", ")}. Repeat for a mix.
      --texture <name>   ${TEXTURES.join(" or ")}. Repeat for a mix.
      --order <name>     How repeated options are gone through: ${ORDERS.join(", ")}. Default shuffle.
      --numbered         Number the pictures 1, 2, 3… in the corner.
  -f, --format <name>    svg (default), uri (data URIs, one per line) or json.
  -o, --out <path>       A file for one picture, or a folder for several. The folder gets
                         one SVG per picture plus manifest.json with each picture's alt text,
                         focus, size and color. Without it, pictures go to standard output.
      --list             List the kinds, categories and palettes.
  -h, --help             Show this help.
  -v, --version          Show the version.

Examples
  bozzetto owl > owl.svg
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
});

/** Runs the command with `args` (without the node and script paths). Returns the exit code. */
export function run(args: readonly string[], io: Io): number {
  try {
    return main(args, io);
  } catch (error) {
    const message = error instanceof Error ? error.message.replace(/^bozzetto: /, "") : String(error);
    io.stderr(`bozzetto: ${message}\n${error instanceof UsageError ? "Try bozzetto --help.\n" : ""}`);
    return 1;
  }
}

function main(args: readonly string[], io: Io): number {
  let parsed;
  try {
    parsed = parseArgs({
      args: [...args],
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

  const known = names();
  const pool = positionals.flatMap(name => {
    const found = known.get(name.toLowerCase());
    if (!found) throw new UsageError(`unknown kind "${name}". See bozzetto --list.`);
    return found;
  });

  const count = o.count === undefined ? 1 : Number(o.count);
  if (!Number.isInteger(count) || count < 1) throw new UsageError(`--count must be a whole number of at least 1.`);
  const seed = o.seed === undefined ? 1 : /^\d+$/.test(o.seed) ? Number(o.seed) : o.seed;
  const format = oneOf(o.format ?? "svg", FORMATS, "--format");

  const pictures = placeholders(count, {
    kind: pool.length ? pool : undefined,
    size: o.size?.map(s => s as Size),
    palette: o.palette,
    mapping: o.mapping?.map(m => oneOf(m, MAPPINGS, "--mapping") as Mapping),
    texture: o.texture?.map(t => oneOf(t, TEXTURES, "--texture")),
    order: o.order === undefined ? undefined : oneOf(o.order, ORDERS, "--order"),
    seed,
    numbered: o.numbered,
  });
  // placeholders numbers seeds from the base seed: picture k uses base + k, with text seeds hashed first.
  const seedOf = (k: number) => (seedToInt(seed) + k) >>> 0;

  if (o.out !== undefined && (count > 1 || o.out.endsWith("/"))) {
    // A folder: one SVG per picture, plus a manifest.
    const folder = o.out.replace(/\/+$/, "");
    io.mkdir(folder);
    const width = String(count).length;
    const manifest = pictures.map((picture, k) => {
      const file = `${String(k + 1).padStart(width, "0")}-${picture.kind}.svg`;
      io.writeFile(`${folder}/${file}`, picture.svg + "\n");
      return describe(picture, seedOf(k), file);
    });
    io.writeFile(`${folder}/manifest.json`, JSON.stringify(manifest, null, 2) + "\n");
    io.stderr(`Wrote ${count} picture${count === 1 ? "" : "s"} and manifest.json to ${folder}/\n`);
    return 0;
  }

  let text: string;
  if (format === "json") {
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
  if (o.out !== undefined) {
    io.writeFile(o.out, text + "\n");
    io.stderr(`Wrote ${o.out}\n`);
  } else {
    io.stdout(text + "\n");
  }
  return 0;
}
