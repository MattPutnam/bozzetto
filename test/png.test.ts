import { describe, expect, it } from "vitest";
import { avatar, faces, hills, kinds, night, octopus, render, toImageBlob } from "../src";
import { toPng } from "../src/node";
import { forResvg } from "../src/node/resvg-fix";

/** The width and height in a PNG's header. */
function pngSize(bytes: Uint8Array): { width: number; height: number } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}
const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

describe("forResvg", () => {
  it("keeps a texture's opacity, so a textured PNG is no stronger than its SVG", () => {
    for (const texture of ["grain", "paper"] as const) {
      const svg = render(hills, { seed: 2, texture }).svg;
      const layer = (markup: string) => /<rect[^>]*\sfilter="[^"]*"[^>]*>/.exec(markup)?.[0];
      expect(layer(forResvg(svg)), texture).toBe(layer(svg));
      expect(layer(svg), texture).toMatch(/\sopacity="/);
    }
  });
});

describe("octopus", () => {
  it("says an octopus, not a octopus", () => {
    for (let seed = 1; seed <= 40; seed++) expect(render(octopus, { seed }).alt).toMatch(/^(An|A sleepy) octopus/);
  });
});

describe("toPng", () => {
  it("makes a PNG the picture's size", async () => {
    const png = await toPng(render(hills, { seed: 2, size: "320x240" }));
    expect([...png.slice(0, 8)]).toEqual(SIGNATURE);
    expect(pngSize(png)).toEqual({ width: 320, height: 240 });
  });

  it("scales", async () => {
    expect(pngSize(await toPng(render(hills), { scale: 2 }))).toEqual({ width: 800, height: 600 });
    expect(pngSize(await toPng(render(hills, { size: "300x400" }), { scale: 0.5 }))).toEqual({
      width: 150,
      height: 200,
    });
  });

  it("takes SVG markup as well as pictures", async () => {
    const png = await toPng(render(night, { seed: 4 }).svg);
    expect(pngSize(png)).toEqual({ width: 400, height: 300 });
  });

  it("renders every kind, with palettes, textures and labels", async () => {
    for (const kind of kinds) {
      const png = await toPng(render(kind, { seed: 3, size: "120x90", palette: "riso", texture: "grain", label: 1 }));
      expect(pngSize(png), kind.id).toEqual({ width: 120, height: 90 });
    }
  });

  // resvg 2.6 aborts the process on a layer (opacity, clip or mask) wholly outside the canvas, so a
  // crash here takes the test run down with it rather than failing politely.
  it("survives layers outside the canvas", async () => {
    const offCanvas =
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><defs><clipPath id="c"><circle cx="50" cy="350" r="40"/></clipPath></defs>' +
      '<rect width="100" height="100" fill="#ccc"/><rect y="300" width="100" height="3" opacity="0.2"/>' +
      '<g opacity="0.5"><rect y="300" width="100" height="3"/></g><g clip-path="url(#c)"><rect y="300" width="100" height="100"/></g></svg>';
    expect(pngSize(await toPng(offCanvas))).toEqual({ width: 100, height: 100 });
  });

  it("renders every face kind as an avatar", async () => {
    for (const kind of faces) {
      for (const seed of [1, 2, 3, 5, 8]) {
        expect(pngSize(await toPng(avatar({ kind, seed, size: 48 }))), `${kind.id} ${seed}`).toEqual({
          width: 48,
          height: 48,
        });
      }
    }
  });

  it("draws the same once rewritten for resvg", () => {
    const svg = forResvg(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">' +
        '<rect width="10" height="10" fill="#000" opacity="0.5"/><path d="M0 0H9" stroke="#000" opacity="0.4" stroke-opacity="0.5"/>' +
        '<g transform="translate(50 0) scale(-1 1)" opacity="0.3"><rect width="5" height="5"/></g></svg>',
    );
    expect(svg).toContain('<rect width="10" height="10" fill="#000" fill-opacity="0.5" stroke-opacity="0.5"/>');
    expect(svg).toContain('stroke-opacity="0.2"');
    // The group keeps its opacity, and gets an invisible copy of the canvas in its own (mirrored) space.
    expect(svg).toContain('opacity="0.3"><polygon points="50,0 -50,0 -50,100 50,100" fill="#000" fill-opacity="0"/>');
  });

  it("rejects a bad scale", async () => {
    await expect(toPng(render(hills), { scale: 0 })).rejects.toThrow(/scale must be more than 0/);
  });
});

describe("toImageBlob", () => {
  it("explains that it needs a browser", async () => {
    await expect(toImageBlob(render(hills))).rejects.toThrow(/needs a browser page/);
  });
});
