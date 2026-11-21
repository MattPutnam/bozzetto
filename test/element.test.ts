// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cat, owl, render } from "../src";
import "../src/element";

const make = (attributes: Record<string, string>) => {
  const element = document.createElement("bozzetto-img");
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  document.body.append(element);
  return element;
};
const image = (element: HTMLElement) => element.shadowRoot!.querySelector<HTMLElement>("[part=image]")!;

afterEach(() => document.body.replaceChildren());

describe("<bozzetto-img>", () => {
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
    expect([
      "cat",
      "bird",
      "fish",
      "owl",
      "dog",
      "fox",
      "penguin",
      "whale",
      "frog",
      "rabbit",
      "snail",
      "donut",
    ]).toContain(mixed.picture?.kind);
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

  it("logs a clear error for an unknown kind", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const element = make({ kind: "dragon" });
    expect(error).toHaveBeenCalledWith('<bozzetto-img>: unknown kind "dragon".');
    expect(element.shadowRoot!.childNodes).toHaveLength(0);
    error.mockRestore();
  });
});
