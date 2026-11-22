/**
 * A workaround for a crash in resvg 2.6, used by `toPng`. Not part of the public API.
 *
 * resvg draws some elements on a layer of their own: those with `opacity`, a clip path, a mask or a
 * filter. When such a layer lies entirely outside the canvas, resvg aborts the whole process instead
 * of skipping it. Pictures do this often enough: an avatar crops a picture to a head, leaving a soft
 * shadow or a clipped pattern out of view, and a far-off detail can fall outside a narrow picture.
 *
 * The SVG is rewritten so every layer touches the canvas, without changing how it looks:
 * - a plain, unfiltered shape's `opacity` becomes `fill-opacity` and `stroke-opacity`, which need no layer;
 * - a clipped or masked shape, and a translucent `use` or pattern-filled shape (whose fill-opacity
 *   draws a little differently), moves its clip, mask or opacity to a group
 *   around it (with its transform, which a clip is measured after; clips and masks in bozzetto use
 *   user-space units, so they draw the same);
 * - every clipped, masked or translucent group gets an invisible copy of the canvas, mapped into the
 *   group's own coordinates, so the layer always covers the canvas, and is never much bigger than it.
 *   (A smaller mark isn't enough once a clip leaves it out; a much bigger one makes resvg cap the
 *   layer's size, and part of what's in it goes missing.)
 */

type Matrix = readonly [number, number, number, number, number, number];

const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

const multiply = (m: Matrix, n: Matrix): Matrix => [
  m[0] * n[0] + m[2] * n[1],
  m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3],
  m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4],
  m[1] * n[4] + m[3] * n[5] + m[5],
];

/** The matrix of an SVG `transform` list: translate, scale, rotate and matrix, as pictures use. */
function parseTransform(text: string): Matrix {
  let m = IDENTITY;
  for (const [, name, args] of text.matchAll(/(\w+)\s*\(([^)]*)\)/g)) {
    const v = args
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);
    let t: Matrix = IDENTITY;
    if (name === "translate") t = [1, 0, 0, 1, v[0], v[1] ?? 0];
    else if (name === "scale") t = [v[0], 0, 0, v[1] ?? v[0], 0, 0];
    else if (name === "matrix") t = [v[0], v[1], v[2], v[3], v[4], v[5]];
    else if (name === "rotate") {
      const a = (v[0] * Math.PI) / 180;
      const [cx, cy] = [v[1] ?? 0, v[2] ?? 0];
      t = multiply(multiply([1, 0, 0, 1, cx, cy], [Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0]), [
        1,
        0,
        0,
        1,
        -cx,
        -cy,
      ]);
    }
    m = multiply(m, t);
  }
  return m;
}

/** Where a canvas point falls in the coordinates under matrix m. */
function unproject(m: Matrix, x: number, y: number): [number, number] {
  const det = m[0] * m[3] - m[1] * m[2] || 1;
  const dx = x - m[4];
  const dy = y - m[5];
  return [(m[3] * dx - m[2] * dy) / det, (m[0] * dy - m[1] * dx) / det];
}

const n3 = (v: number) => String(Math.round(v * 1000) / 1000);
const SHAPE = /<(rect|circle|ellipse|path|polygon|polyline|line)\b([^>]*?)\sopacity="([\d.]+)"([^>]*?)(\/?)>/g;
const LAYERED = /\s(?:clip-path|mask|opacity)="/;
// Containers whose content isn't drawn where it stands (or not at all), so it gets no anchor.
const OFFSTAGE = new Set(["defs", "clipPath", "mask", "pattern", "symbol", "marker"]);

export function forResvg(svg: string): string {
  const view = /<svg[^>]*\sviewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/.exec(svg);
  const [vx, vy, vw, vh] = view
    ? view.slice(1).map(Number)
    : [
        0,
        0,
        Number(/<svg[^>]*\swidth="([\d.]+)"/.exec(svg)?.[1] ?? 0),
        Number(/<svg[^>]*\sheight="([\d.]+)"/.exec(svg)?.[1] ?? 0),
      ];
  const corners: [number, number][] = [
    [vx, vy],
    [vx + vw, vy],
    [vx + vw, vy + vh],
    [vx, vy + vh],
  ];
  const patterns = new Set([...svg.matchAll(/<pattern\b[^>]*\sid="([^"]+)"/g)].map(m => m[1]));

  const rewritten = svg
    .replace(SHAPE, (whole: string, tag: string, before: string, opacity: string, after: string, close: string) => {
      const attrs = before + after;
      // A filtered shape (a texture) keeps its opacity: resvg draws those, and fill-opacity would
      // only fade its fill, not the filter's result.
      if (/\sfilter="/.test(attrs)) return whole;
      // A pattern fill draws a little differently with fill-opacity, so it's wrapped below instead.
      const paint = /\sfill="url\(#([^)]+)\)"/.exec(attrs)?.[1];
      if (paint && patterns.has(paint)) return whole;
      const times = (name: string) => {
        const own = new RegExp(`\\s${name}="([\\d.]+)"`).exec(attrs);
        return own ? Number(own[1]) * Number(opacity) : Number(opacity);
      };
      const rest = attrs.replace(/\s(fill|stroke)-opacity="[\d.]+"/g, "");
      return `<${tag}${rest} fill-opacity="${n3(times("fill-opacity"))}" stroke-opacity="${n3(times("stroke-opacity"))}"${close}>`;
    })
    .replace(
      /<(rect|circle|ellipse|path|polygon|polyline|line|use)\b([^>]*?)\s(clip-path|mask)="([^"]*)"([^>]*?)\/>/g,
      (_, tag: string, before: string, name: string, value: string, after: string) => {
        const transform = /\stransform="[^"]*"/.exec(before + after)?.[0] ?? "";
        const rest = (before + after).replace(/\stransform="[^"]*"/, "");
        return `<g${transform} ${name}="${value}"><${tag}${rest}/></g>`;
      },
    )
    .replace(
      // What's left with `opacity`: uses, and shapes filled with a pattern.
      /<(use|rect|circle|ellipse|path|polygon|polyline|line)\b([^>]*?)\sopacity="([^"]*)"([^>]*?)\/>/g,
      // A filtered one is left as it is: resvg renders those, and fails when they're wrapped.
      (whole: string, tag: string, before: string, opacity: string, after: string) =>
        /\sfilter="/.test(before + after) ? whole : `<g opacity="${opacity}"><${tag}${before}${after}/></g>`,
    );

  // Walk the container tags, keeping each open group's transform, and anchor the layered groups.
  const stack: { tag: string; m: Matrix }[] = [{ tag: "svg", m: IDENTITY }];
  return rewritten.replace(
    /<(\/?)(g|defs|clipPath|mask|pattern|symbol|marker)\b([^>]*?)(\/?)>/g,
    (whole: string, closing: string, tag: string, attrs: string, selfClosing: string) => {
      if (selfClosing) return whole;
      if (closing) {
        stack.pop();
        return whole;
      }
      const parent = stack[stack.length - 1];
      const own = /\stransform="([^"]*)"/.exec(attrs);
      const m = own ? multiply(parent.m, parseTransform(own[1])) : parent.m;
      const offstage = OFFSTAGE.has(tag) || stack.some(s => OFFSTAGE.has(s.tag));
      stack.push({ tag, m });
      if (tag !== "g" || offstage || !LAYERED.test(attrs)) return whole;
      const points = corners.map(([x, y]) => unproject(m, x, y).map(n3).join(",")).join(" ");
      return `${whole}<polygon points="${points}" fill="#000" fill-opacity="0"/>`;
    },
  );
}
