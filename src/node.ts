/**
 * `bozzetto/node`: pictures as PNG files in Node (and Bun), rendered by `@resvg/resvg-js`.
 * resvg is an optional peer dependency: install it to use `toPng`.
 *
 *     import { owl, render } from "bozzetto";
 *     import { toPng } from "bozzetto/node";
 *     await writeFile("owl.png", await toPng(render(owl, { seed: 3 }), { scale: 2 }));
 */
import { sizeOf } from "./raster";
import { forResvg } from "./resvg-fix";
import type { Picture } from "./render";

export interface PngOptions {
  /** Pixels per SVG pixel, such as 2 for high-density screens. Default 1. */
  scale?: number;
}

type Resvg = typeof import("@resvg/resvg-js").Resvg;
let loaded: Promise<Resvg> | undefined;

function resvg(): Promise<Resvg> {
  loaded ??= import("@resvg/resvg-js").then(
    module => module.Resvg,
    () => {
      loaded = undefined;
      throw new Error("bozzetto: PNGs in Node need @resvg/resvg-js. Install it with: npm install @resvg/resvg-js");
    },
  );
  return loaded;
}

/** A picture as PNG bytes. */
export async function toPng(input: Picture | string, options: PngOptions = {}): Promise<Uint8Array> {
  const svg = forResvg(typeof input === "string" ? input : input.svg);
  const { width } = sizeOf(input);
  const scale = options.scale ?? 1;
  if (!(scale > 0)) throw new Error("bozzetto: scale must be more than 0.");
  const Resvg = await resvg();
  const image = new Resvg(svg, {
    fitTo: { mode: "width", value: Math.round(width * scale) },
    // Loading system fonts is slow, and only labels use text.
    font: { loadSystemFonts: svg.includes("<text"), defaultFontFamily: "Helvetica" },
  });
  return image.render().asPng();
}
