/**
 * Dark mode inside the picture: an SVG that recolors itself when the viewer's color scheme is dark.
 *
 * Every element that has a color (a fill, stroke, gradient stop, or the `color` that `currentColor`
 * paints with) gets a class naming that color, and a `<style>` inside the SVG
 * gives each class its dark color under `@media (prefers-color-scheme: dark)`. CSS beats SVG's
 * presentation attributes, so the light colors stay as they are and the dark ones win only in
 * dark mode. Class names are unique to the picture, so many can share a page.
 */
import { hash } from "../draw/core";
import { COLOR } from "./color";

const PAINT = new RegExp(String.raw`\s(fill|stroke|stop-color|color)="(${COLOR.source})"`, "g");
const PROPERTY = { fill: "f", stroke: "s", "stop-color": "p", color: "c" } as const;
const TAG = /<[a-zA-Z][^>]*>/g;
const MASK = /<mask[\s\S]*?<\/mask>/g;

/** Every painted color in markup, in order, with masks left out (their black and white are a shape). */
function paints(svg: string): string[] {
  return [...svg.replace(MASK, "").matchAll(PAINT)].map(m => m[2]);
}

/**
 * The light picture, with classes and a `<style>` that swap in `dark`'s colors in dark mode.
 * `dark` must be the same picture recolored (as `stylize` makes it), so its colors line up with
 * the light picture's one for one. With a `selector` such as ".dark", the dark colors apply under
 * that selector instead of the system setting, for pages with their own theme switch (inline SVG
 * only): such a page decides when it's dark, even against the system setting.
 */
export function withDarkMode(light: string, dark: string, selector?: string): string {
  const lightPaints = paints(light);
  const darkPaints = paints(dark);
  if (lightPaints.length !== darkPaints.length)
    throw new Error("bozzetto: the dark picture doesn't match the light one.");

  // Each light color's dark color, and a short class index for each.
  const darkOf = new Map<string, string>();
  lightPaints.forEach((color, k) => darkOf.has(color) || darkOf.set(color, darkPaints[k]));
  const index = new Map([...darkOf.keys()].map((color, k) => [color, k]));
  const prefix = `bzd${hash(light).toString(36)}`;

  // Add the classes, tag by tag, leaving masks alone.
  const used = new Set<string>();
  const classed = light.replace(new RegExp(`${MASK.source}|${TAG.source}`, "g"), tag => {
    if (tag.startsWith("<mask")) return tag;
    const classes = [...tag.matchAll(PAINT)].map(m => {
      const name = `${prefix}-${PROPERTY[m[1] as keyof typeof PROPERTY]}${index.get(m[2])}`;
      used.add(`${m[1]}|${m[2]}|${name}`);
      return name;
    });
    return classes.length ? tag.replace(/^<([a-zA-Z]+)/, `<$1 class="${classes.join(" ")}"`) : tag;
  });

  const rules = [...used]
    .map(entry => {
      const [property, color, name] = entry.split("|");
      return `.${name}{${property}:${darkOf.get(color)}}`;
    })
    .join("");
  const css = selector
    ? rules.replace(/\.(bzd[a-z0-9]+-[fspc]\d+)\{/g, `${selector} .$1{`)
    : `@media (prefers-color-scheme: dark){${rules}}`;
  // The style goes first inside the root element, so it applies to everything after it.
  return classed.replace(/^(<svg[^>]*>)/, `$1<style>${css}</style>`);
}
