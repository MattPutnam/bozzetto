/**
 * `bozzetto/element`: the `<bozzetto-img>` web component, for any framework or none.
 * Importing this module registers the element.
 *
 *     <script type="module">import "bozzetto/element";</script>
 *     <bozzetto-img kind="owl" seed="3" size="320x240" palette="pastel"></bozzetto-img>
 *
 * Attributes:
 * - `kind`: kind ids, export names or categories, separated by spaces, with options after a colon,
 *   such as "cat:tabby,pupils=round" or "animals donut". Default: any kind.
 * - `seed`, `size` ("WxH"), `palette` (a name or palette code), `mapping`, `texture`, `label`.
 * - `alt`: replaces the picture's own alt text.
 * - `inline`: draw the SVG markup instead of an image.
 * - `avatar`: draw an avatar, a face framed around its head (any face kind unless `kind` says),
 *   with `shape` ("circle", "rounded" or "square") and `size` as one number, such as "48".
 *
 * The element is an inline block the picture's size until you size it with CSS; the picture then
 * fills it, cropped around its focus. The image is exposed as `::part(image)` for styling.
 */
import { avatar, placeholder, type AvatarShape, type Mapping, type Picture, type Size, type Texture } from "./index";
import { focusStyle } from "./frameworks";
import { parseKinds } from "./names";

const ATTRIBUTES = [
  "kind",
  "seed",
  "size",
  "palette",
  "mapping",
  "texture",
  "label",
  "alt",
  "inline",
  "avatar",
  "shape",
] as const;

// Lets the module load where there's no DOM (server rendering), though the element only works in a browser.
const Base = (typeof HTMLElement === "undefined" ? class {} : HTMLElement) as typeof HTMLElement;

export class BozzettoImg extends Base {
  static observedAttributes = ATTRIBUTES;
  #picture: Picture | undefined;

  /** The picture drawn last, with its alt text, size, focus and color; undefined before it's drawn. */
  get picture(): Picture | undefined {
    return this.#picture;
  }

  connectedCallback(): void {
    this.#draw();
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.#draw();
  }

  #draw(): void {
    const root = this.shadowRoot ?? this.attachShadow({ mode: "open" });
    const attr = (name: (typeof ATTRIBUTES)[number]) => this.getAttribute(name) ?? undefined;
    const seed = attr("seed");
    try {
      const common = {
        kind: attr("kind") ? parseKinds(attr("kind")!) : undefined,
        seed: seed === undefined ? undefined : /^\d+$/.test(seed) ? Number(seed) : seed,
        palette: attr("palette"),
        mapping: attr("mapping") as Mapping | undefined,
        texture: attr("texture") as Texture | undefined,
      };
      this.#picture = this.hasAttribute("avatar")
        ? avatar({
            ...common,
            // An avatar is square: "48" or "48x48" both mean 48.
            size: attr("size") === undefined ? undefined : Number.parseFloat(attr("size")!),
            shape: attr("shape") as AvatarShape | undefined,
          })
        : placeholder({ ...common, size: attr("size") as Size | undefined, label: attr("label") });
    } catch (error) {
      root.textContent = "";
      console.error(`<bozzetto-img>: ${error instanceof Error ? error.message.replace(/^bozzetto: /, "") : error}`);
      return;
    }
    const p = this.#picture;
    const alt = attr("alt") ?? p.alt;
    const shape = this.hasAttribute("avatar") ? ((attr("shape") as AvatarShape | undefined) ?? "circle") : undefined;
    const { objectPosition, backgroundColor, borderRadius = "0" } = focusStyle(p, shape);
    const style = document.createElement("style");
    style.textContent =
      `:host { display: inline-block; width: ${p.width}px; aspect-ratio: ${p.width} / ${p.height}; line-height: 0; }` +
      `[part="image"] { display: block; width: 100%; height: 100%; object-fit: cover; object-position: ${objectPosition}; background: ${backgroundColor}; border-radius: ${borderRadius}; }` +
      `[part="image"] > svg { width: 100%; height: 100%; }`;
    let image: HTMLElement;
    if (this.hasAttribute("inline")) {
      image = document.createElement("span");
      image.setAttribute("role", "img");
      image.setAttribute("aria-label", alt);
      image.innerHTML = p.svg;
    } else {
      const img = document.createElement("img");
      img.src = p.src;
      img.alt = alt;
      img.width = p.width;
      img.height = p.height;
      image = img;
    }
    image.setAttribute("part", "image");
    root.replaceChildren(style, image);
  }
}

if (typeof customElements !== "undefined" && !customElements.get("bozzetto-img")) {
  customElements.define("bozzetto-img", BozzettoImg);
}

declare global {
  interface HTMLElementTagNameMap {
    "bozzetto-img": BozzettoImg;
  }
}
