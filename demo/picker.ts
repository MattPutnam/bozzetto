import {
  MAPPINGS,
  PALETTES,
  SCHEMES,
  bauhaus,
  cat,
  cutouts,
  decodePalette,
  donut,
  encodePalette,
  fruitBowl,
  hills,
  makePalette,
  portrait,
  randomPalette,
  sea,
  toSvg,
  type Kind,
  type Mapping,
  type Scheme,
} from "../src";
import { hexToLch, lchToHex, parseColor, toHex } from "../src/color";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const SCHEME_NOTES: Record<Scheme, string> = {
  monochrome: "One hue in different lightness and strength. Quiet and unified.",
  analogous: "Neighboring hues. Calm and natural, like a landscape.",
  complementary: "Two opposite hues. Strong contrast and energy.",
  "split-complementary": "One hue plus the two beside its opposite. Contrast with less tension.",
  triadic: "Three hues evenly spaced. Lively and balanced.",
  tetradic: "Four hues evenly spaced. The most varied; works best with lower vibrance.",
};
const MAPPING_NOTES: Record<Mapping, string> = {
  balanced: "Balanced uses only your exact colors, choosing by lightness first and then by hue.",
  ramp: "Ramp keeps each picture's light and dark, blending between your colors for softer shading.",
  nearest: "Nearest snaps every color to its closest match. Bold, but areas can merge.",
};
const PREVIEW_KINDS: Kind[] = [hills, sea, portrait, cat, fruitBowl, donut, cutouts, bauhaus];

interface State {
  baseMode: "color" | "hue";
  baseColor: string;
  hue: number;
  scheme: Scheme;
  count: number;
  contrast: number;
  vibrance: number;
  seed: number;
  locked: (string | null)[];
  mapping: Mapping;
  pictureSeed: number;
}

const state: State = {
  baseMode: "color",
  baseColor: "#e76f51",
  hue: 200,
  scheme: "analogous",
  count: 5,
  contrast: 0.7,
  vibrance: 0.55,
  seed: 1,
  locked: [],
  mapping: "balanced",
  pictureSeed: 11,
};

const options = () => ({
  base: state.baseMode === "color" ? state.baseColor : state.hue,
  scheme: state.scheme,
  count: state.count,
  contrast: state.contrast,
  vibrance: state.vibrance,
  seed: state.seed,
  locked: state.locked,
});
let colors: string[] = [];

// ---------- controls ----------
function wheel(scheme: Scheme, baseHue: number): string {
  const dots = SCHEMES[scheme]
    .map(offset => {
      const a = ((baseHue + offset - 90) * Math.PI) / 180;
      return `<circle cx="${20 + Math.cos(a) * 13}" cy="${20 + Math.sin(a) * 13}" r="4.5" fill="${lchToHex([0.68, 0.14, baseHue + offset])}"/>`;
    })
    .join("");
  return `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="13" fill="none" stroke="currentColor" stroke-opacity="0.25" stroke-width="1.5"/>${dots}</svg>`;
}

const baseHue = () => (state.baseMode === "color" ? hexToLch(state.baseColor)[2] : state.hue);

function drawSchemes() {
  const box = $("schemes");
  box.replaceChildren(
    ...(Object.keys(SCHEMES) as Scheme[]).map(scheme => {
      const b = document.createElement("button");
      b.setAttribute("aria-pressed", String(scheme === state.scheme));
      b.innerHTML = `${wheel(scheme, baseHue())}<span>${scheme.replace("-", " ")}</span>`;
      b.onclick = () => {
        state.scheme = scheme;
        update();
      };
      return b;
    }),
  );
  $("scheme-hint").textContent = SCHEME_NOTES[state.scheme];
}

function syncControls() {
  for (const b of $("base-mode").querySelectorAll("button"))
    b.setAttribute("aria-pressed", String(b.dataset.mode === state.baseMode));
  $("base-color-row").hidden = state.baseMode !== "color";
  $("hue-row").hidden = state.baseMode !== "hue";
  $<HTMLInputElement>("base-color").value = state.baseColor;
  if (document.activeElement !== $("base-hex")) $<HTMLInputElement>("base-hex").value = state.baseColor;
  $<HTMLInputElement>("hue").value = String(Math.round(state.hue));
  $("hue-out").textContent = `${Math.round(state.hue)}°`;
  $<HTMLInputElement>("count").value = String(state.count);
  $("count-out").textContent = String(state.count);
  $<HTMLInputElement>("contrast").value = String(Math.round(state.contrast * 100));
  $("contrast-out").textContent = `${Math.round(state.contrast * 100)}%`;
  $<HTMLInputElement>("vibrance").value = String(Math.round(state.vibrance * 100));
  $("vibrance-out").textContent = `${Math.round(state.vibrance * 100)}%`;
  for (const b of $("mapping").querySelectorAll("button"))
    b.setAttribute("aria-pressed", String(b.dataset.mapping === state.mapping));
  $("mapping-hint").textContent = MAPPING_NOTES[state.mapping];
}

// ---------- swatches ----------
const textOn = (hex: string) => (hexToLch(hex)[0] > 0.6 ? "#1b211e" : "#ffffff");

function drawSwatches() {
  $("swatches").replaceChildren(
    ...colors.map((color, k) => {
      const cell = document.createElement("div");
      cell.className = "swatch";
      cell.style.background = color;
      cell.style.color = textOn(color);
      const lock = document.createElement("button");
      lock.className = "lock";
      const isLocked = state.locked[k] !== null && state.locked[k] !== undefined;
      lock.setAttribute("aria-pressed", String(isLocked));
      lock.textContent = isLocked ? "Locked" : "Lock";
      lock.setAttribute("aria-label", `${isLocked ? "Unlock" : "Lock"} color ${k + 1}`);
      lock.onclick = () => {
        state.locked[k] = isLocked ? null : color;
        update();
      };
      const input = document.createElement("input");
      input.type = "text";
      input.value = color;
      input.spellcheck = false;
      input.setAttribute("aria-label", `Color ${k + 1}`);
      input.onchange = () => {
        const rgb = parseColor(input.value);
        if (!rgb) {
          input.value = color;
          return;
        }
        state.locked[k] = toHex(rgb);
        update();
      };
      cell.append(lock, input);
      return cell;
    }),
  );
}

// ---------- previews and code ----------
function drawPreviews() {
  $("previews").replaceChildren(
    ...PREVIEW_KINDS.map((kind, k) => {
      const svg = toSvg(kind, {
        size: "320x240",
        seed: state.pictureSeed + k,
        palette: colors,
        mapping: state.mapping,
      });
      const img = new Image();
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
      img.alt = `${kind.name} in this palette`;
      return img;
    }),
  );
}

function drawCode() {
  const list = colors.map(c => `"${c}"`).join(", ");
  const mapping = state.mapping === "balanced" ? "" : `\n  mapping: "${state.mapping}",`;
  const locked = state.locked.slice(0, state.count);
  const lockedText = locked.some(c => c) ? `\n  locked: [${locked.map(c => (c ? `"${c}"` : "null")).join(", ")}],` : "";
  const base = state.baseMode === "color" ? `"${state.baseColor}"` : String(Math.round(state.hue));
  $("snippet").textContent =
    `placeholder({\n  kind: "hills",\n  palette: [${list}],${mapping}\n});\n\n` +
    `// Or regenerate it:\nmakePalette({\n  base: ${base},\n  scheme: "${state.scheme}",\n  count: ${state.count},\n` +
    `  contrast: ${state.contrast.toFixed(2)},\n  vibrance: ${state.vibrance.toFixed(2)},\n  seed: ${state.seed},${lockedText}\n});`;
  const code = encodePalette(colors);
  $("code-line").textContent =
    `Palette code: ${code}. It works anywhere a palette is accepted, and this page's link keeps it.`;
  try {
    history.replaceState(null, "", `#${code}`);
  } catch {
    // Some viewers don't allow changing the address; the code above still works.
  }
}

function update() {
  state.locked.length = state.count;
  colors = makePalette(options());
  syncControls();
  drawSchemes();
  drawSwatches();
  drawPreviews();
  drawCode();
}

// ---------- wiring ----------
$("base-mode")
  .querySelectorAll("button")
  .forEach(b =>
    b.addEventListener("click", () => {
      state.baseMode = b.dataset.mode as State["baseMode"];
      update();
    }),
  );
$<HTMLInputElement>("base-color").addEventListener("input", e => {
  state.baseColor = (e.target as HTMLInputElement).value;
  update();
});
$<HTMLInputElement>("base-hex").addEventListener("change", e => {
  const rgb = parseColor((e.target as HTMLInputElement).value);
  if (rgb) state.baseColor = toHex(rgb);
  update();
});
const slider = (id: string, apply: (v: number) => void) =>
  $<HTMLInputElement>(id).addEventListener("input", e => {
    apply(Number((e.target as HTMLInputElement).value));
    update();
  });
slider("hue", v => (state.hue = v));
slider("count", v => (state.count = v));
slider("contrast", v => (state.contrast = v / 100));
slider("vibrance", v => (state.vibrance = v / 100));

$("mapping").replaceChildren(
  ...MAPPINGS.map(m => {
    const b = document.createElement("button");
    b.dataset.mapping = m;
    b.textContent = m[0].toUpperCase() + m.slice(1);
    b.onclick = () => {
      state.mapping = m;
      update();
    };
    return b;
  }),
);
$("vary").onclick = () => {
  state.seed += 1;
  update();
};
$("surprise").onclick = () => {
  // Read the settings a random palette would use, so the controls show where it came from.
  const seed = Math.floor(Math.random() * 1e6);
  const sample = randomPalette(seed, { count: state.count });
  state.baseMode = "color";
  state.baseColor = sample[Math.floor(sample.length / 2)];
  state.scheme = (Object.keys(SCHEMES) as Scheme[])[seed % 6];
  state.contrast = 0.55 + (seed % 41) / 100;
  state.vibrance = 0.3 + (seed % 56) / 100;
  state.seed = seed % 1000;
  state.locked = [];
  update();
};
$("new-pictures").onclick = () => {
  state.pictureSeed = Math.floor(Math.random() * 99999);
  drawPreviews();
};
$("copy").onclick = async () => {
  const text = $("snippet").textContent ?? "";
  try {
    await navigator.clipboard.writeText(text);
    $("copy").textContent = "Copied";
  } catch {
    const range = document.createRange();
    range.selectNodeContents($("snippet"));
    getSelection()?.removeAllRanges();
    getSelection()?.addRange(range);
    $("copy").textContent = "Selected; press Ctrl+C";
  }
  setTimeout(() => ($("copy").textContent = "Copy"), 1800);
};

$("presets").replaceChildren(
  ...Object.entries(PALETTES).map(([name, preset]) => {
    const b = document.createElement("button");
    b.className = "preset";
    b.innerHTML = `<span class="chips">${preset.map(c => `<i style="background:${c}"></i>`).join("")}</span>${name}`;
    b.onclick = () => {
      state.count = preset.length;
      state.locked = [...preset];
      update();
    };
    return b;
  }),
);

// A palette code in the link loads that palette, locked.
const fromLink = decodePalette(location.hash.slice(1));
if (fromLink && fromLink.length <= 9) {
  state.count = fromLink.length;
  state.locked = fromLink;
}
update();
