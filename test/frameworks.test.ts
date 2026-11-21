import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";
import { animals, cat, render } from "../src";
import { optionsKey } from "../src/frameworks";
import { Placeholder as ReactPlaceholder, usePlaceholders } from "../src/react";
import { Placeholder as VuePlaceholder } from "../src/vue";

const owl = render(animals[3], { seed: 3, size: "320x240" });
const attr = (html: string, name: string) => new RegExp(`${name}="([^"]*)"`).exec(html)?.[1];
const unescape = (text?: string) =>
  text
    ?.replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"');

describe("optionsKey", () => {
  it("is the same for equal options, including kinds with options", () => {
    expect(optionsKey({ kind: cat.with({ tabby: true }), seed: 2 })).toBe(
      optionsKey({ kind: cat.with({ tabby: true }), seed: 2 }),
    );
    expect(optionsKey({ kind: cat.with({ tabby: true }) })).not.toBe(optionsKey({ kind: cat.with({ tabby: false }) }));
    expect(optionsKey({ kind: [animals, "donut"] })).toBe(optionsKey({ kind: [animals, "donut"] }));
  });
});

describe("React", () => {
  it("renders an <img> with the picture's source, alt text, size and focus", () => {
    const html = renderToStaticMarkup(createElement(ReactPlaceholder, { kind: "owl", seed: 3, size: "320x240" }));
    expect(html.startsWith("<img")).toBe(true);
    expect(unescape(attr(html, "src"))).toBe(owl.src);
    expect(unescape(attr(html, "alt"))).toBe(owl.alt);
    expect([attr(html, "width"), attr(html, "height")]).toEqual(["320", "240"]);
    expect(attr(html, "style")).toContain("object-position:");
    expect(attr(html, "style")).toContain(`background-color:${owl.color}`);
  });

  it("passes attributes through, and lets alt and style override", () => {
    const html = renderToStaticMarkup(
      createElement(ReactPlaceholder, {
        kind: cat.with({ tabby: true }),
        className: "photo",
        loading: "lazy",
        alt: "",
        style: { borderRadius: 8 },
      }),
    );
    expect(attr(html, "class")).toBe("photo");
    expect(attr(html, "loading")).toBe("lazy");
    expect(attr(html, "alt")).toBe("");
    expect(attr(html, "style")).toContain("border-radius:8px");
  });

  it("draws inline SVG", () => {
    const html = renderToStaticMarkup(
      createElement(ReactPlaceholder, { kind: "owl", seed: 3, size: "320x240", inline: true }),
    );
    expect(html).toContain('role="img"');
    expect(unescape(attr(html, "aria-label"))).toBe(owl.alt);
    expect(html).toContain(owl.svg);
  });

  it("gives lists through usePlaceholders", () => {
    let seen: string[] = [];
    const List = () => {
      seen = usePlaceholders(4, { kind: animals, seed: 5 }).map(p => p.kind);
      return null;
    };
    renderToStaticMarkup(createElement(List));
    expect(seen).toHaveLength(4);
    expect(new Set(seen).size).toBe(4);
  });
});

describe("Vue", () => {
  const ssr = (props: Record<string, unknown>, attrs: Record<string, unknown> = {}) =>
    renderToString(createSSRApp({ render: () => h(VuePlaceholder, { ...props, ...attrs }) }));

  it("renders an <img> with the picture's source, alt text, size and focus", async () => {
    const html = await ssr({ kind: "owl", seed: 3, size: "320x240" });
    expect(html.startsWith("<img")).toBe(true);
    expect(unescape(attr(html, "src"))).toBe(owl.src);
    expect(unescape(attr(html, "alt"))).toBe(owl.alt);
    expect([attr(html, "width"), attr(html, "height")]).toEqual(["320", "240"]);
    expect(attr(html, "style")).toContain("object-position:");
  });

  it("lets attributes fall through and alt override", async () => {
    const html = await ssr({ kind: "owl", alt: "" }, { class: "photo", loading: "lazy" });
    expect(attr(html, "class")).toBe("photo");
    expect(attr(html, "loading")).toBe("lazy");
    // Vue writes an empty alt as the bare attribute, which HTML reads as alt="".
    expect(html).toMatch(/\salt[\s>]/);
  });

  it("draws inline SVG", async () => {
    const html = await ssr({ kind: "owl", seed: 3, size: "320x240", inline: true });
    expect(html).toContain('role="img"');
    expect(html).toContain(owl.svg);
  });
});
