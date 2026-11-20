import { families, kinds, toDataUri, toSvg } from "../src";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const host = $("families");
let base = 1;

const shapes = (svg: string) => (svg.match(/<(rect|circle|ellipse|path|polygon|polyline|line)\b/g) ?? []).length;
const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`;

function draw() {
  const width = Number($<HTMLInputElement>("width").value) || 400;
  const height = Number($<HTMLInputElement>("height").value) || 300;
  const numbered = $<HTMLInputElement>("numbered").checked;
  host.replaceChildren();
  for (const family of families) {
    const section = document.createElement("section");
    section.innerHTML = `<h2>${family}</h2><div class="sheet"></div>`;
    for (const kind of kinds.filter(k => k.family === family)) {
      const card = document.createElement("div");
      card.className = "card";
      const seeds = [0, 1, 2, 3].map(k => base + k);
      const uris = seeds.map((seed, k) =>
        toDataUri(kind, { width, height, seed, label: numbered ? k + 1 : undefined }),
      );
      const svg = toSvg(kind, { width, height, seed: seeds[0] });
      card.innerHTML = `<h3>${kind.name}</h3><div class="meta"><span>${kind.id}</span><span>${shapes(svg)} shapes · ${kb(uris[0].length)}</span></div><div class="thumbs"></div>`;
      const thumbs = card.querySelector(".thumbs")!;
      uris.forEach((src, k) => {
        const img = new Image();
        img.src = src;
        img.alt = `${kind.name}, seed ${seeds[k]}`;
        img.title = `seed ${seeds[k]}`;
        thumbs.append(img);
      });
      section.querySelector(".sheet")!.append(card);
    }
    host.append(section);
  }
}

$("shuffle").onclick = () => {
  base = Math.floor(Math.random() * 99999) + 1;
  draw();
};
for (const id of ["width", "height", "numbered"]) $(id).addEventListener("change", draw);
draw();
