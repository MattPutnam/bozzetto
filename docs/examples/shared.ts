/**
 * Layout helpers for the manual's example pictures: they arrange finished pictures into one SVG.
 * Each picture keeps its own `<svg>` (and its own unique element ids), placed and scaled in.
 */
import type { Picture } from "../../src";

const PAPER = "#f1f3ee";
const INK = "#3b4540";

/** One picture's markup, moved to (x, y) and scaled to width × height. */
export function place(picture: Picture, x: number, y: number, width: number, height: number): string {
  return picture.svg.replace(
    /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="[^"]+" height="[^"]+"/,
    `<svg x="${x}" y="${y}" width="${width}" height="${height}"`,
  );
}

const sheet = (width: number, height: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
  `<rect width="${width}" height="${height}" fill="${PAPER}"/>${body}</svg>`;

/**
 * Pictures in justified rows, like a photo gallery: every row is the full width,
 * and each picture keeps its own shape.
 */
export function justified(pictures: Picture[], width = 720, rowHeight = 150, gap = 6): string {
  let body = "";
  let y = gap;
  let row: Picture[] = [];
  const flush = (last: boolean) => {
    const aspects = row.map(p => p.width / p.height);
    const natural = aspects.reduce((sum, a) => sum + a, 0);
    const inner = width - gap * (row.length + 1);
    const h = last ? Math.min(rowHeight, inner / natural) : inner / natural;
    let x = gap;
    row.forEach((p, k) => {
      const w = aspects[k] * h;
      body += place(p, x, y, w, h);
      x += w + gap;
    });
    y += h + gap;
    row = [];
  };
  for (const picture of pictures) {
    row.push(picture);
    const natural = row.reduce((sum, p) => sum + p.width / p.height, 0);
    if (natural * rowHeight + gap * (row.length + 1) >= width) flush(false);
  }
  if (row.length) flush(true);
  return sheet(width, Math.ceil(y), body);
}

/** Pictures in a grid of equal cells, each with an optional label underneath. */
export function grid(
  items: { picture: Picture; label?: string }[],
  columns: number,
  cellWidth = 168,
  cellHeight = 126,
  gap = 8,
): string {
  const labelled = items.some(item => item.label);
  const rowHeight = cellHeight + (labelled ? 20 : 0);
  const rows = Math.ceil(items.length / columns);
  const width = gap + columns * (cellWidth + gap);
  const height = gap + rows * (rowHeight + gap);
  const body = items
    .map(({ picture, label }, k) => {
      const x = gap + (k % columns) * (cellWidth + gap);
      const y = gap + Math.floor(k / columns) * (rowHeight + gap);
      const text = label
        ? `<text x="${x + cellWidth / 2}" y="${y + cellHeight + 15}" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="12" fill="${INK}">${label}</text>`
        : "";
      return place(picture, x, y, cellWidth, cellHeight) + text;
    })
    .join("");
  return sheet(width, height, body);
}

/** A palette as a strip of swatches, with an optional label on the left. */
export function swatches(rows: { colors: readonly string[]; label: string }[], width = 720, rowHeight = 40): string {
  const labelWidth = 170;
  const gap = 8;
  const height = gap + rows.length * (rowHeight + gap);
  const body = rows
    .map(({ colors, label }, r) => {
      const y = gap + r * (rowHeight + gap);
      const cell = (width - labelWidth - gap) / colors.length;
      const chips = colors
        .map(
          (color, k) =>
            `<rect x="${labelWidth + k * cell}" y="${y}" width="${cell + 0.5}" height="${rowHeight}" fill="${color}"/>`,
        )
        .join("");
      const text = `<text x="${gap}" y="${y + rowHeight / 2 + 4}" font-family="ui-monospace,Menlo,monospace" font-size="12" fill="${INK}">${label}</text>`;
      return chips + text;
    })
    .join("");
  return sheet(width, height, body);
}
