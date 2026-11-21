import { describe, expect, it } from "vitest";
import { hills, kinds, night, render, toImageBlob } from "../src";
import { toPng } from "../src/node";

/** The width and height in a PNG's header. */
function pngSize(bytes: Uint8Array): { width: number; height: number } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}
const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

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

  it("rejects a bad scale", async () => {
    await expect(toPng(render(hills), { scale: 0 })).rejects.toThrow(/scale must be more than 0/);
  });
});

describe("toImageBlob", () => {
  it("explains that it needs a browser", async () => {
    await expect(toImageBlob(render(hills))).rejects.toThrow(/needs a browser page/);
  });
});
