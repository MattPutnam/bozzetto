/** Helpers shared by several objects kinds. */
import { el } from "../../draw/core";

/** A soft round glow: `color` fading out from the center. */
export const glow = (id: string, color: string, strength = 0.7): string =>
  el(
    "radialGradient",
    { id },
    el("stop", { offset: 0, "stop-color": color, "stop-opacity": String(strength) }),
    el("stop", { offset: 1, "stop-color": color, "stop-opacity": "0" }),
  );
