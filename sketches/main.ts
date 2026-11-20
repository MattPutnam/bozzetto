import { kinds as builtIn, toSvg, type Kind } from "../src";
import { animals } from "./animals";
import { food } from "./food";
import { MOODS, PALETTES, stylize, type Mood, type StyleOptions, type Texture } from "./moods";
import { objects } from "./objects";

const W = 400;
const H = 300;
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const FAMILIES: { name: string; note: string; isNew: boolean; kinds: readonly Kind[] }[] = [
  { name: "Animals", note: "Seven new animals beside the cat, bird, fish and owl.", isNew: true, kinds: animals },
  { name: "Food", note: "Seen from above or on a plate, with toppings that vary.", isNew: true, kinds: food },
  { name: "Objects", note: "Still lifes on a table or shelf.", isNew: true, kinds: objects },
  {
    name: "Already in the package",
    note: "The first 18 kinds, so you can see the styles on them too.",
    isNew: false,
    kinds: builtIn,
  },
];
const ALL = FAMILIES.flatMap(f => f.kinds);
const byId = new Map(ALL.map(k => [k.id, k]));

const state = {
  seeds: Object.fromEntries(ALL.map((k, n) => [k.id, 7 + n * 101])) as Record<string, number>,
  style: {} as StyleOptions,
  selected: { id: animals[0].id, i: 0 },
};

const render = (kind: Kind, seed: number, style: StyleOptions = state.style) =>
  stylize(toSvg(kind, { width: W, height: H, seed }), style);
const uri = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
const shapes = (svg: string) => (svg.match(/<(rect|circle|ellipse|path|polygon|polyline|line)\b/g) ?? []).length;
const kb = (n: number) => (n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`);
const styleText = (o: StyleOptions) =>
  [
    o.palette
      ? `palette ${Object.entries(PALETTES).find(([, p]) => p === o.palette)?.[0]} (${o.mapping ?? "ramp"})`
      : o.mood
        ? `mood ${o.mood}`
        : "original",
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
const host = $("families");
for (const fam of FAMILIES) {
  const sec = document.createElement("section");
  sec.innerHTML = `<div class="section-head"><h2>${fam.name}${fam.isNew ? '<span class="tag">new</span>' : ""}</h2><p>${fam.note}</p></div><div class="sheet"></div>`;
  for (const kind of fam.kinds) {
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
  const svg = toSvg(kind, { width: W, height: H, seed: base });
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
  const svg = render(kind, seed);
  const u = uri(svg);
  $<HTMLImageElement>("big").src = u;
  $<HTMLImageElement>("big").alt = `${kind.name}, seed ${seed}`;
  $("big-name").textContent = kind.name;
  $("f-kind").textContent = `${(kind as { family: string }).family} / ${kind.id}`;
  $("f-seed").textContent = String(seed);
  $("f-style").textContent = styleText(state.style);
  $("f-shapes").textContent = String(shapes(svg));
  $("f-bytes").textContent = `${kb(u.length)} as a data URI`;
  const o = state.style;
  const extra = [
    o.palette ? `  palette: [${o.palette.map(c => `"${c}"`).join(", ")}],` : "",
    o.palette && o.mapping === "nearest" ? `  mapping: "nearest",` : "",
    !o.palette && o.mood ? `  mood: "${o.mood}",` : "",
    o.texture ? `  texture: "${o.texture}",` : "",
  ]
    .filter(Boolean)
    .join("\n");
  $("f-call").textContent = `placeholder({\n  kind: "${kind.id}",\n  seed: ${seed},${extra ? "\n" + extra : ""}\n})`;
}

// ---------- mood and palette matrices ----------
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
  matrix("moods", [{ label: "original", style: {} }, ...MOODS.map(m => ({ label: m, style: { mood: m } }))]);
  const palettes = Object.entries(PALETTES);
  matrix("palettes", [
    ...palettes.map(([name, palette]) => ({ label: name, style: { palette } })),
    ...palettes
      .slice(0, 3)
      .map(([name, palette]) => ({ label: `${name} · nearest`, style: { palette, mapping: "nearest" as const } })),
  ]);
}

// ---------- controls ----------
const moodSel = $<HTMLSelectElement>("mood");
const palSel = $<HTMLSelectElement>("palette");
const mapSel = $<HTMLSelectElement>("mapping");
const texSel = $<HTMLSelectElement>("texture");
moodSel.innerHTML =
  `<option value="">Original</option>` +
  MOODS.map(m => `<option value="${m}">${m[0].toUpperCase() + m.slice(1)}</option>`).join("");
palSel.innerHTML =
  `<option value="">None</option>` +
  Object.keys(PALETTES)
    .map(p => `<option value="${p}">${p[0].toUpperCase() + p.slice(1)}</option>`)
    .join("");

function readControls() {
  const palette = palSel.value ? PALETTES[palSel.value] : undefined;
  state.style = {
    mood: (moodSel.value || undefined) as Mood | undefined,
    palette,
    mapping: palette ? (mapSel.value as "ramp" | "nearest") : undefined,
    texture: (texSel.value || undefined) as Texture | undefined,
  };
  redrawAll();
}
function syncControls() {
  moodSel.value = state.style.mood ?? "";
  palSel.value = Object.entries(PALETTES).find(([, p]) => p === state.style.palette)?.[0] ?? "";
  mapSel.value = state.style.mapping ?? "ramp";
  texSel.value = state.style.texture ?? "";
}
function redrawAll() {
  ALL.forEach(drawKind);
  drawBench();
}
for (const el of [moodSel, palSel, mapSel, texSel]) el.addEventListener("change", readControls);

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
