import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { avatar, avatars, cat, faces, hills, kinds, render } from "../src";
import { Avatar } from "../src/react";

const viewBox = (svg: string) => /viewBox="([^"]+)"/.exec(svg)![1].split(" ").map(Number);

describe("frames", () => {
  it("are reported by every face kind, and only by them", () => {
    for (const kind of kinds) {
      const frame = render(kind, { seed: 4 }).frame;
      if (faces.some(f => f.id === kind.id)) {
        expect(frame, kind.id).toBeDefined();
        expect(frame!.width).toBeGreaterThan(0.1);
        expect(frame!.height).toBeGreaterThan(0.1);
        expect(frame!.x + frame!.width).toBeLessThanOrEqual(1);
        expect(frame!.y + frame!.height).toBeLessThanOrEqual(1);
      } else {
        expect(frame, kind.id).toBeUndefined();
      }
    }
  });
});

describe("avatar", () => {
  it("is a square of the asked size, cropped from a 400x400 drawing", () => {
    const picture = avatar({ seed: "alice", size: 48 });
    expect([picture.width, picture.height]).toEqual([48, 48]);
    expect(picture.svg).toContain('width="48" height="48"');
    const [x, y, w, h] = viewBox(picture.svg);
    expect(w).toBe(h);
    expect(x).toBeGreaterThanOrEqual(0);
    expect(y).toBeGreaterThanOrEqual(0);
    expect(x + w).toBeLessThanOrEqual(400);
    expect(y + h).toBeLessThanOrEqual(400);
  });

  it("frames every face kind's head, for many seeds", () => {
    for (const kind of faces) {
      for (let seed = 1; seed <= 25; seed++) {
        const picture = avatar({ kind, seed });
        const [x, y, side] = viewBox(picture.svg);
        // The crop is at most the drawing and leaves the face filling a good part of it.
        expect(side, `${kind.id} ${seed}`).toBeLessThanOrEqual(400);
        expect(side, `${kind.id} ${seed}`).toBeGreaterThan(80);
        const frame = render(kind, { seed, size: { width: 400, height: 400 } }).frame!;
        const cx = (frame.x + frame.width / 2) * 400;
        const cy = (frame.y + frame.height / 2) * 400;
        expect(cx, `${kind.id} ${seed}`).toBeGreaterThanOrEqual(x);
        expect(cx).toBeLessThanOrEqual(x + side);
        expect(cy, `${kind.id} ${seed}`).toBeGreaterThanOrEqual(y);
        expect(cy).toBeLessThanOrEqual(y + side);
        expect(picture.focus.x).toBeGreaterThanOrEqual(0);
        expect(picture.focus.x).toBeLessThanOrEqual(1);
        expect(picture.svg).not.toMatch(/NaN|undefined|Infinity/);
      }
    }
  });

  it("is clipped to its shape", () => {
    expect(avatar({ seed: 1 }).svg).toMatch(/<clipPath id="[^"]+"><circle /);
    expect(avatar({ seed: 1, shape: "rounded" }).svg).toMatch(/<clipPath id="[^"]+"><rect [^>]*rx="/);
    expect(avatar({ seed: 1, shape: "square" }).svg).not.toContain("<clipPath");
  });

  it("keeps the picture's alt text, options and color", () => {
    const picture = avatar({ kind: cat.with({ tabby: true }), seed: 3 });
    const drawn = render(cat.with({ tabby: true }), { seed: 3, size: { width: 400, height: 400 } });
    expect(picture.alt).toBe(drawn.alt);
    expect(picture.options).toEqual(drawn.options);
    expect(picture.color).toBe(drawn.color);
    expect(picture.kind).toBe("cat");
  });

  it("is the same for the same seed, such as a user id", () => {
    expect(avatar({ seed: "user-42" }).svg).toBe(avatar({ seed: "user-42" }).svg);
    expect(avatar({ seed: "user-42" }).svg).not.toBe(avatar({ seed: "user-43" }).svg);
  });

  it("takes palettes and textures", () => {
    expect(avatar({ seed: 2, palette: "grayscale" }).svg).toContain("hsl(0 0%");
    expect(avatar({ seed: 2, texture: "grain" }).svg).toContain("feTurbulence");
  });

  it("refuses kinds without a face", () => {
    expect(() => avatar({ kind: hills })).toThrow(/hills can't be an avatar/);
    expect(() => avatar({ size: 0 })).toThrow(/size must be more than 0/);
  });
});

describe("avatars", () => {
  it("uses every face once before repeating, and seeds like placeholders", () => {
    const list = avatars(faces.length, { seed: 10, size: 32 });
    expect(new Set(list.map(p => p.kind)).size).toBe(faces.length);
    expect(list[2].svg).toBe(avatar({ kind: faces.find(k => k.id === list[2].kind)!, seed: 12, size: 32 }).svg);
  });
});

describe("<Avatar>", () => {
  it("renders an <img> whose loading color is rounded to its shape", () => {
    const round = renderToStaticMarkup(createElement(Avatar, { seed: "alice", size: 40 }));
    expect(round).toContain('width="40"');
    expect(round).toContain("border-radius:50%");
    const square = renderToStaticMarkup(createElement(Avatar, { seed: "alice", size: 40, shape: "square" }));
    expect(square).not.toContain("border-radius");
  });
});
