/**
 * `bozzetto/element`: the `<bozzetto-img>` web component, for any framework or none.
 * Importing this module registers the element.
 *
 * ```html
 * <script type="module">import "bozzetto/element";</script>
 * <bozzetto-img kind="owl" seed="3" size="320x240" palette="pastel"></bozzetto-img>
 * ```
 *
 * Attributes:
 * - `kind`: kind ids, export names or categories, separated by spaces, with options after a colon,
 *   such as "cat:tabby,pupils=round" or "animals donut". Default: any kind.
 * - `seed`, `size` ("WxH"), `palette` (a name or palette code), `mapping`, `texture`, `label`.
 * - `alt`: replaces the picture's own alt text.
 * - `inline`: draw the SVG markup instead of an image.
 * - `dark`: build in a dark-mode version: empty (or "true") for the `dim` adjustment, or a palette
 *   name or code; "false" turns it off.
 * - `avatar`: draw an avatar, a face framed around its head (any face kind unless `kind` says),
 *   with `shape` ("circle", "rounded" or "square") and `size` as one number, such as "48".
 *
 * The element is an inline block the picture's size until you size it with CSS; the picture then
 * fills it, cropped around its focus. The image is exposed as `::part(image)` for styling.
 *
 * @module bozzetto/element
 */
import { avatar, placeholder, type AvatarShape, type Mapping, type Picture, type Size, type Texture } from "../index";
import { seedFromText } from "../draw/core";
import { focusStyle } from "./shared";
import { parseKinds } from "../render/names";

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
  "dark",
] as const;

/** The `dark` attribute: on when present (or "true"), off for "false", otherwise a palette. */
const darkOf = (value: string | undefined): boolean | string | undefined =>
  value === undefined || value === "false" ? undefined : value === "" || value === "true" ? true : value;

// Lets the module load where there's no DOM (server rendering), though the element only works in a browser.
const Base = (typeof HTMLElement === "undefined" ? class {} : HTMLElement) as typeof HTMLElement;

/**
 * The `<bozzetto-img>` element, registered when this module is imported. It draws a placeholder,
 * or an avatar, from its attributes (see this module's overview), and redraws when one changes.
 * Unlike the React and Vue components it has no `darkSelector` or avatar `margin`.
 */
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
        seed: seed === undefined ? undefined : seedFromText(seed),
        palette: attr("palette"),
        mapping: attr("mapping") as Mapping | undefined,
        texture: attr("texture") as Texture | undefined,
        dark: darkOf(attr("dark")),
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
      this.#picture = undefined;
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
