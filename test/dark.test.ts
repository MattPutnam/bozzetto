import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { avatar, kinds, night, owl, render, stylize } from "../src";
import { hexToLch } from "../src/color/color";
import { Placeholder } from "../src/frameworks/react";

const COLOR = /hsl\((-?\d+) (\d+)% (\d+)%\)|#[0-9a-f]{3,6}/g;
/** The picture as the light version: classes and the style taken out. */
const lightOnly = (svg: string) => svg.replace(/<style>.*?<\/style>/, "").replace(/ class="[^"]*"/g, "");
/** The color each dark rule gives each class. */
const darkRules = (svg: string) => {
  const css = /<style>@media \(prefers-color-scheme: dark\)\{(.*?)\}\}/.exec(svg)![1] + "}";
  return new Map([...css.matchAll(/\.([\w-]+)\{[\w-]+:([^}]+)\}/g)].map(m => [m[1], m[2]]));
};

describe("dark", () => {
  it("leaves the light picture as it was", () => {
    for (const kind of kinds) {
      const plain = render(kind, { seed: 5 }).svg;
      expect(lightOnly(render(kind, { seed: 5, dark: true }).svg), kind.id).toBe(plain);
    }
  });

  it("gives every color its dim color in dark mode", () => {
    for (const kind of kinds) {
      const picture = render(kind, { seed: 5, dark: true });
      const expected = stylize(render(kind, { seed: 5 }).svg, { palette: "dim" });
      const rules = darkRules(picture.svg);
      // Walk the painted attributes of both in step: each class's dark color is the dim color.
      const classed = [...picture.svg.replace(/<mask[\s\S]*?<\/mask>/g, "").matchAll(/<[a-zA-Z][^>]*>/g)].map(
        m => m[0],
      );
      const dimmed = [...expected.replace(/<mask[\s\S]*?<\/mask>/g, "").matchAll(/<[a-zA-Z][^>]*>/g)].map(m => m[0]);
      const tags = classed.filter(tag => !tag.startsWith("<style"));
      expect(tags.length).toBe(dimmed.length);
      tags.forEach((tag, k) => {
        const classes = /class="([^"]*)"/.exec(tag)?.[1].split(" ") ?? [];
        const paints = [...dimmed[k].matchAll(/\s(fill|stroke|stop-color)="((?:hsl\([^)]*\)|#[0-9a-f]{3,6}))"/g)].map(
          m => m[2],
        );
        expect(
          classes.map(c => rules.get(c)),
          `${kind.id} ${tag.slice(0, 40)}`,
        ).toEqual(paints);
      });
    }
  });

  it("takes any palette, and reports the dark background", () => {
    const picture = render(owl, { seed: 2, dark: "sea glass" });
    expect(picture.svg).toContain("prefers-color-scheme: dark");
    expect(picture.darkColor).toMatch(/^#[0-9a-f]{6}$/);
    expect(picture.darkColor).not.toBe(picture.color);
    expect(render(owl, { seed: 2 }).darkColor).toBeUndefined();
  });

  it("follows a selector instead of the system setting, for pages with their own theme switch", () => {
    const plain = render(owl, { seed: 2, dark: true }).svg;
    const svg = render(owl, { seed: 2, dark: true, darkSelector: "[data-theme=dark]" }).svg;
    expect(svg).toMatch(/\[data-theme=dark\] \.bzd[a-z0-9]+-[fsp]\d+\{/);
    expect(svg).not.toContain("prefers-color-scheme");
    // The same dark colors, under the selector.
    const selectorRules = /<style>(.*?)<\/style>/.exec(svg)![1].replaceAll("[data-theme=dark] ", "");
    expect(`@media (prefers-color-scheme: dark){${selectorRules}}`).toBe(/<style>(.*?)<\/style>/.exec(plain)![1]);
  });

  it("leaves masks alone and uses class names unique to the picture", () => {
    const moon = render(night.with({ moon: "crescent" }), { seed: 1, dark: true }).svg;
    const mask = /<mask[\s\S]*?<\/mask>/.exec(moon)![0];
    expect(mask).not.toContain("class=");
    const prefix = (svg: string) => /class="(bzd[a-z0-9]+)-/.exec(svg)![1];
    expect(prefix(render(owl, { seed: 1, dark: true }).svg)).not.toBe(prefix(render(owl, { seed: 2, dark: true }).svg));
  });

  it("works for avatars, and through the React component", () => {
    expect(avatar({ seed: "ada", dark: true }).svg).toContain("prefers-color-scheme: dark");
    const html = renderToStaticMarkup(createElement(Placeholder, { kind: "owl", dark: true }));
    expect(decodeURIComponent(/src="([^"]*)"/.exec(html)![1])).toContain("prefers-color-scheme: dark");
    expect(html).not.toContain(" dark=");
  });
});

describe("adjustments", () => {
  it("never write a negative hue", () => {
    for (const kind of kinds) {
      for (const palette of ["dusk", "vivid", "pastel", "muted"]) {
        for (const m of stylize(render(kind, { seed: 3 }).svg, { palette }).matchAll(COLOR)) {
          if (m[1] !== undefined) expect(Number(m[1])).toBeLessThan(360);
        }
        expect(stylize(render(kind, { seed: 3 }).svg, { palette })).not.toMatch(/hsl\(-/);
      }
    }
  });

  it("dim darkens every color and keeps its hue", () => {
    // A picture of hex colors, so hue can be compared directly.
    const svg =
      '<svg width="10" height="10"><rect fill="#e76f51"/><rect fill="#2a9d8f"/><rect fill="#f4f1de"/><rect fill="#264653"/></svg>';
    const before = [...svg.matchAll(/#[0-9a-f]{6}/g)].map(m => m[0]);
    const after = [...stylize(svg, { palette: "dim" }).matchAll(/#[0-9a-f]{6}/g)].map(m => m[0]);
    expect(after).toHaveLength(before.length);
    after.forEach((color, k) => {
      const [L, C, h] = hexToLch(color);
      const [L0, C0, h0] = hexToLch(before[k]);
      expect(L).toBeLessThanOrEqual(0.62);
      expect(L).toBeGreaterThanOrEqual(0.15);
      if (L0 > 0.3) expect(L).toBeLessThan(L0);
      if (C0 > 0.03) expect(Math.abs(((h - h0 + 540) % 360) - 180)).toBeLessThan(6);
      expect(C).toBeLessThanOrEqual(C0 + 0.005);
    });
  });
});
