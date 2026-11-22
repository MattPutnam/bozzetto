// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { animals, cat, owl, render } from "../src";
import "../src/frameworks/element";

const make = (attributes: Record<string, string>) => {
  const element = document.createElement("bozzetto-img");
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  document.body.append(element);
  return element;
};
const image = (element: HTMLElement) => element.shadowRoot!.querySelector<HTMLElement>("[part=image]")!;

afterEach(() => document.body.replaceChildren());

describe("<bozzetto-img>", () => {
  it("reads number seeds as the API does, negative and fractional ones included", () => {
    for (const seed of ["-1", "1.5"])
      expect(make({ kind: "owl", seed }).picture?.svg, seed).toBe(render(owl, { seed: Number(seed) }).svg);
  });

  it("draws its picture as an image in its shadow root", () => {
    const element = make({ kind: "owl", seed: "3", size: "320x240" });
    const expected = render(owl, { seed: 3, size: "320x240" });
    const img = image(element) as HTMLImageElement;
    expect(img.tagName).toBe("IMG");
    expect(img.alt).toBe(expected.alt);
    expect(img.getAttribute("src")).toBe(expected.src);
    expect([img.width, img.height]).toEqual([320, 240]);
    expect(element.picture?.kind).toBe("owl");
  });

  it("reads kinds, options and categories like the command line", () => {
    const element = make({ kind: "cat:tabby,pupils=round", seed: "2" });
    expect(element.picture?.options).toMatchObject({ tabby: true, pupils: "round" });
    expect(element.picture?.svg).toBe(render(cat.with({ tabby: true, pupils: "round" }), { seed: 2 }).svg);
    const mixed = make({ kind: "animals donut", seed: "9" });
    expect([...animals.map(k => k.id), "donut"]).toContain(mixed.picture?.kind);
  });

  it("draws again when an attribute changes", () => {
    const element = make({ kind: "owl", seed: "1" });
    const before = element.picture?.svg;
    element.setAttribute("seed", "2");
    expect(element.picture?.svg).not.toBe(before);
    element.setAttribute("palette", "grayscale");
    expect(element.picture?.svg).toContain("hsl(0 0%");
  });

  it("takes alt and inline", () => {
    const element = make({ kind: "owl", alt: "A friendly owl", inline: "" });
    const inline = image(element);
    expect(inline.tagName).toBe("SPAN");
    expect(inline.getAttribute("role")).toBe("img");
    expect(inline.getAttribute("aria-label")).toBe("A friendly owl");
    expect(inline.innerHTML.startsWith("<svg")).toBe(true);
  });

  it("draws avatars", () => {
    const element = make({ avatar: "", seed: "alice", size: "48", shape: "rounded" });
    const img = image(element) as HTMLImageElement;
    expect([img.width, img.height]).toEqual([48, 48]);
    expect(element.picture?.svg).toMatch(/<clipPath id="[^"]+"><rect /);
    expect(element.shadowRoot!.querySelector("style")!.textContent).toContain("border-radius: 22%");
  });

  it("builds in dark mode with the dark attribute", () => {
    expect(make({ kind: "owl", dark: "" }).picture?.svg).toContain("prefers-color-scheme: dark");
    expect(make({ kind: "owl", dark: "riso" }).picture?.darkColor).toBeDefined();
    expect(make({ kind: "owl" }).picture?.svg).not.toContain("prefers-color-scheme");
  });

  it("logs a clear error for an unknown kind", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const element = make({ kind: "dragon" });
    expect(error).toHaveBeenCalledWith('<bozzetto-img>: unknown kind "dragon".');
    expect(element.shadowRoot!.childNodes).toHaveLength(0);
    error.mockRestore();
  });

  it("forgets its picture when a redraw fails", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const element = make({ kind: "owl" });
    expect(element.picture?.kind).toBe("owl");
    element.setAttribute("kind", "dragon");
    expect(element.picture).toBeUndefined();
    error.mockRestore();
  });

  it('reads dark="true" as on and dark="false" as off', () => {
    expect(make({ kind: "owl", dark: "true" }).picture?.svg).toContain("prefers-color-scheme: dark");
    const off = make({ kind: "owl", dark: "false" }).picture;
    expect(off?.svg).toBe(render(owl).svg);
  });
});
