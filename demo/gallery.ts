import {
  ADJUSTMENTS,
  PALETTES,
  categories,
  kinds,
  render as renderPicture,
  toSvg,
  type Kind,
  type Mapping,
  type StyleOptions,
  type Texture,
} from "../src";

const W = 400;
const H = 300;
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const NOTES: Record<keyof typeof categories, string> = {
  landscapes: "Gradient skies and layered silhouettes. Hue and horizon move with the seed.",
  art: "Loose homages to familiar 20th-century styles, from a dozen or so rectangles, circles and blobs.",
  people: "Portraits, people reading, working and out for a walk, pairs and groups. Skin, hair, age and clothes vary.",
  animals: "Built from ellipses and triangles. Coats, markings and the way they face vary.",
  food: "Seen from above or on a plate, with toppings that vary.",
  objects: "Still lifes on a table or shelf.",
  plants: "Potted plants, and close-ups of real flowers.",
  products: "Studio product shots, one item on a seamless backdrop, as in a shop.",
  patterns: "Calm, even textures to sit behind text on cards and banners.",
  buildings: "Cottages, castles, bridges and townhouses, by day, dusk or night.",
  vehicles: "Side views on roads, rails, water and sky, by day, dusk or night.",
};
const SECTIONS = (Object.keys(categories) as (keyof typeof categories)[]).map(name => ({
  name: name[0].toUpperCase() + name.slice(1),
  id: name,
  note: NOTES[name],
  kinds: categories[name] as readonly Kind[],
}));
const categoryOf = new Map<string, string>(SECTIONS.flatMap(s => s.kinds.map(k => [k.id, s.id] as const)));
const ALL: readonly Kind[] = kinds;
const byId = new Map(ALL.map(k => [k.id, k]));

const state = {
  seeds: Object.fromEntries(ALL.map((k, n) => [k.id, 7 + n * 101])) as Record<string, number>,
  style: {} as StyleOptions,
  selected: { id: ALL[0].id, i: 0 },
};

const render = (kind: Kind, seed: number, style: StyleOptions = state.style) =>
  toSvg(kind, { size: `${W}x${H}`, seed, ...style });
const uri = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
const shapes = (svg: string) => (svg.match(/<(rect|circle|ellipse|path|polygon|polyline|line)\b/g) ?? []).length;
const kb = (n: number) => (n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`);
const isAdjustment = (p: StyleOptions["palette"]) =>
  typeof p === "string" && (ADJUSTMENTS as readonly string[]).includes(p);
const styleText = (o: StyleOptions) =>
  [
    o.palette === undefined
      ? "original colors"
      : isAdjustment(o.palette)
        ? `palette ${o.palette}`
        : `palette ${o.palette} (${o.mapping ?? "balanced"})`,
    o.texture ? `${o.texture} texture` : "",
  ]
    .filter(Boolean)
    .join(", ");

function thumb(
  kind: Kind,
  seed: number,
  style: StyleOptions | undefined,
  onPick: () => void,
  pressed = false,
): HTMLButtonElement {
  const b = document.createElement("button");
  b.className = "thumb";
  b.setAttribute("aria-pressed", String(pressed));
  b.setAttribute("aria-label", `${kind.name}, seed ${seed}`);
  b.title = `${kind.id} · seed ${seed}`;
  const img = new Image();
  img.alt = "";
  img.src = uri(render(kind, seed, style));
  b.append(img);
  b.onclick = onPick;
  return b;
}

// ---------- contact sheets ----------
const host = $("categories");
for (const section of SECTIONS) {
  const sec = document.createElement("section");
  sec.innerHTML = `<div class="section-head"><h2>${section.name}</h2><p>${section.note}</p></div><div class="sheet"></div>`;
  for (const kind of section.kinds) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<div class="card-head"><h3>${kind.name}</h3><span class="count" id="count-${kind.id}"></span></div><div class="thumbs" id="thumbs-${kind.id}"></div><button class="reseed" id="reseed-${kind.id}">New seeds</button>`;
    sec.querySelector(".sheet")!.append(card);
  }
  host.append(sec);
}

function drawKind(kind: Kind) {
  const box = $(`thumbs-${kind.id}`);
  const base = state.seeds[kind.id];
  box.replaceChildren(
    ...[0, 1, 2, 3].map(i =>
      thumb(
        kind,
        base + i,
        undefined,
        () => select(kind.id, i),
        state.selected.id === kind.id && state.selected.i === i,
      ),
    ),
  );
  const svg = toSvg(kind, { size: `${W}x${H}`, seed: base });
  $(`count-${kind.id}`).textContent = `${shapes(svg)} shapes · ${kb(uri(svg).length)}`;
}

function select(id: string, i: number) {
  const prev = state.selected.id;
  state.selected = { id, i };
  if (prev !== id) drawKind(byId.get(prev)!);
  drawKind(byId.get(id)!);
  drawBench();
}

function drawBench() {
  const kind = byId.get(state.selected.id)!;
  const seed = state.seeds[kind.id] + state.selected.i;
  const picture = renderPicture(kind, { size: `${W}x${H}`, seed, ...state.style });
  const svg = picture.svg;
  const u = picture.src;
  $<HTMLImageElement>("big").src = u;
  $<HTMLImageElement>("big").alt = picture.alt;
  $("f-alt").textContent = picture.alt;
  $("f-focus").textContent = `x ${picture.focus.x.toFixed(2)}, y ${picture.focus.y.toFixed(2)}`;
  $("f-color").innerHTML = `<span class="swatch-chip" style="background:${picture.color}"></span>${picture.color}`;
  $("focus-mark").style.left = `${picture.focus.x * 100}%`;
  $("focus-mark").style.top = `${picture.focus.y * 100}%`;
  $("big-name").textContent = kind.name;
  $("f-kind").textContent = `${categoryOf.get(kind.id)} / ${kind.id}`;
  $("f-seed").textContent = String(seed);
  $("f-style").textContent = styleText(state.style);
  $("f-shapes").textContent = String(shapes(svg));
  $("f-bytes").textContent = `${kb(u.length)} as a data URI`;
  const o = state.style;
  const extra = [
    o.palette !== undefined ? `  palette: "${o.palette}",` : "",
    o.palette !== undefined && !isAdjustment(o.palette) && o.mapping && o.mapping !== "balanced"
      ? `  mapping: "${o.mapping}",`
      : "",
    o.texture ? `  texture: "${o.texture}",` : "",
  ]
    .filter(Boolean)
    .join("\n");
  $("f-call").textContent = `placeholder({\n  kind: "${kind.id}",\n  seed: ${seed},${extra ? "\n" + extra : ""}\n})`;
}

// ---------- palette matrices ----------
const SAMPLES = ["hills", "grid", "portrait", "cat", "fruit-bowl", "donut"];
function matrix(tableId: string, columns: { label: string; style: StyleOptions }[]) {
  const table = $(tableId);
  const head = `<tr><th></th>${columns.map(c => `<th scope="col">${c.label}</th>`).join("")}</tr>`;
  table.innerHTML = `<thead>${head}</thead><tbody></tbody>`;
  const body = table.querySelector("tbody")!;
  for (const id of SAMPLES) {
    const kind = byId.get(id)!;
    const seed = state.seeds[id];
    const tr = document.createElement("tr");
    const th = document.createElement("th");
    th.scope = "row";
    th.textContent = id;
    tr.append(th);
    for (const c of columns) {
      const td = document.createElement("td");
      td.append(
        thumb(kind, seed, c.style, () => {
          state.style = c.style;
          syncControls();
          redrawAll();
          select(id, 0);
        }),
      );
      tr.append(td);
    }
    body.append(tr);
  }
}
function drawMatrices() {
  matrix("adjustments", [
    { label: "original", style: {} },
    ...ADJUSTMENTS.map(a => ({ label: a, style: { palette: a } })),
  ]);
  const names = Object.keys(PALETTES);
  matrix("palettes", [
    ...names.map(palette => ({ label: palette, style: { palette } })),
    ...names.slice(0, 3).map(palette => ({ label: `${palette} · ramp`, style: { palette, mapping: "ramp" as const } })),
  ]);
}

// ---------- controls ----------
const palSel = $<HTMLSelectElement>("palette");
const mapSel = $<HTMLSelectElement>("mapping");
const texSel = $<HTMLSelectElement>("texture");
const option = (name: string) => `<option value="${name}">${name[0].toUpperCase() + name.slice(1)}</option>`;
palSel.innerHTML =
  `<option value="">Original colors</option>` +
  `<optgroup label="Adjust the picture's colors">${ADJUSTMENTS.map(option).join("")}</optgroup>` +
  `<optgroup label="Color palettes">${Object.keys(PALETTES).map(option).join("")}</optgroup>`;

function readControls() {
  const palette = palSel.value || undefined;
  state.style = {
    palette,
    mapping: palette ? (mapSel.value as Mapping) : undefined,
    texture: (texSel.value || undefined) as Texture | undefined,
  };
  redrawAll();
}
function syncControls() {
  palSel.value = typeof state.style.palette === "string" ? state.style.palette : "";
  mapSel.value = state.style.mapping ?? "balanced";
  texSel.value = state.style.texture ?? "";
}
function redrawAll() {
  ALL.forEach(drawKind);
  drawBench();
}
for (const el of [palSel, mapSel, texSel]) el.addEventListener("change", readControls);

for (const kind of ALL) {
  $(`reseed-${kind.id}`).onclick = () => {
    state.seeds[kind.id] = Math.floor(Math.random() * 99999) + 1;
    drawKind(kind);
    if (state.selected.id === kind.id) drawBench();
  };
}
$("shuffle").onclick = () => {
  for (const k of ALL) state.seeds[k.id] = Math.floor(Math.random() * 99999) + 1;
  redrawAll();
  drawMatrices();
};

drawMatrices();
redrawAll();
